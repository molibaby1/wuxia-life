# 包 B：年龄段与候选池节奏治理执行包

## 任务目标

修正 formal、daily、storyline、family、setback、career 等事件在年龄段中的分布，让人生节奏从“正式事件连续播放”变成有阶段、有呼吸、有主次的体验。

## 当前证据

- P1 rhythm baseline 显示 formal 比例过高，daily 比例过低。
- `getAvailableEvents` 先按优先级排序并截取前 3 个候选，可能放大高优先级宽年龄段事件优势。
- 青年到中年阶段存在挫折、家庭、职业、江湖事件连续挤占时间线。
- daily 事件有重复惩罚，但正式事件的类别级节奏控制较弱。

## 只读分析清单

1. 读取候选池和分层选择逻辑：
   - `src/core/GameEngineIntegration.ts`
   - `src/core/EventLoader.ts`
   - `src/core/DailyEventSystem.ts`
2. 读取节奏报告脚本：
   - `scripts/reportRhythmMetrics.ts`
   - `scripts/generateRhythmBaselineReport.ts`
3. 统计年龄段事件池：
   - childhood
   - youth
   - adult
   - midlife
   - elderly
4. 标出每个年龄段 top candidates、formal/daily 比、类别拥堵点。

## 实施边界

允许：

- 调整候选池抽样策略。
- 调整 formal/daily/storyline 分层选择规则。
- 增加节奏指标和报告字段。
- 增加固定 seed rhythm 回归样本。

不允许：

- 修复包 A 的事件历史问题。
- 重做路线生命周期。
- 大量新增剧情内容。
- 修改 UI。

## 成功标准

- formal/daily 比例回到批准基线或有明确解释。
- 青年、成年、中年阶段不再被少数类别长期占据。
- 关键事件仍受保护。
- rhythm baseline 有 before/after 对照。

## 风险

- 候选池策略变化会改变大量固定 seed 时间线。
- daily 过强会稀释剧情推进。
- formal 过弱会让人生显得空转。

## 交付物

- 年龄段分布报告。
- 候选池调整方案和审批记录。
- before/after rhythm 指标。
- 对包 C 路线调度的建议。
