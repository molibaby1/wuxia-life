import assert from 'node:assert/strict';
import { CHOICE_EXECUTION_REQUEST_VERSION } from '../../src/contracts/choiceExecution';
import { cloneCanonicalGameState } from '../../src/contracts/validation/canonicalGameStateValidation';
import { EventLoader } from '../../src/core/EventLoader';
import { GameEngineIntegration } from '../../src/core/GameEngineIntegration';
import { validateEventQuality } from '../../scripts/validateEventQuality';
import {
  appendScholarOfficialPursuitEntry,
  deriveScholarOfficialPursuit,
  isScholarOfficialAppointmentEligible,
  SCHOLAR_OFFICIAL_APPOINTMENT_ACCEPT_CHOICE_ID,
  SCHOLAR_OFFICIAL_APPOINTMENT_AUTHORITY_ID,
  SCHOLAR_OFFICIAL_APPOINTMENT_DECLINE_CHOICE_ID,
  SCHOLAR_OFFICIAL_APPOINTMENT_EVENT_ID,
  SCHOLAR_OFFICIAL_APPOINTMENT_OFFICE_ID,
  SCHOLAR_OFFICIAL_PURSUIT_INVITATION_EVENT_ID,
  SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY,
  type PursuitDate,
} from '../../src/core/scholarOfficialPursuit';
import { InMemoryEventCatalogAdapter } from '../../src/headless/catalog/InMemoryEventCatalogAdapter';
import { HeadlessEngineSessionImpl } from '../../src/headless/session/HeadlessEngineSessionImpl';
import { EventPriority, type EventDefinition, type GameState } from '../../src/types/eventTypes';

function moveTo(state: GameState, date: PursuitDate, age = state.player.age, knowledge = state.player.knowledge): GameState {
  return {
    ...state,
    currentTime: { ...date },
    player: { ...state.player, age, knowledge },
  };
}

function createState(age = 20, knowledge = 20): GameState {
  const state = new GameEngineIntegration().getGameState();
  state.currentTime = { year: 1, month: 1, day: 1 };
  state.player.age = age;
  state.player.knowledge = knowledge;
  return state;
}

function createQualifiedState(age = 20, knowledge = 20): GameState {
  let state = createState(age, knowledge);
  state = appendScholarOfficialPursuitEntry(state, {
    type: 'invitation_response',
    date: { year: 1, month: 1, day: 1 },
    age,
    sourceEventId: SCHOLAR_OFFICIAL_PURSUIT_INVITATION_EVENT_ID,
    response: 'accepted',
  });
  state = moveTo(state, { year: 1, month: 3, day: 1 });
  return appendScholarOfficialPursuitEntry(state, {
    type: 'exam_attempt',
    attemptNumber: 1,
    startedAt: { year: 1, month: 2, day: 1 },
    completedAt: { year: 1, month: 3, day: 1 },
    ageAtStart: age,
    knowledgeAtStart: Math.max(20, knowledge),
    rulesVersion: 'curve-a-v1',
    adoptedPassRate: 0.6,
    result: 'passed',
  });
}

function addAppointmentDecision(
  state: GameState,
  date: PursuitDate,
  response: 'accepted' | 'declined',
  opportunityId: string,
): GameState {
  return appendScholarOfficialPursuitEntry(moveTo(state, date), {
    type: 'appointment_decision',
    opportunityId,
    offeredAt: { ...date },
    decidedAt: { ...date },
    officeId: 'zhoufu_sihu_canjun',
    authorityId: 'court_selection_authority',
    response,
    ...(response === 'accepted' ? { effectiveAt: { ...date } } : {}),
  });
}

function repeatedlyDeclinedQualifiedState(): GameState {
  let state = createQualifiedState();
  let decisionDate: PursuitDate = { year: 1, month: 4, day: 1 };
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    if (attempt > 1) decisionDate = { year: decisionDate.year + 2, month: 4, day: 1 };
    state = addAppointmentDecision(
      moveTo(state, decisionDate, 20 + (attempt - 1) * 2),
      decisionDate,
      'declined',
      `refusal-${attempt}`,
    );
  }
  const eligibleAt = { year: decisionDate.year + 2, month: decisionDate.month, day: decisionDate.day };
  state = moveTo(state, eligibleAt, 28, 0);
  state.eventHistory = [
    { eventId: SCHOLAR_OFFICIAL_APPOINTMENT_EVENT_ID, age: 20, timestamp: { year: 1, month: 4, day: 1 } },
    { eventId: SCHOLAR_OFFICIAL_APPOINTMENT_EVENT_ID, age: 22, timestamp: { year: 3, month: 4, day: 1 } },
    { eventId: SCHOLAR_OFFICIAL_APPOINTMENT_EVENT_ID, age: 24, timestamp: { year: 5, month: 4, day: 1 } },
    { eventId: SCHOLAR_OFFICIAL_APPOINTMENT_EVENT_ID, age: 26, timestamp: { year: 7, month: 4, day: 1 } },
  ];
  return state;
}

function createCompetitionCatalog(events: EventDefinition[]) {
  const loader = EventLoader.getInstance();
  return {
    getAllEvents: () => events,
    getEventsByAge: () => events,
    getEventById: (id: string) => events.find(event => event.id === id),
    getWeightForAge: (event: EventDefinition, age: number) => event.id === SCHOLAR_OFFICIAL_APPOINTMENT_EVENT_ID
      ? loader.getWeightForAge(loader.getEventById(SCHOLAR_OFFICIAL_APPOINTMENT_EVENT_ID)!, age)
      : event.weight ?? 0,
  };
}

function selectWithRandom(engine: GameEngineIntegration, age: number, value: number): EventDefinition | null {
  const originalRandom = Math.random;
  Math.random = () => value;
  try {
    return engine.selectEvent(age);
  } finally {
    Math.random = originalRandom;
  }
}

function appointmentSession(abandoned = false) {
  let state = createQualifiedState();
  if (abandoned) {
    const date = { year: 1, month: 4, day: 1 };
    state = appendScholarOfficialPursuitEntry(moveTo(state, date), { type: 'abandon', date });
  }
  const date = { year: 8, month: 7, day: 1 };
  state = moveTo(state, date, 35, 0);

  const bootstrap = HeadlessEngineSessionImpl.create({
    playerName: '州府补缺测试',
    gender: 'male',
    catalogVersion: '1.0.0',
    randomSeed: 41,
  });
  const snapshot = bootstrap.serialize();
  snapshot.state.currentTime = { ...date };
  snapshot.state.player.age = 35;
  snapshot.state.player.knowledge = 0;
  snapshot.state.player.alive = true;
  snapshot.state.flags = JSON.parse(JSON.stringify(state.flags));
  snapshot.state.player.flags = JSON.parse(JSON.stringify(state.player.flags));
  snapshot.state.eventHistory = JSON.parse(JSON.stringify(state.eventHistory));
  delete snapshot.state.pendingStoryEventId;

  const event = EventLoader.getInstance().getEventById(SCHOLAR_OFFICIAL_APPOINTMENT_EVENT_ID)!;
  const runtimeCatalog = createCompetitionCatalog([event]);
  return HeadlessEngineSessionImpl.create(
    { snapshot },
    {
      runtimeCatalog,
      catalog: new InMemoryEventCatalogAdapter(runtimeCatalog),
    },
  );
}

async function selectAppointment(session: HeadlessEngineSessionImpl) {
  const next = await session.getNextEvent({ afterActionConfirmation: true });
  assert.equal(next?.eventId, SCHOLAR_OFFICIAL_APPOINTMENT_EVENT_ID,
    'the formal Scheduler can produce the appointment as a real pending event');
  assert.equal(session.getSessionPhase(), 'story_event', 'the appointment enters the formal story-event phase');
  const pendingSnapshot = session.serialize();
  assert.equal(pendingSnapshot.state.pendingStoryEventId, SCHOLAR_OFFICIAL_APPOINTMENT_EVENT_ID,
    'the scheduled event remains the authoritative pending choice');
  return pendingSnapshot;
}

async function executeAppointmentChoice(
  session: HeadlessEngineSessionImpl,
  snapshot: ReturnType<HeadlessEngineSessionImpl['serialize']>,
  choiceId: string,
) {
  return session.executeChoice({
    requestVersion: CHOICE_EXECUTION_REQUEST_VERSION,
    snapshotRef: { snapshot },
    action: { eventId: SCHOLAR_OFFICIAL_APPOINTMENT_EVENT_ID, choiceId },
  });
}

export function runScholarOfficialPursuitCTests(): void {
  const notInvited = createState();
  assert.equal(isScholarOfficialAppointmentEligible(notInvited), false,
    'old route flags or attributes alone cannot create a C-stage qualification');

  const declinedInvitation = appendScholarOfficialPursuitEntry(createState(), {
    type: 'invitation_response',
    date: { year: 1, month: 1, day: 1 },
    age: 20,
    sourceEventId: SCHOLAR_OFFICIAL_PURSUIT_INVITATION_EVENT_ID,
    response: 'declined',
  });
  assert.equal(isScholarOfficialAppointmentEligible(declinedInvitation), false,
    'declining the initial invitation does not create exam qualification');

  let failed = createState();
  failed = appendScholarOfficialPursuitEntry(failed, {
    type: 'invitation_response',
    date: { year: 1, month: 1, day: 1 },
    age: 20,
    sourceEventId: SCHOLAR_OFFICIAL_PURSUIT_INVITATION_EVENT_ID,
    response: 'accepted',
  });
  failed = appendScholarOfficialPursuitEntry(moveTo(failed, { year: 1, month: 3, day: 1 }), {
    type: 'exam_attempt',
    attemptNumber: 1,
    startedAt: { year: 1, month: 2, day: 1 },
    completedAt: { year: 1, month: 3, day: 1 },
    ageAtStart: 20,
    knowledgeAtStart: 20,
    rulesVersion: 'curve-a-v1',
    adoptedPassRate: 0.6,
    result: 'failed',
  });
  assert.equal(isScholarOfficialAppointmentEligible(failed), false,
    'a failed exam does not grant appointment eligibility');

  const qualified = createQualifiedState();
  assert.equal(isScholarOfficialAppointmentEligible(qualified), true,
    'a current passing exam grants appointment eligibility');
  const olderAndLessKnowledgeable = moveTo(qualified, { year: 8, month: 7, day: 1 }, 70, 0);
  assert.equal(isScholarOfficialAppointmentEligible(olderAndLessKnowledgeable), true,
    'qualification survives later age and knowledge changes');

  const abandoned = appendScholarOfficialPursuitEntry(
    moveTo(qualified, { year: 1, month: 4, day: 1 }),
    { type: 'abandon', date: { year: 1, month: 4, day: 1 } },
  );
  assert.equal(isScholarOfficialAppointmentEligible(abandoned), true,
    'a passed exam remains eligible after the player abandons the objective');

  const declinedAt = { year: 1, month: 4, day: 1 };
  const declinedOnce = addAppointmentDecision(qualified, declinedAt, 'declined', 'first');
  assert.equal(isScholarOfficialAppointmentEligible(moveTo(declinedOnce, { year: 3, month: 3, day: 1 }, 22)), false,
    '23 complete months after refusal is still inside the cooldown');
  assert.equal(isScholarOfficialAppointmentEligible(moveTo(declinedOnce, { year: 3, month: 4, day: 1 }, 22)), true,
    'the exact 24-month boundary restores candidacy');

  let repeatedDeclines = declinedOnce;
  let refusedAt = declinedAt;
  for (let attempt = 2; attempt <= 4; attempt += 1) {
    const eligibleAt = {
      year: refusedAt.year + 2,
      month: refusedAt.month,
      day: refusedAt.day,
    };
    assert.equal(isScholarOfficialAppointmentEligible(moveTo(repeatedDeclines, eligibleAt, 20 + attempt * 2)), true,
      `the ${attempt}th opportunity can become eligible after a full 24 months`);
    repeatedDeclines = addAppointmentDecision(
      moveTo(repeatedDeclines, eligibleAt, 20 + attempt * 2),
      eligibleAt,
      'declined',
      `refusal-${attempt}`,
    );
    refusedAt = eligibleAt;
  }

  const accepted = addAppointmentDecision(qualified, { year: 1, month: 4, day: 1 }, 'accepted', 'accepted-once');
  assert.equal(isScholarOfficialAppointmentEligible(accepted), false,
    'an already accepted appointment ends this case eligibility');

  const dead = moveTo(qualified, { year: 1, month: 4, day: 1 });
  dead.player.alive = false;
  assert.equal(isScholarOfficialAppointmentEligible(dead), false,
    'death closes new appointment eligibility');
  const terminal = moveTo(qualified, { year: 1, month: 4, day: 1 });
  terminal.ending = { type: 'natural', age: terminal.player.age } as GameState['ending'];
  assert.equal(isScholarOfficialAppointmentEligible(terminal), false,
    'a formal ending closes new appointment eligibility');

  const loader = EventLoader.getInstance();
  const appointmentEvent = loader.getEventById(SCHOLAR_OFFICIAL_APPOINTMENT_EVENT_ID);
  assert.ok(appointmentEvent, 'the formal appointment event is registered in the runtime catalog');
  assert.equal(appointmentEvent.priority, EventPriority.NORMAL, 'the appointment remains an ordinary event');
  assert.equal(appointmentEvent.maxTriggers, undefined, 'the appointment does not declare a lifetime trigger cap');
  assert.equal(appointmentEvent.metadata?.tags?.includes('once'), false, 'the appointment is not marked once-only');
  const appointmentQualityIssues = validateEventQuality(EventLoader.getInstance().getAllEvents()).issues
    .filter(issue => issue.eventId === SCHOLAR_OFFICIAL_APPOINTMENT_EVENT_ID);
  assert.deepEqual(
    appointmentQualityIssues.filter(issue => issue.issueType === 'empty_effects' || issue.issueType === 'unreachable_event'),
    [],
    'the exact appointment choices are accepted only because the guarded engine producer writes the case ledger',
  );
  const malformedAppointment = {
    ...appointmentEvent,
    choices: appointmentEvent.choices!.map((choice, index) => index === 0
      ? { ...choice, id: 'unverified_zhoufu_choice' }
      : choice),
  };
  assert.deepEqual(
    validateEventQuality([malformedAppointment]).issues
      .filter(issue => issue.issueType === 'empty_effects' || issue.issueType === 'unreachable_event')
      .map(issue => issue.issueType)
      .sort(),
    ['empty_effects', 'unreachable_event'],
    'the C-stage quality allowance closes if either fixed choice leaves the ledger producer path',
  );
  assert.deepEqual(
    validateEventQuality([{
      ...appointmentEvent,
      id: 'ordinary_empty_effect_event',
    }]).issues
      .filter(issue => issue.issueType === 'empty_effects' || issue.issueType === 'unreachable_event')
      .map(issue => issue.issueType)
      .sort(),
    ['empty_effects', 'unreachable_event'],
    'ordinary empty-effect events remain blocked by event quality validation',
  );
  for (const age of [35, 50, 70]) {
    assert(loader.getWeightForAge(appointmentEvent, age) > 0,
      `the formal catalog retains positive age weight at age ${age}`);
    assert(loader.getEventsByAge(age).some(event => event.id === SCHOLAR_OFFICIAL_APPOINTMENT_EVENT_ID),
      `the formal catalog keeps the appointment candidate at age ${age}`);
    const agedState = moveTo(qualified, { year: 8, month: 7, day: 1 }, age, 0);
    const engine = new GameEngineIntegration();
    engine.loadGameState(agedState);
    assert(engine.getAvailableEvents(age).some(event => event.id === SCHOLAR_OFFICIAL_APPOINTMENT_EVENT_ID),
      `a qualified living player aged ${age} remains a Scheduler candidate`);
  }

  const repeated = repeatedlyDeclinedQualifiedState();
  const appointmentWithOrdinaryCap = { ...appointmentEvent, maxTriggers: 1 };
  const competingEvent: EventDefinition = {
    ...appointmentEvent,
    id: 'ordinary_formal_competitor',
    weight: 50,
    ageRange: { min: 0, max: 99 },
    maxTriggers: undefined,
    choices: [{ id: 'continue_competing_event', text: 'Continue', effects: [] }],
    metadata: { ...appointmentEvent.metadata, tags: ['ordinary'] },
  };
  const competitionCatalog = createCompetitionCatalog([appointmentWithOrdinaryCap, competingEvent]);
  const appointmentScheduler = new GameEngineIntegration(competitionCatalog);
  appointmentScheduler.loadGameState(repeated);
  assert(appointmentScheduler.getAvailableEvents(28).some(event => event.id === SCHOLAR_OFFICIAL_APPOINTMENT_EVENT_ID),
    'the case-specific 24-month rule replaces the ordinary maxTriggers and cooldown filters');
  assert.equal(
    selectWithRandom(appointmentScheduler, 28, 0)?.id,
    SCHOLAR_OFFICIAL_APPOINTMENT_EVENT_ID,
    'the appointment remains reachable at the first end of a real multi-candidate weighted draw',
  );

  const reverseCatalog = createCompetitionCatalog([competingEvent, appointmentWithOrdinaryCap]);
  const reverseScheduler = new GameEngineIntegration(reverseCatalog);
  reverseScheduler.loadGameState(repeated);
  assert.equal(
    selectWithRandom(reverseScheduler, 28, 0.999)?.id,
    SCHOLAR_OFFICIAL_APPOINTMENT_EVENT_ID,
    'the appointment has positive weight when competing with another eligible formal event',
  );

  assert.equal(
    Object.hasOwn(createState().flags, SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY),
    false,
    'eligibility checks do not invent a case ledger for unrelated lives',
  );
}

export async function runScholarOfficialPursuitCChoiceTests(): Promise<void> {
  const event = EventLoader.getInstance().getEventById(SCHOLAR_OFFICIAL_APPOINTMENT_EVENT_ID);
  assert.ok(event, 'the appointment event is present before choice execution');
  assert.deepEqual(event.choices?.map(choice => choice.id), [
    SCHOLAR_OFFICIAL_APPOINTMENT_ACCEPT_CHOICE_ID,
    SCHOLAR_OFFICIAL_APPOINTMENT_DECLINE_CHOICE_ID,
  ], 'the appointment exposes only its two stable decisions');

  const acceptedSession = appointmentSession();
  const acceptedBefore = acceptedSession.getRuntimeState().currentTime;
  const acceptedPending = await selectAppointment(acceptedSession);
  const accepted = await executeAppointmentChoice(
    acceptedSession,
    acceptedPending,
    SCHOLAR_OFFICIAL_APPOINTMENT_ACCEPT_CHOICE_ID,
  );
  assert.equal(accepted.status, 'success');
  assert.deepEqual(accepted.nextSnapshot.state.currentTime, acceptedBefore,
    'acceptance and its immediate effective date do not advance time');
  const acceptedLedger = accepted.nextSnapshot.state.flags[SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY] as {
    entries: Array<Record<string, unknown>>;
  };
  const acceptedDecision = acceptedLedger.entries.at(-1)!;
  assert.equal(acceptedLedger.entries.length, 3, 'acceptance appends exactly one appointment fact');
  assert.equal(acceptedDecision.type, 'appointment_decision');
  assert.equal(acceptedDecision.response, 'accepted');
  assert.deepEqual(acceptedDecision.offeredAt, acceptedBefore, 'the recorded offer date is the actual pending-event date');
  assert.deepEqual(acceptedDecision.decidedAt, acceptedBefore, 'the decision is recorded on the choice date');
  assert.deepEqual(acceptedDecision.effectiveAt, acceptedBefore, 'the appointment is effective on acceptance');
  assert.equal(acceptedDecision.officeId, SCHOLAR_OFFICIAL_APPOINTMENT_OFFICE_ID);
  assert.equal(acceptedDecision.authorityId, SCHOLAR_OFFICIAL_APPOINTMENT_AUTHORITY_ID);
  assert.match(String(acceptedDecision.opportunityId), /^p138_zhoufu_vacancy:/,
    'the opportunity id is generated by the authoritative event producer');
  assert.deepEqual(
    accepted.nextSnapshot.state.flags[SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY],
    accepted.nextSnapshot.state.player.flags[SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY],
    'the appointment ledger remains the only authoritative fact with its compatibility mirror synchronized',
  );
  assert.equal(deriveScholarOfficialPursuit(acceptedSession.getRuntimeState()).status, 'completed',
    'acceptance completes the still-active objective');
  const restoredAccepted = HeadlessEngineSessionImpl.create({ snapshot: accepted.nextSnapshot });
  assert.equal(deriveScholarOfficialPursuit(restoredAccepted.getRuntimeState()).status, 'completed',
    'the accepted appointment and completed objective survive Snapshot restoration');
  await assert.rejects(
    executeAppointmentChoice(acceptedSession, accepted.nextSnapshot, SCHOLAR_OFFICIAL_APPOINTMENT_ACCEPT_CHOICE_ID),
    /pending|stale|eligible|appointment/i,
    'a completed appointment cannot be replayed through a stale choice',
  );

  const declinedSession = appointmentSession();
  const declinedPending = await selectAppointment(declinedSession);
  const declined = await executeAppointmentChoice(
    declinedSession,
    declinedPending,
    SCHOLAR_OFFICIAL_APPOINTMENT_DECLINE_CHOICE_ID,
  );
  assert.equal(declined.status, 'success');
  assert.deepEqual(declined.nextSnapshot.state.currentTime, acceptedBefore,
    'refusal also has zero time cost');
  const declinedLedger = declined.nextSnapshot.state.flags[SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY] as {
    entries: Array<Record<string, unknown>>;
  };
  const declinedDecision = declinedLedger.entries.at(-1)!;
  assert.equal(declinedLedger.entries.length, 3, 'refusal appends exactly one appointment fact');
  assert.equal(declinedDecision.response, 'declined');
  assert.equal(Object.hasOwn(declinedDecision, 'effectiveAt'), false,
    'a refused appointment has no effective date');
  assert.equal(deriveScholarOfficialPursuit(declinedSession.getRuntimeState()).status, 'active',
    'refusal retains an active exam-qualified pursuit');

  const abandonedSession = appointmentSession(true);
  const abandonedPending = await selectAppointment(abandonedSession);
  const abandonedAccepted = await executeAppointmentChoice(
    abandonedSession,
    abandonedPending,
    SCHOLAR_OFFICIAL_APPOINTMENT_ACCEPT_CHOICE_ID,
  );
  assert.equal(deriveScholarOfficialPursuit(abandonedSession.getRuntimeState()).status, 'abandoned',
    'world appointment after abandonment does not retroactively complete the objective');
  const abandonedLedger = abandonedAccepted.nextSnapshot.state.flags[SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY] as {
    entries: Array<Record<string, unknown>>;
  };
  assert.equal(abandonedLedger.entries.at(-1)?.response, 'accepted');

  const forgedEngine = new GameEngineIntegration();
  const forgedState = moveTo(createQualifiedState(), { year: 8, month: 7, day: 1 }, 35, 0);
  forgedEngine.loadGameState(forgedState);
  const beforeForgery = cloneCanonicalGameState(forgedEngine.getGameState());
  await assert.rejects(
    forgedEngine.executeChoiceEffects([], SCHOLAR_OFFICIAL_APPOINTMENT_EVENT_ID,
      SCHOLAR_OFFICIAL_APPOINTMENT_ACCEPT_CHOICE_ID),
    /pending|eligible|appointment/i,
    'a caller cannot forge appointment settlement by passing an event id alone',
  );
  assert.deepEqual(forgedEngine.getGameState(), beforeForgery,
    'a forged appointment event leaves the authoritative game state unchanged');

  const forgedSession = appointmentSession();
  const noPending = forgedSession.serialize();
  await assert.rejects(
    executeAppointmentChoice(forgedSession, noPending, SCHOLAR_OFFICIAL_APPOINTMENT_ACCEPT_CHOICE_ID),
    /pending|stale|eligible|appointment/i,
    'Headless rejects an appointment choice without a persisted pending event');
}

export async function runScholarOfficialPursuitCLegacyTests(): Promise<void> {
  const loader = EventLoader.getInstance();
  const appointmentEvent = loader.getEventById(SCHOLAR_OFFICIAL_APPOINTMENT_EVENT_ID)!;
  assert.doesNotMatch(appointmentEvent.content.text, /第一次|首次|初次任官/,
    'the new appointment narrative does not claim it is the player’s first office');

  const routeOnly = createState(30, 40);
  routeOnly.flags.route_official = true;
  routeOnly.player.flags = routeOnly.flags;
  const routeOnlyEngine = new GameEngineIntegration();
  routeOnlyEngine.loadGameState(routeOnly);
  const routeOnlyIds = new Set(routeOnlyEngine.getAvailableEvents(30).map(event => event.id));
  assert.equal(routeOnlyIds.has(SCHOLAR_OFFICIAL_APPOINTMENT_EVENT_ID), false,
    'the old route_official flag alone cannot qualify a player for the new appointment');
  assert.equal(routeOnlyIds.has('official_first_post'), true,
    'the old official route remains available when no new appointment fact exists');

  let previouslyAppointed = moveTo(createQualifiedState(), { year: 8, month: 7, day: 1 }, 30, 0);
  previouslyAppointed.flags.route_official = true;
  previouslyAppointed.flags.official_first_post = true;
  previouslyAppointed.player.flags = previouslyAppointed.flags;
  previouslyAppointed.eventHistory = [{ eventId: 'official_first_post', age: 23 }];
  assert.equal(isScholarOfficialAppointmentEligible(previouslyAppointed), true,
    'a true historical legacy appointment does not erase separate C-case exam eligibility');
  const acceptedAfterLegacy = addAppointmentDecision(
    previouslyAppointed,
    { year: 8, month: 7, day: 1 },
    'accepted',
    'accepted-after-legacy-post',
  );
  assert.equal(deriveScholarOfficialPursuit(acceptedAfterLegacy).status, 'completed',
    'the C case remains independently recordable after an older official_first_post');

  let cAppointmentFirst = createQualifiedState();
  cAppointmentFirst.flags.route_official = true;
  cAppointmentFirst.player.flags = cAppointmentFirst.flags;
  cAppointmentFirst = addAppointmentDecision(
    moveTo(cAppointmentFirst, { year: 8, month: 7, day: 1 }, 30, 0),
    { year: 8, month: 7, day: 1 },
    'accepted',
    'accepted-before-legacy-post',
  );
  const appointmentFirstEngine = new GameEngineIntegration();
  appointmentFirstEngine.loadGameState(cAppointmentFirst);
  const appointmentFirstIds = new Set(appointmentFirstEngine.getAvailableEvents(30).map(event => event.id));
  assert.equal(appointmentFirstIds.has('official_first_post'), false,
    'the old first-post event cannot repeat its first-office narrative after C appointment');

  let entryBlockedState = moveTo(createQualifiedState(), { year: 8, month: 7, day: 1 }, 30, 0);
  entryBlockedState.facts.birth_background = 'scholar_house';
  entryBlockedState.flags.origin_scholar_family = true;
  entryBlockedState.player.flags = entryBlockedState.flags;
  entryBlockedState = addAppointmentDecision(
    entryBlockedState,
    { year: 8, month: 7, day: 1 },
    'accepted',
    'accepted-before-legacy-entry',
  );
  const entryBlockedEngine = new GameEngineIntegration();
  entryBlockedEngine.loadGameState(entryBlockedState);
  assert.equal(entryBlockedEngine.getAvailableEvents(30).some(event => event.id === 'official_entry'), false,
    'a C-appointed official is not later invited into the separate legacy entry route');

  const forgedLegacyEntryEngine = new GameEngineIntegration();
  forgedLegacyEntryEngine.loadGameState(entryBlockedState);
  (forgedLegacyEntryEngine.getGameState() as GameState & { pendingStoryEventId?: string }).pendingStoryEventId = 'official_entry';
  const officialEntry = loader.getEventById('official_entry')!;
  const officialEntryChoice = officialEntry.choices?.[0]!;
  const beforeLegacyEntry = JSON.stringify(forgedLegacyEntryEngine.getGameState());
  await assert.rejects(
    forgedLegacyEntryEngine.executeChoiceEffects(officialEntryChoice.effects ?? [], 'official_entry', officialEntryChoice.id),
    /appointment|legacy|official/i,
    'the legacy entry route also rejects direct execution after C appointment');
  assert.equal(JSON.stringify(forgedLegacyEntryEngine.getGameState()), beforeLegacyEntry,
    'a rejected legacy entry cannot alter the already accepted C appointment');

  const forgedFirstPostEngine = new GameEngineIntegration();
  forgedFirstPostEngine.loadGameState(cAppointmentFirst);
  await assert.rejects(
    forgedFirstPostEngine.executeAutoEvent(loader.getEventById('official_first_post')!),
    /appointment|legacy|official/i,
    'the old automatic first-post event rejects direct execution after C appointment');

  let abandonedQualified = createQualifiedState();
  abandonedQualified = appendScholarOfficialPursuitEntry(
    moveTo(abandonedQualified, { year: 1, month: 4, day: 1 }),
    { type: 'abandon', date: { year: 1, month: 4, day: 1 } },
  );
  abandonedQualified = moveTo(abandonedQualified, { year: 8, month: 7, day: 1 }, 30, 0);
  abandonedQualified.flags.route_official = true;
  abandonedQualified.player.flags = abandonedQualified.flags;
  const abandonedEngine = new GameEngineIntegration();
  abandonedEngine.loadGameState(abandonedQualified);
  const abandonedIds = new Set(abandonedEngine.getAvailableEvents(30).map(event => event.id));
  assert.equal(abandonedIds.has(SCHOLAR_OFFICIAL_APPOINTMENT_EVENT_ID), true,
    'an abandoned but passed C objective still allows an independent appointment opportunity');
  assert.equal(abandonedIds.has('official_first_post'), true,
    'the unrelated legacy route still runs before any C appointment is accepted');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runScholarOfficialPursuitCTests();
  await runScholarOfficialPursuitCChoiceTests();
  await runScholarOfficialPursuitCLegacyTests();
  console.log('scholarOfficialPursuitC.test.ts: ok');
}
