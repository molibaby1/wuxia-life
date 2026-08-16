import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { EventLoader } from '../src/core/EventLoader';
import {
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
      age: 11,
      charisma: 10,
      money: 20,
      businessAcumen: 8,
      connections: 5,
      reputation: 5,
      ...overrides.player,
    } as PlayerState,
    flags: {
      origin_merchant_family: true,
      route_merchant: true,
      merchant_childhood_seed_done: true,
      hvg_merchant_early_fork_done: true,
      ...(overrides.flags ?? {}),
    },
  } as GameState;
}

function testEventsLoad(): void {
  const loader = EventLoader.getInstance();
  const confirm = loader.getEventById('hvg_merchant_post_fork_confirmation');
  const challenge = loader.getEventById('hvg_merchant_first_responsibility_challenge');
  assert(Boolean(confirm), 'hvg_merchant_post_fork_confirmation should load');
  assert(Boolean(challenge), 'hvg_merchant_first_responsibility_challenge should load');
  assert(confirm!.ageRange!.min === 10 && confirm!.ageRange!.max === 12, 'confirmation age 10-12');
  assert(challenge!.ageRange!.min === 13 && challenge!.ageRange!.max === 15, 'challenge age 13-15');
}

function testPostForkConfirmationGates(): void {
  const evaluator = new ConditionEvaluator();
  const loader = EventLoader.getInstance();
  const event = loader.getEventById('hvg_merchant_post_fork_confirmation')!;

  const ledger = merchantState({
    flags: { hvg_merchant_ledger_track: true },
    player: { age: 11 } as PlayerState,
  });
  assert(evaluator.evaluate(event.conditions![0], ledger), 'ledger path eligible for confirmation');

  const caravan = merchantState({
    flags: { hvg_merchant_caravan_track: true },
    player: { age: 11 } as PlayerState,
  });
  assert(evaluator.evaluate(event.conditions![0], caravan), 'caravan path eligible for confirmation');

  const noFork = merchantState({
    flags: { hvg_merchant_ledger_track: true, hvg_merchant_early_fork_done: false },
    player: { age: 11 } as PlayerState,
  });
  assert(!evaluator.evaluate(event.conditions![0], noFork), 'confirmation blocked without fork done');

  const ledgerChoice = event.choices!.find(c => c.id === 'ledger_track_confirmation')!;
  const caravanChoice = event.choices!.find(c => c.id === 'caravan_track_confirmation')!;
  assert(evaluator.evaluate(ledgerChoice.condition!, ledger), 'ledger choice visible on ledger track');
  assert(!evaluator.evaluate(ledgerChoice.condition!, caravan), 'ledger choice hidden on caravan track');
  assert(evaluator.evaluate(caravanChoice.condition!, caravan), 'caravan choice visible on caravan track');
}

function testFirstChallengeGates(): void {
  const evaluator = new ConditionEvaluator();
  const loader = EventLoader.getInstance();
  const event = loader.getEventById('hvg_merchant_first_responsibility_challenge')!;

  const ledgerReady = merchantState({
    flags: {
      hvg_merchant_ledger_track: true,
      hvg_merchant_post_fork_confirmation_done: true,
    },
    player: { age: 14 } as PlayerState,
  });
  assert(evaluator.evaluate(event.conditions![0], ledgerReady), 'ledger challenge eligible');

  const caravanReady = merchantState({
    flags: {
      hvg_merchant_caravan_track: true,
      hvg_merchant_post_fork_confirmation_done: true,
    },
    player: { age: 14 } as PlayerState,
  });
  assert(evaluator.evaluate(event.conditions![0], caravanReady), 'caravan challenge eligible');

  const noConfirm = merchantState({
    flags: { hvg_merchant_ledger_track: true },
    player: { age: 14 } as PlayerState,
  });
  assert(!evaluator.evaluate(event.conditions![0], noConfirm), 'challenge blocked without confirmation');
}

function testTrackSpecificChallengeChoices(): void {
  const evaluator = new ConditionEvaluator();
  const loader = EventLoader.getInstance();
  const event = loader.getEventById('hvg_merchant_first_responsibility_challenge')!;

  const ledgerState = merchantState({
    flags: {
      hvg_merchant_ledger_track: true,
      hvg_merchant_post_fork_confirmation_done: true,
    },
    player: { age: 14 } as PlayerState,
  });
  const ledgerChoices = event.choices!.filter(c =>
    !c.condition || evaluator.evaluate(c.condition, ledgerState),
  );
  assert(ledgerChoices.length === 2, 'ledger track exposes two challenge choices');
  assert(
    ledgerChoices.every(c => c.id.startsWith('ledger_')),
    'ledger track only shows ledger challenge choices',
  );

  const caravanState = merchantState({
    flags: {
      hvg_merchant_caravan_track: true,
      hvg_merchant_post_fork_confirmation_done: true,
    },
    player: { age: 14 } as PlayerState,
  });
  const caravanChoices = event.choices!.filter(c =>
    !c.condition || evaluator.evaluate(c.condition, caravanState),
  );
  assert(caravanChoices.length === 2, 'caravan track exposes two challenge choices');
  assert(
    caravanChoices.every(c => c.id.startsWith('caravan_')),
    'caravan track only shows caravan challenge choices',
  );
}

function testPlayerFacingGoalsDifferByTrack(): void {
  const ledgerGoal = deriveSampleLineCurrentGoal(merchantState({
    flags: {
      hvg_merchant_ledger_track: true,
      hvg_merchant_post_fork_confirmation_done: true,
      hvg_merchant_first_challenge_done: true,
      hvg_merchant_ledger_challenge_steady: true,
    },
    player: { age: 15 } as PlayerState,
  })) ?? '';
  const caravanGoal = deriveSampleLineCurrentGoal(merchantState({
    flags: {
      hvg_merchant_caravan_track: true,
      hvg_merchant_post_fork_confirmation_done: true,
      hvg_merchant_first_challenge_done: true,
      hvg_merchant_caravan_challenge_bold: true,
    },
    player: { age: 15 } as PlayerState,
  })) ?? '';

  assert(ledgerGoal.includes('账房') || ledgerGoal.includes('守账'), `ledger goal unexpected: ${ledgerGoal}`);
  assert(caravanGoal.includes('货') || caravanGoal.includes('行市'), `caravan goal unexpected: ${caravanGoal}`);
  assert(ledgerGoal !== caravanGoal, 'ledger and caravan goals must differ at age 15');
  assert(!ledgerGoal.includes('尚未开张'), `ledger goal still generic: ${ledgerGoal}`);
  assert(isPlayerVisibleSampleLineText(ledgerGoal), `raw key in ledger goal: ${ledgerGoal}`);
  assert(isPlayerVisibleSampleLineText(caravanGoal), `raw key in caravan goal: ${caravanGoal}`);
}

function testConfirmationGoalImmediate(): void {
  const goal = deriveSampleLineCurrentGoal(merchantState({
    flags: {
      hvg_merchant_ledger_track: true,
      hvg_merchant_post_fork_confirmation_done: true,
    },
    player: { age: 12 } as PlayerState,
  })) ?? '';
  assert(goal.includes('账房'), `post-confirmation ledger goal: ${goal}`);
  assert(!goal.includes('尚未开张'), `confirmation goal still generic: ${goal}`);
}

function testTalentDiscoveryAcceptsChallengeFlag(): void {
  const evaluator = new ConditionEvaluator();
  const talent = EventLoader.getInstance().getEventById('merchant_talent_discovery')!;
  const afterChallenge = merchantState({
    flags: {
      hvg_merchant_ledger_track: true,
      hvg_merchant_post_fork_confirmation_done: true,
      hvg_merchant_first_challenge_done: true,
    },
    player: { age: 14, charisma: 8, money: 10 } as PlayerState,
  });
  assert(
    evaluator.evaluate(talent.conditions![0], afterChallenge),
    'merchant_talent_discovery accepts hvg_merchant_first_challenge_done',
  );
}

function testCostLabelSurvivesToCheckpoint(): void {
  const ledgerCost = deriveSampleLineCostLabel(merchantState({
    flags: {
      hvg_merchant_ledger_track: true,
      hvg_merchant_post_fork_confirmation_done: true,
      hvg_merchant_first_challenge_done: true,
      hvg_merchant_ledger_challenge_steady: true,
    },
    player: { age: 15 } as PlayerState,
  }));
  const caravanCost = deriveSampleLineCostLabel(merchantState({
    flags: {
      hvg_merchant_caravan_track: true,
      hvg_merchant_post_fork_confirmation_done: true,
      hvg_merchant_first_challenge_done: true,
      hvg_merchant_caravan_challenge_bold: true,
    },
    player: { age: 15 } as PlayerState,
  }));
  assert(ledgerCost.includes('账') || ledgerCost.includes('守'), `ledger cost: ${ledgerCost}`);
  assert(caravanCost.includes('赌') || caravanCost.includes('货'), `caravan cost: ${caravanCost}`);
  assert(ledgerCost !== caravanCost, 'cost labels must differ by track');
}

function renderProofMarkdown(): string {
  const ledgerState = merchantState({
    flags: {
      hvg_merchant_ledger_track: true,
      hvg_merchant_post_fork_confirmation_done: true,
      hvg_merchant_first_challenge_done: true,
      hvg_merchant_ledger_challenge_steady: true,
    },
    player: { age: 15 } as PlayerState,
  });
  const caravanState = merchantState({
    flags: {
      hvg_merchant_caravan_track: true,
      hvg_merchant_post_fork_confirmation_done: true,
      hvg_merchant_first_challenge_done: true,
      hvg_merchant_caravan_challenge_bold: true,
    },
    player: { age: 15 } as PlayerState,
  });

  const ledgerGoal = deriveSampleLineCurrentGoal(ledgerState) ?? '';
  const caravanGoal = deriveSampleLineCurrentGoal(caravanState) ?? '';

  return [
    '# P94 Merchant 10-15 Growth Chain Proof',
    '',
    'Narrow proof for post-fork confirmation + first challenge chain.',
    '',
    '## Ledger path (age 15)',
    '',
    '| Field | Value |',
    '| --- | --- |',
    `| age | 15 |`,
    `| route flags | origin_merchant_family, route_merchant, merchant_childhood_seed_done |`,
    `| branch flag | hvg_merchant_ledger_track |`,
    `| chain flags | hvg_merchant_post_fork_confirmation_done, hvg_merchant_first_challenge_done, hvg_merchant_ledger_challenge_steady |`,
    `| player-facing outcome | ${ledgerGoal} |`,
    '',
    '## Caravan path (age 15)',
    '',
    '| Field | Value |',
    '| --- | --- |',
    `| age | 15 |`,
    `| route flags | origin_merchant_family, route_merchant, merchant_childhood_seed_done |`,
    `| branch flag | hvg_merchant_caravan_track |`,
    `| chain flags | hvg_merchant_post_fork_confirmation_done, hvg_merchant_first_challenge_done, hvg_merchant_caravan_challenge_bold |`,
    `| player-facing outcome | ${caravanGoal} |`,
    '',
    '## Continuity',
    '',
    '- `merchant_talent_discovery` accepts `hvg_merchant_first_challenge_done` as eligibility input',
    '- `merchant_first_shop` remains age 16-22 major milestone (unchanged)',
    '',
  ].join('\n');
}

export async function runP94MerchantGrowthChainTests(): Promise<void> {
  testEventsLoad();
  testPostForkConfirmationGates();
  testFirstChallengeGates();
  testTrackSpecificChallengeChoices();
  testPlayerFacingGoalsDifferByTrack();
  testConfirmationGoalImmediate();
  testTalentDiscoveryAcceptsChallengeFlag();
  testCostLabelSurvivesToCheckpoint();

  const proof = renderProofMarkdown();
  const outPath = join(process.cwd(), 'artifacts/reports/p94-merchant-10-15-growth-chain-proof.md');
  writeFileSync(outPath, `${proof}\n`, 'utf8');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runP94MerchantGrowthChainTests()
    .then(() => console.log('p94MerchantGrowthChainTests: ok'))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
