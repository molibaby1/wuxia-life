#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { evaluateExperienceHealthGate } from './experienceHealthGate';
import { getGameplaySimulationSamples } from './runGameplaySimulation';
import { GameProcessSimulator } from '../tests/GameProcessSimulator';

async function main(): Promise<void> {
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

  const gate = evaluateExperienceHealthGate(reports, []);
  const outputDir = path.join(process.cwd(), 'docs/test-reports');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'experience-governance-closure.md');
  const lines: string[] = [
    '# 体验治理 Closure（包 A–D）',
    '',
    `生成时间：${new Date().toISOString()}`,
    '',
    '## 1. 摘要',
    '',
    `- 样本数：${samples.length}（含 ${samples.filter(s => s.routeTrack).length} 条路线专项）`,
    `- 门禁决策：**${gate.decision.toUpperCase()}**`,
    `- 警告项失败（不阻断）：${gate.warningsFailed}`,
    '',
    '## 2. 包 A–C 能力收口',
    '',
    '| 包 | 能力 |',
    '|----|------|',
    '| A | 统一 eventHistory；复读脚本走引擎；flags 门禁 |',
    '| B | main_story 退出 critical；候选池 cap=12 |',
    '| C | 路线加载一致；completion flag；路线保底槽 + 专项样本 |',
    '| D | 体验健康门禁 `gate:experience`；复读三项 blocker 且 nonWaivable；已接入 validate/CI |',
    '',
    '## 3. 包 D 复读门禁（已生效）',
    '',
    '以下三项在 `experienceHealthMetricDefinitions.ts` 中为 **blocker** 且 **nonWaivable**，超标即阻断 `npm run validate` / `npm run gate:experience`：',
    '',
    '- `adjacent_same_event_rate`（max 0.08）',
    '- `adjacent_same_class_rate`（max 0.35）',
    '- `short_window_same_class_rate`（max 0.45）',
    '',
    '## 4. 指标对照',
    '',
    '| metric | severity | status | actual | detail |',
    '|--------|----------|--------|--------|--------|',
  ];

  for (const metric of [
    ...gate.blockingMetrics,
    ...gate.warningMetrics,
    ...gate.infoMetrics,
  ]) {
    lines.push(
      `| ${metric.key} | ${metric.severity} | ${metric.status} | ${metric.actualValue?.toFixed(4) ?? 'n/a'} | ${metric.detail.replace(/\|/g, '/')} |`,
    );
  }

  lines.push(
    '',
    '## 5. 验证命令',
    '',
    '```bash',
    'npm run typecheck',
    'npm test',
    'npm run gate:experience',
    'npm run simulate:gameplay:samples -- --gate',
    'npm run repro:event-repetition',
    'npm run report:rhythm-metrics',
    'npm run report:experience-governance-closure',
    '```',
    '',
    '`gate:experience` 已接入 `npm run validate` 与 `.github/workflows/ci.yml`，无需再单独纳入 CI。',
    '',
    '## 6. 残余风险',
    '',
    '- `death_rate` 仍为 warning 级别 fail（当前样本 actual=1.0，高于 max=0.9），不阻断门禁决策',
    '- `romance_family_achievement_rate` 仍为 info 级别 warning/fail（样本内未达 min=0.05），不阻断门禁决策',
    '- 路线专项样本依赖 fixture bootstrap，与纯随机游玩口径不同，结论外推需谨慎',
    '',
    '## 7. 后续建议',
    '',
    '- 持续观察 `death_rate` / `romance_family_achievement_rate` 是否需调阈值或升 severity',
    '- 扩展路线专项样本覆盖，或降低 fixture bootstrap 对路线指标的影响',
    '- 复读 blocker 已生效；后续重点转向 P2 warning/info 指标与样本代表性',
    '',
  );

  fs.writeFileSync(outputPath, lines.join('\n'), 'utf-8');
  console.log(`Wrote ${path.relative(process.cwd(), outputPath)}`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
