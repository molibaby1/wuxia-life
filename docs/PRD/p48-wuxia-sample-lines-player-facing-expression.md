# PRD: P48 Wuxia Sample Lines Player-Facing Expression

## 1. Introduction

P48 是三条最小可玩人生样本线的第二执行阶段。它不负责继续扩剧情主干，而是把 P47 已经定义好的关键目标、长期代价、身份变化，转化成玩家能读懂的轻量表达。

这个阶段的原则是“轻量补齐，不做大 UI 重构”。重点是复用现有主界面 summary、life-memory、route signal、长期影响文案等表达面，让玩家在 0-40 岁内更稳定地知道：

- 我当前正在塑造成为什么样的人
- 我刚才的选择在推动哪条人生方向
- 我正在背上什么债、树什么敌、抓住什么机会
- 到 40 岁时，这条人生为何能和别条区分开

## 2. Goals

- 为三条样本线补齐最小玩家可读表达
- 将剧情关键节点转成 summary / route signal / long-term impact 可见信息
- 避免新增复杂面板或独立新系统
- 为后续人工 playtest 提供明确的玩家可感知信号

## 3. User Stories

### US-001: Audit Existing Player-Facing Surfaces For The Three Sample Lines
**Description:** As a maintainer, I want a focused audit of current player-facing expression surfaces so that P48 fills the real readability gaps instead of adding parallel presentation layers.

**Acceptance Criteria:**
- [x] 盘点主界面 summary、life-memory、route signal、长期影响文案等现有表达面
- [x] 标出三条样本线在这些表达面上的现有覆盖与缺口
- [x] 将 audit 保存到 `docs/test-reports/`
- [x] 本故事不改 gameplay 行为

### US-002: Define Orthodox Martial Summary Expression Tasks
**Description:** As a planner, I want the orthodox line’s player-facing expression decomposed into small tasks so that implementation can strengthen readability without broad UI redesign.

**Acceptance Criteria:**
- [x] 拆出正派武道的当前追求表达小任务
- [x] 拆出守正代价表达小任务
- [x] 拆出 40 岁身份总结表达小任务
- [x] 每个任务都能单次迭代完成

### US-003: Define Demonic Edge Summary Expression Tasks
**Description:** As a planner, I want the demonic line’s player-facing expression decomposed into small tasks so that temptation and backlash become legible without adding a new evil dashboard.

**Acceptance Criteria:**
- [x] 拆出邪路偏锋的诱惑表达小任务
- [x] 拆出越界后代价表达小任务
- [x] 拆出 40 岁身份总结表达小任务
- [x] 每个任务都能单次迭代完成

### US-004: Define Merchant Rise Summary Expression Tasks
**Description:** As a planner, I want the merchant line’s player-facing expression decomposed into small tasks so that wealth, leverage, and obligation become legible without business-specific UI expansion.

**Acceptance Criteria:**
- [x] 拆出商路崛起的当前追求表达小任务
- [x] 拆出债务/义气/风险表达小任务
- [x] 拆出 40 岁身份总结表达小任务
- [x] 每个任务都能单次迭代完成

### US-005: Define Cross-Line Current-Goal Expression Rules
**Description:** As a player, I want to know what my current life direction is so that I can intentionally continue or pivot the sample line I am building.

**Acceptance Criteria:**
- [x] 定义三条线共享的“当前追求”表达规则
- [x] 规则不暴露原始内部 key
- [x] 规则能在样本线尚未完全成形时优雅降级
- [x] 将规则写入 PRD

### US-006: Define Cross-Line Cost And Fallout Expression Rules
**Description:** As a player, I want important costs and fallout to feel like real consequences so that sample-line choices do not read as bookkeeping only.

**Acceptance Criteria:**
- [x] 定义三条线共享的“长期代价/后果”表达规则
- [x] 规则至少覆盖债、敌、机会、名声、牺牲中的若干类型
- [x] 规则优先复用现有长期影响表达面
- [x] 将规则写入 PRD

### US-007: Define Age-40 Identity Summary Rules
**Description:** As a player, I want age-40 summary language to clearly tell me what kind of person I became so that each sample line lands as a memorable life type.

**Acceptance Criteria:**
- [x] 为三条线分别定义 40 岁身份总结规则
- [x] 每条线总结都必须能和其核心目标、代价来源对上
- [x] 三条线总结文风保持统一但内容区分明显
- [x] 将规则写入 PRD

### US-008: Define Lightweight Surface Mapping
**Description:** As a developer, I want explicit mapping from each required expression to existing surfaces so implementation stays narrow and avoids accidental UX expansion.

**Acceptance Criteria:**
- [x] 明确哪些信息落在 main screen summary
- [x] 明确哪些信息落在 long-term impact / route signal
- [x] 明确哪些信息落在 life-memory / age-40 summary
- [x] 标明哪些需求本阶段不做

### US-009: Define P48 Closure Evidence
**Description:** As a maintainer, I want explicit closure evidence for the player-facing expression stage so later validation work knows what should already be visible to a human tester.

**Acceptance Criteria:**
- [x] 定义 P48 的玩家可读阶段收口证据
- [x] 定义最小人工检查项
- [x] 定义哪些表达缺口会阻塞进入 P49
- [x] 将 closure 规则写入 PRD

## 4. Functional Requirements

1. FR-1: 本阶段必须只做轻量玩家可见表达补齐，不新增复杂面板。
2. FR-2: 三条样本线都必须有“当前追求”“长期代价/后果”“40 岁身份总结”三类表达要求。
3. FR-3: 表达规则必须优先复用现有 summary、route signal、life-memory、长期影响承载面。
4. FR-4: 表达内容必须使用玩家可读语言，而不是内部 state key。
5. FR-5: 所有实施故事都必须拆到单次迭代可完成。

## 5. Non-Goals

- 不做全新 UI 页面
- 不做复杂信息架构重构
- 不新增独立人生追踪面板
- 不在本阶段大规模补剧情配置
- 不在本阶段宣称验证已经完成

## 6. Design Considerations

- 正派线表达应突出“守住什么”与“放弃什么”
- 邪路线表达应突出“得到了什么”与“开始失去什么”
- 商路线表达应突出“掌握了什么机会”与“背上了什么关系负担”
- 所有表达都应帮助人工测试者复述人生线，而不是读到抽象标签

## 7. Technical Considerations

- 预期主要承载面为 `mainScreenModel`、life-memory summary、route signal 与现有长期影响文本生成逻辑
- 文案映射应尽量通过已有字段扩展完成
- 仅在现有表达面完全承载不了时，才考虑额外轻量字段

## 8. Success Metrics

- 三条线都拥有清晰的表达任务拆分
- 当前追求、长期代价、40 岁总结三类表达均有明确落点
- 后续人工测试者可以根据文档检查玩家是否读懂样本线
- 无需大 UI 改动即可支撑最小玩家可读性

## 9. Open Questions

- 当前追求是否需要更偏“叙事句”而不是“方向标签”
- 邪路线代价表达应更偏名声、关系还是身体反噬
- 商路线 40 岁总结是否要强调“商人”还是“商路主导下的江湖人”

---

## 10. Orthodox Martial Expression Tasks

> 依据：P48-002 / US-002 / P47 §10、§16。复用 surface audit 正派缺口（见 `docs/test-reports/p48-sample-lines-player-facing-surface-audit.md` §4）。

### Task O-E1: 当前追求表达

- **目标：** 让玩家在 13–40 岁内能读出「我在成为被门派/江湖认可的正派武者」
- **输入：** `route_orthodox`、`orthodox_trial_completed`、`orthodox_formal_disciple` 等 flag
- **输出：** 主界面路线行或 life-memory 路线块追加 1 句当前追求叙事（非内部 key）
- **文案方向：** 少年期「入门试炼、争取认可」→ 青年期「行侠守义、承担门派义务」→ 中年前「守正有代价，仍在正道」
- **承载面：** `mainScreenModel.buildRouteSummary` 扩展 **或** `deriveLifeMemorySummary.buildRouteStatus` 追加 `currentGoalLabel` 字段（轻量）
- **降级：** 仅有 `sect_faction: orthodox` 未入门时 → 「门派倾向已显，尚未立誓入门」
- **验收：** 固定 seed 正派线 18/30/38 岁，summary 可读且不含 `route_orthodox` 等 raw key
- **估时：** 1 迭代

### Task O-E2: 守正代价表达

- **目标：** `sect_midlife_gray_mission` 三分岔（执行/泄密/拒绝）后果可被玩家复述
- **输入：** `sect_midlife_gray_executed` / `_leaked` / `_refused`、`sect_midlife_public_judgment_done`
- **输出：** 关键抉择 consequence 文案 + 未了因缘/风险信号差异化
- **承载面：** `lifeMemoryLabels.KEY_CHOICE_OUTCOME_CONSEQUENCES`、DEBT/RISK 映射；life-memory「关键抉择」「未了因缘」
- **文案示例：**
  - 执行 → 「你接了灰色任务，师门记功，心下难安」
  - 拒绝 → 「你守住了底线，师门关系承压」
  - 泄密 → 「你把内幕捅出，江湖侧目」
- **验收：** gray mission 各分支后，life-memory 关键抉择含 consequence，且未了因缘或风险与分支一致
- **估时：** 1 迭代

### Task O-E3: 40 岁身份总结表达

- **目标：** 40 岁前后玩家能说出「为何走正道、放弃了什么」（对齐 P46 §10.3）
- **输入：** P47 §16 `orthodox_age40_identity_summary` hook（配置实施后）或 interim：`sect_midlife_outcome` + gray 分支
- **输出：** life-memory「人生成就」或路线块 1–2 句身份总结
- **承载面：** `MIDLIFE_OUTCOME_LABELS` 扩展 + `deriveLifeMemorySummary.buildAchievements`；待配置 event 写入 `stageSignals: ["age40_identity"]`
- **文案方向：** 「你是……的正派武者，为守正放弃了……」
- **验收：** age ≥ 40 且正派线 midlife 链完成后，life-memory 出现可辨认身份总结
- **估时：** 1 迭代（文案映射）；配置 event 另计 P47 实施

---

## 11. Demonic Edge Expression Tasks

> 依据：P48-003 / US-003 / P47 §11、§16。

### Task D-E1: 诱惑与收益表达

- **目标：** 玩家感到「走邪路有回报」，而非仅 stat 上涨
- **输入：** `route_demonic`、`outlaw_rise`、`demonic_midlife_expansion_*`
- **输出：** 选择反馈长期影响 + 当前追求叙事强调诱惑/力量/地位
- **承载面：** `LONG_TERM_FLAG_LABELS` 扩展；O-E1 同款 currentGoal 机制，邪路文案表
- **文案方向：** 少年「第一次越界」→ 青年「力量与地盘在涨」→ 中年前「收益越大，孤立越深」
- **降级：** 仅 p9 childhood spark 时 → 「邪念已萌，尚未立誓入魔」
- **验收：** 邪路线 25/35 岁 summary 可读诱惑/收益，不含 raw flag
- **估时：** 1 迭代

### Task D-E2: 越界后代价表达

- **目标：** isolation / betrayal 后玩家感到「开始失去关系/名声/信任」
- **输入：** `demonic_midlife_isolation_done`、`demonic_midlife_betrayal_done`、`demonic_usurp_failed`
- **输出：** 风险信号 + 未了因缘 + 关键抉择 consequence 三联补齐
- **承载面：** `RISK_SIGNAL_LABELS`、`DEBT_FLAG_LABELS`、`KEY_CHOICE_OUTCOME_CONSEQUENCES`
- **文案示例：**
  - isolation → 「扩张之后，旧友渐远」
  - betrayal → 「门内清洗，信任碎裂」
  - usurp failed → 「夺位失手，阴影未散」（已有部分）
- **验收：** 各代价节点触发后，life-memory 至少 2 类区块（风险/未了因缘/关键抉择）有差异化文案
- **估时：** 1 迭代

### Task D-E3: 40 岁身份总结表达

- **目标：** 玩家感到「被选择与后果推向邪路」（P46 §10.3）
- **输入：** `demonic_midlife_fork` 分支 + 待补 `demonic_age40_identity_summary`
- **输出：** life-memory 身份总结，区分 redemption / escalate / balance
- **承载面：** `MIDLIFE_OUTCOME_LABELS`（已有 legacy 三分支）+ age-40 专用成就标签
- **文案方向：** 「你成了……的魔道中人，诱惑让你得到……，也让你失去……」
- **验收：** fork 完成后 age ≥ 40，总结与 fork 分支一致且三线文风统一
- **估时：** 1 迭代

---

## 12. Merchant Rise Expression Tasks

> 依据：P48-004 / US-004 / P47 §12、§16。商路为三线表达缺口最大（见 surface audit §6）。

### Task M-E1: 当前追求表达

- **目标：** 玩家读出「我在以小本经营积累财富与人脉」
- **输入：** `merchant_talent`、`merchant_shop_*`、`merchant_caravan_success`、`route_merchant`（P47 待补）
- **输出：** 路线 summary 叙事句 + 商路 flag 进入长期影响白名单
- **承载面：** `playerFacingLabels.LONG_TERM_FLAG_LABELS` 补 `route_merchant`；currentGoal 商路文案表
- **文案方向：** 少年「第一桶金」→ 青年「商队/投资分岔」→ 中年前「财富带来选择，也带来债」
- **降级：** 仅 preschool merchant 种子 → 「营商天赋已显，尚未开张」
- **验收：** 商路线 20/32 岁 summary 可读，长期影响在开店/商队 flag 写入时出现
- **估时：** 1 迭代

### Task M-E2: 债务/义气/风险表达

- **目标：** `merchant_shop_failure`、`merchant_crisis` 后果可感知，非 bookkeeping
- **输入：** `merchant_shop_failed`、`merchant_midlife_debt`（P47 待补）、`merchant_crisis` 分支
- **输出：** 商路关键抉择纳入 life-memory；DEBT/RISK 商路映射
- **承载面：** `ALL_KEY_CHOICE_EVENT_IDS` + `KEY_CHOICE_EVENT_LABELS` 扩展 merchant 事件；`buildUnresolvedDebts` / `buildRisks` 商路分支
- **文案示例：**
  - shop_failed → 「初次经营失利，本钱受损」
  - midlife_debt → 「人情债未清，周转吃紧」
  - crisis 义气冲突 → 「财富与义气难以两全」
- **验收：** 失败/危机节点后 life-memory 可见对应条目
- **估时：** 1 迭代

### Task M-E3: 40 岁身份总结表达

- **目标：** 「财富带来选择权也带来风险」（P46 §10.3）
- **输入：** 待补 `merchant_age40_identity_summary`；interim：`merchant_sect_investment` + crisis 分支
- **输出：** life-memory 身份总结，含财富规模 + 人情/债务
- **承载面：** 成就标签 + age-40 hook（对齐 P47 §17.3）
- **文案方向：** 「你是……的商路江湖人，财富让你……，也让你欠下……」
- **验收：** age ≥ 40 商路线有可辨认总结；与正派/邪路文风一致、内容可区分
- **估时：** 1 迭代

---

## 13. Cross-Line Current-Goal Expression Rules

> 依据：P48-005 / US-005 / P46 §10.2 人工项「玩家是否知道自己当前追求什么」。

### 13.1 表达原则

| 规则 | 说明 |
|------|------|
| 叙事句优先 | 当前追求用 1 句完整中文叙事，不用「route_orthodox」或 flag 名 |
| 阶段感知 | 按 P47 四章（童年/少年/青年/中年前）切换文案，同线不同阶段不得复读同句 |
| 单线聚焦 | 主界面 summary 只展示 primary route 的追求；兼修路线在 life-memory 展开 |
| 优雅降级 | 无 route flag 时按种子/倾向给弱信号；完全无信号时「人生方向未明，仍在摸索」 |

### 13.2 判定优先级

1. `routeStates` primary route + lifecycle（locked_in > active > temporary）
2. 等价 `route_*` flag（见 `playerFacingLabels.getPlayerRouteSummary`）
3. 样本线种子 flag（`orthodox_childhood_seed_done`、`demonic_childhood_seed_done`、`merchant_childhood_seed_done`）
4. `sect_faction` / origin tags（最弱）

### 13.3 三线 currentGoal 模板（实施参考）

| 样本线 | 少年期示例 | 青年期示例 | 中年前示例 |
|--------|------------|------------|------------|
| 正派武道 | 你在争取门派认可，准备入门试炼 | 你在行侠守义，承担门派义务 | 你在守正与灰色任务间取舍 |
| 邪路偏锋 | 你第一次越界，邪路在向你招手 | 你以风险换力量，地盘在扩张 | 收益之后，孤立与背叛逼近 |
| 商路崛起 | 你在攒第一桶金，摸索经营 | 你在商队与投资间布局财富 | 财富与人情债一起压来 |

### 13.4 禁止事项

- 不得在主界面新增第五行 summary（保持四行：路线/风险/倾向/塑形）
- 不得暴露 `eventId`、`flag` 原名给玩家
- 不得用「倾向」行替代 currentGoal（倾向继续反映数值属性）

---

## 14. Cross-Line Cost And Fallout Expression Rules

> 依据：P48-006 / US-006 / P46 §10.2 人工项「玩家是否感到选择有代价」。

### 14.1 代价类型与承载面映射

| 代价类型 | 典型来源 | 首选表达面 | 次选表达面 |
|----------|----------|------------|------------|
| 债（人情/金钱/道义） | gray_debtor、merchant_midlife_debt、has_life_debt | life-memory「未了因缘」 | 选择反馈长期影响 |
| 敌（宿怨/门内清洗） | swornEnemies、demonic_purge | life-memory「风险信号」 | 关键抉择 consequence |
| 机会（失去捷径/投资） | gray_refused、merchant_crisis | 关键抉择 consequence | 当前追求叙事微调 |
| 名声 | reputation 阈值、public_judgment | 主界面风险行 + life-memory 风险 | — |
| 牺牲（关系/健康） | isolation、chivalry 负向 + demonic | life-memory 风险 + 关系区块 | 成就/outcome 标签 |

### 14.2 表达原则

- **优先复用** 选择反馈「长期影响」与 life-memory 既有六区块，不新增「代价面板」
- **即时 + 持续：** 选择当下给 1 条长期影响；后续由 life-memory 未了因缘/风险维持可见
- **分支差异化：** 同一事件不同 choice 必须 consequence 文案不同（见 O-E2/D-E2/M-E2）
- **bookkeeping 禁止：** 不得仅显示「flag 已写入」类系统句

### 14.3 三线代价侧重点

| 样本线 | 主要代价类型 | 表达侧重 |
|--------|--------------|----------|
| 正派武道 | 牺牲、名声、机会 | 「守正放弃了什么」 |
| 邪路偏锋 | 敌、名声、牺牲（关系/健康） | 「得到力量后开始失去什么」 |
| 商路崛起 | 债、机会、牺牲（义气） | 「财富背后的关系负担」 |

---

## 15. Age-40 Identity Summary Rules

> 依据：P48-007 / US-007 / P47 §16、P46 §10.3。

### 15.1 共享规则

| 规则 | 说明 |
|------|------|
| 触发窗口 | age 38–42 写入；配置 event 带 `stageSignals: ["age40_identity"]` |
| 落点 | life-memory「人生成就」首条或路线块下方 1–2 句（不新增 panel） |
| 文风 | 统一第二人称过去式收束：「你成了……的人」 |
| 必含要素 | 核心目标（为何走这条路）+ 代价来源（失去了/背上了什么） |
| 区分度 | 三线总结并置时，测试者 30 秒内可辨线路 |

### 15.2 三线总结规则

#### 正派武道

- **核心目标锚点：** 门派认可、行侠守义
- **代价锚点：** gray mission 分支、public judgment 结果
- **模板：** 「你成了{门派/江湖}认可的正派武者。为守正，你{放弃了捷径/承担了审判/……}。」
- **输入 flag：** `orthodox_age40_identity_done`、`sect_midlife_outcome`、`sect_midlife_gray_*`

#### 邪路偏锋

- **核心目标锚点：** 诱惑、力量、邪路身份
- **代价锚点：** isolation、betrayal、fork 分支
- **模板：** 「你成了{魔道/邪路}中的{角色}。诱惑让你{得到……}，也让你{失去信任/名声/……}。」
- **输入 flag：** `demonic_age40_identity_done`、`demonic_midlife_fork_*`、`demonic_midlife_legacy_*`

#### 商路崛起

- **核心目标锚点：** 财富、经营、江湖中的商路身份
- **代价锚点：** shop_failure、midlife_debt、crisis 义气冲突
- **模板：** 「你成了{规模}的商路江湖人。财富给你{选择权}，也让你{欠下人情/债务/……}。」
- **输入 flag：** `merchant_age40_identity_done`、`merchant_midlife_debt`、`merchant_crisis` 分支

### 15.3 Interim 策略（P47 age-40 event 未实施前）

- 正派：用 `sect_midlife_outcome` + gray 分支 achievement 组合
- 邪路：用 `demonic_midlife_fork` outcome 标签
- 商路：用 `merchant_sect_investment` + crisis 分支 + money/reputation 阈值（弱信号，**阻塞 P48 实施收口**）

---

## 16. Lightweight Surface Mapping

> 依据：P48-008 / US-008。明确「改哪里、不改哪里」。

### 16.1 信息落点矩阵

| 信息类型 | main screen summary | 选择反馈长期影响 | life-memory | 本阶段不做 |
|----------|--------------------|-----------------|-------------|------------|
| 当前追求（叙事句） | 路线行扩展 | — | 路线块 optional | 新 panel |
| 路线名 + 阶段 | 路线行 | 路线变化 | 人生路线 | — |
| 即时代价 hint | — | 长期影响 flag | 关键抉择 consequence | modal 弹窗 |
| 持续代价/债 | 风险行（间接） | 部分 flag | 未了因缘 | 独立债务页 |
| 风险/名声/健康 | 风险行 | — | 风险信号 | — |
| 关键转折回顾 | — | — | 关键抉择 | 时间线 UI |
| 40 岁身份总结 | — | — | 人生成就 / 路线 | 结局全屏 |
| 数值倾向 | 倾向行 | statImpacts | — | 改倾向算法 |
| habit 塑形 | 塑形行 | shaping flags | 长期塑形 | 新 habit 面板 |

### 16.2 主要改动文件（实施阶段）

| 文件 | 允许改动 |
|------|----------|
| `playerFacingLabels.ts` | LONG_TERM_FLAG_LABELS、currentGoal 文案表 |
| `lifeMemoryLabels.ts` | 关键抉择、consequence、DEBT/RISK/ACHIEVEMENT 映射 |
| `deriveLifeMemorySummary.ts` | buildRouteStatus currentGoal、merchant key choices、商路 debt/risk |
| `mainScreenModel.ts` | buildRouteSummary 拼接 currentGoal（可选） |
| `ChoiceFeedbackGenerator.ts` | 仅当需新 flag visibility；不改 effect 解析逻辑 |

### 16.3 明确不做（本阶段）

- 新 UI 页面或独立人生追踪面板
- 主界面 summary 行数增加（保持四行）
- 大规模剧情配置（属 P47）
- 仿真 gate 或 P49 验证宣称
- 复杂信息架构重构

---

## 17. P48 Closure Evidence

> 依据：P48-009 / US-009 / P46 §11.2。P48 文档收口 vs 表达实施收口。

### 17.1 文档阶段收口证据（必须齐备）

| 证据类型 | 产出物 | 路径 | 状态 |
|----------|--------|------|------|
| Surface audit | 三线表达面盘点 | `docs/test-reports/p48-sample-lines-player-facing-surface-audit.md` | **已完成** |
| Line expression tasks ×3 | 正派/邪路/商路表达小任务 | 本 PRD §10–§12 | **已完成** |
| Cross-line rules | 当前追求 + 代价规则 | 本 PRD §13–§14 | **已完成** |
| Age-40 summary rules | 三线 40 岁总结规则 | 本 PRD §15 | **已完成** |
| Surface mapping | 轻量落点矩阵 | 本 PRD §16 | **已完成** |
| Closure rules | 收口与阻塞规则 | 本 PRD §17 | **已完成** |

### 17.2 必须产出的文档或报告

1. `docs/test-reports/p48-sample-lines-player-facing-surface-audit.md`
2. `docs/PRD/p48-wuxia-sample-lines-player-facing-expression.md`（含 §10–§17）
3. `docs/PRD/p48-wuxia-sample-lines-player-facing-expression.prd.json`（notes 更新）

### 17.3 表达实施收口证据（后续迭代，非本文档阶段）

| 证据类型 | 说明 |
|----------|------|
| O/D/M-E* 任务完成 | 9 个表达小任务各 1 迭代实施 + 定点验证 |
| 定点 age 截图/日志 | 三线各 3 个 age 点（~18/30/40）summary + life-memory 可读 |
| 无 raw key | 玩家可见输出不含 eventId/flag 原名 |

### 17.4 最小人工 spot-check（P49 前置）

对齐 P46 §10.2 人工五项，P48 实施完成后 spot-check：

1. 玩家是否知道自己当前追求什么（三线各 1 局）
2. 玩家是否感到选择有代价（各走 1 次 midlife 代价节点）
3. 玩家是否记得一个关键转折（试炼/越界/开店）
4. age-40 能否复述「这条人生为什么不同」
5. 三线并置时 30 秒内可辨线路

### 17.5 未完成则阻塞后续阶段

| 阻塞项 | 影响 |
|--------|------|
| 缺 surface audit | 不得启动 P48 大规模表达实施（无法判断落点） |
| 缺 §10–§16 规格 | 不得启动表达实施（任务边界不清） |
| 商路 key choice / debt 未接线 | 不得宣称商路线「玩家可读」 |
| 三线均无 age-40 总结落点 | 不得进入 P49 closure |
| 本文档齐备但 O/D/M-E* 未实施 | 可启动实施，但不得宣称 P48 实施收口（P46 §11.2） |

### 17.6 P48 文档收口 vs 表达实施收口

- **本文档阶段（P48 Review Fix）：** audit + §10–§17 齐备 → P48 **文档收口**
- **表达实施阶段（后续迭代）：** O/D/M-E* 任务落地 → P48 **实施收口** → 方可进入 P49（P46 §11.3）

### 17.7 Handoff 至 P49

P49 执行者应读取：

1. 本 PRD §13–§15 作为验证 checklist 输入
2. Surface audit §7–§8 作为实施 backlog 优先级
3. P46 §10.2 共享验收口径作为 closure 标准
4. P47 §16 age-40 hook 实施状态（影响 interim vs 专用 summary）

