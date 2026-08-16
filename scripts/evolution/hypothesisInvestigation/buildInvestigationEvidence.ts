import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createDefaultRuntimeEventCatalog } from '../../../src/core/EventLoaderRuntimeCatalog';
import type { RuntimeEventCatalog } from '../../../src/core/RuntimeEventCatalog';
import { activeActionRepeatMechanismFacts } from '../../../src/core/activePlanning/ActionResultResolver';
import {
  activeActionCatalog,
  getActionById,
} from '../../../src/data/activeActionCatalog';
import { childhoodActionCatalog } from '../../../src/data/childhoodActionCatalog';
import type { EventDefinition } from '../../../src/types/eventTypes';
import type { ActiveActionDefinition } from '../../../src/types/activeActionTypes';
import type { ImprovementHypothesis } from '../../../src/evolution/improvementHypothesisContract';
import type { ExternalFeedback } from '../../../src/evolution/externalFeedbackContract';
import {
  serializeObservablePayload,
  type ObservableEntry,
  type ObservablePayload,
} from '../../../src/evolution/playerObservableTranscript';
import { projectHeadlessApiPlayerObservablePayload } from '../../../src/evolution/wuxiaPlayerObservableProjector';
import {
  HEADLESS_API_PLAYER_SURFACE_SOURCE_VERSION,
  type HeadlessApiPlayerSurfaceStep,
  type HeadlessApiPlayerSurfaceTrace,
} from '../../../src/headless/playability/playerSurfaceCapture';
import {
  canonicalJson,
  captureCatalogInput,
  type Phase0CatalogInput,
} from '../phase0/provenance';
import type { HypothesisInvestigationSource } from './loadHypothesisInvestigationSource';

export type InvestigationEvidenceMode = 'direct-v1' | 'longitudinal-v1' | 'cohort-v1';

export interface InvestigationEvidenceItem {
  evidenceId: string;
  authority: 'participant_source' | 'source_run' | 'current_product' | 'comparison';
  kind:
    | 'feedback'
    | 'observable_entry'
    | 'source_step'
    | 'catalog_event'
    | 'catalog_comparison'
    | 'action_definition'
    | 'action_mechanism'
    | 'longitudinal_action'
    | 'longitudinal_resource'
    | 'cohort_summary'
    | 'cohort_run';
  payload: unknown;
}

export interface InvestigationEvidencePack {
  schemaVersion:
    | 'hypothesis-investigation-evidence-v1'
    | 'hypothesis-investigation-evidence-v2'
    | 'hypothesis-investigation-evidence-v3';
  evidenceMode?: 'longitudinal-v1' | 'cohort-v1';
  runRef: string;
  hypothesisId: string;
  hypothesisInvocationRef: string;
  experimentRootHash: string;
  observablePayloadHash: string;
  selectedHypothesis: ImprovementHypothesis;
  storyLines: string[];
  items: InvestigationEvidenceItem[];
}

export interface CohortEvidenceInput {
  items: Array<{
    evidenceId: string;
    authority: 'comparison';
    kind: 'cohort_summary' | 'cohort_run';
    payload: unknown;
  }>;
}

interface EntryRange {
  entryIds: string[];
  step: HeadlessApiPlayerSurfaceStep;
}

interface ActionOccurrence {
  sequence: number;
  age?: number;
  actionId: string;
  observableEntryIds: string[];
}

function entryRef(index: number): string {
  return `entry-${String(index).padStart(6, '0')}`;
}

function emittedEntryCount(step: HeadlessApiPlayerSurfaceStep): number {
  const cards = step.presentationCards ?? [];
  if (step.kind === 'story_event') {
    return 1 + Math.max(0, cards.length - 1);
  }
  return cards.length;
}

function mapObservableEntriesToSteps(
  source: HeadlessApiPlayerSurfaceTrace,
): Map<string, EntryRange> {
  const map = new Map<string, EntryRange>();
  let cursor = 0;
  for (const step of source.steps) {
    const count = emittedEntryCount(step);
    if (count <= 0) continue;
    const entryIds: string[] = [];
    for (let offset = 0; offset < count; offset += 1) {
      entryIds.push(entryRef(cursor + offset + 1));
    }
    for (const entryId of entryIds) {
      map.set(entryId, { entryIds, step });
    }
    cursor += count;
  }
  return map;
}

function mapStepsToObservableEntries(
  source: HeadlessApiPlayerSurfaceTrace,
): Map<HeadlessApiPlayerSurfaceStep, string[]> {
  const map = new Map<HeadlessApiPlayerSurfaceStep, string[]>();
  let cursor = 0;
  for (const step of source.steps) {
    const count = emittedEntryCount(step);
    const entryIds = Array.from({ length: count }, (_, offset) => entryRef(cursor + offset + 1));
    map.set(step, entryIds);
    cursor += count;
  }
  return map;
}

function positiveCostStats(action: ActiveActionDefinition): string[] {
  return [...new Set(
    action.costs
      .filter(cost => typeof cost.stat === 'string' && cost.stat.length > 0 && cost.amount > 0)
      .map(cost => cost.stat),
  )].sort();
}

function actionOccurrencePayload(occurrences: ActionOccurrence[]): Record<string, unknown> {
  const ages = occurrences
    .map(occurrence => occurrence.age)
    .filter((age): age is number => age !== undefined);
  return {
    occurrenceCount: occurrences.length,
    ...(ages.length > 0 ? { firstAge: ages[0], lastAge: ages[ages.length - 1] } : {}),
    occurrences: occurrences.map(occurrence => ({
      sequence: occurrence.sequence,
      ...(occurrence.age !== undefined ? { age: occurrence.age } : {}),
      observableEntryIds: [...occurrence.observableEntryIds],
    })),
  };
}

export function appendInvestigationEvidenceItem(
  items: InvestigationEvidenceItem[],
  item: InvestigationEvidenceItem,
): void {
  const existing = items.find(candidate => candidate.evidenceId === item.evidenceId);
  if (!existing) {
    items.push(item);
    return;
  }

  if (
    existing.authority === item.authority
    && existing.kind === item.kind
    && canonicalJson(existing.payload) === canonicalJson(item.payload)
  ) {
    return;
  }

  throw new Error(`evidence ID conflict: ${item.evidenceId}`);
}

function resolveFeedbackText(feedback: ExternalFeedback, ref: string): string {
  if (ref === 'overallImpression') return feedback.overallImpression;
  const match = /^observations\[(\d+)\]$/.exec(ref);
  if (!match) {
    throw new Error(`unsupported feedback ref: ${ref}`);
  }
  const observation = feedback.observations[Number(match[1])];
  if (!observation) {
    throw new Error(`feedback ref not found: ${ref}`);
  }
  return observation.feedback;
}

function requireObservableEntry(
  payload: ObservablePayload,
  entryId: string,
): ObservableEntry {
  const entry = payload.entries.find(item => item.entryId === entryId);
  if (!entry) {
    throw new Error(`observable entry not found: ${entryId}`);
  }
  return entry;
}

function parseSealedCatalog(bytes: string): Phase0CatalogInput {
  const parsed = JSON.parse(bytes) as Phase0CatalogInput;
  if (parsed.schemaVersion !== 'phase0-catalog-input-v1' || !Array.isArray(parsed.events)) {
    throw new Error('sealed catalog.json is not a valid phase0-catalog-input-v1');
  }
  return parsed;
}

function eventMap(events: readonly EventDefinition[]): Map<string, EventDefinition> {
  return new Map(events.map(event => [event.id, event]));
}

function selectSlice(
  events: readonly EventDefinition[],
  directEventIds: ReadonlySet<string>,
  storyLines: readonly string[],
): EventDefinition[] {
  const storyLineSet = new Set(storyLines);
  const selected = events.filter(event =>
    directEventIds.has(event.id)
    || (typeof event.storyLine === 'string'
      && event.storyLine.length > 0
      && storyLineSet.has(event.storyLine)));
  return [...selected].sort((left, right) => left.id.localeCompare(right.id));
}

function compareSlices(
  storyLine: string,
  sourceEvents: readonly EventDefinition[],
  currentEvents: readonly EventDefinition[],
): {
  storyLine: string;
  addedEventIds: string[];
  removedEventIds: string[];
  changedEventIds: string[];
} {
  const sourceById = eventMap(
    sourceEvents.filter(event => event.storyLine === storyLine),
  );
  const currentById = eventMap(
    currentEvents.filter(event => event.storyLine === storyLine),
  );
  const allIds = [...new Set([...sourceById.keys(), ...currentById.keys()])].sort();
  const addedEventIds: string[] = [];
  const removedEventIds: string[] = [];
  const changedEventIds: string[] = [];
  for (const id of allIds) {
    const sourceEvent = sourceById.get(id);
    const currentEvent = currentById.get(id);
    if (sourceEvent && !currentEvent) {
      removedEventIds.push(id);
      continue;
    }
    if (!sourceEvent && currentEvent) {
      addedEventIds.push(id);
      continue;
    }
    if (
      sourceEvent
      && currentEvent
      && canonicalJson(sourceEvent) !== canonicalJson(currentEvent)
    ) {
      changedEventIds.push(id);
    }
  }
  return {
    storyLine,
    addedEventIds,
    removedEventIds,
    changedEventIds,
  };
}

export function investigationEvidenceRefs(
  pack: InvestigationEvidencePack,
): ReadonlySet<string> {
  return new Set(pack.items.map(item => item.evidenceId));
}

function formalActiveActions(): readonly ActiveActionDefinition[] {
  return [...activeActionCatalog, ...childhoodActionCatalog];
}

/**
 * Resolve formal action identity from a player-surface active_action_result step.
 * Prefer sealed/captured actionId; otherwise fail-closed unique name join against formal catalogs.
 */
export function resolveActiveActionIdFromSurfaceStep(
  step: HeadlessApiPlayerSurfaceStep,
): string {
  if (step.kind !== 'active_action_result') {
    throw new Error(`expected active_action_result step, got ${step.kind}`);
  }

  if (typeof step.actionId === 'string' && step.actionId.length > 0) {
    const byId = getActionById(step.actionId);
    if (!byId) {
      throw new Error(`unknown active action id on surface step: ${step.actionId}`);
    }
    return byId.id;
  }

  const title = step.presentationCards?.[0]?.title;
  if (typeof title !== 'string' || title.length === 0) {
    throw new Error(
      'active_action_result step missing actionId and presentation title; cannot resolve formal action identity',
    );
  }

  const matches = formalActiveActions().filter(action => action.name === title);
  if (matches.length === 0) {
    throw new Error(
      `cannot resolve active action identity: no formal action named ${JSON.stringify(title)}`,
    );
  }
  if (matches.length > 1) {
    throw new Error(
      `cannot resolve active action identity: ambiguous formal action name ${JSON.stringify(title)}`,
    );
  }
  return matches[0]!.id;
}

function actionDefinitionPayload(action: ActiveActionDefinition): Record<string, unknown> {
  return {
    id: action.id,
    category: action.category,
    name: action.name,
    playerIntent: action.playerIntent,
    duration: action.duration,
    rewards: action.rewards,
    costs: action.costs,
    risk: action.risk,
    ...(action.habitEffects !== undefined ? { habitEffects: action.habitEffects } : {}),
    ...(action.onCompleteFlags !== undefined
      ? { onCompleteFlags: [...action.onCompleteFlags] }
      : {}),
  };
}

/** Structured facts from the same ActionResultResolver owner — no duplicated literals. */
function actionMechanismPayload(actionId: string): Record<string, unknown> {
  return {
    actionId,
    owner: 'ActionResultResolver.resolveActiveAction',
    ...activeActionRepeatMechanismFacts(),
    ageClampOwner: 'clampActionDeltasForAge',
  };
}

export async function buildInvestigationEvidence(input: {
  source: HypothesisInvestigationSource;
  currentRuntimeCatalog?: RuntimeEventCatalog;
  evidenceMode?: InvestigationEvidenceMode;
  cohortEvidence?: CohortEvidenceInput;
}): Promise<InvestigationEvidencePack> {
  const { source } = input;
  const evidenceMode = input.evidenceMode ?? 'direct-v1';
  if (evidenceMode === 'cohort-v1') {
    if (!input.cohortEvidence) {
      throw new Error('cohort-v1 requires cohortEvidence input');
    }
    const longitudinal = await buildInvestigationEvidence({
      source,
      currentRuntimeCatalog: input.currentRuntimeCatalog,
      evidenceMode: 'longitudinal-v1',
    });
    const items: InvestigationEvidenceItem[] = [...longitudinal.items];
    for (const item of input.cohortEvidence.items) {
      appendInvestigationEvidenceItem(items, item);
    }
    items.sort((left, right) => left.evidenceId.localeCompare(right.evidenceId));
    return {
      schemaVersion: 'hypothesis-investigation-evidence-v3',
      evidenceMode: 'cohort-v1',
      runRef: longitudinal.runRef,
      hypothesisId: longitudinal.hypothesisId,
      hypothesisInvocationRef: longitudinal.hypothesisInvocationRef,
      experimentRootHash: longitudinal.experimentRootHash,
      observablePayloadHash: longitudinal.observablePayloadHash,
      selectedHypothesis: longitudinal.selectedHypothesis,
      storyLines: longitudinal.storyLines,
      items,
    };
  }
  const longitudinal = evidenceMode === 'longitudinal-v1';
  const surfaceBytes = await readFile(
    join(source.gameRunPath, 'internal', 'player-surface-source.json'),
    'utf8',
  );
  const catalogBytes = await readFile(
    join(source.gameRunPath, 'inputs', 'catalog.json'),
    'utf8',
  );

  const surface = JSON.parse(surfaceBytes) as HeadlessApiPlayerSurfaceTrace;
  if (surface.schemaVersion !== HEADLESS_API_PLAYER_SURFACE_SOURCE_VERSION) {
    throw new Error(`unsupported player surface source version: ${String(surface.schemaVersion)}`);
  }

  const reprojected = projectHeadlessApiPlayerObservablePayload(surface);
  const reprojectedBytes = serializeObservablePayload(reprojected);
  if (reprojectedBytes !== source.mefSource.observablePayloadBytes) {
    throw new Error(
      're-projected player-surface source does not exactly match validated MEF observable payload',
    );
  }

  const sealedCatalog = parseSealedCatalog(catalogBytes);
  const sourceEvents = sealedCatalog.events;
  const sourceById = eventMap(sourceEvents);

  const currentCatalog = input.currentRuntimeCatalog ?? createDefaultRuntimeEventCatalog();
  const currentEvents = captureCatalogInput(currentCatalog).events;

  const items: InvestigationEvidenceItem[] = [];
  const append = (item: InvestigationEvidenceItem): void => {
    appendInvestigationEvidenceItem(items, item);
  };
  const selected = source.selectedHypothesis;

  for (const feedbackRef of selected.feedbackRefs) {
    append({
      evidenceId: `feedback:${feedbackRef}`,
      authority: 'participant_source',
      kind: 'feedback',
      payload: {
        feedbackRef,
        text: resolveFeedbackText(source.mefSource.feedback, feedbackRef),
      },
    });
  }

  for (const entryId of selected.evidenceRefs) {
    append({
      evidenceId: `observable:${entryId}`,
      authority: 'participant_source',
      kind: 'observable_entry',
      payload: requireObservableEntry(source.mefSource.observablePayload, entryId),
    });
  }

  const entryToStep = mapObservableEntriesToSteps(surface);
  const stepToEntryIds = mapStepsToObservableEntries(surface);
  const directEventIds = new Set<string>();
  const directActionIds = new Set<string>();

  for (const entryId of selected.evidenceRefs) {
    const mapped = entryToStep.get(entryId);
    if (!mapped) {
      throw new Error(
        `selected evidenceRef ${entryId} has no mapped player-surface source step`,
      );
    }
    const { step } = mapped;

    if (step.kind === 'story_event' && step.storyEvent?.eventId) {
      directEventIds.add(step.storyEvent.eventId);
      append({
        evidenceId: `source-step:${entryId}`,
        authority: 'source_run',
        kind: 'source_step',
        payload: {
          entryId,
          sequence: step.sequence,
          eventId: step.storyEvent.eventId,
          ...(step.selectedChoiceId !== undefined
            ? { selectedChoiceId: step.selectedChoiceId }
            : {}),
          title: step.storyEvent.title,
          text: step.storyEvent.text,
        },
      });
      continue;
    }

    if (step.kind === 'active_action_result') {
      const actionId = resolveActiveActionIdFromSurfaceStep(step);
      directActionIds.add(actionId);
      const card = step.presentationCards?.[0];
      append({
        evidenceId: `source-step:${entryId}`,
        authority: 'source_run',
        kind: 'source_step',
        payload: {
          entryId,
          sequence: step.sequence,
          ...(step.age !== undefined ? { age: step.age } : {}),
          actionId,
          ...(card?.title !== undefined ? { title: card.title } : {}),
        },
      });
      continue;
    }

    // Other kinds remain observable-only; no source-step mechanism claim.
  }

  const storyLines = [...new Set(
    [...directEventIds]
      .map(eventId => sourceById.get(eventId)?.storyLine)
      .filter((value): value is string => typeof value === 'string' && value.length > 0),
  )].sort();

  const sourceSlice = selectSlice(sourceEvents, directEventIds, storyLines);
  for (const event of sourceSlice) {
    append({
      evidenceId: `source-catalog:${event.id}`,
      authority: 'source_run',
      kind: 'catalog_event',
      payload: event,
    });
  }

  const currentSlice = selectSlice(currentEvents, directEventIds, storyLines);
  for (const event of currentSlice) {
    append({
      evidenceId: `current-catalog:${event.id}`,
      authority: 'current_product',
      kind: 'catalog_event',
      payload: event,
    });
  }

  for (const storyLine of storyLines) {
    append({
      evidenceId: `catalog-comparison:${storyLine}`,
      authority: 'comparison',
      kind: 'catalog_comparison',
      payload: compareSlices(storyLine, sourceSlice, currentSlice),
    });
  }

  const actionOccurrences = new Map<string, ActionOccurrence[]>();
  if (longitudinal) {
    for (const step of surface.steps) {
      if (step.kind !== 'active_action_result') continue;
      const actionId = resolveActiveActionIdFromSurfaceStep(step);
      const observableEntryIds = stepToEntryIds.get(step);
      if (!observableEntryIds) {
        throw new Error(`observable entries missing for active action sequence: ${step.sequence}`);
      }
      const occurrences = actionOccurrences.get(actionId) ?? [];
      occurrences.push({
        sequence: step.sequence,
        ...(step.age !== undefined ? { age: step.age } : {}),
        actionId,
        observableEntryIds: [...observableEntryIds],
      });
      actionOccurrences.set(actionId, occurrences);
    }
    for (const occurrences of actionOccurrences.values()) {
      occurrences.sort((left, right) => left.sequence - right.sequence);
    }

    const seedActionIdsByResource = new Map<string, Set<string>>();
    const relatedActionIdsByResource = new Map<string, Set<string>>();
    const actionsById = new Map<string, ActiveActionDefinition>();
    for (const actionId of actionOccurrences.keys()) {
      const action = getActionById(actionId);
      if (!action) {
        throw new Error(`formal active action missing for resolved id: ${actionId}`);
      }
      actionsById.set(actionId, action);
    }

    for (const actionId of directActionIds) {
      const action = actionsById.get(actionId) ?? getActionById(actionId);
      if (!action) {
        throw new Error(`formal active action missing for resolved id: ${actionId}`);
      }
      for (const stat of positiveCostStats(action)) {
        const seedActionIds = seedActionIdsByResource.get(stat) ?? new Set<string>();
        seedActionIds.add(actionId);
        seedActionIdsByResource.set(stat, seedActionIds);
      }
    }

    for (const [actionId, action] of actionsById) {
      for (const stat of positiveCostStats(action)) {
        if (!seedActionIdsByResource.has(stat)) continue;
        const relatedActionIds = relatedActionIdsByResource.get(stat) ?? new Set<string>();
        relatedActionIds.add(actionId);
        relatedActionIdsByResource.set(stat, relatedActionIds);
      }
    }

    for (const actionId of [...directActionIds].sort()) {
      const occurrences = actionOccurrences.get(actionId);
      if (!occurrences) {
        throw new Error(`direct action has no source occurrence: ${actionId}`);
      }
      append({
        evidenceId: `longitudinal-action:${actionId}`,
        authority: 'source_run',
        kind: 'longitudinal_action',
        payload: {
          actionId,
          ...actionOccurrencePayload(occurrences),
        },
      });
      for (const occurrence of occurrences) {
        for (const entryId of occurrence.observableEntryIds) {
          append({
            evidenceId: `observable:${entryId}`,
            authority: 'participant_source',
            kind: 'observable_entry',
            payload: requireObservableEntry(source.mefSource.observablePayload, entryId),
          });
        }
      }
    }

    for (const resourceStat of [...seedActionIdsByResource.keys()].sort()) {
      const relatedActionIds = [...(relatedActionIdsByResource.get(resourceStat) ?? [])].sort();
      const occurrences = relatedActionIds
        .flatMap(actionId => actionOccurrences.get(actionId) ?? [])
        .sort((left, right) => left.sequence - right.sequence);
      append({
        evidenceId: `longitudinal-resource:${resourceStat}`,
        authority: 'comparison',
        kind: 'longitudinal_resource',
        payload: {
          resourceStat,
          relation: 'formal_active_action_cost',
          seedActionIds: [...(seedActionIdsByResource.get(resourceStat) ?? [])].sort(),
          relatedActionIds,
          occurrences: occurrences.map(occurrence => ({
            sequence: occurrence.sequence,
            ...(occurrence.age !== undefined ? { age: occurrence.age } : {}),
            actionId: occurrence.actionId,
            observableEntryIds: [...occurrence.observableEntryIds],
          })),
        },
      });
      for (const actionId of relatedActionIds) {
        for (const occurrence of actionOccurrences.get(actionId) ?? []) {
          for (const entryId of occurrence.observableEntryIds) {
            append({
              evidenceId: `observable:${entryId}`,
              authority: 'participant_source',
              kind: 'observable_entry',
              payload: requireObservableEntry(source.mefSource.observablePayload, entryId),
            });
          }
        }
      }
    }
  }

  const actionDefinitionIds = new Set(directActionIds);
  if (longitudinal) {
    for (const actionId of actionOccurrences.keys()) {
      const action = getActionById(actionId);
      if (!action) throw new Error(`formal active action missing for resolved id: ${actionId}`);
      if ([...actionDefinitionIds].some(seedActionId => {
        const seedAction = getActionById(seedActionId);
        return seedAction !== undefined
          && positiveCostStats(seedAction).some(stat => positiveCostStats(action).includes(stat));
      })) {
        actionDefinitionIds.add(actionId);
      }
    }
  }

  for (const actionId of [...actionDefinitionIds].sort()) {
    const action = getActionById(actionId);
    if (!action) {
      throw new Error(`formal active action missing for resolved id: ${actionId}`);
    }
    append({
      evidenceId: `current-action:${actionId}`,
      authority: 'current_product',
      kind: 'action_definition',
      payload: actionDefinitionPayload(action),
    });
    if (directActionIds.has(actionId)) {
      append({
        evidenceId: `current-action-mechanism:${actionId}`,
        authority: 'current_product',
        kind: 'action_mechanism',
        payload: actionMechanismPayload(actionId),
      });
    }
  }

  items.sort((left, right) => left.evidenceId.localeCompare(right.evidenceId));

  return {
    ...(longitudinal
      ? { schemaVersion: 'hypothesis-investigation-evidence-v2' as const, evidenceMode: 'longitudinal-v1' as const }
      : { schemaVersion: 'hypothesis-investigation-evidence-v1' as const }),
    runRef: source.runRef,
    hypothesisId: source.hypothesisId,
    hypothesisInvocationRef: source.hypothesisInvocationRef,
    experimentRootHash: source.experimentRootHash,
    observablePayloadHash: source.observablePayloadHash,
    selectedHypothesis: selected,
    storyLines,
    items,
  };
}
