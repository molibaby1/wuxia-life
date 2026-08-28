import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { EventLoader } from '../src/core/EventLoader';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { GAME_STATE_SNAPSHOT_SCHEMA_VERSION } from '../src/contracts/gameStateSnapshot';
import type { EffectDefinition, EventDefinition } from '../src/types/eventTypes';

const RETIRED_EVENT_IDS = [
  'p9_wealth_caravan_gate',
  'career_business_empire',
  'merchant_crisis',
] as const;

const RETIRED_IDENTITY_PRODUCERS = [
  'p9_route_identity_wealth',
  'wealth_caravan_magnate',
  'wealth_steady_trader',
] as const;

function makeState(flags: Record<string, unknown>, age: number) {
  const state = new GameEngineIntegration().getGameState();
  state.flags = { ...flags };
  state.player.flags = { ...flags };
  state.player.age = age;
  return state;
}

function eventCondition(eventId: string): string {
  const event = EventLoader.getInstance().getEventById(eventId);
  assert(event?.conditions?.[0], `missing conditions for ${eventId}`);
  const condition = event.conditions[0];
  assert(condition.type === 'expression' && condition.expression, `${eventId} must use expression condition`);
  return condition.expression;
}

function collectFormalMoneyDeclarations(): {
  total: number;
  executable: number;
  nonExecutable: number;
  randomMoney: number;
} {
  const loader = EventLoader.getInstance();
  let total = 0;
  let executable = 0;
  let nonExecutable = 0;
  let randomMoney = 0;

  const scanEffects = (effects: EffectDefinition[] | undefined) => {
    for (const effect of effects ?? []) {
      const target = effect.target ?? effect.stat;
      if (target !== 'money') {
        continue;
      }
      total += 1;
      if (effect.type === 'random') {
        nonExecutable += 1;
        randomMoney += 1;
      } else if (effect.type === 'stat_modify') {
        executable += 1;
      }
    }
  };

  for (const event of loader.getAllEvents()) {
    scanEffects(event.autoEffects);
    for (const choice of event.choices ?? []) {
      scanEffects(choice.effects);
    }
  }

  return { total, executable, nonExecutable, randomMoney };
}

function scanProductionSources(pattern: RegExp): string[] {
  const roots = ['src/data/lines', 'src/narrative', 'src/utils', 'src/p50', 'src/core'];
  const hits: string[] = [];
  for (const root of roots) {
    const abs = path.join(process.cwd(), root);
    if (!fs.existsSync(abs)) {
      continue;
    }
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
          continue;
        }
        if (!/\.(json|ts)$/.test(entry.name)) {
          continue;
        }
        const text = fs.readFileSync(full, 'utf8');
        if (pattern.test(text)) {
          hits.push(path.relative(process.cwd(), full));
        }
      }
    };
    walk(abs);
  }
  return [...new Set(hits)];
}

function testFormalEventRetirement(): void {
  const loader = EventLoader.getInstance();
  for (const eventId of RETIRED_EVENT_IDS) {
    assert.equal(
      loader.getEventById(eventId),
      undefined,
      `formal EventLoader must not contain ${eventId}`,
    );
  }
}

function testP9HiddenIdentityRetiredFromProductionSources(): void {
  const p9Source = fs.readFileSync(path.resolve('src/data/lines/p9-remediation.json'), 'utf8');
  assert.equal(p9Source.includes('p9_wealth_caravan_gate'), false, 'p9-remediation must not retain p9_wealth_caravan_gate');
  for (const flag of RETIRED_IDENTITY_PRODUCERS) {
    assert.equal(p9Source.includes(flag), false, `${flag} must not remain in p9-remediation.json`);
  }
}

function testBrokenRandomMoneyDeclarationRemoved(): void {
  const stats = collectFormalMoneyDeclarations();
  assert.equal(stats.randomMoney, 0, 'formal catalog must not retain random target:money declarations');
}

function testBusinessExpansionReachabilityAssumption(): void {
  const producerHits = scanProductionSources(/business_expansion/);
  assert.deepEqual(
    producerHits,
    [],
    `business_expansion must remain producer=0; found in: ${producerHits.join(', ') || 'none'}`,
  );

  const crisis = EventLoader.getInstance().getEventById('merchant_crisis');
  assert.equal(crisis, undefined, 'merchant_crisis must stay absent after unreachable confirmation');
}

function testRetainedP9EventsStillReachable(): void {
  const evaluator = new ConditionEvaluator();
  assert(
    evaluator.evaluate(
      { type: 'expression', expression: eventCondition('p9_childhood_first_trade') },
      makeState({ route_merchant: true, p9_early_business_focus: true }, 10),
    ),
    'p9_childhood_first_trade must remain reachable under D10 authority',
  );
  assert(
    evaluator.evaluate(
      { type: 'expression', expression: eventCondition('p9_business_echo_midlife') },
      makeState({ route_merchant: true, p9_echo_business_hook: true }, 29),
    ),
    'p9_business_echo_midlife must remain reachable under D10 authority',
  );
  assert(
    evaluator.evaluate(
      { type: 'expression', expression: eventCondition('p9_merchant_midlife_caravan') },
      makeState({
        route_merchant: true,
        p9_early_business_focus: true,
        p16_deferred_business_upbringing: true,
      }, 28),
    ),
    'p9_merchant_midlife_caravan must remain reachable under D10 authority',
  );
}

function testCanonicalMerchantPreserved(): void {
  const loader = EventLoader.getInstance();
  for (const eventId of ['merchant_business_empire', 'merchant_ending_tycoon']) {
    const event = loader.getEventById(eventId);
    assert(event, `${eventId} must remain in formal catalog`);
  }

  const empire = loader.getEventById('merchant_business_empire')!;
  const autoEffects = empire.autoEffects ?? [];
  assert(
    autoEffects.some(effect => effect.type === 'wealth_capacity_raise_to' && effect.minimum === 'regional_magnate'),
    'merchant_business_empire must retain wealthCapacity progression',
  );
  assert(
    autoEffects.some(effect => (effect.target ?? effect.flag) === 'merchant_empire'),
    'merchant_business_empire must retain merchant_empire producer',
  );
}

function testMerchantMentorIntegrity(): void {
  const mentor = EventLoader.getInstance().getEventById('merchant_mentor');
  assert(mentor, 'merchant_mentor must remain formally loaded');
  assert.equal(mentor.id, 'merchant_mentor');
}

function assertStrategicOnlyMoneyInventory(): void {
  const loader = EventLoader.getInstance();
  const byEvent = new Map<string, number>();
  for (const event of loader.getAllEvents()) {
    const scan = (effects: EffectDefinition[] | undefined) => {
      for (const effect of effects ?? []) {
        if (effect.type !== 'stat_modify') continue;
        if ((effect.target ?? effect.stat) !== 'money') continue;
        byEvent.set(event.id, (byEvent.get(event.id) ?? 0) + 1);
      }
    };
    scan(event.autoEffects);
    for (const choice of event.choices ?? []) scan(choice.effects);
  }
  assert.equal(byEvent.size, 0, `expected 0 formal money-writing events after D16, got ${[...byEvent.keys()].join(',')}`);
  let total = 0;
  for (const count of byEvent.values()) total += count;
  assert.equal(total, 0, `expected 0 formal money writes after D16, got ${total}`);
}

function testMoneyProducerInventorySanity(): void {
  assertStrategicOnlyMoneyInventory();
}

function testSnapshotUnchanged(): void {
  assert.equal(GAME_STATE_SNAPSHOT_SCHEMA_VERSION, '3.15.0');
}

function main(): void {
  testFormalEventRetirement();
  testP9HiddenIdentityRetiredFromProductionSources();
  testBrokenRandomMoneyDeclarationRemoved();
  testBusinessExpansionReachabilityAssumption();
  testRetainedP9EventsStillReachable();
  testCanonicalMerchantPreserved();
  testMerchantMentorIntegrity();
  testMoneyProducerInventorySanity();
  testSnapshotUnchanged();
  console.log('globalMoneyDeadParallelContentRetirement.test.ts: all passed');
}

main();
