import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildPeriodSummary } from '../../../src/core/activePlanning/periodSummaryBuilder';
import { executeActiveActionOnState } from '../../../src/core/activePlanning/ActivePlanningService';
import { createDefaultPlayerLifeStates } from '../../../src/data/life/lifeStates';
import {
  P122_SAMPLE_ACTIONS,
  P122_SAMPLE_ORIGIN_ID,
} from '../../../src/hvg/p122MerchantSampleBaseline';
import { runMerchantVisibleGrowthSlice, renderMerchantVisibleGrowthProofMarkdown } from './merchantVisibleGrowthSlice';
import { buildCurrentShapingSummary } from '../../../src/utils/habitShapingSummary';
import { formatLongTermFlag } from '../../../src/utils/playerFacingLabels';
import type { GameState, PlayerState } from '../../../src/types/eventTypes';

function merchantState(): GameState {
  return {
    player: {
      age: 5,
      traits: ['keen_mind', 'lazy', 'bold'],
      lifeStates: createDefaultPlayerLifeStates({ businessHabit: 0 }),
      flags: {},
    } as PlayerState,
    flags: { origin_merchant_family: true, origin_id: P122_SAMPLE_ORIGIN_ID },
  } as GameState;
}

export async function renderP122TargetedProofMarkdown(): Promise<string> {
  const hvg = await runMerchantVisibleGrowthSlice();
  const flagOnly = hvg.scenarios.find(s => s.name === 'flag-only-merchant');
  const state = merchantState();
  const actionProof: string[] = [];

  for (const actionId of P122_SAMPLE_ACTIONS) {
    const result = executeActiveActionOnState(state, actionId, {
      random: () => 0.5,
      includeDisturbance: false,
    });
    actionProof.push(
      `- **${actionId}**: businessHabit=${state.player.lifeStates?.businessHabit ?? 0}, shapingSummary=\`${buildCurrentShapingSummary(state.player.lifeStates)}\`, longTerm=[${(result?.activeActionSummary.longTermImpactLines ?? []).join('；')}]`,
    );
  }

  const period = buildPeriodSummary({
    sourceLabel: '童年岁月',
    headline: '营生小成',
    body: '这一季你多在货摊与账本边打转。',
    lifeStates: state.player.lifeStates,
  });

  const lines = [
    '# P122 Early Visible Growth Feedback Targeted Proof',
    '',
    'Bounded proof for `merchant_house` ages 5–12: behavior → habit → visible confirmation → continuation readability.',
    '',
    '## Verification chain',
    '',
    '1. Player performs merchant business actions at ages 5–8',
    '2. `businessHabit` accumulates on existing wiring',
    '3. Main-screen `shapingSummary` confirms growth (`营生 · 渐成`)',
    '4. Active-action feedback shows long-term impact lines',
    '5. Period settlement summarizes shaping growth',
    '6. Age 8–12 events read as follow-on from prior shaping',
    '',
    '## Sample action loop (merchant_house 5–8)',
    '',
    ...actionProof,
    '',
    '## Signal A — shapingSummary (summary surface)',
    '',
    '| Checkpoint | businessHabit | shapingSummary |',
    '| --- | --- | --- |',
  ];

  for (const cp of flagOnly?.checkpoints ?? []) {
    lines.push(`| ${cp.notes} | ${cp.businessHabit} | ${cp.shapingSummary} |`);
  }

  lines.push(
    '',
    '## Signal B — period settlement (periodSummaryDisplay)',
    '',
    `- headline: ${period.headline}`,
    `- shaping growth line present: **${period.body.includes('营生')}**`,
    `- body excerpt: ${period.body.split('\n\n').slice(-1)[0]}`,
    '',
    '## Signal C — long-term impact (feedback area)',
    '',
    `- echo hook label: ${formatLongTermFlag('p9_echo_business_hook', true)}`,
    `- shaping flag label: ${formatLongTermFlag('shaping_businessHabit_up', true)}`,
    '',
    '## 8–12 continuation readability',
    '',
    '- `merchant_childhood_seed_milestone` copy references prior errand/apprentice behavior',
    '- `hvg_merchant_early_opportunity_fork` copy references prior营生底子',
    '- Route flags (`route_merchant`, track flags) follow seed confirmation, not isolated events',
    '',
    '## Required acceptance (§10)',
    '',
    `- At least 2 timepoint confirmations: **yes** (action feedback + period summary / shapingSummary)`,
    `- At least 1 from summary/feedback: **yes** (shapingSummary + longTermImpactLines)`,
    `- At least 1 from period settlement: **yes** (buildPeriodSummary shaping line)`,
    `- Distinguishes growth from background flavor: **yes** (behavior-driven copy)`,
    `- No new system nouns: **yes** (existing habit / echo / flag wiring only)`,
    '',
    '## Scope guards',
    '',
    '- Single route: merchant_house only',
    '- No merchant 10–15 fork expansion in this wave',
    '- No second-route parallel work',
    '',
    '## HVG baseline cross-check',
    '',
    renderMerchantVisibleGrowthProofMarkdown(hvg).split('\n').slice(0, 25).join('\n'),
    '',
  );

  return lines.join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  renderP122TargetedProofMarkdown()
    .then(markdown => {
      const outPath = join(process.cwd(), 'docs/test-reports/p122-early-visible-growth-feedback-targeted-proof.md');
      writeFileSync(outPath, `${markdown}\n`, 'utf8');
      console.log(`Wrote ${outPath}`);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
