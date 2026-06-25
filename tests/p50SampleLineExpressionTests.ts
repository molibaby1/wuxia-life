import { buildMainScreenModel } from '../src/components/mainScreenModel';
import { deriveLifeMemorySummary } from '../src/core/deriveLifeMemorySummary';
import { createDefaultPlayerLifeStates } from '../src/data/life/lifeStates';
import {
  deriveSampleLineAge40Identity,
  deriveSampleLineCurrentGoal,
  isPlayerVisibleSampleLineText,
} from '../src/p50/sampleLineExpression';
import type { GameState } from '../src/types/eventTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function makeState(age: number, flags: Record<string, unknown>): GameState {
  return {
    player: {
      age,
      name: 'fixture',
      gender: 'male',
      martialPower: 30,
      externalSkill: 10,
      internalSkill: 10,
      qinggong: 10,
      chivalry: 10,
      constitution: 50,
      comprehension: 30,
      sect: null,
      title: null,
      reputation: 10,
      money: 100,
      knowledge: 15,
      charisma: 10,
      businessAcumen: 10,
      influence: 8,
      connections: 5,
      martialHeritage: 0,
      scholarlyHeritage: 0,
      merchantNetwork: 0,
      children: 0,
      spouse: null,
      alive: true,
      flags: {},
      lifeStates: createDefaultPlayerLifeStates(),
    },
    flags,
    relations: {},
    achievements: [],
    eventHistory: [
      {
        eventId: 'sect_midlife_gray_mission',
        selectedChoice: 'refuse',
        age: 36,
      } as GameState['eventHistory'][0],
    ],
    routeStates: {},
  } as GameState;
}

function testOrthodoxExpression(): void {
  const youth = makeState(28, {
    route_orthodox: true,
    orthodox_trial_completed: true,
    orthodox_formal_disciple: true,
  });
  const goal = deriveSampleLineCurrentGoal(youth);
  assert(Boolean(goal?.includes('行侠')), `orthodox youth goal missing: ${goal}`);
  assert(isPlayerVisibleSampleLineText(goal!), `raw key leaked in goal: ${goal}`);

  const midlife = makeState(36, {
    route_orthodox: true,
    orthodox_formal_disciple: true,
    sect_midlife_gray_refused: true,
  });
  midlife.eventHistory = [
    {
      eventId: 'sect_midlife_gray_mission',
      selectedChoice: 'refuse',
      age: 36,
    } as GameState['eventHistory'][0],
  ];
  const summary = deriveLifeMemorySummary(midlife);
  assert(summary.routeStatus?.currentGoalLabel?.includes('守正'), 'orthodox midlife goal missing');
  assert(
    summary.achievements?.some((entry) => entry.label.includes('守正') || entry.label.includes('正派'))
    || summary.routeStatus?.currentGoalLabel?.includes('代价'),
    'orthodox midlife identity signal missing',
  );

  const age40 = makeState(40, {
    route_orthodox: true,
    orthodox_age40_identity_done: true,
    sect_midlife_gray_refused: true,
  });
  const identity = deriveSampleLineAge40Identity(age40);
  assert(Boolean(identity?.includes('正派')), `orthodox age40 identity missing: ${identity}`);

  const screen = buildMainScreenModel(age40.player, deriveLifeMemorySummary(age40));
  assert(!screen.routeSummary.includes('route_orthodox'), 'raw route key in main screen');
}

function testDemonicExpression(): void {
  const youth = makeState(25, {
    route_demonic: true,
    demonic_youth_first_transgression: true,
    outlaw_rise: true,
  });
  const goal = deriveSampleLineCurrentGoal(youth);
  assert(Boolean(goal?.includes('力量') || goal?.includes('地盘')), `demonic goal missing: ${goal}`);

  const midlife = makeState(35, {
    route_demonic: true,
    demonic_midlife_isolation_done: true,
    demonic_midlife_betrayal_done: true,
  });
  const summary = deriveLifeMemorySummary(midlife);
  assert(summary.risks?.some((risk) => risk.label.includes('旧友')), 'demonic isolation risk missing');

  const age40 = makeState(40, {
    route_demonic: true,
    demonic_age40_identity_done: true,
    demonic_midlife_legacy_rule: true,
  });
  const identity = deriveSampleLineAge40Identity(age40);
  assert(Boolean(identity?.includes('魔道')), `demonic age40 identity missing: ${identity}`);
}

function main(): void {
  testOrthodoxExpression();
  testDemonicExpression();
  console.log('p50SampleLineExpressionTests: all passed');
}

main();
