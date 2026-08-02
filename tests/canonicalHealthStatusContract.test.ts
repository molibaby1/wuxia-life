import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateHealthStatusEffect, validateStatusCondition } from '../src/contracts/validation/contractValidation';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { EventExecutor } from '../src/core/EventExecutor';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { isHealthStatus, isStatusId } from '../src/types/eventTypes';
import { P8_PERSONA_ROSTER } from '../src/p8/personas';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function loadLines(file: string): any[] {
  return JSON.parse(readFileSync(resolve('src/data/lines', file), 'utf8')) as any[];
}

function findEvent(file: string, id: string): any {
  const event = loadLines(file).find(item => item.id === id);
  if (!event) throw new Error(`event not found: ${id}`);
  return event;
}

function findNestedById(value: any, id: string): any {
  if (!value || typeof value !== 'object') return undefined;
  if (value.id === id) return value;
  for (const child of Array.isArray(value) ? value : Object.values(value)) {
    const match = findNestedById(child, id);
    if (match) return match;
  }
  return undefined;
}

function findChoiceByText(event: any, text: string): any {
  const choice = (event.choices ?? []).find((item: any) => item.text === text);
  if (!choice) throw new Error(`choice not found: ${text}`);
  return choice;
}

function assertCanonicalInjury(effects: any[], expectedHealthStatus: string, label: string): void {
  assert(!effects.some(effect => effect.type === 'stat_modify' && (effect.stat === 'health' || effect.target === 'health')), `${label} must not modify health`);
  assert(effects.some(effect => effect.type === 'health_status_set' && effect.value === expectedHealthStatus), `${label} must set ${expectedHealthStatus}`);
}

function assertAddsInjured(effects: any[], label: string): void {
  assert(effects.some(effect => effect.type === 'status_add' && effect.status === 'injured'), `${label} must add injured`);
}

async function run(): Promise<void> {
  assert(isHealthStatus('seriously_injured'), 'approved HealthStatus must be accepted');
  assert(!isHealthStatus('broken_leg'), 'unknown HealthStatus must be rejected');
  assert(isStatusId('injured'), 'approved StatusId must be accepted');
  assert(!isStatusId('poisoned'), 'unknown StatusId must be rejected');

  assert(validateHealthStatusEffect({ type: 'health_status_set', value: 'healthy' }).ok, 'valid health status effect must validate');
  assert(validateHealthStatusEffect({ type: 'status_add', status: 'injured' }).ok, 'valid status_add effect must validate');
  assert(validateHealthStatusEffect({ type: 'status_remove', status: 'injured' }).ok, 'valid status_remove effect must validate');
  assert(!validateHealthStatusEffect({ type: 'health_status_set', value: 'broken_leg' }).ok, 'invalid health status must fail validation');
  assert(!validateHealthStatusEffect({ type: 'status_add', status: 'poisoned' }).ok, 'invalid status must fail validation');
  assert(validateStatusCondition({ type: 'status_has', status: 'injured' }).ok, 'valid status condition must validate');
  assert(!validateStatusCondition({ type: 'status_has', status: 'poisoned' }).ok, 'invalid status condition must fail validation');

  const engine = new GameEngineIntegration();
  engine.startNewGame('Canonical Health Status', 'male');
  const executor = new EventExecutor();
  const evaluator = new ConditionEvaluator();
  let state = engine.getGameState();

  state = await executor.executeEffects([
    { type: 'health_status_set', value: 'seriously_injured' },
    { type: 'status_add', status: 'injured' },
    { type: 'status_add', status: 'injured' },
  ] as never, state);
  assert(state.player.healthStatus === 'seriously_injured', 'health_status_set must set only healthStatus');
  assert(JSON.stringify(state.player.statuses) === JSON.stringify(['injured']), 'status_add must be idempotent');
  assert(evaluator.evaluate({ type: 'status_has', status: 'injured' }, state), 'status_has must read canonical statuses');

  state = await executor.executeEffects([{ type: 'status_remove', status: 'ill' }] as never, state);
  assert(JSON.stringify(state.player.statuses) === JSON.stringify(['injured']), 'removing absent status must be a no-op');
  state = await executor.executeEffects([{ type: 'status_remove', status: 'injured' }] as never, state);
  assert(state.player.statuses.length === 0, 'status_remove must remove only the requested status');
  assert(state.player.healthStatus === 'seriously_injured', 'status removal must not infer healthStatus');

  const injuryEvent = findEvent('general.json', 'sect_trial_entry');
  const injuryChoice = injuryEvent.choices.find((choice: any) => choice.id === 'trial_basic_fail');
  const recoveryEvent = findEvent('general.json', 'sect_trial_recover');
  assert(injuryChoice && recoveryEvent, 'real injury lifecycle fixtures must exist');

  state = await executor.executeEffects(injuryChoice.effects as never, state);
  state.flags.sect_trial_active = true;
  assert(state.player.healthStatus === 'seriously_injured', 'real injury must set seriously_injured');
  assert(state.player.statuses.includes('injured'), 'real injury must add injured');
  assert(recoveryEvent.conditions.every((condition: any) => evaluator.evaluate(condition, state)), 'recovery conditions must detect current injured status');

  state = await executor.executeEffects(recoveryEvent.autoEffects as never, state);
  assert(!state.player.statuses.includes('injured'), 'recovery must remove injured');
  assert(state.player.healthStatus === 'unwell', 'recovery must explicitly set its resulting healthStatus');
  assert(!evaluator.evaluate({ type: 'status_has', status: 'injured' }, state), 'status_has must be false after recovery');

  const lightInjury = findNestedById(findEvent('chivalry-events.json', 'chivalry_high_hero_save'), 'partial');
  const seriousInjury = findNestedById(findEvent('love.json', 'love_life_or_death'), 'love_save_her');
  assert(lightInjury, 'light injury fixture must exist');
  assert(seriousInjury, 'serious injury fixture must exist');
  assertCanonicalInjury(lightInjury.effects, 'unwell', 'light injury');
  assertAddsInjured(lightInjury.effects, 'light injury');
  assertCanonicalInjury(seriousInjury.effects, 'seriously_injured', 'serious injury');
  assertAddsInjured(seriousInjury.effects, 'serious injury');

  const dailyRecovery = findEvent('daily.json', 'daily_injury_recovery');
  assert(dailyRecovery.conditions.some((condition: any) => condition.type === 'status_has' && condition.status === 'injured'), 'daily recovery must require injured');
  state.player.statuses = ['injured', 'ill', 'fatigued', 'anxious'];
  state.player.healthStatus = 'seriously_injured';
  state = await executor.executeEffects(dailyRecovery.autoEffects as never, state);
  assert(state.player.healthStatus === 'unwell', 'daily recovery must set unwell');
  assert(JSON.stringify(state.player.statuses) === JSON.stringify(['ill', 'fatigued', 'anxious']), 'daily recovery must preserve unrelated statuses');

  const setbackInjury = findEvent('setback-events.json', 'setback_injury');
  assertCanonicalInjury(setbackInjury.autoEffects, 'unwell', 'setback injury');
  assertAddsInjured(setbackInjury.autoEffects, 'setback injury');
  assert(!setbackInjury.autoEffects.some((effect: any) => effect.type === 'flag_set' && effect.target === 'setback_injury_active'), 'setback injury must not set its legacy flag');

  const medicalEvent = findEvent('money-events.json', 'money_medical_heal');
  const ordinaryTreatment = findChoiceByText(medicalEvent, '普通治疗（金钱 -50，缓解伤势）');
  const hardCarry = findChoiceByText(medicalEvent, '硬扛（伤势恶化，体质 -5）');
  assertCanonicalInjury(ordinaryTreatment.effects, 'unwell', 'ordinary medical treatment');
  assert(ordinaryTreatment.effects.some((effect: any) => effect.type === 'status_remove' && effect.status === 'injured'), 'ordinary medical treatment must remove injured');
  assertCanonicalInjury(hardCarry.effects, 'seriously_injured', 'hard carry');
  assertAddsInjured(hardCarry.effects, 'hard carry');

  const rebirth = findEvent('adventure.json', 'adventure_rebirth_chance');
  state.player.healthStatus = 'seriously_injured';
  state.player.statuses = ['injured', 'ill', 'fatigued', 'anxious'];
  state = await executor.executeEffects(rebirth.autoEffects as never, state);
  assert(state.player.healthStatus === 'healthy', 'rebirth must set healthy');
  assert(JSON.stringify(state.player.statuses) === JSON.stringify(['fatigued', 'anxious']), 'rebirth must remove only injured and ill');

  const ambiguous = findNestedById(loadLines('identity-hero.json'), 'hero_peril_fight');
  assert(!ambiguous.effects.some((effect: any) => effect.type === 'stat_modify' && (effect.stat === 'health' || effect.target === 'health')), 'ambiguous injury path must not modify health');
  assert(!ambiguous.effects.some((effect: any) => effect.type === 'status_add'), 'ambiguous injury path must not add statuses');
  assert(!ambiguous.effects.some((effect: any) => effect.type === 'health_status_set'), 'ambiguous injury path must not set healthStatus');

  state = await executor.executeEffects([{ type: 'stat_modify', target: 'health', value: 20, operator: 'add' }] as never, state);
  assert(!Object.prototype.hasOwnProperty.call(state.player, 'health'), 'EventExecutor must reject health writes without creating a legacy field');
  assert(!evaluator.evaluate({ type: 'expression', expression: 'health >= 50' }, state), 'health numeric conditions must be rejected');
  assert(!evaluator.evaluate({ type: 'expression', expression: 'player.health >= 50' }, state), 'player.health numeric conditions must be rejected');
  assert(evaluator.evaluate({ type: 'expression', expression: 'player.healthStatus == "healthy" || player.healthStatus == "unwell"' }, state), 'healthStatus conditions must remain readable');

  const trainingGate = findNestedById(loadLines('training-events.json'), 'training_intensive_6months');
  const trainingCondition = trainingGate.conditions[0];
  for (const [healthStatus, allowed] of [
    ['healthy', true],
    ['unwell', true],
    ['seriously_ill', false],
    ['seriously_injured', false],
    ['critical', false],
  ] as const) {
    state.player.healthStatus = healthStatus;
    assert(evaluator.evaluate(trainingCondition, state) === allowed, `training gate must ${allowed ? 'allow' : 'reject'} ${healthStatus}`);
  }

  const shopEvents = [
    findEvent('shop.json', 'shop_first_visit'),
    findEvent('shop.json', 'shop_herb_shop'),
    findEvent('shop.json', 'shop_legendary_merchant'),
    findEvent('shop.json', 'shop_grateful_vendor'),
  ];
  for (const shopEvent of shopEvents) {
    assert(!JSON.stringify(shopEvent).includes('"health"'), `${shopEvent.id} must not contain health effects`);
    assert(!JSON.stringify(shopEvent).includes('"health_status_set"'), `${shopEvent.id} must not auto-set healthStatus`);
    assert(!JSON.stringify(shopEvent).includes('"status_add"'), `${shopEvent.id} must not auto-add statuses`);
    assert(!JSON.stringify(shopEvent).includes('"status_remove"'), `${shopEvent.id} must not auto-remove statuses`);
  }
  const firstVisitChoices = findEvent('shop.json', 'shop_first_visit').choices;
  assert(!firstVisitChoices.some((choice: any) => choice.text.includes('疗伤药')), 'empty first-visit medicine choice must be removed');
  const herbChoices = findEvent('shop.json', 'shop_herb_shop').choices;
  assert(!herbChoices.some((choice: any) => choice.text.includes('金创药') || choice.text.includes('普通草药')), 'empty herb choices must be removed');
  const gratefulPartial = findEvent('shop.json', 'shop_grateful_vendor').choices.find((choice: any) => choice.text.includes('只收下一部分'));
  assert(!gratefulPartial.effects.some((effect: any) => effect.stat === 'internalSkill'), 'grateful partial choice must not retain pruned internalSkill reward');
  assert(gratefulPartial.effects.some((effect: any) => effect.stat === 'chivalry'), 'grateful partial choice must retain chivalry reward');

  const cautiousPersona = P8_PERSONA_ROSTER.find(persona => persona.id === 'p8-cautious-han');
  assert(cautiousPersona !== undefined, 'cautious persona must exist');
  if (!cautiousPersona) throw new Error('cautious persona missing');
  const healthGoals = cautiousPersona.shortTermGoals.filter(goal => goal.id === 'han-health' || goal.id === 'han-stable-40');
  assert(healthGoals.every(goal => goal.evidenceTypes.includes('health_status') && goal.evidenceSpec.healthStatuses?.join(',') === 'healthy,unwell'), 'persona health goals must use canonical statuses');
  assert(healthGoals.every(goal => goal.evidenceSpec.stat !== 'health'), 'persona health goals must not use numeric health');

  state = await executor.executeEffects([{ type: 'status_add', status: 'ill' }] as never, state);
  state.flags.injured = true;
  assert(!evaluator.evaluate({ type: 'status_has', status: 'injured' }, state), 'status_has must not fallback to flags');
  assert(state.player.statuses.includes('ill'), 'unrelated statuses must coexist');

  console.log('canonicalHealthStatusContract.test.ts: ok');
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
