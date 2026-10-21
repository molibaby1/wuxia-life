import assert from 'node:assert/strict';
import { CHOICE_EXECUTION_REQUEST_VERSION } from '../../src/contracts/choiceExecution';
import { EventLoader } from '../../src/core/EventLoader';
import { GameEngineIntegration } from '../../src/core/GameEngineIntegration';
import { validateEventQuality } from '../../scripts/validateEventQuality';
import {
  appendScholarOfficialPursuitEntry,
  calculateScholarOfficialExamPassRate,
  deriveScholarOfficialPursuit,
  SCHOLAR_OFFICIAL_PURSUIT_ACCEPT_CHOICE_ID,
  SCHOLAR_OFFICIAL_PURSUIT_DECLINE_CHOICE_ID,
  SCHOLAR_OFFICIAL_PURSUIT_INVITATION_EVENT_ID,
  SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY,
} from '../../src/core/scholarOfficialPursuit';
import { HeadlessEngineSessionImpl } from '../../src/headless/session/HeadlessEngineSessionImpl';
import type { PursuitDate } from '../../src/core/scholarOfficialPursuit';
import type { RandomSource } from '../../src/headless/adapters/randomSource';

const INVITATION_EVENT_ID = SCHOLAR_OFFICIAL_PURSUIT_INVITATION_EVENT_ID;

function invitationSnapshot(age = 20, pending = true) {
  const bootstrap = HeadlessEngineSessionImpl.create({
    playerName: '求仕测试',
    gender: 'male',
    catalogVersion: '1.0.0',
    randomSeed: 29,
  });
  const snapshot = bootstrap.serialize();
  snapshot.state.player.age = age;
  snapshot.state.player.knowledge = 18;
  snapshot.state.currentTime = { year: 4, month: 5, day: 3 };
  if (pending) snapshot.state.pendingStoryEventId = INVITATION_EVENT_ID;
  else delete snapshot.state.pendingStoryEventId;
  return snapshot;
}

function invitationChoiceRequest(session: HeadlessEngineSessionImpl, choiceId: string) {
  return {
    requestVersion: CHOICE_EXECUTION_REQUEST_VERSION,
    snapshotRef: { snapshot: session.serialize() },
    action: { eventId: INVITATION_EVENT_ID, choiceId },
  };
}

function acceptedPursuitSnapshot(
  date: PursuitDate = { year: 4, month: 5, day: 3 },
  age = 20,
  knowledge = 20,
) {
  const snapshot = invitationSnapshot(age, false);
  snapshot.state.currentTime = { ...date };
  snapshot.state.player.knowledge = knowledge;
  const engine = new GameEngineIntegration();
  const state = engine.getGameState();
  state.currentTime = { ...date };
  state.player.age = age;
  state.player.knowledge = knowledge;
  const accepted = appendScholarOfficialPursuitEntry(state, {
    type: 'invitation_response',
    date: { ...date },
    age,
    sourceEventId: INVITATION_EVENT_ID,
    response: 'accepted',
  });
  snapshot.state.flags = structuredClone(accepted.flags);
  snapshot.state.player.flags = structuredClone(accepted.player.flags);
  return snapshot;
}

function countedRandom(value: number): { source: RandomSource; draws: () => number } {
  let draws = 0;
  return {
    source: { next: () => { draws += 1; return value; } },
    draws: () => draws,
  };
}

function availableInvitationAt(age: number, response?: 'accepted' | 'declined') {
  const engine = new GameEngineIntegration();
  let state = engine.getGameState();
  state.currentTime = { year: 4, month: 5, day: 3 };
  state.player.age = age;
  state.player.knowledge = 10;
  if (response) {
    state = appendScholarOfficialPursuitEntry(state, {
      type: 'invitation_response',
      date: { ...state.currentTime },
      age,
      sourceEventId: INVITATION_EVENT_ID,
      response,
    });
  }
  engine.loadGameState(state);
  return engine.getAvailableEvents(age).some(event => event.id === INVITATION_EVENT_ID);
}

export function runScholarOfficialPursuitBTests(): void {
  const invitation = EventLoader.getInstance().getEventById(INVITATION_EVENT_ID);
  assert.ok(invitation, 'the scholar pursuit invitation must be in the formal runtime catalog');
  assert.equal(invitation.priority, 2, 'the invitation must use ordinary scheduler priority');
  assert.equal(invitation.maxTriggers, 1, 'the invitation can occur at most once');
  assert.equal(invitation.choices?.length, 2, 'the invitation has explicit accept and decline choices');
  assert.deepEqual(
    invitation.choices?.map(choice => choice.effects ?? []),
    [[], []],
    'acceptance and refusal are ledger-backed choices, not writable flags or time effects',
  );

  const loadedEvents = EventLoader.getInstance().getAllEvents();
  const invitationQualityIssues = validateEventQuality(loadedEvents).issues
    .filter(issue => issue.eventId === INVITATION_EVENT_ID);
  assert.equal(
    invitationQualityIssues.some(issue => issue.issueType === 'empty_effects' || issue.issueType === 'unreachable_event'),
    false,
    'the formal ledger-backed invitation choices are executable without fabricated effects',
  );

  const ordinaryEmptyChoiceEvent = {
    ...invitation,
    id: 'ordinary_empty_effect_choice',
    choices: [{ id: 'ordinary_noop', text: 'No effect', effects: [] }],
  };
  const ordinaryEmptyChoiceIssues = validateEventQuality([ordinaryEmptyChoiceEvent]).issues
    .filter(issue => issue.issueType === 'empty_effects' || issue.issueType === 'unreachable_event');
  assert.deepEqual(
    ordinaryEmptyChoiceIssues.map(issue => issue.issueType).sort(),
    ['empty_effects', 'unreachable_event'],
    'an ordinary event with no legitimate state change remains blocked by quality validation',
  );
  assert.deepEqual(
    ordinaryEmptyChoiceIssues
      .map(issue => ({ issueType: issue.issueType, severity: issue.severity }))
      .sort((left, right) => left.issueType.localeCompare(right.issueType)),
    [
      { issueType: 'empty_effects', severity: 'major' },
      { issueType: 'unreachable_event', severity: 'blocker' },
    ],
    'ordinary empty effects retain their existing major warning and unreachable blocker severities',
  );

  const unverifiedInvitationChoiceEvent = {
    ...invitation,
    choices: invitation.choices!.map((choice, index) => index === 0
      ? { ...choice, id: 'unverified_scholar_pursuit_choice' }
      : choice),
  };
  const unverifiedInvitationChoiceIssues = validateEventQuality([unverifiedInvitationChoiceEvent]).issues;
  assert.deepEqual(
    unverifiedInvitationChoiceIssues
      .filter(issue => issue.issueType === 'empty_effects' || issue.issueType === 'unreachable_event')
      .map(issue => issue.issueType)
      .sort(),
    ['empty_effects', 'unreachable_event'],
    'the named invitation does not bypass quality checks if either choice leaves the verified write path',
  );

  const sourceProbe = {
    ...invitation,
    content: { ...invitation.content, text: '' },
  };
  const sourceIssue = validateEventQuality([sourceProbe]).issues
    .find(issue => issue.eventId === INVITATION_EVENT_ID && issue.issueType === 'empty_content');
  assert.equal(
    sourceIssue?.source,
    './lines/scholar-official-pursuit.json',
    'quality issues for the invitation identify the event line that owns its source data',
  );

  assert.equal(availableInvitationAt(16), true, 'age 16 is included');
  assert.equal(availableInvitationAt(30), true, 'age 30 is included');
  assert.equal(availableInvitationAt(15), false, 'age 15 is excluded');
  assert.equal(availableInvitationAt(31), false, 'age 31 is excluded');
  assert.equal(availableInvitationAt(20, 'accepted'), false, 'an accepted invitation cannot be offered again');
  assert.equal(availableInvitationAt(20, 'declined'), false, 'a declined invitation cannot be offered again');

  const priorState = new GameEngineIntegration().getGameState();
  priorState.currentTime = { year: 4, month: 5, day: 3 };
  priorState.player.age = 20;
  assert.equal(
    Object.hasOwn(priorState.flags, SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY),
    false,
    'a new life has no hidden scholar pursuit acceptance',
  );
}

export async function runScholarOfficialPursuitInvitationChoiceTests(): Promise<void> {
  const acceptedSession = HeadlessEngineSessionImpl.create({ snapshot: invitationSnapshot() });
  const dateBefore = { ...acceptedSession.getRuntimeState().currentTime! };
  const accepted = await acceptedSession.executeChoice(
    invitationChoiceRequest(acceptedSession, SCHOLAR_OFFICIAL_PURSUIT_ACCEPT_CHOICE_ID),
  );
  const acceptedLedger = accepted.nextSnapshot.state.flags[SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY] as {
    entries: Array<{ type: string; response?: string; sourceEventId?: string }>;
  };
  assert.equal(acceptedLedger.entries.length, 1, 'acceptance appends one authoritative invitation response');
  assert.equal(acceptedLedger.entries[0]?.type, 'invitation_response');
  assert.equal(acceptedLedger.entries[0]?.response, 'accepted');
  assert.equal(acceptedLedger.entries[0]?.sourceEventId, INVITATION_EVENT_ID);
  assert.deepEqual(accepted.nextSnapshot.state.currentTime, dateBefore, 'invitation response costs no game time');
  assert.equal(accepted.nextSnapshot.state.eventHistory.at(-1)?.eventId, INVITATION_EVENT_ID);

  await assert.rejects(
    acceptedSession.executeChoice(
      invitationChoiceRequest(acceptedSession, SCHOLAR_OFFICIAL_PURSUIT_ACCEPT_CHOICE_ID),
    ),
    /pending|stale|invitation|pursuit/i,
    'the same invitation choice cannot be replayed after acceptance',
  );

  const declinedSession = HeadlessEngineSessionImpl.create({ snapshot: invitationSnapshot() });
  const declined = await declinedSession.executeChoice(
    invitationChoiceRequest(declinedSession, SCHOLAR_OFFICIAL_PURSUIT_DECLINE_CHOICE_ID),
  );
  const declinedLedger = declined.nextSnapshot.state.flags[SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY] as {
    entries: Array<{ type: string; response?: string }>;
  };
  assert.equal(declinedLedger.entries.length, 1, 'refusal is recorded once');
  assert.equal(declinedLedger.entries[0]?.response, 'declined');
  assert.equal(
    new GameEngineIntegration().getGameState().flags[SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY],
    undefined,
    'another life is unaffected by this response',
  );

  const forgedSession = HeadlessEngineSessionImpl.create({ snapshot: invitationSnapshot(20, false) });
  await assert.rejects(
    forgedSession.executeChoice(
      invitationChoiceRequest(forgedSession, SCHOLAR_OFFICIAL_PURSUIT_ACCEPT_CHOICE_ID),
    ),
    /pending|stale|eligible|pursuit/i,
    'a catalog event ID alone cannot manufacture the pending invitation',
  );

  const staleChoiceSession = HeadlessEngineSessionImpl.create({ snapshot: invitationSnapshot() });
  await assert.rejects(
    staleChoiceSession.executeChoice(invitationChoiceRequest(staleChoiceSession, 'accept_official_route')),
    /choice|stale/i,
    'an unknown choice ID cannot create the target',
  );

  const directEngine = new GameEngineIntegration();
  directEngine.getGameState().player.age = 20;
  directEngine.getGameState().currentTime = { year: 4, month: 5, day: 3 };
  await assert.rejects(
    directEngine.executeChoiceEffects([], INVITATION_EVENT_ID, SCHOLAR_OFFICIAL_PURSUIT_ACCEPT_CHOICE_ID),
    /pending|eligible|pursuit|invitation/i,
    'the shared engine also rejects a forged invitation execution without a pending event',
  );

  const invitation = EventLoader.getInstance().getEventById(INVITATION_EVENT_ID)!;
  const scheduledEngine = new GameEngineIntegration({
    getAllEvents: () => [invitation],
    getEventsByAge: age => age >= 16 && age <= 30 ? [invitation] : [],
    getEventById: eventId => eventId === INVITATION_EVENT_ID ? invitation : undefined,
    getWeightForAge: () => invitation.weight,
  });
  const scheduledState = scheduledEngine.getGameState();
  scheduledState.player.age = 20;
  scheduledState.currentTime = { year: 4, month: 5, day: 3 };
  const scheduled = scheduledEngine.selectEvent(20);
  assert.equal(scheduled?.id, INVITATION_EVENT_ID, 'the ordinary scheduler can select the invitation');
  assert.equal(
    (scheduledState as typeof scheduledState & { pendingStoryEventId?: string }).pendingStoryEventId,
    INVITATION_EVENT_ID,
    'the formal producer marks its selected invitation as the real pending choice',
  );
  await scheduledEngine.executeChoiceEffects(
    scheduled?.choices?.[0]?.effects ?? [],
    INVITATION_EVENT_ID,
    SCHOLAR_OFFICIAL_PURSUIT_ACCEPT_CHOICE_ID,
  );
  assert.equal(deriveScholarOfficialPursuit(scheduledEngine.getGameState()).status, 'active');
  assert.equal(
    (scheduledEngine.getGameState() as typeof scheduledState & { pendingStoryEventId?: string }).pendingStoryEventId,
    undefined,
    'accepting the scheduled invitation consumes its pending marker',
  );
}

export async function runScholarOfficialPursuitExamActionTests(): Promise<void> {
  const random = countedRandom(0.1);
  const session = HeadlessEngineSessionImpl.create(
    { snapshot: acceptedPursuitSnapshot() },
    { random: random.source },
  );
  assert.equal(session.getSessionPhase(), 'active_planning');
  const execute = (session as unknown as {
    executeScholarOfficialPursuitAction(operation: unknown): Promise<void>;
  }).executeScholarOfficialPursuitAction.bind(session);
  const drawsBeforeExam = random.draws();
  const before = { ...session.getRuntimeState().currentTime! };
  await execute('take_exam');

  assert.equal(random.draws() - drawsBeforeExam, 1, 'one eligible exam uses one draw from the Headless session RNG');
  assert.equal(session.getSessionPhase(), 'action_summary', 'exam result must be confirmed before any next action');
  assert.deepEqual(session.getRuntimeState().currentTime, { year: 4, month: 6, day: 3 });
  assert.notDeepEqual(session.getRuntimeState().currentTime, before);
  const ledger = session.getRuntimeState().flags[SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY] as {
    entries: Array<{
      type: string;
      result?: string;
      attemptNumber?: number;
      startedAt?: PursuitDate;
      completedAt?: PursuitDate;
      ageAtStart?: number;
      knowledgeAtStart?: number;
      adoptedPassRate?: number;
      rulesVersion?: string;
    }>;
  };
  assert.equal(ledger.entries.length, 2, 'exam result is one append to the invitation ledger');
  assert.deepEqual(ledger.entries[1], {
    sequence: 2,
    type: 'exam_attempt',
    attemptNumber: 1,
    startedAt: before,
    completedAt: { year: 4, month: 6, day: 3 },
    ageAtStart: 20,
    knowledgeAtStart: 20,
    rulesVersion: 'curve-a-v1',
    adoptedPassRate: 0.25,
    result: 'passed',
  });
  assert.match(
    session.getProgressionVolatileState().pendingActionSummary?.resultExplanation ?? '',
    /合格/,
    'result feedback reports the actual pass outcome',
  );
  await assert.rejects(execute('take_exam'), /phase|eligible|available|action/i);
  assert.equal(random.draws() - drawsBeforeExam, 1, 'a second attempt cannot draw while the result is unconfirmed');
  await session.acknowledgeProgression('action_summary');
  assert.notEqual(session.getSessionPhase(), 'action_summary');
}

export function runScholarOfficialPursuitProbabilityTests(): void {
  const anchors: Array<[number, number]> = [
    [20, 0.25],
    [30, 0.4478079723786164],
    [40, 0.580402621529667],
    [60, 0.728862089203207],
  ];
  for (const [knowledge, expected] of anchors) {
    assert.ok(
      Math.abs(calculateScholarOfficialExamPassRate(knowledge) - expected) < 1e-12,
      `knowledge ${knowledge} follows curve-a-v1`,
    );
  }
  let priorRate = 0;
  for (let knowledge = 20; knowledge <= 200; knowledge += 1) {
    const rate = calculateScholarOfficialExamPassRate(knowledge);
    assert.ok(rate > 0 && rate < 1 && rate <= 0.85, 'probability remains bounded below 1 and at or below 0.85');
    assert.ok(rate >= priorRate, 'probability is monotonic across the eligible knowledge range');
    priorRate = rate;
  }
  assert.throws(() => calculateScholarOfficialExamPassRate(19), /knowledge/i);
  assert.throws(() => calculateScholarOfficialExamPassRate(Number.NaN), /knowledge/i);
}

function failedExamSnapshot(): ReturnType<typeof invitationSnapshot> {
  const startedAt = { year: 4, month: 5, day: 3 };
  const completedAt = { year: 4, month: 6, day: 3 };
  const snapshot = acceptedPursuitSnapshot(startedAt, 20, 20);
  const engine = new GameEngineIntegration();
  const state = engine.getGameState();
  state.currentTime = { ...completedAt };
  state.player.age = 20;
  const accepted = snapshot.state.flags[SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY] as unknown;
  state.flags[SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY] = structuredClone(accepted);
  state.player.flags[SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY] = structuredClone(accepted);
  const failed = appendScholarOfficialPursuitEntry(state, {
    type: 'exam_attempt',
    attemptNumber: 1,
    startedAt,
    completedAt,
    ageAtStart: 20,
    knowledgeAtStart: 20,
    rulesVersion: 'curve-a-v1',
    adoptedPassRate: 0.25,
    result: 'failed',
  });
  snapshot.state.currentTime = { ...completedAt };
  snapshot.state.flags = structuredClone(failed.flags);
  snapshot.state.player.age = 20;
  snapshot.state.player.flags = structuredClone(failed.player.flags);
  return snapshot;
}

function passedExamSnapshot(): ReturnType<typeof invitationSnapshot> {
  const snapshot = failedExamSnapshot();
  const ledger = structuredClone(snapshot.state.flags[SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY]) as {
    entries: Array<Record<string, unknown>>;
  };
  ledger.entries[1] = { ...ledger.entries[1], result: 'passed' };
  snapshot.state.flags[SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY] = structuredClone(ledger);
  snapshot.state.player.flags[SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY] = structuredClone(ledger);
  return snapshot;
}

export async function runScholarOfficialPursuitEligibilityAndCooldownTests(): Promise<void> {
  for (const [age, knowledge] of [[17, 20], [20, 19]] as const) {
    const random = countedRandom(0.1);
    const session = HeadlessEngineSessionImpl.create(
      { snapshot: acceptedPursuitSnapshot({ year: 4, month: 5, day: 3 }, age, knowledge) },
      { random: random.source },
    );
    const drawsBefore = random.draws();
    const before = { ...session.getRuntimeState().currentTime! };
    await assert.rejects(
      session.executeScholarOfficialPursuitAction('take_exam'),
      /eligible|available/i,
    );
    assert.deepEqual(session.getRuntimeState().currentTime, before, 'ineligible exam does not advance time');
    assert.equal(random.draws() - drawsBefore, 0, 'ineligible exam does not consume an RNG draw');
  }

  const noPursuitRandom = countedRandom(0.1);
  const noPursuit = HeadlessEngineSessionImpl.create(
    { snapshot: invitationSnapshot(20, false) },
    { random: noPursuitRandom.source },
  );
  const noPursuitDrawsBefore = noPursuitRandom.draws();
  await assert.rejects(noPursuit.executeScholarOfficialPursuitAction('take_exam'), /eligible|available/i);
  assert.equal(noPursuitRandom.draws() - noPursuitDrawsBefore, 0, 'no accepted pursuit cannot roll an exam');

  const failed = failedExamSnapshot();
  failed.state.currentTime = { year: 5, month: 5, day: 3 };
  failed.state.player.age = 21;
  assert.equal(deriveScholarOfficialPursuit(failed.state).canTakeExam, false,
    'eleven complete months after failure is still inside cooldown');
  const cooldownRandom = countedRandom(0.1);
  const cooldownSession = HeadlessEngineSessionImpl.create({ snapshot: failed }, { random: cooldownRandom.source });
  const cooldownBefore = cooldownRandom.draws();
  const cooldownDate = { ...cooldownSession.getRuntimeState().currentTime! };
  await assert.rejects(cooldownSession.executeScholarOfficialPursuitAction('take_exam'), /eligible|available/i);
  assert.deepEqual(cooldownSession.getRuntimeState().currentTime, cooldownDate);
  assert.equal(cooldownRandom.draws() - cooldownBefore, 0, 'cooldown rejection does not consume time or RNG');

  failed.state.currentTime = { year: 5, month: 6, day: 3 };
  failed.state.player.age = 21;
  assert.equal(deriveScholarOfficialPursuit(failed.state).canTakeExam, true,
    'exactly twelve complete months after failure permits another attempt');
  const retryRandom = countedRandom(0.1);
  const retrySession = HeadlessEngineSessionImpl.create({ snapshot: failed }, { random: retryRandom.source });
  const retryDrawsBefore = retryRandom.draws();
  await retrySession.executeScholarOfficialPursuitAction('take_exam');
  const retryLedger = retrySession.getRuntimeState().flags[SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY] as {
    entries: Array<{ type: string; attemptNumber?: number; result?: string; startedAt?: PursuitDate }>;
  };
  assert.equal(retryLedger.entries.filter(entry => entry.type === 'exam_attempt').length, 2);
  assert.deepEqual(retryLedger.entries[2]?.startedAt, { year: 5, month: 6, day: 3 });
  assert.equal(retryLedger.entries[2]?.attemptNumber, 2);
  assert.equal(retryLedger.entries[2]?.result, 'passed', 'a later eligible exam may pass after an earlier failure');
  assert.equal(retryRandom.draws() - retryDrawsBefore, 1, 'the eligible retry consumes exactly one exam draw');
}

export async function runScholarOfficialPursuitAbandonTests(): Promise<void> {
  const random = countedRandom(0.1);
  const session = HeadlessEngineSessionImpl.create(
    { snapshot: acceptedPursuitSnapshot() },
    { random: random.source },
  );
  const drawsBefore = random.draws();
  const dateBefore = { ...session.getRuntimeState().currentTime! };
  await session.executeScholarOfficialPursuitAction('abandon');
  const state = session.getRuntimeState();
  const ledger = state.flags[SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY] as {
    entries: Array<{ type: string }>;
  };
  assert.deepEqual(ledger.entries.map(entry => entry.type), ['invitation_response', 'abandon']);
  assert.equal(deriveScholarOfficialPursuit(state).status, 'abandoned');
  assert.deepEqual(state.currentTime, dateBefore, 'abandon costs no time');
  assert.equal(random.draws() - drawsBefore, 0, 'abandon consumes no exam or scheduler draw');
  await assert.rejects(session.executeScholarOfficialPursuitAction('abandon'), /eligible|available/i);
  assert.equal(random.draws() - drawsBefore, 0, 'repeat abandon is rejected without RNG use');

  const afterPass = passedExamSnapshot();
  afterPass.state.currentTime = { year: 5, month: 6, day: 3 };
  afterPass.state.player.age = 21;
  assert.equal(deriveScholarOfficialPursuit(afterPass.state).canTakeExam, false,
    'qualification permanently closes the exam path even after time passes');
  const qualifiedRandom = countedRandom(0.1);
  const qualifiedSession = HeadlessEngineSessionImpl.create({ snapshot: afterPass }, { random: qualifiedRandom.source });
  const qualifiedDrawsBefore = qualifiedRandom.draws();
  await assert.rejects(qualifiedSession.executeScholarOfficialPursuitAction('take_exam'), /eligible|available/i);
  assert.equal(qualifiedRandom.draws() - qualifiedDrawsBefore, 0, 'a qualified pursuit cannot consume another exam draw');

  const postPassRandom = countedRandom(0.1);
  const postPassSession = HeadlessEngineSessionImpl.create({ snapshot: afterPass }, { random: postPassRandom.source });
  const postPassDrawsBefore = postPassRandom.draws();
  const postPassDate = { ...postPassSession.getRuntimeState().currentTime! };
  await postPassSession.executeScholarOfficialPursuitAction('abandon');
  const postPassLedger = postPassSession.getRuntimeState().flags[SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY] as {
    entries: Array<{ type: string; result?: string }>;
  };
  assert.equal(postPassLedger.entries[1]?.result, 'passed', 'abandon preserves the exam result');
  assert.equal(postPassLedger.entries[2]?.type, 'abandon');
  assert.deepEqual(postPassSession.getRuntimeState().currentTime, postPassDate);
  assert.equal(postPassRandom.draws() - postPassDrawsBefore, 0, 'post-qualification abandon is zero-time and zero-RNG');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runScholarOfficialPursuitBTests();
  await runScholarOfficialPursuitInvitationChoiceTests();
  await runScholarOfficialPursuitExamActionTests();
  runScholarOfficialPursuitProbabilityTests();
  await runScholarOfficialPursuitEligibilityAndCooldownTests();
  await runScholarOfficialPursuitAbandonTests();
  console.log('scholarOfficialPursuitB.test.ts: ok');
}
