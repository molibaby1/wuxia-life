/**
 * P38 frustration remediation regression — isolated entry.
 * Runs independently: npm exec tsx tests/p38FrustrationRemediationTests.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { EventLoader } from '../src/core/EventLoader';
import relationshipLegacyDeferredEvents from '../src/data/lines/relationship-person-legacy-deferred.json';
import { collectFrustrationMetrics } from '../src/p8/collectPersonaMetrics';
import type { GameProcessRecord } from '../src/types/simulationRecordTypes';
import type { EffectDefinition, GameState } from '../src/types/eventTypes';

const BLOCKER_PERSONAS = [
  'p8-martial-lin',
  'p8-social-gu',
  'p8-wealth-shen',
  'p8-cautious-han',
  'p8-deviant-ye',
  'p8-balanced-wei',
] as const;

const PASSING_PERSONAS = ['p8-scholar-su', 'p8-explorer-lu'] as const;

function fixedEventText(eventId: 'setback_injury' | 'setback_property_loss'): string {
  const text = EventLoader.getInstance().getEventById(eventId)?.content?.text;
  if (!text) throw new Error(`missing narrative text for ${eventId}`);
  return text;
}

function deferredRelationshipEvent(eventId: string): EventDefinition {
  const event = (relationshipLegacyDeferredEvents as EventDefinition[]).find(candidate => candidate.id === eventId);
  if (!event) throw new Error(`missing deferred relationship event ${eventId}`);
  return event;
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function state(player: Record<string, unknown>): GameState {
  return { player } as GameState;
}

function record(
  eventId: string,
  eventText: string,
  stateBefore: GameState,
  stateAfter: GameState,
  selectedChoice?: { id: string; text: string; description?: string },
  outcomeText?: string,
  executedEffects?: EffectDefinition[],
): GameProcessRecord {
  return {
    age: 20,
    eventId,
    eventTitle: eventId,
    eventText,
    ...(selectedChoice ? { selectedChoice: selectedChoice as GameProcessRecord['selectedChoice'] } : {}),
    ...(outcomeText ? { outcomeText } : {}),
    gameState: stateBefore,
    outcomeEvidence: { stateBefore, stateAfter, ...(executedEffects ? { executedEffects } : {}) },
    eventType: selectedChoice ? 'choice' : 'auto',
    timestamp: new Date().toISOString(),
  };
}

function testDangerousForegroundRequiresActualNegativeResult(): void {
  const fightRecords = Array.from({ length: 7 }, () =>
    record(
      'hero_road_peril',
      '押镖途中遇伏，对方人数远超预料，前路危机四伏。',
      state({ martialPower: 10 }),
      state({ martialPower: 13 }),
      { id: 'hero_peril_fight', text: '硬闯脱困', description: '你硬闯险路——可能身负重伤，但可保镖不失。' },
    ),
  );
  const result = collectFrustrationMetrics(fightRecords);
  assert(result.setbacks.length === 0, 'seven hero_peril_fight outcomes must not be setbacks');

  const nearMiss = collectFrustrationMetrics([
    record(
      'synthetic_near_miss',
      '你险些死亡，但及时避开了致命一击。',
      state({ alive: true, reputation: 10 }),
      state({ alive: true, reputation: 10 }),
    ),
  ]);
  assert(nearMiss.setbacks.length === 0, 'near-miss text without a negative delta must be excluded');
}

function testMixedTradeoffRetainsActualNegativeResult(): void {
  const result = collectFrustrationMetrics([
    record(
      'hero_road_peril',
      '押镖途中遇伏，对方人数远超预料，前路危机四伏。',
      state({ reputation: 10, connections: 1 }),
      state({ reputation: 7, connections: 5 }),
      { id: 'hero_peril_retreat', text: '退避寻援', description: '你暂缓押镖，先寻援手，以保全身而退。' },
    ),
  ]);
  assert(result.setbacks.length === 1, 'hero_peril_retreat reputation loss must remain a setback');
  assert(result.setbacks[0]?.classification === 'opaque', 'retreat has no reputation-specific warning or explanation');
}

function testLocalChoiceEvidenceDoesNotAttachAutoEffects(): void {
  const buggyLocalRecord = record(
    'hero_road_peril',
    '押镖途中遇伏，对方人数远超预料，前路危机四伏。',
    state({ reputation: 10, connections: 1 }),
    state({ reputation: 7, connections: 5 }),
    { id: 'hero_peril_retreat', text: '退避寻援', description: '你暂缓押镖，先寻援手，以保全身而退。' },
    undefined,
    [],
  );
  const buggyResult = collectFrustrationMetrics([buggyLocalRecord]);
  assert(
    buggyResult.setbacks.length === 0,
    'the old Local record with unrelated executedEffects: [] must reproduce the missed choice setback',
  );

  const simulatorSource = fs.readFileSync(path.join(process.cwd(), 'tests/GameProcessSimulator.ts'), 'utf8');
  const choiceBranchStart = simulatorSource.indexOf("if (eventType === 'choice'");
  const autoBranchStart = simulatorSource.indexOf('    } else {', choiceBranchStart);
  assert(choiceBranchStart >= 0 && autoBranchStart > choiceBranchStart, 'Local choice branch must be present');
  assert(
    !/executedEffects:\s*event\.autoEffects/.test(simulatorSource.slice(choiceBranchStart, autoBranchStart)),
    'Local choice producer must not attach event.autoEffects as choice evidence',
  );

  const correctedResult = collectFrustrationMetrics([
    record(
      'hero_road_peril',
      '押镖途中遇伏，对方人数远超预料，前路危机四伏。',
      state({ reputation: 10, connections: 1 }),
      state({ reputation: 7, connections: 5 }),
      { id: 'hero_peril_retreat', text: '退避寻援', description: '你暂缓押镖，先寻援手，以保全身而退。' },
    ),
  ]);
  assert(correctedResult.setbacks.length === 1, 'Local choice without effects evidence must use its state diff');
  assert(correctedResult.setbacks[0]?.classification === 'opaque', 'Local retreat remains opaque');
}

function testSimulatorDoesNotPreferProducingAChild(): void {
  const simulatorSource = fs.readFileSync(path.join(process.cwd(), 'tests/GameProcessSimulator.ts'), 'utf8');
  assert(
    !simulatorSource.includes("if (flagName === 'has_child')"),
    'balanced and relationship simulator personas must not prefer has_child by a fixed score',
  );
}

function testRecoveryAndRealSetbacks(): void {
  const recovery = collectFrustrationMetrics([
    record(
      'orthodox_trial_recovery',
      '你因修劲受伤，师兄安排你静养并重修基础心法。',
      state({ healthStatus: 'seriously_injured', statuses: ['injured'] }),
      state({ healthStatus: 'unwell', statuses: [] }),
    ),
  ]);
  assert(recovery.setbacks.length === 0, 'orthodox_trial_recovery must not be a setback');

  const injuryText = fixedEventText('setback_injury');
  const injury = collectFrustrationMetrics([
    record(
      'setback_injury',
      injuryText,
      state({ constitution: 50, martialPower: 20, healthStatus: 'healthy', statuses: [] }),
      state({ constitution: 45, martialPower: 17, healthStatus: 'unwell', statuses: ['injured'] }),
    ),
  ]);
  assert(injury.setbacks.length === 1, 'setback_injury must remain a real setback');
  assert(injury.setbacks[0]?.classification !== 'opaque', 'setback_injury has visible cause or recovery path');

  const propertyText = fixedEventText('setback_property_loss');
  const property = collectFrustrationMetrics([
    record(
      'setback_property_loss',
      propertyText,
      state({}),
      state({}),
    ),
  ]);
  assert(property.setbacks.length === 0, 'legacy wallet-only property loss must not be a P8 setback');
}

function testRealOpaqueResultRemainsOpaque(): void {
  const result = collectFrustrationMetrics([
    record(
      'synthetic_opaque_result',
      '你继续赶路。',
      state({ reputation: 100 }),
      state({ reputation: 90 }),
    ),
  ]);
  assert(result.setbacks.length === 1, 'actual unexplained negative result must be a setback');
  assert(result.setbacks[0]?.classification === 'opaque', 'unexplained negative result must remain opaque');
  assert(result.opaqueRatio === 1, 'one opaque result must produce opaque ratio 1');
}

function testDailyNegativeStateEvidenceIsClassified(): void {
  const explained = collectFrustrationMetrics([
    record(
      'daily_morning_training_neg_1',
      '你勉强练完，心里却始终烦躁，没什么收获。',
      state({ statuses: [] }),
      state({ statuses: ['anxious'] }),
    ),
  ]);
  assert(explained.setbacks.length === 1, 'a newly applied negative status must be a setback');
  assert(
    explained.setbacks[0]?.classification === 'explained',
    'the daily negative result has a player-visible explanation',
  );

  const noResult = collectFrustrationMetrics([
    record(
      'daily_morning_training_neg_1',
      '你勉强练完，心里却始终烦躁，没什么收获。',
      state({ statuses: ['anxious'] }),
      state({ statuses: ['anxious'] }),
    ),
  ]);
  assert(noResult.setbacks.length === 0, 'an already-present status is not a newly suffered result');
}

function testAutomaticEventUsesItsOwnExecutedEffects(): void {
  const result = collectFrustrationMetrics([
    record(
      'synthetic_positive_auto',
      '你稳步前行，功力有所精进。',
      state({ martialPower: 10 }),
      state({ martialPower: 5 }),
      undefined,
      undefined,
      [
        {
          type: 'stat_modify',
          stat: 'martialPower',
          target: 'martialPower',
          value: 3,
          operator: 'add',
        },
      ],
    ),
  ]);
  assert(result.setbacks.length === 0, 'a later net state decrease must not taint a positive automatic event');

  const emptyEvidenceResult = collectFrustrationMetrics([
    record(
      'synthetic_empty_auto',
      '你继续赶路。',
      state({ businessAcumen: 50 }),
      state({ businessAcumen: 50 }),
      undefined,
      undefined,
      [],
    ),
  ]);
  assert(
    emptyEvidenceResult.setbacks.length === 0,
    'an automatic event with authoritative empty effects must not fall back to a surrounding state diff',
  );
}

function testHeadlessAndLocalEvidenceParity(): void {
  const stateBefore = state({ constitution: 50, martialPower: 20, healthStatus: 'healthy', statuses: [] });
  const stateAfter = state({ constitution: 45, martialPower: 17, healthStatus: 'unwell', statuses: ['injured'] });
  const headless = collectFrustrationMetrics([
    record('synthetic_parity', '因用力过猛导致你受伤，暂停调息后还有恢复之机。', stateBefore, stateAfter),
  ]);
  const local = collectFrustrationMetrics([
    record(
      'synthetic_parity',
      '因用力过猛导致你受伤，暂停调息后还有恢复之机。',
      stateBefore,
      stateAfter,
      undefined,
      '因用力过猛导致你受伤，暂停调息后还有恢复之机。',
    ),
  ]);
  assert(
    headless.setbacks.length === local.setbacks.length &&
      headless.setbacks[0]?.classification === local.setbacks[0]?.classification,
    'Headless and Local evidence paths must classify the same executed result identically',
  );
}

function testInventoryBClassifierCoverage(): void {
  const family = collectFrustrationMetrics([
    record(
      'family_crisis',
      '家族遭遇困难，需要你出面解决。家人也在等待你的抉择——是倾尽家财，还是量力而行？',
      state({ reputation: 10 }),
      state({ reputation: 0 }),
      { id: 'family_self_protection', text: '抽身自保，先守住自家日子 (声望 -10)' },
      '家里的难关终于摆到了眼前，你再也不能把它当成与己无关的事。',
    ),
  ]);
  assert(family.setbacks.length === 1, 'family crisis must contain actual reputation evidence');
  assert(family.setbacks[0]?.classification === 'warned', '声望 -10 is a player-visible reputation warning');

  const patron = collectFrustrationMetrics([
    record(
      'p29_social_momentum_patron_obligation',
      '你和同盟之间的往来终于到了要兑现的时候。有人请你为一桩大事作保，一旦答应，名声与人脉都要押上去；若推辞，也会折损几分旧日情面。',
      state({ connections: 25 }),
      state({ connections: 23 }),
      { id: 'decline_the_petition', text: '婉拒担保，保留后手' },
      '你获得了新的体悟。',
    ),
  ]);
  assert(patron.setbacks.length === 1, 'patron obligation must contain actual connections evidence');
  assert(patron.setbacks[0]?.classification === 'warned', '折损旧日情面 is a player-visible connections warning');

  const isolation = collectFrustrationMetrics([
    record(
      'demonic_midlife_isolation_family',
      '江湖正道避你如蛇蝎，旧友疏远。家人在灯下问你：当初成家时的诺言，还可信吗？此路若再走下去，家与门，孰轻孰重？',
      state({
        reputation: 24,
        relationships: [{ id: 'family_support', affinity: 40 }],
      }),
      state({
        reputation: 18,
        relationships: [{ id: 'family_support', affinity: 32 }],
      }),
      undefined,
      '关于你的传言似乎不那么美好了。',
    ),
  ]);
  assert(isolation.setbacks.length === 1, 'isolation must contain actual reputation and relationship evidence');
  assert(isolation.setbacks[0]?.classification === 'explained', '旧友疏远 and worsening rumors explain the loss');

  const grayMission = collectFrustrationMetrics([
    record(
      'sect_midlife_gray_mission',
      '师门下达剿灭令，目标竟是当年你下山行善所救之人。长老以大局压你，要你瞒天过海。',
      state({ relationships: [{ id: 'master_qingxu', affinity: 30 }] }),
      state({ relationships: [{ id: 'master_qingxu', affinity: 22 }] }),
      {
        id: 'gray_refuse_order',
        text: '拒令请罪',
        description: '你当殿拒令，愿受门规惩处。清虚真人震怒，却念你昔日功绩从轻发落。【L1 可避重罚】',
      },
      '与某人的关系发生了微妙的变化。',
    ),
  ]);
  assert(grayMission.setbacks.length === 1, 'gray mission must contain actual relationship evidence');
  assert(
    grayMission.setbacks[0]?.classification === 'explained' || grayMission.setbacks[0]?.classification === 'recoverable',
    '震怒 and 从轻发落 explain or provide recovery for the relationship loss',
  );

  const dailyAnxiety = collectFrustrationMetrics([
    record(
      'daily_reading_notes_neg_1',
      '你记了半天，越看越觉得前后矛盾，心里反倒添了几分烦躁。',
      state({ statuses: [] }),
      state({ statuses: ['anxious'] }),
      undefined,
      '你的心中泛起涟漪，但一切似乎又归于平静。',
    ),
  ]);
  assert(dailyAnxiety.setbacks.length === 1, 'daily reading must contain actual anxious status evidence');
  assert(dailyAnxiety.setbacks[0]?.classification === 'explained', '烦躁 explains the newly added anxious status');
}

function testInventoryAFalsePositiveControls(): void {
  const master = collectFrustrationMetrics([
    record(
      'relationship_master_disciple',
      '你遇到了一位武林高手，他对你颇为赏识，有意收你为徒。这是你武学道路上的重要契机。',
      state({ martialPower: 32, reputation: 14 }),
      state({ martialPower: 20, reputation: 15 }),
      { id: 'master_disciple', text: '拜入名门（需学识≥40）' },
      '你的武艺似乎有些生疏。',
    ),
  ]);
  const outlaw = collectFrustrationMetrics([
    record(
      'outlaw_path_beginning',
      '你在江湖游历时，偶然接触到一些不受「正道联盟」认可的门派。',
      state({ martialPower: 22 }),
      state({ martialPower: 5 }),
      { id: 'join_outlaw', text: '加入幽影门' },
      '你的武艺似乎有些生疏。',
    ),
  ]);
  const retreat = collectFrustrationMetrics([
    record(
      'hero_road_peril',
      '押镖途中遇伏，对方人数远超预料，前路危机四伏。',
      state({ reputation: 10, connections: 3 }),
      state({ reputation: 7, connections: 7 }),
      { id: 'hero_peril_retreat', text: '退避寻援', description: '你暂缓押镖，先寻援手，以保全身而退。' },
      '关于你的传言似乎不那么美好了。',
    ),
  ]);
  const swornHelp = collectFrustrationMetrics([
    record(
      'relationship_sworn_help',
      '你的结拜兄弟/姐妹遇到了麻烦，请你帮忙。作为结义之人，你义不容辞。',
      state({ martialPower: 20, constitution: 9, reputation: 22, chivalry: 10 }),
      state({ martialPower: 10, constitution: 0, reputation: 15, chivalry: 15 }),
      { id: 'sworn_help', text: '全力相助（需武力≥70，侠义 +15）' },
      '你的心中似乎多了一丝动摇。',
    ),
  ]);
  const refugee = collectFrustrationMetrics([
    record(
      'refugee_sect_story',
      '你在山间遇到一位流浪武者，对方曾是某个小门派的弟子。他告诉你，他们门派因为不愿归顺「正道联盟」，被污蔑为「魔教」分支，遭到围剿灭门。',
      state({ chivalry: 29, connections: 2 }),
      state({ chivalry: 5, connections: 10 }),
      { id: 'sympathize_refugee', text: '同情他的遭遇' },
      '你的心中似乎多了一丝动摇。',
    ),
  ]);

  for (const [name, result] of [
    ['relationship_master_disciple', master],
    ['outlaw_path_beginning', outlaw],
    ['hero_peril_retreat', retreat],
    ['relationship_sworn_help', swornHelp],
    ['refugee_sect_story', refugee],
  ] as const) {
    assert(result.setbacks.length === 1, `${name} must remain an actual setback`);
    assert(result.setbacks[0]?.classification === 'opaque', `${name} must remain opaque as an A-class content gap`);
  }

  const unrelatedReputationWord = collectFrustrationMetrics([
    record(
      'synthetic_unrelated_reputation_word',
      '你的声望一向很好，但这次钱袋少了一些。',
      state({ businessAcumen: 50 }),
      state({ businessAcumen: 50 }),
    ),
  ]);
  assert(unrelatedReputationWord.setbacks.length === 0, 'money loss must not create a setback despite reputation wording');

  const unrelatedAnger = collectFrustrationMetrics([
    record(
      'synthetic_unrelated_anger',
      '某人震怒，但这次钱财确实损失了。',
      state({ businessAcumen: 50 }),
      state({ businessAcumen: 50 }),
    ),
  ]);
  assert(unrelatedAnger.setbacks.length === 0, 'money loss must not create a setback despite unrelated anger wording');

  const unrelatedRecovery = collectFrustrationMetrics([
    record(
      'synthetic_unrelated_recovery',
      '某人注意到，钱财确实损失了，但关系还有机会恢复。',
      state({
        relationships: [{ id: 'master_qingxu', affinity: 30 }],
      }),
      state({
        relationships: [{ id: 'master_qingxu', affinity: 20 }],
      }),
    ),
  ]);
  assert(
    unrelatedRecovery.setbacks[0]?.classification === 'recoverable',
    'a relationship recovery path must classify the real relationship loss, not the money loss',
  );

  const unrelatedAnxiety = collectFrustrationMetrics([
    record(
      'synthetic_unrelated_anxiety',
      '你有些烦躁。',
      state({ businessAcumen: 50 }),
      state({ businessAcumen: 50 }),
    ),
  ]);
  assert(unrelatedAnxiety.setbacks.length === 0, 'money loss must not create a setback despite unrelated anxiety wording');
}

function testWealthOpaquePresentationTargets(): void {
  const perilEvent = EventLoader.getInstance().getEventById('hero_road_peril');
  const retreatChoice = perilEvent?.choices?.find(choice => choice.id === 'hero_peril_retreat');
  assert(perilEvent && retreatChoice, 'hero_road_peril hero_peril_retreat must load');
  const retreatResult = collectFrustrationMetrics([
    record(
      perilEvent.id,
      perilEvent.content?.text ?? '',
      state({ reputation: 10, connections: 3 }),
      state({ reputation: 7, connections: 7 }),
      retreatChoice as GameProcessRecord['selectedChoice'],
      '关于你的传言似乎不那么美好了。',
    ),
  ]);
  assert(retreatResult.setbacks.length === 1, 'retreat must retain its actual reputation setback');
  assert(
    retreatResult.setbacks[0]?.classification === 'warned',
    'retreat choice must warn about the reputation cost while retaining the connections benefit',
  );

  const swornHelpEvent = deferredRelationshipEvent('relationship_sworn_help');
  const swornHelpChoice = swornHelpEvent?.choices?.find(choice => choice.text?.startsWith('全力相助'));
  assert(swornHelpEvent && swornHelpChoice, 'relationship_sworn_help full-help choice must load');
  const swornHelpResult = collectFrustrationMetrics([
    record(
      swornHelpEvent.id,
      swornHelpEvent.content?.text ?? '',
      state({ martialPower: 20, constitution: 9, reputation: 22, chivalry: 10 }),
      state({ martialPower: 10, constitution: 0, reputation: 15, chivalry: 15 }),
      swornHelpChoice as GameProcessRecord['selectedChoice'],
      '你的心中似乎多了一丝动摇。',
    ),
  ]);
  assert(swornHelpResult.setbacks.length === 1, 'full help must retain its actual mixed setback');
  assert(
    swornHelpResult.setbacks[0]?.classification === 'warned',
    'full-help choice must warn about its martial, constitution, and reputation costs',
  );
}

function testWealthTargetEffectInvariance(): void {
  const merchantEvent = EventLoader.getInstance().getEventById('merchant_talent_discovery');
  const merchantChoice = merchantEvent?.choices?.find(choice => choice.id === 'study_business');
  assert(
    JSON.stringify(merchantChoice?.effects) ===
      JSON.stringify([
        { type: 'stat_modify', stat: 'charisma', value: 5 },
        { type: 'wealth_capacity_raise_to', minimum: 'modest_savings' },
        { type: 'flag_set', flag: 'merchant_talent', value: true },
        { type: 'flag_set', flag: 'route_merchant', value: true },
      ]),
    'merchant target effects must remain unchanged',
  );
  assert(merchantEvent?.weight === 100, 'merchant target weight must remain unchanged');
  assert(JSON.stringify(merchantEvent?.ageRange) === JSON.stringify({ min: 8, max: 16 }), 'merchant age range must remain unchanged');
  assert(JSON.stringify(merchantEvent?.triggers) === JSON.stringify([{ type: 'age_reach', value: 8 }]), 'merchant triggers must remain unchanged');
  assert(
    JSON.stringify(merchantEvent?.conditions) ===
      JSON.stringify([
        {
          type: 'expression',
          expression:
            '(charisma >= 12 || flags.origin_merchant_family == true || flags.hvg_merchant_ledger_track == true || flags.hvg_merchant_caravan_track == true || flags.hvg_merchant_first_challenge_done == true) && (flags.merchant_childhood_seed_done == true || flags.p8_route_wealth == true || flags.route_merchant == true)',
        },
      ]),
    'merchant conditions must remain unchanged',
  );

  const perilEvent = EventLoader.getInstance().getEventById('hero_road_peril');
  const retreatChoice = perilEvent?.choices?.find(choice => choice.id === 'hero_peril_retreat');
  assert(
    JSON.stringify(retreatChoice?.effects) ===
      JSON.stringify([
        { type: 'stat_modify', target: 'reputation', value: 3, operator: 'subtract' },
        { type: 'stat_modify', target: 'connections', value: 4, operator: 'add' },
        { type: 'flag_set', target: 'hero_road_peril', value: true },
        { type: 'event_record', target: 'hero_peril_retreat' },
      ]),
    'retreat target effects must remain unchanged',
  );
  assert(perilEvent?.weight === 65, 'retreat target event weight must remain unchanged');
  assert(JSON.stringify(perilEvent?.ageRange) === JSON.stringify({ min: 24, max: 40 }), 'retreat age range must remain unchanged');
  assert(JSON.stringify(perilEvent?.triggers) === JSON.stringify([{ type: 'age_reach', value: 24 }]), 'retreat triggers must remain unchanged');

  const swornHelpEvent = deferredRelationshipEvent('relationship_sworn_help');
  const swornHelpChoice = swornHelpEvent?.choices?.find(choice => choice.text?.startsWith('全力相助'));
  assert(
    JSON.stringify(swornHelpChoice?.effects) ===
      JSON.stringify([
        { type: 'stat_modify', stat: 'chivalry', value: 15 },
        { type: 'stat_modify', stat: 'martialPower', value: 10 },
        { type: 'stat_modify', stat: 'reputation', value: 15 },
        { type: 'stat_modify', stat: 'constitution', value: -5 },
      ]),
    'full-help target effects must remain unchanged',
  );
  assert(swornHelpEvent?.weight === 55, 'full-help target event weight must remain unchanged');
  assert(JSON.stringify(swornHelpEvent?.ageRange) === JSON.stringify({ min: 25, max: 55 }), 'full-help age range must remain unchanged');
  assert(JSON.stringify(swornHelpEvent?.triggers) === JSON.stringify([{ type: 'age_reach', value: 25 }, { type: 'random', value: 0.12 }]), 'full-help triggers must remain unchanged');
  assert(
    JSON.stringify(swornHelpEvent?.conditions) ===
      JSON.stringify([{ type: 'expression', expression: 'flags.has_sworn_siblings == true' }]),
    'full-help conditions must remain unchanged',
  );
}

function testBlockerPersonaThresholdFromGateReport(): void {
  const gatePath = path.join(process.cwd(), 'tests/fixtures/gates/p8-playability-gate-latest.json');
  if (!fs.existsSync(gatePath)) {
    console.log('p38FrustrationRemediationTests: skipping gate report assert (run gate:playability first)');
    return;
  }
  const gate = JSON.parse(fs.readFileSync(gatePath, 'utf8')) as {
    personaRuns?: Array<{ personaId: string; frustration?: { opaqueRatio: number } }>;
  };

  let belowThreshold = 0;
  for (const personaId of BLOCKER_PERSONAS) {
    const run = gate.personaRuns?.find(p => p.personaId === personaId);
    if (!run?.frustration) continue;
    if (run.frustration.opaqueRatio < 0.35) belowThreshold += 1;
  }
  assert(
    belowThreshold >= 4,
    `expected ≥4/6 blocker personas opaque ratio <0.35, got ${belowThreshold}`,
  );

  for (const personaId of PASSING_PERSONAS) {
    const run = gate.personaRuns?.find(p => p.personaId === personaId);
    if (!run?.frustration) continue;
    assert(
      run.frustration.opaqueRatio < 0.35,
      `${personaId} should not regress (opaque ratio ${run.frustration.opaqueRatio})`,
    );
  }
}

function main(): void {
  testDangerousForegroundRequiresActualNegativeResult();
  testMixedTradeoffRetainsActualNegativeResult();
  testLocalChoiceEvidenceDoesNotAttachAutoEffects();
  testSimulatorDoesNotPreferProducingAChild();
  testRecoveryAndRealSetbacks();
  testRealOpaqueResultRemainsOpaque();
  testDailyNegativeStateEvidenceIsClassified();
  testAutomaticEventUsesItsOwnExecutedEffects();
  testHeadlessAndLocalEvidenceParity();
  testInventoryBClassifierCoverage();
  testInventoryAFalsePositiveControls();
  testWealthOpaquePresentationTargets();
  testWealthTargetEffectInvariance();
  testBlockerPersonaThresholdFromGateReport();
  console.log('p38FrustrationRemediationTests: all passed');
}

main();
