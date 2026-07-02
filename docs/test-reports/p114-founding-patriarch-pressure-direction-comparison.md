# P114 Founding Patriarch Pressure Direction Comparison

> **Date:** 2026-07-02  
> **Stage:** P114 Wuxia Founding Patriarch Midlife Pressure Design-First  
> **Route:** `founding_patriarch`

## 1. Purpose

在 bounded 范围内比较 founding-patriarch midlife pressure 的候选方向，选出最小可实现且风味正确的 contract 方向，供 P115 实施。

---

## 2. Candidate Overview

| # | Direction | Core narrative | Distinction quality | Boundedness | Risk |
|---|-----------|----------------|---------------------|-------------|------|
| A | 门派延续之责 | 弟子、地盘、规矩都要你亲自背责，开派从理想变成长期负担 | 高 | 高 | Low |
| B | 盟约与治学撕裂 | 对外盟约事务挤压治学传承，身份被拉扯 | 高 | 中 | Medium |
| C | 自立山门 vs 续责开派 | 是否继续扩张山门责任，还是收缩只守核心传承 | 中高 | 中 | Medium |

---

## 3. Candidate Details

### A. 门派延续之责（推荐）

**核心叙事：** 从“成功开派”进入“持续背责”阶段，压力来自门规执行、弟子争议、盟友期待与资源调度，不再是单次成就感。

**触发条件（建议）：**
- `founding_patriarch_on_ramp_done=true`
- 年龄进入 40–45
- `!founding_patriarch_midlife_pressure_done`

**玩家选择空间：**
- 选择“守规矩优先”或“扩盟约优先”两种治理倾向（在单事件内分支）
- 两分支都进入 pressure checkpoint，差异留给表达层与后续 payoff 接口

**与其他 pressure 的区分：**
- vs renown：不是“人情债”，而是“组织延续责任”
- vs patron：不是“护商武力负担”，而是“治学与门规治理负担”
- vs magnate：不是“经营债”，而是“开派制度与传承债”

**评估：**
- 风味锚点稳（门派延续 + 学者盟约）
- 1 个核心事件即可承载，最小可实施

### B. 盟约与治学撕裂（备选）

**核心叙事：** 外部盟约义务太重，压缩了内部门徒治学，角色在“对外履约”与“对内传承”之间长期拉扯。

**触发条件（建议）：**
- on-ramp 完成 + alliance 变体权重更高
- 年龄 39–44

**玩家选择空间：**
- 可做 choice 分支，但分支需要较多文案与表达差异

**区分度：**
- 对 renown/patron 有较好区分，但容易扩成多事件链

**不作为首选原因：**
- 更依赖 alliance 分支细化，实施体量大于 A
- 风险是把 pressure 做成“多阶段政治线”，超出最小步幅

### C. 自立山门 vs 续责开派（放弃）

**核心叙事：** 主角考虑“收缩山门”或“继续扩张开派责任”。

**问题：**
- 方向更像 payoff 价值抉择，不像 midlife pressure 中段检查点
- 若提前做，会侵入 payoff 设计空间

**放弃结论：**
- defer 到 payoff/late-life 讨论，不进入 P114 contract 主线。

---

## 4. Recommendation

**推荐方向：A 门派延续之责。**

推荐理由：
1. 最贴合 founding-patriarch 核心风味（门派延续 + 开派责任）。
2. 能以 1 个核心 pressure 事件完成最小 contract 形状。
3. 与 renown/patron/magnate 的“债务类型”差异清晰。
4. 保留 scholar/alliance 变体优先级，不需要新系统。

---

## 5. Quality-First + Small-Step Check

| Principle | Result | Evidence |
| --------- | ------ | -------- |
| 风味一致性 | ✅ | 责任来自开派治理，不是金钱/人情/护商 |
| 最小可实现 | ✅ | 单核心事件 + 表达信号 contract |
| 风险可控 | ✅ | 不引入新系统，不扩多事件链 |
| 交接清晰 | ✅ | 可直接进入 P114-004 事件与 flag 合同定义 |

---

**P114-003 complete.** Direction comparison locked.
