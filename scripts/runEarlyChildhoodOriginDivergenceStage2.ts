/**
 * US-004: Four-origin early childhood divergence audit (ages 0–7, headless).
 * Read-only validation — writes artifacts/reports/early-childhood-origin-divergence-stage2.md
 */

import fs from 'node:fs';
import path from 'node:path';
import { CHOICE_EXECUTION_REQUEST_VERSION } from '../src/contracts/choiceExecution';
import { HeadlessEngineSessionImpl } from '../src/headless/session/HeadlessEngineSessionImpl';
import type { HeadlessEngineSession } from '../src/headless/session/HeadlessEngineSession';
import { progressUntilChoiceOrTerminal } from '../src/headless/progressionLoop';
import type { EventDefinition } from '../src/types/eventTypes';

const REPORT_PATH = path.join(
  process.cwd(),
  'artifacts/reports/early-childhood-origin-divergence-stage2.md',
);

const ORIGIN_TARGETS = [
  { label: '书香门第', choiceId: 'origin_scholar_family', seed: 4101 },
  { label: '武林世家', choiceId: 'origin_wuxia_family', seed: 4102 },
  { label: '商贾之家', choiceId: 'origin_merchant_family', seed: 4103 },
  { label: '边疆异族', choiceId: 'origin_frontier', seed: 4104 },
] as const;

const END_AGE = 7;
const MAX_STEPS = 800;
const PLANNING_PLACEHOLDER_SNIPPET = '本期暂无强求的江湖变故';
const FORBIDDEN_INFANT_STATS = ['chivalry', 'internalSkill', 'martialPower'] as const;

interface OriginRunResult {
  label: string;
  choiceId: string;
  seed: number;
  finalAge: number;
  narrativeIds: string[];
  passiveIds: string[];
  storyEventIds: string[];
  infantPeriods: number;
  infantPlanningViolations: number;
  infantStatViolations: string[];
  steps: number;
}

interface PairwiseRow {
  originA: string;
  originB: string;
  overlapCount: number;
  unionCount: number;
  overlapRatio: number;
  pass: boolean;
}

function eventRequiresChoice(event: EventDefinition): boolean {
  if (event.autoEffects && event.autoEffects.length > 0) return false;
  if (event.eventType === 'auto') return false;
  return Boolean(event.choices?.length);
}

function pickChoiceId(event: EventDefinition, preferredOriginChoiceId: string): string | null {
  const choices = event.choices ?? [];
  if (choices.length === 0) return null;
  if (event.id === 'origin_background') {
    const match = choices.find(c => c.id === preferredOriginChoiceId);
    if (match) return match.id;
  }
  const childhood = choices.find(c => c.id === 'childhood_preference_scholar' || c.id.startsWith('childhood_'));
  if (event.id === 'childhood_preference' && childhood) return childhood.id;
  return choices[0]?.id ?? null;
}

async function runStoryEventStep(
  session: HeadlessEngineSession,
  preferredOriginChoiceId: string,
  storyEventIds: string[],
): Promise<void> {
  let event = session.getCurrentEvent();
  if (!event) {
    const next = await session.getNextEvent();
    if (!next) return;
    event = next.raw;
    if (!next.requiresChoice) {
      storyEventIds.push(event.id);
      await session.progressAutomatic({ maxSteps: 8 });
      await progressUntilChoiceOrTerminal(session);
      return;
    }
  }

  if (!eventRequiresChoice(event)) {
    storyEventIds.push(event.id);
    await session.progressAutomatic({ maxSteps: 8 });
    await progressUntilChoiceOrTerminal(session);
    return;
  }

  const choiceId = pickChoiceId(event, preferredOriginChoiceId);
  if (!choiceId) {
    await progressUntilChoiceOrTerminal(session);
    return;
  }

  storyEventIds.push(event.id);
  const snap = session.serialize();
  await session.executeChoice({
    requestVersion: CHOICE_EXECUTION_REQUEST_VERSION,
    snapshotRef: { snapshot: snap },
    action: { eventId: event.id, choiceId },
  });
  await progressUntilChoiceOrTerminal(session);
}

async function runActivePlanningStep(session: HeadlessEngineSession): Promise<void> {
  const options = session.getPlanningOptions();
  if (options.length === 0) {
    await session.getNextEvent();
    return;
  }
  await session.executeActiveAction(options[0]!.actionId);
  if (session.getSessionPhase() === 'action_summary') {
    await session.acknowledgeProgression('action_summary');
  }
  if (session.getSessionPhase() === 'disturbance_narrative') {
    await session.acknowledgeProgression('disturbance');
  }
}

function collectIds(state: ReturnType<HeadlessEngineSession['getRuntimeState']>): {
  narrativeIds: string[];
  passiveIds: string[];
} {
  const history = state.eventHistory ?? [];
  const allIds = history.map(h => h.eventId);
  const passiveIds = allIds.filter(id => id.startsWith('infant_') || id.includes('_infant_'));
  return { narrativeIds: [...new Set(allIds)], passiveIds: [...new Set(passiveIds)] };
}

function infantStatCheck(
  before: Record<string, number | undefined>,
  after: Record<string, number | undefined>,
): string[] {
  const violations: string[] = [];
  for (const stat of FORBIDDEN_INFANT_STATS) {
    const delta = (after[stat] ?? 0) - (before[stat] ?? 0);
    if (Math.abs(delta) > 1) {
      violations.push(`${stat} jump Δ${delta > 0 ? '+' : ''}${delta}`);
    }
  }
  return violations;
}

async function runOriginToAge7(
  label: string,
  choiceId: string,
  seed: number,
): Promise<OriginRunResult> {
  const session = HeadlessEngineSessionImpl.create({
    playerName: `审计-${label}`,
    gender: 'male',
    catalogVersion: '1.0.0',
    randomSeed: seed,
  });
  await progressUntilChoiceOrTerminal(session);

  const storyEventIds: string[] = [];
  let steps = 0;
  let infantPeriods = 0;
  let infantPlanningViolations = 0;
  const infantStatViolations: string[] = [];

  while (steps < MAX_STEPS) {
    steps += 1;
    const age = session.getRuntimeState().player?.age ?? 0;
    if (session.getTerminalState() || age >= END_AGE) break;

    const phase = session.getSessionPhase();
    if (age <= 2 && phase === 'passive_progression') {
      infantPeriods += 1;
      const optionsCount = session.getPlanningOptions().length;
      if (optionsCount > 0) infantPlanningViolations += 1;
      session.ensurePassivePresentation();
      const passiveText = session.getProgressionVolatileState().passiveNarrative?.text ?? '';
      if (passiveText.includes(PLANNING_PLACEHOLDER_SNIPPET)) {
        infantPlanningViolations += 1;
      }
      const before = { ...session.getRuntimeState().player };
      await session.acknowledgeProgression('passive_continue');
      if (session.getSessionPhase() === 'period_summary') {
        await session.acknowledgeProgression('period_summary');
        await progressUntilChoiceOrTerminal(session);
      }
      const after = { ...session.getRuntimeState().player };
      if (infantPeriods === 1) {
        infantStatViolations.push(...infantStatCheck(before, after));
      }
      continue;
    }

    switch (phase) {
      case 'terminal':
        break;
      case 'story_event':
        await runStoryEventStep(session, choiceId, storyEventIds);
        break;
      case 'active_planning':
        await runActivePlanningStep(session);
        break;
      case 'action_summary':
        await session.acknowledgeProgression('action_summary');
        break;
      case 'disturbance_narrative':
        await session.acknowledgeProgression('disturbance');
        break;
      case 'passive_progression':
        session.ensurePassivePresentation();
        await session.acknowledgeProgression('passive_continue');
        break;
      case 'period_summary':
        await session.acknowledgeProgression('period_summary');
        await progressUntilChoiceOrTerminal(session);
        break;
      default:
        await progressUntilChoiceOrTerminal(session);
    }

    if (session.getTerminalState()) break;
    if ((session.getRuntimeState().player?.age ?? 0) >= END_AGE) break;
  }

  const { narrativeIds, passiveIds } = collectIds(session.getRuntimeState());
  return {
    label,
    choiceId,
    seed,
    finalAge: session.getRuntimeState().player?.age ?? 0,
    narrativeIds,
    passiveIds,
    storyEventIds: [...new Set(storyEventIds)],
    infantPeriods,
    infantPlanningViolations,
    infantStatViolations,
    steps,
  };
}

function pairwiseCompare(runs: OriginRunResult[]): PairwiseRow[] {
  const rows: PairwiseRow[] = [];
  for (let i = 0; i < runs.length; i += 1) {
    for (let j = i + 1; j < runs.length; j += 1) {
      const a = new Set(runs[i]!.narrativeIds);
      const b = new Set(runs[j]!.narrativeIds);
      const overlap = [...a].filter(id => b.has(id));
      const union = new Set([...a, ...b]);
      const overlapRatio = union.size === 0 ? 0 : overlap.length / union.size;
      rows.push({
        originA: runs[i]!.label,
        originB: runs[j]!.label,
        overlapCount: overlap.length,
        unionCount: union.size,
        overlapRatio,
        pass: overlapRatio < 0.5,
      });
    }
  }
  return rows;
}

function formatMarkdown(runs: OriginRunResult[], pairwise: PairwiseRow[]): string {
  const allPass = pairwise.every(p => p.pass);
  const infantPass = runs.every(
    r => r.infantPlanningViolations === 0 && r.infantStatViolations.length === 0,
  );
  const decision = allPass && infantPass ? 'PASS' : 'PARTIAL';

  const originSections = runs
    .map(run => {
      return `### ${run.label}

| 项 | 值 |
| --- | --- |
| Seed | ${run.seed} |
| 终局年龄 | ${run.finalAge} |
| 步数 | ${run.steps} |
| 叙事 ID 数 | ${run.narrativeIds.length} |
| 被动 ID 数 | ${run.passiveIds.length} |
| 0～2 岁被动期 | ${run.infantPeriods} |
| 婴儿期规划违规 | ${run.infantPlanningViolations} |
| 婴儿期数值违规 | ${run.infantStatViolations.length ? run.infantStatViolations.join('; ') : '无'} |

**叙事 ID 列表：** ${run.narrativeIds.join(', ') || '—'}

**被动 ID 列表：** ${run.passiveIds.join(', ') || '—'}

**剧情事件 ID：** ${run.storyEventIds.join(', ') || '—'}`;
    })
    .join('\n\n');

  const pairwiseTable = pairwise
    .map(
      p =>
        `| ${p.originA} × ${p.originB} | ${p.overlapCount} | ${p.unionCount} | ${(p.overlapRatio * 100).toFixed(1)}% | ${p.pass ? 'PASS' : 'FAIL'} |`,
    )
    .join('\n');

  const failNote = !allPass
    ? `\n\n## Stage-3/4 跟进\n\n部分出身对重合度 ≥50%。本 Story 不修改玩法；建议 Stage-3 接线四链 quest dequeue + Stage-4 提升 3～7 岁密度。\n`
    : '';

  return `# Four-Origin Early Childhood Divergence Audit (US-004)

**PRD:** \`docs/PRD/early-childhood-opening-experience-governance.md\`  
**Date:** ${new Date().toISOString()}  
**Mode:** Headless (\`HeadlessEngineSessionImpl\`)  
**Target age:** ${END_AGE}  
**Decision:** **${decision}**

## Repro

\`\`\`bash
npm exec tsx scripts/runEarlyChildhoodOriginDivergenceStage2.ts
\`\`\`

## Pairwise overlap (C(4,2)=6)

| 对比 | 交集 | 并集 | 重合度 | 结果 |
| --- | --- | --- | --- | --- |
${pairwiseTable}

## Infant band (0～2 岁)

| 出身 | 被动期 | 规划违规 | 数值违规 |
| --- | --- | --- | --- |
${runs.map(r => `| ${r.label} | ${r.infantPeriods} | ${r.infantPlanningViolations} | ${r.infantStatViolations.length ? r.infantStatViolations.join('; ') : '无'} |`).join('\n')}

---

## Per-origin detail

${originSections}
${failNote}
**Gameplay changes:** None (audit-only)
`;
}

async function main(): Promise<void> {
  const runs: OriginRunResult[] = [];
  for (const origin of ORIGIN_TARGETS) {
    console.log(`▶ ${origin.label} (seed=${origin.seed})`);
    const result = await runOriginToAge7(origin.label, origin.choiceId, origin.seed);
    runs.push(result);
    console.log(
      `  age=${result.finalAge} narrativeIds=${result.narrativeIds.length} passiveIds=${result.passiveIds.length}`,
    );
  }

  const pairwise = pairwiseCompare(runs);
  const md = formatMarkdown(runs, pairwise);
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, md, 'utf8');
  console.log(`Wrote ${path.relative(process.cwd(), REPORT_PATH)}`);

  const allPass = pairwise.every(p => p.pass);
  if (!allPass) {
    console.warn('Pairwise overlap ≥50% detected — documented for Stage-3/4; exiting 0 (audit story).');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
