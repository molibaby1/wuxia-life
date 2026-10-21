import assert from 'node:assert/strict';
import { EventExecutor } from '../src/core/EventExecutor';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { cloneCanonicalGameState } from '../src/contracts/validation/canonicalGameStateValidation';
import {
  appendScholarOfficialPursuitEntry,
  deriveScholarOfficialPursuit,
  SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY,
  validateScholarOfficialPursuitLedger,
  type PursuitDate,
  type ScholarOfficialPursuitEntryDraft,
} from '../src/core/scholarOfficialPursuit';
import { EffectType, type GameState } from '../src/types/eventTypes';

const CASE_LEDGER_KEY = SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY;

function ledgerWithTwoEntries(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    entries: [
      {
        sequence: 1,
        type: 'invitation_response',
        date: { year: 1, month: 1, day: 1 },
        age: 18,
        sourceEventId: 'p138_scholar_official_invitation',
        response: 'accepted',
      },
      {
        sequence: 2,
        type: 'exam_attempt',
        attemptNumber: 1,
        startedAt: { year: 1, month: 2, day: 1 },
        completedAt: { year: 1, month: 3, day: 1 },
        ageAtStart: 18,
        knowledgeAtStart: 20,
        rulesVersion: 'curve-a-v1',
        adoptedPassRate: 0.6,
        result: 'failed',
      },
    ],
  };
}

function makeState(): GameState {
  const state = new GameEngineIntegration().getGameState();
  state.currentTime = { year: 1, month: 3, day: 1 };
  state.player.age = 18;
  state.player.knowledge = 20;
  return state;
}

function moveTo(state: GameState, date: PursuitDate, age = state.player.age, knowledge = state.player.knowledge): GameState {
  const next = cloneCanonicalGameState(state);
  next.currentTime = { ...date };
  next.player.age = age;
  next.player.knowledge = knowledge;
  return next;
}

function invite(
  state: GameState,
  date: PursuitDate,
  age: number,
  response: 'accepted' | 'declined' = 'accepted',
): GameState {
  const atInvitation = moveTo(state, date, age);
  return appendScholarOfficialPursuitEntry(atInvitation, {
    type: 'invitation_response',
    date,
    age,
    sourceEventId: 'p138_scholar_official_invitation',
    response,
  });
}

function exam(
  state: GameState,
  startedAt: PursuitDate,
  completedAt: PursuitDate,
  result: 'passed' | 'failed',
  ageAtStart = state.player.age,
  knowledgeAtStart = state.player.knowledge,
): GameState {
  return appendScholarOfficialPursuitEntry(moveTo(state, completedAt, Math.max(state.player.age, ageAtStart)), {
    type: 'exam_attempt',
    attemptNumber: ((state.flags[CASE_LEDGER_KEY] as { entries: unknown[] } | undefined)?.entries
      .filter((entry: unknown) => (entry as { type?: string }).type === 'exam_attempt').length ?? 0) + 1,
    startedAt,
    completedAt,
    ageAtStart,
    knowledgeAtStart,
    rulesVersion: 'curve-a-v1',
    adoptedPassRate: 0.6,
    result,
  });
}

function appointment(
  state: GameState,
  opportunityId: string,
  offeredAt: PursuitDate,
  decidedAt: PursuitDate,
  response: 'accepted' | 'declined',
  effectiveAt?: PursuitDate,
): GameState {
  return appendScholarOfficialPursuitEntry(moveTo(state, decidedAt), {
    type: 'appointment_decision',
    opportunityId,
    offeredAt,
    decidedAt,
    officeId: 'prefect-assistant',
    authorityId: 'provincial-government',
    response,
    ...(response === 'accepted' && effectiveAt ? { effectiveAt } : {}),
  } as ScholarOfficialPursuitEntryDraft);
}

async function testConflictingLedgerMirrorRejectsUnrelatedFlagSet(): Promise<void> {
  const state = makeState();
  const authoritative = ledgerWithTwoEntries();
  const playerMirror = {
    schemaVersion: 1,
    entries: [structuredClone((authoritative.entries as unknown[])[0])],
  };
  state.flags[CASE_LEDGER_KEY] = authoritative;
  state.player.flags[CASE_LEDGER_KEY] = playerMirror;
  const before = cloneCanonicalGameState(state);

  await assert.rejects(
    new EventExecutor().executeEffects([
      { type: EffectType.FLAG_SET, flag: 'unrelated_flag', value: true },
    ], state),
    /ledger|mirror|账本|镜像/i,
  );
  assert.deepEqual(state, before, 'rejected writes must not mutate the source state');
}

async function testConflictingLedgerMirrorRejectsUnrelatedFlagUnset(): Promise<void> {
  const state = makeState();
  const authoritative = ledgerWithTwoEntries();
  const playerMirror = {
    schemaVersion: 1,
    entries: [structuredClone((authoritative.entries as unknown[])[0])],
  };
  state.flags[CASE_LEDGER_KEY] = authoritative;
  state.player.flags[CASE_LEDGER_KEY] = playerMirror;
  const before = cloneCanonicalGameState(state);

  await assert.rejects(
    new EventExecutor().executeEffects([
      { type: EffectType.FLAG_UNSET, flag: 'unrelated_flag' },
    ], state),
    /ledger|mirror|账本|镜像/i,
  );
  assert.deepEqual(state, before, 'rejected writes must not mutate the source state');
}

async function testMatchingLedgerMirrorSurvivesUnrelatedFlagWrites(): Promise<void> {
  const state = makeState();
  const ledger = ledgerWithTwoEntries();
  state.flags[CASE_LEDGER_KEY] = structuredClone(ledger);
  state.player.flags[CASE_LEDGER_KEY] = structuredClone(ledger);

  const setResult = await new EventExecutor().executeEffects([
    { type: EffectType.FLAG_SET, flag: 'unrelated_flag', value: true },
  ], state);
  assert.deepEqual(setResult.flags[CASE_LEDGER_KEY], ledger);
  assert.deepEqual(setResult.player.flags[CASE_LEDGER_KEY], ledger);
  assert.equal(setResult.flags.unrelated_flag, true);

  const unsetResult = await new EventExecutor().executeEffects([
    { type: EffectType.FLAG_UNSET, flag: 'unrelated_flag' },
  ], setResult);
  assert.deepEqual(unsetResult.flags[CASE_LEDGER_KEY], ledger);
  assert.deepEqual(unsetResult.player.flags[CASE_LEDGER_KEY], ledger);
  assert.equal(Object.hasOwn(unsetResult.flags, 'unrelated_flag'), false);

  const topLevelOnly = makeState();
  topLevelOnly.flags[CASE_LEDGER_KEY] = ledgerWithTwoEntries();
  const synchronized = await new EventExecutor().executeEffects([
    { type: EffectType.FLAG_SET, flag: 'unrelated_flag', value: true },
  ], topLevelOnly);
  assert.deepEqual(synchronized.player.flags[CASE_LEDGER_KEY], synchronized.flags[CASE_LEDGER_KEY]);
  assert.equal(synchronized.flags.unrelated_flag, true);
}

async function testFlagEffectsCannotWriteOrDeleteTheProtectedLedger(): Promise<void> {
  const state = makeState();
  const ledger = ledgerWithTwoEntries();
  state.flags[CASE_LEDGER_KEY] = ledger;
  state.player.flags[CASE_LEDGER_KEY] = structuredClone(ledger);

  await assert.rejects(
    new EventExecutor().executeEffects([
      { type: EffectType.FLAG_SET, flag: CASE_LEDGER_KEY, value: { forged: true } },
    ], state),
    /protected|ledger|账本/i,
  );
  await assert.rejects(
    new EventExecutor().executeEffects([
      { type: EffectType.FLAG_UNSET, flag: CASE_LEDGER_KEY },
    ], state),
    /protected|ledger|账本/i,
  );
}

async function testOrdinaryFlagsKeepTheirExistingMergeSemantics(): Promise<void> {
  const state = makeState();
  state.flags.shared_ordinary_flag = 'top-level';
  state.player.flags.shared_ordinary_flag = 'player-level';

  const result = await new EventExecutor().executeEffects([
    { type: EffectType.FLAG_SET, flag: 'another_flag', value: true },
  ], state);
  assert.equal(result.flags.shared_ordinary_flag, 'player-level');
  assert.equal(result.player.flags.shared_ordinary_flag, 'player-level');
}

function testInvitationAndDerivedEligibility(): void {
  assert.equal(deriveScholarOfficialPursuit(makeState()).status, 'none');

  const declined = invite(makeState(), { year: 1, month: 1, day: 1 }, 30, 'declined');
  const declinedProjection = deriveScholarOfficialPursuit(declined);
  assert.equal(declinedProjection.status, 'none');
  assert.equal(declinedProjection.invitationResponse, 'declined');
  assert.throws(() => invite(declined, { year: 1, month: 1, day: 1 }, 30), /invitation|邀请/i);
  assert.throws(() => invite(makeState(), { year: 1, month: 1, day: 1 }, 31), /16 and 30|16.*30|age/i);

  const acceptedAt17 = invite(makeState(), { year: 1, month: 1, day: 1 }, 17);
  assert.equal(deriveScholarOfficialPursuit(acceptedAt17).stage, 'waiting_for_exam_age');
  const acceptedAt16 = invite(makeState(), { year: 1, month: 1, day: 1 }, 16);
  assert.equal(deriveScholarOfficialPursuit(acceptedAt16).stage, 'waiting_for_exam_age');
  const eligibleAgeButLowKnowledge = moveTo(acceptedAt17, { year: 1, month: 2, day: 1 }, 18, 19);
  assert.equal(deriveScholarOfficialPursuit(eligibleAgeButLowKnowledge).stage, 'waiting_for_knowledge');
  assert.throws(
    () => exam(acceptedAt17, { year: 1, month: 2, day: 1 }, { year: 1, month: 3, day: 1 }, 'failed', 17, 20),
    /18|age/i,
  );
  assert.throws(
    () => exam(acceptedAt17, { year: 1, month: 2, day: 1 }, { year: 1, month: 3, day: 1 }, 'failed', 18, 19),
    /knowledge|学识/i,
  );
}

function testFailureCooldownUsesFullCalendarMonthsAndAllowsRepeatedAttempts(): void {
  const accepted = invite(makeState(), { year: 1, month: 1, day: 1 }, 18);
  const firstFailure = exam(
    accepted,
    { year: 1, month: 2, day: 1 },
    { year: 1, month: 3, day: 1 },
    'failed',
  );
  const duringCooldown = deriveScholarOfficialPursuit(firstFailure);
  assert.equal(duringCooldown.status, 'active');
  assert.equal(duringCooldown.stage, 'exam_cooldown');
  assert.deepEqual(duringCooldown.nextExamEligibleAt, { year: 2, month: 3, day: 1 });
  assert.equal(duringCooldown.canTakeExam, false);

  const exactTwelveMonthBoundary = moveTo(firstFailure, { year: 2, month: 3, day: 1 });
  assert.equal(deriveScholarOfficialPursuit(exactTwelveMonthBoundary).canTakeExam, true);
  const secondFailure = exam(
    firstFailure,
    { year: 2, month: 3, day: 1 },
    { year: 2, month: 4, day: 1 },
    'failed',
  );
  assert.equal(deriveScholarOfficialPursuit(secondFailure).examAttempts, 2);
  assert.deepEqual(deriveScholarOfficialPursuit(secondFailure).nextExamEligibleAt, { year: 3, month: 4, day: 1 });

  assert.throws(
    () => exam(firstFailure, { year: 2, month: 2, day: 1 }, { year: 2, month: 3, day: 1 }, 'failed'),
    /12 complete months|cooldown/i,
  );
  assert.throws(
    () => exam(accepted, { year: 1, month: 2, day: 1 }, { year: 1, month: 2, day: 30 }, 'failed'),
    /one complete game month/i,
  );
}

function testPassingExamBlocksAnotherExamAndAbandonKeepsQualification(): void {
  const accepted = invite(makeState(), { year: 1, month: 1, day: 1 }, 18);
  const passed = exam(
    accepted,
    { year: 1, month: 2, day: 1 },
    { year: 1, month: 3, day: 1 },
    'passed',
  );
  const qualified = deriveScholarOfficialPursuit(passed);
  assert.equal(qualified.status, 'active');
  assert.equal(qualified.stage, 'qualified_waiting_appointment');
  assert.equal(qualified.canTakeExam, false);
  assert.equal(qualified.canAbandon, true);
  assert.throws(
    () => exam(passed, { year: 1, month: 3, day: 1 }, { year: 1, month: 4, day: 1 }, 'failed'),
    /passing exam|passed/i,
  );

  const abandoned = appendScholarOfficialPursuitEntry(moveTo(passed, { year: 1, month: 3, day: 1 }), {
    type: 'abandon', date: { year: 1, month: 3, day: 1 },
  });
  const abandonedProjection = deriveScholarOfficialPursuit(abandoned);
  assert.equal(abandonedProjection.status, 'abandoned');
  assert.equal(abandonedProjection.examAttempts, 1);
  assert.equal(abandonedProjection.latestExamResult, 'passed');

  const appointedAfterAbandon = appointment(
    abandoned,
    'opportunity-after-abandon',
    { year: 1, month: 3, day: 1 },
    { year: 1, month: 3, day: 1 },
    'accepted',
    { year: 1, month: 3, day: 1 },
  );
  assert.equal(deriveScholarOfficialPursuit(appointedAfterAbandon).status, 'abandoned');
  assert.equal(deriveScholarOfficialPursuit(appointedAfterAbandon).appointmentAccepted, true);
}

function testAppointmentRequiresQualificationAndEnforcesOfferCooldown(): void {
  const accepted = invite(makeState(), { year: 1, month: 1, day: 1 }, 30);
  assert.throws(
    () => appointment(
      accepted,
      'unqualified-opportunity',
      { year: 1, month: 2, day: 1 },
      { year: 1, month: 2, day: 1 },
      'declined',
    ),
    /passing exam|qualification/i,
  );

  const passed = exam(
    accepted,
    { year: 80, month: 2, day: 1 },
    { year: 80, month: 3, day: 1 },
    'passed',
    80,
    20,
  );
  const declined = appointment(
    passed,
    'first-opportunity',
    { year: 80, month: 4, day: 1 },
    { year: 80, month: 4, day: 1 },
    'declined',
  );

  assert.throws(
    () => appointment(
      declined,
      'offered-too-early-decided-later',
      { year: 82, month: 3, day: 1 },
      { year: 82, month: 4, day: 1 },
      'declined',
    ),
    /24 complete months/i,
  );
  const exactBoundary = appointment(
    declined,
    'second-opportunity',
    { year: 82, month: 4, day: 1 },
    { year: 82, month: 4, day: 1 },
    'accepted',
    { year: 82, month: 4, day: 1 },
  );
  assert.equal(deriveScholarOfficialPursuit(exactBoundary).status, 'completed');
  assert.throws(
    () => appointment(
      exactBoundary,
      'third-opportunity',
      { year: 82, month: 5, day: 1 },
      { year: 82, month: 5, day: 1 },
      'accepted',
      { year: 82, month: 5, day: 1 },
    ),
    /accepted appointment|repeated/i,
  );

  const repeatedRefusal1 = appointment(
    declined,
    'second-refusal',
    { year: 82, month: 4, day: 1 },
    { year: 82, month: 4, day: 1 },
    'declined',
  );
  const repeatedRefusal2 = appointment(
    repeatedRefusal1,
    'third-refusal',
    { year: 84, month: 4, day: 1 },
    { year: 84, month: 4, day: 1 },
    'declined',
  );
  const repeatedRefusal3 = appointment(
    repeatedRefusal2,
    'fourth-refusal',
    { year: 86, month: 4, day: 1 },
    { year: 86, month: 4, day: 1 },
    'declined',
  );
  assert.equal(deriveScholarOfficialPursuit(repeatedRefusal3).status, 'active');
  assert.equal(deriveScholarOfficialPursuit(repeatedRefusal3).examAttempts, 1);
  assert.throws(
    () => appointment(
      repeatedRefusal3,
      'first-opportunity',
      { year: 88, month: 4, day: 1 },
      { year: 88, month: 4, day: 1 },
      'declined',
    ),
    /duplicated|opportunity/i,
  );

  assert.throws(
    () => appointment(
      declined,
      'future-effective-opportunity',
      { year: 82, month: 4, day: 1 },
      { year: 82, month: 4, day: 1 },
      'accepted',
      { year: 82, month: 5, day: 1 },
    ),
    /effective date|effectiveAt|生效日期/i,
  );

  const futureEffectiveLedger = cloneCanonicalGameState(exactBoundary).flags[CASE_LEDGER_KEY] as {
    entries: Array<Record<string, unknown>>;
  };
  futureEffectiveLedger.entries.at(-1)!.effectiveAt = { year: 82, month: 5, day: 1 };
  assert.ok(
    validateScholarOfficialPursuitLedger({ schemaVersion: 1, entries: futureEffectiveLedger.entries })
      .some(message => /effective date|effectiveAt|生效日期/i.test(message)),
    'ledger validation must reject an appointment that takes effect after it was accepted',
  );

  assert.deepEqual(
    (exactBoundary.flags[CASE_LEDGER_KEY] as { entries: Array<{ decidedAt?: PursuitDate; effectiveAt?: PursuitDate }> })
      .entries.at(-1)?.effectiveAt,
    (exactBoundary.flags[CASE_LEDGER_KEY] as { entries: Array<{ decidedAt?: PursuitDate; effectiveAt?: PursuitDate }> })
      .entries.at(-1)?.decidedAt,
    'an appointment effective on its acceptance date remains legal',
  );
}

function testDeathAndTerminalStateRejectNewEntries(): void {
  const deadBeforeInvitation = makeState();
  deadBeforeInvitation.player.alive = false;
  assert.throws(
    () => invite(deadBeforeInvitation, { year: 1, month: 3, day: 1 }, 18),
    /death|dead|terminal|终局|死亡/i,
    'a dead character cannot record a new invitation response',
  );

  const accepted = invite(makeState(), { year: 1, month: 1, day: 1 }, 18);
  const deadBeforeExam = moveTo(accepted, { year: 1, month: 3, day: 1 });
  deadBeforeExam.player.alive = false;
  assert.throws(
    () => exam(deadBeforeExam, { year: 1, month: 2, day: 1 }, { year: 1, month: 3, day: 1 }, 'failed'),
    /death|dead|terminal|终局|死亡/i,
    'a dead character cannot record an exam',
  );

  const passed = exam(
    accepted,
    { year: 1, month: 2, day: 1 },
    { year: 1, month: 3, day: 1 },
    'passed',
  );
  const deadAfterPassing = moveTo(passed, { year: 1, month: 3, day: 1 });
  deadAfterPassing.player.alive = false;
  assert.throws(
    () => appendScholarOfficialPursuitEntry(deadAfterPassing, {
      type: 'abandon',
      date: { year: 1, month: 3, day: 1 },
    }),
    /death|dead|terminal|终局|死亡/i,
    'a dead character cannot abandon the pursuit',
  );
  assert.throws(
    () => appointment(
      deadAfterPassing,
      'appointment-after-death',
      { year: 1, month: 4, day: 1 },
      { year: 1, month: 4, day: 1 },
      'accepted',
      { year: 1, month: 4, day: 1 },
    ),
    /death|dead|terminal|终局|死亡/i,
    'passing an exam while alive does not permit accepting an appointment after death',
  );

  const terminal = moveTo(accepted, { year: 1, month: 3, day: 1 });
  terminal.ending = { id: 'test-ending', name: '终局', description: '测试终局', category: 'test' };
  assert.throws(
    () => appendScholarOfficialPursuitEntry(terminal, {
      type: 'abandon',
      date: { year: 1, month: 3, day: 1 },
    }),
    /death|dead|terminal|终局|死亡/i,
    'a terminal ending blocks new case decisions even if the player remains alive',
  );
}

function testTerminalProjectionPreservesTerminalOutcomes(): void {
  const accepted = invite(makeState(), { year: 1, month: 1, day: 1 }, 18);
  const activeTerminal = moveTo(accepted, { year: 1, month: 3, day: 1 });
  activeTerminal.ending = { id: 'terminal-active', name: '终局', description: '测试终局', category: 'test' };
  const unfinishedProjection = deriveScholarOfficialPursuit(activeTerminal);
  assert.equal(unfinishedProjection.status, 'terminal_unfinished');
  assert.equal(unfinishedProjection.canTakeExam, false);
  assert.equal(unfinishedProjection.canAbandon, false);

  const completedWhileAlive = appointment(
    exam(accepted, { year: 1, month: 2, day: 1 }, { year: 1, month: 3, day: 1 }, 'passed'),
    'completed-before-terminal',
    { year: 1, month: 4, day: 1 },
    { year: 1, month: 4, day: 1 },
    'accepted',
    { year: 1, month: 4, day: 1 },
  );
  const completedTerminal = moveTo(completedWhileAlive, { year: 1, month: 5, day: 1 });
  completedTerminal.ending = { id: 'terminal-completed', name: '终局', description: '测试终局', category: 'test' };
  assert.equal(deriveScholarOfficialPursuit(completedTerminal).status, 'completed');

  const abandoned = appendScholarOfficialPursuitEntry(moveTo(accepted, { year: 1, month: 3, day: 1 }), {
    type: 'abandon',
    date: { year: 1, month: 3, day: 1 },
  });
  const abandonedTerminal = moveTo(abandoned, { year: 1, month: 4, day: 1 });
  abandonedTerminal.ending = { id: 'terminal-abandoned', name: '终局', description: '测试终局', category: 'test' };
  assert.equal(deriveScholarOfficialPursuit(abandonedTerminal).status, 'abandoned');

  const noTargetTerminal = makeState();
  noTargetTerminal.ending = { id: 'terminal-no-target', name: '终局', description: '测试终局', category: 'test' };
  assert.equal(deriveScholarOfficialPursuit(noTargetTerminal).status, 'none');

  const declinedTerminal = invite(makeState(), { year: 1, month: 1, day: 1 }, 18, 'declined');
  declinedTerminal.ending = { id: 'terminal-declined', name: '终局', description: '测试终局', category: 'test' };
  assert.equal(deriveScholarOfficialPursuit(declinedTerminal).status, 'none');
  assert.equal(deriveScholarOfficialPursuit(declinedTerminal).invitationResponse, 'declined');
}

async function testDeathInvalidHistoryAndMirrorRules(): Promise<void> {
  const accepted = invite(makeState(), { year: 1, month: 1, day: 1 }, 18);
  const died = moveTo(accepted, { year: 1, month: 2, day: 1 });
  died.player.alive = false;
  assert.equal(deriveScholarOfficialPursuit(died).status, 'death_unfinished');

  const completedWhileAlive = appointment(
    exam(accepted, { year: 1, month: 2, day: 1 }, { year: 1, month: 3, day: 1 }, 'passed'),
    'completed-before-death',
    { year: 1, month: 4, day: 1 },
    { year: 1, month: 4, day: 1 },
    'accepted',
    { year: 1, month: 4, day: 1 },
  );
  const completedThenDied = moveTo(completedWhileAlive, { year: 1, month: 5, day: 1 });
  completedThenDied.player.alive = false;
  assert.equal(deriveScholarOfficialPursuit(completedThenDied).status, 'completed');

  const duplicateSequence = cloneCanonicalGameState(accepted);
  const ledger = duplicateSequence.flags[CASE_LEDGER_KEY] as { entries: Array<Record<string, unknown>> };
  ledger.entries.push({ ...ledger.entries[0], sequence: 1 });
  duplicateSequence.player.flags[CASE_LEDGER_KEY] = structuredClone(ledger);
  assert.ok(validateScholarOfficialPursuitLedger(ledger).some(message => /sequence/i.test(message)));
  assert.equal(deriveScholarOfficialPursuit(duplicateSequence).status, 'invalid');

  const invalidDateLedger = cloneCanonicalGameState(accepted);
  const invalidDate = invalidDateLedger.flags[CASE_LEDGER_KEY] as { entries: Array<Record<string, unknown>> };
  invalidDate.entries[0].date = { year: 1, month: 13, day: 1 };
  invalidDateLedger.player.flags[CASE_LEDGER_KEY] = structuredClone(invalidDate);
  assert.equal(deriveScholarOfficialPursuit(invalidDateLedger).status, 'invalid');

  const passed = exam(
    accepted,
    { year: 1, month: 2, day: 1 },
    { year: 1, month: 3, day: 1 },
    'passed',
  );
  const missingAuthority = cloneCanonicalGameState(passed);
  const missingAuthorityLedger = missingAuthority.flags[CASE_LEDGER_KEY] as { entries: Array<Record<string, unknown>> };
  missingAuthorityLedger.entries.push({
    sequence: 3,
    type: 'appointment_decision',
    opportunityId: 'missing-authority',
    offeredAt: { year: 1, month: 4, day: 1 },
    decidedAt: { year: 1, month: 4, day: 1 },
    officeId: 'prefect-assistant',
    authorityId: '',
    response: 'declined',
  });
  missingAuthority.currentTime = { year: 1, month: 4, day: 1 };
  missingAuthority.player.flags[CASE_LEDGER_KEY] = structuredClone(missingAuthorityLedger);
  assert.equal(deriveScholarOfficialPursuit(missingAuthority).status, 'invalid');

  const topLevelOnly = cloneCanonicalGameState(accepted);
  delete topLevelOnly.player.flags[CASE_LEDGER_KEY];
  const next = appendScholarOfficialPursuitEntry(moveTo(topLevelOnly, { year: 1, month: 3, day: 1 }), {
    type: 'exam_attempt',
    attemptNumber: 1,
    startedAt: { year: 1, month: 2, day: 1 },
    completedAt: { year: 1, month: 3, day: 1 },
    ageAtStart: 18,
    knowledgeAtStart: 20,
    rulesVersion: 'curve-a-v1',
    adoptedPassRate: 0.6,
    result: 'failed',
  });
  assert.deepEqual(next.flags[CASE_LEDGER_KEY], next.player.flags[CASE_LEDGER_KEY]);
  assert.equal(deriveScholarOfficialPursuit(next).examAttempts, 1);

  const playerOnly = cloneCanonicalGameState(accepted);
  delete playerOnly.flags[CASE_LEDGER_KEY];
  assert.equal(deriveScholarOfficialPursuit(playerOnly).status, 'invalid');
  assert.throws(() => new GameEngineIntegration().loadGameState(playerOnly), /state\.flags is the sole source/i);
  await assert.rejects(
    new EventExecutor().executeEffects([
      { type: EffectType.FLAG_SET, flag: 'unrelated_flag', value: true },
    ], playerOnly),
    /state\.flags is the sole source/i,
  );

  const mismatched = cloneCanonicalGameState(accepted);
  mismatched.player.flags[CASE_LEDGER_KEY] = { schemaVersion: 1, entries: [] };
  assert.equal(deriveScholarOfficialPursuit(mismatched).status, 'invalid');
  assert.throws(() => new GameEngineIntegration().loadGameState(mismatched), /deeply match/i);

  const oldSave = makeState();
  oldSave.flags.ordinary_flag = true;
  oldSave.player.flags.ordinary_flag = true;
  assert.doesNotThrow(() => new GameEngineIntegration().loadGameState(oldSave));
}

await testConflictingLedgerMirrorRejectsUnrelatedFlagSet();
await testConflictingLedgerMirrorRejectsUnrelatedFlagUnset();
await testMatchingLedgerMirrorSurvivesUnrelatedFlagWrites();
await testFlagEffectsCannotWriteOrDeleteTheProtectedLedger();
await testOrdinaryFlagsKeepTheirExistingMergeSemantics();
testInvitationAndDerivedEligibility();
testFailureCooldownUsesFullCalendarMonthsAndAllowsRepeatedAttempts();
testPassingExamBlocksAnotherExamAndAbandonKeepsQualification();
testDeathAndTerminalStateRejectNewEntries();
testAppointmentRequiresQualificationAndEnforcesOfferCooldown();
testTerminalProjectionPreservesTerminalOutcomes();
await testDeathInvalidHistoryAndMirrorRules();
console.log('✅ Scholar official pursuit tests passed');
