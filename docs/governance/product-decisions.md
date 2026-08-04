# Wuxia-Life 产品决策账本

> 用途：记录已经完成裁决、后续默认不再重新讨论的产品与工程语义。
> 适用对象：ChatGPT、Codex、人工维护者。
> 最后更新：2026-08-04
> 状态口径：仅记录当前会话中已经确认的事实；未完成事项不写成既定决策。

---

## 1. 使用规则

1. 本文只记录已经完成裁决的事实，不记录临时想法、候选方案和待办事项。
2. 当前任务、风险和下一步放在 `current-product-stage.md`，不得混入本文。
3. 历史代码、历史测试和历史文档只能说明过去状态，不能自动覆盖本文和更高层权威文档。
4. 新决策只有在产品语义被明确裁决后才写入。
5. 每条决策应尽量回答：正式语义是什么、哪些旧语义退出、明确不做什么、什么条件下允许重新讨论。

---

## 2. 权威层级

从高到低：

1. `docs/product/player-model.md`
2. `docs/governance/project-convergence.md`
3. `docs/governance/product-decisions.md`
4. `AGENTS.md`
5. `docs/README.md`
6. 当前有效 Contract / Schema
7. 当前代码与测试

历史 PRD、Phase、Pxx、report、proof、closure、实施计划和旧交接总结默认不具有当前产品规范效力。

---

## 3. 项目阶段原则

### PD-001：治理不能替代产品开发

Canonical Player Model 的主要治理阶段已经完成。项目当前应从玩家真实体验和产品价值出发，不再因为发现旧字段、历史报告、未接线内容或死配置而自动开启新治理阶段。

重新进入模型治理只允许发生在以下情况：

- 当前玩家体验被正式状态冲突直接破坏；
- 新功能无法在现有语义下正确实现；
- 正式 Contract、Schema 或持久化边界发生实际冲突；
- 存在两个同时生效的 canonical source。

### PD-002：采用最小正确 Slice

每次只实施一个有真实证据、边界明确、能够独立验收的产品 Slice。

不得为了未来可能需要而提前增加抽象层、通用框架、配置系统、扩展点、第二状态来源或未被当前需求要求的模型。

---

## 4. Canonical Player Model 已完成裁决

### PD-010：武学成长只保留 `martialPower`

以下旧武学字段已经退出正式模型与生产边界：

```text
externalSkill
internalSkill
qinggong
```

不得重新加入 PlayerState、Snapshot、Condition、Effect、UI、Headless 或 Challenge。普通叙事中的“内功”“外功”“轻功”等词语不属于旧字段残留。

### PD-011：numeric health 与 energy 已删除

正式健康语义为：

```text
healthStatus
statuses
```

不得重新引入 numeric `health` 或 numeric `energy`。

### PD-012：Habit 当前只保留三项

```ts
lifeStates: {
  trainingHabit: number;
  studyHabit: number;
  businessHabit: number;
}
```

`familyBond` 和 `socialMomentum` 已退出正式模型，不建设替代通用数值轴。

### PD-013：Route Lifecycle 与 `lifePath.focus` 已删除

以下运行态模型已经退出：

```text
routeStates
routeHistory
roadCommitments
RouteManager
route completion / failure / conflict
lifePath.focus
FocusType
```

测试报告、叙事标签和分析分类中出现 `route`，不代表允许重新建立 runtime Route State。

### PD-014：其他旧平行属性只登记，不自动治理

例如：

```text
comprehension
charisma
businessAcumen
influence
martialHeritage
scholarlyHeritage
merchantNetwork
wealth
affinity
Karma
```

只有直接阻塞当前最高优先级产品问题时，才允许进入限定分析。

---

## 5. Persistence 与终局

### PD-020：Snapshot 当前正式版本为 `3.13.0`

正式规则：

- 只接受 `3.13.0`；
- 更早版本整体拒绝；
- 未知未来版本拒绝；
- 不提供 migration、fallback、compatibility layer 或 silent cleanup；
- Browser 与 Headless 共用统一 canonical contract。

### PD-021：正常寿终使用现有 canonical 终局链

正式链路：

```text
ordinary_life
→ special/end_game
→ EndingSystem.determineEnding()
→ state.ending
→ player.alive = false
→ flags.gameEnded / ending_triggered
→ Headless terminal
→ Browser EndingScreen
```

不得在 Headless、Trace、Browser 或 App 中根据 `ordinary_life` event ID 特判终局。

### PD-022：正常寿终不改变 EndingSystem 的分类规则

当前正常寿终只是接入已有 ending 判定，不等于所有 ending 的解释力已经充分。

结局判定与结局解释应分开：

```text
EndingSystem：决定 ending 类型
Ending presentation：解释为什么得到该结局
```

---

### PD-023：同一 ending 类型可以具有基于正式最终状态的动态解释

`EndingSystem` 继续负责 ending 分类；玩家可见解释可以在终局产生时，根据正式结构化最终状态生成，并写入现有 `state.ending.description`。

当前 `quiet_family_life` 的正式规则：

- ending ID、title、判定顺序和阈值保持不变；
- wealth 与 balanced 可以共享 `quiet_family_life`；
- 最终 description 可以根据 canonical `lifeStates`、玩家属性和家庭状态产生不同解释；
- Local、Headless、API 和 Snapshot 消费同一份已经持久化的 description；
- 其他 ending 默认继续使用既有静态 description。

明确禁止：

- 从事件正文、event ID、Trace、persona、seed 或测试标签生成结局解释；
- 根据解释结果反向改变 ending ID；
- 借结局解释新增 identity、sect、title 或第二状态来源；
- 显示内部阈值、评分或调试信息。

重新讨论条件：

- 现有 ending Contract 无法承载正式终局展示；
- 多个 ending 都出现系统性的解释缺失；
- Browser 与 Local/API/Headless 无法继续共享同一正式 description。

---

## 6. 玩家可见反馈

### PD-030：主循环结果必须由玩家主动继续

已经完成并应持续保持：

- 长事件正文可完整阅读；
- 阶段总结、主动行动总结和扰动叙事可见；
- 不使用 1200ms 定时器自动越过正式结果阶段；
- 玩家点击“继续”后才推进；
- Local/API 不得重复 acknowledgment 或重复结算。

### PD-031：结果卡以 canonical before/after 状态为准

结果卡必须展示公开玩家状态的真实 delta。

不得：

- 根据事件当前固定数值写死测试；
- 在公开状态已变化时显示“未见明显数值变化”；
- 重新执行 effect 以计算展示；
- 使用隐藏 outcome 代替正式执行结果。

### PD-032：选择前信息不泄露精确隐藏 effects

出身、行动和事件选项可以提供方向、收益类型、投入和风险说明，但不直接暴露后台精确 effects 或内部判定阈值。


### PD-033：主动行动结果以实际结算事实为唯一来源

主动行动的玩家可见结果必须根据正式执行后的 before/after state 和 actual public delta 确定性生成。

正式规则：

- actual delta 是结果事实来源；
- 不重新执行 effects；
- 不用配置中的理论收益覆盖实际结算；
- 正、负、零和混合 delta 必须被准确表达；
- 正式收益递减必须玩家可见，但不得泄露内部阈值和公式；
- 相同正式输入必须生成相同结果；
- Local、API、Headless 和 Browser 使用同一结果语义；
- 结果说明可以解释当前成本、收益和递减；
- 结果说明不得宣称尚未发生的事件、阶段回响或结局。

明确禁止：

- 使用随机同义句降低重复率；
- 根据 seed 或当前时间轮换文案；
- 调用 LLM 动态生成正式结算说明；
- 从 hidden outcome 或未来 Trace 生成玩家反馈；
- 把即时结果包装成长期人生意义；
- 为展示结果新增持久化 action history。

重新讨论条件：

- 正式主动行动结算不再能提供 before/after state；
- Local/API/Headless 采用不同结算协议；
- 产品明确新增需要持久化的主动行动生命周期。

---

## 7. 身份与归属

### PD-040：身份与归属 inventory 已完成

只读核对确认：

- `state.identity`、`lifePath.primaryIdentity`、`player.sect`、`player.title` 与 `flags.current_sect` 同时存在；
- 它们分别表达通用身份、人生轨迹、门派字段、称号和事件机械信号；
- 人生摘要长期显示 `none`，是因为 consumer 只读取 `state.identity`；
- 当前不存在一个可以直接修 UI 的统一 canonical identity source。

本条是事实核对结论。后续正式产品语义由 PD-041 裁决。

### PD-041：取消通用 Life Identity，建立单一 Canonical Affiliation（已实施）

**正式语义**

不得使用一个通用 identity 容器概括门派、职业、称号、人生方向和结局。

正式分层：

```text
Affiliation       当前客观组织归属，单一 canonical state
Title             明确事件授予的社会称号
Occupation        当前不建立通用状态
Reputation        属性、经历和叙事评价，不建立通用身份状态
Narrative route   确定性派生，不持久化为 identity
Ending            独立终局分类
```

Canonical Affiliation：

```ts
player.affiliation: AffiliationId | null
```

当前稳定 ID：

```text
shaolin
wudang
beggars
border
shadow_sect
```

`player.sect` 与 `flags.current_sect` 必须迁移后删除，不允许双写、fallback 或 compatibility projection。

以下通用身份结构退出正式模型：

```text
state.identity
IdentityInfo
PlayerIdentity
IdentitySystem
lifePath.primaryIdentity
```

事件的 identity 门槛必须迁移为其真实属性、flags、经历、成就或 Affiliation 条件。不得新建另一套通用身份分类器。

`player.title` 保留，但只能由明确事件正式授予。Ending name、route label 和 UI heuristic 不得写入或冒充 Title。

**实施状态**

- `state.identity`、`IdentitySystem`、`lifePath.primaryIdentity` 已从正式 runtime 删除；
- `player.sect` 与 `flags.current_sect` 已删除，当前组织归属唯一由 `player.affiliation` 持有；
- 正式事件已使用 `affiliation_set` / `affiliation_clear`，身份门槛已迁移为显式事实条件；
- Snapshot 已切换为 `3.13.0`，Life Memory 已切换为 `3.0.0`，旧版本和旧字段拒绝；
- Local、API、Headless、Browser 的玩家展示已分别呈现所属、称号、经历、方向和结局。

**持久化边界**

该裁决属于破坏性 canonical migration：

- 完成实施时 Snapshot 版本从 `3.12.0` 升至 `3.13.0`；
- `3.12.x` 及更早版本整体拒绝；
- 不提供 migration、fallback、双写或 silent cleanup；
- Life Memory 删除通用 identity projection，schema 从 `2.0.0` 升至 `3.0.0`；
- Local、API、Headless 与 Browser 使用同一 Affiliation 与 Title 来源。

**明确不做**

- 不建立 occupations 数组或 primary occupation；
- 不建立 affiliation history；
- 不支持多个当前组织；
- 不从 event ID、结果文本、Trace、persona 或 route flag 猜测 Affiliation；
- 不把 `sect_faction` 或 `lifePath.faction` 自动同步为 Affiliation；
- 不激活 deferred identity event files；
- 不重建 Route Lifecycle；
- 不因删除 identity 自动重写 EndingSystem。

**重新讨论条件**

- 产品明确需要同时加入多个组织；
- 玩法需要追踪加入、离开和转换的完整历史；
- 某个职业玩法必须回答玩家当前是否正式任职；
- Title 获得与失去形成独立产品机制；
- 现有单一 Affiliation 无法表达正式组织归属。
---

## 8. 模拟与体验证据

### PD-050：`oracle_effect_score_v1` 不是现实玩家模型

该策略读取隐藏 effects、不统一属性量纲、确定性选最高分、同分时选择候选顺序第一项，并对多 outcome 存在合并偏差。

它适合：流程可达性、状态执行、阶段覆盖、回归保护和批量发现目标路径。

它不适合直接证明：真实玩家会如何选择、persona 真实分化、玩家是否理解选项或游戏是否好玩。

### PD-051：自动 Trace 与浏览器证据分工

```text
Headless Trace：
批量运行、状态变化、路径比较、阶段 payload、目标路径定位

Browser：
DOM、布局、按钮、自动推进、Console、Local storage、刷新读档、玩家可见解释
```

绿色自动化测试不能替代完整玩家体验证据。

---

## 9. AI 协作与授权

### PD-060：采用异构模型分工

```text
ChatGPT / 深推理模型：
产品分析、语义裁决、范围控制、阶段目标、结果复核

Codex / 执行模型：
真实仓库核对、实现、测试、浏览器验证、结构化汇报
```

该分工同时服务于降低连续语义漂移风险、利用聊天与 Codex 的独立 token 额度、把高成本推理集中在高杠杆决策，以及把机械工程执行交给成本更低的模型。

### PD-061：采用阶段目标驱动，而非无限自主开发

Codex 可以在当前阶段目标和边界内自主闭环普通工程问题。

只有出现结构性 blocker 时才停止，例如：

- 必须修改 PlayerState、Snapshot、Schema 或正式 Contract；
- 必须新增正式状态来源；
- 存在两个冲突的 canonical source；
- 必须改变明确禁止修改的产品规则；
- 真实代码证明阶段前提错误；
- 根因属于另一个独立产品系统；
- 当前边界内无法满足验收标准。

Codex 达成当前阶段目标后必须停止，不得顺带进入相邻系统。

---

## 10. 更新模板

```markdown
### PD-XXX：决策标题

**正式语义**

...

**明确不做**

...

**重新讨论条件**

...
```
