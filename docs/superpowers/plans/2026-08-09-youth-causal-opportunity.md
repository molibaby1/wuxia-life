# 青年重大机会因果化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 14～20 岁的门派、爱情、幽影门和武林大会从按年龄发放的必然剧情，收敛为由既有正式事实开启、可永久错过、选择会改变后续资格的重大机会。

**Architecture:** 保持现有 `GameState`、Condition/Effect Contract 和 Local/API/Headless/Browser 共享执行链不变，只重写正式事件资产的年龄窗口、资格表达式与后果拓扑。调度器仅把 12 项上限下沉到 regular formal 层；critical 与已满足条件的 storyline 候选完整保留。重复入口及其直接消费者硬删除或改读唯一正式入口，不新增兼容、迁移、fallback 或第二状态来源。

**Tech Stack:** TypeScript、Vue 3、JSON 事件资产、`tsx` 独立回归测试、现有 `ConditionEvaluator` / `EventExecutor` / `GameEngineIntegration`、Headless Snapshot 3.14.0、Vite。

## Global Constraints

- 产品语义以 `docs/superpowers/specs/2026-08-09-youth-causal-opportunity-design.md` 为本 Slice 的已批准规格。
- 年龄只决定机会窗口；四条目标线都允许永久不发生，窗口结束后不补发。
- 不新增或修改 PlayerState、GameState、Snapshot、正式 Contract、Condition Schema、Effect Schema 或存档版本；Snapshot 必须保持 `3.14.0`。
- 不新增 Route State、Identity、隐藏累计分数、通用 NPC 好感度或第二个 canonical source。
- 不扩充事件池，不重写全部正式事件 priority，不统一 `triggers.random`，不修改 DailyEvent、Milestone、Ending 或 UI。
- 不为删除的 `meet_love_interest`、`sect_path_choice`、`identity-outlaw.json` 保留兼容、迁移、别名或 fallback。
- 条件解析失败继续 fail closed；测试使用 before/after 正式状态和事件资格，不使用正文关键词、Trace、persona 或 Milestone 代替事实。
- 只处理目标事件、调度上限以及被删除资产的直接生产消费者；历史未加载的 `src/data/youthEvents.ts`、`src/data/youthEvents.json`、`src/data/adultEvents.ts` 不恢复也不纳入正式入口。
- 开始业务代码前，先确认本计划已经获得单独实施批准，并在 `docs/governance/current-product-stage.md` 登记本 Slice；未获批准时停在文档阶段。
- 当前工作树中的既有改动归用户所有；每个 checkpoint 使用精确路径检查，不运行 `git add .`，不 reset、clean、批量格式化或覆盖无关文件。
- 本计划默认不提交。每个任务的 Git 命令仅在用户另行明确授权 commit 后执行。

---

## File map

### New test owner

- `tests/youthCausalOpportunity.test.ts`：本 Slice 唯一聚焦反事实测试，覆盖候选池、四条机会线、冲突、可错过人生和 Snapshot 不变性。

### Runtime and formal data owners

- `src/core/GameEngineIntegration.ts`：regular-only 12 项 cap；删除峨眉 critical-choice 映射。
- `src/data/lines/general.json`：唯一门派入口与武林大会三事件；删除重复爱情入口。
- `src/data/lines/love.json`：唯一爱情入口、后续分支拓扑及爱情×幽影门冲突。
- `src/data/lines/sect-marginal.json`：幽影门初步接触。
- `src/data/lines/identity-demon.json`：幽影门正式邀请。
- `src/data/lines/training.json`：真实练功产生的普通成长反馈。
- `src/data/lines/sect-wudang.json`：删除重复门派入口。
- `src/data/lines/identity-outlaw.json`：删除整个重复幽影门链。
- `src/data/events.json`、`src/core/EventLoader.ts`：移除已删除事件文件接线。

### Direct consumer and validation owners

- `scripts/validateEventQuality.ts`、`scripts/inventoryEventAssets.ts`、`src/data/event-asset-manifest.json`：移除已删除文件的显式登记并刷新正式资产清单。
- `src/data/golden-line-spine.json`、`src/data/golden-line-payoff-map.json`、`scripts/goldenLinePayoffGate.ts`：只清除 `sect_path_choice` 与旧伪因果断言，不重建 Golden Line metric。
- `src/data/lifeMemoryLabels.ts`、`tests/testLifeMemorySummary.ts`：Life Memory 改读唯一 `sect_choice` 及其真实 choice IDs。
- `src/p25/p35MixedPinnacleLifetimeSlices.ts`：历史合成 slice 改用正式 `sect_choice`，不再读取已删除资产。
- `tests/canonicalCriticalChoiceNormalization.test.ts`：从正式 EventLoader 读取 `sect_choice` 并验证峨眉已退出。
- `tests/canonicalMartialLegacyProducerPruning.test.ts`：刷新正式文件/事件数量并删除对旧幽影门链的存在性断言。
- `tests/headless/playerVisibleFeedback.test.ts`、`tests/headless/p72SessionPhase.test.ts`：移除“14 岁必有门派”“爱情是 CRITICAL”的旧产品假设。
- `tests/IntegrationTests.ts`、`tests/AllTests.ts`：只替换被删除入口的直接 fixture/断言。
- `tests/runRealTestGate.ts`：把聚焦反事实测试纳入默认真实测试门禁。
- `docs/governance/current-product-stage.md`：实施开始时登记授权 Slice，全部验收完成后记录关闭证据。

---

### Task 1: Activate the slice and lock the RED contract

**Files:**

- Modify: `docs/governance/current-product-stage.md`
- Create: `tests/youthCausalOpportunity.test.ts`

**Interfaces:**

- Consumes: `GameEngineIntegration.getAvailableEvents(age: number): EventDefinition[]`、`GameEngineIntegration.executeChoiceEffects(effects, eventId?, choiceId?)`、`EventLoader.getEventById(id)`、`resolveChoiceEffects(state, event, choice)`。
- Produces: `createYouthEngine(age, overrides)`、`recordFact(state, eventId)`、`availableIds(engine, age)`、`executeChoice(engine, eventId, choiceId)` 四个测试内 helper；不导出生产接口。

- [ ] **Step 1: Record the authorized current slice after implementation approval**

将 `current-product-stage.md` 的当前状态改为“青年重大机会因果化 Authorized Slice”，并逐字列出本计划 Global Constraints 中的状态/Contract 禁止项、四条线、Browser 双路径和结构性 blocker。保留已关闭阶段为历史段落，不把本 Slice 写成已完成。

- [ ] **Step 2: Create the test harness with explicit formal-state helpers**

```ts
import assert from 'node:assert/strict';
import { GAME_STATE_SNAPSHOT_SCHEMA_VERSION } from '../src/contracts/gameStateSnapshot';
import { resolveChoiceEffects } from '../src/core/ChoiceOutcomeResolver';
import { eventLoader } from '../src/core/EventLoader';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { defaultSnapshotConverter } from '../src/headless/snapshot/SnapshotConverter';
import type { EventChoice, GameState, PlayerState } from '../src/types/eventTypes';

function createYouthEngine(age: number, player: Partial<PlayerState> = {}): GameEngineIntegration {
  const engine = new GameEngineIntegration();
  const state = engine.getGameState();
  state.player.age = age;
  state.player.affiliation = null;
  state.player.martialPower = 0;
  state.player.reputation = 0;
  state.player.connections = 0;
  state.player.chivalry = 0;
  state.player.lifeStates = { trainingHabit: 0, studyHabit: 0, businessHabit: 0 };
  Object.assign(state.player, player);
  state.flags = {};
  state.player.flags = state.flags;
  state.eventHistory = [];
  state.player.events = [];
  state.relations = {};
  state.player.relationships = [];
  return engine;
}

function recordFact(state: GameState, eventId: string): void {
  state.eventHistory ??= [];
  state.eventHistory.push({ eventId, age: state.player.age });
}

function availableIds(engine: GameEngineIntegration, age: number): Set<string> {
  engine.getGameState().player.age = age;
  return new Set(engine.getAvailableEvents(age).map(event => event.id));
}

async function executeChoice(
  engine: GameEngineIntegration,
  eventId: string,
  choiceId: string,
): Promise<void> {
  const event = eventLoader.getEventById(eventId);
  assert(event, `missing event: ${eventId}`);
  const choice = event.choices?.find(candidate => candidate.id === choiceId);
  assert(choice, `missing choice: ${eventId}/${choiceId}`);
  const resolved = resolveChoiceEffects(engine.getGameState(), event, choice as EventChoice);
  assert(resolved, `unresolved choice: ${eventId}/${choiceId}`);
  await engine.executeChoiceEffects(resolved.effects, eventId, choiceId);
}
```

- [ ] **Step 3: Add all ten RED acceptance groups before changing production data**

测试必须各自构造独立 engine，并包含以下直接断言：

```ts
// candidate pool
assert(ids.has('critical_probe'));
assert(ids.has('storyline_probe'));
assert.equal([...ids].filter(id => id.startsWith('regular_probe_')).length, 12);

// sect counterfactual
assert(!availableIds(noPractice, 15).has('sect_choice'));
trained.getGameState().player.lifeStates.trainingHabit = 1;
assert(availableIds(trained, 15).has('sect_choice'));

// romance counterfactual and pass
assert(!availableIds(isolated, 17).has('love_first_meet'));
recordFact(exposed.getGameState(), 'jianghu_experience');
assert(availableIds(exposed, 17).has('love_first_meet'));
await executeChoice(exposed, 'love_first_meet', 'love_pass');
assert.equal(exposed.getGameState().flags.love_started, undefined);

// shadow-sect invitation
assert(!availableIds(beforeContact, 16).has('outlaw_identity_beginning'));
recordFact(afterContact.getGameState(), 'demonic_encounter_accept');
assert(availableIds(afterContact, 16).has('outlaw_identity_beginning'));

// tournament public proof
assert(!availableIds(privateSkill, 20).has('martial_arts_invitation'));
publicSkill.getGameState().player.reputation = 10;
assert(availableIds(publicSkill, 20).has('martial_arts_invitation'));

// conflict loss
assert.equal(leftSect.getGameState().player.affiliation, null);
assert.equal(stayed.getGameState().player.affiliation, 'shadow_sect');
assert(stayed.getGameState().player.statuses.includes('anxious'));
assert((stayed.getGameState().relations.lover_mingyue ?? 0) < relationBefore);
```

另外断言：`stay_home` 不产生任何 `route_orthodox` / `route_wanderer` / `route_demonic`；爱情错过后 `love_after_greet`、`love_shared_mission`、`love_family_obstacle` 均不可用；幽影门明确拒绝后 Affiliation 仍为 `null`；大会接受/观战/拒绝得到三个不同后续集合；四条线均未发生的状态在 21 岁仍能得到 regular formal 或 daily；`Object.keys(state)` 和 `Object.keys(state.player)` 与干净初始状态一致；Snapshot schemaVersion 等于 `GAME_STATE_SNAPSHOT_SCHEMA_VERSION === '3.14.0'`。

- [ ] **Step 4: Run the focused test and capture the expected RED reasons**

Run: `npm exec -- tsx tests/youthCausalOpportunity.test.ts`

Expected: exit 1，至少命中以下旧行为中的一个：storyline probe 被前 12 项截断；`sect_choice` 在无实践时仍可用；无社会暴露仍可遇见 `love_first_meet`；`outlaw_identity_beginning` 未经接触即可出现；纯私下功力也收到大会邀请；爱情×幽影门冲突没有清除 Affiliation 或添加 `anxious`。

- [ ] **Step 5: Check the task diff without committing**

Run: `git diff --check -- docs/governance/current-product-stage.md tests/youthCausalOpportunity.test.ts`

Expected: exit 0。仅当用户另行明确授权提交时，才运行：

```bash
git add docs/governance/current-product-stage.md tests/youthCausalOpportunity.test.ts
git commit -m "test: define causal youth opportunities"
```

### Task 2: Move the candidate cap to the regular layer

**Files:**

- Modify: `src/core/GameEngineIntegration.ts`
- Test: `tests/youthCausalOpportunity.test.ts`

**Interfaces:**

- Consumes: existing private `splitEventLayers(events)` and `FORMAL_CANDIDATE_POOL_CAP = 12`.
- Produces: `getAvailableEvents()` returns every eligible critical event, every eligible storyline event, and at most 12 sorted regular formal events.

- [ ] **Step 1: Make the scheduler RED isolate deterministic**

在 candidate-pool case 中临时替换 `eventLoader.getEventsByAge`，返回 13 个 `priority: 3` regular、一个 `priority: 1` 且 `storyLine: 'probe'` 的 storyline、一个 `priority: 0` critical；所有 probe 使用相同 ageRange、空 conditions、合法 content/eventType/metadata。`finally` 中恢复原方法。

- [ ] **Step 2: Replace global slicing with layer-aware slicing**

将：

```ts
let limitedEvents = availableEvents.slice(0, FORMAL_CANDIDATE_POOL_CAP);
limitedEvents = this.injectMandatoryCandidates(availableEvents, limitedEvents);
return limitedEvents;
```

替换为：

```ts
const { criticalEvents, storylineEvents, regularFormalEvents } = this.splitEventLayers(availableEvents);
return [
  ...criticalEvents,
  ...storylineEvents,
  ...regularFormalEvents.slice(0, FORMAL_CANDIDATE_POOL_CAP),
];
```

删除只为旧截断顺序服务的 `isSchedulingValidationEvent()` 与 `injectMandatoryCandidates()`；保留 `isMandatoryEvent()`、`getExactAgeMandatoryEvents()` 和后续 critical → storyline → regular → daily 选择顺序不变。

- [ ] **Step 3: Run RED-to-GREEN scheduler verification**

Run: `npm exec -- tsx tests/youthCausalOpportunity.test.ts`

Expected: candidate-pool case PASS；其余事件资产 case 仍 FAIL。

- [ ] **Step 4: Run the existing scheduling gate**

Run: `npm run gate:p11-scheduling`

Expected: exit 0。若失败只允许修复本次 cap 顺序造成的回归；不得把目标青年事件恢复为 mandatory，也不得修改全局 priority 约定。

- [ ] **Step 5: Check the scoped diff**

Run: `git diff --check -- src/core/GameEngineIntegration.ts tests/youthCausalOpportunity.test.ts`

Expected: exit 0。仅在获得提交授权时精确提交这两个文件。

### Task 3: Converge the sect opportunity and martial-practice feedback

**Files:**

- Modify: `src/data/lines/general.json`
- Modify: `src/data/lines/sect-wudang.json`
- Modify: `src/data/lines/training.json`
- Modify: `src/core/GameEngineIntegration.ts`
- Modify: `tests/canonicalCriticalChoiceNormalization.test.ts`
- Modify: `tests/headless/playerVisibleFeedback.test.ts`
- Test: `tests/youthCausalOpportunity.test.ts`

**Interfaces:**

- Produces formal entry `sect_choice` with choices `join_shaolin | join_wudang | stay_home` and `storyLine: "sect_opportunity"`.
- Removes formal ID `sect_path_choice` and choice ID `join_emei`.
- Produces regular feedback `martial_improvement` gated by `lifeStates.trainingHabit`.

- [ ] **Step 1: Strengthen the sect RED assertions**

```ts
const sectChoice = eventLoader.getEventById('sect_choice');
assert.deepEqual(sectChoice?.choices?.map(choice => choice.id), [
  'join_shaolin',
  'join_wudang',
  'stay_home',
]);
assert.equal(eventLoader.getEventById('sect_path_choice'), undefined);
assert.equal(sectChoice?.priority, 1);
assert.equal(sectChoice?.storyLine, 'sect_opportunity');
```

执行 `stay_home` 后比较 before/after，Affiliation 必须保持 `null`，且三个 route flag 均不存在；训练 Habit 为 1 的玩家即使 `martialPower` 为 0，也必须能看到两个申请选项。

- [ ] **Step 2: Rewrite `sect_choice` as an optional causal opportunity**

使用以下窗口与唯一资格表达式：

```json
"priority": 1,
"ageRange": { "min": 14, "max": 18 },
"storyLine": "sect_opportunity",
"conditions": [{
  "type": "expression",
  "expression": "!player.affiliation && !events.has(\"sect_choice\") && (lifeStates.trainingHabit >= 1 || player.martialPower >= 15 || events.has(\"training_focus\") || events.has(\"preteen_training\"))"
}]
```

删除 `requirements.notFlag`、`join_emei` 以及少林/武当 choice-level `martialPower >= 15` 门槛；保留各自 outcome 判定、`affiliation_set` 与现有即时数值。正文只描述家族/师长提供申请机会，不宣称三派同时招募。

- [ ] **Step 3: Remove the duplicate sect asset and stale critical-choice IDs**

从 `sect-wudang.json` 删除整个 `sect_path_choice` 对象。在 `SECT_CHOICE_VALUE_BY_CHOICE_ID` 和 `executeChoiceEffects()` 内部 choice map 中删除 `join_emei`；保留：

```ts
const SECT_CHOICE_VALUE_BY_CHOICE_ID = {
  join_shaolin: 'orthodox',
  join_wudang: 'orthodox',
  stay_home: 'none',
} satisfies Record<string, NonNullable<CriticalChoices['sect_choice']>>;
```

- [ ] **Step 4: Rewrite `martial_improvement` without romance pseudo-causality**

```json
"category": "side_quest",
"priority": 2,
"ageRange": { "min": 16, "max": 20 },
"conditions": [{
  "type": "expression",
  "expression": "lifeStates.trainingHabit >= 1 && !events.has(\"martial_improvement\")"
}],
"content": {
  "title": "武艺精进",
  "text": "持续的练功开始显出成效。你对招式、呼吸与发力的理解比从前扎实了许多。",
  "description": "长期练功带来的阶段性反馈。"
}
```

保留现有一次性 `martialPower` 和 event record 效果；删除主线标签，不设置 `storyLine`，不读取任何爱情 flag。

- [ ] **Step 5: Update current Contract/headless tests, not historical behavior**

`canonicalCriticalChoiceNormalization.test.ts` 改由 `EventLoader.getInstance().getEventById('sect_choice')` 读取正式资产，新增 `join_emei` 不存在断言，继续验证 `stay_home → none`、`join_shaolin → orthodox` 与 Snapshot round-trip。

`playerVisibleFeedback.test.ts` 的 age-14 snapshot 增加 `trainingHabit: 1`，删除“低功力仍必然得到门派事件”的 case；可选 IDs 只允许少林、武当、留家。结果卡 before/after 断言保持不变。

- [ ] **Step 6: Run focused and directly affected tests**

Run:

```bash
npm exec -- tsx tests/youthCausalOpportunity.test.ts
npm exec -- tsx tests/canonicalCriticalChoiceNormalization.test.ts
npm run test:headless
```

Expected: sect、stay-home、martial-improvement cases PASS；命令 exit 0，或只剩尚未实施的爱情/幽影门/大会 RED。

- [ ] **Step 7: Check the scoped diff**

Run: `git diff --check -- src/data/lines/general.json src/data/lines/sect-wudang.json src/data/lines/training.json src/core/GameEngineIntegration.ts tests/canonicalCriticalChoiceNormalization.test.ts tests/headless/playerVisibleFeedback.test.ts tests/youthCausalOpportunity.test.ts`

Expected: exit 0。只有另行授权时才按上述精确路径提交。

### Task 4: Make romance social, missable, and branch-dependent

**Files:**

- Modify: `src/data/lines/general.json`
- Modify: `src/data/lines/love.json`
- Modify: `tests/headless/p72SessionPhase.test.ts`
- Test: `tests/youthCausalOpportunity.test.ts`

**Interfaces:**

- Keeps `love_first_meet` as the only entry.
- Uses event records `love_family_obstacle_prove | love_family_obstacle_avoid` and `love_rival_duel | love_rival_withdraw | love_rival_mediation` as branch facts.
- Removes formal ID `meet_love_interest` and shared unlock flags `love_conflict` / `love_rival` from this chain.

- [ ] **Step 1: Add exact romance topology RED assertions**

```ts
assert.equal(eventLoader.getEventById('meet_love_interest'), undefined);
assert(!availableIds(noExposure, 18).has('love_first_meet'));
recordFact(withExposure.getGameState(), 'jianghu_experience');
assert(availableIds(withExposure, 18).has('love_first_meet'));
```

分别执行 `love_prove` 与 `love_avoid`：前者不能出现 `love_rival_appears`，后者可以；分别执行 `love_duel`、`love_withdraw`、`love_clumsy_mediation`：只有 withdraw 可以出现 `love_separation`。

- [ ] **Step 2: Remove the duplicate entry and rewrite the unique entry gate**

从 `general.json` 删除 `meet_love_interest`。将 `love_first_meet` 改为：

```json
"priority": 1,
"ageRange": { "min": 15, "max": 20 },
"storyLine": "love_story",
"conditions": [{
  "type": "expression",
  "expression": "!events.has(\"love_first_meet\") && !flags.has(\"love_started\") && !flags.has(\"love_mature_started\") && !flags.has(\"love_elderly_started\") && !flags.has(\"hasLoveInterest\") && (player.connections >= 5 || events.has(\"jianghu_experience\") || player.affiliation)"
}]
```

保留 `triggers.random` 原样但不把它当资格。`love_greet` 所有 outcome 继续写 `love_started`；`love_charm` 的 `great_success`/`success` 写入，`failure` 删除 `love_started`；`love_pass` 只推进现有短时间并记录 `love_first_meet_pass`。

- [ ] **Step 3: Rewrite the downstream gates around specific facts**

```json
"love_after_greet": "flags.has(\"love_started\") && !events.has(\"love_after_greet\")",
"love_shared_mission": "flags.has(\"love_started\") && !events.has(\"love_shared_mission\") && (events.has(\"jianghu_experience\") || player.affiliation)",
"love_family_obstacle": "events.has(\"love_shared_mission\") && !events.has(\"love_family_obstacle\")",
"love_rival_appears": "events.has(\"love_family_obstacle_avoid\") && !events.has(\"love_rival_appears\")",
"love_separation": "events.has(\"love_rival_withdraw\") && !events.has(\"love_separation\")"
```

为上述直接后续统一保留 `storyLine: "love_story"` 和 `priority: 1`。`love_prove` / `love_avoid` 删除共同 `love_conflict`；三个 rival choices 删除共同 `love_rival`，只保留各自 event record 与即时损益。

- [ ] **Step 4: Remove the Headless CRITICAL assumption**

`p72SessionPhase.test.ts` 不再用默认 charisma 推断 `love_first_meet`。在 story-event case 显式构造 `connections: 5`；在 active-action case 构造 `connections: 0`、`affiliation: null`、空 social event history，并把注释改为“无社会暴露时爱情机会不可用”。

- [ ] **Step 5: Run focused and Headless tests**

Run:

```bash
npm exec -- tsx tests/youthCausalOpportunity.test.ts
npm run test:headless
```

Expected: romance entry/pass/family/rival/separation cases PASS；Headless exit 0。

- [ ] **Step 6: Check the scoped diff**

Run: `git diff --check -- src/data/lines/general.json src/data/lines/love.json tests/headless/p72SessionPhase.test.ts tests/youthCausalOpportunity.test.ts`

Expected: exit 0。仅在另行授权时提交这些精确路径。

### Task 5: Converge the two shadow-sect chains and implement the real conflict

**Files:**

- Modify: `src/data/lines/sect-marginal.json`
- Modify: `src/data/lines/identity-demon.json`
- Modify: `src/data/lines/love.json`
- Delete: `src/data/lines/identity-outlaw.json`
- Test: `tests/youthCausalOpportunity.test.ts`

**Interfaces:**

- Produces chain `demonic_encounter → demonic_encounter_accept → outlaw_identity_beginning`.
- `outlaw_identity_beginning` choices become `join_outlaw_full | join_outlaw_conditional | decline_outlaw`.
- `love_demonic_conflict` consumes `player.affiliation == "shadow_sect"`; leaving calls existing `affiliation_clear`, staying calls existing `relation_change` and `status_add anxious`.

- [ ] **Step 1: Add exact chain and conflict RED assertions**

验证 `demonic_encounter` 在只有低侠义时仍不可用，加入 `setback_injury` 或 `jianghu_experience` 后才可用；accept 后 Affiliation 仍为 `null`，正式邀请才可用；decline 后正式邀请永久不可用。再验证 `identity-outlaw.json` 的五个 IDs 均从 EventLoader 消失。

- [ ] **Step 2: Rewrite the preliminary contact**

```json
"priority": 1,
"ageRange": { "min": 14, "max": 18 },
"storyLine": "shadow_sect",
"conditions": [{
  "type": "expression",
  "expression": "!player.affiliation && player.chivalry <= 20 && !events.has(\"demonic_encounter\") && (events.has(\"setback_injury\") || events.has(\"jianghu_experience\"))"
}]
```

给 metadata 增加 `once`。`accept_demonic` 删除 `route_demonic` 与 `affiliation_set`，保留有限传授、具体师徒关系和 `demonic_encounter_accept`；`decline_demonic` 保留 `demonic_encounter_decline`。

- [ ] **Step 3: Rewrite the formal invitation**

```json
"priority": 1,
"ageRange": { "min": 15, "max": 20 },
"storyLine": "shadow_sect",
"conditions": [{
  "type": "expression",
  "expression": "events.has(\"demonic_encounter_accept\") && !player.affiliation && !events.has(\"outlaw_identity_beginning\")"
}]
```

正文不预设玩家厌倦正派。两个加入 choice 的实际成功 outcomes 保留 `affiliation_set: shadow_sect`，删除 `route_demonic`、`sect_faction`、`route_orthodox` 和 `outlaw_identity_done` 写入。新增明确拒绝：

```json
{
  "id": "decline_outlaw",
  "text": "明确拒绝",
  "description": "拒绝加入幽影门，结束这次邀请。",
  "effects": [{
    "type": "event_record",
    "target": "outlaw_identity_declined"
  }]
}
```

- [ ] **Step 4: Implement the cross-line irreversible conflict**

将 gate 改为：

```json
"priority": 1,
"storyLine": "love_story",
"conditions": [{
  "type": "expression",
  "expression": "flags.has(\"love_started\") && player.affiliation == \"shadow_sect\" && !events.has(\"love_demonic_conflict\")"
}]
```

离开分支效果必须包含：

```json
{ "type": "affiliation_clear" },
{ "type": "event_record", "target": "love_demonic_conflict_left_shadow_sect" }
```

留下分支不写 Affiliation，必须包含：

```json
{
  "type": "relation_change",
  "target": "lover",
  "operator": "add",
  "value": { "id": "lover_mingyue", "name": "明月", "role": "lover", "delta": -8 }
},
{ "type": "status_add", "status": "anxious" },
{ "type": "event_record", "target": "love_demonic_conflict_stayed_shadow_sect" }
```

- [ ] **Step 5: Delete the duplicate file**

删除 `src/data/lines/identity-outlaw.json`，本任务不创建替代文件、不搬运其训练/导师/合法性争论事件。

- [ ] **Step 6: Run the focused test**

Run: `npm exec -- tsx tests/youthCausalOpportunity.test.ts`

Expected: shadow contact/invitation/refusal/conflict before-after cases PASS；剩余失败只允许是尚未实施的武林大会或 loader 直接接线。

- [ ] **Step 7: Check the scoped diff**

Run: `git diff --check -- src/data/lines/sect-marginal.json src/data/lines/identity-demon.json src/data/lines/love.json src/data/lines/identity-outlaw.json tests/youthCausalOpportunity.test.ts`

Expected: exit 0。仅在另行授权时提交这些路径。

### Task 6: Make the martial-arts meeting depend on public proof

**Files:**

- Modify: `src/data/lines/general.json`
- Test: `tests/youthCausalOpportunity.test.ts`

**Interfaces:**

- Keeps `martial_arts_invitation → martial_arts_beginner | martial_arts_observer`.
- Continues using existing choice facts `willAttendMartialArtsMeeting` and `willObserveMartialArtsMeeting`; refusal writes neither.

- [ ] **Step 1: Add the full public-proof and three-choice RED matrix**

创建四个功力均为 15 的状态：无公开证明、Affiliation、reputation 10、connections 10。前者不得见邀请，后三者都可见。再分别执行 `accept_invitation`、`observe_only`、`decline_invitation`，在 19～23 岁检查 beginner-only、observer-only、neither。

- [ ] **Step 2: Rewrite invitation eligibility and remove the 60-power choice gate**

```json
"priority": 1,
"ageRange": { "min": 18, "max": 22 },
"storyLine": "martial_arts_meeting",
"conditions": [{
  "type": "expression",
  "expression": "player.martialPower >= 15 && (player.affiliation || player.reputation >= 10 || player.connections >= 10) && !events.has(\"martial_arts_invitation\")"
}]
```

删除 `accept_invitation` 的 `player.martialPower >= 60` choice condition。保留三个现有 choice facts 与即时 effects。

- [ ] **Step 3: Widen and protect the two explicit follow-ups**

两个后续均设置 `priority: 1`、`storyLine: "martial_arts_meeting"`、年龄 `19～23`，并使用：

```json
"martial_arts_beginner": "flags.has(\"willAttendMartialArtsMeeting\") && !events.has(\"martial_arts_beginner\")",
"martial_arts_observer": "flags.has(\"willObserveMartialArtsMeeting\") && !events.has(\"martial_arts_observer\")"
```

- [ ] **Step 4: Run the now-complete focused suite**

Run: `npm exec -- tsx tests/youthCausalOpportunity.test.ts`

Expected: exit 0，打印 `youthCausalOpportunity.test.ts: ok`。

- [ ] **Step 5: Check the scoped diff**

Run: `git diff --check -- src/data/lines/general.json tests/youthCausalOpportunity.test.ts`

Expected: exit 0。仅在另行授权时提交这两个路径。

### Task 7: Remove deleted assets from loaders, inventories, and direct consumers

**Files:**

- Modify: `src/data/events.json`
- Modify: `src/core/EventLoader.ts`
- Modify: `scripts/validateEventQuality.ts`
- Modify: `scripts/inventoryEventAssets.ts`
- Modify: `src/data/event-asset-manifest.json`
- Modify: `src/data/golden-line-spine.json`
- Modify: `src/data/golden-line-payoff-map.json`
- Modify: `scripts/goldenLinePayoffGate.ts`
- Modify: `src/data/lifeMemoryLabels.ts`
- Modify: `src/p25/p35MixedPinnacleLifetimeSlices.ts`
- Modify: `tests/testLifeMemorySummary.ts`
- Modify: `tests/AllTests.ts`
- Modify: `tests/IntegrationTests.ts`
- Modify: `tests/canonicalMartialLegacyProducerPruning.test.ts`
- Modify: `tests/runRealTestGate.ts`

**Interfaces:**

- Produces formal loader inventory of 28 files and 418 events.
- Makes `sect_choice` the only current player-facing sect key-choice ID.
- Does not change P8 classifier synthetic fixtures such as `p38FrustrationRemediationTests.ts`; those records do not load or authorize deleted production assets.

- [ ] **Step 1: Add inventory and no-dead-reference assertions**

在聚焦测试增加：

```ts
const allIds = new Set(eventLoader.getAllEvents().map(event => event.id));
for (const removed of [
  'meet_love_interest',
  'sect_path_choice',
  'outlaw_path_beginning',
  'outlaw_training',
  'outlaw_mentor',
  'outlaw_mercy_choice',
  'outlaw_legitimacy_debate',
]) {
  assert(!allIds.has(removed), `${removed} must leave the formal loader`);
}
assert.equal(allIds.size, 418);
```

- [ ] **Step 2: Remove the deleted file from all formal loading/validation maps**

从 `events.json` 删除 `./lines/identity-outlaw.json`；从 `EventLoader.ts` 删除 import、typed array、lineMap entry 和“已合并”旧注释；从 `validateEventQuality.ts` 删除 import 和 source map entry；从 `inventoryEventAssets.ts` 的 `DEFERRED_LOADED_FILES` 删除文件名。

- [ ] **Step 3: Update the canonical inventory regression**

```ts
assert(eventsIndexJson.imports.length === 28, `formal EventLoader file count must be 28, got ${eventsIndexJson.imports.length}`);
assert(events.length === 418, `formal EventLoader event count must be 418, got ${events.length}`);
```

删除 `testExistingCanonicalWrites()` 中四个 `identity-outlaw` 事件断言及其调用；保留所有 canonical martial field absence/retention 断言。

- [ ] **Step 4: Replace the current sect key-choice consumer, not the old route model**

`lifeMemoryLabels.ts` 使用：

```ts
sect_choice: '门派机会',
```

并定义 choices：

```ts
sect_choice: {
  join_shaolin: '申请拜入少林',
  join_wudang: '申请拜入武当',
  stay_home: '留在家中继续生活',
},
```

`testLifeMemorySummary.ts` 的三个历史 fixture 改为 `sect_choice` 与真实 choice IDs，不添加旧 ID fallback。`AllTests.ts` 的 death-risk fixture 同样改为 `sect_choice`，确保 Golden spine key-choice 采集仍验证当前 ID。

- [ ] **Step 5: Retire only the stale Golden Line assertions**

在 `golden-line-spine.json` 中把 `sect_path_choice` 替换为 `sect_choice`，从 13 岁 anchor 移到 14 岁窗口 anchor；在 `golden-line-payoff-map.json` 删除整段 `sect_path_choice` payoff，并把两处 `martial_improvement` ageRange 改为 `[16, 20]`、readMechanism 改为 `lifeStates.trainingHabit >= 1`。将 `demonic_encounter` durable write 改为 `demonic_encounter_accept`，删除宣称它立即写 route/Affiliation 的旧 payoffs。

从 `goldenLinePayoffGate.ts` 删除 `sect_path_choice` 专属 fixture skip、G2/G3 和 block-reason branches；不新增替代阈值，不修改其他 gate。

- [ ] **Step 6: Point the P25 synthetic slice at the current formal event**

将 loader lookup 改为 `sect_choice`，用已有 outcome helper 读取 `join_shaolin/success`：

```ts
const sectChoice = loader.getEventById('sect_choice')!;
flags = applyEventChoiceOutcomeFlagSets(sectChoice, 0, 'success', flags);
eventSequence.push({
  age: 14,
  eventId: 'sect_choice',
  choiceIndex: 0,
  choiceLabel: 'join_shaolin',
  flagsAfter: activeFlags(flags),
});
```

只更新对应 age/action 文字；不恢复 `route_orthodox`，不改变后续合成 trial 和 terminal 判定。

- [ ] **Step 7: Update the basic integration existence assertion and gate registration**

`IntegrationTests.ts` 只接受 `e.id === 'sect_choice'`。在 `tests/runRealTestGate.ts` 的 canonical/feature tests 段加入：

```ts
{ name: 'youthCausalOpportunity', entry: 'tests/youthCausalOpportunity.test.ts' },
```

- [ ] **Step 8: Regenerate the tracked event manifest without treating its report as product truth**

Run: `npm run report:event-asset-inventory`

Expected: exit 0；`src/data/event-asset-manifest.json` 显示 28 个 runtime files、418 个 runtime events，且不含七个 removed IDs。该命令写出的 `docs/test-reports/product-experience-governance-event-asset-audit.md` 是生成报告，不纳入本 Slice diff；若它原本未修改，保持未修改状态。

- [ ] **Step 9: Run direct consumers**

Run:

```bash
npm exec -- tsx tests/youthCausalOpportunity.test.ts
npm exec -- tsx tests/canonicalMartialLegacyProducerPruning.test.ts
npm exec -- tsx tests/canonicalCriticalChoiceNormalization.test.ts
npm exec -- tsx tests/testLifeMemorySummary.ts
npm exec -- tsx tests/canonicalP25HabitSimulationNarrowing.test.ts
npm exec -- tsx tests/p35MixedPinnacleParityTests.ts
npm exec -- tsx tests/p131PinnacleMythLegendSpineTests.ts
npm run validate:event-quality
npm run gate:golden-line
```

Expected: exit 0。`validate:event-quality` 如存在实施前已知非绿色项，必须记录其精确 event IDs，并证明本 Slice 没有新增 blocker；不得通过恢复被删除资产解决。

- [ ] **Step 10: Prove no formal source still imports deleted assets**

Run:

```bash
rg -n 'identity-outlaw|sect_path_choice|meet_love_interest|outlaw_path_beginning|outlaw_training|outlaw_mentor' \
  src/core src/data/lines src/data/events.json scripts/validateEventQuality.ts scripts/inventoryEventAssets.ts \
  src/data/golden-line-spine.json src/data/golden-line-payoff-map.json src/data/lifeMemoryLabels.ts \
  src/p25/p35MixedPinnacleLifetimeSlices.ts
```

Expected: exit 1（无匹配）。范围外的未加载历史资产、P8 synthetic classifier record 或旧报告匹配不构成正式生产引用。

- [ ] **Step 11: Check the task diff**

Run: `git diff --check -- src/data/events.json src/core/EventLoader.ts scripts/validateEventQuality.ts scripts/inventoryEventAssets.ts src/data/event-asset-manifest.json src/data/golden-line-spine.json src/data/golden-line-payoff-map.json scripts/goldenLinePayoffGate.ts src/data/lifeMemoryLabels.ts src/p25/p35MixedPinnacleLifetimeSlices.ts tests/testLifeMemorySummary.ts tests/AllTests.ts tests/IntegrationTests.ts tests/canonicalMartialLegacyProducerPruning.test.ts tests/runRealTestGate.ts`

Expected: exit 0。仅在另行授权时精确提交这些路径。

### Task 8: Run the full automated regression and repair only in-slice fallout

**Files:**

- Modify if and only if a failing assertion directly fixes old mandatory/duplicate semantics: files already listed in Tasks 1～7.
- Do not modify: PlayerState/Snapshot/Contract/schema files、P8/P9/P40 metric/classifier、Milestone、Ending、UI、unrelated event assets。

**Interfaces:**

- Produces one green automated evidence set for the approved Slice.

- [ ] **Step 1: Run static and focused validation**

Run:

```bash
npm exec -- tsx tests/youthCausalOpportunity.test.ts
npm run typecheck
npm run validate:event-quality
```

Expected: focused test and typecheck exit 0；event-quality 不新增本 Slice blocker。

- [ ] **Step 2: Run Contract and shared runtime validation**

Run:

```bash
npm run test:contracts
npm run test:headless
npm run test:headless:parity
```

Expected: all exit 0；Local/Headless 对相同 snapshot、event IDs、choice effects 继续一致。

- [ ] **Step 3: Run the full current test baseline**

Run: `npm test`

Expected: exit 0。若历史测试固定“14 岁必有门派”“18 岁必有大会”、峨眉入口或重复幽影门文件，只修改/删除该旧断言；若失败属于独立产品系统，记录为 baseline，不扩大本 Slice。

- [ ] **Step 4: Run production build and scheduling gates**

Run:

```bash
npm run build
npm run gate:p11-scheduling
npm run gate:golden-line
```

Expected: all exit 0；不得用 mandatory 标签或 priority 0 恢复青年必然性。

- [ ] **Step 5: Verify exact scope and whitespace**

Run:

```bash
git diff --check
git status --short
git diff --stat
```

Expected: `git diff --check` exit 0；变更只落在本计划 File map 与已存在的设计/计划文档。若出现无关路径，停止并隔离，不 reset 或覆盖。

### Task 9: Perform two normal Browser journeys and close the stage

**Files:**

- Modify after evidence is complete: `docs/governance/current-product-stage.md`
- Runtime/UI files: no planned changes.

**Interfaces:**

- Consumes the same Local/API formal event/state semantics verified by automated tests.
- Produces honest Browser evidence for the exact local tab/session tested; it does not claim external player-experience validation.

- [ ] **Step 1: Start the normal local product path**

Run: `npm run dev`

Expected: Vite starts successfully and prints the local URL。使用 `browser-testing-with-devtools`（或当前可用的正式 Browser 控制 skill）操作正常 UI，不添加 debug route、query fixture、production hook 或 Snapshot 后门。

- [ ] **Step 2: Play the low-exposure counterfactual path**

从新人生通过正常选择与主动行动推进；保持低武道实践、低人脉/名望、无 Affiliation，跨过 20 岁。记录：门派、爱情、幽影门、大会机会均可不发生；玩家仍可进行主动行动、普通事件并继续推进。每次点击前刷新 DOM，只接受唯一 locator，记录 Console warning/error。

- [ ] **Step 3: Play the causal-opportunity path**

通过正常训练形成 `trainingHabit >= 1`，通过江湖经历或 Affiliation 形成社会暴露，并获得 Affiliation/名望/人脉之一的公开证明。验证：门派/爱情/大会机会因前置事实出现；大会接受与观战产生不同后续；幽影门先接触后邀请。

- [ ] **Step 4: Complete the romance × shadow-sect conflict**

在同一正常路径建立 `love_started` 并加入 `shadow_sect`，触发 `love_demonic_conflict`。分别用两次独立新人生或可恢复的正常存档验证：离开清除所属并保留关系；留下保留所属、关系实际下降且出现焦虑状态。不得用测试构造状态冒充 Browser 正常路径。

- [ ] **Step 5: Record evidence boundaries**

如果正常游戏随机/权重使某一正向组合在合理时间内未自然出现，Browser 项记为 `Evidence Insufficient`，保留自动化 before/after 证据；不得写 `N/A` 或把未执行说成失败，也不得添加调度后门。

- [ ] **Step 6: Close only this authorized stage**

在 `current-product-stage.md` 记录：根因、修改文件类别、自动化命令及 exit code、两条 Browser 路径的真实结果、任何 Evidence Insufficient、Git 状态和相邻但未授权问题。只有 Tasks 1～9 的完成定义全部满足时标记本 Slice 已完成；不得自动授权下一阶段、扩充事件池或重做全局调度。

- [ ] **Step 7: Final spec-coverage and placeholder self-review**

Run:

```bash
rg -n 'T[B]D|T[O]DO|implement l[a]ter|fill in deta[i]ls|add appr[o]priate|similar to T[a]sk' \
  docs/superpowers/plans/2026-08-09-youth-causal-opportunity.md
rg -n 'sect_choice|love_first_meet|demonic_encounter|outlaw_identity_beginning|martial_arts_invitation|love_demonic_conflict|Snapshot|Browser' \
  docs/superpowers/plans/2026-08-09-youth-causal-opportunity.md
git diff --check
```

Expected: placeholder scan exit 1；coverage scan 命中所有八类关键词；`git diff --check` exit 0。人工逐项确认所有 spec acceptance criteria 都能映射到 Task 1～9，所有 event/choice/fact IDs 与 JSON 及测试一致。

- [ ] **Step 8: Optional commit only with separate explicit authorization**

如果用户明确授权一次性提交，先运行 `git diff --name-only` 并逐项对照 File map，再按 coherent groups 使用精确 `git add <paths>`；未经授权不 stage、不 commit。禁止 `git add .`。

---

## Completion definition

- 四条目标线均由年龄窗口 + 既有正式事实决定资格，并可永久不发生。
- `meet_love_interest`、`sect_path_choice`、`identity-outlaw.json` 及正式直接消费者已经收敛，无 compatibility/fallback。
- critical 和 storyline 在候选 cap 前完整保留，只有 regular formal 截取 12 项；后续层级选择不变。
- 门派留家、爱情错过/应对、幽影门拒绝、大会接受/观战/拒绝均改变正式后续事件集合。
- `love_demonic_conflict` 产生真实不可兼得后果。
- raw GameState 无新增字段，Snapshot 保持 3.14.0，Local/API/Headless/Browser 共享语义。
- 聚焦、typecheck、Contract、Headless、parity、完整测试、build、P11、Golden Line 和 diff check 均有诚实证据。
- 完成后停止，不进入事件扩充、全局 priority/`triggers.random` 重构或下一产品阶段。
