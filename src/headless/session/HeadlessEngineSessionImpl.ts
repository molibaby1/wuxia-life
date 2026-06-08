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
import type {
  HeadlessSessionError,
  HeadlessSessionVolatileState,
  HeadlessTerminalState,
  NextEventResult,
  PlayerSafeEventPayload,
  ProgressAutomaticResult,
} from './sessionTypes';
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
  }

  getLastError(): HeadlessSessionError | null {
    return this.lastError;
  }

  getCurrentEvent(): EventDefinition | null {
    return this.volatile.currentEvent;
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
    this.volatile = { currentEvent: null, lastFeedback: null, lastOutcomeText: null };
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

  getRuntimeState(): GameState {
    return this.engine.getGameState();
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
