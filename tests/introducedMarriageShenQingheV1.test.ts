import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { resolveChoiceEffects } from '../src/core/ChoiceOutcomeResolver';
import { EventLoader, eventLoader } from '../src/core/EventLoader';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { materializePersonBoundEvent, personVariantFactKey } from '../src/core/SexVariantPersonArchetype';
import type { EventChoice, EventDefinition, GameState } from '../src/types/eventTypes';

const IDS = {
  introduction: 'shen_qinghe_introduction',
  met: 'shen_qinghe_met',
  sharedMatter: 'shen_qinghe_shared_matter',
  honorTerms: 'shen_qinghe_matter_honor_terms',
  renegotiate: 'shen_qinghe_matter_renegotiate',
  marriageDecision: 'shen_qinghe_marriage_decision',
  mingyueParenthood: 'mingyue_parenthood_decision',
} as const;

const INTRODUCTION_MEET_CHOICE = 'shen_qinghe_meet';
const INTRODUCTION_NOT_NOW_CHOICE = 'shen_qinghe_introduction_not_now';
const MARRIAGE_CHOICE = 'shen_qinghe_choose_marriage';
const NO_MARRIAGE_CHOICE = 'shen_qinghe_not_now_marriage';

const FORBIDDEN_RELATIONSHIP_SEMANTICS = [
  'affinity',
  'interest',
  'marriage_candidate',
  'relationship_stage',
  'marriage_quality',
  'introduced_marriage_success',
  'shen_qinghe_romance',
  'shen_qinghe_wedding',
  'criticalChoices.marriage_choice',
];

const FORBIDDEN_NEGATIVE_SEMANTICS = [
  'missed_match',
  'regret',
  'family_disappointed',
  'marriage_refused',
  'rejected_qinghe',
  'failed_marriage',
  'single',
];

function createEngine(age = 22, gender: 'male' | 'female' = 'male'): GameEngineIntegration {
  const engine = new GameEngineIntegration();
  const state = engine.getGameState();
  state.player.age = age;
  state.player.gender = gender;
  state.player.flags = {};
  state.flags = {};
  state.player.events = [];
  state.eventHistory = [];
  state.triggeredEvents = [];
  state.relations = {};
  state.player.relationships = [];
  state.player.spouse = null;
  state.player.children = 0;
  state.currentTime = { year: 1, month: 1, day: 1 };
  engine.setSuppressLethalSetbacks(true);
  return engine;
}

function getEvent(id: string): EventDefinition {
  const event = eventLoader.getEventById(id);
  assert(event, `missing Shen Qinghe event: ${id}`);
  return event;
}

function getChoice(eventId: string, choiceId: string): EventChoice {
  const choice = getEvent(eventId).choices?.find(candidate => candidate.id === choiceId);
  assert(choice, `missing choice: ${eventId}/${choiceId}`);
  return choice;
}

async function materializedEvent(
  engine: GameEngineIntegration,
  eventId: string,
): Promise<EventDefinition> {
  const rawEvent = getEvent(eventId);
  const result = materializePersonBoundEvent(
    engine.getGameState(),
    rawEvent,
    { allowCreate: rawEvent.personBinding?.mode === 'create' },
  );
  assert(result.event, `event did not materialize: ${eventId}`);
  if (result.state !== engine.getGameState()) {
    engine.loadGameState(result.state);
  }
  return result.event;
}

function availableIds(engine: GameEngineIntegration, age = engine.getGameState().player.age): Set<string> {
  engine.getGameState().player.age = age;
  return new Set(engine.getAvailableEvents(age).map(event => event.id));
}

function setFlag(engine: GameEngineIntegration, flag: string, value = true): void {
  const state = engine.getGameState();
  state.flags[flag] = value;
  state.player.flags[flag] = value;
}

function absoluteMonth(time: GameState['currentTime']): number {
  assert(time, 'currentTime is required for introduced marriage pacing assertions');
  return time.year * 12 + time.month;
}

async function choose(engine: GameEngineIntegration, eventId: string, choiceId: string) {
  const event = await materializedEvent(engine, eventId);
  const choice = event.choices?.find(candidate => candidate.id === choiceId);
  assert(choice, `missing materialized choice: ${eventId}/${choiceId}`);
  const resolved = resolveChoiceEffects(engine.getGameState(), event, choice);
  assert(resolved, `choice did not resolve: ${eventId}/${choiceId}`);
  await engine.executeChoiceEffects(resolved.effects, eventId, choiceId);
  return resolved;
}

function serializedSampleEvents(): string {
  return JSON.stringify([
    getEvent(IDS.introduction),
    getEvent(IDS.sharedMatter),
    getEvent(IDS.marriageDecision),
  ]);
}

function assertNoForbiddenSemantics(value: unknown, forbidden: readonly string[]): void {
  const serialized = JSON.stringify(value);
  for (const term of forbidden) {
    assert.equal(serialized.includes(term), false, `${term} must not be authored or written`);
  }
}

function ordinaryPlayerState(state: GameState): Record<string, unknown> {
  const player = state.player;
  return {
    age: player.age,
    gender: player.gender,
    martialPower: player.martialPower,
    constitution: player.constitution,
    charisma: player.charisma,
    chivalry: player.chivalry,
    reputation: player.reputation,
    connections: player.connections,
    knowledge: player.knowledge,
    businessAcumen: player.businessAcumen,
    influence: player.influence,
    martialHeritage: player.martialHeritage,
    scholarlyHeritage: player.scholarlyHeritage,
    merchantNetwork: player.merchantNetwork,
    wealthCapacity: player.wealthCapacity,
    children: player.children,
    spouse: player.spouse,
    relations: { ...state.relations },
    facts: { ...state.facts },
    achievements: state.achievements ? [...state.achievements] : state.achievements,
  };
}

function testCatalogAddsExactlyThreeEvents(): void {
  const sourcePath = path.resolve('src/data/lines/merchant.json');
  const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8')) as EventDefinition[];
  assert.equal(source.length, 21, 'merchant source must add exactly three events to its existing 18');
  assert.deepEqual(source.slice(-3).map(event => event.id), [
    IDS.introduction,
    IDS.sharedMatter,
    IDS.marriageDecision,
  ]);
  assert.equal(EventLoader.getInstance().getAllEvents().length, 392);
  assert.equal(EventLoader.getInstance().getAllEvents().filter(event => event.id.startsWith('shen_qinghe_')).length, 3);
  assert.equal(EventLoader.getInstance().getUndeclaredImportPaths().length, 0);
}

function testFirstSampleEligibilityIsNotGlobalMarriageEligibility(): void {
  const eligible = createEngine(22);
  setFlag(eligible, 'origin_merchant_family');
  assert.equal(availableIds(eligible, 22).has(IDS.introduction), true);
  assert.equal(eligible.getGameState().flags.route_merchant, undefined);

  const female = createEngine(22);
  setFlag(female, 'origin_merchant_family');
  female.getGameState().player.gender = 'female';
  assert.equal(availableIds(female, 22).has(IDS.introduction), true);

  const nonMerchantOrigin = createEngine(22);
  setFlag(nonMerchantOrigin, 'origin_scholar_family');
  assert.equal(availableIds(nonMerchantOrigin, 22).has(IDS.introduction), false);

  for (const age of [21, 33]) {
    const outsideWindow = createEngine(age);
    setFlag(outsideWindow, 'origin_merchant_family');
    assert.equal(availableIds(outsideWindow, age).has(IDS.introduction), false, `age ${age} must be outside first-sample window`);
  }

  const age32 = createEngine(32);
  setFlag(age32, 'origin_merchant_family');
  assert.equal(availableIds(age32, 32).has(IDS.introduction), true);

  const married = createEngine(22);
  setFlag(married, 'origin_merchant_family');
  setFlag(married, 'married');
  assert.equal(availableIds(married, 22).has(IDS.introduction), false);

  const hasSpouse = createEngine(22);
  setFlag(hasSpouse, 'origin_merchant_family');
  hasSpouse.getGameState().player.spouse = '另一位人物';
  assert.equal(availableIds(hasSpouse, 22).has(IDS.introduction), false);

  const mingyueRomance = createEngine(22);
  setFlag(mingyueRomance, 'origin_merchant_family');
  setFlag(mingyueRomance, 'mingyue_romance_confirmed');
  assert.equal(availableIds(mingyueRomance, 22).has(IDS.introduction), false);

  const alreadyIntroduced = createEngine(22);
  setFlag(alreadyIntroduced, 'origin_merchant_family');
  alreadyIntroduced.getGameState().eventHistory = [{ eventId: IDS.introduction, triggeredAt: 1, age: 22 }];
  assert.equal(availableIds(alreadyIntroduced, 22).has(IDS.introduction), false);
}

function testEventsUseOnlyTheAcceptedFixedPersonDefinition(): void {
  const introduction = getEvent(IDS.introduction);
  const sharedMatter = getEvent(IDS.sharedMatter);
  const marriageDecision = getEvent(IDS.marriageDecision);
  const serialized = serializedSampleEvents();

  assert.equal(introduction.content?.text.includes('沈家'), true);
  assert.equal(introduction.content?.text.includes('长期有生意往来'), true);
  assert.equal(introduction.content?.text.includes('{{person.name}}'), true);
  assert.equal(introduction.content?.text.includes('账目'), true);
  assert.equal(introduction.content?.text.includes('货物流转'), true);
  assert.equal(sharedMatter.content?.text.includes('账目和货物流转'), true);
  assert.equal(sharedMatter.content?.text.includes('承诺'), true);
  assert.equal(marriageDecision.content?.text.includes('两家合作只是认识彼此的原因'), true);
  assert.equal(marriageDecision.content?.text.includes('继续参与自己的家业事务'), true);
  assert.deepEqual(introduction.personBinding, {
    archetypeId: 'merchant_introduced_partner_v1',
    mode: 'create',
  });
  assert.deepEqual(sharedMatter.personBinding, {
    archetypeId: 'merchant_introduced_partner_v1',
    mode: 'require',
  });
  assert.deepEqual(marriageDecision.personBinding, {
    archetypeId: 'merchant_introduced_partner_v1',
    mode: 'require',
  });
  assert.equal(introduction.conditions?.[0] && 'expression' in introduction.conditions[0]
    ? introduction.conditions[0].expression.includes('player.gender')
    : false, false);
  assert.equal(serialized.includes('父母'), false);
  assert.equal(serialized.includes('商会'), false);
  assert.equal(serialized.includes('财富等级'), false);
  assert.equal(serialized.includes('武功'), false);
  assert.equal(serialized.includes('人格矩阵'), false);
  assertNoForbiddenSemantics(serialized, FORBIDDEN_RELATIONSHIP_SEMANTICS);
  assert.equal(serialized.includes('!flags.has(\\"mingyue_romance_confirmed\\")'), true);
  const narrativeOnly = JSON.stringify([
    introduction.content,
    sharedMatter.content,
    marriageDecision.content,
    ...(introduction.choices ?? []).map(choice => ({
      text: choice.text,
      description: choice.description,
    })),
    ...(sharedMatter.choices ?? []).map(choice => ({
      text: choice.text,
      description: choice.description,
    })),
    ...(marriageDecision.choices ?? []).flatMap(choice => [
      { text: choice.text, description: choice.description },
      ...(choice.outcomes ?? []).map(outcome => ({ text: outcome.text })),
    ]),
  ]);
  assertNoForbiddenSemantics(narrativeOnly, ['romance']);
}

function assertMaterializedVariantText(
  event: EventDefinition,
  expectedName: string,
  oppositeName: string,
): void {
  const narrativeText = [
    event.content.title,
    event.content.text,
    event.content.description,
    ...(event.choices ?? []).flatMap(choice => [
      choice.text,
      choice.description,
      ...(choice.outcomes ?? []).map(outcome => outcome.text),
    ]),
  ].filter((text): text is string => typeof text === 'string').join('\n');
  assert.equal(narrativeText.includes(expectedName), true);
  assert.equal(narrativeText.includes(oppositeName), false);
  assert.equal(narrativeText.includes('{{person.'), false);
}

async function testBothVariantsShareTheThreeEventSemantics(): Promise<void> {
  for (const [gender, expectedVariant, expectedName, oppositeName] of [
    ['male', 'female_qinghe', '沈清禾', '沈知衡'],
    ['female', 'male_zhiheng', '沈知衡', '沈清禾'],
  ] as const) {
    for (const historyChoice of [IDS.honorTerms, IDS.renegotiate]) {
      const engine = await prepareMetEngine(22, gender);
      assert.equal(engine.getGameState().facts[personVariantFactKey('merchant_introduced_partner_v1')], expectedVariant);
      assertMaterializedVariantText(await materializedEvent(engine, IDS.sharedMatter), expectedName, oppositeName);
      await choose(engine, IDS.sharedMatter, historyChoice);

      const decision = await materializedEvent(engine, IDS.marriageDecision);
      assertMaterializedVariantText(decision, expectedName, oppositeName);
      const marriageChoice = decision.choices?.find(choice => choice.id === MARRIAGE_CHOICE);
      assert(marriageChoice);
      assertMaterializedVariantText(
        {
          ...decision,
          choices: [marriageChoice],
        },
        expectedName,
        oppositeName,
      );
      const resolved = resolveChoiceEffects(engine.getGameState(), decision, marriageChoice);
      assert(resolved?.outcomeText);
      assertMaterializedVariantText(
        {
          ...decision,
          content: { ...decision.content, text: resolved.outcomeText },
          choices: [],
        },
        expectedName,
        oppositeName,
      );
      assert.deepEqual(resolved.effects, [
        { type: 'special', target: 'set_spouse_from_person', value: 'merchant_introduced_partner_v1' },
        { type: 'flag_set', target: 'married', value: true },
      ]);
      await engine.executeChoiceEffects(resolved.effects, IDS.marriageDecision, MARRIAGE_CHOICE);
      assert.equal(engine.getGameState().player.spouse, expectedName);
      assert.equal(engine.getGameState().flags.married, true);
      assert.equal(engine.getGameState().player.children, 0);
      assert.deepEqual(engine.getGameState().player.relationships, []);
      assert.equal(availableIds(engine).has(IDS.mingyueParenthood), false);
    }
  }
}

async function testDecliningTheIntroductionIsAValidNoMeetPath(): Promise<void> {
  const engine = createEngine(22);
  setFlag(engine, 'origin_merchant_family');
  assert.equal(availableIds(engine).has(IDS.introduction), true);
  await choose(engine, IDS.introduction, INTRODUCTION_NOT_NOW_CHOICE);

  const state = engine.getGameState();
  assert.equal(state.player.spouse, null);
  assert.equal(state.flags.married, undefined);
  assert.equal(state.player.events.some(record => record.eventId === IDS.met), false);
  assert.equal(state.eventHistory.some(record => record.eventId === IDS.met), false);
  assert.equal(availableIds(engine).has(IDS.sharedMatter), false);
  assert.equal(availableIds(engine).has(IDS.marriageDecision), false);
  assertNoForbiddenSemantics(state, FORBIDDEN_NEGATIVE_SEMANTICS);
}

async function prepareMetEngine(
  age = 22,
  gender: 'male' | 'female' = 'male',
): Promise<GameEngineIntegration> {
  const engine = createEngine(age, gender);
  setFlag(engine, 'origin_merchant_family');
  assert.equal(availableIds(engine, age).has(IDS.introduction), true);
  assertMaterializedVariantText(
    await materializedEvent(engine, IDS.introduction),
    gender === 'male' ? '沈清禾' : '沈知衡',
    gender === 'male' ? '沈知衡' : '沈清禾',
  );
  const start = absoluteMonth(engine.getGameState().currentTime);
  await choose(engine, IDS.introduction, INTRODUCTION_MEET_CHOICE);
  assert.equal(absoluteMonth(engine.getGameState().currentTime) - start, 2);
  assert.equal(engine.getGameState().player.events.some(record => record.eventId === IDS.met), true);
  assert.equal(availableIds(engine).has(IDS.sharedMatter), true);
  assert.equal(availableIds(engine).has(IDS.marriageDecision), false);
  assertNoForbiddenSemantics(engine.getGameState(), FORBIDDEN_RELATIONSHIP_SEMANTICS);
  return engine;
}

async function runSharedMatterPath(
  choiceId: string,
  age = 22,
  gender: 'male' | 'female' = 'male',
): Promise<{ engine: GameEngineIntegration; resolved: NonNullable<Awaited<ReturnType<typeof choose>>> }> {
  const engine = await prepareMetEngine(age, gender);
  const start = absoluteMonth(engine.getGameState().currentTime);
  const resolved = await choose(engine, IDS.sharedMatter, choiceId);
  assert.equal(absoluteMonth(engine.getGameState().currentTime) - start, 6);
  assert.equal(engine.getGameState().player.events.some(record => record.eventId === choiceId), true);
  assert.equal(availableIds(engine).has(IDS.marriageDecision), true);
  assertNoForbiddenSemantics(engine.getGameState(), FORBIDDEN_RELATIONSHIP_SEMANTICS);
  return { engine, resolved };
}

function testSharedMatterHasTwoEqualEligibilityHistories(): void {
  const sharedMatter = getEvent(IDS.sharedMatter);
  assert.deepEqual(sharedMatter.choices?.map(choice => choice.id), [IDS.honorTerms, IDS.renegotiate]);
  for (const choice of sharedMatter.choices ?? []) {
    assert.deepEqual(choice.effects?.map(effect => effect.type), ['time_advance', 'event_record']);
    assert.equal(choice.effects?.some(effect => effect.type === 'stat_modify'), false);
    assert.equal(choice.effects?.some(effect => effect.type === 'relation_change'), false);
  }

  const decision = getEvent(IDS.marriageDecision);
  assert.deepEqual(decision.ageRange, { min: 22, max: 34 });
  assert.equal(decision.conditions?.[0] && 'expression' in decision.conditions[0]
    ? decision.conditions[0].expression.includes(IDS.sharedMatter)
      && decision.conditions[0].expression.includes(IDS.honorTerms)
      && decision.conditions[0].expression.includes(IDS.renegotiate)
    : false, true);
  assert.equal(decision.conditions?.[0] && 'expression' in decision.conditions[0]
    ? decision.conditions[0].expression.includes('!flags.has("married")')
      && decision.conditions[0].expression.includes('!player.spouse')
      && decision.conditions[0].expression.includes('!flags.has("mingyue_romance_confirmed")')
    : false, true);
  assert.equal(JSON.stringify(decision.conditions).includes('correct'), false);
  assert.equal(JSON.stringify(decision.conditions).includes('score'), false);
  assertNoForbiddenSemantics(decision, FORBIDDEN_RELATIONSHIP_SEMANTICS);
}

async function testBothSharedMatterHistoriesReachTheSameMarriageEligibility(): Promise<void> {
  const honor = await runSharedMatterPath(IDS.honorTerms, 32);
  const renegotiate = await runSharedMatterPath(IDS.renegotiate, 32);
  assert.equal(availableIds(honor.engine, 32).has(IDS.marriageDecision), true);
  assert.equal(availableIds(renegotiate.engine, 32).has(IDS.marriageDecision), true);
  assert.equal(honor.engine.getGameState().player.events.some(record => record.eventId === IDS.honorTerms), true);
  assert.equal(honor.engine.getGameState().player.events.some(record => record.eventId === IDS.renegotiate), false);
  assert.equal(renegotiate.engine.getGameState().player.events.some(record => record.eventId === IDS.renegotiate), true);
  assert.equal(renegotiate.engine.getGameState().player.events.some(record => record.eventId === IDS.honorTerms), false);
  assert.equal(honor.engine.getGameState().player.age, 32, 'age-32 introduction plus eight months must not truncate the chain');
  assert.equal(renegotiate.engine.getGameState().player.age, 32, 'age-32 introduction plus eight months must not truncate the chain');
  assert.equal(honor.resolved.outcomeText, undefined);
  assert.equal(renegotiate.resolved.outcomeText, undefined);
}

function assertConditionalHistoryOutcomes(choice: EventChoice, expectedHistory: string, otherHistory: string): void {
  assert.equal(choice.effects?.length, 0);
  assert.equal(choice.outcomes?.length, 2);
  assert.equal(choice.outcomes?.every(outcome => outcome.condition.type === 'expression'), true);
  assert.equal(choice.outcomes?.some(outcome => outcome.condition.type === 'expression'
    && outcome.condition.expression.includes(expectedHistory)), true);
  assert.equal(choice.outcomes?.some(outcome => outcome.condition.type === 'expression'
    && outcome.condition.expression.includes(otherHistory)), true);
  assert.equal(choice.outcomes?.every(outcome => outcome.effects.length > 0), true);
}

async function testMarriageDecisionReadsTheConcreteHistoryAndSetsOnlyMarriageState(): Promise<void> {
  const honor = await runSharedMatterPath(IDS.honorTerms, 32);
  const renegotiate = await runSharedMatterPath(IDS.renegotiate, 32);
  const decision = getEvent(IDS.marriageDecision);
  const marryChoice = getChoice(IDS.marriageDecision, MARRIAGE_CHOICE);
  const noMarriageChoice = getChoice(IDS.marriageDecision, NO_MARRIAGE_CHOICE);
  assertConditionalHistoryOutcomes(marryChoice, IDS.honorTerms, IDS.renegotiate);
  assertConditionalHistoryOutcomes(noMarriageChoice, IDS.honorTerms, IDS.renegotiate);

  const beforeHonor = ordinaryPlayerState(honor.engine.getGameState());
  const honorResolved = resolveChoiceEffects(honor.engine.getGameState(), decision, marryChoice);
  assert(honorResolved?.outcomeText);
  assert.equal(honorResolved.outcomeText.includes('先承担自己已经答应的责任'), true);
  assert.equal(honorResolved.outcomeText.includes('把损失和困难摊开重新谈清'), false);
  assert.deepEqual(honorResolved.effects, [
    { type: 'special', target: 'set_spouse_from_person', value: 'merchant_introduced_partner_v1' },
    { type: 'flag_set', target: 'married', value: true },
  ]);
  await honor.engine.executeChoiceEffects(honorResolved.effects, IDS.marriageDecision, MARRIAGE_CHOICE);
  const marriedState = honor.engine.getGameState();
  assert.equal(marriedState.player.spouse, '沈清禾');
  assert.equal(marriedState.flags.married, true);
  assert.equal(marriedState.flags.mingyue_romance_confirmed, undefined);
  assert.equal(marriedState.player.children, 0);
  assert.deepEqual(marriedState.player.relationships, []);
  assert.deepEqual(ordinaryPlayerState(marriedState), {
    ...beforeHonor,
    spouse: '沈清禾',
  });
  assert.equal(availableIds(honor.engine).has(IDS.mingyueParenthood), false);
  assertNoForbiddenSemantics(marriedState, FORBIDDEN_RELATIONSHIP_SEMANTICS);

  const beforeRenegotiate = ordinaryPlayerState(renegotiate.engine.getGameState());
  const renegotiateResolved = resolveChoiceEffects(renegotiate.engine.getGameState(), decision, marryChoice);
  assert(renegotiateResolved?.outcomeText);
  assert.equal(renegotiateResolved.outcomeText.includes('把损失和困难摊开重新谈清'), true);
  assert.equal(renegotiateResolved.outcomeText.includes('先承担自己已经答应的责任'), false);
  assert.deepEqual(renegotiateResolved.effects, honorResolved.effects);
  await renegotiate.engine.executeChoiceEffects(renegotiateResolved.effects, IDS.marriageDecision, MARRIAGE_CHOICE);
  assert.deepEqual(ordinaryPlayerState(renegotiate.engine.getGameState()), {
    ...beforeRenegotiate,
    spouse: '沈清禾',
  });
}

async function testNoMarriageLeavesACompleteValidState(): Promise<void> {
  for (const gender of ['male', 'female'] as const) {
    for (const history of [IDS.honorTerms, IDS.renegotiate]) {
      const { engine } = await runSharedMatterPath(history, 22, gender);
    const resolved = await choose(engine, IDS.marriageDecision, NO_MARRIAGE_CHOICE);
    assert(resolved.outcomeText);
    const state = engine.getGameState();
    assert.equal(state.player.spouse, null);
    assert.equal(state.flags.married, undefined);
    assert.equal(state.player.children, 0);
    assert.equal(state.player.events.some(record => record.eventId === IDS.marriageDecision), true);
    assert.equal(availableIds(engine).has(IDS.mingyueParenthood), false);
    assertNoForbiddenSemantics(state, FORBIDDEN_NEGATIVE_SEMANTICS);
    }
  }
}

function testNoGenericRuntimeOrDormantCriticalChoiceWasAdded(): void {
  const serialized = serializedSampleEvents();
  for (const forbidden of [
    'Person Runtime',
    'person_runtime',
    'person_id',
    'candidate_score',
    'relationship_stage',
    'marriage_quality',
    'criticalChoices.marriage_choice',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `${forbidden} must remain absent`);
  }
}

async function main(): Promise<void> {
  testCatalogAddsExactlyThreeEvents();
  testFirstSampleEligibilityIsNotGlobalMarriageEligibility();
  testEventsUseOnlyTheAcceptedFixedPersonDefinition();
  await testDecliningTheIntroductionIsAValidNoMeetPath();
  testSharedMatterHasTwoEqualEligibilityHistories();
  await testBothSharedMatterHistoriesReachTheSameMarriageEligibility();
  await testBothVariantsShareTheThreeEventSemantics();
  await testMarriageDecisionReadsTheConcreteHistoryAndSetsOnlyMarriageState();
  await testNoMarriageLeavesACompleteValidState();
  testNoGenericRuntimeOrDormantCriticalChoiceWasAdded();
  console.log('introducedMarriageShenQingheV1.test.ts: ok');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
