/**
 * Medical stat_modify additive semantics contract.
 *
 * Every stat_modify effect authored in src/data/lines/medical.json expresses an
 * additive/subtractive delta. The EventExecutor StatModifyHandler defaults a
 * missing operator to `set` (absolute value), so an unqualified stat_modify was
 * being applied as an absolute set, producing counterintuitive visible losses.
 *
 * This contract fixes authoring truth at the source: every Medical stat_modify
 * must carry an explicit `operator: 'add'`, and the real regression symptoms are
 * pinned so the delta semantics cannot silently regress to `set`.
 */
import assert from 'node:assert/strict';
import { EventExecutor } from '../src/core/EventExecutor';
import { EventLoader } from '../src/core/EventLoader';
import { generateChoiceFeedback } from '../src/core/ChoiceFeedbackGenerator';
import type { EffectDefinition, EventDefinition, GameState, PlayerState } from '../src/types';

function baseGameState(overrides: Partial<PlayerState> = {}): GameState {
  const player = {
    name: '医术测试',
    age: 8,
    gender: 'male',
    martialPower: 10,
    chivalry: 10,
    constitution: 10,
    reputation: 30,
    knowledge: 10,
    charisma: 10,
    businessAcumen: 0,
    influence: 0,
    connections: 10,
    martialHeritage: 0,
    scholarlyHeritage: 0,
    merchantNetwork: 0,
    wealthCapacity: 'no_surplus' as const,
    affiliation: null,
    title: null,
    flags: {},
    events: [],
    relationships: [],
    children: 0,
    spouse: null,
    alive: true,
    healthStatus: 'healthy' as const,
    statuses: [],
    investments: [],
    traits: [],
    lifeStates: {
      trainingHabit: 0,
      studyHabit: 0,
      businessHabit: 0,
    },
    ...overrides,
  };
  return {
    saveVersion: '1.0.0',
    lastSavedAt: Date.now(),
    gameTimestamp: Date.now(),
    player,
    triggeredEvents: [],
    eventHistory: [],
    flags: {},
    relations: {},
    inventory: [],
    statistics: { totalEvents: 0, totalChoices: 0, playTime: 0 },
  } as GameState;
}

function getEvent(id: string): EventDefinition {
  const event = EventLoader.getInstance().getEventById(id);
  assert(event, `missing Medical event: ${id}`);
  return event;
}

function getChoice(event: EventDefinition, choiceId: string) {
  const choice = (event.choices ?? []).find(item => item.id === choiceId);
  assert(choice, `missing choice ${choiceId} in ${event.id}`);
  return choice;
}

function collectStatModify(effects: EffectDefinition[]): Array<{ stat: string; value: number; operator?: string }> {
  return effects
    .filter((effect): effect is EffectDefinition & { value: number } => effect.type === 'stat_modify')
    .map(effect => ({
      stat: effect.stat || (effect as { target?: string }).target || '',
      value: Number(effect.value),
      operator: (effect as { operator?: string }).operator,
    }));
}

async function executeEffects(effects: EffectDefinition[], state: GameState): Promise<GameState> {
  return new EventExecutor().executeEffects(effects, state);
}

// ---------------------------------------------------------------------------
// A. medical_talent_discovery — real AE symptom
// ---------------------------------------------------------------------------
async function testTalentDiscoveryAdditive(): Promise<void> {
  const event = getEvent('medical_talent_discovery');
  const choice = getChoice(event, 'medical_talent_discovery_choice_1');
  const deltas = collectStatModify(choice.effects);
  const knowledgeDelta = deltas.find(item => item.stat === 'knowledge');
  const chivalryDelta = deltas.find(item => item.stat === 'chivalry');
  assert(knowledgeDelta && knowledgeDelta.value === 5, '医学天赋学识增量必须为 +5');
  assert(chivalryDelta && chivalryDelta.value === 5, '医学天赋侠义增量必须为 +5');

  const state = baseGameState({ knowledge: 16, chivalry: 18, age: 8 });
  const after = await executeEffects(choice.effects, state);

  assert.equal(after.player.knowledge, 16 + 5, '学识必须按增量上升到 21，而非重置为 5');
  assert.equal(after.player.chivalry, 18 + 5, '侠义必须按增量上升到 23，而非重置为 5');
}

// ---------------------------------------------------------------------------
// B. medical_plague_outbreak — choice gated on knowledge >= 40
// ---------------------------------------------------------------------------
async function testPlagueOutbreakAdditive(): Promise<void> {
  const event = getEvent('medical_plague_outbreak');
  const choice = getChoice(event, 'medical_plague_outbreak_choice_1');
  const deltas = collectStatModify(choice.effects);
  const chivalryDelta = deltas.find(item => item.stat === 'chivalry');
  const reputationDelta = deltas.find(item => item.stat === 'reputation');
  const knowledgeDelta = deltas.find(item => item.stat === 'knowledge');
  assert(chivalryDelta && chivalryDelta.value === 20, '瘟疫救治侠义增量必须为 +20');
  assert(reputationDelta && reputationDelta.value === 30, '瘟疫救治名望增量必须为 +30');
  assert(knowledgeDelta && knowledgeDelta.value === 10, '瘟疫救治学识增量必须为 +10');

  const state = baseGameState({ knowledge: 42, chivalry: 50, reputation: 60, age: 25 });
  const after = await executeEffects(choice.effects, state);

  assert.equal(after.player.knowledge, 42 + 10, '学识必须按增量上升，而非重置为 10');
  assert.equal(after.player.chivalry, 50 + 20, '侠义必须按增量上升');
  assert.equal(after.player.reputation, Math.max(0, 60 + 30), '名望必须按增量上升');
}

// ---------------------------------------------------------------------------
// C. medical_poison_king — auto event with positive/negative deltas
// ---------------------------------------------------------------------------
async function testPoisonKingAdditive(): Promise<void> {
  const event = getEvent('medical_poison_king');
  assert.equal(event.eventType, 'auto');
  const deltas = collectStatModify(event.autoEffects ?? []);
  const martialDelta = deltas.find(item => item.stat === 'martialPower');
  const reputationDelta = deltas.find(item => item.stat === 'reputation');
  const chivalryDelta = deltas.find(item => item.stat === 'chivalry');
  assert(martialDelta && martialDelta.value === 20, '毒王功力增量必须为 +20');
  assert(reputationDelta && reputationDelta.value === -20, '毒王名望增量为 -20');
  assert(chivalryDelta && chivalryDelta.value === -10, '毒王侠义增量为 -10');

  const state = baseGameState({ martialPower: 120, reputation: 50, chivalry: 40, age: 40 });
  const after = await executeEffects(event.autoEffects ?? [], state);

  assert.equal(after.player.martialPower, 120 + 20, '功力必须按增量上升到 140，而非重置为 20');
  assert.equal(after.player.reputation, Math.max(0, 50 - 20), '名望必须按 -20 增量计算（30），而非绝对设为负再截断');
  assert.equal(after.player.chivalry, 40 - 10, '侠义必须按 -10 增量计算');
}

// ---------------------------------------------------------------------------
// Medical-wide authoring invariant — every stat_modify must be additive
// ---------------------------------------------------------------------------
function testMedicalWideAdditiveInvariant(): void {
  // The canonical Medical catalog is exactly the 21 authored events in
  // src/data/lines/medical.json, all exposed by the runtime EventLoader.
  const medicalIds = ['medical_talent_discovery', 'p27_study_habit_healer_reinforcement', 'p29_study_habit_case_record_duty', 'p29_social_momentum_healer_network', 'medical_master_apprentice', 'medical_herb_gathering', 'medical_herb_gathering_self_taught', 'medical_clinic_practice', 'medical_plague_outbreak', 'medical_poison_temptation', 'medical_dual_cultivation', 'medical_divine_doctor_fame', 'medical_imperial_doctor', 'medical_palace_intrigue', 'medical_medical_book', 'medical_poison_king', 'medical_ending_divine_doctor', 'medical_ending_poison_king', 'medical_ending_imperial_doctor', 'medical_ending_folk_doctor', 'medical_ending_hermit'];

  let total = 0;
  let withAdd = 0;
  const offenders: string[] = [];
  for (const id of medicalIds) {
    const event = getEvent(id);
    const effectArrays: EffectDefinition[][] = [
      ...(event.autoEffects ?? []).map(effect => [effect]),
    ];
    for (const choice of event.choices ?? []) {
      for (const effect of choice.effects ?? []) {
        effectArrays.push([effect]);
      }
    }
    for (const entry of effectArrays) {
      for (const effect of collectStatModify(entry)) {
        total += 1;
        if (effect.operator === 'add') {
          withAdd += 1;
        } else {
          offenders.push(`${id}:${effect.stat}`);
        }
      }
    }
  }

  assert(total > 0, 'Medical 事件必须包含至少一个 stat_modify');
  assert.equal(withAdd, total, `所有 ${total} 个 Medical stat_modify 必须显式声明 operator:'add'，缺失/其他操作符：${offenders.join(', ')}`);
  console.log(`   Medical stat_modify total=${total}, operator:add=${withAdd}, offenders=0`);
}

// ---------------------------------------------------------------------------
// Player-visible feedback reflects additive deltas, not absolute-set losses
// ---------------------------------------------------------------------------
async function testVisibleFeedbackDelta(): Promise<void> {
  const event = getEvent('medical_talent_discovery');
  const choice = getChoice(event, 'medical_talent_discovery_choice_1');
  const before = baseGameState({ knowledge: 16, chivalry: 18, age: 8 });

  const beforeSnap = structuredClone(before.player);
  const after = await executeEffects(choice.effects, before);

  const feedback = generateChoiceFeedback({
    narrativeResult: '学习医术',
    effects: choice.effects,
    beforePlayer: beforeSnap,
    afterPlayer: after.player,
  });

  const knowledgeImpact = feedback.player.statImpacts.find(item => item.stat === 'knowledge');
  const chivalryImpact = feedback.player.statImpacts.find(item => item.stat === 'chivalry');
  assert(knowledgeImpact && knowledgeImpact.delta === +5, `可见反馈学识必须为 +5，实际 ${knowledgeImpact?.delta}`);
  assert(chivalryImpact && chivalryImpact.delta === +5, `可见反馈侠义必须为 +5，实际 ${chivalryImpact?.delta}`);
}

async function main(): Promise<void> {
  console.log('=== Medical stat_modify additive semantics ===');
  await testTalentDiscoveryAdditive();
  await testPlagueOutbreakAdditive();
  await testPoisonKingAdditive();
  testMedicalWideAdditiveInvariant();
  await testVisibleFeedbackDelta();
  console.log('✅ Medical stat_modify additive semantics tests passed');
}

await main();
