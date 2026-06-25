# PRD: P47 Wuxia Sample Lines Story Configuration

## 1. Introduction

P47 是三条最小可玩人生样本线的第一执行阶段，目标不是“把所有内容做全”，而是先把三条线的 0-40 岁剧情骨架、关键节点、关键选择、代价回流、身份收束明确落在现有内容配置承载面上。

本阶段只处理剧情配置层，不先做大规模展示补齐，不先做验证平台扩写。重点是确保三条线都能回答同一个玩家问题：

- 我这一生想成为什么人？
- 我为了它要持续做什么？
- 我会为此失去什么？
- 到 40 岁时，我能不能明显看出这条人生和别条不同？

## 2. Goals

- 为正派武道、邪路偏锋、商路崛起三条样本线定义 0-40 岁章节骨架
- 为每条样本线补齐最小关键节点、关键选择、代价回流和 40 岁身份总结钩子
- 将工作限制在现有内容配置和 route/flag/routePoint 承载面内
- 为后续轻量展示和验证阶段提供稳定输入

## 3. User Stories

### US-001: Audit Existing Content Anchors For The Three Sample Lines
**Description:** As a content planner, I want a focused gap audit of existing orthodox, demonic, and merchant anchors so that P47 extends real repo content instead of inventing disconnected new arcs.

**Acceptance Criteria:**
- [x] 盘点现有正派武道、邪路偏锋、商路相关内容锚点
- [x] 标出哪些节点已存在，哪些节点缺失
- [x] 将 gap audit 保存到 `docs/test-reports/`
- [x] 本故事不改 gameplay 行为

### US-002: Define The 0-40 Chapter Spine For Orthodox Martial
**Description:** As a designer, I want an explicit chapter spine for the orthodox martial sample so that later event work serves one coherent life arc instead of scattered martial content.

**Acceptance Criteria:**
- [x] 定义正派武道在童年、少年、青年、中年前的章节目标
- [x] 明确至少 5 个关键节点
- [x] 明确至少 2 个关键选择
- [x] 明确至少 1 个守正代价或失败回流节点
- [x] 将 spine 规格写入文档

### US-003: Define The 0-40 Chapter Spine For Demonic Edge
**Description:** As a designer, I want an explicit chapter spine for the demonic edge sample so that the route reads as temptation, gain, and cost rather than flat evil-stat growth.

**Acceptance Criteria:**
- [x] 定义邪路偏锋在童年、少年、青年、中年前的章节目标
- [x] 明确至少 5 个关键节点
- [x] 明确至少 2 个关键选择
- [x] 明确至少 1 个收益后的代价回流节点
- [x] 将 spine 规格写入文档

### US-004: Define The 0-40 Chapter Spine For Merchant Rise
**Description:** As a designer, I want an explicit chapter spine for the merchant rise sample so that the route reads as ambition, leverage, and obligation instead of only money gain.

**Acceptance Criteria:**
- [x] 定义商路崛起在童年、少年、青年、中年前的章节目标
- [x] 明确至少 5 个关键节点
- [x] 明确至少 2 个关键选择
- [x] 明确至少 1 个财富/义气或债务/人情回流节点
- [x] 将 spine 规格写入文档

### US-005: Specify Orthodox Childhood And Youth Configuration Work
**Description:** As an implementer, I want orthodox early-life work split into small tasks so that story configuration can be delivered incrementally instead of as one broad content rewrite.

**Acceptance Criteria:**
- [x] 将正派武道的童年种子拆成独立小任务
- [x] 将少年首次被认可节点拆成独立小任务
- [x] 将青年入门/立志节点拆成独立小任务
- [x] 每个小任务都能单次迭代完成

### US-006: Specify Demonic Childhood And Youth Configuration Work
**Description:** As an implementer, I want demonic early-life work split into small tasks so that the corruption arc can be built stepwise and validated locally.

**Acceptance Criteria:**
- [x] 将邪路偏锋的童年偏执/狠劲种子拆成独立小任务
- [x] 将少年第一次越界节点拆成独立小任务
- [x] 将青年高收益诱惑节点拆成独立小任务
- [x] 每个小任务都能单次迭代完成

### US-007: Specify Merchant Childhood And Youth Configuration Work
**Description:** As an implementer, I want merchant early-life work split into small tasks so that the livelihood arc can be expanded through bounded story slices.

**Acceptance Criteria:**
- [x] 将商路崛起的童年营商种子拆成独立小任务
- [x] 将少年第一桶金节点拆成独立小任务
- [x] 将青年商队/投资分岔拆成独立小任务
- [x] 每个小任务都能单次迭代完成

### US-008: Specify Midlife Cost And Identity Hooks For All Three Lines
**Description:** As a planner, I want the shared midlife-cost and identity-hook work split clearly so later implementation does not stop at youth growth spikes without lifetime consequence.

**Acceptance Criteria:**
- [x] 为正派武道定义中年守正代价钩子
- [x] 为邪路偏锋定义中年名声/关系/健康代价钩子
- [x] 为商路崛起定义中年财富/义气冲突钩子
- [x] 为三条线分别定义 40 岁身份总结钩子

### US-009: Define RoutePoint And Flag Wiring Requirements
**Description:** As a developer, I want explicit routePoint and flag wiring requirements so that content implementation stays compatible with the current runtime instead of drifting into hidden assumptions.

**Acceptance Criteria:**
- [x] 为三条样本线定义必须写入的关键 flags
- [x] 为三条样本线定义关键 routePoints 或同级承载点
- [x] 标明哪些节点应使用 `mainline` / `mandatory` / `once` 保护
- [x] 将 wiring 要求写入 PRD

### US-010: Define P47 Closure Evidence
**Description:** As a maintainer, I want explicit closure evidence for the configuration stage so later phases know the story spine is stable enough to build on.

**Acceptance Criteria:**
- [x] 定义 P47 的配置阶段收口证据
- [x] 明确需要产出的文档或报告
- [x] 明确未完成哪些内容不能进入后续阶段
- [x] 将 closure 规则写入 PRD

## 4. Functional Requirements

1. FR-1: 三条样本线都必须有 0-40 岁章节骨架。
2. FR-2: 每条样本线都必须至少定义 5 个关键节点、2 个关键选择、1 个代价回流、1 个 40 岁总结钩子。
3. FR-3: 配置工作必须优先复用现有 `route_orthodox`、`route_demonic`、merchant 相关承载面。
4. FR-4: 配置工作必须明确关键 flags、routePoints 与节点保护标签。
5. FR-5: 所有实施故事必须足够小，能在单次迭代中完成。

## 5. Non-Goals

- 不在本阶段做主界面或 summary 层的大改
- 不在本阶段做新的 runtime 通用框架
- 不做三条线之外的新路线样本
- 不做全量事件池补写
- 不在本阶段宣称玩家已能完整读懂三条线

## 6. Design Considerations

- 正派武道应突出“守正的代价”，而不只是练功升级
- 邪路偏锋应突出“诱惑与反噬”，而不是单调黑化
- 商路崛起应突出“财富带来的选择权与债务”，而不是纯金钱膨胀
- 三条线都要能被玩家复述成一条人生故事，而不是一串离散事件

## 7. Technical Considerations

- 预期主要落点为 `src/data/lines/` 内既有 route/identity/merchant/demon/sect 相关内容文件
- 现有内容需要的新增应优先采用配置扩写，而非共享 runtime 抽象
- 若执行中发现关键节点无法稳定承载，再在后续单独立案

## 8. Success Metrics

- 三条线都具备书面章节 spine
- 三条线都完成小故事级别拆解
- 所有关键 flags / routePoints / protection tags 要求明确
- 后续执行者无需再重新设计三条线主干

## 9. Open Questions

- 正派武道是否要在第一轮直接绑定某一门派中年节点，还是先保持更宽泛的正道身份
- 邪路线第一轮是否要显式区分“保留底线”与“彻底沉沦”两种分支
- 商路线第一轮是否优先强调商队经营还是投资布局

## 10. Orthodox Martial 0–40 Chapter Spine

> 依据：P47-002 / US-002。复用 `sect-wudang.json`、`orthodox.json` 现有锚点（见 gap audit）。

### 10.1 四章章节目标

| 章节 | 年龄 | 章节目标 | 玩家应感到 |
|------|------|----------|------------|
| 童年 | 0–12 | 种下「守正、练武、被期待」的种子 | 我天生适合走正道 |
| 少年 | 13–17 | 被门派/江湖首次认可，完成入门试炼 | 我被正道接纳了 |
| 青年 | 18–30 | 立志行侠、承担门派义务 | 我在为「正派武者」身份付出 |
| 中年前 | 31–40 | 守正代价显现，公开身份收束 | 守正有代价，但我仍是正派 |

### 10.2 关键节点（≥5）

| # | 节点 ID（现有/待补） | 年龄 | 承载文件 | 状态 |
|---|---------------------|------|----------|------|
| N1 | `preschool_martial_*` → 待补 `orthodox_childhood_seed_done` | 7–12 | preschool-passive-spine | 有种子，缺 route 绑定 |
| N2 | `sect_path_choice` → `join_orthodox` | 13–14 | sect-wudang | **已存在** |
| N3 | `orthodox_trial_completion` | 13–18 | sect-wudang | **已存在** |
| N4 | `orthodox_formal_disciple` / `orthodox_sect_mission` | 19–25 | orthodox | **已存在** |
| N5 | `sect_midlife_gray_mission` | 36–45 | sect-wudang | **已存在**（守正代价） |
| N6 | `orthodox_age40_identity_summary`（待补） | 40 | sect-wudang 或 orthodox | **缺失** |

### 10.3 关键选择（≥2）

| 选择 | 节点 | 分岔 | 后果 |
|------|------|------|------|
| C1 | `orthodox_trial_entry` | 心试 vs 力试 vs 延迟 | 不同试炼路径与属性成长 |
| C2 | `sect_midlife_gray_mission` | 执行/泄密/拒绝 | `sect_midlife_gray_executed` / `_leaked` / `_refused` |

### 10.4 守正代价 / 失败回流（≥1）

- **主节点：** `sect_midlife_gray_mission`（36 岁）— 门派灰色任务，守正需拒绝或承担关系/名声损失
- **回流 flag：** `sect_midlife_gray_refused` → 触发 `sect_midlife_public_judgment` 公开审判链
- **失败含义：** 拒绝守正则 chivalry/师徒关系下降；执行则背负道德负担

---

## 11. Demonic Edge 0–40 Chapter Spine

> 依据：P47-003 / US-003。复用 `identity-demon.json`、`sect-marginal.json`、`p9-remediation.json`。

### 11.1 四章章节目标

| 章节 | 年龄 | 章节目标 | 玩家应感到 |
|------|------|----------|------------|
| 童年 | 0–12 | 偏执/狠劲种子，对「正道规则」的疏离 | 我和别人不一样 |
| 少年 | 13–17 | 第一次越界，被邪路接纳 | 我跨过了那条线 |
| 青年 | 18–30 | 高收益诱惑，力量快速积累 | 走邪路有回报 |
| 中年前 | 31–40 | 收益后的代价回流，身份收束 | 我选择了邪路，也付出了代价 |

### 11.2 关键节点（≥5）

| # | 节点 ID | 年龄 | 承载文件 | 状态 |
|---|---------|------|----------|------|
| N1 | `p9_milestone_route_signal: demonic_childhood_spark` / 待补 `demonic_childhood_seed_done` | 7–13 | p9-remediation | 弱（回声 hook） |
| N2 | 待补 `demonic_youth_first_transgression` 或复用 `outlaw_identity_beginning` | 13–15 | identity-demon | 部分（15 岁入门） |
| N3 | `outlaw_identity_beginning` | 15–25 | identity-demon | **已存在** |
| N4 | `outlaw_rise` / `demonic_midlife_expansion` | 25–38 | identity-demon | **已存在** |
| N5 | `demonic_midlife_isolation_*` / `demonic_midlife_betrayal` | 33–45 | identity-demon | **已存在**（代价） |
| N6 | `demonic_age40_identity_summary`（待补）或复用 `demonic_midlife_fork` | 38–40 | identity-demon | 弱（fork 在 38，缺专用 summary） |

### 11.3 关键选择（≥2）

| 选择 | 节点 | 分岔 | 后果 |
|------|------|------|------|
| C1 | `outlaw_identity_beginning` | 毅然加入 vs 有条件加入 | 核心弟子 vs 外围人员 |
| C2 | `demonic_midlife_expansion` | 扩张地盘 / 秘术 / 稳固 | `demonic_midlife_expansion_martial` / `_secret` / `_stable` |

### 11.4 收益后代价回流（≥1）

- **主节点：** `demonic_midlife_isolation_*`（33 岁）— 扩张后的孤立、关系破裂
- **辅助节点：** `demonic_midlife_betrayal`（36 岁）— 背叛与清洗选择
- **回流 flag：** `demonic_midlife_isolation_done` → 解锁 `demonic_midlife_fork`  redemption/escalate/balance

---

## 12. Merchant Rise 0–40 Chapter Spine

> 依据：P47-004 / US-004。复用 `merchant.json`、`identity-merchant.json`、`preschool-passive-spine.json`。

### 12.1 四章章节目标

| 章节 | 年龄 | 章节目标 | 玩家应感到 |
|------|------|----------|------------|
| 童年 | 0–12 | 营商种子，对物价/账本/商队的早期感知 | 我天生会做生意 |
| 少年 | 13–17 | 第一桶金，第一次独立经营 | 我赚到了属于自己的钱 |
| 青年 | 18–30 | 商队/投资分岔，财富与人脉积累 | 财富给我更多选择 |
| 中年前 | 31–40 | 财富/义气/债务冲突，身份收束 | 有钱也有甩不掉的债 |

### 12.2 关键节点（≥5）

| # | 节点 ID | 年龄 | 承载文件 | 状态 |
|---|---------|------|----------|------|
| N1 | `preschool_merchant_*` / `merchant_talent_discovery` | 7–16 | preschool + merchant | **已存在** |
| N2 | `merchant_first_shop` | 16–22 | merchant | **已存在**（第一桶金） |
| N3 | `merchant_caravan_guard` / `merchant_market_monopoly` | 18–30 | merchant | **已存在**（商队/垄断分岔） |
| N4 | `merchant_sect_investment` | 30–40 | merchant | **已存在**（投资分岔） |
| N5 | `merchant_crisis` / `p9_merchant_midlife_caravan` | 30–45 | identity-merchant + p9 | 部分（中年冲突） |
| N6 | `merchant_age40_identity_summary`（待补） | 40 | merchant 或 identity-merchant | **缺失** |

### 12.3 关键选择（≥2）

| 选择 | 节点 | 分岔 | 后果 |
|------|------|------|------|
| C1 | `merchant_first_shop` | 杂货 / 武器 / 草药 | `merchant_shop_grocery` / `_weapon` / `_herb` |
| C2 | `merchant_market_monopoly` | 垄断 vs 公平交易 | `merchant_monopoly` vs `merchant_fair_trade` |

### 12.4 财富/义气或债务/人情回流（≥1）

- **主节点：** `merchant_shop_failure`（17 岁）— 经营失败回流
- **中年节点：** `merchant_crisis`（identity-merchant 30+）— 财富危机与义气冲突
- **回流 flag：** `merchant_shop_failed`；危机分支应写入 `merchant_midlife_debt` 或等价 flag（待补）

---

## 13. Orthodox Early-Life Configuration Tasks

> 依据：P47-005 / US-005。每个任务可在单次迭代内完成，仅改配置不改 runtime。

### Task O-1: 童年种子 route 绑定

- **目标：** 将 `preschool_martial_*` 与 `orthodox_childhood_seed_done` flag 关联
- **输入：** preschool-passive-spine martial 事件
- **输出：** 童年结束时有可续链的 orthodox 种子 flag
- **验收：** `orthodox_childhood_seed_done` 写入后，`sect_path_choice` 条件可感知 martial  upbringing
- **估时：** 1 迭代

### Task O-2: 少年首次被认可节点

- **目标：** 在 `orthodox_trial_completion` 后写入 `orthodox_youth_recognized` milestone
- **输入：** sect-wudang 试炼链
- **输出：** 首次被认可的可复述节点（event_record + flag）
- **验收：** 试炼完成后 flag 存在，后续 `orthodox_formal_disciple` 可引用
- **估时：** 1 迭代

### Task O-3: 青年入门/立志节点

- **目标：** 强化 `orthodox_formal_disciple` 与 `route_orthodox` 的 mandatory 保护
- **输入：** orthodox.json 正式弟子链
- **输出：** 青年立志节点带 `mainline`/`once` 标签
- **验收：** 固定 seed 下 18–25 岁稳定触发正式弟子事件
- **估时：** 1 迭代

---

## 14. Demonic Early-Life Configuration Tasks

> 依据：P47-006 / US-006。

### Task D-1: 童年偏执/狠劲种子

- **目标：** 补 `demonic_childhood_seed_done` 或强化 p9 `demonic_childhood_spark` 续链
- **输入：** p9-remediation demonic childhood hooks
- **输出：** 7–12 岁可触发的 demonic 种子 flag
- **验收：** 种子 flag 写入后，15 岁 `outlaw_identity_beginning` 条件权重提升
- **估时：** 1 迭代

### Task D-2: 少年第一次越界节点

- **目标：** 在 13–14 岁补轻量越界 preview（`demonic_youth_first_transgression`）或提前 `outlaw_identity_beginning` 触发窗口
- **输入：** identity-demon 入门链
- **输出：** 少年越界 milestone flag
- **验收：** 15 岁前可感知「第一次越界」信号
- **估时：** 1 迭代

### Task D-3: 青年高收益诱惑节点

- **目标：** 标注 `outlaw_rise` / `demonic_midlife_expansion` 为样本线 spine 正式节点，补 `mandatory`/`once`
- **输入：** identity-demon 崛起/扩张链
- **输出：** 青年诱惑节点稳定触发且三分叉可续链
- **验收：** 25–38 岁固定 seed 下 expansion 事件出现且 flag 续链
- **估时：** 1 迭代

---

## 15. Merchant Early-Life Configuration Tasks

> 依据：P47-007 / US-007。

### Task M-1: 童年营商种子

- **目标：** 将 `preschool_merchant_*` 与 `merchant_childhood_seed_done` 关联，并写入 `route_merchant`（或等价 flag）
- **输入：** preschool-passive-spine merchant 事件
- **输出：** 童年种子 + 统一商路 route flag
- **验收：** 8 岁 `merchant_talent_discovery` 可引用 childhood seed
- **估时：** 1 迭代

### Task M-2: 少年第一桶金节点

- **目标：** 强化 `merchant_first_shop` 的 `once`/`mainline` 保护
- **输入：** merchant.json 开店链
- **输出：** 16 岁第一桶金稳定触发
- **验收：** 固定 seed 下 16–22 岁触发且三分叉 flag 互斥
- **估时：** 1 迭代

### Task M-3: 青年商队/投资分岔

- **目标：** 对齐 `merchant_caravan_guard` 与 `merchant_sect_investment` 为 spine 正式分叉，补续链条件
- **输入：** merchant.json 商队/投资链
- **输出：** 18–40 岁商队 vs 投资路径 flag 续链
- **验收：** caravan 或 investment flag 写入后，midlife 节点可引用
- **估时：** 1 迭代

---

## 16. Midlife Cost And Age-40 Identity Hooks

> 依据：P47-008 / US-008。三线共享中年代价 + 40 岁收束规格。

### 16.1 正派武道

| 钩子类型 | 节点 | flag / routePoint | 说明 |
|----------|------|-------------------|------|
| 中年守正代价 | `sect_midlife_gray_mission` | `sect_midlife_gray_*` | 灰色任务：执行/泄密/拒绝 |
| 40 岁身份总结 | 待补 `orthodox_age40_identity_summary` | `orthodox_age40_identity_done` | 基于 gray 分支 + `sect_midlife_public_judgment` 写入 life-memory 钩子 |

**40 岁总结方向：** 「清晰正派武道身份，能说出为何走正道、放弃了什么」（对齐 P46 §10.3）

### 16.2 邪路偏锋

| 钩子类型 | 节点 | flag / routePoint | 说明 |
|----------|------|-------------------|------|
| 中年名声/关系/健康代价 | `demonic_midlife_isolation_*`, `demonic_midlife_betrayal` | `demonic_midlife_isolation_done`, `demonic_midlife_betrayal_done` | 孤立、背叛、关系破裂 |
| 40 岁身份总结 | 待补 `demonic_age40_identity_summary` 或强化 `demonic_midlife_fork` | `demonic_age40_identity_done` | redemption/escalate/balance 三分叉收束 |

**40 岁总结方向：** 「邪路身份总结，能感到被选择与后果推向邪路」

### 16.3 商路崛起

| 钩子类型 | 节点 | flag / routePoint | 说明 |
|----------|------|-------------------|------|
| 中年财富/义气冲突 | `merchant_crisis`, `p9_merchant_midlife_caravan` | `merchant_midlife_debt`, `p9_merchant_midlife_path` | 债务、商队 vs 投资、义气冲突 |
| 40 岁身份总结 | 待补 `merchant_age40_identity_summary` | `merchant_age40_identity_done` | 财富规模 + 欠下的人情/债务 |

**40 岁总结方向：** 「商路身份总结，能感到财富带来选择权也带来风险」

---

## 17. RoutePoint And Flag Wiring Requirements

> 依据：P47-009 / US-009。实施时必须兼容现有 runtime，不得引入隐藏假设。

### 17.1 正派武道 — 关键 flags

| Flag | 写入节点 | 续链用途 | 保护 |
|------|----------|----------|------|
| `route_orthodox` | `sect_path_choice` → join_orthodox | 全线 gate | `mainline`, `once` |
| `orthodox_trial_active` | join_orthodox | 试炼链入口 | `mandatory` |
| `orthodox_trial_completed` | orthodox_trial_completion | 正式弟子前置 | `once` |
| `orthodox_youth_recognized` | 待补 Task O-2 | 青年链入口 | `once` |
| `sect_midlife_gray_*` | sect_midlife_gray_mission | 中年代价链 | `mainline`, `once` |
| `orthodox_age40_identity_done` | 待补 age-40 summary | P48/P49 展示输入 | `once` |

### 17.2 邪路偏锋 — 关键 flags

| Flag | 写入节点 | 续链用途 | 保护 |
|------|----------|----------|------|
| `route_demonic` | outlaw_identity_beginning | 全线 gate | `mainline`, `once` |
| `outlaw_identity_done` | outlaw_identity_beginning | 邪路身份锁定 | `once` |
| `demonic_childhood_seed_done` | 待补 Task D-1 | 少年越界前置 | — |
| `demonic_midlife_expansion_done` | demonic_midlife_expansion | 代价链入口 | `mainline`, `once` |
| `demonic_midlife_isolation_done` | demonic_midlife_isolation_* | fork 前置 | `once` |
| `demonic_age40_identity_done` | 待补 age-40 summary | P48/P49 展示输入 | `once` |

### 17.3 商路崛起 — 关键 flags

| Flag | 写入节点 | 续链用途 | 保护 |
|------|----------|----------|------|
| `route_merchant` | 待补 Task M-1 | 全线 gate（当前缺失） | `mainline`, `once` |
| `merchant_talent` | merchant_talent_discovery | 开店链入口 | `once` |
| `merchant_childhood_seed_done` | 待补 Task M-1 | 天赋发现前置 | — |
| `merchant_shop_*` | merchant_first_shop | 经营分岔 | `once` |
| `merchant_midlife_debt` | 待补 merchant_crisis 分支 | 中年冲突 | `mainline` |
| `merchant_age40_identity_done` | 待补 age-40 summary | P48/P49 展示输入 | `once` |

### 17.4 保护标签使用规则

| 标签 | 适用节点 | 含义 |
|------|----------|------|
| `mainline` | 路线抉择、中年代价、40 岁收束 | 样本线主干，高优先级 |
| `mandatory` | 试炼入口、路线锁定 | 条件满足时必须触发 |
| `once` | 所有 milestone / summary | 一生只触发一次 |

### 17.5 routePoints 等价承载

- 若 runtime 不支持独立 routePoint 字段，使用 `flag_set` + `event_record` + `p9_milestone_route_signal` 组合
- 所有 age-40 summary 应写入 `stageSignals: ["age40_identity"]`（对齐 p9-remediation 现有模式）

---

## 18. P47 Closure Evidence

> 依据：P47-010 / US-010 / P46 §11.1。P47 配置阶段收口门槛。

### 18.1 配置阶段收口证据（必须齐备）

| 证据类型 | 产出物 | 路径 | 状态 |
|----------|--------|------|------|
| Gap audit | 三线内容锚点盘点 | `docs/test-reports/p47-sample-lines-content-anchor-gap-audit.md` | **已完成** |
| Chapter spine ×3 | 0–40 章节骨架 | 本 PRD §10–§12 | **已完成** |
| Early-life tasks ×3 | 童年/少年/青年任务拆分 | 本 PRD §13–§15 | **已完成** |
| Midlife + age-40 hooks | 中年代价与 40 岁钩子 | 本 PRD §16 | **已完成** |
| Flag/route wiring | 续链与保护要求 | 本 PRD §17 | **已完成** |
| Closure rules | 收口与阻塞规则 | 本 PRD §18 | **已完成** |

### 18.2 必须产出的文档或报告

1. `docs/test-reports/p47-sample-lines-content-anchor-gap-audit.md`
2. `docs/PRD/p47-wuxia-sample-lines-story-configuration.md`（含 §10–§18）
3. `docs/PRD/p47-wuxia-sample-lines-story-configuration.prd.json`（notes 更新）

### 18.3 未完成则阻塞后续阶段

| 阻塞项 | 影响 |
|--------|------|
| 任一样本线缺 0–40 spine 文档 | 不得启动 P48 |
| 缺 gap audit | 不得启动 P48（无法判断复用 vs 新建） |
| 缺 flag/route 续链说明 | 不得启动 P48（展示层无稳定输入） |
| 三线 age-40 summary hook 未在配置规格中定义 | 不得启动 P48 大规模展示 |
| 上述文档齐备但配置内容未实施 | 可启动 P48 规格对齐，但不得宣称 P47 实施完成 |

### 18.4 P47 文档收口 vs 配置实施收口

- **本文档阶段（P47 Review Fix）：** 文档 + audit + wiring 规格齐备 → P47 **文档收口**
- **配置实施阶段（后续迭代）：** Task O/D/M 系列实际写入 JSON → P47 **实施收口** → 方可进入 P48 大规模展示（P46 §11.1）

### 18.5 Handoff 至 P48

P48 执行者应读取：

1. 本 PRD §10–§17 作为展示映射输入
2. Gap audit 中的「缺失」项作为 P48 非阻塞但需跟踪的 backlog
3. P46 §10.2 共享验收口径作为 P49 前置参考

