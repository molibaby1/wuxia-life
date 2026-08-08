/**
 * AC-X verification for四出身 0～2 岁被动链。
 * 链顺序/互斥/差异化：选择器确定性模拟；Agency/叙事/数值：headless 隔离 passive 路径。
 */

import { HeadlessEngineSessionImpl } from '../headless/session/HeadlessEngineSessionImpl';
import type { GameStateSnapshot } from '../contracts/gameStateSnapshot';
import {
  commitAnnualPassiveMemory,
  prepareAnnualPassiveMemory,
} from '../core/activePlanning/annualPassiveMemory';
import {
  getOriginInfantPassiveChains,
  isOriginInfantChainComplete,
  resolveOriginInfantChain,
} from '../data/originInfantPassiveChain';
import {
  resolvePlanningPlaceholderText,
} from '../data/infantPassiveNarratives';
import type { GameState, PlayerState } from '../types/eventTypes';

const PLANNING_PLACEHOLDER_SNIPPET = '本期暂无强求的江湖变故';
const FORBIDDEN_INFANT_STATS = ['chivalry', 'martialPower', 'money'] as const;
const SHARED_PASSIVE_IDS = new Set(['infant_crawl_home', 'infant_passive_gap']);

export interface OriginInfantVerificationOrigin {
  label: string;
  originFlag: string;
  idPrefix: string;
}

export const ORIGIN_INFANT_VERIFICATION_ORIGINS: OriginInfantVerificationOrigin[] = [
  { label: '书香门第', originFlag: 'origin_scholar_family', idPrefix: 'scholar_infant_' },
  { label: '武林世家', originFlag: 'origin_wuxia_family', idPrefix: 'martial_infant_' },
  { label: '商贾之家', originFlag: 'origin_merchant_family', idPrefix: 'merchant_infant_' },
  { label: '边疆异族', originFlag: 'origin_frontier', idPrefix: 'frontier_infant_' },
];

export interface InfantStatSnapshot {
  chivalry: number;
  martialPower: number;
  money: number;
  knowledge: number;
  constitution: number;
}

export interface SelectorSimulationTrace {
  originFlag: string;
  label: string;
  idPrefix: string;
  passiveIds: string[];
  chainNodeIds: string[];
  agesPerTick: number[];
  expectedChainNodeIds: string[];
  orderViolations: string[];
  exclusivityViolations: string[];
  chainComplete: boolean;
}

export interface HeadlessPassiveTrace {
  originFlag: string;
  label: string;
  passivePeriods: number;
  planningOptionMax: number;
  planningViolations: number;
  placeholderHits: number;
  emptyNarrativeBeforeContinue: number;
  firstPassiveStatDelta: Partial<Record<string, number>>;
  statViolations: string[];
}

export interface PairwiseDifferentiation {
  originA: string;
  originB: string;
  overlapCount: number;
  unionCount: number;
  overlapRatio: number;
  pass: boolean;
}

export interface AcX1Result {
  pass: boolean;
  violations: Array<{ origin: string; foreignIds: string[] }>;
}

export interface AcX2Result {
  pass: boolean;
  traces: Array<{
    origin: string;
    passivePeriods: number;
    planningViolations: number;
    placeholderHits: number;
  }>;
}

export interface AcX3Result {
  pass: boolean;
  pairwise: PairwiseDifferentiation[];
  worstPair: PairwiseDifferentiation | null;
}

export interface AcX4Result {
  pass: boolean;
  traces: Array<{
    origin: string;
    emptyNarrativeBeforeContinue: number;
    statViolations: string[];
    firstPassiveStatDelta: Partial<Record<string, number>>;
  }>;
}

export interface InfantPassiveChainVerificationReport {
  generatedAt: string;
  decision: 'pass' | 'fail';
  acX1: AcX1Result;
  acX2: AcX2Result;
  acX3: AcX3Result;
  acX4: AcX4Result;
  selectorTraces: SelectorSimulationTrace[];
  headlessTraces: HeadlessPassiveTrace[];
}

function snapshotPlayerStats(player: PlayerState | undefined): InfantStatSnapshot {
  return {
    chivalry: player?.chivalry ?? 0,
    martialPower: player?.martialPower ?? 0,
    money: player?.money ?? 0,
    knowledge: player?.knowledge ?? 0,
    constitution: player?.constitution ?? 0,
  };
}

function statDelta(
  before: InfantStatSnapshot,
  after: InfantStatSnapshot,
): Partial<Record<string, number>> {
  const delta: Partial<Record<string, number>> = {};
  for (const key of Object.keys(before) as (keyof InfantStatSnapshot)[]) {
    const diff = after[key] - before[key];
    if (diff !== 0) delta[key] = diff;
  }
  return delta;
}

function createOriginSnapshot(originFlag: string, age: number, randomSeed: number): GameStateSnapshot {
  const bootstrap = HeadlessEngineSessionImpl.create({
    playerName: '婴幼验证',
    gender: 'male',
    catalogVersion: '1.0.0',
    randomSeed,
  });
  const snap = bootstrap.serialize();
  snap.state.player.age = age;
  snap.state.player.alive = true;
  snap.state.flags = { [originFlag]: true };
  snap.state.eventHistory = [];
  return snap;
}

function expectedNodeIdsForOrigin(originFlag: string): string[] {
  const chain = getOriginInfantPassiveChains().find(c => c.originFlag === originFlag);
  if (!chain) return [];
  return [...chain.nodes].sort((a, b) => a.order - b.order).map(node => node.id);
}

function isAllowedPassiveId(id: string, idPrefix: string): boolean {
  if (id.startsWith(idPrefix)) return true;
  if (SHARED_PASSIVE_IDS.has(id)) return true;
  return false;
}

function verifyChainOrder(chainNodeIds: string[], expectedIds: string[]): string[] {
  const violations: string[] = [];
  if (new Set(chainNodeIds).size !== chainNodeIds.length) {
    violations.push(`duplicate chain nodes: ${chainNodeIds.join(' → ')}`);
  }
  let expectedIdx = 0;
  for (const id of chainNodeIds) {
    if (expectedIdx < expectedIds.length && id === expectedIds[expectedIdx]) {
      expectedIdx += 1;
    }
  }
  if (expectedIdx !== expectedIds.length) {
    violations.push(
      `order mismatch: got [${chainNodeIds.join(', ')}], expected subsequence [${expectedIds.join(', ')}]`,
    );
  }
  return violations;
}

function simulatePassiveChainWithSelector(
  origin: OriginInfantVerificationOrigin,
  randomSeed = 0,
): SelectorSimulationTrace {
  const state = {
    player: { age: 0 } as PlayerState,
    flags: { [origin.originFlag]: true },
    eventHistory: [],
  } as GameState;

  const passiveIds: string[] = [];
  const agesPerTick: number[] = [];
  let roll = randomSeed;

  const seededRandom = () => {
    roll = (roll * 1664525 + 1013904223) % 0x100000000;
    return roll / 0x100000000;
  };
  for (const age of [0, 1, 2]) {
    if (state.player) state.player.age = age;
    agesPerTick.push(age);
    const plan = prepareAnnualPassiveMemory(state, seededRandom);
    const result = commitAnnualPassiveMemory(state, plan);
    passiveIds.push(...result.entryIds);
  }

  const chainNodeIds = passiveIds.filter(id => id.startsWith(origin.idPrefix));
  const expectedChainNodeIds = expectedNodeIdsForOrigin(origin.originFlag);
  const exclusivityViolations = passiveIds.filter(id => !isAllowedPassiveId(id, origin.idPrefix));
  const chain = resolveOriginInfantChain(state);

  return {
    originFlag: origin.originFlag,
    label: origin.label,
    idPrefix: origin.idPrefix,
    passiveIds,
    chainNodeIds,
    agesPerTick,
    expectedChainNodeIds,
    orderViolations: verifyChainOrder(chainNodeIds, expectedChainNodeIds),
    exclusivityViolations,
    chainComplete: chain ? isOriginInfantChainComplete(state, chain) : false,
  };
}

async function verifyHeadlessPassivePhaseAtAges(
  origin: OriginInfantVerificationOrigin,
  randomSeed: number,
): Promise<HeadlessPassiveTrace> {
  let passivePeriods = 0;
  let planningOptionMax = 0;
  let planningViolations = 0;
  let placeholderHits = 0;
  let emptyNarrativeBeforeContinue = 0;
  const statViolations: string[] = [];
  let firstPassiveStatDelta: Partial<Record<string, number>> = {};
  let capturedFirstPassiveDelta = false;

  for (const age of [0, 1, 2]) {
    const snap = createOriginSnapshot(origin.originFlag, age, randomSeed + age);
    const session = HeadlessEngineSessionImpl.create({ snapshot: snap });

    const phase = session.getSessionPhase();
    if (phase !== 'passive_progression') {
      planningViolations += 1;
      continue;
    }

    const optionsCount = session.getPlanningOptions().length;
    planningOptionMax = Math.max(planningOptionMax, optionsCount);
    if (optionsCount > 0) {
      planningViolations += 1;
    }

    session.ensurePassivePresentation();
    const passive = session.getProgressionVolatileState().passiveNarrative;
    const body = passive?.text ?? '';
    if (!body.trim()) {
      emptyNarrativeBeforeContinue += 1;
    }
    if (body.includes(PLANNING_PLACEHOLDER_SNIPPET)) {
      placeholderHits += 1;
    }

    passivePeriods += 1;

    if (!capturedFirstPassiveDelta && age === 0) {
      const beforeTick = snapshotPlayerStats(session.getRuntimeState().player);
      await session.acknowledgeProgression('passive_continue');
      const afterTick = snapshotPlayerStats(session.getRuntimeState().player);
      firstPassiveStatDelta = statDelta(beforeTick, afterTick);
      capturedFirstPassiveDelta = true;
      for (const stat of FORBIDDEN_INFANT_STATS) {
        const delta = firstPassiveStatDelta[stat] ?? 0;
        if (delta !== 0) {
          statViolations.push(`first passive tick: ${stat} Δ${delta > 0 ? '+' : ''}${delta}`);
        }
      }
    }
  }

  return {
    originFlag: origin.originFlag,
    label: origin.label,
    passivePeriods,
    planningOptionMax,
    planningViolations,
    placeholderHits,
    emptyNarrativeBeforeContinue,
    firstPassiveStatDelta,
    statViolations,
  };
}

function computePairwiseDifferentiation(traces: SelectorSimulationTrace[]): PairwiseDifferentiation[] {
  const pairs: PairwiseDifferentiation[] = [];
  for (let i = 0; i < traces.length; i += 1) {
    for (let j = i + 1; j < traces.length; j += 1) {
      const setA = new Set(traces[i].chainNodeIds);
      const setB = new Set(traces[j].chainNodeIds);
      const intersection = [...setA].filter(id => setB.has(id));
      const union = new Set([...setA, ...setB]);
      const overlapRatio = union.size === 0 ? 0 : intersection.length / union.size;
      pairs.push({
        originA: traces[i].label,
        originB: traces[j].label,
        overlapCount: intersection.length,
        unionCount: union.size,
        overlapRatio,
        pass: overlapRatio < 0.5,
      });
    }
  }
  return pairs;
}

export async function runInfantPassiveChainVerification(
  randomSeed = 20260618,
): Promise<InfantPassiveChainVerificationReport> {
  const selectorTraces = ORIGIN_INFANT_VERIFICATION_ORIGINS.map((origin, index) =>
    simulatePassiveChainWithSelector(origin, randomSeed + index * 97),
  );

  const headlessTraces: HeadlessPassiveTrace[] = [];
  for (const [index, origin] of ORIGIN_INFANT_VERIFICATION_ORIGINS.entries()) {
    headlessTraces.push(await verifyHeadlessPassivePhaseAtAges(origin, randomSeed + index * 13));
  }

  const acX1Violations = selectorTraces
    .map(trace => ({
      origin: trace.label,
      foreignIds: trace.exclusivityViolations,
    }))
    .filter(item => item.foreignIds.length > 0);

  const acX1: AcX1Result = {
    pass: acX1Violations.length === 0,
    violations: acX1Violations,
  };

  const acX2: AcX2Result = {
    pass:
      headlessTraces.every(
        trace =>
          trace.planningViolations === 0 &&
          trace.placeholderHits === 0 &&
          trace.planningOptionMax === 0 &&
          trace.emptyNarrativeBeforeContinue === 0,
      ) && selectorTraces.every(trace => trace.passiveIds.length === 6),
    traces: selectorTraces.map((trace, index) => ({
      origin: trace.label,
      passivePeriods: trace.passiveIds.length,
      planningViolations: headlessTraces[index]?.planningViolations ?? 0,
      placeholderHits: headlessTraces[index]?.placeholderHits ?? 0,
    })),
  };

  const pairwise = computePairwiseDifferentiation(selectorTraces);
  const worstPair =
    pairwise.length > 0
      ? pairwise.reduce((worst, current) =>
          current.overlapRatio > worst.overlapRatio ? current : worst,
        )
      : null;
  const acX3: AcX3Result = {
    pass: pairwise.every(pair => pair.pass) && selectorTraces.every(trace => trace.chainComplete),
    pairwise,
    worstPair,
  };

  const acX4: AcX4Result = {
    pass: headlessTraces.every(
      trace => trace.emptyNarrativeBeforeContinue === 0 && trace.statViolations.length === 0,
    ),
    traces: headlessTraces.map(trace => ({
      origin: trace.label,
      emptyNarrativeBeforeContinue: trace.emptyNarrativeBeforeContinue,
      statViolations: trace.statViolations,
      firstPassiveStatDelta: trace.firstPassiveStatDelta,
    })),
  };

  const decision =
    acX1.pass && acX2.pass && acX3.pass && acX4.pass ? ('pass' as const) : ('fail' as const);

  return {
    generatedAt: new Date().toISOString(),
    decision,
    acX1,
    acX2,
    acX3,
    acX4,
    selectorTraces,
    headlessTraces,
  };
}

export function formatInfantPassiveChainVerificationMarkdown(
  report: InfantPassiveChainVerificationReport,
): string {
  const status = (pass: boolean) => (pass ? 'PASS' : 'FAIL');

  const selectorSection = report.selectorTraces
    .map(trace => {
      return `### ${trace.label}（选择器模拟 3 年 / 6 个记忆节点）

| 项 | 值 |
| --- | --- |
| 被动 ID 序列 | ${trace.passiveIds.join(' → ')} |
| 链节点（有序） | ${trace.chainNodeIds.join(' → ') || '—'} |
| 链完成 | ${trace.chainComplete ? '是' : '否'} |
| 顺序违规 | ${trace.orderViolations.length ? trace.orderViolations.join('; ') : '无'} |
| 互斥违规 ID | ${trace.exclusivityViolations.length ? trace.exclusivityViolations.join(', ') : '无'} |`;
    })
    .join('\n\n');

  const headlessSection = report.headlessTraces
    .map(trace => {
      return `### ${trace.label}（headless 0/1/2 岁相位）

| 项 | 值 |
| --- | --- |
| 相位检查次数 | ${trace.passivePeriods} |
| 规划选项峰值 | ${trace.planningOptionMax} |
| 规划/相位违规 | ${trace.planningViolations} |
| 占位句命中 | ${trace.placeholderHits} |
| 继续前空叙事 | ${trace.emptyNarrativeBeforeContinue} |
| 首回合属性 Δ（age 0 tick） | ${JSON.stringify(trace.firstPassiveStatDelta)} |
| 数值违规 | ${trace.statViolations.length ? trace.statViolations.join('; ') : '无'} |`;
    })
    .join('\n\n');

  const pairwiseTable = report.acX3.pairwise
    .map(
      pair =>
        `| ${pair.originA} × ${pair.originB} | ${pair.overlapCount} | ${pair.unionCount} | ${(pair.overlapRatio * 100).toFixed(1)}% | ${status(pair.pass)} |`,
    )
    .join('\n');

  const infantGapNote = resolvePlanningPlaceholderText(2).text;

  return `# 四出身 0～2 岁被动链验收报告

生成时间：${report.generatedAt}  
决策：**${report.decision.toUpperCase()}**  
真源：\`origin-infant-passives.json\` + \`selectPassiveNarrative\` / \`HeadlessEngineSessionImpl.passive_continue\`  
对照：\`childhood-origin-infant-passive-index.md\` AC-X-1～AC-X-4

---

## 总览

| AC | 描述 | 方法 | 结果 |
| --- | --- | --- | --- |
| AC-X-1 | 互斥：0～2 岁被动 ID 仅本链前缀 + 共用 filler | 选择器 3 年 / 6 个记忆节点模拟 | ${status(report.acX1.pass)} |
| AC-X-2 | Agency：3 年 / 6 个记忆节点无三选一、无规划占位句 | 选择器 3 年 / 6 个记忆节点 + headless 0/1/2 岁相位 | ${status(report.acX2.pass)} |
| AC-X-3 | 差异化：两两链节点重合度 <50%，链收官 | 选择器模拟至 2 岁 | ${status(report.acX3.pass)} |
| AC-X-4 | 继续前叙事非空、首回合无荒谬数值跳变 | headless 首 tick | ${status(report.acX4.pass)} |

---

## AC-X-1 互斥

${report.acX1.pass ? '四出身被动推进 ID 均符合本链 `*_infant_*` 前缀或共用 filler。' : report.acX1.violations.map(v => `- **${v.origin}**：违规 ID ${v.foreignIds.join(', ')}`).join('\n')}

允许共用：\`infant_crawl_home\`、\`infant_passive_gap\`（过渡句：「${infantGapNote.slice(0, 20)}…」）

---

## AC-X-2 Agency

| 出身 | 被动期数 | 规划违规 | 占位句命中 |
| --- | --- | --- | --- |
${report.acX2.traces.map(t => `| ${t.origin} | ${t.passivePeriods} | ${t.planningViolations} | ${t.placeholderHits} |`).join('\n')}

---

## AC-X-3 矩阵差异化

| 对比 | 交集 | 并集 | 重合度 | 结果 |
| --- | --- | --- | --- | --- |
${pairwiseTable || '| — | — | — | — | — |'}

链完成：${report.selectorTraces.map(t => `${t.label}=${t.chainComplete ? '是' : '否'}`).join('；')}

---

## AC-X-4 实机回归（headless 等价）

| 出身 | 继续前空叙事 | 数值违规 | 首回合 Δ |
| --- | --- | --- | --- |
${report.acX4.traces.map(t => `| ${t.origin} | ${t.emptyNarrativeBeforeContinue} | ${t.statViolations.length ? t.statViolations.join('; ') : '无'} | ${JSON.stringify(t.firstPassiveStatDelta)} |`).join('\n')}

首回合禁止 \`chivalry\` / \`martialPower\` / \`money\` 跳变（仅审计 passive tick 本身，不含 spine）。

---

## 选择器模拟明细

${selectorSection}

---

## Headless 隔离 passive 明细

${headlessSection}

---

## 复现命令

\`\`\`bash
npm run report:infant-passive-verification
npx tsx tests/infantPassiveChainVerificationTests.ts
\`\`\`

关联门禁：\`npm run gate:p16\`、\`npm run gate:playability\`
`;
}
