import fs from 'node:fs';
import path from 'node:path';
import { EventLoader } from '../src/core/EventLoader';
import { assert, assertDeepEqual, GameTestFramework } from './GameTestFramework';
import { temperaments } from '../src/data/traits/temperaments';
import { dailyEvents } from '../src/data/life/dailyEvents';
import { dailyEventSystem } from '../src/core/DailyEventSystem';
import { executeActiveActionOnState } from '../src/core/activePlanning/ActivePlanningService';
import { createDefaultPlayerLifeStates } from '../src/data/life/lifeStates';
import type { GameState } from '../src/types/eventTypes';

const framework = new GameTestFramework();

function createState(): GameState {
  return (framework as unknown as { createTestState(): GameState }).createTestState();
}

function getEvent(id: string): any {
  const event = EventLoader.getInstance().getEventById(id);
  assert(event != null, `missing event: ${id}`);
  return event;
}

function assertSocialEventRewrite(
  id: string,
  expression: string,
  content: {
    title?: string;
    text?: string;
    description?: string;
    metadata?: Record<string, unknown>;
  },
): void {
  const event = getEvent(id);
  const condition = event.conditions?.[0];
  assert(condition?.type === 'expression', `${id} must use an expression condition`);
  assert(condition.expression === expression, `${id} expression mismatch: ${condition.expression}`);

  if (content.title !== undefined) {
    assert(event.content?.title === content.title, `${id} title mismatch: ${event.content?.title}`);
  }
  if (content.text !== undefined) {
    assert(event.content?.text === content.text, `${id} text mismatch: ${event.content?.text}`);
  }
  if (content.description !== undefined) {
    assert(event.content?.description === content.description, `${id} description mismatch: ${event.content?.description}`);
  }
  if (content.metadata !== undefined) {
    assertDeepEqual(event.metadata, content.metadata, `${id} metadata mismatch`);
  }
}

function testTraitDoesNotWriteLifeState(): void {
  const affectionate = temperaments.find(item => item.id === 'affectionate');
  assert(affectionate !== undefined, 'affectionate temperament exists');
  assert(!('startingStates' in affectionate), 'affectionate must not initialize family state');

  const eventTypesSource = fs.readFileSync(path.resolve('src/types/eventTypes.ts'), 'utf8');
  const traitSystemSource = fs.readFileSync(path.resolve('src/core/TraitSystem.ts'), 'utf8');
  assert(!/startingStates\??:|stateBiases\??:/.test(eventTypesSource), 'Trait contract must not expose life-state modifiers');
  assert(!/startingStates|stateBiases/.test(traitSystemSource), 'TraitSystem must not apply life-state modifiers');
}

function testSocialEchoRemainsFactOnly(): void {
  const state = createState();
  state.flags = {};
  state.player.flags = {};
  state.player.lifeStates = createDefaultPlayerLifeStates();

  executeActiveActionOnState(state, 'action_socializing_basic', {
    random: () => 0.5,
    includeDisturbance: false,
  });

  assert(state.flags.p9_echo_social_hook === true, 'social echo history fact remains');
  assertDeepEqual(state.player.lifeStates, createDefaultPlayerLifeStates(), 'social echo must not change lifeStates');

  const source = fs.readFileSync(path.resolve('src/core/activePlanning/ActivePlanningService.ts'), 'utf8');
  assert(!source.includes('mapEchoFlagToLifeState'), 'echo-to-life-state mapper must be removed');
  assert(!source.includes('collectShapingLongTermImpactLines'), 'active action must not emit shaping impacts');
}

function testFormalRuntimeDoesNotUseDeletedAxes(): void {
  const source = fs.readFileSync(path.resolve('src/core/GameEngineIntegration.ts'), 'utf8');
  assert(!source.includes('applyLifeStateRecovery'), 'time advancement must not decay deleted axes');
  assert(!source.includes('getFormalEventStateMultiplier'), 'formal scheduling must not use deleted axes');
  assert(!source.includes('applyFormalEventConsequences'), 'formal results must not synthesize deleted axes');
  assert(!/socialGain|familyGain/.test(source), 'tag/stat gain thresholds must not synthesize life states');
}

function findDailyEvent(id: string) {
  const event = dailyEvents.find(item => item.id === id);
  if (!event) throw new Error(`daily event not found: ${id}`);
  return event;
}

function testDailyEventsDoNotUseDeletedAxes(): void {
  const eventTypesSource = fs.readFileSync(path.resolve('src/types/eventTypes.ts'), 'utf8');
  assert(!eventTypesSource.includes('preferredStates'), 'DailyEventConfig must not expose preferredStates');

  for (const event of dailyEvents) {
    assert(!('preferredStates' in event), `${event.id} must not expose preferredStates`);
    for (const variant of Object.values(event.variants).flat()) {
      assert(
        !(variant.stateEffects ?? []).some(effect =>
          effect.state === ('familyBond' as never) || effect.state === ('socialMomentum' as never)),
        `${variant.id} must not produce deleted life states`,
      );
    }
  }

  const source = fs.readFileSync(path.resolve('src/core/DailyEventSystem.ts'), 'utf8');
  assert(!source.includes('preferredStates'), 'DailyEventSystem must not interpret preferredStates');
  assert(!source.includes('getGroupStateMultiplier'), 'deleted axes must not drive group multipliers');
  assert(!/socialMomentum|familyBond/.test(source), 'DailyEventSystem must not read deleted axes');
}

function testDailyWeightsAreAxisIndependent(): void {
  const state = createState();
  state.player.age = 30;
  state.player.lifeStates = createDefaultPlayerLifeStates();
  const config = findDailyEvent('daily_take_odd_job');
  const getWeight = (dailyEventSystem as unknown as {
    getWeight(config: typeof config, state: GameState): number;
  }).getWeight.bind(dailyEventSystem);

  const base = getWeight(config, state);
  const legacyInjected = structuredClone(state) as GameState;
  (legacyInjected.player.lifeStates as unknown as Record<string, number>).socialMomentum = 5;
  (legacyInjected.player.lifeStates as unknown as Record<string, number>).familyBond = 5;

  assert(getWeight(config, legacyInjected) === base, 'legacy injected axes must not affect daily weight');
}

function eventHasLifeStateTarget(eventId: string, target: string): boolean {
  const event = EventLoader.getInstance().getEventById(eventId);
  if (!event) throw new Error(`event not found: ${eventId}`);
  const effects = [
    ...(event.autoEffects ?? []),
    ...(event.choices ?? []).flatMap(choice => choice.effects ?? []),
  ];
  return effects.some(effect => effect.type === 'life_state_change' && effect.target === target);
}

function testFamilyContentRemoval(): void {
  assert(!eventHasLifeStateTarget('family_child_born', 'familyBond'), 'child birth uses children and has_child only');
  assert(!eventHasLifeStateTarget('family_crisis', 'familyBond'), 'family crisis uses concrete outcomes only');

  for (const id of [
    'p28_family_bond_elder_care',
    'p28_family_bond_sibling_support',
    'p28_family_bond_caretaker_obligation',
    'p42_family_bond_festival_reunion',
    'p42_family_bond_estate_trust',
  ]) {
    assert(EventLoader.getInstance().getEventById(id) === undefined, `${id} must not be in the active event pool`);
  }

  const manifest = fs.readFileSync(path.resolve('src/data/event-asset-manifest.json'), 'utf8');
  assert(!/p28_family_bond_|p42_family_bond_/.test(manifest), 'deleted family-axis events must leave manifest');
}

function testSocialEventCopyAndExpressions(): void {
  assertSocialEventRewrite('p42_social_momentum_youth_introduction', 'connections >= 5 || reputation >= 10', {
    title: '初识引见',
    text: '你平日积下的口碑，让一位长辈愿意把你引荐给更有门路的人。这是青年时少见的机会——接下引见，便要开始维护更上一层的关系。',
    description: 'P42 青年社交：已有门路或口碑带来的引见',
  });

  assertSocialEventRewrite('p28_social_momentum_network_fork', 'connections >= 10 || flags.p42_social_youth_intro_accepted == true', {
    title: '人脉成线',
    text: '你已有的门路和人情往来，已把熟识之人连成一张能互相引介的网。眼下有人邀你参加一场只认门路不认名帖的私宴。',
    description: 'P28 社交分岔：现实门路形成的人脉网络',
  });

  assertSocialEventRewrite('p28_social_reputation_reinforcement', 'flags.p28_social_network_opened == true', {
    title: '席间扬名',
    text: '你在既有门路里积攒的信用终于有了回响。一次席间议事中，你被推到台前，若应对得当，不仅能得名，还能把零散关系拧成真正可用的同盟。',
    description: 'P28 社交强化：既有网络带来的同盟',
  });

  assertSocialEventRewrite('p29_social_momentum_patron_obligation', 'flags.ally_network == true', {
    title: '人情担保',
    text: '你和同盟之间的往来终于到了要兑现的时候。有人请你为一桩大事作保，一旦答应，名声与人脉都要押上去；若推辞，也会折损几分旧日情面。',
    description: 'P29 社交后果：可用同盟带来的人情担保义务',
  });

  assertSocialEventRewrite(
    'p42_social_momentum_later_testimonial',
    'reputation >= 20 && (flags.p28_social_reputation_reinforced == true || flags.p29_social_patron_obligation_taken == true)',
    {
      title: '晚岁证名',
      text: '数十年人脉与信用，让你在暮年仍被请出来为后辈作保、为旧友作证。这份晚岁回响不是一时名头，而是长期声望与长期社会经历的兑现。',
      description: 'P42 晚年社交：长期声望与回响',
    },
  );

  assertSocialEventRewrite('p29_social_momentum_healer_network', 'flags.medical_talent == true && (connections >= 10 || reputation >= 10)', {
    title: '口碑相传',
    text: '你已有医术经历，又在江湖与市井间积攒了口碑，让病患不必经武馆或镖局引荐，便寻上门来。有人请你驻点施诊，亦有人愿为医馆作保。',
    description: 'P29 医术池：医术经历与口碑带来的医者人脉',
    metadata: {
      enabled: true,
      tags: ['p29', 'medical', 'non_combat'],
      authoringSemantics: {
        authoringNotes: 'P29 medical crossover; requires medical talent plus reputation or connections.',
      },
    },
  });
}

export function runCanonicalFamilySocialLifeStateRemovalTests(): void {
  testTraitDoesNotWriteLifeState();
  testSocialEchoRemainsFactOnly();
  testFormalRuntimeDoesNotUseDeletedAxes();
  testDailyEventsDoNotUseDeletedAxes();
  testDailyWeightsAreAxisIndependent();
  testFamilyContentRemoval();
  testSocialEventCopyAndExpressions();
}

runCanonicalFamilySocialLifeStateRemovalTests();
console.log('canonicalFamilySocialLifeStateRemoval.test.ts passed');
