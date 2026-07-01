# PRD: P67 Wuxia Merchant Trilogy Success Shape And Recap

> **Derived from:** `docs/test-reports/p66-success-cost-differentiation-closure-report.md`, `docs/test-reports/p65-merchant-trilogy-player-experience-closure-report.md`, `docs/test-reports/p64-merchant-pressure-payoff-differentiation-closure-report.md`
> **Stage slug:** `p67-wuxia-merchant-trilogy-success-shape-and-recap`
> **Stage type:** bounded player-experience payoff stage focused on success shape and recall

## 1. Introduction

在 P66 把三条 merchant 路线的“成功代价”拉开之后，下一步最值钱的体验提升，不是继续堆代价，而是让玩家在成功时真正感到：**我这局是以什么样的方式成为了这种人。**

玩家最后会带走的，往往不是系统设计图，而是 1 句可复述的个人命运句子。对于 merchant trilogy，这种收束感应该至少支持下面这类认知：

- 我是从铺子里算出来的商人
- 我是靠熟客和引荐爬上来的商人
- 我是从田间和粮路硬扛上来的商人

因此，P67 的重点是两件事：

- 让三条路线的成功“形状”更不一样
- 让回顾/结算层拥有更清晰的命运收束感

这一步不是再做新系统，而是把 trilogy 的 payoff 变得更可复述、更可记住。

## 2. Goals

- 强化三条 merchant 路线“是靠什么做大”的成功形状差异
- 让回顾/结算层更容易形成一句清晰的玩家命运总结
- 复用现有 trilogy 结构，不做新结算系统
- 把这套方法论收束成可复用模板，为下一条 ordinary→mixed 终点线做准备

## 3. Non-Goals

- 不新增完整 merchant ending framework
- 不做 full recap UI 重构
- 不重开 success-cost 主切口
- 不转向新 ordinary→mixed 终点线实施
- 不扩成 full playtest / analytics system

## 4. User Stories

### US-001: Audit Current Success-Shape And Recap Strength
**Description:** As a maintainer, I want an audit of the current success-shape and recap strength so P67 targets the real weak spots in player recall.

**Acceptance Criteria:**
- [ ] 汇总三条路线当前已有的成功形状信号与回顾收束信号
- [ ] 明确哪些线已经可复述，哪些线仍模糊
- [ ] 输出 `docs/test-reports/p67-success-shape-recap-audit.md`
- [ ] 本故事不改运行行为

### US-002: Lock P67 Scope Contract
**Description:** As a planner, I want a scope contract so P67 stays focused on success shape and recap rather than becoming a broader ending-system project.

**Acceptance Criteria:**
- [ ] 明确 P67 只处理成功形状与回顾收束
- [ ] 明确允许层：轻量配置、表达、proof、窄测试
- [ ] 明确禁止项：新 ending framework、全量 merchant epilogue 系统
- [ ] 输出 `docs/test-reports/p67-success-shape-recap-scope-contract.md`

### US-003: Define Apprentice Success-Shape Contract
**Description:** As a designer, I want a bounded success-shape contract for the apprentice route so its merchant success reads as built through judgment, craft, and partnership.

**Acceptance Criteria:**
- [ ] 明确 apprentice 成功形状的核心标签
- [ ] 成功形状必须承接学徒→手艺→合伙→商路的既有路径
- [ ] 不写成 generic merchant victory
- [ ] 合同写入 PRD 或附录

### US-004: Define Tavern Success-Shape Contract
**Description:** As a designer, I want a bounded success-shape contract for the tavern route so its merchant success reads as built through contacts, information, and recommendation networks.

**Acceptance Criteria:**
- [ ] 明确 tavern 成功形状的核心标签
- [ ] 成功形状必须承接熟客 / 引荐 / 信息网络
- [ ] 不写成 generic merchant victory
- [ ] 合同写入 PRD 或附录

### US-005: Define Peasant Success-Shape Contract
**Description:** As a designer, I want a bounded success-shape contract for the peasant route so its merchant success reads as built through endurance, cargo risk, and hard-earned scale.

**Acceptance Criteria:**
- [ ] 明确 peasant 成功形状的核心标签
- [ ] 成功形状必须承接田间 / 粮路 / 奔波 / 重本
- [ ] 不写成 generic merchant victory
- [ ] 合同写入 PRD 或附录

### US-006: Add Recap-Line / Destiny-Sentence Expression
**Description:** As a player, I want the trilogy to leave me with a sentence I can naturally use to summarize what kind of merchant I became.

**Acceptance Criteria:**
- [ ] 至少补 3 组 recap-line / destiny-sentence 表达信号
- [ ] 三条路线都能形成可复述的玩家总结句
- [ ] 不新增新 UI 组件
- [ ] 对应表达测试可新增或更新

### US-007: Wire Success-Shape Differentiation
**Description:** As a developer, I want the three success shapes expressed through bounded runtime-visible carriers so the recap difference is not just prose detached from the route.

**Acceptance Criteria:**
- [ ] 只通过现有 carrier / marker / expression-adjacent wiring 实现差异
- [ ] 不引入新的 merchant framework
- [ ] `P58/P59/P61/P63/P64/P66` evidence 不退化
- [ ] 成功形状与 recap 彼此对齐

### US-008: Add Targeted Success-Shape And Recap Proof
**Description:** As a maintainer, I want a bounded proof artifact showing that each merchant route now lands with a distinct success shape and a recallable destiny sentence.

**Acceptance Criteria:**
- [ ] 新增 1 条 comparison-style targeted proof
- [ ] 关键证据包含三线成功形状与 recap 对照
- [ ] 不要求全量结局系统证明
- [ ] proof 能作为方法论模板的归档证据

### US-009: Add Narrow Regression Coverage
**Description:** As a maintainer, I want narrow tests guarding the recap and success-shape differentiation so later edits do not collapse the trilogy back into one generic success summary.

**Acceptance Criteria:**
- [ ] 至少覆盖 marker、表达、comparison-level assertion 三类断言
- [ ] 复用既有 merchant trilogy harness
- [ ] 不重写全量 merchant tests
- [ ] 相关命令 Pass

### US-010: Produce P67 Closure Report
**Description:** As a maintainer, I want a closure report stating exactly what player-recall and success-shape differentiation the trilogy now delivers, and how this package can serve as a reusable optimization method for future routes.

**Acceptance Criteria:**
- [ ] 输出 `docs/test-reports/p67-success-shape-recap-closure-report.md`
- [ ] 汇总 audit、contracts、expression、wiring、proof、tests
- [ ] 明确这套 merchant trilogy 方法论可如何迁移到未来新路线
- [ ] 列出仍 defer 的更大 ending / route-expansion 项

## 5. Functional Requirements

1. FR-1: P67 必须只处理成功形状与回顾收束感。
2. FR-2: 三条 success-shape contract 必须分别承接 apprentice / tavern / peasant 的既有路线。
3. FR-3: P67 的 recap difference 必须是玩家可复述的，而不是仅在内部文档成立。
4. FR-4: P67 必须复用现有 trilogy 结构，不得引入新的 ending framework。
5. FR-5: P67 closure 必须明确沉淀出可复用的方法论模板。

## 6. Success Criteria

- 玩家能区分三条路线各自“是靠什么做大”的
- 玩家能自然形成一句命运总结
- 成功形状与成功代价形成完整的玩家记忆闭环
- 这套 trilogy 优化顺序可作为后续新 ordinary→mixed 终点线的方法论

## 7. Dependencies / Context

- P66 closure: `docs/test-reports/p66-success-cost-differentiation-closure-report.md`
- P65 closure: `docs/test-reports/p65-merchant-trilogy-player-experience-closure-report.md`
- P64 closure: `docs/test-reports/p64-merchant-pressure-payoff-differentiation-closure-report.md`

## 8. Risks And Rollback

### Risks

- **Slogan-only risk:** 容易只补几句漂亮总结，而不和路线真实形状绑定
- **Recap blur risk:** 容易三条线都变成“不同措辞的成功商人”
- **Methodology overclaim risk:** 容易过早宣称模板已成熟而未真正验证

### Rollback

- 若 audit 证明当前回顾层已足够鲜明，则 P67 可缩为 very small recap polish
- 若唯一有效方案需要新结算系统，则该方向应显式 defer

## 9. Validation Direction

- 表达层：三条 recap-line / destiny sentence 必须清楚不同
- truth 层：成功形状差异必须与既有 route truth 对齐
- 方法论层：closure 必须明确这套 trilogy 优化顺序为何可迁移到下一条新路线

---

## Appendix A: Success-Shape Contracts

### A.1 Apprentice Merchant Success-Shape Contract

**Route:** town_apprentice → apprentice_merchant_bridge_crossed → merchant_magnate

**Core success-shape tags:**
- 手艺眼光 (craft judgment)
- 合伙分成 (partnership shares)
- 品质信誉 (quality reputation)
- 账目精算 (meticulous bookkeeping)

**Success metaphor:** Success through judgment and craft quality — the merchant who succeeds by knowing what's good, by building partnerships that extend craft into commerce.

**What makes it apprentice-shaped (not generic merchant):**

| Dimension | Apprentice Success Shape | Generic Merchant Success |
|-----------|--------------------------|------------------------|
| **How you win | 靠手艺的眼光和品质的信誉做大 | 靠资本和运气做大 |
| **What you build** | 一条靠品质立住的商路帝国 | 一条靠资源堆起来的商路帝国 |
| **Your relationship to success | 成功是手艺的延伸，是从刨子到账本的延伸 | 成功是身份的跃迁，是从穷人到富人的跃迁 |
| **The cost you pay** | 失去了只管刨花的纯粹，要看着合伙人的脸色 | 失去了安稳，要扛着债和人情 |
| **What you'd tell people** | "我是靠手艺眼光做起来的商人" | "我是做买卖做起来的商人" |

**Success-shape anchoring to existing path:**
- 承接学徒→手艺→合伙→商路的既有路径 (P58 bridge)
- 从"手艺学透、合伙商路已通"的入门表达 (P63 entry)
- 从"合伙人与账目债"的压力表达 (P64 + P66 pressure)
- 从"要看合伙人的脸色，账目上的分成比刨子上的木纹更难拿捏"的代价表达 (P66 payoff cost)

**Destiny sentence direction:** "从刨子到账本，靠手艺的眼光算出了一片商路 — 只是如今要看着合伙人的脸色过日子

**What makes it NOT generic merchant victory:**
- 成功的根是手艺眼光/品质，不是资本/运气
- 成功的形状是"手艺延伸出的商路，不是"做大的商路"
- 代价是失去手艺纯粹性和自主，不是"失去安稳
- 命运句里有"刨子"和"账本"两个起点意象，不是只有学徒特有

---

### A.2 Tavern Merchant Success-Shape Contract

**Route:** tavern_hand → tavern_merchant_bridge_crossed → merchant_magnate

**Core success-shape tags:**
- 人情网络 (favor network)
- 引荐人脉 (referral connections)
- 信息流动 (information flow)
- 面子人情 (face/favor debt)

**Success metaphor:** Success through connections and information flow — the merchant who succeeds by knowing everyone, by being the node where information and favors meet.

**What makes it tavern-shaped (not generic merchant):**

| Dimension | Tavern Success Shape | Generic Merchant Success |
|-----------|---------------------|------------------------|
| **How you win** | 靠人情的网络和信息的灵通做大 | 靠资本和运气做大 |
| **What you build** | 一张靠人情织就的商路网 | 一条靠资源堆起来的商路帝国 |
| **Your relationship to success** | 成功是人脉的延伸，是从酒肆到商号的延伸 | 成功是身份的跃迁，是从穷人到富人的跃迁 |
| **The cost you pay** | 欠的人情比挣的银子多，人人都认得你、人人都有求于你 | 失去了安稳，要扛着债和人情 |
| **What you'd tell people** | "我是靠人脉做起来的商人" | "我是做买卖做起来的商人" |

**Success-shape anchoring to existing path:**
- 承接熟客/引荐/信息网络的既有路径 (P59 bridge)
- 从"人脉已通、铺子已上手，正借助这些关系扩张"的入门表达 (P63 entry)
- 从"人情面子债，老主顾的期待、介绍的欠情"的压力表达 (P64 + P66 pressure)
- 从"欠的人情比挣的银子还多，每一笔生意都要掂量谁的面子、还谁的情"的代价表达 (P66 payoff cost)

**Destiny sentence direction:** "从酒肆到商号，靠人情的网络织出了八方商路 — 只是欠的人情比挣的银子还多"

**What makes it NOT generic merchant victory:**
- 成功的根是人脉/信息，不是资本/运气
- 成功的形状是"网络织成商路，不是"商路"
- 代价是人情债和被认出的负担，不是"失去安稳"
- 命运句里有"酒肆"和"商号"两个起点意象，不是只有跑堂特有

---

### A.3 Peasant Merchant Success-Shape Contract

**Route:** farm_peasant → peasant_merchant_bridge_crossed → merchant_magnate

**Core success-shape tags:**
- 脚力血汗 (physical endurance)
- 粮路奔波 (grain-route travel)
- 收成赌注 (harvest betting)
- 车马仓储 (cargo/logistics)

**Success metaphor:** Success through endurance and cargo risk — the merchant who succeeds by out-working and out-lasting everyone, by betting the body and winning.

**What makes it peasant-shaped (not generic merchant):**

| Dimension | Peasant Success Shape | Generic Merchant Success |
|-----------|----------------------|------------------------|
| **How you win** | 靠脚力和血汗、靠赌收成赌季节做大 | 靠资本和运气做大 |
| **What you build** | 一条靠脚力踩出来的粮路帝国 | 一条靠资源堆起来的商路帝国 |
| **Your relationship to success** | 成功是体力的延伸，是从田埂到车马的延伸 | 成功是身份的跃迁，是从穷人到富人的跃迁 |
| **The cost you pay** | 脚下的路比田埂还长，赢了但也再回不到田里了 | 失去了安稳，要扛着债和人情 |
| **What you'd tell people** | "我是靠脚力踩出来的商人" | "我是做买卖做起来的商人" |

**Success-shape anchoring to existing path:**
- 承接田间/粮路/奔波/重本的既有路径 (P61 bridge)
- 从"粮路跑通、买卖上手，正学着像商人一样思考"的入门表达 (P63 entry)
- 从"车马仓储债，运力、仓库、下属工钱让泥腿子用身体在扛"的压力表达 (P64 + P66 pressure)
- 从"脚下的路比田埂还长，每一步都赌过收成、押过季节，赢了但也再回不到田里了"的代价表达 (P66 payoff cost)

**Destiny sentence direction:** "从田埂到车马，靠脚力和血汗踩出了一条粮路 — 只是赢了也再回不到田里了"

**What makes it NOT generic merchant victory:**
- 成功的根是体力/耐力，不是资本/运气
- 成功的形状是"脚力踩出粮路"，不是"商路"
- 代价是身体损耗和失去土地的安稳，不是"失去安稳"
- 命运句里有"田埂"和"车马"两个起点意象，不是只有农户特有

---

### A.4 Three Success Shapes at a Glance

| Dimension | Apprentice | Tavern | Peasant |
|-----------|-----------|--------|---------|
| **Success through** | 手艺眼光 + 合伙分成 | 人情网络 + 信息流动 | 脚力血汗 + 粮路奔波 |
| **Success metaphor** | 从刨子到账本 | 从酒肆到商号 | 从田埂到车马 |
| **What you build** | 品质立住的商路 | 人情织就的商路网 | 脚力踩出的粮路 |
| **Cost shape** | 合伙人脸色 + 账目分成难拿捏 | 人情债 + 人人有求于你 | 路比田埂长 + 再也回不到田里 |
| **Destiny sentence pattern** | "从X到Y，靠Z算出/织出/踩出了... — 只是..." | "从X到Y，靠Z算出/织出/踩出了... — 只是..." | "从X到Y，靠Z算出/织出/踩出了... — 只是..." |
| **Core distinction** | Judgment/craft quality shaped | Network/information shaped | Endurance/logistics shaped |
