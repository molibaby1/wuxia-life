# PRD: P66 Wuxia Merchant Trilogy Success-Cost Differentiation

> **Derived from:** `docs/test-reports/p65-merchant-trilogy-player-experience-closure-report.md`, `docs/test-reports/p63-merchant-entry-differentiation-closure-report.md`, `docs/test-reports/p64-merchant-pressure-payoff-differentiation-closure-report.md`
> **Stage slug:** `p66-wuxia-merchant-trilogy-success-cost-differentiation`
> **Stage type:** bounded player-experience differentiation stage focused on success cost

## 1. Introduction

如果 P65 的结论成立，那么 merchant trilogy 当前最值得继续优化的体验痛点，不是“还能不能再进商路”，而是**玩家是否真的感到三条成功路线付出了不同的代价**。

玩家通常不会长期记住多加了几个节点，但会记住：

- 我这局是怎么成功的
- 我为了成功失去了什么
- 我的痛和另一条线的痛到底哪里不同

因此，P66 的重点不应是继续加大 merchant 内容体量，而应是围绕三条 ordinary→merchant 路线的“成功代价”做 bounded differentiation。目标不是让每条线都拥有独立系统，而是让 apprentice、tavern、peasant 三线的痛感，明显更像各自的人生：

- 学徒线：合伙、账目、控制权失衡
- 酒肆线：关系反噬、人情债、信息失真
- 农人线：压货、奔波、赌时机

只要这层差异真正站住，玩家对“这是我的人生，不是同一条商路换皮”的感知就会明显增强。

## 2. Goals

- 让三条 merchant 路线的成功代价变得更可感、可区分
- 把代价差异从弱文案层推进到 runtime-visible 的玩家体验层
- 复用现有 merchant trilogy 骨架，不做 full merchant second wave
- 为 `P67` 的成功形状与回顾收束提供更强前提

## 3. Non-Goals

- 不新增大规模 merchant 内容波次
- 不重写 `P55` magnate chain
- 不优先处理“成功形状”或“回顾句子”作为主切口
- 不新建 economic platform / trade simulation / relation system
- 不转向新 ordinary→mixed 终点线

## 4. User Stories

### US-001: Audit Current Success-Cost Signals
**Description:** As a maintainer, I want an audit of the current success-cost signals so P66 targets the real thin spots instead of layering generic hardship on top.

**Acceptance Criteria:**
- [ ] 汇总 apprentice / tavern / peasant 三线当前已有的代价信号
- [ ] 明确哪些代价已存在、哪些仍过于 generic
- [ ] 输出 `docs/test-reports/p66-success-cost-signal-audit.md`
- [ ] 本故事不改运行行为

### US-002: Lock P66 Scope Contract
**Description:** As a planner, I want a scope contract so P66 stays focused on success-cost differentiation instead of broad merchant expansion.

**Acceptance Criteria:**
- [ ] 明确 P66 只处理成功代价差异
- [ ] 明确允许层：轻量配置、表达、proof、窄测试
- [ ] 明确禁止项：full merchant wave、成功形状主线、playtest 平台化
- [ ] 输出 `docs/test-reports/p66-success-cost-scope-contract.md`

### US-003: Define Apprentice Success-Cost Contract
**Description:** As a designer, I want a bounded cost contract for the apprentice merchant path so its success feels tied to partnership and control risks.

**Acceptance Criteria:**
- [ ] 明确 apprentice 路线的主要痛点来源
- [ ] 痛点必须承接学徒→合伙→商路的既有路径
- [ ] 不把 apprentice 成本写成 generic merchant debt
- [ ] 合同写入 PRD 或附录

### US-004: Define Tavern Success-Cost Contract
**Description:** As a designer, I want a bounded cost contract for the tavern merchant path so its success feels tied to network and favor backlash.

**Acceptance Criteria:**
- [ ] 明确 tavern 路线的主要痛点来源
- [ ] 痛点必须承接熟客 / 引荐 / 人情网络
- [ ] 不把 tavern 成本写成 generic merchant debt
- [ ] 合同写入 PRD 或附录

### US-005: Define Peasant Success-Cost Contract
**Description:** As a designer, I want a bounded cost contract for the peasant merchant path so its success feels tied to labor, cargo risk, and timing bets.

**Acceptance Criteria:**
- [ ] 明确 peasant 路线的主要痛点来源
- [ ] 痛点必须承接粮路 / 奔波 / 重本押注
- [ ] 不把 peasant 成本写成 generic merchant debt
- [ ] 合同写入 PRD 或附录

### US-006: Wire Success-Cost Differentiation
**Description:** As a developer, I want the three cost profiles wired through bounded configuration or markers so players can feel different burdens without a new system.

**Acceptance Criteria:**
- [ ] 只通过现有 carrier / marker / expression-adjacent wiring 实现差异化
- [ ] 不引入新的 merchant framework
- [ ] `P55/P58/P59/P61/P63/P64` 既有 evidence 不退化
- [ ] 差异后路径仍稳定保持 merchant trilogy 结构

### US-007: Add Player-Facing Cost Expression
**Description:** As a player, I want each merchant route's burden to read as my own kind of pain rather than as one shared merchant stress line.

**Acceptance Criteria:**
- [ ] 至少补 3 组 cost-specific 表达信号
- [ ] 玩家能区分 apprentice / tavern / peasant 的痛感来源
- [ ] 不新增 UI 组件
- [ ] 对应表达测试可新增或更新

### US-008: Add Targeted Success-Cost Proof
**Description:** As a maintainer, I want a bounded proof artifact showing that the three merchant routes now pay different prices for success.

**Acceptance Criteria:**
- [ ] 新增 1 条 comparison-style targeted proof
- [ ] 关键证据包含三线 cost differentiation 对照
- [ ] 不要求 full lifetime comparative exhaust
- [ ] proof 能直接支撑 P67 的下一步

### US-009: Add Narrow Regression Coverage
**Description:** As a maintainer, I want narrow tests guarding the cost differentiation so later edits do not flatten the pain back into one merchant line.

**Acceptance Criteria:**
- [ ] 至少覆盖 marker、expression、comparison-level assertion 三类断言
- [ ] 复用既有 merchant trilogy harness
- [ ] 不重写全量 merchant tests
- [ ] 相关命令 Pass

### US-010: Produce P66 Closure Report
**Description:** As a maintainer, I want a closure report stating exactly how the three merchant routes now pay different prices for success.

**Acceptance Criteria:**
- [ ] 输出 `docs/test-reports/p66-success-cost-differentiation-closure-report.md`
- [ ] 汇总 audit、contracts、config、expression、proof、tests
- [ ] 明确与 P67 的边界
- [ ] 列出仍 defer 的更大 merchant / new-route 项

## 5. Functional Requirements

1. FR-1: P66 必须只处理成功代价差异，而不是泛化为 merchant 内容扩张。
2. FR-2: 三条 cost contract 必须分别承接 apprentice / tavern / peasant 的既有成功路径。
3. FR-3: P66 的差异必须是 runtime-visible，而不只是 PRD 文案。
4. FR-4: P66 必须复用现有 trilogy skeleton，不得引入新系统。
5. FR-5: P66 closure 必须说明 P67 为什么转向成功形状与回顾收束。

## 6. Success Criteria

- 三条路线的成功代价明显不同
- 玩家能回答“我为了这种成功付出了什么”
- 差异不破坏现有 merchant trilogy 骨架
- `P67` 具备更强的成功形状与回顾基础

## 7. Dependencies / Context

- P65 closure: `docs/test-reports/p65-merchant-trilogy-player-experience-closure-report.md`
- P63 closure: `docs/test-reports/p63-merchant-entry-differentiation-closure-report.md`
- P64 closure: `docs/test-reports/p64-merchant-pressure-payoff-differentiation-closure-report.md`

## 8. Risks And Rollback

### Risks

- **Generic pain risk:** 容易又写成同一类 merchant hardship 的不同措辞
- **Overweight risk:** 容易把成本差异写得过重，压掉成功形状本身
- **Scope drift:** 容易滑成大规模 merchant rework

### Rollback

- 若 audit 证明现有成本差异已足够强，则 P66 可缩为 very small polish
- 若唯一可行方案需要新系统，则应显式 defer 到更大阶段

## 9. Validation Direction

- 配置层：cost difference 必须能被 runtime 捕捉
- 表达层：玩家可见层必须能读出三条线"痛在哪里"
- 证明层：comparison proof 必须能展示成功代价不是同构换皮

---

## Appendix A: Success-Cost Contracts (P66-003 / P66-004 / P66-005)

### A.1 Apprentice Success-Cost Contract

**Route:** town_apprentice → apprentice_merchant_bridge_crossed → magnate chain

**Core metaphor:** Success through partnership means ceding control. The hand that once crafted now balances the books.

**Primary cost sources:**

1. **Partnership control risk**
   - You succeed not as a sole proprietor but as a partner
   - Decisions require consensus, not solo judgment
   - Partners' agendas may not always align with yours
   - The bigger the business, the more stakeholders to answer to

2. **Bookkeeping and accountability burden**
   - Craft skill alone doesn't run a business — ledgers do
   - Every deal requires accounts, invoices, and reconciliation
   - Supply-chain deadlines replace workshop deadlines
   - The books must balance even when craftsmanship doesn't

3. **Craft independence erosion**
   - You once made things with your hands; now you manage people who make things
   - The mastery that defined you becomes one asset among many
   - Success means you can't just go back to the bench — too many people depend on you
   - "从手艺人到管账人" is the quiet cost of partnership success

**Distinct from generic merchant debt:**
- NOT: "I owe money"
- IS: "I owe accountability, I share control, my craft is no longer mine alone"
- The pain is about *agency and identity*, not about cash flow

**Expression keywords:** 合伙, 账目, 分成, 控制权, 手艺人, 供货, 销路, 账期, 合伙人的信任

**Bridge anchor:** Apprentice → trade curiosity → trade network → join partnership → bridge crossed
- The partnership choice at midlife is the seed of the cost
- P66 extends that seed through the magnate payoff

---

### A.2 Tavern Success-Cost Contract

**Route:** tavern_hand → tavern_merchant_bridge_crossed → magnate chain

**Core metaphor:** Success through network means you owe everyone. The person who knows everyone is known by everyone — and everyone wants something.

**Primary cost sources:**

1. **Favor debt and relationship backlash**
   - Every connection is a favor owed or a favor to return
   - "人脉就是商路" cuts both ways — your network is your asset, but it's also your liability
   - People you helped now expect help in return
   - Saying "no" risks losing the relationship that got you here

2. **Information distortion**
   - As the network node, you hear everything — but can you trust any of it?
   - People tell you what they think you want to hear
   - Rumors and half-truths flow through your network like wine
   - You can't always tell if a "great opportunity" is real or just someone doing you a "favor"

3. **Social performance burden**
   - You must always be "on" — gracious, connected, available
   - The tavern taught you to read people; now you must perform for them
   - Your reputation precedes you, and one misstep can undo years of goodwill
   - Loneliness at the top: you know everyone but no one really knows you

**Distinct from generic merchant debt:**
- NOT: "I owe money"
- IS: "I owe favors, I'm pulled in every direction, my network both empowers and entraps me"
- The pain is about *relationship entropy and authenticity*, not about cash flow

**Expression keywords:** 人脉, 人情, 老主顾, 面子, 欠情, 引荐, 八方, 关系, 人情债

**Bridge anchor:** Tavern hand → guest network → ally network → embrace network → take referral → bridge crossed
- The referral choice at midlife is the seed of the cost
- P66 extends that seed through the magnate payoff

---

### A.3 Peasant Success-Cost Contract

**Route:** farm_peasant → peasant_merchant_bridge_crossed → magnate chain

**Core metaphor:** Success through labor and timing means you bet big — and you could have lost big. The body that once worked the land now wears the miles of the road.

**Primary cost sources:**

1. **Cargo and timing bet risk**
   - You don't just trade — you stake everything on timing and weather
   - A good harvest means low prices; a bad harvest means no cargo
   - You bet on seasons, on routes, on what people will want next year
   - Every win tastes sweeter because you know how close you came to losing it all

2. **Travel wear and tear**
   - You've walked more miles than you can count
   - Your body carries the weight of cargo, of roads, of sleeping in inns
   - The land gave you stability; the road gave you success — but at a physical price
   - "一步一步走出来的根基" is literal: every step took something from you

3. **Leaving the land behind**
   - You came from the fields, and a part of you still belongs there
   - Success means you'll never go back to the simple life of tilling and harvesting
   - The seasons still turn, but now you watch them from a warehouse, not a field
   - Your hands still have calluses — but now they're from loading cargo, not from planting rice

**Distinct from generic merchant debt:**
- NOT: "I owe money"
- IS: "I bet everything and won, my body bears the cost, I left the land and can't go back"
- The pain is about *physical wear and existential bet*, not about cash flow

**Expression keywords:** 粮路, 车马, 仓储, 运力, 泥腿子, 一步一步, 根基, 奔波, 田埂

**Bridge anchor:** Farm peasant → swap crew curiosity → outside offer → accept outside → bridge crossed
- The "accept outside" choice at midlife is the seed of the cost
- P66 extends that seed through the magnate payoff

---

### A.4 Contract Comparison Summary

| Dimension | Apprentice | Tavern | Peasant |
|-----------|------------|--------|---------|
| **Core metaphor** | Partnership = ceding control | Network = owing everyone | Labor = betting the body |
| **Primary pain** | Control / accountability | Relationship / authenticity | Physical wear / timing bet |
| **Bridge choice** | Join partnership | Take referral | Accept outside offer |
| **Cost type** | Agency loss | Social entropy | Body + risk |
| **Key flavor** | 合伙, 账目, 分成, 控制权 | 人情, 老主顾, 面子, 欠情 | 车马, 仓储, 一步一步, 赌时机 |
| **What's lost** | Craft independence | Authenticity / privacy | Landed stability + physical ease |
| **Generic debt?** | No — cost is about control | No — cost is about relationships | No — cost is about labor/risk |
