# Habit Practice Narrowing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `trainingHabit / studyHabit / businessHabit` 从隐藏人物塑形与路线轴收窄为仅由显式长期实践产生、仅用于显式内容资格和描述性回顾的 Canonical 长期实践记录。

**Architecture:** 保留现有 `PlayerLifeStates` 三个数值字段与 `0～5` clamp，删除所有基于 category、event tag、收益、echo flag 和 legacy habit flag 的隐式生产与消费。主动行动通过 `ActiveActionDefinition.habitEffects` 显式声明，Daily/Formal Event 继续使用现有 `stateEffects` / `life_state_change`；展示层拆出只处理三项实践记录的 `practiceTrajectorySummary`，Snapshot 升级到 `3.7.0` 并双向拒绝三个 legacy habit flag。

**Tech Stack:** TypeScript 5.9、Vue 3、Vite 7、`tsx` 自定义测试门、JSON 事件资产、Headless Snapshot Contract。

## Global Constraints

- 权威层级必须遵守：`docs/product/player-model.md` > `docs/governance/project-convergence.md` > `AGENTS.md` > `docs/README.md` > 当前 Contract / Schema > 当前代码和测试。
- 仅治理 `trainingHabit / studyHabit / businessHabit`；不得裁决或顺带迁移 `familyBond / socialMomentum`。
- 三项 Habit 仅表示领域长期重复实践记录，不是 Trait、属性、investments、路线、身份、人物原型、Status 或成功次数。
- Habit 只能由具体内容显式声明；禁止由 Action category、Event tag、收益阈值、成功失败、Trait、echo flag 或 legacy flag 自动推导。
- Habit 只允许作为显式内容资格与描述性轨迹；禁止参与 Daily/Formal 全局权重、P20 archetype、whole-life pacing、属性倾向、身份判断和 Ending 分类/资格。
- Snapshot schema 必须从 `3.6.0` 升级到 `3.7.0`；`3.6.x` 及更早版本整体拒绝，不提供 migration、fallback、shadow field、重算或清洗。
- `training_habit / study_habit / business_habit` 在运行时持久状态和 Snapshot 中均为 forbidden legacy flags。
- 不修改 `src/core/RouteStateManager.ts:248-249` 两条已批准旧 Route Lifecycle 债务。
- 不在用户原 dirty checkout 中使用 `git add .` 或 `git add -A`；执行时先使用 `superpowers:using-git-worktrees` 建立隔离 worktree。
- 不删除或提交用户原有六份 dirty test report 与 `package-project.sh`。
- 每个任务遵循测试先行；每个任务结束时只提交该任务明确列出的文件。

---

## File Responsibility Map

### 新增文件

- `tests/canonicalHabitPracticeNarrowing.test.ts`：本次 Canonical Producer、Consumer、Snapshot 和 repository guard 的唯一主回归测试。
- `src/utils/practiceTrajectorySummary.ts`：只处理 `trainingHabit / studyHabit / businessHabit` 的玩家可见实践轨迹，不读取 `familyBond / socialMomentum`。
- `docs/superpowers/specs/2026-07-27-habit-practice-narrowing-design.md`：已批准设计文档，实施前由用户提供的设计文件写入仓库。
- `docs/superpowers/plans/2026-07-27-habit-practice-narrowing.md`：本实施计划。

### 主要修改文件

- `docs/product/player-model.md`：写入三项 Habit 的长期 Canonical 定义和权限边界。
- `src/types/activeActionTypes.ts`：定义 `PracticeHabitKey`、`PracticeHabitEffect` 与 `ActiveActionDefinition.habitEffects`。
- `src/data/activeActionCatalog.ts`、`src/data/childhoodActionCatalog.ts`：为真正持续一季度的具体行动显式声明 Habit effect。
- `src/core/activePlanning/ActivePlanningService.ts`：应用 `habitEffects`，删除三项 echo→Habit 映射与 compatibility flag 投影。
- `src/types/eventTypes.ts`、`src/data/life/dailyEvents.ts`、`src/core/DailyEventSystem.ts`、`src/core/GameEngineIntegration.ts`：删除 DailyEvent 旧 hook、Habit 软权重和 Formal Event 通用推导。
- `src/data/lines/p9-remediation.json`、`src/data/lines/general.json`、`src/data/lines/p21-content-samples.json`、`src/data/lines/p22-content-expansions.json`：删除四个不成立的显式 producer 与三个 legacy condition fallback。
- `src/narrative/profile/wuxiaReplayabilitySurfaces.ts`、`src/p20/validationSlices.ts`：移除 legacy habit flag 对 archetype 与 replay slice 的输入。
- `src/components/mainScreenModel.ts`、`src/p19/stateAccess.ts`：删除 Habit 对属性倾向和自我身份的影响。
- `src/utils/habitShapingSummary.ts`、`src/core/deriveLifeMemorySummary.ts`、`src/core/ChoiceFeedbackGenerator.ts`、`src/core/activePlanning/periodSummaryBuilder.ts`、`src/p19/finalSummaryComposition.ts`、`src/core/EndingSystem.ts`：将三项 Habit 的“塑形”展示收敛为描述性实践轨迹，并删除 `buildShapingPatternEndingTone()`。
- `src/contracts/gameStateSnapshot.ts`、`src/contracts/validation/contractValidation.ts`、`src/headless/snapshot/SnapshotConverter.ts`、`src/contracts/fixtures/gameStateSnapshotAge50.ts`：Snapshot `3.7.0` 与 forbidden flag 双边检查。
- `docs/contracts/game-state-snapshot-contract.md`、`docs/contracts/save-schema-versioning-policy.md`：同步 schema 版本和拒绝规则。
- 当前正式测试中与旧 Habit 权限冲突的文件：`tests/p71ActiveActionExperienceTests.ts`、`tests/canonicalDisciplineIndulgenceRemoval.test.ts`、`tests/personalityHabitTrajectoryTests.ts`、`tests/p43ArchetypeRecapEndingTests.ts`、`tests/mainScreenModel.test.ts`、`tests/p45ShapingBiasRegressionTests.ts`、Snapshot contract tests。

---

### Task 1: 建立显式 Active Action Habit Producer

**Files:**
- Create: `tests/canonicalHabitPracticeNarrowing.test.ts`
- Modify: `src/types/activeActionTypes.ts:1-45`
- Modify: `src/data/activeActionCatalog.ts`
- Modify: `src/data/childhoodActionCatalog.ts`
- Modify: `src/core/activePlanning/ActivePlanningService.ts:30-190`
- Modify: `tests/p71ActiveActionExperienceTests.ts:92-110`

**Interfaces:**
- Produces: `PracticeHabitKey = 'trainingHabit' | 'studyHabit' | 'businessHabit'`
- Produces: `PracticeHabitEffect { state: PracticeHabitKey; value: number }`
- Produces: `ActiveActionDefinition.habitEffects?: PracticeHabitEffect[]`
- Consumes: 现有 `traitSystem.clampLifeState(state, value)` 与 `createDefaultPlayerLifeStates()`。

- [ ] **Step 1: 写入 Active Action 失败测试**

在 `tests/canonicalHabitPracticeNarrowing.test.ts` 写入：

```ts
import { assert, assertDeepEqual } from './GameTestFramework';
import { GameTestFramework } from './GameTestFramework';
import { activeActionCatalog } from '../src/data/activeActionCatalog';
import { childhoodActionCatalog } from '../src/data/childhoodActionCatalog';
import { executeActiveActionOnState } from '../src/core/activePlanning/ActivePlanningService';
import type { GameState } from '../src/types/eventTypes';

const framework = new GameTestFramework();

function createState(): GameState {
  return (framework as unknown as { createTestState(): GameState }).createTestState();
}

function findAction(id: string) {
  const action = [...activeActionCatalog, ...childhoodActionCatalog].find(item => item.id === id);
  if (!action) throw new Error(`action not found: ${id}`);
  return action;
}

function testExplicitActiveActionHabitEffects(): void {
  assertDeepEqual(findAction('action_training_basic').habitEffects, [
    { state: 'trainingHabit', value: 1 },
  ], 'quarterly training must explicitly add training practice');
  assertDeepEqual(findAction('action_study_basic').habitEffects, [
    { state: 'studyHabit', value: 1 },
  ], 'quarterly study must explicitly add study practice');
  assertDeepEqual(findAction('action_business_basic').habitEffects, [
    { state: 'businessHabit', value: 1 },
  ], 'quarterly business must explicitly add business practice');
  assertDeepEqual(findAction('action_childhood_training').habitEffects, [
    { state: 'trainingHabit', value: 1 },
  ], 'quarterly childhood training is explicit practice');
  assertDeepEqual(findAction('action_study_lite').habitEffects, [
    { state: 'studyHabit', value: 1 },
  ], 'quarterly childhood study is explicit practice');
  assertDeepEqual(findAction('action_household_apprentice').habitEffects, [
    { state: 'businessHabit', value: 1 },
  ], 'quarterly household apprenticeship is explicit practice');
  assert(findAction('action_childhood_yard_play').habitEffects === undefined, 'yard play is not training practice');
  assert(findAction('action_household_errand').habitEffects === undefined, 'one-month errand is not business practice');
}

function testActiveActionDoesNotProjectLegacyHabitFlags(): void {
  const state = createState();
  state.flags = {};
  state.player.flags = {};
  state.player.lifeStates.trainingHabit = 0;

  executeActiveActionOnState(state, 'action_training_basic', {
    random: () => 0.5,
    includeDisturbance: false,
  });

  assert(state.player.lifeStates.trainingHabit === 1, 'explicit effect adds training practice');
  assert(state.flags.training_habit === undefined, 'game flags must not project training_habit');
  assert(state.player.flags.training_habit === undefined, 'player flags must not project training_habit');
}

function testEchoFlagDoesNotCreateHabit(): void {
  const state = createState();
  state.flags = {};
  state.player.flags = {};
  state.player.lifeStates.trainingHabit = 0;

  const yardPlay = findAction('action_childhood_yard_play');
  assert(yardPlay.onCompleteFlags?.includes('p9_echo_training_hook') === true, 'fixture keeps route echo fact');
  executeActiveActionOnState(state, yardPlay.id, {
    random: () => 0.5,
    includeDisturbance: false,
  });

  assert(state.flags.p9_echo_training_hook === true, 'route echo fact remains');
  assert(state.player.lifeStates.trainingHabit === 0, 'echo flag must not create training practice');
}

export function runCanonicalHabitPracticeNarrowingTests(): void {
  testExplicitActiveActionHabitEffects();
  testActiveActionDoesNotProjectLegacyHabitFlags();
  testEchoFlagDoesNotCreateHabit();
}

runCanonicalHabitPracticeNarrowingTests();
console.log('canonicalHabitPracticeNarrowing.test.ts passed');
```

- [ ] **Step 2: 运行测试并确认失败**

Run:

```bash
npx tsx tests/canonicalHabitPracticeNarrowing.test.ts
```

Expected: TypeScript 或运行时失败，指出 `habitEffects` 不存在，且当前仍投影 `training_habit`。

- [ ] **Step 3: 增加显式类型与目录声明**

在 `src/types/activeActionTypes.ts` 增加：

```ts
export type PracticeHabitKey =
  | 'trainingHabit'
  | 'studyHabit'
  | 'businessHabit';

export interface PracticeHabitEffect {
  state: PracticeHabitKey;
  value: number;
}
```

并在 `ActiveActionDefinition` 增加：

```ts
habitEffects?: PracticeHabitEffect[];
```

在 `src/data/activeActionCatalog.ts`：

```ts
// action_training_basic
habitEffects: [{ state: 'trainingHabit', value: 1 }],

// action_study_basic
habitEffects: [{ state: 'studyHabit', value: 1 }],

// action_business_basic
habitEffects: [{ state: 'businessHabit', value: 1 }],
```

在 `src/data/childhoodActionCatalog.ts`：

```ts
// action_childhood_training
habitEffects: [{ state: 'trainingHabit', value: 1 }],

// action_study_lite
habitEffects: [{ state: 'studyHabit', value: 1 }],

// action_household_apprentice
habitEffects: [{ state: 'businessHabit', value: 1 }],
```

不要给 `action_childhood_yard_play` 或 `action_household_errand` 添加 `habitEffects`。

- [ ] **Step 4: 修改 ActivePlanningService 只应用显式声明**

删除 `mapEchoFlagToLifeState()` 中三项 Habit 映射。保留 `p9_echo_social_hook → socialMomentum` 现有行为，因为 `socialMomentum` 不在本阶段裁决范围。

在完成 `onCompleteFlags` 写入后，增加独立应用：

```ts
if (actionDef?.habitEffects?.length) {
  if (!state.player.lifeStates) {
    state.player.lifeStates = createDefaultPlayerLifeStates();
  }
  for (const effect of actionDef.habitEffects) {
    state.player.lifeStates[effect.state] = Math.max(
      0,
      Math.min(5, (state.player.lifeStates[effect.state] ?? 0) + effect.value),
    );
  }
}
```

删除写入：

```ts
state.flags.training_habit
state.player.flags.training_habit
state.flags.study_habit
state.player.flags.study_habit
state.flags.business_habit
state.player.flags.business_habit
```

`touchedLifeStates` 类型只保留本阶段未裁决的 `socialMomentum`，或者将其收窄为直接处理 social echo；不得继续通过该集合处理三项 Habit。

- [ ] **Step 5: 更新 P7.1 旧断言**

将 `tests/p71ActiveActionExperienceTests.ts` 的 `runP71LongTermShapingTests()` 改为：

```ts
export async function runP71LongTermShapingTests(): Promise<void> {
  const trainingState = createState();
  executeActiveActionOnState(trainingState, 'action_training_basic', { random: () => 0.5, includeDisturbance: false });
  assert(trainingState.player.lifeStates.trainingHabit === 1, 'training action adds explicit training practice');
  assert(trainingState.flags.training_habit === undefined, 'training action must not project legacy habit flag');

  const businessState = createState();
  executeActiveActionOnState(businessState, 'action_household_apprentice', { random: () => 0.5, includeDisturbance: false });
  assert(businessState.player.lifeStates.businessHabit === 1, 'quarterly apprenticeship adds explicit business practice');
  assert(businessState.flags.business_habit === undefined, 'business action must not project legacy habit flag');

  const errandState = createState();
  executeActiveActionOnState(errandState, 'action_household_errand', { random: () => 0.5, includeDisturbance: false });
  assert(errandState.player.lifeStates.businessHabit === 0, 'one-month errand must not create business practice');
}
```

- [ ] **Step 6: 运行聚焦测试**

Run:

```bash
npx tsx tests/canonicalHabitPracticeNarrowing.test.ts
npx tsx tests/p71ActiveActionExperienceTests.ts
npx tsx tests/p7ActivePlanningTests.ts
```

Expected: 全部退出码 `0`。

- [ ] **Step 7: 提交**

```bash
git add \
  tests/canonicalHabitPracticeNarrowing.test.ts \
  tests/p71ActiveActionExperienceTests.ts \
  src/types/activeActionTypes.ts \
  src/data/activeActionCatalog.ts \
  src/data/childhoodActionCatalog.ts \
  src/core/activePlanning/ActivePlanningService.ts
git commit -m "feat: make practice habit effects explicit"
```

---

### Task 2: 删除 DailyEvent 隐式 Producer 与 Habit 软权重

**Files:**
- Modify: `tests/canonicalHabitPracticeNarrowing.test.ts`
- Modify: `src/types/eventTypes.ts:350-386`
- Modify: `src/data/life/dailyEvents.ts`
- Modify: `src/core/GameEngineIntegration.ts:1900-1910,2420-2517`
- Modify: `src/core/DailyEventSystem.ts:60-105,271-300`
- Modify: `tests/canonicalDisciplineIndulgenceRemoval.test.ts`
- Modify: `tests/personalityHabitTrajectoryTests.ts`
- Modify: `tests/p45ShapingBiasRegressionTests.ts`

**Interfaces:**
- Consumes: 现有 `DailyEventVariantConfig.stateEffects`。
- Produces: `DailyEventConfig` 不再包含 `longTermHooks`。
- Invariant: `daily_training_bottleneck_pos_1` 的显式 `trainingHabit +1` 保留。

- [ ] **Step 1: 增加 DailyEvent 失败测试**

在 Canonical 测试加入：

```ts
import fs from 'node:fs';
import path from 'node:path';
import { dailyEvents } from '../src/data/life/dailyEvents';
import { dailyEventSystem } from '../src/core/DailyEventSystem';

function findDailyEvent(id: string) {
  const event = dailyEvents.find(item => item.id === id);
  if (!event) throw new Error(`daily event not found: ${id}`);
  return event;
}

function testDailyHabitProducerAndWeightNarrowing(): void {
  for (const event of dailyEvents) {
    assert(!('longTermHooks' in event), `${event.id} must not expose longTermHooks`);
    const habitPreferences = (event.preferredStates ?? []).filter(rule =>
      rule.state === 'trainingHabit' || rule.state === 'studyHabit' || rule.state === 'businessHabit');
    assert(habitPreferences.length === 0, `${event.id} must not use Habit as preferredStates weight`);
  }

  const bottleneck = findDailyEvent('daily_training_bottleneck');
  const positive = bottleneck.variants.positive.find(item => item.id === 'daily_training_bottleneck_pos_1');
  assert(
    positive?.stateEffects?.some(effect => effect.state === 'trainingHabit' && effect.value === 1) === true,
    'training bottleneck explicit producer must remain',
  );
}

function testDailyGroupWeightsIgnorePracticeHabits(): void {
  const state = createState();
  state.player.age = 20;
  state.player.lifeStates.trainingHabit = 0;
  state.player.lifeStates.studyHabit = 0;
  const training = findDailyEvent('daily_morning_training');
  const study = findDailyEvent('daily_copybook_practice');
  const getWeight = (dailyEventSystem as unknown as {
    getWeight(config: typeof training, state: GameState): number;
  }).getWeight.bind(dailyEventSystem);

  const lowTraining = getWeight(training, state);
  const lowStudy = getWeight(study, state);
  state.player.lifeStates.trainingHabit = 5;
  state.player.lifeStates.studyHabit = 5;

  assert(getWeight(training, state) === lowTraining, 'trainingHabit must not change daily training weight');
  assert(getWeight(study, state) === lowStudy, 'studyHabit must not change daily study weight');
}
```

将两个函数加入 `runCanonicalHabitPracticeNarrowingTests()`。

- [ ] **Step 2: 运行并确认失败**

```bash
npx tsx tests/canonicalHabitPracticeNarrowing.test.ts
```

Expected: 失败于 `longTermHooks`、Habit `preferredStates` 或 group multiplier。

- [ ] **Step 3: 删除 DailyEvent 旧 Contract**

从 `src/types/eventTypes.ts` 删除整个：

```ts
longTermHooks?: {
  addTendency?: string[];
  addStateOnRepeat?: Array<{
    state: LifeStateKey;
    increment: number;
    repeatThreshold: number;
  }>;
};
```

从 `src/data/life/dailyEvents.ts` 删除全部 `longTermHooks`。

删除以下 Habit `preferredStates`：

```text
daily_morning_training.trainingHabit
daily_skip_training.trainingHabit
daily_training_bottleneck.trainingHabit
daily_copybook_practice.studyHabit
daily_reading_notes.studyHabit
```

不要修改 `familyBond / socialMomentum` 的 `preferredStates`。

保留：

```ts
stateEffects: [{ state: 'trainingHabit', value: 1 }]
```

于 `daily_training_bottleneck_pos_1`。

- [ ] **Step 4: 删除 DailyEvent runtime hook**

从 `GameEngineIntegration` 的事件执行链删除：

```ts
adjustedState = this.applyDailyEventLongTermHooks(previousState, adjustedState, event);
```

删除整个：

```ts
applyDailyEventLongTermHooks()
mapLegacyHabitFlagToLifeState()
projectHabitCompatibilityFlags()
```

如果 `projectHabitCompatibilityFlags()` 仍被 Formal Event 路径引用，Task 3 会先将 Formal Event 返回结构改为直接写入 `lifeStates`，然后彻底删除；本任务中不得保留一个只为三项 legacy flag 服务的空壳。

- [ ] **Step 5: 删除 DailyEvent group Habit multiplier**

将 `getGroupStateMultiplier()` 的 training/study 分支改为 `1`，同时保留未裁决的其他分支：

```ts
switch (config.group) {
  case 'training':
  case 'study':
    return 1;
  case 'livelihood':
    return this.clampMultiplier(1 + socialMomentum * 0.12);
  case 'family':
    return this.clampMultiplier(1 + Math.max(0, 2 - familyBond) * 0.08);
  case 'emotion':
    return this.clampMultiplier(1 - socialMomentum * 0.08);
  default:
    return 1;
}
```

删除局部变量 `trainingHabit`、`studyHabit`。

- [ ] **Step 6: 反转旧测试**

在 `tests/canonicalDisciplineIndulgenceRemoval.test.ts`：

- 删除“晨练必须 prefer trainingHabit”“读书必须 prefer studyHabit”的断言；
- 新增 `preferredStates` 不得读取三项 Habit 的断言；
- 将 scheduling source scan 改为确认 `getGroupStateMultiplier` 不读取三项 Habit。

在 `tests/personalityHabitTrajectoryTests.ts`：

- 删除 `testDailyHookRuntime()`；
- 保留 `testConditionEvaluatorLifeStateAccess()`；
- 删除 compatibility flag 断言。

在 `tests/p45ShapingBiasRegressionTests.ts`：

- 删除必须存在 `addTendency/addStateOnRepeat` 的断言；
- 改为断言 DailyEvent JSON/TS 配置中不存在两个字段。

- [ ] **Step 7: 运行聚焦测试**

```bash
npx tsx tests/canonicalHabitPracticeNarrowing.test.ts
npx tsx tests/canonicalDisciplineIndulgenceRemoval.test.ts
npx tsx tests/personalityHabitTrajectoryTests.ts
npx tsx tests/p45ShapingBiasRegressionTests.ts
```

Expected: 全部退出码 `0`。

- [ ] **Step 8: 提交**

```bash
git add \
  tests/canonicalHabitPracticeNarrowing.test.ts \
  tests/canonicalDisciplineIndulgenceRemoval.test.ts \
  tests/personalityHabitTrajectoryTests.ts \
  tests/p45ShapingBiasRegressionTests.ts \
  src/types/eventTypes.ts \
  src/data/life/dailyEvents.ts \
  src/core/DailyEventSystem.ts \
  src/core/GameEngineIntegration.ts
git commit -m "refactor: remove implicit daily habit behavior"
```

---

### Task 3: 删除 Formal Event 通用 Habit Producer 与四个错误显式 Producer

**Files:**
- Modify: `tests/canonicalHabitPracticeNarrowing.test.ts`
- Modify: `src/core/GameEngineIntegration.ts:2354-2420`
- Modify: `src/data/lines/training.json`
- Modify: `src/data/lines/p9-remediation.json`
- Modify: `src/data/lines/general.json`

**Interfaces:**
- Formal Event 的合法 Habit producer 仍使用现有 `life_state_change`。
- `applyFormalEventConsequences()` 只保留未裁决的 `familyBond / socialMomentum` 通用行为；不再读取三项 Habit。

- [ ] **Step 1: 增加 Formal Producer 失败测试**

在 Canonical 测试加入：

```ts
import { EventLoader } from '../src/core/EventLoader';

function eventHasHabitEffect(
  eventId: string,
  target: 'trainingHabit' | 'studyHabit' | 'businessHabit',
  choiceId?: string,
): boolean {
  const event = EventLoader.getInstance().getEventById(eventId);
  if (!event) throw new Error(`event not found: ${eventId}`);
  const effects = choiceId
    ? event.choices?.find(item => item.id === choiceId)?.effects ?? []
    : event.autoEffects ?? [];
  return effects.some(effect =>
    effect.type === 'life_state_change' && effect.target === target);
}

function testRejectedExplicitFormalProducersAreRemoved(): void {
  assert(!eventHasHabitEffect('martial_arts_enlightenment', 'studyHabit', 'balanced_start'), 'balanced enlightenment must not create study practice');
  assert(!eventHasHabitEffect('p9_childhood_balanced_posture', 'studyHabit'), 'one childhood posture test must not create study practice');
  assert(!eventHasHabitEffect('p9_childhood_first_trade', 'businessHabit'), 'first trade must not create long-term business practice');
  assert(!eventHasHabitEffect('childhood_preference', 'studyHabit', 'balance_both'), 'one balanced childhood choice must not create study practice');
}

function testFormalEventTagsDoNotAutoCreateHabit(): void {
  const source = fs.readFileSync(path.resolve('src/core/GameEngineIntegration.ts'), 'utf8');
  assert(!/martialGain\s*>=\s*8[\s\S]{0,260}trainingHabit/.test(source), 'martial gain threshold must not create trainingHabit');
  assert(!/academicGain\s*>=\s*3[\s\S]{0,260}studyHabit/.test(source), 'academic gain threshold must not create studyHabit');
  assert(!/moneyGain\s*>=\s*25[\s\S]{0,320}businessHabit/.test(source), 'business gain threshold must not create businessHabit');
}
```

- [ ] **Step 2: 运行并确认失败**

```bash
npx tsx tests/canonicalHabitPracticeNarrowing.test.ts
```

Expected: 失败于通用阈值或四个显式 effect。

- [ ] **Step 3: 收窄 applyFormalEventConsequences()**

删除以下当前实现：

```ts
const martialGain =
  statDelta('martialPower')
  statDelta('externalSkill')
  statDelta('internalSkill')
  statDelta('qinggong');
const moneyGain = statDelta('money');
const businessGain = statDelta('businessAcumen');
const academicGain = statDelta('comprehension') + statDelta('knowledge') + statDelta('internalSkill');

if ((tags.has('training') || tags.has('risk')) && martialGain >= 8) {
  lifeStates.trainingHabit = traitSystem.clampLifeState('trainingHabit', (lifeStates.trainingHabit || 0) + 1);
}

if (tags.has('comprehension') && academicGain >= 3) {
  lifeStates.studyHabit = traitSystem.clampLifeState('studyHabit', (lifeStates.studyHabit || 0) + 1);
}

if (tags.has('business') && (moneyGain >= 25 || businessGain >= 1)) {
  lifeStates.businessHabit = traitSystem.clampLifeState('businessHabit', (lifeStates.businessHabit || 0) + 1);
  if (moneyGain >= 150 && lifeStates.familyBond > 0) {
    lifeStates.familyBond = traitSystem.clampLifeState('familyBond', lifeStates.familyBond - 1);
  }
}
```

`moneyGain >= 150 → familyBond -1` 当前嵌在 business Habit 分支中，并非本轮批准的家庭模型；删除该嵌套副作用，不迁成新机制。

保留 social/family 分支，并直接返回：

```ts
return {
  ...nextState,
  player: {
    ...nextState.player,
    lifeStates,
  },
};
```

不得再调用 legacy flag 投影函数。

- [ ] **Step 4: 删除四个显式 producer**

在对应 JSON 选择的 `effects` 数组中，仅删除：

```json
{
  "type": "life_state_change",
  "state": "studyHabit",
  "value": 1,
  "operator": "add"
}
```

或：

```json
{
  "type": "life_state_change",
  "state": "businessHabit",
  "value": 1,
  "operator": "add"
}
```

不要删除同一选择中的属性、金钱、声望、flag 或其他效果。

- [ ] **Step 5: 运行聚焦测试与 JSON 加载测试**

```bash
npx tsx tests/canonicalHabitPracticeNarrowing.test.ts
npx tsx tests/AllTests.ts
npx tsx tests/IntegrationTests.ts
```

Expected: 全部退出码 `0`。

- [ ] **Step 6: 提交**

```bash
git add \
  tests/canonicalHabitPracticeNarrowing.test.ts \
  src/core/GameEngineIntegration.ts \
  src/data/lines/training.json \
  src/data/lines/p9-remediation.json \
  src/data/lines/general.json
git commit -m "refactor: remove inferred formal habit gains"
```

---

### Task 4: 删除 Legacy Habit Flag 读写与内容 fallback

**Files:**
- Modify: `tests/canonicalHabitPracticeNarrowing.test.ts`
- Modify: `src/data/lines/p21-content-samples.json`
- Modify: `src/data/lines/p22-content-expansions.json`
- Modify: `src/narrative/profile/wuxiaReplayabilitySurfaces.ts`
- Modify: `src/p20/validationSlices.ts`
- Modify: `tests/p20ReplayabilityTests.ts`
- Modify: `tests/personalityHabitTrajectoryTests.ts`
- Modify: `tests/p42ContentDensityTests.ts`

**Interfaces:**
- Produces: 三个 route-sensitive 条件只使用 Canonical Habit 与明确路线/出身事实。
- Invariant: `p9_echo_*` 仍可作为具体 route echo fact，但不得成为 Habit alias。

- [ ] **Step 1: 增加 legacy flag 失败测试**

在 Canonical 测试加入：

```ts
function testNoLegacyHabitFlagConsumers(): void {
  const p21 = fs.readFileSync(path.resolve('src/data/lines/p21-content-samples.json'), 'utf8');
  const p22 = fs.readFileSync(path.resolve('src/data/lines/p22-content-expansions.json'), 'utf8');
  const replay = fs.readFileSync(path.resolve('src/narrative/profile/wuxiaReplayabilitySurfaces.ts'), 'utf8');
  const validation = fs.readFileSync(path.resolve('src/p20/validationSlices.ts'), 'utf8');

  const flagFallback = /flags\.has\(\"(?:training_habit|study_habit|business_habit)\"\)/;
  assert(!flagFallback.test(p21), 'P21 content must not read legacy habit flags');
  assert(!flagFallback.test(p22), 'P22 content must not read legacy habit flags');
  assert(!/["'](?:training_habit|study_habit|business_habit)["']/.test(replay), 'P20 replay config must not use legacy habit flags');
  assert(!/["'](?:training_habit|study_habit|business_habit)["']/.test(validation), 'P20 validation fixtures must not use legacy habit flags');
}
```

- [ ] **Step 2: 运行并确认失败**

```bash
npx tsx tests/canonicalHabitPracticeNarrowing.test.ts
```

Expected: 报出 P20 replay config、P20 validation fixtures 或三个 route-sensitive JSON 条件中的 legacy flag。

- [ ] **Step 3: 修改三处 route-sensitive 条件**

`p21_scholar_route_reinforcement`：

```json
"expression": "flags.has(\"scholar_path_started\") && lifeStates.studyHabit >= 2"
```

该事件正文明确是“文士路线强化”，不能仅凭 Habit 自动确认路线。

`p21_martial_route_reinforcement`：

```json
"expression": "flags.has(\"martial_path_started\") && lifeStates.trainingHabit >= 2"
```

`p22_early_wealth_route_fork` 是从实践进入商路的机会，不预先确认身份，改为：

```json
"expression": "lifeStates.businessHabit >= 2 || flags.has(\"origin_merchant_family\")"
```

保留其他已经是纯 Canonical Habit 条件或 `Habit && route/attribute fact` 的事件。

- [ ] **Step 4: 删除 P20 legacy habit 输入**

在 `src/narrative/profile/wuxiaReplayabilitySurfaces.ts`：

```ts
// martial
growthPatternFlags: ['martial_talent_acknowledged', 'joined_sect'],

// scholar
growthPatternFlags: ['scholar_path_started', 'mentor_bond'],

// wealth
growthPatternFlags: ['merchant_network_growing', 'wealth_milestone'],
```

更新 replay slice seed flags：

```ts
P20_SLICE_ORIGIN_EARLY.seedFlags = ['martial_talent_acknowledged', 'joined_sect'];
P20_SLICE_WEALTH_PACING.seedFlags = ['merchant_network_growing', 'p9_early_business_focus'];
```

不得用 `trainingHabit/studyHabit/businessHabit` 重新注入 archetype config。

- [ ] **Step 5: 修正 P20 validation fixtures**

从 `src/p20/validationSlices.ts` 删除三个 legacy flag。为仍需命中对应 family 的 fixtures 使用已经合法存在的明确信号：

```ts
// Martial fixtures
flags: {
  origin_id: 'martial_family',
  martial_talent_acknowledged: true,
  joined_sect: true,
  martial_transmission: true,
  has_disciples: true,
}

// Scholar fixtures
flags: {
  origin_id: 'scholar_house',
  scholar_path_started: true,
  mentor_bond: true,
  teaching_legacy: true,
}

// Wealth fixtures
flags: {
  origin_id: 'merchant_house',
  merchant_network_growing: true,
  wealth_milestone: true,
  family_heir: true,
}
```

对于只验证 Habit gate 的 P25/P42 slice，保留 `lifeStates.*Habit` 数值，不引入 legacy flag。

- [ ] **Step 6: 运行聚焦测试**

```bash
npx tsx tests/canonicalHabitPracticeNarrowing.test.ts
npx tsx tests/p20ReplayabilityTests.ts
npx tsx tests/personalityHabitTrajectoryTests.ts
npx tsx tests/p42ContentDensityTests.ts
```

Expected: 全部退出码 `0`。

- [ ] **Step 7: 提交**

```bash
git add \
  tests/canonicalHabitPracticeNarrowing.test.ts \
  src/data/lines/p21-content-samples.json \
  src/data/lines/p22-content-expansions.json \
  src/narrative/profile/wuxiaReplayabilitySurfaces.ts \
  src/p20/validationSlices.ts \
  tests/p20ReplayabilityTests.ts \
  tests/personalityHabitTrajectoryTests.ts
git commit -m "refactor: remove legacy habit flag fallbacks"
```

---

### Task 5: 移除 Habit 的全局调度、Archetype、属性倾向与身份判断权限

**Files:**
- Modify: `tests/canonicalHabitPracticeNarrowing.test.ts`
- Modify: `src/core/GameEngineIntegration.ts:1400-1460,2256-2285`
- Modify: `src/components/mainScreenModel.ts:18-35,110-130,200-238`
- Modify: `src/p19/stateAccess.ts:89-125`
- Modify: `tests/mainScreenModel.test.ts`
- Modify: `tests/personalityHabitTrajectoryTests.ts`
- Modify: `tests/p20ReplayabilityTests.ts`

**Interfaces:**
- Formal Event state multiplier 继续允许 `familyBond / socialMomentum`，删除三项 Habit。
- `inferLivedSelfUnderstanding()` 优先使用实际 chivalry、reputation、karma、connections 与关系，不读取三项 Habit。

- [ ] **Step 1: 增加 Consumer 不变量失败测试**

在 Canonical 测试加入：

```ts
import { buildMainScreenModel } from '../src/components/mainScreenModel';
import { LIFE_MEMORY_SCHEMA_VERSION } from '../src/types/lifeMemory';
import { inferLivedSelfUnderstanding } from '../src/p19/stateAccess';
import { selectArchetypeFamily } from '../src/p20/archetypeCoverage';

function withPracticeHabits(state: GameState, value: number): GameState {
  const clone = structuredClone(state);
  clone.player.lifeStates.trainingHabit = value;
  clone.player.lifeStates.studyHabit = value;
  clone.player.lifeStates.businessHabit = value;
  return clone;
}

function testPracticeHabitsDoNotDefineIdentityOrTendency(): void {
  const base = createState();
  base.player.age = 40;
  base.flags = { origin_id: 'poor_family' };
  base.player.flags = { origin_id: 'poor_family' };
  base.player.martialPower = 25;
  base.player.knowledge = 25;
  base.player.businessAcumen = 25;
  base.player.connections = 25;
  base.player.reputation = 25;

  const low = withPracticeHabits(base, 0);
  const high = withPracticeHabits(base, 5);

  assert(
    selectArchetypeFamily(low).familyId === selectArchetypeFamily(high).familyId,
    'Habit-only changes must not change P20 archetype',
  );
  assert(
    inferLivedSelfUnderstanding(low) === inferLivedSelfUnderstanding(high),
    'Habit-only changes must not change lived self identity',
  );
  const lifeMemory = {
    schemaVersion: LIFE_MEMORY_SCHEMA_VERSION,
    derivedAtAge: 40,
  } as const;
  assert(
    buildMainScreenModel(low.player, lifeMemory).tendencySummary
      === buildMainScreenModel(high.player, lifeMemory).tendencySummary,
    'Habit-only changes must not change main-screen tendency ranking',
  );
}

function testFormalSchedulingSourceDoesNotReadPracticeHabits(): void {
  const source = fs.readFileSync(path.resolve('src/core/GameEngineIntegration.ts'), 'utf8');
  const multiplierBody = source.slice(
    source.indexOf('private getFormalEventStateMultiplier'),
    source.indexOf('private getSpecializationMultiplier'),
  );
  assert(!/trainingHabit|studyHabit|businessHabit/.test(multiplierBody), 'formal state multiplier must ignore practice habits');
}
```


- [ ] **Step 2: 运行并确认失败**

```bash
npx tsx tests/canonicalHabitPracticeNarrowing.test.ts
```

Expected: 至少失败于 Formal Event multiplier、main screen tendency 或 self-understanding。

- [ ] **Step 3: 删除 Formal Event Habit multiplier**

在 `getFormalEventStateMultiplier()` 中删除：

```ts
trainingHabit
studyHabit
practiceHabit
```

最终只保留：

```ts
const { familyBond = 0, socialMomentum = 0 } = this.gameState.player.lifeStates;
```

以及 social/business/reputation 和 family/romance 的既有未裁决逻辑。

- [ ] **Step 4: 删除 mainScreen Habit tendency 修正**

在 `src/components/mainScreenModel.ts`：

- 删除 `BUSINESS_HABIT_TENDENCY_THRESHOLD`、`STUDY_HABIT_TENDENCY_THRESHOLD`、`TRAINING_HABIT_TENDENCY_THRESHOLD`；
- 删除 `P124_NON_MARTIAL_SAMPLE.businessHabit`；
- 删除 `tendencyContextMultiplier()` 中三个 Habit 分支；
- 保留 route context 与 `socialMomentum` 分支，因为后者未裁决；
- 更新文件顶部 P124 scope 注释，不再把 Habit 作为允许输入。

- [ ] **Step 5: 删除 Habit identity inference**

从 `inferLivedSelfUnderstanding()` 删除前三个分支：

```ts
trainingHabit → 以武立身
studyHabit → 文气入骨
businessHabit → 营生身份
```

同时停止调用包含三项 Habit 的 `deriveDominantShapingLines()`。为避免顺带裁决另外两项，可只保留显式读取：

```ts
const socialMomentum = player.lifeStates?.socialMomentum ?? 0;
const familyBond = player.lifeStates?.familyBond ?? 0;
if (socialMomentum >= 2) return '你自觉人情往来织就了你的江湖版图。';
if (familyBond >= 2) return '你自觉亲族牵绊锚定了许多归宿与抉择。';
```

然后继续既有 chivalry/reputation/karma/relations fallback。

- [ ] **Step 6: 更新旧测试**

`tests/mainScreenModel.test.ts`：把“businessHabit 提升 livelihood tendency”的样例改为断言相同属性与 route context 下，`businessHabit=0` 与 `5` 的 `tendencySummary` 一致。

`tests/personalityHabitTrajectoryTests.ts`：删除 `testLifeStatesLedArchetypeSelection()`，改为 `testHabitOnlyDoesNotSelectArchetype()`。

`tests/p20ReplayabilityTests.ts`：fixtures 使用明确 route/growth signals，不使用三项 Habit 或 legacy flags 证明 family。

- [ ] **Step 7: 运行聚焦测试**

```bash
npx tsx tests/canonicalHabitPracticeNarrowing.test.ts
npx tsx tests/mainScreenModel.test.ts
npx tsx tests/p20ReplayabilityTests.ts
npx tsx tests/personalityHabitTrajectoryTests.ts
```

Expected: 全部退出码 `0`。

- [ ] **Step 8: 提交**

```bash
git add \
  tests/canonicalHabitPracticeNarrowing.test.ts \
  tests/mainScreenModel.test.ts \
  tests/p20ReplayabilityTests.ts \
  tests/personalityHabitTrajectoryTests.ts \
  src/core/GameEngineIntegration.ts \
  src/components/mainScreenModel.ts \
  src/p19/stateAccess.ts
git commit -m "refactor: decouple habits from global identity"
```

---

### Task 6: 拆分 Practice Trajectory 展示并删除身份化 Ending Tone

**Files:**
- Create: `src/utils/practiceTrajectorySummary.ts`
- Modify: `tests/canonicalHabitPracticeNarrowing.test.ts`
- Modify: `src/utils/habitShapingSummary.ts`
- Modify: `src/core/deriveLifeMemorySummary.ts:33-40,889-897`
- Modify: `src/core/ChoiceFeedbackGenerator.ts`
- Modify: `src/core/activePlanning/ActivePlanningService.ts:220-275`
- Modify: `src/core/activePlanning/periodSummaryBuilder.ts`
- Modify: `src/p19/finalSummaryComposition.ts`
- Modify: `src/core/EndingSystem.ts`
- Modify: `tests/p41HabitFeedbackTests.ts`
- Modify: `tests/p43ArchetypeRecapEndingTests.ts`
- Modify: `tests/testLifeMemorySummary.ts`

**Interfaces:**
- Produces: `PracticeTrajectoryKey`、`derivePracticeTrajectoryLines()`、`collectPracticeImpactLines()`、`buildPracticePeriodGrowthLine()`、`buildLateLifePracticeRecapLine()`。
- Removes: `buildShapingPatternEndingTone()`。
- Keeps: `LifeMemorySummary.habitTrajectory` 字段名以避免无关 schema 重命名；其内容变为纯实践描述。

- [ ] **Step 1: 增加展示失败测试**

在 Canonical 测试加入：

```ts
import {
  buildLateLifePracticeRecapLine,
  derivePracticeTrajectoryLines,
} from '../src/utils/practiceTrajectorySummary';
import { deriveLifeMemorySummary } from '../src/core/deriveLifeMemorySummary';

function testPracticeTrajectoryIsDescriptiveOnly(): void {
  const state = createState();
  state.player.lifeStates = {
    ...state.player.lifeStates,
    trainingHabit: 3,
    studyHabit: 4,
    businessHabit: 2,
    socialMomentum: 5,
    familyBond: 5,
  };

  assertDeepEqual(
    derivePracticeTrajectoryLines(state.player.lifeStates, 3).map(line => line.label),
    ['读书实践', '练功实践', '营生实践'],
    'practice trajectory must include only three practice habits',
  );

  const recap = buildLateLifePracticeRecapLine(state.player.lifeStates);
  assert(recap.includes('读书实践'), 'recap names practice');
  assert(!/塑形|入骨|立身|身份|主轴|绝活/.test(recap), 'recap must not claim identity');

  const memory = deriveLifeMemorySummary(state);
  assert(
    (memory.habitTrajectory ?? []).every(item => /实践$/.test(item.label)),
    'Life Memory labels must be practice labels',
  );
}

function testIdentityEndingToneHelperIsRemoved(): void {
  const source = walkSourceFiles('src')
    .map(file => fs.readFileSync(file, 'utf8'))
    .join('\n');
  assert(!source.includes('buildShapingPatternEndingTone'), 'identity ending tone helper must be removed');
}
```

- [ ] **Step 2: 运行并确认失败**

```bash
npx tsx tests/canonicalHabitPracticeNarrowing.test.ts
```

Expected: 模块不存在或旧措辞/Ending tone 仍存在。

- [ ] **Step 3: 新建 practiceTrajectorySummary.ts**

写入完整实现：

```ts
import type { PlayerLifeStates } from '../types/eventTypes';

export const PRACTICE_TRAJECTORIES = [
  { key: 'trainingHabit' as const, label: '练功实践' },
  { key: 'studyHabit' as const, label: '读书实践' },
  { key: 'businessHabit' as const, label: '营生实践' },
];

export type PracticeTrajectoryKey = (typeof PRACTICE_TRAJECTORIES)[number]['key'];

const PRACTICE_TIER_LABELS: Record<number, string> = {
  1: '有过实质实践',
  2: '开始重复',
  3: '较为稳定',
  4: '长期深入',
  5: '贯穿多个阶段',
};

export interface PracticeTrajectoryLine {
  key: PracticeTrajectoryKey;
  label: string;
  tierLabel: string;
  value: number;
  sortKey: number;
}

export function practiceTierLabel(value: number): string {
  return PRACTICE_TIER_LABELS[value] ?? '尚无长期积累';
}

export function derivePracticeTrajectoryLines(
  lifeStates: Partial<PlayerLifeStates> | undefined,
  limit = 3,
): PracticeTrajectoryLine[] {
  return PRACTICE_TRAJECTORIES
    .map(item => ({ ...item, value: lifeStates?.[item.key] ?? 0 }))
    .filter(item => item.value >= 1)
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, 'zh-CN'))
    .slice(0, limit)
    .map(item => ({
      key: item.key,
      label: item.label,
      tierLabel: practiceTierLabel(item.value),
      value: item.value,
      sortKey: item.value,
    }));
}

export function collectPracticeImpactLines(
  before: Partial<PlayerLifeStates> | undefined,
  after: Partial<PlayerLifeStates> | undefined,
): string[] {
  return PRACTICE_TRAJECTORIES
    .filter(item => (after?.[item.key] ?? 0) - (before?.[item.key] ?? 0) >= 1)
    .map(item => `${item.label}有所积累`);
}

export function buildPracticePeriodGrowthLine(
  lifeStates: Partial<PlayerLifeStates> | undefined,
): string | null {
  const lines = derivePracticeTrajectoryLines(lifeStates, 2);
  if (lines.length === 0) return null;
  return `这一阶段持续积累的实践是：${lines.map(line => `${line.label} · ${line.tierLabel}`).join(' / ')}。`;
}

export function buildLateLifePracticeRecapLine(
  lifeStates: Partial<PlayerLifeStates> | undefined,
): string {
  const lines = derivePracticeTrajectoryLines(lifeStates, 2);
  if (lines.length === 0) {
    return '回顾一生，练功、读书与营生都未形成持续的长期实践。';
  }
  return `回顾一生，${lines.map(line => `${line.label}${line.tierLabel}`).join('，')}。`;
}
```

- [ ] **Step 4: 迁移三项 Habit 展示调用**

- `deriveLifeMemorySummary.ts` 使用 `derivePracticeTrajectoryLines()` 构造 `habitTrajectory`；
- `ActivePlanningService.collectActiveActionLongTermImpactLines()` 对三项 Habit 使用 `collectPracticeImpactLines()`，对 `familyBond/socialMomentum` 保持现有独立逻辑；
- `periodSummaryBuilder.ts` 使用 `buildPracticePeriodGrowthLine()`；
- `ChoiceFeedbackGenerator.ts` 中三项 Habit 的玩家反馈改为“练功/读书/营生实践有所积累”；
- `EndingSystem.ts` 与 `finalSummaryComposition.ts` 使用 `buildLateLifePracticeRecapLine()`。

### 重要拆分规则

`src/utils/habitShapingSummary.ts` 仍可暂时保留 `familyBond/socialMomentum` 相关函数，但不得再把三项 Habit 包含进 `SHAPING_AXES`。将三项 Practice 从该数组、tier、identity consequence、feedback flag regex 中删除。

- [ ] **Step 5: 删除身份化 Ending tone**

删除：

```ts
ShapingRouteFamily
SHAPING_PATTERN_TONE
detectShapingRouteFamily()
buildShapingPatternEndingTone()
```

从 `src/p19/finalSummaryComposition.ts` 删除 import、调用、section 插入和 `shapingPatternToneLine` 赋值。若 `P19FinalSummaryComposition` 类型仍要求该字段，将其改为可选并不再生成；不得保留空字符串模拟旧功能。

- [ ] **Step 6: 更新展示测试**

`tests/p41HabitFeedbackTests.ts`：断言新文案包含“实践有所积累”，不包含“塑形加深”。

`tests/p43ArchetypeRecapEndingTests.ts`：

- import `buildLateLifePracticeRecapLine`；
- 删除全部 `buildShapingPatternEndingTone` 测试；
- 断言 recap 只描述实践，不改变 Ending id/category/eligibility。

`tests/testLifeMemorySummary.ts`：断言 trajectory label 仅为 `练功实践/读书实践/营生实践`。

- [ ] **Step 7: 运行聚焦测试**

```bash
npx tsx tests/canonicalHabitPracticeNarrowing.test.ts
npx tsx tests/p41HabitFeedbackTests.ts
npx tsx tests/p43ArchetypeRecapEndingTests.ts
npx tsx tests/testLifeMemorySummary.ts
npx tsx tests/testRoadEndings.ts
```

Expected: 全部退出码 `0`。

- [ ] **Step 8: 提交**

```bash
git add \
  tests/canonicalHabitPracticeNarrowing.test.ts \
  tests/p41HabitFeedbackTests.ts \
  tests/p43ArchetypeRecapEndingTests.ts \
  tests/testLifeMemorySummary.ts \
  src/utils/practiceTrajectorySummary.ts \
  src/utils/habitShapingSummary.ts \
  src/core/deriveLifeMemorySummary.ts \
  src/core/ChoiceFeedbackGenerator.ts \
  src/core/activePlanning/ActivePlanningService.ts \
  src/core/activePlanning/periodSummaryBuilder.ts \
  src/p19/finalSummaryComposition.ts \
  src/core/EndingSystem.ts \
  src/narrative/profile/types.ts
git commit -m "refactor: present habits as practice trajectories"
```

---

### Task 7: Snapshot 3.7.0 与 Forbidden Legacy Flag 双边拒绝

**Files:**
- Modify: `tests/canonicalHabitPracticeNarrowing.test.ts`
- Modify: `src/contracts/gameStateSnapshot.ts:20-30`
- Modify: `src/contracts/validation/contractValidation.ts:100-165`
- Modify: `src/headless/snapshot/SnapshotConverter.ts`
- Modify: `src/contracts/fixtures/gameStateSnapshotAge50.ts`
- Modify: `tests/contracts/snapshotContract.test.ts`
- Modify: `tests/contracts/contractValidation.test.ts`
- Modify: `tests/contracts/saveSchemaContract.test.ts`
- Modify: `tests/canonicalLegacyHealthRemoval.test.ts`
- Modify: `tests/canonicalDisciplineIndulgenceRemoval.test.ts`
- Modify: `docs/contracts/game-state-snapshot-contract.md`
- Modify: `docs/contracts/save-schema-versioning-policy.md`

**Interfaces:**
- Produces: `GAME_STATE_SNAPSHOT_SCHEMA_VERSION = '3.7.0'`。
- Produces: `findForbiddenHabitFlagPaths(value: unknown, rootPath: string): string[]`，Validator 与 Converter 共享同一禁止列表。
- Throws: `SnapshotConversionError('SNAPSHOT_FORBIDDEN_FIELD', message)`。

- [ ] **Step 1: 增加 Snapshot 失败测试**

在 Canonical 测试加入：

```ts
import { GAME_STATE_SNAPSHOT_SCHEMA_VERSION } from '../src/contracts/gameStateSnapshot';
import { gameStateSnapshotAge50 } from '../src/contracts/fixtures/gameStateSnapshotAge50';
import { validateGameStateSnapshot } from '../src/contracts/validation/contractValidation';
import {
  DefaultSnapshotConverter,
  SnapshotConversionError,
} from '../src/headless/snapshot/SnapshotConverter';

const time = { now: () => 1_800_000_000_000 };

function expectForbiddenSnapshot(snapshot: unknown, expectedPath: string): void {
  const validation = validateGameStateSnapshot(snapshot);
  assert('errors' in validation, `validator must reject ${expectedPath}`);
  assert(validation.errors.some(error => error.includes(expectedPath)), `validator error must name ${expectedPath}`);

  try {
    new DefaultSnapshotConverter().fromSnapshot(snapshot as never);
    throw new Error(`converter accepted ${expectedPath}`);
  } catch (error) {
    assert(error instanceof SnapshotConversionError, 'converter throws SnapshotConversionError');
    assert(error.code === 'SNAPSHOT_FORBIDDEN_FIELD', 'converter uses forbidden field code');
    assert(error.message.includes(expectedPath), `converter error names ${expectedPath}`);
  }
}

function testSnapshot37AndForbiddenHabitFlags(): void {
  assert(GAME_STATE_SNAPSHOT_SCHEMA_VERSION === '3.7.0', 'snapshot schema must be 3.7.0');

  const old = structuredClone(gameStateSnapshotAge50);
  old.metadata.schemaVersion = '3.6.0';
  const oldValidation = validateGameStateSnapshot(old);
  assert('errors' in oldValidation, '3.6.0 snapshot must be rejected');

  for (const [pathLabel, mutate] of [
    ['state.flags.training_habit', (snapshot: any) => { snapshot.state.flags.training_habit = true; }],
    ['state.player.flags.study_habit', (snapshot: any) => { snapshot.state.player.flags = { study_habit: true }; }],
    ['state.eventHistory[0].stateSnapshot.flags.business_habit', (snapshot: any) => {
      snapshot.state.eventHistory = [{
        eventId: 'legacy',
        stateSnapshot: { flags: { business_habit: true } },
      }];
    }],
    ['state.eventHistory[0].stateSnapshot.player.flags.training_habit', (snapshot: any) => {
      snapshot.state.eventHistory = [{
        eventId: 'legacy',
        stateSnapshot: { player: { flags: { training_habit: true } } },
      }];
    }],
  ] as const) {
    const snapshot = structuredClone(gameStateSnapshotAge50);
    mutate(snapshot);
    expectForbiddenSnapshot(snapshot, pathLabel);
  }
}

function testSerializerRejectsRuntimeLegacyHabitFlag(): void {
  const state = createState();
  state.flags.training_habit = true;
  try {
    new DefaultSnapshotConverter().toSnapshot(state, {
      eventCatalogVersion: 'test',
      sourcePlatform: 'node-headless',
      time,
    });
    throw new Error('serializer accepted runtime legacy habit flag');
  } catch (error) {
    assert(error instanceof SnapshotConversionError, 'serializer throws SnapshotConversionError');
    assert(error.code === 'SNAPSHOT_FORBIDDEN_FIELD', 'serializer uses forbidden field code');
  }
}
```

- [ ] **Step 2: 运行并确认失败**

```bash
npx tsx tests/canonicalHabitPracticeNarrowing.test.ts
```

Expected: schema 仍是 `3.6.0`，且 validator/converter 未递归拒绝 flags。

- [ ] **Step 3: 增加共享递归禁止检查**

在 `contractValidation.ts` 导出：

```ts
export const FORBIDDEN_HABIT_FLAG_KEYS = [
  'training_habit',
  'study_habit',
  'business_habit',
] as const;

export function findForbiddenHabitFlagPaths(value: unknown, rootPath: string): string[] {
  const paths: string[] = [];
  const visit = (current: unknown, currentPath: string): void => {
    if (Array.isArray(current)) {
      current.forEach((item, index) => visit(item, `${currentPath}[${index}]`));
      return;
    }
    if (!isPlainObject(current)) return;
    for (const [key, child] of Object.entries(current)) {
      const childPath = currentPath ? `${currentPath}.${key}` : key;
      if ((FORBIDDEN_HABIT_FLAG_KEYS as readonly string[]).includes(key)) {
        paths.push(childPath);
      }
      visit(child, childPath);
    }
  };
  visit(value, rootPath);
  return paths;
}
```

在 `validateGameStateSnapshot()` 中，仅对允许存 flags 的结构检查并报：

```ts
for (const forbiddenPath of findForbiddenHabitFlagPaths(st.flags, 'state.flags')) {
  errors.push(`forbidden ${forbiddenPath}`);
}
for (const forbiddenPath of findForbiddenHabitFlagPaths(st.player.flags, 'state.player.flags')) {
  errors.push(`forbidden ${forbiddenPath}`);
}
for (const forbiddenPath of findForbiddenHabitFlagPaths(st.eventHistory, 'state.eventHistory')) {
  errors.push(`forbidden ${forbiddenPath}`);
}
```

该 walker 不应扫描事件 ID 字符串；它只按对象 key 匹配，因而不会误伤 `p42_training_habit_*` 事件名。

- [ ] **Step 4: Converter 双边拒绝**

在 `toSnapshot()` 解构后、构造返回值前，检查：

```ts
const runtimeFlagPaths = [
  ...findForbiddenHabitFlagPaths(flags, 'state.flags'),
  ...findForbiddenHabitFlagPaths(playerFlags, 'state.player.flags'),
  ...findForbiddenHabitFlagPaths(eventHistory, 'state.eventHistory'),
];
if (runtimeFlagPaths.length > 0) {
  throw new SnapshotConversionError(
    'SNAPSHOT_FORBIDDEN_FIELD',
    `Forbidden snapshot field: ${runtimeFlagPaths[0]}`,
  );
}
```

在 `fromSnapshot()` schema 检查之后、flags merge 之前执行相同检查；发现即抛出 `SNAPSHOT_FORBIDDEN_FIELD`。

- [ ] **Step 5: 升级版本并同步 fixtures/docs**

修改：

```ts
export const GAME_STATE_SNAPSHOT_SCHEMA_VERSION = '3.7.0' as const;
```

确保 fixture 使用常量，不硬编码旧版本。更新 contract 文档：当前 schema 为 `3.7.0`，`3.6.x` 及更早整体拒绝，三个 legacy flag 在顶层/player/历史嵌套中禁止。

同步旧 Canonical 测试中的提示文本：

```text
3.6.0 → 3.7.0
3.5.x 及更早 → 3.6.x 及更早
```

只更新当前版本描述，不改变 health、energy、discipline/indulgence 的既有产品断言。

- [ ] **Step 6: 运行 Contract 测试**

```bash
npx tsx tests/canonicalHabitPracticeNarrowing.test.ts
npm run test:contracts:snapshot
npm run test:contracts:validation
npm run test:contracts:save-schema
npm run test:contracts
```

Expected: 全部退出码 `0`。

- [ ] **Step 7: 提交**

```bash
git add \
  tests/canonicalHabitPracticeNarrowing.test.ts \
  tests/contracts/snapshotContract.test.ts \
  tests/contracts/contractValidation.test.ts \
  tests/contracts/saveSchemaContract.test.ts \
  tests/canonicalLegacyHealthRemoval.test.ts \
  tests/canonicalDisciplineIndulgenceRemoval.test.ts \
  src/contracts/gameStateSnapshot.ts \
  src/contracts/validation/contractValidation.ts \
  src/headless/snapshot/SnapshotConverter.ts \
  src/contracts/fixtures/gameStateSnapshotAge50.ts \
  docs/contracts/game-state-snapshot-contract.md \
  docs/contracts/save-schema-versioning-policy.md
git commit -m "feat: enforce snapshot 3.7 habit boundary"
```

---

### Task 8: 更新正式 Gate 中的旧 Habit 资产与不变量测试

**Files:**
- Modify: `tests/canonicalHabitPracticeNarrowing.test.ts`
- Modify: `tests/runRealTestGate.ts`
- Modify: 以下正式 gate 文件中的旧 Habit 断言：
  - `tests/p122EarlyVisibleGrowthFeedbackTests.ts`
  - `tests/p127MartialSecondVisibleGrowthTests.ts`
  - `tests/p129OrdinaryOriginVisibleGrowthTests.ts`
  - `tests/hvgMerchantVisibleGrowthLoopTests.ts`
  - `tests/p20ReplayabilityTests.ts`
  - `tests/p41ChoiceFeedbackShapingTests.ts`
  - `tests/p41HabitFeedbackTests.ts`
  - `tests/p42ContentDensityTests.ts`
  - `tests/p43ArchetypeRecapEndingTests.ts`
  - `tests/p44HabitAuditTests.ts`
  - `tests/p45TrajectoryReplayTests.ts`
  - `tests/p45WealthEarlyAuditTests.ts`
  - `tests/p45ShapingBiasRegressionTests.ts`
  - `tests/p71ActiveActionExperienceTests.ts`
  - `tests/personalityHabitTrajectoryTests.ts`
  - `tests/testLifeMemorySummary.ts`
  - `src/p44/habitOperatorAudit.ts`
- Do not modify: historical reports、proof markdown、未被正式 gate 调用的生成 baseline，除非其 TypeScript 源本身阻止编译或正式测试运行。

**Interfaces:**
- Produces: Canonical test 注册为正式 suite。
- Produces: Consumer invariance tests，允许差异仅限显式 gate、反馈、trajectory、描述性 recap。

- [ ] **Step 1: 注册新测试并运行完整 gate 获取真实失败清单**

在 `tests/runRealTestGate.ts` 的 Canonical suites 尾部加入：

```ts
{ name: 'canonicalHabitPracticeNarrowingTests', entry: 'tests/canonicalHabitPracticeNarrowing.test.ts' },
```

Run:

```bash
npm test 2>&1 | tee /tmp/habit-practice-narrowing-npm-test.log
```

Expected: 新 Canonical suite 通过；旧 Pxx/HVG 测试可能因旧“塑形”“compatibility flag”“全局权重”断言失败。

- [ ] **Step 2: 按产品权限分类每个失败**

对日志中的每个失败使用以下唯一判定：

```text
保留：显式 Habit gate、显式 Habit producer、practice trajectory、描述性 recap。
反转：compatibility flag、echo 自动 producer、全局 scheduling、archetype、属性倾向、identity tone。
删除：只验证已删除旧接口存在的断言。
非本轮：familyBond/socialMomentum 行为原样保留。
```

不得为通过旧测试恢复任何已删除机制。

- [ ] **Step 3: 更新 Visible Growth 测试**

对于 P122/P127/HVG：

- 主动季度练功/读书/营商仍应产生对应领域“实践有所积累”反馈；
- 一个月跑腿不再产生 `businessHabit`；
- 不再期待 `training_habit/study_habit/business_habit`；
- route echo flag 的可见提示可以保留，但它与 Habit feedback 必须作为两条独立事实。

断言形态：

```ts
assert(result?.activeActionSummary.longTermImpactLines?.includes('练功实践有所积累') === true, 'explicit quarterly practice is visible');
assert(state.flags.training_habit === undefined, 'legacy habit flag is absent');
```

- [ ] **Step 4: 更新 P44 audit**

将 `src/p44/habitOperatorAudit.ts` 从旧机制 inventory 改为 Canonical operator audit：

- 删除 `LEGACY_HABIT_FLAGS` 及三个 legacy token；最终 repository guard 由 `tests/canonicalHabitPracticeNarrowing.test.ts` 承担；
- producer 只统计 `habitEffects`、`stateEffects`、`life_state_change`；
- consumer 只统计条件表达式与 `practiceTrajectorySummary`；
- 以函数名检测 `projectHabitCompatibilityFlags`、`mapLegacyHabitFlagToLifeState`、`buildShapingPatternEndingTone`；
- 检查 group multiplier、formal multiplier、growthPatternFlags、tendency multiplier 不读取三项 Canonical Habit。

`tests/p44HabitAuditTests.ts` 断言 blocker count 为 `0`，合法 producer/consumer 数量大于 `0`。

- [ ] **Step 5: 增加运行时不变量测试**

在 Canonical 测试中增加两个状态：

```ts
const low = withPracticeHabits(createState(), 0);
const high = withPracticeHabits(createState(), 5);
```

验证：

- 相同普通 DailyEvent 的私有 `getWeight`（通过测试内类型收窄访问）相等；
- `selectArchetypeFamily` 相等；
- `inferLivedSelfUnderstanding` 相等；
- `EndingSystem` 选出的 id/category/eligibility 相等；
- `deriveLifeMemorySummary(low)` 与 `high` 只允许 `habitTrajectory` 不同。

Life Memory 比较使用：

```ts
const stripTrajectory = (summary: ReturnType<typeof deriveLifeMemorySummary>) => {
  const clone = structuredClone(summary);
  delete clone.habitTrajectory;
  return clone;
};
assertDeepEqual(stripTrajectory(lowMemory), stripTrajectory(highMemory), 'Habit-only change must not alter other memory fields');
```

对于显式 Habit gate，单独断言低值不合格、高值合格，例如 `p26_training_habit_midlife_callback`。

- [ ] **Step 6: 重复运行 npm test 直到正式 gate 全绿**

```bash
npm test
```

Expected: exit `0`，日志不包含 blocker keyword。

- [ ] **Step 7: 提交**

仅添加本任务实际因正式 gate 修改的文件：

```bash
git add tests/runRealTestGate.ts tests/canonicalHabitPracticeNarrowing.test.ts
git add tests/p122EarlyVisibleGrowthFeedbackTests.ts tests/p127MartialSecondVisibleGrowthTests.ts
git add tests/hvgMerchantVisibleGrowthLoopTests.ts tests/p41ChoiceFeedbackShapingTests.ts
git add tests/p44HabitAuditTests.ts tests/p45TrajectoryReplayTests.ts tests/p45WealthEarlyAuditTests.ts
git add src/p44/habitOperatorAudit.ts
git commit -m "test: close canonical practice habit migration"
```

若清单中的某个文件未修改，不要将其加入 `git add`。

---

### Task 9: 写入 Canonical 文档、Repository Guard 与最终验证

**Files:**
- Create: `docs/superpowers/specs/2026-07-27-habit-practice-narrowing-design.md`
- Create: `docs/superpowers/plans/2026-07-27-habit-practice-narrowing.md`
- Modify: `docs/product/player-model.md:100-110`
- Modify: `tests/canonicalHabitPracticeNarrowing.test.ts`

**Interfaces:**
- Produces: 长期产品语义写入最高权威文档。
- Produces: 窄范围 repository guard，防止禁止机制回流但允许合法 event IDs 与 Canonical keys。

- [ ] **Step 1: 将批准设计和计划写入仓库**

复制用户确认的设计文档为：

```text
docs/superpowers/specs/2026-07-27-habit-practice-narrowing-design.md
```

保存本计划为：

```text
docs/superpowers/plans/2026-07-27-habit-practice-narrowing.md
```

- [ ] **Step 2: 更新 player-model.md**

在 Discipline/Indulgence 后新增：

```markdown
### Training / Study / Business Habit

`trainingHabit`、`studyHabit` 与 `businessHabit` 是对应领域长期重复实践的累计记录，值域为 `0～5`。它们记录已经发生的持续实践历史，不表示 Trait、能力属性、路线投入、职业身份、人物原型或当前状态，也不进行年度或时间自动衰减。

三项 Habit 只能由具体主动行动或事件内容显式增加。禁止根据 Action category、Event tag、属性或金钱收益、成功失败、Trait、route flag、echo flag 或通用 repeat hook 自动推导。`training_habit`、`study_habit` 与 `business_habit` 不属于正式玩家状态，也不得与 Canonical Habit 相互生成或同步。

三项 Habit 只允许用于明确依赖长期实践的具体内容资格，以及玩家可见的实践积累、Life Memory 实践轨迹和纯描述性结局回顾。它们不得参与 DailyEvent 或 Formal Event 全局权重、普通 outcome 权重、人物原型、whole-life pacing、属性倾向、人生评价、身份判断、Ending 分类或资格。

Habit 可以开启一个新的路线选择机会，但不能单独证明玩家已经拥有该路线或身份。身份型内容必须使用明确路线/身份事实，并在确有必要时同时要求 Habit 门槛。
```

- [ ] **Step 3: 完成 repository guard**

在 Canonical 测试的 source walker 中加入精确禁止规则：

```ts
const forbiddenMechanisms: Array<{ pattern: RegExp; message: string }> = [
  { pattern: /\btraining_habit\b(?![a-z0-9_])/, message: 'legacy training_habit flag' },
  { pattern: /\bstudy_habit\b(?![a-z0-9_])/, message: 'legacy study_habit flag' },
  { pattern: /\bbusiness_habit\b(?![a-z0-9_])/, message: 'legacy business_habit flag' },
  { pattern: /projectHabitCompatibilityFlags/, message: 'habit compatibility projection' },
  { pattern: /mapLegacyHabitFlagToLifeState/, message: 'legacy habit flag mapping' },
  { pattern: /buildShapingPatternEndingTone/, message: 'identity ending tone' },
];
```

对三项 legacy flag 使用 token-aware 扫描：允许它们作为较长事件 ID 的中间片段，例如 `p42_training_habit_youth_sparring`；禁止单独字符串 key、属性访问或 flag 条件。

另外按函数区间检查：

```text
getGroupStateMultiplier 不得包含 trainingHabit/studyHabit/businessHabit
getFormalEventStateMultiplier 不得包含 trainingHabit/studyHabit/businessHabit
tendencyContextMultiplier 不得包含 trainingHabit/studyHabit/businessHabit
wuxiaReplayabilitySurfaces.growthPatternFlags 不得包含 legacy habit flags
```

扫描范围：

```text
src/**/*.ts
src/**/*.tsx
src/**/*.json
```

不扫描：

```text
tests/
docs/
reports/
proof/
生成物
```

- [ ] **Step 4: 运行格式与源码检查**

```bash
git diff --check
npx tsx tests/canonicalHabitPracticeNarrowing.test.ts
```

Expected: exit `0`。

- [ ] **Step 5: 运行正式验证基线**

```bash
npm test
npm run test:headless
npm run test:contracts
```

Expected:

```text
npm test               exit 0
npm run test:headless  exit 0
npm run test:contracts exit 0
```

- [ ] **Step 6: 运行 TypeScript 与 build，严格核对仅剩旧债务**

```bash
npm run typecheck 2>&1 | tee /tmp/habit-typecheck.log
npm run typecheck:p6b 2>&1 | tee /tmp/habit-typecheck-p6b.log
npm run build 2>&1 | tee /tmp/habit-build.log
```

允许失败，但诊断集合必须精确只包含：

```text
src/core/RouteStateManager.ts:248
src/core/RouteStateManager.ts:249
```

若出现其他错误，修复本迁移引入的问题后重新执行；不得修改两条旧 Route Lifecycle 诊断。

- [ ] **Step 7: 最终源码扫描**

```bash
rg -n \
  'projectHabitCompatibilityFlags|mapLegacyHabitFlagToLifeState|buildShapingPatternEndingTone' \
  src
```

Expected: 无输出。

```bash
rg -n 'flags\.has\("(training_habit|study_habit|business_habit)"\)' src
rg -n '"(training_habit|study_habit|business_habit)"\s*:' src
rg -n "'(training_habit|study_habit|business_habit)'\s*:" src
rg -n '\.(training_habit|study_habit|business_habit)\b' src
```

Expected: 无作为 flag key 的输出；包含这些片段的事件 ID 不属于命中目标。

- [ ] **Step 8: 提交文档与最终 guard**

```bash
git add \
  docs/product/player-model.md \
  docs/superpowers/specs/2026-07-27-habit-practice-narrowing-design.md \
  docs/superpowers/plans/2026-07-27-habit-practice-narrowing.md \
  tests/canonicalHabitPracticeNarrowing.test.ts
git commit -m "docs: codify canonical practice habit boundary"
```

- [ ] **Step 9: 验证提交范围**

```bash
git status --short
git log --oneline --decorate -10
git diff --check HEAD~9..HEAD
```

Expected:

- 隔离 worktree 干净；
- 不包含用户原 dirty report 或 `package-project.sh`；
- 提交序列只涉及本计划范围；
- `git diff --check` 退出码 `0`。

---

## Final Acceptance Checklist

- [ ] 三项 Habit 字段仍存在且 clamp `0～5`。
- [ ] 主动行动只通过 `habitEffects` 显式增加 Habit。
- [ ] 一季度练功、读书、营商与明确季度儿童实践可以增加；院中玩耍和一个月跑腿不增加。
- [ ] Formal Event 不再按 tag/收益自动增加 Habit。
- [ ] 四个已否决显式 producer 已删除。
- [ ] DailyEvent `longTermHooks` 已删除，Habit `preferredStates` 软权重已删除。
- [ ] `daily_training_bottleneck_pos_1` 的显式 producer 保留。
- [ ] 三个 legacy habit flag 不再产生、读取、投影或持久化。
- [ ] Habit 不参与 Daily/Formal 全局权重。
- [ ] Habit 不参与 P20 archetype、replay pacing、main-screen tendency 或 self identity。
- [ ] Life Memory 只保留三项“实践”轨迹。
- [ ] Ending 只保留纯描述性实践 recap，身份化 tone helper 已删除。
- [ ] Snapshot 为 `3.7.0`，旧版本和嵌套 legacy flags 均严格拒绝。
- [ ] `familyBond / socialMomentum` 未被本阶段裁决或顺带迁移。
- [ ] `npm test`、`npm run test:headless`、`npm run test:contracts` 均 exit `0`。
- [ ] typecheck/build 除 `RouteStateManager.ts:248-249` 外无其他诊断。
