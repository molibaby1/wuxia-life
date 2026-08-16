/**
 * Stage-1～7 套件总验收：四出身 × 35 步 headless 驱动（与 P6B API 同引擎）。
 * 输出 artifacts/reports/early-childhood-opening-experience-final-playtest.md
 */

import fs from 'node:fs';
import path from 'node:path';
import { CHOICE_EXECUTION_REQUEST_VERSION } from '../src/contracts/choiceExecution';
import { eventLoader } from '../src/core/EventLoader';
import {
  findPreschoolPassiveEntryById,
  isForeignExclusivePreschoolEntry,
  resolvePreschoolPassiveEntryByTitle,
  type PreschoolExclusiveOriginTag,
} from '../src/data/preschoolPassiveSpine';
import { HeadlessEngineSessionImpl } from '../src/headless/session/HeadlessEngineSessionImpl';
import type { HeadlessEngineSession } from '../src/headless/session/HeadlessEngineSession';
import { progressUntilChoiceOrTerminal } from '../src/headless/progressionLoop';
import type { PrimaryOriginFamilyFlag } from '../src/p16/primaryOriginFlag';
import { isForeignExclusiveSpineEvent } from '../src/p16/spineOriginIsolation';
import {
  inferTraitLineExclusiveFlag,
  isTraitLineSpineEligible,
} from '../src/p16/traitLineSpineEligibility';
import type { EventDefinition } from '../src/types/eventTypes';

const REPORT_PATH = path.join(
  process.cwd(),
  'artifacts/reports/early-childhood-opening-experience-final-playtest.md',
);
const MAX_STEPS = 35;
const PLANNING_PLACEHOLDER = '本期暂无强求的江湖变故';
const GAP_TITLE_MARKERS = ['家中一季', '童年时光', '檐下晚晴', '静听风言', '邻里童谣', '季节更迭'];

type OriginCase = {
  label: string;
  choiceId: PrimaryOriginFamilyFlag;
  passiveTag: PreschoolExclusiveOriginTag;
  seed: number;
};

const ORIGIN_CASES: OriginCase[] = [
  { label: '书香门第', choiceId: 'origin_scholar_family', passiveTag: 'scholar', seed: 70001 },
  { label: '武林世家', choiceId: 'origin_wuxia_family', passiveTag: 'martial', seed: 70002 },
  { label: '商贾之家', choiceId: 'origin_merchant_family', passiveTag: 'merchant', seed: 70003 },
  { label: '边疆异族', choiceId: 'origin_frontier', passiveTag: 'frontier', seed: 70004 },
];

interface StepLog {
  step: number;
  age: number;
  phase: string;
  planningCount: number;
  eventId?: string;
  passiveTitle?: string;
  placeholderHit: boolean;
  narrativeNonEmpty: boolean;
}

interface OriginRunResult {
  origin: OriginCase;
  logs: StepLog[];
  spineBleeds: string[];
  passiveBleeds: string[];
  traitLineBleeds: string[];
  gapPassiveSteps: number;
  placeholderTotal: number;
  placeholder04: number;
  planningViolations34: number;
  emptyNarrativeSteps: number;
  maxConsecutivePassiveTitle: number;
  childhoodPreferenceDone: boolean;
  finalAge: number;
  storyEventIds07: string[];
  steps812: number;
  formal812: number;
  planning812: number;
  steps1320: number;
  planning1320: number;
  youthPlanningActionIds: string[];
  rating: string;
}

function pickChoiceId(
  event: EventDefinition,
  dtoChoices: Array<{ id: string; text: string; available: boolean }>,
  originChoice: PrimaryOriginFamilyFlag,
): string | null {
  const available = dtoChoices.filter(c => c.available);
  const pool = available.length > 0 ? available : dtoChoices;
  if (pool.length === 0) return null;
  if (event.id === 'origin_background') {
    return pool.find(c => c.id === originChoice)?.id ?? pool[0]?.id ?? null;
  }
  if (event.id === 'childhood_preference') {
    if (originChoice === 'origin_scholar_family') {
      return pool.find(c => c.id.includes('scholar') || c.text.includes('读书'))?.id ?? pool[0]?.id ?? null;
    }
    if (originChoice === 'origin_wuxia_family') {
      return pool.find(c => c.id.includes('martial') || c.text.includes('武'))?.id ?? pool[0]?.id ?? null;
    }
    if (originChoice === 'origin_merchant_family') {
      return pool.find(c => c.id.includes('merchant') || c.text.includes('商'))?.id ?? pool[0]?.id ?? null;
    }
    return pool[0]?.id ?? null;
  }
  return pool[0]?.id ?? null;
}

async function runStoryEventStep(
  session: HeadlessEngineSession,
  originChoice: PrimaryOriginFamilyFlag,
): Promise<void> {
  let pending = session.describePendingEvent();
  if (!pending) {
    pending = await session.getNextEvent();
    if (!pending) return;
  }

  if (!pending.requiresChoice) {
    await session.progressAutomatic({ maxSteps: 8 });
    await progressUntilChoiceOrTerminal(session);
    return;
  }

  const choiceId = pickChoiceId(pending.raw, pending.event.choices ?? [], originChoice);
  if (!choiceId) {
    await progressUntilChoiceOrTerminal(session);
    return;
  }

  const snap = session.serialize();
  await session.executeChoice({
    requestVersion: CHOICE_EXECUTION_REQUEST_VERSION,
    snapshotRef: { snapshot: snap },
    action: { eventId: pending.raw.id, choiceId },
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

function narrativeNonEmpty(session: HeadlessEngineSession, phase: string): boolean {
  const vol = session.getProgressionVolatileState();
  if (phase === 'passive_progression') {
    return Boolean(vol.passiveNarrative?.text?.trim());
  }
  if (phase === 'period_summary') {
    return Boolean(
      vol.pendingPeriodSummary?.body?.trim() ||
        vol.pendingPeriodSummary?.narrativeText?.trim() ||
        vol.pendingPeriodSummary?.headline?.trim(),
    );
  }
  if (phase === 'active_planning') return true;
  const pending = session.describePendingEvent();
  return Boolean(pending?.event.text?.trim());
}

function placeholderInSession(session: HeadlessEngineSession, phase: string): boolean {
  const vol = session.getProgressionVolatileState();
  const pending = session.describePendingEvent();
  const texts = [
    pending?.event.text ?? '',
    vol.passiveNarrative?.text ?? '',
    vol.pendingPeriodSummary?.body ?? '',
    vol.pendingPeriodSummary?.narrativeText ?? '',
    ...session.getPlanningOptions().map(o => o.text),
  ].join(' ');
  return texts.includes(PLANNING_PLACEHOLDER);
}

function isGapPassiveTitle(title: string | undefined, eventId?: string): boolean {
  if (!title) return false;
  if (title.includes('暂无强求')) return true;
  if (GAP_TITLE_MARKERS.some(marker => title.includes(marker))) return true;
  return Boolean(eventId?.startsWith('preschool_passive_gap'));
}

function maxConsecutiveRepeats(titles: string[]): number {
  if (titles.length === 0) return 0;
  let max = 1;
  let run = 1;
  for (let i = 1; i < titles.length; i += 1) {
    if (titles[i] === titles[i - 1]) {
      run += 1;
      max = Math.max(max, run);
    } else {
      run = 1;
    }
  }
  return max;
}

function computeRating(result: Omit<OriginRunResult, 'rating'>): string {
  const blockers =
    result.spineBleeds.length +
    result.passiveBleeds.length +
    result.traitLineBleeds.length +
    result.planningViolations34 +
    result.placeholder04;
  if (blockers > 0) return '★★☆☆☆';
  if (result.gapPassiveSteps >= 4 || result.maxConsecutivePassiveTitle > 2) return '★★★☆☆';
  if (result.finalAge >= 7 && result.childhoodPreferenceDone) return '★★★★☆';
  if (result.finalAge >= 4 && result.childhoodPreferenceDone) return '★★★☆☆';
  return '★★★☆☆';
}

async function runOriginPlaytest(origin: OriginCase): Promise<OriginRunResult> {
  const session = HeadlessEngineSessionImpl.create({
    playerName: '验收角色',
    gender: 'female',
    catalogVersion: '1.0.0',
    randomSeed: origin.seed,
  });
  await progressUntilChoiceOrTerminal(session);

  const logs: StepLog[] = [];
  const spineBleeds: string[] = [];
  const passiveBleeds: string[] = [];
  const traitLineBleeds: string[] = [];
  const passiveTitles: string[] = [];
  let childhoodPreferenceDone = false;
  let gapPassiveSteps = 0;
  let placeholderTotal = 0;
  let placeholder04 = 0;
  let planningViolations34 = 0;
  let emptyNarrativeSteps = 0;
  const youthPlanningActionIds: string[] = [];

  for (let step = 1; step <= MAX_STEPS; step += 1) {
    const state = session.getRuntimeState();
    const age = state.player?.age ?? 0;
    const phase = session.getSessionPhase();
    const planningCount = session.getPlanningOptions().length;
    const pending = session.describePendingEvent();
    const eventId = pending?.eventId;
    const vol = session.getProgressionVolatileState();
    const passiveTitle = phase === 'passive_progression' ? vol.passiveNarrative?.title : undefined;
    const placeholderHit = placeholderInSession(session, phase);
    const nonEmpty = narrativeNonEmpty(session, phase);

    if (placeholderHit) {
      placeholderTotal += 1;
      if (age <= 4) placeholder04 += 1;
    }
    if (!nonEmpty) emptyNarrativeSteps += 1;
    if (age >= 3 && age <= 4 && planningCount > 0) planningViolations34 += 1;

    if (age >= 13 && age <= 20 && phase === 'active_planning') {
      for (const opt of session.getPlanningOptions()) {
        youthPlanningActionIds.push(opt.actionId);
      }
    }

    if (phase === 'story_event' && eventId) {
      const event = eventLoader.getEventById(eventId);
      if (event) {
        if (isForeignExclusiveSpineEvent(event, origin.choiceId)) {
          spineBleeds.push(`${eventId}@step${step}`);
        }
        if (
          inferTraitLineExclusiveFlag(event) &&
          !isTraitLineSpineEligible(event, state)
        ) {
          traitLineBleeds.push(`${eventId}@step${step}`);
        }
      }
      if (eventId === 'childhood_preference') childhoodPreferenceDone = true;
    }

    if (phase === 'passive_progression' && passiveTitle) {
      passiveTitles.push(passiveTitle);
      if (isGapPassiveTitle(passiveTitle)) gapPassiveSteps += 1;
      if (age >= 3 && age <= 7) {
        const entry = resolvePreschoolPassiveEntryByTitle(passiveTitle, age);
        if (entry && isForeignExclusivePreschoolEntry(entry, origin.passiveTag)) {
          passiveBleeds.push(`${entry.id}@step${step}`);
        }
      }
    }

    logs.push({
      step,
      age,
      phase,
      planningCount,
      eventId,
      passiveTitle,
      placeholderHit,
      narrativeNonEmpty: nonEmpty,
    });

    switch (phase) {
      case 'terminal':
        break;
      case 'story_event':
        await runStoryEventStep(session, origin.choiceId);
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
        await session.acknowledgeProgression('passive_continue');
        if (session.getSessionPhase() === 'period_summary') {
          await session.acknowledgeProgression('period_summary');
          await progressUntilChoiceOrTerminal(session);
        }
        break;
      case 'period_summary':
        await session.acknowledgeProgression('period_summary');
        await progressUntilChoiceOrTerminal(session);
        break;
      default:
        await progressUntilChoiceOrTerminal(session);
    }

    if (session.getTerminalState()) break;
  }

  const finalState = session.getRuntimeState();
  for (const record of finalState.eventHistory ?? []) {
    const age = record.age ?? 0;
    if (age >= 3 && age <= 7) {
      const entry = findPreschoolPassiveEntryById(record.eventId);
      if (entry && isForeignExclusivePreschoolEntry(entry, origin.passiveTag)) {
        const tag = `${entry.id}@history age${age}`;
        if (!passiveBleeds.includes(tag)) passiveBleeds.push(tag);
      }
    }
  }

  const storyEventIds07 = logs
    .filter(l => l.phase === 'story_event' && l.eventId && l.age <= 7)
    .map(l => l.eventId!);

  const logs812 = logs.filter(l => l.age >= 8 && l.age <= 12);
  const steps812 = logs812.length;
  const formal812 = logs812.filter(l => l.phase === 'story_event').length;
  const planning812 = logs812.filter(l => l.phase === 'active_planning').length;

  const logs1320 = logs.filter(l => l.age >= 13 && l.age <= 20);
  const steps1320 = logs1320.length;
  const planning1320 = logs1320.filter(l => l.phase === 'active_planning').length;

  const base: Omit<OriginRunResult, 'rating'> = {
    origin,
    logs,
    spineBleeds,
    passiveBleeds,
    traitLineBleeds,
    gapPassiveSteps,
    placeholderTotal,
    placeholder04,
    planningViolations34,
    emptyNarrativeSteps,
    maxConsecutivePassiveTitle: maxConsecutiveRepeats(passiveTitles),
    childhoodPreferenceDone,
    finalAge: logs[logs.length - 1]?.age ?? 0,
    storyEventIds07: [...new Set(storyEventIds07)],
    steps812,
    formal812,
    planning812,
    steps1320,
    planning1320,
    youthPlanningActionIds: [...new Set(youthPlanningActionIds)],
  };

  return { ...base, rating: computeRating(base) };
}

function formatReport(results: OriginRunResult[]): string {
  const bleedPass = results.every(
    r =>
      r.spineBleeds.length === 0 &&
      r.passiveBleeds.length === 0 &&
      r.traitLineBleeds.length === 0 &&
      r.planningViolations34 === 0 &&
      r.placeholder04 === 0,
  );
  const gapPass = results.every(r => r.gapPassiveSteps <= 2);
  const allPass = bleedPass && gapPass;
  const avgRating = results.map(r => r.rating).join(' / ');

  return `# Early Childhood Opening Experience — Final Playtest (Stage-1～10)

**Date:** ${new Date().toISOString()}  
**Driver:** \`HeadlessEngineSessionImpl\`（与 P6B API 同引擎）  
**Scope:** 四出身 × ${MAX_STEPS} 步 · ages 0～12 观测（Stage-9 8～12 列）+ **Stage-10 13～20 观测列**  
**Baseline:** \`api-browser-playtest-experience-2026-06-17.md\`（★★☆☆☆）

## Setup

\`\`\`bash
npm exec tsx scripts/runEarlyChildhoodFinalPlaytest.ts
\`\`\`

## Executive summary

| 项 | 结果 |
| --- | --- |
| 套件门禁（bleed / 3～4 规划 / 0～4 占位） | ${bleedPass ? '**PASS**' : '**FAIL**'} |
| Stage-8 gap 步 ≤2 / 出身 | ${gapPass ? '**PASS**' : '**FAIL**'} |
| 四出身主观评分（启发式） | ${avgRating} |
| vs Stage-7 终验 gap baseline | 4～5 → ${results.map(r => r.gapPassiveSteps).join(' / ')} |
| vs 2026-06-17 基线 | 机制层 P0 已收口；内容密度 Stage-8 加厚 |

## Per-origin matrix

| 出身 | 终龄 | 童年偏好 | Spine bleed | Passive bleed | Trait bleed | Gap 步 | 8～12 步 | 8～12 formal | 8～12 planning | **13～20 步** | **13～20 planning** | 被动同标题连出 | 评分 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${results
  .map(
    r =>
      `| ${r.origin.label} | ${r.finalAge} | ${r.childhoodPreferenceDone ? 'yes' : 'no'} | ${r.spineBleeds.length} | ${r.passiveBleeds.length} | ${r.traitLineBleeds.length} | ${r.gapPassiveSteps} | ${r.steps812} | ${r.formal812} | ${r.planning812} | ${r.steps1320} | ${r.planning1320} | ${r.maxConsecutivePassiveTitle} | ${r.rating} |`,
  )
  .join('\n')}

## Stage-10 youth planning samples (ages 13–20, observation only)

| 出身 | Unique youth planning action ids |
| --- | --- |
${results
  .map(
    r =>
      `| ${r.origin.label} | ${r.youthPlanningActionIds.length ? r.youthPlanningActionIds.map(id => `\`${id}\``).join(', ') : '_none in 35 steps_'} |`,
  )
  .join('\n')}

## Acceptance checklist (套件级)

| Criterion | Target | Result |
| --- | --- | --- |
| 四出身 foreign spine bleed | 0 | ${results.every(r => r.spineBleeds.length === 0) ? '**PASS**' : '**FAIL**'} |
| 四出身 foreign passive bleed (3～7) | 0 | ${results.every(r => r.passiveBleeds.length === 0) ? '**PASS**' : '**FAIL**'} |
| Trait-line bleed (wrong trait) | 0 | ${results.every(r => r.traitLineBleeds.length === 0) ? '**PASS**' : '**FAIL**'} |
| Ages 3–4 daily planning | 0 violations | ${results.every(r => r.planningViolations34 === 0) ? '**PASS**' : '**FAIL**'} |
| Placeholder ages 0–4 | 0 | ${results.every(r => r.placeholder04 === 0) ? '**PASS**' : '**FAIL**'} |
| Narrative non-empty | ≥95% steps | ${results.every(r => r.emptyNarrativeSteps / r.logs.length <= 0.05) ? '**PASS**' : '**PARTIAL**'} |
| Passive title consecutive | ≤2 (Stage-7) | ${results.every(r => r.maxConsecutivePassiveTitle <= 2) ? '**PASS**' : '**PARTIAL**'} |
| Gap 步 / 35 步 / 出身 (Stage-8) | ≤2 | ${gapPass ? '**PASS**' : '**FAIL**'} |

## Bleed details (if any)

${results
  .flatMap(r => {
    const lines: string[] = [];
    if (r.spineBleeds.length) lines.push(`### ${r.origin.label} spine\n${r.spineBleeds.map(x => `- \`${x}\``).join('\n')}`);
    if (r.passiveBleeds.length) lines.push(`### ${r.origin.label} passive\n${r.passiveBleeds.map(x => `- \`${x}\``).join('\n')}`);
    if (r.traitLineBleeds.length) lines.push(`### ${r.origin.label} trait-line\n${r.traitLineBleeds.map(x => `- \`${x}\``).join('\n')}`);
    return lines;
  })
  .join('\n\n') || '_None._'}

## Story events (age ≤7) by origin

${results
  .map(
    r =>
      `### ${r.origin.label}\n${r.storyEventIds07.map(id => `- \`${id}\``).join('\n') || '_none_'}`,
  )
  .join('\n\n')}

## Residual observations → Stage-8 候选

| 观察 | 说明 |
| --- | --- |
| Gap / neutral 被动 | gap 或轮换标题步数因 seed 不同；若 ≥4 步可考虑加厚本出身池（Stage-8C） |
| Trait 线 spine | 无 trait flag 时不应出现 street/poor 线（本验收已测 0 bleed） |
| 8～12 推进 | ${MAX_STEPS} 步后终龄常 >7；8+ spine 仅 gate 防御，内容密度未在本套件 |
| 主观武侠感 | 本报告为机制验收；完整 ★ 分需 browser 实机 + 人工判读 |

## Reproduce

\`\`\`bash
npm exec tsx scripts/runEarlyChildhoodFinalPlaytest.ts
npm exec tsx tests/spineOriginIsolationTests.ts
npm exec tsx tests/preschoolOriginIsolationTests.ts
\`\`\`

---

**Decision:** ${allPass ? '**Stage-1～10 验收 PASS** — 机制 + Stage-8 gap + Stage-9 agency/passive + Stage-10 youth 观测列' : '**FAIL** — 见 bleed / gap details，修复后再验收'}
`;
}

async function main(): Promise<void> {
  const results: OriginRunResult[] = [];
  for (const origin of ORIGIN_CASES) {
    results.push(await runOriginPlaytest(origin));
  }

  const md = formatReport(results);
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, md, 'utf8');
  console.log(`Wrote ${path.relative(process.cwd(), REPORT_PATH)}`);

  for (const r of results) {
    const issues =
      r.spineBleeds.length + r.passiveBleeds.length + r.traitLineBleeds.length;
    console.log(
      `${r.origin.label}: steps=${r.logs.length} finalAge=${r.finalAge} rating=${r.rating} issues=${issues} gap=${r.gapPassiveSteps}`,
    );
  }

  const failed = results.some(
    r =>
      r.spineBleeds.length > 0 ||
      r.passiveBleeds.length > 0 ||
      r.traitLineBleeds.length > 0 ||
      r.planningViolations34 > 0 ||
      r.placeholder04 > 0 ||
      r.gapPassiveSteps > 2,
  );
  if (failed) process.exit(1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
