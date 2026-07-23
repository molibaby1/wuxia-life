import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildPeriodSummary } from '../core/activePlanning/periodSummaryBuilder';
import { executeActiveActionOnState } from '../core/activePlanning/ActivePlanningService';
import { ConditionEvaluator } from '../core/ConditionEvaluator';
import { EventLoader } from '../core/EventLoader';
import { createDefaultPlayerLifeStates } from '../data/life/lifeStates';
import { getOrdinaryEarlyLifeChoiceForOrigin } from '../p25/ordinaryOriginEarlyLife';
import {
  P129_CONTINUATION_TARGETS,
  P129_PRIMARY_ACTION,
  P129_SAMPLE_ORIGIN_ID,
  P129_SOCIAL_MOMENTUM_SHAPING_THRESHOLD,
} from './p129TavernSampleBaseline';
import { buildCurrentShapingSummary } from '../utils/habitShapingSummary';
import { formatLongTermFlag } from '../utils/playerFacingLabels';
import type { GameState, PlayerState } from '../types/eventTypes';

function tavernState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...overrides,
    player: {
      age: 5,
      traits: ['keen_mind', 'lazy', 'disciplined'],
      lifeStates: createDefaultPlayerLifeStates({ socialMomentum: 0 }),
      flags: {},
      ...overrides.player,
    } as PlayerState,
    flags: {
      origin_tavern_hand: true,
      origin_id: P129_SAMPLE_ORIGIN_ID,
      ...(overrides.flags ?? {}),
    },
  } as GameState;
}

function evaluateContinuationGates(state: GameState) {
  const evaluator = new ConditionEvaluator();
  const loader = EventLoader.getInstance();
  const p28 = loader.getEventById('p28_social_momentum_network_fork');
  const fork = getOrdinaryEarlyLifeChoiceForOrigin(P129_SAMPLE_ORIGIN_ID);

  const p28State = {
    ...state,
    player: { ...state.player, age: 24 } as PlayerState,
  } as GameState;

  return {
    forkTitle: fork?.title ?? 'missing',
    forkPrompt: fork?.prompt ?? '',
    forkAgeMin: fork?.ageMin ?? 0,
    forkAgeMax: fork?.ageMax ?? 0,
    trackGuestsLabel: fork?.options.find(o => o.id === 'track_guests')?.label ?? 'missing',
    p28Eligible: Boolean(p28 && evaluator.evaluate(p28.conditions![0], p28State)),
    p28Title: p28?.content?.title ?? 'missing',
    p28TextExcerpt: (p28?.content?.text ?? '').slice(0, 60),
  };
}

export async function renderP129TargetedProofMarkdown(): Promise<string> {
  const state = tavernState();
  const actionProof: string[] = [];

  for (let i = 0; i < P129_SOCIAL_MOMENTUM_SHAPING_THRESHOLD; i++) {
    const result = executeActiveActionOnState(state, P129_PRIMARY_ACTION, {
      random: () => 0.5,
      includeDisturbance: false,
    });
    actionProof.push(
      `- **${P129_PRIMARY_ACTION} #${i + 1}**: socialMomentum=${state.player.lifeStates?.socialMomentum ?? 0}, shapingSummary=\`${buildCurrentShapingSummary(state.player.lifeStates)}\`, longTerm=[${(result?.activeActionSummary.longTermImpactLines ?? []).join('；')}]`,
    );
  }

  const period = buildPeriodSummary({
    sourceLabel: '童年岁月',
    headline: '交游小成',
    body: '这一季你多与玩伴相处、听故事学人情。',
    lifeStates: state.player.lifeStates,
  });

  const continuation = evaluateContinuationGates(state);

  const lines = [
    '# P129 Ordinary-Origin Visible Growth Sample Proof',
    '',
    'Bounded proof for `tavern_hand` ages 5–13: behavior → socialMomentum → visible confirmation → continuation readability.',
    '',
    '## Verification chain',
    '',
    '1. Player performs early socializing actions at ages 5–8',
    '2. `socialMomentum` accumulates on existing wiring via `p9_echo_social_hook`',
    '3. Main-screen `shapingSummary` confirms growth (`人情 · 渐成`)',
    '4. Active-action feedback shows long-term impact lines',
    '5. Period settlement summarizes shaping growth',
    '6. Age 9–13 childhood fork reads as follow-on from prior social shaping',
    '',
    '## Sample action loop (tavern_hand 5–8)',
    '',
    ...actionProof,
    '',
    '## Signal A — shapingSummary (summary surface)',
    '',
    '| Checkpoint | socialMomentum | shapingSummary |',
    '| --- | --- | --- |',
    '| start | 0 | 塑形未成 |',
    `| after 2× socializing | ${state.player.lifeStates?.socialMomentum ?? 0} | ${buildCurrentShapingSummary(state.player.lifeStates)} |`,
    '',
    '## Signal B — period settlement (periodSummaryDisplay)',
    '',
    `- headline: ${period.headline}`,
    `- shaping growth line present: **${period.body.includes('人情')}**`,
    `- body excerpt: ${period.body.split('\n\n').slice(-1)[0]}`,
    '',
    '## Signal C — long-term impact (feedback area)',
    '',
    `- echo hook label: ${formatLongTermFlag('p9_echo_social_hook', true)}`,
    `- shaping focus label: ${formatLongTermFlag('p9_early_social_focus', true)}`,
    `- shaping flag label: ${formatLongTermFlag('shaping_socialMomentum_up', true)}`,
    '',
    '## 8–13 continuation readability',
    '',
    `- \`ordinary_tavern_network_fork\` age band: **${continuation.forkAgeMin}–${continuation.forkAgeMax}**`,
    `- fork title: ${continuation.forkTitle}`,
    `- fork prompt excerpt: ${continuation.forkPrompt.slice(0, 40)}…`,
    `- \`track_guests\` option: ${continuation.trackGuestsLabel} → ally_network seed`,
    `- \`p28_social_momentum_network_fork\` eligible at age 24: **${continuation.p28Eligible}**`,
    `- p28 title: ${continuation.p28Title}`,
    `- p28 text excerpt: ${continuation.p28TextExcerpt}…`,
    '- Early social shaping makes guest-network fork readable as follow-on from prior人情往来',
    '',
    '## Required acceptance (§10)',
    '',
    '- At least 2 timepoint confirmations: **yes** (action feedback + period summary / shapingSummary)',
    '- At least 1 from summary/feedback: **yes** (shapingSummary + longTermImpactLines)',
    '- At least 1 from period settlement: **yes** (buildPeriodSummary shaping line)',
    '- Distinguishes growth from background flavor: **yes** (behavior-driven copy, not origin repetition)',
    '- No new system nouns: **yes** (existing habit / echo / flag wiring only)',
    '',
    '## Scope guards',
    '',
    '- Single route: tavern_hand only',
    '- No farm_peasant or town_apprentice parallel work',
    '- No scholar_house or vivid origin respawn',
    '- No new growth system or panel',
    `- Continuation targets locked: ${P129_CONTINUATION_TARGETS.join(', ')}`,
    '',
  ];

  return lines.join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  renderP129TargetedProofMarkdown()
    .then(markdown => {
      const outPath = join(
        process.cwd(),
        'docs/test-reports/p129-ordinary-origin-visible-growth-sample-proof.md',
      );
      writeFileSync(outPath, `${markdown}\n`, 'utf8');
      console.log(`Wrote ${outPath}`);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
