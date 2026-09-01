import { EndingSystem } from '../src/core/EndingSystem';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { eventLoader } from '../src/core/EventLoader';
import { buildEndingPresentationDescription } from '../src/core/endingPresentation';
import { createDefaultPlayerLifeStates } from '../src/data/life/lifeStates';
import { HeadlessEngineSessionImpl } from '../src/headless/session/HeadlessEngineSessionImpl';
import type { GameState } from '../src/types/eventTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function makeState(overrides: Partial<GameState['player']> = {}): GameState {
  return {
    player: {
      age: 80,
      name: '结局说明测试',
      gender: 'male',
      martialPower: 20,
      chivalry: 20,
      constitution: 50,
      affiliation: null,
      title: null,
      reputation: 40,
      knowledge: 20,
      charisma: 40,
      businessAcumen: 20,
      influence: 20,
      connections: 20,
      martialHeritage: 0,
      scholarlyHeritage: 0,
      merchantNetwork: 0,
      investments: { martial: 0, statecraft: 0, official: 0, hermit: 0 },
      traits: [],
      healthStatus: 'healthy',
      statuses: [],
      lifeStates: createDefaultPlayerLifeStates(),
      children: 0,
      spouse: null,
      flags: {},
      alive: true,
      ...(overrides as GameState['player']),
    },
    facts: {},
    flags: {},
    relations: {},
    eventHistory: [],
  };
}

function quietEnding() {
  const ending = EndingSystem.getEndingById('quiet_family_life');
  assert(Boolean(ending), 'quiet_family_life must remain a formal ending');
  return ending!;
}

function testWealthAndBalancedExplanationsDiffer(): void {
  const ending = quietEnding();
  const wealth = makeState({
    businessAcumen: 75,
    spouse: '发妻',
    children: 1,
    lifeStates: { trainingHabit: 0, studyHabit: 0, businessHabit: 5 },
  });
  const balanced = makeState({
    martialPower: 61,
    knowledge: 59,
    businessAcumen: 32,
    spouse: '发妻',
    children: 1,
    lifeStates: { trainingHabit: 5, studyHabit: 5, businessHabit: 5 },
  });

  const wealthText = buildEndingPresentationDescription(wealth, ending);
  const balancedText = buildEndingPresentationDescription(balanced, ending);

  assert(wealthText !== balancedText, 'wealth and balanced quiet endings must be different');
  assert(wealthText.includes('生意和家业'), 'wealth explanation should name the business axis');
  assert(wealthText.includes('经营能力'), 'wealth explanation should name the achieved capability');
  assert(wealthText.includes('家人'), 'wealth explanation should retain the family anchor');
  assert(balancedText.includes('练武、读书与营生'), 'balanced explanation should name the mixed axis');
  assert(balancedText.includes('守住已有的生活'), 'balanced explanation should use the non-wallet life-axis close');
  assert(balancedText.includes('家人'), 'balanced explanation should retain the family anchor');
  assert(!balancedText.includes('财富') && !/银两|\d+\s*两/.test(balancedText), 'balanced explanation must not narrate retired wallet state');
}

function testNoFamilyDescriptionIsNotFabricated(): void {
  const text = buildEndingPresentationDescription(makeState(), quietEnding());

  assert(!text.includes('家人'), 'quiet explanation must not invent family without spouse or children');
  assert(!text.includes('家庭'), 'quiet explanation must not invent a family anchor without spouse or children');
  assert(text.includes('平静而普通的日常'), 'no-family explanation should retain ordinary-life meaning');
}

function testDescriptionIsDeterministicAndOtherEndingsRemainStatic(): void {
  const state = makeState({
    spouse: '发妻',
    children: 1,
    lifeStates: { trainingHabit: 0, studyHabit: 0, businessHabit: 5 },
    businessAcumen: 75,
  });
  const quiet = quietEnding();
  const first = buildEndingPresentationDescription(state, quiet);
  const second = buildEndingPresentationDescription(state, quiet);
  assert(first === second, 'same final state must produce the same explanation');

  const martial = EndingSystem.getEndingById('martial_god');
  assert(Boolean(martial), 'martial_god must remain a formal ending');
  assert(
    buildEndingPresentationDescription(state, martial!) === martial!.description,
    'non-quiet ending descriptions must remain unchanged',
  );
}

function testFamilyPresenceRetainsCanonicalNeutralClassification(): void {
  const lowNoFamily = makeState({ martialPower: 20, reputation: 40, knowledge: 20 });
  const lowWithSpouse = makeState({ martialPower: 20, reputation: 40, knowledge: 20, spouse: '发妻' });
  const lowWithChild = makeState({ martialPower: 20, reputation: 40, knowledge: 20, children: 1 });
  assert(EndingSystem.determineEnding(lowNoFamily).id === 'ordinary_life', 'low no-family state should remain ordinary');
  assert(EndingSystem.determineEnding(lowWithSpouse).id === 'quiet_family_life', 'spouse should preserve quiet-family classification');
  assert(EndingSystem.determineEnding(lowWithChild).id === 'quiet_family_life', 'child should preserve quiet-family classification');

  const moderateNoFamily = makeState({ martialPower: 55, reputation: 40, knowledge: 20 });
  const moderateWithFamily = makeState({ martialPower: 55, reputation: 40, knowledge: 20, spouse: '发妻', children: 1 });
  assert(EndingSystem.determineEnding(moderateNoFamily).id === 'unfulfilled_ambition', 'moderate no-family state should remain unfulfilled');
  assert(EndingSystem.determineEnding(moderateWithFamily).id === 'quiet_family_life', 'family anchor should preserve quiet-family classification');
}

async function testRuntimeAndSnapshotUseTheSameDescription(): Promise<void> {
  const event = eventLoader.getEventById('ordinary_life');
  assert(Boolean(event), 'ordinary_life must be available');

  const engine = new GameEngineIntegration();
  engine.startNewGame('寿终说明测试', 'male');
  const engineState = engine.getGameState();
  engineState.player.age = 80;
  engineState.player.businessAcumen = 75;
  engineState.player.spouse = '发妻';
  engineState.player.children = 1;
  engineState.player.lifeStates = { trainingHabit: 0, studyHabit: 0, businessHabit: 5 };
  engineState.currentTime = { year: 80, month: 1, day: 1 };
  await engine.executeAutoEvent(event!);

  const localDescription = (engine.getGameState().ending as { description: string }).description;
  assert(localDescription.includes('生意和家业'), 'local ending should use the dynamic explanation');

  const session = HeadlessEngineSessionImpl.create({
    playerName: '寿终说明测试',
    gender: 'male',
    randomSeed: 801,
    catalogVersion: '1.0.0',
  });
  const runtime = session.getRuntimeState();
  runtime.player!.age = 80;
  runtime.player!.businessAcumen = 75;
  runtime.player!.spouse = '发妻';
  runtime.player!.children = 1;
  runtime.player!.lifeStates = { trainingHabit: 0, studyHabit: 0, businessHabit: 5 };
  runtime.currentTime = { year: 80, month: 1, day: 1 };
  runtime.pendingStoryEventId = 'ordinary_life';
  await session.hydrate(session.serialize());
  const progress = await session.progressAutomatic();
  assert(progress.stoppedReason === 'terminal', 'headless session should reach terminal');

  const headlessDescription = session.getTerminalState()?.ending?.description;
  assert(headlessDescription === localDescription, 'Local and Headless descriptions must match');

  const restored = HeadlessEngineSessionImpl.create({ snapshot: session.serialize() });
  assert(
    restored.getTerminalState()?.ending?.description === headlessDescription,
    'Snapshot restore must retain the ending explanation',
  );
}

async function main(): Promise<void> {
  testWealthAndBalancedExplanationsDiffer();
  testNoFamilyDescriptionIsNotFabricated();
  testDescriptionIsDeterministicAndOtherEndingsRemainStatic();
  testFamilyPresenceRetainsCanonicalNeutralClassification();
  await testRuntimeAndSnapshotUseTheSameDescription();
  console.log('quietFamilyLifeEndingExplanation.test.ts: ok');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
