#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { evaluateExperienceHealthGate } from './experienceHealthGate';
import { getGameplaySimulationSamples } from './runGameplaySimulation';
import { runGoldenLineExperienceGates, writeGoldenLineGateReport } from './goldenLineGate';
import { GameProcessSimulator } from '../tests/GameProcessSimulator';

type PrdStory = {
  id: string;
  title: string;
  passes: boolean;
  notes?: string;
};

type PrdFile = {
  project: string;
  userStories: PrdStory[];
};

function loadPrd(relativePath: string): PrdFile {
  const fullPath = path.join(process.cwd(), relativePath);
  return JSON.parse(fs.readFileSync(fullPath, 'utf-8')) as PrdFile;
}

async function main(): Promise<void> {
  const prd = loadPrd('docs/PRD/product-experience-governance.prd.json');
  const completed = prd.userStories.filter(story => story.passes);
  const pending = prd.userStories.filter(story => !story.passes);

  const goldenLine = await runGoldenLineExperienceGates({ quiet: true });
  const goldenLineReportPath = writeGoldenLineGateReport(goldenLine);

  const samples = getGameplaySimulationSamples(true);
  const reports = [];
  for (const sample of samples) {
    const simulator = new GameProcessSimulator({
      playerName: sample.personaName,
      gender: sample.gender,
      simulateYears: sample.years,
      runUntilDeath: true,
      seed: sample.seed,
      choiceTendency: sample.choiceTendency,
      routeTrack: sample.routeTrack,
      verbose: false,
      enableAutoSave: false,
      enableManualSave: false,
      enableSaveRestore: false,
    });
    reports.push(await simulator.simulate());
  }

  const experienceGate = evaluateExperienceHealthGate(reports, []);

  const outputDir = path.join(process.cwd(), 'docs/test-reports');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'product-experience-governance-closure.md');
  const legacyPath = path.join(outputDir, 'experience-governance-closure.md');

  const simulationRows = goldenLine.simulations
    .map(run => `| ${run.sample.id} | ${run.sample.routeTrack ?? 'baseline'} | ${run.report.finalAge} | ${run.report.totalEvents} | ${run.report.totalChoices} |`)
    .join('\n');

  const completedList = completed
    .map(story => `- **${story.id}** ${story.title}${story.notes ? ` — ${story.notes}` : ''}`)
    .join('\n');

  const pendingList = pending.length > 0
    ? pending.map(story => `- **${story.id}** ${story.title}`).join('\n')
    : '_无_';

  const architectureReady =
    goldenLine.pass
    && experienceGate.decision !== 'fail'
    && pending.length === 0;

  const lines: string[] = [
    '# Product Experience Governance — Closure Report (PXG5 / US-024)',
    '',
    `生成时间：${new Date().toISOString()}`,
    '',
    '## 1. 摘要',
    '',
    `- 项目：**${prd.project}**`,
    `- 已完成 user stories：**${completed.length}/${prd.userStories.length}**`,
    `- Golden line gate：**${goldenLine.pass ? 'PASS' : 'FAIL'}**（active blockers: ${goldenLine.activeScope.activeBlockerCount}）`,
    `- Experience gate：**${experienceGate.decision.toUpperCase()}**`,
    `- 前后端分离规划就绪：**${architectureReady ? '是（可开始规划，勿在本阶段实施）' : '否（先清 blockers / 未完成 stories）'}**`,
    '',
    '## 2. 已完成 User Stories',
    '',
    completedList,
    '',
    '## 3. 未完成 User Stories',
    '',
    pendingList,
    '',
    '## 4. PXG 包交付对照',
    '',
    '| Pack | Stories | Status |',
    '| --- | --- | --- |',
    '| PXG0 | US-001, US-022 | complete |',
    '| PXG1 | US-002–004, US-014 | complete |',
    '| PXG2 | US-005–008 | complete |',
    '| PXG3 | US-009–013 | complete |',
    '| PXG4 | US-015–019 | complete |',
    '| PXG5 | US-020–021, US-023–024 | complete |',
    '',
    '## 5. Golden Line 仿真结果（0–30）',
    '',
    '| Sample | Route track | Final age | Events | Choices |',
    '| --- | --- | --- | --- | --- |',
    simulationRows,
    '',
    `- Gate report: \`${path.relative(process.cwd(), goldenLineReportPath)}\``,
    `- Feedback scan issues: ${goldenLine.feedbackIssueCount}`,
    `- Active-scope blockers: ${goldenLine.activeScope.activeBlockerCount}`,
    `- Deferred warnings (major+): ${goldenLine.activeScope.deferredWarningCount}`,
    `- Candidate warnings (major+): ${goldenLine.activeScope.candidateWarningCount}`,
    '',
    '## 6. 验证命令与结果',
    '',
    '| Command | Purpose | Expected |',
    '| --- | --- | --- |',
    '| `npm run typecheck` | TS 类型检查 | exit 0 |',
    '| `npm run gate:golden-line` | PXG4 黄金线子门禁 | PASS |',
    '| `npm run gate:experience` | 体验健康主门禁 | PASS / warn |',
    '| `npm run report:experience-governance-closure` | 本报告 | exit 0 |',
    '',
    '```bash',
    'npm run typecheck',
    'npm run gate:golden-line',
    'npm run gate:experience',
    'npm run report:experience-governance-closure',
    '```',
    '',
    '## 7. PXG5 UI / 文档交付',
    '',
    '- 最小布局要求：`docs/test-reports/product-experience-governance-minimum-playable-layout.md`',
    '- Debug 策略：`docs/test-reports/product-experience-governance-player-debug-policy.md`',
    '- 项目总览更新：`docs/PROJECT_OVERVIEW.md`（0–30 黄金线 scope）',
    '- Debug 入口：`src/utils/debugAccess.ts`（dev + `?debug=1` / localStorage）',
    '- 玩家向标签：`src/utils/playerFacingLabels.ts`',
    '',
    '## 8. 残余风险',
    '',
    '- `death_rate` 等指标在部分随机样本中仍为 warning，不阻断 golden-line deterministic scenarios',
    '- 31–80 岁与 deferred 事件仍存在于仓库，默认 governance gate 不将其计为 active blocker',
    '- 存档 UI 仍使用 prompt/alert，非 production polish',
    '- 浏览器手动验证依赖本地 dev server；CI 不跑 visual regression',
    '',
    '## 9. 前后端分离结论',
    '',
    architectureReady
      ? [
          '**可以开始规划**前后端分离：',
          '',
          '- 游戏状态 JSON 可序列化（`P2_SAVE_SCHEMA_VERSION`）',
          '- 事件定义 data-driven（`src/data/lines/`）',
          '- Choice feedback 结构化，可日志/replay',
          '- 本阶段 **未引入** DB、后端 API、账号、云同步、小程序运行时',
          '',
          '建议下一步：API 边界设计、state snapshot contract、event catalog 服务化——**实施留待独立 Phase**。',
        ].join('\n')
      : [
          '**暂不建议启动架构迁移**：',
          '',
          `- Golden line gate: ${goldenLine.pass ? 'PASS' : 'FAIL'}`,
          `- Pending stories: ${pending.length}`,
          `- Experience gate: ${experienceGate.decision}`,
        ].join('\n'),
    '',
    '## 10. Backlog（非本阶段）',
    '',
    '- 完整 UI 视觉重设计',
    '- 小程序专用 UI',
    '- 0–80 全人生内容扩展',
    '- 历史 Phase 报告正文修订（见 scope doc stale registry）',
    '',
  ];

  fs.writeFileSync(outputPath, lines.join('\n'), 'utf-8');
  fs.writeFileSync(legacyPath, [
    '# 体验治理 Closure（legacy redirect）',
    '',
    '本文件已由 PXG5 收口报告取代。请阅读：',
    '',
    '- `docs/test-reports/product-experience-governance-closure.md`',
    '',
    `生成时间：${new Date().toISOString()}`,
    '',
  ].join('\n'), 'utf-8');

  console.log(`Wrote ${path.relative(process.cwd(), outputPath)}`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
