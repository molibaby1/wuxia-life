import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { executeActiveActionOnState } from '../../../src/core/activePlanning/ActivePlanningService';
import { ConditionEvaluator } from '../../../src/core/ConditionEvaluator';
import { GameEngineIntegration } from '../../../src/core/GameEngineIntegration';
import { EventExecutor } from '../../../src/core/EventExecutor';
import { EventLoader } from '../../../src/core/EventLoader';
import { createDefaultPlayerLifeStates } from '../../../src/data/life/lifeStates';
import { resolveChildhoodActionPalette } from '../../../src/p16/childhoodAgency';
import { resolvePrimaryOriginFamilyFlag } from '../../../src/p16/primaryOriginFlag';
import type { GameState, PlayerState } from '../../../src/types/eventTypes';

export interface MerchantVisibleGrowthCheckpoint {
  age: number;
  businessHabit: number;
  flags: string[];
  notes: string;
}

export interface MerchantScenarioProof {
  name: string;
  description: string;
  checkpoints: MerchantVisibleGrowthCheckpoint[];
  businessPaletteAtAge6: boolean;
  confirmationEligible: boolean;
  forkEligible: boolean;
  talentEligibleLedger: boolean;
  talentEligibleCaravan: boolean;
}

export interface MerchantVisibleGrowthSliceResult {
  scenarios: MerchantScenarioProof[];
}

function collectFlags(state: GameState): string[] {
  const keys = [
    'origin_merchant_family',
    'origin_id',
    'p9_echo_business_hook',
    'p9_early_business_focus',
    'merchant_childhood_seed_done',
    'route_merchant',
    'hvg_merchant_early_fork_done',
    'hvg_merchant_ledger_track',
    'hvg_merchant_caravan_track',
  ];
  return keys.filter(key => Boolean(state.flags?.[key]));
}

function evaluateLoopGates(state: GameState) {
  const hasMerchantPrimary = resolvePrimaryOriginFamilyFlag(state) === 'origin_merchant_family';
  if (!hasMerchantPrimary) {
    return {
      confirmationEligible: false,
      forkEligible: false,
      talentEligibleLedger: false,
      talentEligibleCaravan: false,
    };
  }

  const evaluator = new ConditionEvaluator();
  const loader = EventLoader.getInstance();
  const confirmEvent = loader.getEventById('merchant_childhood_seed_milestone');
  const forkEvent = loader.getEventById('hvg_merchant_early_opportunity_fork');
  const talentEvent = loader.getEventById('merchant_talent_discovery');

  const confirmationEligible = Boolean(
    confirmEvent && evaluator.evaluate(confirmEvent.conditions![0], state),
  );

  const forkState = {
    ...state,
    flags: {
      ...state.flags,
      merchant_childhood_seed_done: true,
      route_merchant: true,
    },
    player: { ...state.player, age: 10 } as PlayerState,
  } as GameState;
  const forkEligible = Boolean(forkEvent && evaluator.evaluate(forkEvent.conditions![0], forkState));

  const ledgerState = {
    ...forkState,
    flags: {
      ...forkState.flags,
      hvg_merchant_early_fork_done: true,
      hvg_merchant_ledger_track: true,
    },
  } as GameState;
  const talentEligibleLedger = Boolean(
    talentEvent && evaluator.evaluate(talentEvent.conditions![0], ledgerState),
  );

  const caravanState = {
    ...forkState,
    flags: {
      ...forkState.flags,
      hvg_merchant_early_fork_done: true,
      hvg_merchant_caravan_track: true,
    },
  } as GameState;
  const talentEligibleCaravan = Boolean(
    talentEvent && evaluator.evaluate(talentEvent.conditions![0], caravanState),
  );

  return {
    confirmationEligible,
    forkEligible,
    talentEligibleLedger,
    talentEligibleCaravan,
  };
}

function runBusinessLoop(
  state: GameState,
  checkpoints: MerchantVisibleGrowthCheckpoint[],
): void {
  const push = (age: number, notes: string) => {
    checkpoints.push({
      age,
      businessHabit: state.player.lifeStates?.businessHabit ?? 0,
      flags: collectFlags(state),
      notes,
    });
  };

  push(state.player.age ?? 5, 'scenario start');
  executeActiveActionOnState(state, 'action_household_errand', {
    random: () => 0.5,
    includeDisturbance: false,
  });
  push(state.player.age ?? 5, 'after action_household_errand');

  executeActiveActionOnState(state, 'action_household_apprentice', {
    random: () => 0.5,
    includeDisturbance: false,
  });
  state.player.age = 8;
  push(8, 'after action_household_apprentice');
}

function buildScenarioProof(
  name: string,
  description: string,
  state: GameState,
): MerchantScenarioProof {
  const checkpoints: MerchantVisibleGrowthCheckpoint[] = [];
  runBusinessLoop(state, checkpoints);
  const palette = resolveChildhoodActionPalette({
    age: 6,
    player: state.player,
    flags: state.flags,
  });
  return {
    name,
    description,
    checkpoints,
    businessPaletteAtAge6: palette.some(action => action.id === 'action_household_errand'),
    ...evaluateLoopGates(state),
  };
}

export function runFlagOnlyMerchantScenario(): MerchantScenarioProof {
  const state: GameState = {
    player: {
      age: 5,
      traits: ['keen_mind', 'lazy', 'bold'],
      lifeStates: createDefaultPlayerLifeStates(),
      flags: {},
    } as PlayerState,
    flags: { origin_merchant_family: true, origin_id: 'merchant_house' },
  } as GameState;

  return buildScenarioProof(
    'flag-only-merchant',
    'Canonical player path: origin_background flag without preset trait origin (browser-aligned).',
    state,
  );
}

export function runTraitOnlyMerchantScenario(): MerchantScenarioProof {
  const state: GameState = {
    player: {
      age: 5,
      traits: ['keen_mind', 'lazy', 'bold'],
      lifeStates: createDefaultPlayerLifeStates(),
      flags: {},
    } as PlayerState,
    flags: {},
  } as GameState;

  return buildScenarioProof(
    'trait-only-merchant',
    'Risk sample: latent trait origin alone must not fake the merchant childhood gate.',
    state,
  );
}

export async function runRealisticNewGameMerchantScenario(): Promise<MerchantScenarioProof> {
  const engine = new GameEngineIntegration();
  engine.startNewGame('HVG真实链路', 'male');
  const originEvent = EventLoader.getInstance().getEventById('origin_background');
  const choice = originEvent?.choices?.find(c => c.id === 'origin_merchant_family');
  if (!choice) {
    throw new Error('origin_merchant_family choice missing');
  }

  const executor = new EventExecutor();
  const state = await executor.executeEffects(choice.effects ?? [], engine.getGameState());
  state.player.age = 5;
  state.player.lifeStates = createDefaultPlayerLifeStates();

  assertRealisticMerchantState(state);

  return buildScenarioProof(
    'realistic-new-game-merchant',
    'Fresh new game -> origin_background merchant choice -> business loop (no preset random origin).',
    state,
  );
}

function assertRealisticMerchantState(state: GameState): void {
  if (resolvePrimaryOriginFamilyFlag(state) !== 'origin_merchant_family') {
    throw new Error('realistic scenario requires origin_merchant_family primary flag');
  }
  if (state.flags?.origin_id !== 'merchant_house') {
    throw new Error('realistic scenario requires canonical flags.origin_id');
  }
}

export async function runMerchantVisibleGrowthSlice(): Promise<MerchantVisibleGrowthSliceResult> {
  const scenarios = [
    runFlagOnlyMerchantScenario(),
    runTraitOnlyMerchantScenario(),
    await runRealisticNewGameMerchantScenario(),
  ];
  return { scenarios };
}

export function renderMerchantVisibleGrowthProofMarkdown(
  result: MerchantVisibleGrowthSliceResult,
): string {
  const lines = [
    '# HVG Merchant Visible Growth Proof',
    '',
    'Multi-scenario proof aligned with browser semantics (primary flag is canonical; trait-only is a risk control).',
    '',
  ];

  for (const scenario of result.scenarios) {
    lines.push(`## ${scenario.name}`, '', scenario.description, '');
    lines.push(
      `- business palette at age 6: **${scenario.businessPaletteAtAge6}**`,
      `- confirmation eligible: **${scenario.confirmationEligible}**`,
      `- fork eligible after confirmation: **${scenario.forkEligible}**`,
      `- merchant_talent_discovery via ledger track: **${scenario.talentEligibleLedger}**`,
      `- merchant_talent_discovery via caravan track: **${scenario.talentEligibleCaravan}**`,
      '',
      '| Age | businessHabit | flags | notes |',
      '| --- | --- | --- | --- |',
    );
    for (const cp of scenario.checkpoints) {
      lines.push(
        `| ${cp.age} | ${cp.businessHabit} | ${cp.flags.join(', ') || 'none'} | ${cp.notes} |`,
      );
    }
    lines.push('');
  }

  return lines.join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMerchantVisibleGrowthSlice()
    .then(result => {
      const markdown = renderMerchantVisibleGrowthProofMarkdown(result);
      const outPath = join(process.cwd(), 'docs/test-reports/hvg-merchant-visible-growth-proof.md');
      writeFileSync(outPath, `${markdown}\n`, 'utf8');
      console.log(markdown);
      console.log(`\nWrote ${outPath}`);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
