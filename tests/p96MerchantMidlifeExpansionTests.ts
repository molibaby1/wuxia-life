import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { EventLoader } from '../src/core/EventLoader';
import {
  deriveSampleLineAge40Identity,
  deriveSampleLineCostLabel,
  deriveSampleLineCurrentGoal,
  isPlayerVisibleSampleLineText,
} from '../src/p50/sampleLineExpression';
import type { GameState, PlayerState } from '../src/types/eventTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function merchantState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...overrides,
    player: {
      age: 28,
      charisma: 10,
      businessAcumen: 12,
      connections: 10,
      reputation: 10,
      ...overrides.player,
    } as PlayerState,
    flags: {
      origin_merchant_family: true,
      route_merchant: true,
      merchant_childhood_seed_done: true,
      merchant_shop_grocery: true,
      hvg_merchant_ledger_track: true,
      hvg_merchant_post_shop_rhythm_done: true,
      hvg_merchant_operating_pressure_done: true,
      hvg_merchant_ledger_pressure_credit: true,
      ...(overrides.flags ?? {}),
    },
  } as GameState;
}

function testExpansionEventLoads(): void {
  const event = EventLoader.getInstance().getEventById('hvg_merchant_midlife_expansion_rhythm');
  assert(Boolean(event), 'hvg_merchant_midlife_expansion_rhythm should load');
  assert(event!.ageRange!.min === 26 && event!.ageRange!.max === 30, 'expansion rhythm age 26-30');
}

function testExpansionGates(): void {
  const evaluator = new ConditionEvaluator();
  const event = EventLoader.getInstance().getEventById('hvg_merchant_midlife_expansion_rhythm')!;

  const ledgerReady = merchantState({
    flags: { hvg_merchant_ledger_track: true },
    player: { age: 27 } as PlayerState,
  });
  assert(evaluator.evaluate(event.conditions![0], ledgerReady), 'ledger path eligible for expansion');

  const caravanReady = merchantState({
    flags: {
      hvg_merchant_ledger_track: false,
      hvg_merchant_caravan_track: true,
    },
    player: { age: 27 } as PlayerState,
  });
  assert(evaluator.evaluate(event.conditions![0], caravanReady), 'caravan path eligible for expansion');

  const noPressure = merchantState({
    flags: { hvg_merchant_operating_pressure_done: false },
    player: { age: 27 } as PlayerState,
  });
  assert(!evaluator.evaluate(event.conditions![0], noPressure), 'expansion blocked without operating pressure');

  const alreadyDone = merchantState({
    flags: { hvg_merchant_expansion_rhythm_done: true },
    player: { age: 27 } as PlayerState,
  });
  assert(!evaluator.evaluate(event.conditions![0], alreadyDone), 'expansion blocked when already done');
}

function testTrackSpecificExpansionChoices(): void {
  const evaluator = new ConditionEvaluator();
  const event = EventLoader.getInstance().getEventById('hvg_merchant_midlife_expansion_rhythm')!;

  const ledgerState = merchantState({
    flags: { hvg_merchant_ledger_track: true },
    player: { age: 27 } as PlayerState,
  });
  const ledgerChoices = event.choices!.filter(c =>
    !c.condition || evaluator.evaluate(c.condition, ledgerState),
  );
  assert(ledgerChoices.length === 2, 'ledger track exposes two expansion choices');
  assert(ledgerChoices.every(c => c.id.startsWith('ledger_')), 'ledger-only expansion choices');

  const caravanState = merchantState({
    flags: {
      hvg_merchant_ledger_track: false,
      hvg_merchant_caravan_track: true,
    },
    player: { age: 27 } as PlayerState,
  });
  const caravanChoices = event.choices!.filter(c =>
    !c.condition || evaluator.evaluate(c.condition, caravanState),
  );
  assert(caravanChoices.length === 2, 'caravan track exposes two expansion choices');
  assert(caravanChoices.every(c => c.id.startsWith('caravan_')), 'caravan-only expansion choices');
}

function testMidlifeSpineContinuity(): void {
  const evaluator = new ConditionEvaluator();
  const loader = EventLoader.getInstance();
  const debt = loader.getEventById('merchant_midlife_debt_milestone')!;
  const age40 = loader.getEventById('merchant_age40_identity_summary')!;
  const age45 = loader.getEventById('merchant_age45_expansion_fork')!;

  const ledgerExpansion = merchantState({
    flags: {
      hvg_merchant_ledger_track: true,
      hvg_merchant_expansion_rhythm_done: true,
      hvg_merchant_ledger_expansion_steady: true,
    },
    player: { age: 33 } as PlayerState,
  });
  assert(evaluator.evaluate(debt.conditions![0], ledgerExpansion), 'midlife debt eligible after expansion');

  const ledgerDebtChoice = debt.choices!.find(c => c.id === 'midlife_debt_ledger_steady')!;
  assert(
    evaluator.evaluate(ledgerDebtChoice.condition!, ledgerExpansion),
    'ledger steady debt choice visible after steady expansion',
  );

  const caravanExpansion = merchantState({
    flags: {
      hvg_merchant_ledger_track: false,
      hvg_merchant_caravan_track: true,
      hvg_merchant_expansion_rhythm_done: true,
      hvg_merchant_caravan_expansion_market: true,
      merchant_midlife_debt: true,
      merchant_midlife_debt_caravan_market: true,
      merchant_age40_identity_done: false,
    },
    player: { age: 39 } as PlayerState,
  });
  assert(evaluator.evaluate(age40.conditions![0], caravanExpansion), 'age40 eligible with expansion continuity');

  const age40Done = merchantState({
    flags: {
      hvg_merchant_caravan_track: true,
      hvg_merchant_expansion_rhythm_done: true,
      merchant_age40_identity_done: true,
      merchant_age45_payoff_done: false,
    },
    player: { age: 45 } as PlayerState,
  });
  assert(evaluator.evaluate(age45.conditions![0], age40Done), 'age45 fork reads upstream age40 identity');
}

function testExpansionGoalImmediate(): void {
  const goal = deriveSampleLineCurrentGoal(merchantState({
    flags: {
      hvg_merchant_ledger_track: true,
      hvg_merchant_expansion_rhythm_done: true,
      hvg_merchant_ledger_expansion_steady: true,
    },
    player: { age: 27 } as PlayerState,
  })) ?? '';
  assert(goal.includes('稳扩') || goal.includes('信誉'), `post-expansion ledger goal: ${goal}`);
  assert(isPlayerVisibleSampleLineText(goal), `raw key in expansion goal: ${goal}`);
}

function testMidlifeGoalsDifferByTrack(): void {
  const ledgerGoal = deriveSampleLineCurrentGoal(merchantState({
    flags: {
      hvg_merchant_ledger_track: true,
      hvg_merchant_expansion_rhythm_done: true,
      hvg_merchant_ledger_expansion_credit: true,
      merchant_midlife_debt: true,
      merchant_midlife_debt_ledger_credit: true,
    },
    player: { age: 35 } as PlayerState,
  })) ?? '';
  const caravanGoal = deriveSampleLineCurrentGoal(merchantState({
    flags: {
      hvg_merchant_ledger_track: false,
      hvg_merchant_caravan_track: true,
      hvg_merchant_expansion_rhythm_done: true,
      hvg_merchant_caravan_expansion_market: true,
      merchant_midlife_debt: true,
      merchant_midlife_debt_caravan_market: true,
    },
    player: { age: 35 } as PlayerState,
  })) ?? '';

  assert(ledgerGoal.includes('赊欠') || ledgerGoal.includes('人情'), `ledger midlife goal: ${ledgerGoal}`);
  assert(caravanGoal.includes('行市') || caravanGoal.includes('赌市'), `caravan midlife goal: ${caravanGoal}`);
  assert(ledgerGoal !== caravanGoal, 'ledger and caravan midlife goals must differ at age 35');
}

function testAge40IdentityDifferByTrack(): void {
  const ledgerIdentity = deriveSampleLineAge40Identity(merchantState({
    flags: {
      hvg_merchant_ledger_track: true,
      hvg_merchant_expansion_rhythm_done: true,
      hvg_merchant_ledger_expansion_steady: true,
      merchant_age40_identity_done: true,
    },
    player: { age: 40 } as PlayerState,
  })) ?? '';
  const caravanIdentity = deriveSampleLineAge40Identity(merchantState({
    flags: {
      hvg_merchant_ledger_track: false,
      hvg_merchant_caravan_track: true,
      hvg_merchant_expansion_rhythm_done: true,
      hvg_merchant_caravan_expansion_market: true,
      merchant_age40_identity_done: true,
    },
    player: { age: 40 } as PlayerState,
  })) ?? '';

  assert(ledgerIdentity.includes('账房'), `ledger age40 identity: ${ledgerIdentity}`);
  assert(caravanIdentity.includes('跑货') || caravanIdentity.includes('行市'), `caravan age40 identity: ${caravanIdentity}`);
  assert(ledgerIdentity !== caravanIdentity, 'age40 identities must differ by track');
  assert(isPlayerVisibleSampleLineText(ledgerIdentity), `raw key in ledger identity: ${ledgerIdentity}`);
}

function testCostLabelMidlife(): void {
  const ledgerCost = deriveSampleLineCostLabel(merchantState({
    flags: {
      hvg_merchant_ledger_track: true,
      hvg_merchant_expansion_rhythm_done: true,
      hvg_merchant_ledger_expansion_credit: true,
    },
    player: { age: 30 } as PlayerState,
  }));
  const caravanCost = deriveSampleLineCostLabel(merchantState({
    flags: {
      hvg_merchant_ledger_track: false,
      hvg_merchant_caravan_track: true,
      hvg_merchant_expansion_rhythm_done: true,
      hvg_merchant_caravan_expansion_market: true,
    },
    player: { age: 30 } as PlayerState,
  }));
  assert(ledgerCost.includes('扩赊') || ledgerCost.includes('稳扩'), `ledger expansion cost: ${ledgerCost}`);
  assert(caravanCost.includes('赌市') || caravanCost.includes('压货'), `caravan expansion cost: ${caravanCost}`);
  assert(ledgerCost !== caravanCost, 'expansion cost labels must differ by track');
}

function renderProofMarkdown(): string {
  const ledgerState = merchantState({
    flags: {
      hvg_merchant_ledger_track: true,
      hvg_merchant_expansion_rhythm_done: true,
      hvg_merchant_ledger_expansion_steady: true,
      merchant_midlife_debt: true,
      merchant_midlife_debt_ledger_steady: true,
      merchant_age40_identity_done: true,
    },
    player: { age: 40 } as PlayerState,
  });
  const caravanState = merchantState({
    flags: {
      hvg_merchant_ledger_track: false,
      hvg_merchant_caravan_track: true,
      hvg_merchant_expansion_rhythm_done: true,
      hvg_merchant_caravan_expansion_market: true,
      merchant_midlife_debt: true,
      merchant_midlife_debt_caravan_market: true,
      merchant_age40_identity_done: true,
    },
    player: { age: 40 } as PlayerState,
  });

  const ledgerGoal = deriveSampleLineCurrentGoal(merchantState({
    flags: {
      hvg_merchant_ledger_track: true,
      hvg_merchant_expansion_rhythm_done: true,
      hvg_merchant_ledger_expansion_steady: true,
      merchant_midlife_debt: true,
      merchant_midlife_debt_ledger_steady: true,
    },
    player: { age: 35 } as PlayerState,
  })) ?? '';
  const caravanGoal = deriveSampleLineCurrentGoal(merchantState({
    flags: {
      hvg_merchant_ledger_track: false,
      hvg_merchant_caravan_track: true,
      hvg_merchant_expansion_rhythm_done: true,
      hvg_merchant_caravan_expansion_market: true,
      merchant_midlife_debt: true,
      merchant_midlife_debt_caravan_market: true,
    },
    player: { age: 35 } as PlayerState,
  })) ?? '';
  const ledgerIdentity = deriveSampleLineAge40Identity(ledgerState) ?? '';
  const caravanIdentity = deriveSampleLineAge40Identity(caravanState) ?? '';

  return [
    '# P96 Merchant 26-40 Midlife Expansion Chain Proof',
    '',
    'Narrow proof for expansion rhythm + midlife spine continuity.',
    '',
    '## Ledger path (age 35 checkpoint)',
    '',
    '| Field | Value |',
    '| --- | --- |',
    '| age | 35 |',
    '| branch flag | hvg_merchant_ledger_track |',
    '| chain flags | hvg_merchant_operating_pressure_done, hvg_merchant_expansion_rhythm_done, hvg_merchant_ledger_expansion_steady, merchant_midlife_debt_ledger_steady |',
    `| player-facing outcome | ${ledgerGoal} |`,
    '',
    '## Caravan path (age 35 checkpoint)',
    '',
    '| Field | Value |',
    '| --- | --- |',
    '| age | 35 |',
    '| branch flag | hvg_merchant_caravan_track |',
    '| chain flags | hvg_merchant_operating_pressure_done, hvg_merchant_expansion_rhythm_done, hvg_merchant_caravan_expansion_market, merchant_midlife_debt_caravan_market |',
    `| player-facing outcome | ${caravanGoal} |`,
    '',
    '## Age 40 identity',
    '',
    `| Ledger | ${ledgerIdentity} |`,
    `| Caravan | ${caravanIdentity} |`,
    '',
    '## Continuity',
    '',
    '- `merchant_midlife_debt_milestone` reads P96 expansion sub-flags for track-specific debt branches',
    '- `merchant_age40_identity_summary` and `merchant_age45_expansion_fork` gate on expansion continuity for P95 path',
    '- `merchantAge40Identity()` distinguishes ledger vs caravan when expansion flags are set',
    '',
  ].join('\n');
}

export async function runP96MerchantMidlifeExpansionTests(): Promise<void> {
  testExpansionEventLoads();
  testExpansionGates();
  testTrackSpecificExpansionChoices();
  testMidlifeSpineContinuity();
  testExpansionGoalImmediate();
  testMidlifeGoalsDifferByTrack();
  testAge40IdentityDifferByTrack();
  testCostLabelMidlife();

  const proof = renderProofMarkdown();
  const outPath = join(process.cwd(), 'artifacts/reports/p96-merchant-26-40-midlife-expansion-chain-proof.md');
  writeFileSync(outPath, `${proof}\n`, 'utf8');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runP96MerchantMidlifeExpansionTests()
    .then(() => console.log('p96MerchantMidlifeExpansionTests: ok'))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
