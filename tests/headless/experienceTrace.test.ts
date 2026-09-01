import { buildChoiceDecision } from '../../src/headless/playability/choiceScoring';
import { runHeadlessPersona } from '../../src/headless/playability/headlessPersonaRunner';
import { getP8PersonaById } from '../../src/p8/personas';
import type { ExperienceTrace } from '../../src/headless/playability/experienceTraceTypes';
import type { ChoiceScoreDiagnostic } from '../../src/p8/types';
import type { DisturbanceNarrativeDisplay } from '../../src/types/activeActionTypes';

const EXPERIENCE_TRACE_SEED = 808;

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function assertDeepEqual(left: unknown, right: unknown, message: string): void {
  assert(JSON.stringify(left) === JSON.stringify(right), message);
}

function isJsonSafe(value: unknown, seen = new Set<unknown>()): boolean {
  if (value === undefined || typeof value === 'function' || typeof value === 'bigint') return false;
  if (value === null || typeof value !== 'object') return true;
  if (seen.has(value)) return false;
  seen.add(value);
  if (value instanceof Map || value instanceof Set) return false;
  return Object.values(value as Record<string, unknown>).every(child => isJsonSafe(child, seen));
}

function getChoiceSteps(trace: ExperienceTrace) {
  return trace.steps.filter(step => step.choiceDecision);
}

function getActionSteps(trace: ExperienceTrace) {
  return trace.steps.filter(step => step.activeAction);
}

function getPhaseSteps(trace: ExperienceTrace, phase: ExperienceTrace['steps'][number]['phaseBefore']) {
  return trace.steps.filter(step => step.phaseBefore === phase);
}

async function runTrace(): Promise<ExperienceTrace> {
  const persona = getP8PersonaById('p8-martial-lin');
  if (!persona) throw new Error('missing p8-martial-lin fixture');
  const result = await runHeadlessPersona({
    persona,
    seed: EXPERIENCE_TRACE_SEED,
    endAge: 40,
    catalogVersion: '1.0.0',
    maxSteps: 1200,
    experienceTrace: true,
  });
  if (!result.experienceTrace) throw new Error('experience trace was not returned');
  return result.experienceTrace;
}

export async function runExperienceTraceTests(): Promise<void> {
  const persona = getP8PersonaById('p8-martial-lin');
  if (!persona) throw new Error('missing p8-martial-lin fixture');

  const trace = await runTrace();
  assert(trace.schemaVersion === 'experience-trace-v1', 'trace schema version');
  assert(trace.runtimePath === 'headless_server', 'trace runtime path');
  assert(trace.persona.id === persona.id, 'trace persona id');
  assert(trace.seed === EXPERIENCE_TRACE_SEED, 'trace seed');
  assert(trace.endAge === 40, 'trace end age');
  assert(trace.selectionPolicy.kind === 'oracle_effect_score_v1', 'trace selection policy');
  assert(trace.selectionPolicy.usesHiddenEffects, 'trace policy should expose hidden-effect use');
  assert(trace.selectionPolicy.deterministic, 'trace policy should be deterministic');
  assert(trace.selectionPolicy.tieBreaker === 'first_candidate', 'trace tie breaker');
  assert(trace.steps.length > 0, 'trace should contain steps');
  assert(trace.steps.every((step, index) => step.sequence === index + 1), 'trace sequences are contiguous');

  const choiceSteps = getChoiceSteps(trace);
  assert(choiceSteps.length > 0, 'trace should contain a choice step');
  const firstChoice = choiceSteps[0];
  assert((firstChoice.choiceCandidates?.length ?? 0) >= 2, 'choice step should contain all candidates');
  assert(firstChoice.event?.text.length, 'choice step should contain event text');
  assert(
    firstChoice.choiceCandidates?.some(candidate => candidate.selected) === true,
    'choice step should mark selected candidate',
  );
  assert(
    firstChoice.choiceCandidates?.every(candidate =>
      typeof candidate.baseScore === 'number' &&
      typeof candidate.personaAdjustedScore === 'number' &&
      typeof candidate.personaBonus === 'number' &&
      Array.isArray(candidate.directEffects) &&
      Array.isArray(candidate.outcomeEffects) &&
      typeof candidate.outcomeCount === 'number',
    ) === true,
    'choice candidates should contain complete score diagnostics',
  );
  assert(
    firstChoice.choiceDecision?.selectedChoiceId ===
      firstChoice.choiceCandidates?.find(candidate => candidate.selected)?.choiceId,
    'trace selected choice should match candidate selection',
  );

  const actionSteps = getActionSteps(trace);
  assert(actionSteps.length > 0, 'trace should contain an active action');
  assert(actionSteps[0].activeAction?.availableActions.length, 'active action should list candidates');
  assert(actionSteps[0].activeAction?.selectionReason.length, 'active action should record reason');
  assert(
    actionSteps.some(step => step.presentation?.actionSummary),
    'active planning should capture pending action summary',
  );
  assert(
    getPhaseSteps(trace, 'action_summary').some(step => step.presentation?.actionSummary),
    'action summary should be captured before acknowledgement',
  );
  assert(
    getPhaseSteps(trace, 'period_summary').some(step => step.presentation?.periodSummary),
    'period summary should be captured before acknowledgement',
  );
  assert(
    getPhaseSteps(trace, 'passive_progression').some(step => step.presentation?.passiveNarrative),
    'passive narrative should be captured before acknowledgement',
  );
  const disturbanceSteps = getPhaseSteps(trace, 'disturbance_narrative').filter(
    step => step.presentation?.disturbanceNarrative,
  );
  assert(disturbanceSteps.length > 0, 'disturbance narrative should be captured');
  for (const step of disturbanceSteps) {
    const narrative = step.presentation!.disturbanceNarrative as DisturbanceNarrativeDisplay;
    assert(
      narrative.title.length > 0 && narrative.bodyText.length > 0 && narrative.impactSummary.length > 0,
      'disturbance narrative should contain player-understandable content',
    );
  }
  const disturbanceAcknowledgementSteps = trace.steps.filter(
    step => step.acknowledgement?.kind === 'disturbance',
  );
  assert(disturbanceAcknowledgementSteps.length > 0, 'disturbance acknowledgement should be captured');
  assert(
    disturbanceAcknowledgementSteps.every(step => Boolean(step.presentation?.disturbanceNarrative)),
    'disturbance acknowledgement must not replace the narrative on its trace step',
  );

  const tieDiagnostic: ChoiceScoreDiagnostic = {
    eventId: 'tie-event',
    selectedChoiceId: 'first',
    selectedScore: 10,
    runnerUpChoiceId: 'second',
    runnerUpScore: 10,
    personaId: persona.id,
  };
  const tieDecision = buildChoiceDecision(
    [
      { choiceId: 'first', personaAdjustedScore: 10 },
      { choiceId: 'second', personaAdjustedScore: 10 },
      { choiceId: 'third', personaAdjustedScore: 4 },
    ],
    tieDiagnostic,
  );
  assert(tieDecision.tieCount === 2, 'tie count should include equal top scores');
  assert(tieDecision.tieBrokenByOrder, 'equal scores should be marked as order-broken');

  const plain = await runHeadlessPersona({
    persona,
    seed: EXPERIENCE_TRACE_SEED,
    endAge: 40,
    catalogVersion: '1.0.0',
    maxSteps: 1200,
  });
  assert(!plain.experienceTrace, 'trace should be disabled by default');
  const stripVolatile = (state: typeof trace.finalState) => {
    const clone = JSON.parse(JSON.stringify(state)) as typeof trace.finalState & {
      gameTimestamp?: number;
      lastSavedAt?: number;
    };
    delete clone.gameTimestamp;
    delete clone.lastSavedAt;
    return clone;
  };
  assertDeepEqual(
    stripVolatile(trace.finalState),
    stripVolatile(plain.finalGameState),
    'trace must not change final state',
  );
  assert(trace.finalState.player.age === plain.finalAge, 'trace final age should match runner result');
  assertDeepEqual(
    trace.steps.filter(step => step.choiceDecision).map(step => step.choiceDecision?.selectedChoiceId),
    plain.records.filter(record => record.eventType === 'choice').map(record => record.selectedChoice?.id),
    'trace choices should match the original runner records',
  );
  assertDeepEqual(
    trace.steps.filter(step => step.activeAction).map(step => step.activeAction?.selectedActionId),
    plain.records.filter(record => record.progressionKind === 'active_action').map(record => record.activeActionId),
    'trace actions should match the original runner records',
  );
  assert(isJsonSafe(trace), 'trace should contain only JSON-safe values');
  JSON.stringify(trace);

  console.log('experienceTrace.test.ts: ok');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runExperienceTraceTests().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
