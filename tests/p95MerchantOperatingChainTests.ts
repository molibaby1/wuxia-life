import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { EventLoader } from '../src/core/EventLoader';
import {
  deriveSampleLineCostLabel,
  deriveSampleLineCurrentGoal,
  isPlayerVisibleSampleLineText,
} from '../src/p50/sampleLineExpression';
import { addAsset } from '../src/core/assetOwnership';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function merchantState(overrides: Partial<GameState> = {}): GameState {
  const flags = {
    origin_merchant_family: true,
    route_merchant: true,
    merchant_childhood_seed_done: true,
    hvg_merchant_early_fork_done: true,
    hvg_merchant_post_fork_confirmation_done: true,
    hvg_merchant_first_challenge_done: true,
    merchant_shop_grocery: true,
    ...(overrides.flags ?? {}),
  };
  const facts =
    overrides.facts
    ?? (flags.merchant_shop_grocery ? addAsset({}, 'merchant_shop') : {});

  return {
    ...overrides,
    facts,
    player: {
      age: 18,
      charisma: 10,
      money: 80,
      businessAcumen: 10,
      connections: 8,
      reputation: 8,
      ...overrides.player,
    } as PlayerState,
    flags,
  } as GameState;
}

function testEventsLoad(): void {
  const loader = EventLoader.getInstance();
  const rhythm = loader.getEventById('hvg_merchant_post_shop_operating_rhythm');
  const pressure = loader.getEventById('hvg_merchant_first_operating_pressure');
  assert(Boolean(rhythm), 'hvg_merchant_post_shop_operating_rhythm should load');
  assert(Boolean(pressure), 'hvg_merchant_first_operating_pressure should load');
  assert(rhythm!.ageRange!.min === 16 && rhythm!.ageRange!.max === 19, 'rhythm age 16-19');
  assert(pressure!.ageRange!.min === 19 && pressure!.ageRange!.max === 22, 'pressure age 19-22');
}

function testRhythmGates(): void {
  const evaluator = new ConditionEvaluator();
  const loader = EventLoader.getInstance();
  const event = loader.getEventById('hvg_merchant_post_shop_operating_rhythm')!;

  const ledger = merchantState({
    flags: { hvg_merchant_ledger_track: true },
    player: { age: 17 } as PlayerState,
  });
  assert(evaluator.evaluate(event.conditions![0], ledger), 'ledger path eligible for rhythm');

  const caravan = merchantState({
    flags: { hvg_merchant_caravan_track: true },
    player: { age: 17 } as PlayerState,
  });
  assert(evaluator.evaluate(event.conditions![0], caravan), 'caravan path eligible for rhythm');

  const noShop = merchantState({
    flags: { hvg_merchant_ledger_track: true, merchant_shop_grocery: false },
    player: { age: 17 } as PlayerState,
  });
  assert(!evaluator.evaluate(event.conditions![0], noShop), 'rhythm blocked without shop');

  const ledgerChoice = event.choices!.find(c => c.id === 'ledger_rhythm_steady')!;
  const caravanChoice = event.choices!.find(c => c.id === 'caravan_rhythm_fast')!;
  assert(evaluator.evaluate(ledgerChoice.condition!, ledger), 'ledger rhythm choice on ledger track');
  assert(!evaluator.evaluate(ledgerChoice.condition!, caravan), 'ledger rhythm hidden on caravan');
  assert(evaluator.evaluate(caravanChoice.condition!, caravan), 'caravan rhythm on caravan track');
}

function testPressureGates(): void {
  const evaluator = new ConditionEvaluator();
  const event = EventLoader.getInstance().getEventById('hvg_merchant_first_operating_pressure')!;

  const ledgerReady = merchantState({
    flags: {
      hvg_merchant_ledger_track: true,
      hvg_merchant_post_shop_rhythm_done: true,
    },
    player: { age: 20 } as PlayerState,
  });
  assert(evaluator.evaluate(event.conditions![0], ledgerReady), 'ledger pressure eligible');

  const caravanReady = merchantState({
    flags: {
      hvg_merchant_caravan_track: true,
      hvg_merchant_post_shop_rhythm_done: true,
    },
    player: { age: 20 } as PlayerState,
  });
  assert(evaluator.evaluate(event.conditions![0], caravanReady), 'caravan pressure eligible');

  const noRhythm = merchantState({
    flags: { hvg_merchant_ledger_track: true },
    player: { age: 20 } as PlayerState,
  });
  assert(!evaluator.evaluate(event.conditions![0], noRhythm), 'pressure blocked without rhythm');
}

function testTrackSpecificPressureChoices(): void {
  const evaluator = new ConditionEvaluator();
  const event = EventLoader.getInstance().getEventById('hvg_merchant_first_operating_pressure')!;

  const ledgerState = merchantState({
    flags: {
      hvg_merchant_ledger_track: true,
      hvg_merchant_post_shop_rhythm_done: true,
    },
    player: { age: 20 } as PlayerState,
  });
  const ledgerChoices = event.choices!.filter(c =>
    !c.condition || evaluator.evaluate(c.condition, ledgerState),
  );
  assert(ledgerChoices.length === 2, 'ledger track exposes two pressure choices');
  assert(ledgerChoices.every(c => c.id.startsWith('ledger_')), 'ledger-only pressure choices');

  const caravanState = merchantState({
    flags: {
      hvg_merchant_caravan_track: true,
      hvg_merchant_post_shop_rhythm_done: true,
    },
    player: { age: 20 } as PlayerState,
  });
  const caravanChoices = event.choices!.filter(c =>
    !c.condition || evaluator.evaluate(c.condition, caravanState),
  );
  assert(caravanChoices.length === 2, 'caravan track exposes two pressure choices');
  assert(caravanChoices.every(c => c.id.startsWith('caravan_')), 'caravan-only pressure choices');
}

function testDownstreamContinuity(): void {
  const evaluator = new ConditionEvaluator();
  const loader = EventLoader.getInstance();
  const shopFailure = loader.getEventById('merchant_shop_failure')!;
  const caravanGuard = loader.getEventById('merchant_caravan_guard')!;

  const ledgerSteadyNoPressure = merchantState({
    flags: { hvg_merchant_ledger_track: true },
    player: { age: 20 } as PlayerState,
  });
  assert(
    !evaluator.evaluate(shopFailure.conditions![1], ledgerSteadyNoPressure),
    'ledger steady: shop_failure gated until P95 chain progresses',
  );

  const ledgerAfterPressure = merchantState({
    flags: {
      hvg_merchant_ledger_track: true,
      hvg_merchant_operating_pressure_done: true,
    },
    player: { age: 22 } as PlayerState,
  });
  assert(
    evaluator.evaluate(shopFailure.conditions![1], ledgerAfterPressure),
    'shop_failure opens after operating pressure for ledger track',
  );

  const caravanNoPressure = merchantState({
    facts: {},
    flags: {
      hvg_merchant_caravan_track: true,
      merchant_shop_grocery: false,
    },
    player: { age: 20 } as PlayerState,
  });
  assert(
    !evaluator.evaluate(caravanGuard.conditions![0], caravanNoPressure),
    'caravan guard gated until P95 rhythm/pressure for caravan track',
  );

  const caravanAfterPressure = merchantState({
    flags: {
      hvg_merchant_caravan_track: true,
      hvg_merchant_operating_pressure_done: true,
    },
    player: { age: 22 } as PlayerState,
  });
  assert(
    evaluator.evaluate(caravanGuard.conditions![0], caravanAfterPressure),
    'caravan guard opens after operating pressure for caravan track',
  );
}

function testPlayerFacingGoalsDifferByTrack(): void {
  const ledgerGoal = deriveSampleLineCurrentGoal(merchantState({
    flags: {
      hvg_merchant_ledger_track: true,
      hvg_merchant_post_shop_rhythm_done: true,
      hvg_merchant_operating_pressure_done: true,
      hvg_merchant_ledger_pressure_credit: true,
    },
    player: { age: 23 } as PlayerState,
  })) ?? '';
  const caravanGoal = deriveSampleLineCurrentGoal(merchantState({
    flags: {
      hvg_merchant_caravan_track: true,
      hvg_merchant_post_shop_rhythm_done: true,
      hvg_merchant_operating_pressure_done: true,
      hvg_merchant_caravan_pressure_swing_loss: true,
    },
    player: { age: 23 } as PlayerState,
  })) ?? '';

  assert(ledgerGoal.includes('赊欠') || ledgerGoal.includes('周转'), `ledger goal unexpected: ${ledgerGoal}`);
  assert(caravanGoal.includes('行市') || caravanGoal.includes('押货'), `caravan goal unexpected: ${caravanGoal}`);
  assert(ledgerGoal !== caravanGoal, 'ledger and caravan goals must differ at age 23');
  assert(!ledgerGoal.includes('店铺经营中'), `ledger goal still generic: ${ledgerGoal}`);
  assert(isPlayerVisibleSampleLineText(ledgerGoal), `raw key in ledger goal: ${ledgerGoal}`);
  assert(isPlayerVisibleSampleLineText(caravanGoal), `raw key in caravan goal: ${caravanGoal}`);
}

function testRhythmGoalImmediate(): void {
  const goal = deriveSampleLineCurrentGoal(merchantState({
    flags: {
      hvg_merchant_ledger_track: true,
      hvg_merchant_post_shop_rhythm_done: true,
      hvg_merchant_ledger_rhythm_steady: true,
    },
    player: { age: 17 } as PlayerState,
  })) ?? '';
  assert(goal.includes('赊欠') || goal.includes('周转'), `post-rhythm ledger goal: ${goal}`);
  assert(!goal.includes('店铺经营中'), `rhythm goal still generic: ${goal}`);
}

function testCostLabelSurvivesToCheckpoint(): void {
  const ledgerCost = deriveSampleLineCostLabel(merchantState({
    flags: {
      hvg_merchant_ledger_track: true,
      hvg_merchant_post_shop_rhythm_done: true,
      hvg_merchant_operating_pressure_done: true,
      hvg_merchant_ledger_pressure_stockout: true,
    },
    player: { age: 23 } as PlayerState,
  }));
  const caravanCost = deriveSampleLineCostLabel(merchantState({
    flags: {
      hvg_merchant_caravan_track: true,
      hvg_merchant_post_shop_rhythm_done: true,
      hvg_merchant_operating_pressure_done: true,
      hvg_merchant_caravan_pressure_swing_win: true,
    },
    player: { age: 23 } as PlayerState,
  }));
  assert(ledgerCost.includes('断货') || ledgerCost.includes('赊欠'), `ledger cost: ${ledgerCost}`);
  assert(caravanCost.includes('波动') || caravanCost.includes('行市'), `caravan cost: ${caravanCost}`);
  assert(ledgerCost !== caravanCost, 'cost labels must differ by track');
}

function renderProofMarkdown(): string {
  const ledgerState = merchantState({
    flags: {
      hvg_merchant_ledger_track: true,
      hvg_merchant_post_shop_rhythm_done: true,
      hvg_merchant_operating_pressure_done: true,
      hvg_merchant_ledger_pressure_credit: true,
    },
    player: { age: 23 } as PlayerState,
  });
  const caravanState = merchantState({
    flags: {
      hvg_merchant_caravan_track: true,
      hvg_merchant_post_shop_rhythm_done: true,
      hvg_merchant_operating_pressure_done: true,
      hvg_merchant_caravan_pressure_swing_loss: true,
    },
    player: { age: 23 } as PlayerState,
  });

  const ledgerGoal = deriveSampleLineCurrentGoal(ledgerState) ?? '';
  const caravanGoal = deriveSampleLineCurrentGoal(caravanState) ?? '';

  return [
    '# P95 Merchant 16-25 Operating Chain Proof',
    '',
    'Narrow proof for post-shop rhythm + first operating pressure chain.',
    '',
    '## Ledger path (age 23)',
    '',
    '| Field | Value |',
    '| --- | --- |',
    '| age | 23 |',
    '| route flags | origin_merchant_family, route_merchant, merchant_shop_grocery |',
    '| branch flag | hvg_merchant_ledger_track |',
    '| chain flags | hvg_merchant_post_shop_rhythm_done, hvg_merchant_operating_pressure_done, hvg_merchant_ledger_pressure_credit |',
    `| player-facing outcome | ${ledgerGoal} |`,
    '',
    '## Caravan path (age 23)',
    '',
    '| Field | Value |',
    '| --- | --- |',
    '| age | 23 |',
    '| route flags | origin_merchant_family, route_merchant, merchant_shop_grocery |',
    '| branch flag | hvg_merchant_caravan_track |',
    '| chain flags | hvg_merchant_post_shop_rhythm_done, hvg_merchant_operating_pressure_done, hvg_merchant_caravan_pressure_swing_loss |',
    `| player-facing outcome | ${caravanGoal} |`,
    '',
    '## Continuity',
    '',
    '- `merchant_shop_failure` reads `hvg_merchant_operating_pressure_done` for ledger track gating',
    '- `merchant_caravan_guard` reads P95 caravan rhythm/pressure flags for caravan track gating',
    '- `merchant_first_shop` remains age 16-22 entry milestone (unchanged)',
    '',
  ].join('\n');
}

export async function runP95MerchantOperatingChainTests(): Promise<void> {
  testEventsLoad();
  testRhythmGates();
  testPressureGates();
  testTrackSpecificPressureChoices();
  testDownstreamContinuity();
  testPlayerFacingGoalsDifferByTrack();
  testRhythmGoalImmediate();
  testCostLabelSurvivesToCheckpoint();

  const proof = renderProofMarkdown();
  const outPath = join(process.cwd(), 'artifacts/reports/p95-merchant-16-25-operating-chain-proof.md');
  writeFileSync(outPath, `${proof}\n`, 'utf8');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runP95MerchantOperatingChainTests()
    .then(() => console.log('p95MerchantOperatingChainTests: ok'))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
