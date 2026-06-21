/**
 * Headless engine session implementation (P5 US-013–018).
 */

import { GameEngineIntegration } from '../../core/GameEngineIntegration';
import { generateChoiceFeedback } from '../../core/ChoiceFeedbackGenerator';
import { deriveLifeMemorySummary } from '../../core/deriveLifeMemorySummary';
import { resolveChoiceEffects } from '../../core/ChoiceOutcomeResolver';
import type { ChoiceExecutionRequest, ChoiceExecutionResponse } from '../../contracts/choiceExecution';
import {
  CHOICE_EXECUTION_REQUEST_VERSION,
  CHOICE_EXECUTION_RESPONSE_VERSION,
} from '../../contracts/choiceExecution';
import type { GameStateSnapshot } from '../../contracts/gameStateSnapshot';
import type { EventChoice, EventCondition, EventDefinition, GameState } from '../../types/eventTypes';
import { CatalogReadError } from '../catalog/EventCatalogReadService';
import { withRandomSource, withRandomSourceSync, SeededRandomSource } from '../adapters/randomSource';
import {
  resolveHeadlessDependencies,
  type HeadlessSessionDependencies,
} from '../dependencies/HeadlessSessionDependencies';
import { defaultSnapshotConverter } from '../snapshot/SnapshotConverter';
import { createDefaultInMemoryCatalogAdapter } from '../catalog/InMemoryEventCatalogAdapter';
import type { HeadlessEngineSession, HeadlessSessionCreateOptions } from './HeadlessEngineSession';
import { markDisturbanceNarrativeShown } from '../../core/activePlanning/disturbanceNarrativeBuilder';
import { applyStatDeltas } from '../../core/activePlanning/ActivePlanningService';
import { clampPassiveStatDeltasForAge } from '../../core/activePlanning/ageActionStatCaps';
import { buildPeriodSummary } from '../../core/activePlanning/periodSummaryBuilder';
import { selectPassiveNarrative, shouldRecordPassiveNarrativeInHistory } from '../../data/infantPassiveNarratives';
import {
  resolvePreschoolPassiveEntryByTitle,
  appendPassiveTitleToHistory,
} from '../../data/preschoolPassiveSpine';
import { applyPassiveNarrativeFlags } from '../../data/originInfantPassiveChain';
import { shouldOfferDailyPlanning, shouldPreferStoryGapPassiveBeforePlanning, EARLY_CHILDHOOD_MAX_AGE } from '../../p16/childhoodAgency';
import { progressUntilChoiceOrTerminal } from '../progressionLoop';
import type { PlanningOptionDto } from '../../contracts/sessionProgression';
import type { SessionPhase } from '../../contracts/sessionProgression';
import { getActionById } from '../../data/activeActionCatalog';
import type {
  HeadlessProgressionVolatileState,
  HeadlessSessionError,
  HeadlessSessionVolatileState,
  HeadlessTerminalState,
  NextEventResult,
  PlayerSafeEventPayload,
  ProgressionAckKind,
  ProgressAutomaticResult,
} from './sessionTypes';
import { HeadlessProgressionError as ProgressionError } from './sessionTypes';
import type { RouteTrack } from '../parity/routeTrackFixtures';
import {
  prepareEngineForSimulatorReplay,
  replaySimulatorRecords,
  type SimulatorReplayResult,
} from '../parity/simulatorRecordReplay';
import type { GameProcessRecord } from '../../types/simulationRecordTypes';

const DEFAULT_CATALOG_VERSION = '1.0.0';
const DEFAULT_AUTO_LIMIT = 32;

function toPlayerSafeEvent(
  event: EventDefinition,
  availableChoiceIds: Set<string>,
): PlayerSafeEventPayload {
  return {
    eventId: event.id,
    title: event.content?.title ?? event.id,
    text: event.content?.text ?? '',
    eventType: event.eventType ?? 'choice',
    autoEffects: Boolean(event.autoEffects?.length),
    choices: event.choices?.map(choice => ({
      id: choice.id,
      text: choice.text ?? choice.id,
      available: availableChoiceIds.has(choice.id),
    })),
  };
}

export class HeadlessEngineSessionImpl implements HeadlessEngineSession {
  readonly sessionId: string;
  readonly dependencies: HeadlessSessionDependencies;

  private engine: GameEngineIntegration;
  private catalogVersion: string;
  private volatile: HeadlessSessionVolatileState = {
    currentEvent: null,
    lastFeedback: null,
    lastOutcomeText: null,
    pendingActionSummary: null,
    pendingDisturbanceNarrative: null,
    pendingPeriodSummary: null,
    passiveNarrative: null,
    storyGapPassiveServed: false,
  };
  private lastError: HeadlessSessionError | null = null;
  private randomSeed?: number;

  private constructor(
    sessionId: string,
    dependencies: HeadlessSessionDependencies,
    engine: GameEngineIntegration,
    catalogVersion: string,
    randomSeed?: number,
  ) {
    this.sessionId = sessionId;
    this.dependencies = dependencies;
    this.engine = engine;
    this.catalogVersion = catalogVersion;
    this.randomSeed = randomSeed;
  }

  static create(
    options: HeadlessSessionCreateOptions | { snapshot: GameStateSnapshot },
    partialDeps?: Partial<HeadlessSessionDependencies>,
  ): HeadlessEngineSessionImpl {
    const catalog = partialDeps?.catalog ?? createDefaultInMemoryCatalogAdapter();
    const snapshot = partialDeps?.snapshot ?? defaultSnapshotConverter;
    const deps = resolveHeadlessDependencies({ ...partialDeps, catalog, snapshot });
    const engine = new GameEngineIntegration();
    const sessionId = `headless-${deps.time.now()}-${Math.floor(deps.random.next() * 1e6)}`;

    if ('snapshot' in options) {
      const catalogVersion = options.snapshot.metadata.eventCatalogVersion;
      const impl = new HeadlessEngineSessionImpl(sessionId, deps, engine, catalogVersion);
      impl.hydrateSync(options.snapshot);
      return impl;
    }

    const catalogVersion = options.catalogVersion ?? DEFAULT_CATALOG_VERSION;
    const impl = new HeadlessEngineSessionImpl(
      sessionId,
      deps,
      engine,
      catalogVersion,
      options.randomSeed,
    );
    impl.runWithRandomSync(() => {
      engine.startNewGame(options.playerName, options.gender);
    });
    return impl;
  }

  /** Session for parity replay — does not consume RNG before `replaySimulatorRecords`. */
  static createForReplay(
    options: Pick<HeadlessSessionCreateOptions, 'randomSeed' | 'catalogVersion'>,
    partialDeps?: Partial<HeadlessSessionDependencies>,
  ): HeadlessEngineSessionImpl {
    const catalog = partialDeps?.catalog ?? createDefaultInMemoryCatalogAdapter();
    const snapshot = partialDeps?.snapshot ?? defaultSnapshotConverter;
    const deps = resolveHeadlessDependencies({ ...partialDeps, catalog, snapshot });
    const engine = new GameEngineIntegration();
    const sessionId = `headless-replay-${deps.time.now()}`;
    const catalogVersion = options.catalogVersion ?? DEFAULT_CATALOG_VERSION;
    return new HeadlessEngineSessionImpl(
      sessionId,
      deps,
      engine,
      catalogVersion,
      options.randomSeed,
    );
  }

  private randomSourceForSession() {
    return this.randomSeed !== undefined
      ? new SeededRandomSource(this.randomSeed)
      : this.dependencies.random;
  }

  private runWithRandomSync<T>(fn: () => T): T {
    return withRandomSourceSync(this.randomSourceForSession(), fn);
  }

  private async runWithRandomAsync<T>(fn: () => Promise<T>): Promise<T> {
    return withRandomSource(this.randomSourceForSession(), fn);
  }

  private hydrateSync(snapshot: GameStateSnapshot): void {
    this.lastError = null;
    const version = snapshot.metadata.eventCatalogVersion;
    this.dependencies.catalog.getMetadata(version);
    this.catalogVersion = version;
    const state = this.dependencies.snapshot.fromSnapshot(snapshot);
    this.runWithRandomSync(() => {
      this.engine.loadGameState(state);
    });
    this.volatile.currentEvent = null;
    this.volatile.lastFeedback = null;
    this.volatile.lastOutcomeText = null;
    this.volatile.pendingActionSummary = null;
    this.volatile.pendingDisturbanceNarrative = null;
    this.volatile.pendingPeriodSummary = null;
    this.volatile.passiveNarrative = null;
  }

  getLastError(): HeadlessSessionError | null {
    return this.lastError;
  }

  getCurrentEvent(): EventDefinition | null {
    return this.volatile.currentEvent;
  }

  describePendingEvent(): NextEventResult | null {
    const event = this.volatile.currentEvent;
    if (!event) return null;
    const available = this.getAvailableChoices(event);
    const availableIds = new Set(available.map(c => c.id));
    const requiresChoice = Boolean(event.choices?.length) && available.length > 0;
    return {
      eventId: event.id,
      event: toPlayerSafeEvent(event, availableIds),
      requiresChoice,
      isAutomatic: !requiresChoice,
      raw: event,
    };
  }

  async hydrate(snapshot: GameStateSnapshot): Promise<void> {
    try {
      this.hydrateSync(snapshot);
    } catch (error) {
      this.lastError = this.toSessionError(error);
      throw error;
    }
  }

  async getNextEvent(): Promise<NextEventResult | null> {
    this.lastError = null;
    if (this.getTerminalState()) {
      this.lastError = { code: 'TERMINAL_STATE', message: 'Session is in terminal state' };
      return null;
    }
    return this.runWithRandomAsync(async () => {
      const event = this.engine.selectEvent();
      if (!event) {
        this.volatile.currentEvent = null;
        return null;
      }
      this.volatile.storyGapPassiveServed = false;
      this.volatile.currentEvent = event;
      const available = this.getAvailableChoices(event);
      const availableIds = new Set(available.map(c => c.id));
      const requiresChoice = Boolean(event.choices?.length) && available.length > 0;
      const isAutomatic = !requiresChoice;
      return {
        eventId: event.id,
        event: toPlayerSafeEvent(event, availableIds),
        requiresChoice,
        isAutomatic,
        raw: event,
      };
    });
  }

  async progressAutomatic(options?: { maxSteps?: number }): Promise<ProgressAutomaticResult> {
    const maxSteps = options?.maxSteps ?? DEFAULT_AUTO_LIMIT;
    let stepsExecuted = 0;

    while (stepsExecuted < maxSteps) {
      if (this.getTerminalState()) {
        return {
          stepsExecuted,
          stoppedReason: 'terminal',
          lastEventId: this.volatile.currentEvent?.id,
        };
      }

      let current = this.volatile.currentEvent;
      if (!current) {
        const next = await this.getNextEvent();
        if (!next) {
          return { stepsExecuted, stoppedReason: 'no_event' };
        }
        current = next.raw;
      }

      if (nextRequiresChoice(current)) {
        return {
          stepsExecuted,
          stoppedReason: 'choice_required',
          lastEventId: current.id,
        };
      }

      await this.runWithRandomAsync(async () => {
        await this.engine.executeAutoEvent(current!);
      });
      stepsExecuted += 1;
      this.volatile.currentEvent = null;
    }

    const error: HeadlessSessionError = {
      code: 'AUTOMATIC_PROGRESSION_LIMIT',
      message: `Automatic progression exceeded safety limit (${maxSteps})`,
    };
    this.lastError = error;
    return { stepsExecuted, stoppedReason: 'safety_limit', error };
  }

  async executeChoice(request: ChoiceExecutionRequest): Promise<ChoiceExecutionResponse> {
    this.lastError = null;
    if (request.requestVersion !== CHOICE_EXECUTION_REQUEST_VERSION) {
      throw new Error(`Unsupported request version: ${request.requestVersion}`);
    }

    const snapshot =
      request.snapshotRef.snapshot ??
      (() => {
        throw new Error('Headless executeChoice requires inline snapshot');
      })();

    if (snapshot.metadata.eventCatalogVersion !== this.catalogVersion) {
      const err: HeadlessSessionError = {
        code: 'CATALOG_VERSION_MISMATCH',
        message: 'Snapshot catalog version does not match session',
        details: {
          session: this.catalogVersion,
          snapshot: snapshot.metadata.eventCatalogVersion,
        },
      };
      this.lastError = err;
      throw new Error(err.message);
    }

    await this.hydrate(snapshot);

    let event = this.volatile.currentEvent;
    if (!event || event.id !== request.action.eventId) {
      try {
        event = this.dependencies.catalog.getEventById(
          request.action.eventId,
          this.catalogVersion,
        );
        this.volatile.currentEvent = event;
      } catch {
        // fall through to stale handling
      }
    }
    if (!event || event.id !== request.action.eventId) {
      const stale: HeadlessSessionError = {
        code: 'STALE_EVENT',
        message: 'No matching current event for choice execution',
        details: { expected: request.action.eventId, current: event?.id },
      };
      this.lastError = stale;
      throw new Error(stale.message);
    }

    const choice = event.choices?.find(c => c.id === request.action.choiceId);
    if (!choice) {
      const err: HeadlessSessionError = {
        code: 'STALE_CHOICE',
        message: 'Choice id not found on current event',
      };
      this.lastError = err;
      throw new Error(err.message);
    }

    if (
      choice.condition &&
      !this.engine.isChoiceAvailable(choice.condition as EventCondition | undefined)
    ) {
      const err: HeadlessSessionError = {
        code: 'CHOICE_NOT_AVAILABLE',
        message: 'Choice is not available for current state',
      };
      this.lastError = err;
      throw new Error(err.message);
    }

    const state = this.engine.getGameState();
    const resolved = resolveChoiceEffects(
      state,
      event,
      choice,
      condition => this.engine.isChoiceAvailable(condition as EventCondition | undefined),
    );
    const effects = resolved?.effects ?? choice.effects ?? [];

    await this.runWithRandomAsync(async () => {
      await this.engine.executeChoiceEffects(effects, event.id, choice.id);
    });

    const feedback = generateChoiceFeedback({
      sourceEventId: event.id,
      sourceChoiceId: choice.id,
      sourceOutcomeId: resolved?.outcomeId,
      narrativeResult: resolved?.outcomeText ?? null,
      effects,
    });
    this.volatile.lastFeedback = feedback;
    this.volatile.lastOutcomeText = resolved?.outcomeText ?? null;
    this.volatile.currentEvent = null;
    const choiceBody =
      resolved?.outcomeText ??
      choice.description ??
      choice.text ??
      event.content?.text ??
      '';
    this.volatile.pendingPeriodSummary = buildPeriodSummary({
      sourceLabel: '剧情抉择',
      headline: event.content?.title ?? '这一回',
      body: choiceBody,
    });

    const nextSnapshot = this.serialize();
    const response: ChoiceExecutionResponse = {
      responseVersion: CHOICE_EXECUTION_RESPONSE_VERSION,
      status: 'success',
      nextSnapshot,
      feedback,
      append: {
        eventHistory: nextSnapshot.state.eventHistory.slice(-1),
        generatedLogs: [],
      },
      deltas: {},
      hints: {},
      diagnostics: {
        engineVersion: 'p5-headless',
        eventCatalogVersion: this.catalogVersion,
      },
    };
    return response;
  }

  serialize(): GameStateSnapshot {
    return this.dependencies.snapshot.toSnapshot(this.engine.getGameState(), {
      eventCatalogVersion: this.catalogVersion,
      sourcePlatform: 'node-headless',
      time: this.dependencies.time,
    });
  }

  async restart(options: HeadlessSessionCreateOptions): Promise<void> {
    this.catalogVersion = options.catalogVersion ?? DEFAULT_CATALOG_VERSION;
    this.randomSeed = options.randomSeed;
    this.volatile = {
      currentEvent: null,
      lastFeedback: null,
      lastOutcomeText: null,
      pendingActionSummary: null,
      pendingDisturbanceNarrative: null,
      pendingPeriodSummary: null,
      passiveNarrative: null,
      storyGapPassiveServed: false,
    };
    this.lastError = null;
    this.engine = new GameEngineIntegration();
    await this.runWithRandomAsync(async () => {
      this.engine.startNewGame(options.playerName, options.gender);
    });
  }

  getTerminalState(): HeadlessTerminalState | null {
    const player = this.engine.getGameState().player;
    if (!player) return null;
    if (player.alive === false) {
      return {
        isTerminal: true,
        isAlive: false,
        deathReason: player.deathReason,
        age: player.age,
      };
    }
    const ending = this.engine.getGameState().ending;
    if (ending) {
      return {
        isTerminal: true,
        isAlive: true,
        endingId: String(ending),
        age: player.age,
      };
    }
    return null;
  }

  getLifeMemory() {
    return deriveLifeMemorySummary(this.engine.getGameState());
  }

  ensurePassivePresentation(): void {
    const age = this.engine.getGameState().player?.age ?? 0;
    const allowLiteBand =
      age <= EARLY_CHILDHOOD_MAX_AGE &&
      shouldOfferDailyPlanning(age) &&
      shouldPreferStoryGapPassiveBeforePlanning(age, this.volatile.storyGapPassiveServed);
    if (shouldOfferDailyPlanning(age) && !allowLiteBand) {
      return;
    }
    if (!this.volatile.passiveNarrative) {
      this.runWithRandomSync(() => {
        const entry = selectPassiveNarrative(this.engine.getGameState());
        this.volatile.passiveNarrative = { title: entry.title, text: entry.text };
      });
    }
  }

  private async executePassiveChildhoodTick(): Promise<void> {
    const state = this.engine.getGameState();
    const age = state.player?.age ?? 0;
    const displayedTitle = this.volatile.passiveNarrative?.title;
    const { selected, deltas } = await this.runWithRandomAsync(async () => {
      const entry = selectPassiveNarrative(state);
      const historyEntry =
        displayedTitle && displayedTitle !== entry.title
          ? (resolvePreschoolPassiveEntryByTitle(displayedTitle, age) ?? entry)
          : entry;
      const appliedDeltas = clampPassiveStatDeltasForAge(age, historyEntry.statDeltas);
      applyStatDeltas(state.player, appliedDeltas);
      applyPassiveNarrativeFlags(state, historyEntry.flags);
      this.engine.advanceTime(3, 'month');
      if (!state.eventHistory) {
        state.eventHistory = [];
      }
      if (shouldRecordPassiveNarrativeInHistory(historyEntry.id)) {
        state.eventHistory.push({
          eventId: historyEntry.id,
          age: state.player.age,
          timestamp: state.currentTime ? { ...state.currentTime } : undefined,
        });
      }
      appendPassiveTitleToHistory(state, displayedTitle ?? historyEntry.title);
      return { selected: historyEntry, deltas: appliedDeltas };
    });
    this.volatile.pendingPeriodSummary = buildPeriodSummary({
      sourceLabel: '童年岁月',
      headline: selected.title,
      body: selected.text,
      deltas,
      deltaCause: selected.title,
    });
    this.volatile.passiveNarrative = null;
    this.volatile.storyGapPassiveServed = true;
  }

  getSessionPhase(): SessionPhase {
    if (this.getTerminalState()) return 'terminal';
    if (this.volatile.pendingPeriodSummary) return 'period_summary';
    if (this.volatile.pendingActionSummary) return 'action_summary';
    if (this.volatile.pendingDisturbanceNarrative) return 'disturbance_narrative';
    if (this.volatile.currentEvent) return 'story_event';
    const player = this.engine.getGameState().player;
    if (player?.alive === false) return 'terminal';
    const age = player?.age ?? 0;
    if (
      shouldPreferStoryGapPassiveBeforePlanning(age, this.volatile.storyGapPassiveServed)
    ) {
      this.ensurePassivePresentation();
      return 'passive_progression';
    }
    if (!shouldOfferDailyPlanning(age)) {
      return 'passive_progression';
    }
    return 'active_planning';
  }

  getProgressionVolatileState(): HeadlessProgressionVolatileState {
    const current = this.volatile.currentEvent;
    const pending = current ? this.describePendingEvent() : null;
    let pendingStoryEventId: string | null = null;
    let pendingEphemeralStoryEvent: EventDefinition | null = null;
    if (pending?.isAutomatic && current) {
      try {
        this.dependencies.catalog.getEventById(current.id, this.catalogVersion);
        pendingStoryEventId = current.id;
      } catch {
        pendingEphemeralStoryEvent = current;
      }
    }
    return {
      pendingActionSummary: this.volatile.pendingActionSummary,
      pendingDisturbanceNarrative: this.volatile.pendingDisturbanceNarrative,
      pendingPeriodSummary: this.volatile.pendingPeriodSummary,
      passiveNarrative: this.volatile.passiveNarrative,
      pendingStoryEventId,
      pendingEphemeralStoryEvent,
    };
  }

  applyProgressionVolatileState(state: HeadlessProgressionVolatileState): void {
    this.volatile.pendingActionSummary = state.pendingActionSummary;
    this.volatile.pendingDisturbanceNarrative = state.pendingDisturbanceNarrative;
    this.volatile.pendingPeriodSummary = state.pendingPeriodSummary;
    this.volatile.passiveNarrative = state.passiveNarrative;
    if (state.pendingEphemeralStoryEvent) {
      this.volatile.currentEvent = state.pendingEphemeralStoryEvent;
    } else if (state.pendingStoryEventId) {
      this.attachStoryEventById(state.pendingStoryEventId);
    }
  }

  private attachStoryEventById(eventId: string): void {
    try {
      const event = this.dependencies.catalog.getEventById(eventId, this.catalogVersion);
      this.volatile.currentEvent = event;
    } catch {
      this.volatile.currentEvent = null;
    }
  }

  getPlanningOptions(): PlanningOptionDto[] {
    if (this.getTerminalState()) return [];
    const choices = this.engine.getAvailableActiveActions();
    return choices.map(choice => ({
      actionId: choice.actionId,
      text: choice.text,
      description: choice.description,
      rewardSummary: choice.rewardSummary,
      costSummary: choice.costSummary,
      riskLevel: choice.riskLevel,
      category: getActionById(choice.actionId)?.category ?? 'training',
    }));
  }

  async executeActiveAction(actionId: string): Promise<void> {
    this.lastError = null;
    if (this.getSessionPhase() !== 'active_planning') {
      throw new ProgressionError('INVALID_SESSION_PHASE', 'Active action requires active_planning phase');
    }
    const result = await this.runWithRandomAsync(async () =>
      this.engine.executeActiveAction(actionId),
    );
    if (!result) {
      throw new ProgressionError('INVALID_ACTION', `Unknown or unavailable action: ${actionId}`);
    }
    this.volatile.currentEvent = null;
    this.volatile.pendingActionSummary = result.activeActionSummary;
    this.volatile.pendingDisturbanceNarrative = result.disturbanceNarrative;
    this.volatile.lastOutcomeText = result.feedbackText;
  }

  async acknowledgeProgression(ackKind: ProgressionAckKind): Promise<void> {
    this.lastError = null;
    const phase = this.getSessionPhase();
    if (ackKind === 'action_summary') {
      if (phase !== 'action_summary') {
        throw new ProgressionError('INVALID_SESSION_PHASE', 'action_summary ack requires action_summary phase');
      }
      this.volatile.pendingActionSummary = null;
      if (this.volatile.pendingDisturbanceNarrative) {
        return;
      }
      this.volatile.storyGapPassiveServed = false;
      await this.resolveAfterPlanningAck();
      return;
    }
    if (ackKind === 'disturbance') {
      if (phase !== 'disturbance_narrative') {
        throw new ProgressionError('INVALID_SESSION_PHASE', 'disturbance ack requires disturbance_narrative phase');
      }
      const disturbanceId = this.volatile.pendingDisturbanceNarrative?.disturbanceId;
      if (disturbanceId) {
        markDisturbanceNarrativeShown(this.engine.getGameState(), disturbanceId);
      }
      this.volatile.pendingDisturbanceNarrative = null;
      this.volatile.storyGapPassiveServed = false;
      await this.resolveAfterPlanningAck();
      return;
    }
    if (ackKind === 'story_automatic') {
      if (phase !== 'story_event') {
        throw new ProgressionError('INVALID_SESSION_PHASE', 'story_automatic ack requires story_event phase');
      }
      const current = this.volatile.currentEvent;
      if (!current || nextRequiresChoice(current)) {
        throw new ProgressionError(
          'INVALID_SESSION_PHASE',
          'story_automatic ack requires automatic story event',
        );
      }
      const narrativeBody = current.content?.text ?? '';
      const narrativeTitle = current.content?.title ?? '往事一局';
      await this.progressAutomatic({ maxSteps: 8 });
      await progressUntilChoiceOrTerminal(this);
      if (narrativeBody) {
        this.volatile.pendingPeriodSummary = buildPeriodSummary({
          sourceLabel: '剧情事件',
          headline: narrativeTitle,
          body: narrativeBody,
        });
      }
      this.ensurePassivePresentation();
      return;
    }
    if (ackKind === 'passive_continue') {
      if (phase !== 'passive_progression') {
        throw new ProgressionError(
          'INVALID_SESSION_PHASE',
          'passive_continue ack requires passive_progression phase',
        );
      }
      await this.executePassiveChildhoodTick();
      return;
    }
    if (ackKind === 'period_summary') {
      if (phase !== 'period_summary') {
        throw new ProgressionError('INVALID_SESSION_PHASE', 'period_summary ack requires period_summary phase');
      }
      this.volatile.pendingPeriodSummary = null;
      await this.resolveAfterPlanningAck();
      this.ensurePassivePresentation();
      return;
    }
    throw new ProgressionError('INVALID_ACK_KIND', `Unknown ackKind: ${ackKind}`);
  }

  private async resolveAfterPlanningAck(): Promise<void> {
    this.volatile.currentEvent = null;
    let guard = 0;
    while (guard < 8) {
      guard += 1;
      const next = await this.getNextEvent();
      if (next) return;
      const actions = this.engine.getAvailableActiveActions();
      if (actions.length > 0) return;
      const age = this.engine.getGameState().player?.age ?? 0;
      if (!shouldOfferDailyPlanning(age)) {
        this.ensurePassivePresentation();
        return;
      }
      await this.runWithRandomAsync(async () => {
        this.engine.advanceTime(3, 'month');
      });
    }
  }

  getRuntimeState(): GameState {
    return this.engine.getGameState();
  }

  async advanceCalendar(amount: number, unit: 'year' | 'month'): Promise<void> {
    await this.runWithRandomAsync(async () => {
      this.engine.advanceTime(amount, unit);
    });
    this.volatile.currentEvent = null;
  }

  async replaySimulatorRecords(
    sample: {
      playerName: string;
      gender: 'male' | 'female';
      routeTrack?: RouteTrack;
    },
    records: GameProcessRecord[],
  ): Promise<SimulatorReplayResult> {
    return this.runWithRandomAsync(async () => {
      prepareEngineForSimulatorReplay(this.engine, {
        playerName: sample.playerName,
        gender: sample.gender,
        suppressLethalSetbacks: true,
      });
      return replaySimulatorRecords(this.engine, this.dependencies.catalog, {
        routeTrack: sample.routeTrack,
        catalogVersion: this.catalogVersion,
      }, records);
    });
  }

  private getAvailableChoices(event: EventDefinition): EventChoice[] {
    return (event.choices ?? []).filter(choice => {
      if (!choice.condition) return true;
      return this.engine.isChoiceAvailable(choice.condition as EventCondition | undefined);
    });
  }

  private toSessionError(error: unknown): HeadlessSessionError {
    if (error instanceof CatalogReadError) {
      return {
        code: error.code === 'CATALOG_VERSION_UNKNOWN' ? 'CATALOG_VERSION_UNKNOWN' : 'EVENT_NOT_FOUND',
        message: error.message,
        details: error.details,
      };
    }
    return {
      code: 'SNAPSHOT_INVALID',
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

function nextRequiresChoice(event: EventDefinition): boolean {
  if (event.autoEffects && event.autoEffects.length > 0) return false;
  if (event.eventType === 'auto') return false;
  return Boolean(event.choices?.length);
}
