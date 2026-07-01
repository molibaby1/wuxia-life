# P48 Sample Lines Player-Facing Surface Audit

生成时间：2026-06-26

## 1. 审计范围与方法

对照 P46 §10.2（共享验收口径）、P47 PRD §10–§17（三条样本线配置输入）与 P48 PRD 目标，盘点现有玩家可见表达面及三线覆盖缺口。

**主要代码承载面：**

| 表达面 | 文件 | 职责 |
|--------|------|------|
| 主界面 summary 模型 | `mainScreenModel.ts` | 路线 / 风险 / 倾向 / 塑形四行摘要 |
| 主界面 summary 卡片 | `MainScreenLifeSummary.vue` | 渲染 summary 四行 |
| life-memory 推导 | `deriveLifeMemorySummary.ts` | 路线、关键抉择、未了因缘、风险、成就、塑形 |
| life-memory 面板 | `LifeMemoryPanel.vue` | 展开式人生摘要 |
| 选择反馈 | `ChoiceFeedbackGenerator.ts` | 长期影响 flag、路线变化 |
| 玩家可读标签 | `playerFacingLabels.ts` | 路线名、长期 flag、生命周期阶段 |
| life-memory 标签表 | `lifeMemoryLabels.ts` | 关键抉择、代价、风险、成就文案 |

本审计仅盘点与标注 gap，**不改 gameplay 行为**。

## 2. 表达面 Inventory

| 表达面 | 当前可见信息 | 样本线相关输入 | 缺口类型 |
|--------|-------------|----------------|----------|
| 主界面「路线」行 | `{路线名} · {阶段}`，如「正道门派 · 路线进行中」 | `route_orthodox` / `route_demonic` / 商路 flag 组合 | **泛化**：无样本线专属「当前追求」叙事 |
| 主界面「风险」行 | 最高优先级可见风险标签 | `sect_midlife_judgment_pending`、`demonic_purge`、`badReputation` | 正派/邪路部分覆盖；商路缺专属风险 |
| 主界面「倾向」行 | 数值属性排名（悟性、体魄、侠义…） | 间接反映 chivalry / money | **误导风险**：不等同于人生方向 |
| 主界面「塑形」行 | habit 轴 dominant lines | 间接 | 与样本线身份弱关联 |
| 选择反馈「长期影响」 | `LONG_TERM_FLAG_LABELS` 子集 | `route_orthodox`、`route_demonic` | 商路 `route_merchant` 有标签但未进长期影响白名单 |
| 选择反馈「路线变化」 | flag 前后 route key 对比 | route flag 写入时触发 | 仅切换瞬间可见，非持续追求 |
| life-memory「人生路线」 | 主/兼修路线 + 门派倾向 + 最近转向 | routeStates + route flags | 缺章节阶段叙事（童年/少年/青年/中年） |
| life-memory「关键抉择」 | goldenLine + midlife 事件子集 | 正派/邪路 midlife 在列；商路事件**不在** | **商路缺失** |
| life-memory「未了因缘」 | debt flag 映射 | 正派 gray debt、邪路 usurp/consequence | 商路 `merchant_midlife_debt` **未接线** |
| life-memory「风险信号」 | 健康/声望/邪路/门派审判 | 三线部分覆盖 | 商路义气/债务风险无专属标签 |
| life-memory「人生成就」 | achievement + midlife outcome | `orthodox_trial_completed`、demonic legacy | 商路 milestone **无成就标签** |
| age-40 身份总结 | **无专用 UI 区块** | P47 待补 `*_age40_identity_summary` | **三线均缺** |

## 3. P46 §10.1 最低要素 — 表达层对照

| 要素 | 最低要求 | 正派武道 | 邪路偏锋 | 商路崛起 |
|------|----------|----------|----------|----------|
| 中期身份信号（≥1） | route / identity 可感知 | 有（路线+试炼成就） | 有（魔道+midlife） | 弱（路线推断，无专节点文案） |
| 40 岁总结钩子 | 可复述人生差异 | 弱（公开审判近 40，无 summary） | 弱（fork 38 岁，无 summary） | **缺失** |
| 当前追求可读 | P46 §10.2 人工项 | 弱 | 弱 | **缺失** |
| 选择有代价可读 | P46 §10.2 人工项 | 部分（gray debt） | 部分（usurp/purge） | **缺失** |

## 4. 正派武道（Orthodox Martial）表达覆盖

### 4.1 已覆盖

| 生命阶段 | P47 节点 | 现有表达面 | 玩家可见文案示例 |
|----------|----------|------------|------------------|
| 少年路线 | `sect_path_choice` → join_orthodox | 长期影响 + life-memory 关键抉择 | 「拜入正道门派」「踏上正道」 |
| 少年试炼 | `orthodox_trial_*` | 关键抉择 + 成就 | 「入门试炼」「完成正道试炼」 |
| 中年守正代价 | `sect_midlife_gray_mission` | 关键抉择 + 未了因缘 + 风险 | 「中年门派灰任务」「师门中年账尚未清」 |
| 路线持续 | `route_orthodox` | 主界面路线行 + life-memory 路线 | 「正道门派 · 路线进行中」 |

### 4.2 缺口

| 缺口 | 说明 | P48 任务 |
|------|------|----------|
| 当前追求叙事 | 路线行仅显示路线名，未表达「守正行侠、承担门派义务」 | O-E1 |
| 守正代价表达 | gray mission 后果文案未区分执行/泄密/拒绝 | O-E2 |
| 40 岁身份总结 | 无 `orthodox_age40_identity_summary` 展示落点 | O-E3 |
| 章节阶段感 | 无「被认可 / 立志 / 守正代价显现」阶段标签 | §13 跨线规则 |

## 5. 邪路偏锋（Demonic Edge）表达覆盖

### 5.1 已覆盖

| 生命阶段 | P47 节点 | 现有表达面 | 玩家可见文案示例 |
|----------|----------|------------|------------------|
| 少年越界 | `outlaw_identity_beginning` / `demonic_encounter` | 路线 + 关键抉择 | 「魔道」「接受魔道诱惑」 |
| 青年诱惑 | `demonic_midlife_expansion` | 关键抉择 | 「魔道扩张」 |
| 中年代价 | `demonic_midlife_betrayal` / isolation | 关键抉择 + 风险 + 未了因缘 | 「魔道背叛之局」「门内清算风险未解」 |
| 40 岁附近 | `demonic_midlife_fork` | 关键抉择 + midlife outcome 成就 | 「魔道岔路」「金盆洗手/远遁割席」 |

### 5.2 缺口

| 缺口 | 说明 | P48 任务 |
|------|------|----------|
| 诱惑 vs 收益 | 选择后长期影响未强调「得到了力量/地位」 | D-E1 |
| 越界后代价 | isolation/betrayal 后果未与「开始失去关系/名声」挂钩 | D-E2 |
| 40 岁身份总结 | fork outcome 非专用 age-40 summary | D-E3 |
| 童年种子 | p9 回声 hook 无玩家可读 summary 落点 | §13 降级规则 |

## 6. 商路崛起（Merchant Rise）表达覆盖

### 6.1 已覆盖

| 生命阶段 | P47 节点 | 现有表达面 | 玩家可见文案示例 |
|----------|----------|------------|------------------|
| 路线推断 | `merchant_talent` + p9/p8 商路 flags | 主界面路线行（条件组合） | 「商路 · 路线进行中」 |
| 数值侧信号 | money / businessHabit | 主界面资源 + 塑形 | 银两、营商习惯（间接） |

### 6.2 缺口

| 缺口 | 说明 | P48 任务 |
|------|------|----------|
| 关键抉择 visibility | `merchant_first_shop` 等**不在** life-memory key choice 集合 | M-E1/M-E2 前置 |
| 当前追求 | 无「积累财富/经营扩张」叙事句 | M-E1 |
| 债务/义气/风险 | `merchant_midlife_debt`、`merchant_crisis` 未进 DEBT/RISK 映射 | M-E2 |
| 40 岁身份总结 | **完全缺失** | M-E3 |
| route_merchant 长期影响 | flag 有 `ROUTE_FLAG_LABELS` 但未进 `LONG_TERM_FLAG_LABELS` | §14 + M-E1 |

## 7. 跨线共享缺口总表

| 表达类型 | 正派武道 | 邪路偏锋 | 商路崛起 | 共享规则章节 |
|----------|----------|----------|----------|--------------|
| 当前追求 | 弱 | 弱 | 缺失 | P48 PRD §13 |
| 长期代价/后果 | 部分 | 部分 | 缺失 | P48 PRD §14 |
| 40 岁身份总结 | 弱 | 弱 | 缺失 | P48 PRD §15 |
| 轻量落点映射 | — | — | — | P48 PRD §16 |

## 8. P48 表达阶段建议优先补齐项

1. **商路 expression 接线** — 将 merchant 关键节点纳入 life-memory / 长期影响白名单（M-E1/M-E2）
2. **跨线「当前追求」规则** — 在路线 summary 或 life-memory 路线块追加叙事句，不暴露内部 key（§13）
3. **三线 age-40 summary 落点** — 对齐 P47 §16 hooks，优先 life-memory 成就/路线块（§15）
4. **gray / isolation / merchant_crisis 后果文案** — 补 `KEY_CHOICE_OUTCOME_CONSEQUENCES` 与 DEBT/RISK 映射（O-E2/D-E2/M-E2）

## 9. 审计结论

现有表达面**足以承载轻量补齐**（无需新 UI 面板）：主界面 summary 四行、选择反馈长期影响、life-memory 六区块均已存在。三线差距主要在**文案映射完整度**与**商路事件 visibility**，而非缺少承载容器。

P48 文档收口后，实施应按 PRD §10–§16 任务逐线、逐面补齐；P49 再验证 P46 §10.2 仿真 + 人工证据。
