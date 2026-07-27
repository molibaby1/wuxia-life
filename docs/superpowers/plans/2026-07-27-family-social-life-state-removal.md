# Family / Social Life-State Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 从 Canonical Player State 彻底删除 `familyBond / socialMomentum`，移除它们的隐式 producer、全局 consumer、身份塑形和 Ending 权限，并把仍有价值的内容改为明确属性／事实条件，Snapshot 升级到 `3.8.0`。

**Architecture:** 保留 `player.lifeStates` 容器，但其正式 key 只剩 `trainingHabit / studyHabit / businessHabit`。实施顺序先切断 Trait、Active Action、Daily/Formal Event 和展示层对两个旧轴的生产与消费，再迁移六个社交事件、删除五个无事实前提的家庭事件，随后清理历史验证资产并收窄类型，最后完成 Snapshot `3.8.0`、Canonical guard、文档和全量验证。

**Tech Stack:** TypeScript 5.9、Vue 3、Vite 7、`tsx` 自定义测试门、JSON 事件资产、Headless Snapshot Contract。

## Global Constraints

- 权威层级必须遵守：`docs/product/player-model.md` > `docs/governance/project-convergence.md` > `AGENTS.md` > `docs/README.md` > 当前 Contract / Schema > 当前代码和测试。
- 本轮只治理 `familyBond / socialMomentum` 及其直接 producer、consumer、Snapshot、UI、内容条件和验证资产。
- 删除后 `PlayerLifeStates` 只包含 `trainingHabit / studyHabit / businessHabit`；三项 Habit 不获得任何新权限。
- 不建立 `familyLevel`、`socialLevel`、relationship level、Status、Trait level、Fact number、severity、stack、duration、shadow state 或其他替代隐藏轴。
- 不把旧值机械映射为 `connections`、`reputation`、Trait、Fact、relationship 或配偶／子女状态。
- 内容条件按具体语义逐项裁决；不得用统一阈值批量替换。
- Snapshot schema 必须从 `3.7.0` 升级到 `3.8.0`；`3.7.x` 及更早版本整体拒绝，不提供 migration、fallback、shadow field、清洗或重算。
- `3.8.0` 的 `player.lifeStates` 必须完整包含三个 Habit，且出现 `familyBond / socialMomentum` 或任意未知 key 时拒绝。
- 不修改 `src/core/RouteStateManager.ts:248-249` 两条已批准旧 Route Lifecycle 债务。
- 不泛化重构关系系统、Ending System、Pxx、HVG 或全部事件资产；只处理本轮字段的直接引用。
- 不处理 P25 中与本轮两个字段无关的旧 Habit 自动模拟问题。
- 执行前使用 `superpowers:using-git-worktrees` 建立隔离 worktree；不得在用户原 dirty checkout 中使用 `git add .`、`git add -A`、`git reset --hard` 或 `git clean -fd`。
- 不删除、恢复或提交用户原有六份 dirty test report 与 `package-project.sh`。
- 每个任务遵循测试先行；每个任务结束时只提交该任务明确列出的文件。

---

## File Responsibility Map

### 新增文件

- `tests/canonicalFamilySocialLifeStateRemoval.test.ts`：本轮 Canonical producer、consumer、内容、Snapshot 与 repository guard 主回归测试。
- `docs/superpowers/specs/2026-07-27-family-social-life-state-removal-design.md`：已批准设计文档。
- `docs/superpowers/plans/2026-07-27-family-social-life-state-removal.md`：本实施计划。

### 删除文件

- `src/utils/habitShapingSummary.ts`：仅服务于两个已删除的“半人格／塑形”轴。
- 仅用于证明两个旧轴塑形、echo、权重或身份作用且无三项 Habit 合法职责的历史 slice / proof 文件；具体在 Task 7 逐项确认后删除。

### 核心修改文件

- `src/types/eventTypes.ts`、`src/data/life/lifeStates.ts`：`PlayerLifeStates` 与 `LIFE_STATE_KEYS` 收窄为三个 Habit；删除 Trait life-state modifier contract 和 DailyEvent `preferredStates`。
- `src/core/TraitSystem.ts`、`src/data/traits/temperaments.ts`：删除 Trait 通用写入 lifeState 的能力。
- `src/core/activePlanning/ActivePlanningService.ts`：删除 `p9_echo_social_hook → socialMomentum` 和 shaping feedback。
- `src/data/life/dailyEvents.ts`、`src/core/DailyEventSystem.ts`：删除两个旧轴的 producer、soft weight、group multiplier 和 outcome bias。
- `src/core/GameEngineIntegration.ts`：删除时间衰减、Formal Event 全局 multiplier 与基于 tag／收益的自动 producer。
- `src/data/lines/relationship.json`、`src/data/lines/medical.json`：六个社交事件迁为明确属性／事实条件并清理旧轴措辞。
- `src/data/lines/family-life.json`、`src/data/event-asset-manifest.json`：保留两个家庭主事件但删除旧 effect；删除五个无具体事实前提事件及 manifest 条目。
- `src/components/mainScreenModel.ts`、`src/components/MainScreenLifeSummary.vue`、`src/components/GameScreen.vue`、`src/core/ChoiceFeedbackGenerator.ts`、`src/utils/playerFacingLabels.ts`、`src/p19/stateAccess.ts`、`src/core/EndingSystem.ts`：删除塑形 UI、身份推导、feedback flag 和 Ending 权限。
- `src/contracts/gameStateSnapshot.ts`、`src/contracts/validation/contractValidation.ts`、`src/headless/snapshot/SnapshotConverter.ts`、`src/contracts/fixtures/gameStateSnapshotAge50.ts`：Snapshot `3.8.0` 与三-key lifeStates 严格边界。
- `docs/product/player-model.md`、`docs/contracts/game-state-snapshot-contract.md`、`docs/contracts/save-schema-versioning-policy.md`：同步 Canonical 与 Snapshot 裁决。

### 直接受影响的历史资产与测试

- `src/p20/habitTrajectorySlice.ts`
- `src/p25/habitTrajectorySlice.ts`
- `src/p25/p30HabitLedSimulationBaselines.ts`
- `src/p25/p31HabitLedKeyChoiceBridges.ts`
- `src/p25/p31HabitLedSimulationBaselines.ts`
- `src/p25/p32BridgeParity.ts`
- `src/p25/p32HabitLedShortChainSlice.ts`
- `src/p25/p33HabitZeroOnRampSlice.ts`
- `src/p25/p34LifetimeBirthToDeathSlice.ts`
- `src/p25/p35MixedPinnacleLifetimeSlices.ts`
- `src/p25/p37AdditionalMixedPinnacleLifetimeSlices.ts`
- `src/p25/p39ContentPoolConsistencySlice.ts`
- `src/p25/validationSlices.ts`
- `src/p44/habitOperatorAudit.ts`
- `src/p45/wealthEarlyAudit.ts`
- `src/hvg/p129VisibleGrowthProofSlice.ts` 及其基线／测试
- 所有仅因 `PlayerLifeStates` 五-key fixture 而包含两个旧字段的测试文件

---

### Task 1: 切断 Trait 与 Active Action 隐式 Producer

**Files:**
- Create: `tests/canonicalFamilySocialLifeStateRemoval.test.ts`
- Modify: `src/types/eventTypes.ts:235-300`
- Modify: `src/data/traits/temperaments.ts:16-28`
- Modify: `src/core/TraitSystem.ts:67-100`
- Modify: `src/core/activePlanning/ActivePlanningService.ts:21-40,142-187,257-278`
- Modify: `tests/canonicalFatigueAnxietyStatusMigration.test.ts:20-45`

**Interfaces:**
- Keeps: `TraitConfig.eventBiases` and `autoChoiceBias`.
- Removes: `LifeStateModifier` from Trait configuration only; `DailyEventVariantConfig.stateEffects` and `EffectType.LIFE_STATE_CHANGE` remain.
- Guarantees: `p9_echo_social_hook` remains a specific history flag but never changes `player.lifeStates`.

- [ ] **Step 1: Write failing producer tests**

Create `tests/canonicalFamilySocialLifeStateRemoval.test.ts`:

```ts
import fs from 'node:fs';
import path from 'node:path';
import { assert, assertDeepEqual, GameTestFramework } from './GameTestFramework';
import { temperaments } from '../src/data/traits/temperaments';
import { executeActiveActionOnState } from '../src/core/activePlanning/ActivePlanningService';
import { createDefaultPlayerLifeStates } from '../src/data/life/lifeStates';
import type { GameState } from '../src/types/eventTypes';

const framework = new GameTestFramework();

function createState(): GameState {
  return (framework as unknown as { createTestState(): GameState }).createTestState();
}

function testTraitDoesNotWriteLifeState(): void {
  const affectionate = temperaments.find(item => item.id === 'affectionate');
  assert(affectionate !== undefined, 'affectionate temperament exists');
  assert(!('startingStates' in affectionate), 'affectionate must not initialize family state');

  const eventTypesSource = fs.readFileSync(path.resolve('src/types/eventTypes.ts'), 'utf8');
  const traitSystemSource = fs.readFileSync(path.resolve('src/core/TraitSystem.ts'), 'utf8');
  assert(!/startingStates\??:|stateBiases\??:/.test(eventTypesSource), 'Trait contract must not expose life-state modifiers');
  assert(!/startingStates|stateBiases/.test(traitSystemSource), 'TraitSystem must not apply life-state modifiers');
}

function testSocialEchoRemainsFactOnly(): void {
  const state = createState();
  state.flags = {};
  state.player.flags = {};
  state.player.lifeStates = createDefaultPlayerLifeStates();

  executeActiveActionOnState(state, 'action_socializing_basic', {
    random: () => 0.5,
    includeDisturbance: false,
  });

  assert(state.flags.p9_echo_social_hook === true, 'social echo history fact remains');
  assertDeepEqual(state.player.lifeStates, createDefaultPlayerLifeStates(), 'social echo must not change lifeStates');

  const source = fs.readFileSync(path.resolve('src/core/activePlanning/ActivePlanningService.ts'), 'utf8');
  assert(!source.includes('mapEchoFlagToLifeState'), 'echo-to-life-state mapper must be removed');
  assert(!source.includes('collectShapingLongTermImpactLines'), 'active action must not emit shaping impacts');
}

export function runCanonicalFamilySocialLifeStateRemovalTests(): void {
  testTraitDoesNotWriteLifeState();
  testSocialEchoRemainsFactOnly();
}

runCanonicalFamilySocialLifeStateRemovalTests();
console.log('canonicalFamilySocialLifeStateRemoval.test.ts passed');
```

- [ ] **Step 2: Run the new test and verify failure**

Run:

```bash
npx tsx tests/canonicalFamilySocialLifeStateRemoval.test.ts
```

Expected: FAIL because `affectionate.startingStates`, `mapEchoFlagToLifeState`, or shaping impact collection still exists.

- [ ] **Step 3: Remove Trait life-state modifier contract**

In `src/types/eventTypes.ts` delete:

```ts
export interface LifeStateModifier {
  state: LifeStateKey;
  value: number;
}
```

Then remove only these Trait properties:

```ts
CoreTalentConfig.stateBiases
WeaknessConfig.stateBiases
TemperamentConfig.startingStates
```

Keep the life-state effect shape required by DailyEvent as a dedicated interface:

```ts
export interface LifeStateEffect {
  state: LifeStateKey;
  value: number;
}
```

Update:

```ts
DailyEventVariantConfig.stateEffects?: LifeStateEffect[];
```

Do not widen `state` to `string`.

- [ ] **Step 4: Remove the affectionate producer and TraitSystem branches**

In `src/data/traits/temperaments.ts`, remove:

```ts
startingStates: [{ state: 'familyBond', value: 1 }],
```

In `src/core/TraitSystem.ts`, delete both loops that apply `startingStates` and `stateBiases`. Keep initial stat application unchanged.

- [ ] **Step 5: Remove Active Action echo mapping and shaping output**

In `src/core/activePlanning/ActivePlanningService.ts`:

1. Delete the import of `collectShapingLongTermImpactLines`.
2. Delete `mapEchoFlagToLifeState()`.
3. Inside `onCompleteFlags`, keep flag writes but delete `touchedLifeStates`, mapper calls and the second loop that increments a life state.
4. Keep explicit `habitEffects` application unchanged.
5. Change long-term lines to:

```ts
const lines = collectPracticeImpactLines(beforeLifeStates, afterLifeStates);
```

- [ ] **Step 6: Update fatigue/anxiety test assumptions**

`tests/canonicalFatigueAnxietyStatusMigration.test.ts` currently checks `stateBiases`. Replace those assertions with a source-level assertion that no Trait configuration contains numeric fatigue/anxiety producer language, without reading removed properties:

```ts
const traitSources = [
  'src/data/traits/coreTalents.ts',
  'src/data/traits/weaknesses.ts',
  'src/data/traits/temperaments.ts',
].map(file => fs.readFileSync(path.resolve(file), 'utf8')).join('\n');
assert(!/stateBiases|startingStates/.test(traitSources), 'Trait configs must not write lifeStates');
```

- [ ] **Step 7: Run focused tests**

Run:

```bash
npx tsx tests/canonicalFamilySocialLifeStateRemoval.test.ts
npx tsx tests/canonicalFatigueAnxietyStatusMigration.test.ts
npx tsx tests/canonicalHabitPracticeNarrowing.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add tests/canonicalFamilySocialLifeStateRemoval.test.ts \
  tests/canonicalFatigueAnxietyStatusMigration.test.ts \
  src/types/eventTypes.ts \
  src/data/traits/temperaments.ts \
  src/core/TraitSystem.ts \
  src/core/activePlanning/ActivePlanningService.ts
git commit -m "refactor: remove trait and echo life-state producers"
```

---

### Task 2: 删除 DailyEvent 旧轴 Producer 与软权重 Contract

**Files:**
- Modify: `tests/canonicalFamilySocialLifeStateRemoval.test.ts`
- Modify: `src/types/eventTypes.ts:330-370`
- Modify: `src/data/life/dailyEvents.ts:208-507`
- Modify: `src/core/DailyEventSystem.ts:72-105,235-303`
- Modify: `tests/canonicalDisciplineIndulgenceRemoval.test.ts`
- Modify: `tests/canonicalHabitPracticeNarrowing.test.ts`

**Interfaces:**
- Removes: `DailyEventConfig.preferredStates`.
- Keeps: `conditions`, Trait/origin preference, recent-repeat penalty, explicit three-Habit `stateEffects`.
- Guarantees: ordinary DailyEvent eligibility, base weight and outcome weight do not read deleted axes.

- [ ] **Step 1: Extend failing DailyEvent tests**

Append to the canonical test:

```ts
import { dailyEvents } from '../src/data/life/dailyEvents';
import { dailyEventSystem } from '../src/core/DailyEventSystem';

function findDailyEvent(id: string) {
  const event = dailyEvents.find(item => item.id === id);
  if (!event) throw new Error(`daily event not found: ${id}`);
  return event;
}

function testDailyEventsDoNotUseDeletedAxes(): void {
  for (const event of dailyEvents) {
    assert(!('preferredStates' in event), `${event.id} must not expose preferredStates`);
    for (const variant of Object.values(event.variants).flat()) {
      assert(
        !(variant.stateEffects ?? []).some(effect =>
          effect.state === ('familyBond' as never) || effect.state === ('socialMomentum' as never)),
        `${variant.id} must not produce deleted life states`,
      );
    }
  }

  const source = fs.readFileSync(path.resolve('src/core/DailyEventSystem.ts'), 'utf8');
  assert(!source.includes('preferredStates'), 'DailyEventSystem must not interpret preferredStates');
  assert(!source.includes('getGroupStateMultiplier'), 'deleted axes must not drive group multipliers');
  assert(!/socialMomentum|familyBond/.test(source), 'DailyEventSystem must not read deleted axes');
}

function testDailyWeightsAreAxisIndependent(): void {
  const state = createState();
  state.player.age = 30;
  state.player.lifeStates = createDefaultPlayerLifeStates() as GameState['player']['lifeStates'];
  const config = findDailyEvent('daily_take_odd_job');
  const getWeight = (dailyEventSystem as unknown as {
    getWeight(config: typeof config, state: GameState): number;
  }).getWeight.bind(dailyEventSystem);
  const base = getWeight(config, state);

  const legacyInjected = structuredClone(state) as GameState;
  (legacyInjected.player.lifeStates as unknown as Record<string, number>).socialMomentum = 5;
  (legacyInjected.player.lifeStates as unknown as Record<string, number>).familyBond = 5;
  assert(getWeight(config, legacyInjected) === base, 'legacy injected axes must not affect daily weight');
}
```

Call both functions from the runner.

- [ ] **Step 2: Verify failure**

```bash
npx tsx tests/canonicalFamilySocialLifeStateRemoval.test.ts
```

Expected: FAIL on `preferredStates`, state effects or source references.

- [ ] **Step 3: Remove `preferredStates` from the Contract and content**

Delete `DailyEventConfig.preferredStates` from `src/types/eventTypes.ts`.

In `src/data/life/dailyEvents.ts`, delete all `preferredStates` properties, including the empty array on `daily_second_guess`.

- [ ] **Step 4: Remove five DailyEvent old-axis effects**

Delete only these state effects:

```text
daily_take_odd_job_pos_1     → socialMomentum +1
daily_small_trade_pos_1      → socialMomentum +1
daily_home_letter_pos_1      → familyBond +1
daily_shared_meal_pos_1      → familyBond +1
daily_household_burden_pos_1 → familyBond +1
```

Keep their money, Status and narrative effects unchanged. In `daily_shared_meal_pos_1`, preserve:

```ts
effects: [{ type: EffectType.STATUS_REMOVE, status: 'fatigued' }]
```

- [ ] **Step 5: Remove DailyEvent consumer code**

In `src/core/DailyEventSystem.ts`:

1. Delete the loop over `config.preferredStates`.
2. Delete `weight *= this.getGroupStateMultiplier(config, state)`.
3. Delete `positive += socialMomentum * 0.08` and its local variable.
4. Delete `getGroupStateMultiplier()` entirely.
5. Keep `clampMultiplier()` because `getRecentRepeatPenalty()` still uses it.

- [ ] **Step 6: Update existing Canonical tests for removed Contract**

In `tests/canonicalDisciplineIndulgenceRemoval.test.ts`, remove helpers that access `.preferredStates`; replace them with:

```ts
for (const event of dailyEvents) {
  assert(!('preferredStates' in event), `${event.id} must not expose removed preferredStates contract`);
}
```

In `tests/canonicalHabitPracticeNarrowing.test.ts`, replace the Habit-specific preferredStates loop with the same contract-absence assertion.

- [ ] **Step 7: Run focused tests**

```bash
npx tsx tests/canonicalFamilySocialLifeStateRemoval.test.ts
npx tsx tests/canonicalDisciplineIndulgenceRemoval.test.ts
npx tsx tests/canonicalHabitPracticeNarrowing.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add tests/canonicalFamilySocialLifeStateRemoval.test.ts \
  tests/canonicalDisciplineIndulgenceRemoval.test.ts \
  tests/canonicalHabitPracticeNarrowing.test.ts \
  src/types/eventTypes.ts \
  src/data/life/dailyEvents.ts \
  src/core/DailyEventSystem.ts
git commit -m "refactor: remove daily family and social axis wiring"
```

---

### Task 3: 删除 Formal Event 自动 Producer、调度与时间衰减

**Files:**
- Modify: `tests/canonicalFamilySocialLifeStateRemoval.test.ts`
- Modify: `src/core/GameEngineIntegration.ts:1410-1460,1880-2000,2206-2374`
- Modify: affected tests that directly invoke removed private methods, found by the command in Step 1

**Interfaces:**
- Removes: `applyLifeStateRecovery`, `getFormalEventStateMultiplier`, `applyFormalEventConsequences` if no other behavior remains.
- Keeps: specialization multiplier, origin multiplier, Trait event biases, explicit event effects.

- [ ] **Step 1: Locate direct test dependencies**

Run:

```bash
rg -n "applyLifeStateRecovery|getFormalEventStateMultiplier|applyFormalEventConsequences" tests src --glob '*.{ts,tsx}'
```

Record every test hit in the task notes. Do not modify unrelated callers.

- [ ] **Step 2: Add failing source-boundary tests**

Append:

```ts
function testFormalRuntimeDoesNotUseDeletedAxes(): void {
  const source = fs.readFileSync(path.resolve('src/core/GameEngineIntegration.ts'), 'utf8');
  assert(!source.includes('applyLifeStateRecovery'), 'time advancement must not decay deleted axes');
  assert(!source.includes('getFormalEventStateMultiplier'), 'formal scheduling must not use deleted axes');
  assert(!source.includes('applyFormalEventConsequences'), 'formal results must not synthesize deleted axes');
  assert(!/socialGain|familyGain/.test(source), 'tag/stat gain thresholds must not synthesize life states');
}
```

Call it from the runner.

- [ ] **Step 3: Verify failure**

```bash
npx tsx tests/canonicalFamilySocialLifeStateRemoval.test.ts
```

Expected: FAIL because all three methods still exist.

- [ ] **Step 4: Remove time-decay mechanism**

In the time-advance path, delete:

```ts
this.applyLifeStateRecovery(value, unit);
```

Delete the entire `applyLifeStateRecovery()` method. Do not add time decay for the three Habits.

- [ ] **Step 5: Remove Formal Event state multiplier**

At both event-weight call sites, change:

```ts
const stateAdjusted = originAdjusted * this.getFormalEventStateMultiplier(event);
```

into direct use of `originAdjusted` in the next multiplier step. For example:

```ts
const specializationAdjusted = originAdjusted * this.getSpecializationMultiplier(event);
```

Delete `getFormalEventStateMultiplier()` entirely. Do not replace it with `connections`, `reputation`, Trait or flags.

- [ ] **Step 6: Remove automatic consequence wrapper**

At both result-application call sites, stop passing the updated state through `applyFormalEventConsequences()`:

```ts
const adjustedState = updatedState;
```

or return/use `updatedState` directly, following the surrounding variable style.

Delete `applyFormalEventConsequences()` entirely. Preserve `pendingEventOutcomeNote` behavior only if another mechanism still writes it; otherwise keep its existing reset at the normal event-execution boundary rather than retaining an empty consequence method.

- [ ] **Step 7: Update direct tests**

For every test found in Step 1:

- remove expectations that time reduces `familyBond / socialMomentum`;
- remove expectations that tags or stat gains create either state;
- replace with a source-boundary or state equality assertion that no life state changes unless the event explicitly declares `life_state_change`.

- [ ] **Step 8: Run focused tests and TypeScript check**

```bash
npx tsx tests/canonicalFamilySocialLifeStateRemoval.test.ts
npx tsx tests/canonicalHabitPracticeNarrowing.test.ts
npx tsc --noEmit --pretty false
```

Expected: focused tests PASS; `npx tsc --noEmit` PASS.

- [ ] **Step 9: Commit**

```bash
git add tests/canonicalFamilySocialLifeStateRemoval.test.ts \
  src/core/GameEngineIntegration.ts
# add only the direct tests identified in Step 1
git commit -m "refactor: remove formal family and social axis mechanics"
```

---

### Task 4: 迁移六个社交事件到明确属性与事实条件

**Files:**
- Modify: `tests/canonicalFamilySocialLifeStateRemoval.test.ts`
- Modify: `src/data/lines/relationship.json:365-550`
- Modify: `src/data/lines/medical.json:130-180`
- Modify: `tests/personalityHabitTrajectoryTests.ts`
- Modify: `tests/p42ContentDensityTests.ts`
- Modify: any focused P28/P29/P42 test that asserts old `socialMomentum` gates

**Interfaces:**
- Keeps event IDs and existing outcome effects/flags.
- Replaces only eligibility and old-axis wording.
- Uses existing expression syntax: `flags.<name> == true`, `connections`, `reputation`.

- [ ] **Step 1: Add exact content-contract tests**

Append helpers:

```ts
import { EventLoader } from '../src/core/EventLoader';

function eventExpression(eventId: string): string {
  const event = EventLoader.getInstance().getEventById(eventId);
  if (!event) throw new Error(`event not found: ${eventId}`);
  const expression = event.conditions?.find(item => item.type === 'expression')?.expression;
  if (!expression) throw new Error(`expression condition missing: ${eventId}`);
  return expression.replace(/\s+/g, ' ').trim();
}

function eventText(eventId: string): string {
  const event = EventLoader.getInstance().getEventById(eventId);
  if (!event) throw new Error(`event not found: ${eventId}`);
  return JSON.stringify(event);
}

function testSocialEventsUseConcretePrerequisites(): void {
  assert(
    eventExpression('p42_social_momentum_youth_introduction') ===
      'connections >= 5 || reputation >= 10',
    'youth introduction uses real social resources',
  );
  assert(
    eventExpression('p28_social_momentum_network_fork') ===
      'connections >= 10 || flags.p42_social_youth_intro_accepted == true',
    'network fork uses connections or explicit introduction history',
  );
  assert(
    eventExpression('p28_social_reputation_reinforcement') ===
      'flags.p28_social_network_opened == true',
    'reputation reinforcement is a direct chain follow-up',
  );
  assert(
    eventExpression('p29_social_momentum_patron_obligation') ===
      'flags.ally_network == true',
    'patron obligation requires an established ally network',
  );
  assert(
    eventExpression('p42_social_momentum_later_testimonial') ===
      'reputation >= 20 && (flags.p28_social_reputation_reinforced == true || flags.p29_social_patron_obligation_taken == true)',
    'late testimonial requires reputation and explicit history',
  );
  assert(
    eventExpression('p29_social_momentum_healer_network') ===
      'flags.medical_talent == true && (connections >= 10 || reputation >= 10)',
    'healer network requires medical fact and real reach',
  );

  for (const id of [
    'p42_social_momentum_youth_introduction',
    'p28_social_momentum_network_fork',
    'p28_social_reputation_reinforcement',
    'p29_social_momentum_patron_obligation',
    'p42_social_momentum_later_testimonial',
    'p29_social_momentum_healer_network',
  ]) {
    assert(!/socialMomentum|社交势能|半性格轴|长期塑形/.test(eventText(id)), `${id} copy must use concrete semantics`);
  }
}
```

Call the test from the runner.

- [ ] **Step 2: Verify failure**

```bash
npx tsx tests/canonicalFamilySocialLifeStateRemoval.test.ts
```

Expected: FAIL on old expressions and metadata/copy.

- [ ] **Step 3: Update the five relationship events**

In `src/data/lines/relationship.json`, set the exact expressions from Step 1.

Update copy without changing event outcomes:

- `p42_social_momentum_youth_introduction`: describe an introduction caused by existing contacts or reputation; ensure the accepting choice sets `p42_social_youth_intro_accepted` if it does not already.
- `p28_social_momentum_network_fork`: replace “半性格轴／社交势能” with “已有门路与引见经历”。
- `p28_social_reputation_reinforcement`: describe the consequence of `p28_social_network_opened`.
- `p29_social_momentum_patron_obligation`: describe an obligation arising from `ally_network`.
- `p42_social_momentum_later_testimonial`: describe long-term reputation plus concrete prior service.

Do not rename event IDs in this migration; IDs are historical identifiers, not player-state fields.

- [ ] **Step 4: Update the medical crossover event**

In `src/data/lines/medical.json`:

```json
{
  "type": "expression",
  "expression": "flags.medical_talent == true && (connections >= 10 || reputation >= 10)"
}
```

Remove `semi_personality` from metadata tags and replace authoring notes with a concrete medical/reputation description. Do not set `medical_talent` as an effect merely to satisfy its own prerequisite; keep or remove the existing redundant effect according to current event authoring rules, but the event must require the fact before eligibility.

- [ ] **Step 5: Rewrite focused tests instead of preserving old axis tests**

In `tests/personalityHabitTrajectoryTests.ts`:

- delete `assertSemiPersonalityGatedEvent` and all calls for these six events;
- add focused expression/eligibility assertions matching Step 1;
- retain tests for the three legal Habit axes.

In `tests/p42ContentDensityTests.ts`:

- remove `socialMomentum` and `familyBond` from `AXES`;
- keep P42 event density assertions only for the three Habit axes;
- add direct presence assertions for the two retained P42 social events rather than treating them as axis-band samples.

- [ ] **Step 6: Run focused content tests**

```bash
npx tsx tests/canonicalFamilySocialLifeStateRemoval.test.ts
npx tsx tests/personalityHabitTrajectoryTests.ts
npx tsx tests/p42ContentDensityTests.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add tests/canonicalFamilySocialLifeStateRemoval.test.ts \
  tests/personalityHabitTrajectoryTests.ts \
  tests/p42ContentDensityTests.ts \
  src/data/lines/relationship.json \
  src/data/lines/medical.json
git commit -m "refactor: replace social axis gates with concrete prerequisites"
```

---

### Task 5: 删除家庭旧轴 Effects 与五个无事实前提事件

**Files:**
- Modify: `tests/canonicalFamilySocialLifeStateRemoval.test.ts`
- Modify: `src/data/lines/family-life.json:163-510,863-1235`
- Modify: `src/data/event-asset-manifest.json`
- Modify: `src/p20/habitTrajectorySlice.ts`
- Modify: `src/p25/habitTrajectorySlice.ts`
- Modify: `tests/personalityHabitTrajectoryTests.ts`
- Modify: `tests/p42ContentDensityTests.ts`
- Modify: focused manifest/content tests that enumerate the five deleted ids

**Interfaces:**
- Keeps: `family_child_born`, `family_crisis`, spouse/children/flags, money/stat/status outcomes.
- Deletes from active pool: five specified family-axis events.
- Does not introduce parent/sibling/clan model.

- [ ] **Step 1: Add failing family-content tests**

Append:

```ts
function eventHasLifeStateTarget(eventId: string, target: string): boolean {
  const event = EventLoader.getInstance().getEventById(eventId);
  if (!event) throw new Error(`event not found: ${eventId}`);
  const effects = [
    ...(event.autoEffects ?? []),
    ...(event.choices ?? []).flatMap(choice => choice.effects ?? []),
  ];
  return effects.some(effect => effect.type === 'life_state_change' && effect.target === target);
}

function testFamilyContentRemoval(): void {
  assert(!eventHasLifeStateTarget('family_child_born', 'familyBond'), 'child birth uses children and has_child only');
  assert(!eventHasLifeStateTarget('family_crisis', 'familyBond'), 'family crisis uses concrete outcomes only');

  for (const id of [
    'p28_family_bond_elder_care',
    'p28_family_bond_sibling_support',
    'p28_family_bond_caretaker_obligation',
    'p42_family_bond_festival_reunion',
    'p42_family_bond_estate_trust',
  ]) {
    assert(EventLoader.getInstance().getEventById(id) === undefined, `${id} must not be in the active event pool`);
  }

  const manifest = fs.readFileSync(path.resolve('src/data/event-asset-manifest.json'), 'utf8');
  assert(!/p28_family_bond_|p42_family_bond_/.test(manifest), 'deleted family-axis events must leave manifest');
}
```

Call it from the runner.

- [ ] **Step 2: Verify failure**

```bash
npx tsx tests/canonicalFamilySocialLifeStateRemoval.test.ts
```

Expected: FAIL because effects and events remain.

- [ ] **Step 3: Remove `familyBond` effects from retained events**

In `family_child_born`:

- delete all three `life_state_change → familyBond` effects;
- change `child_born_care` choice text from `财富 -20, 家庭牵绊 +2` to `财富 -20`;
- preserve `children +1` and `has_child` in every choice.

In `family_crisis`:

- delete `familyBond +1` from the first choice and `familyBond -1` from the third;
- remove family-bond deltas from choice text;
- preserve money, reputation and `anxious` effects.

- [ ] **Step 4: Delete the five unsupported family events**

Delete complete JSON objects for:

```text
p28_family_bond_elder_care
p28_family_bond_sibling_support
p28_family_bond_caretaker_obligation
p42_family_bond_festival_reunion
p42_family_bond_estate_trust
```

Validate JSON immediately:

```bash
node -e "JSON.parse(require('fs').readFileSync('src/data/lines/family-life.json','utf8')); console.log('family-life json ok')"
```

Expected: `family-life json ok`.

- [ ] **Step 5: Remove manifest entries**

Delete only the five matching objects from `src/data/event-asset-manifest.json` and validate JSON:

```bash
node -e "JSON.parse(require('fs').readFileSync('src/data/event-asset-manifest.json','utf8')); console.log('manifest json ok')"
```

- [ ] **Step 6: Remove direct historical expectations**

From `src/p20/habitTrajectorySlice.ts`, remove the five family event ids from any catalog arrays and remove sample branches that construct `familyBond` solely to prove them.

From `src/p25/habitTrajectorySlice.ts`, remove findings for the five events. Do not remove training/study/business findings.

Update `tests/personalityHabitTrajectoryTests.ts` and `tests/p42ContentDensityTests.ts` to assert absence rather than threshold eligibility.

- [ ] **Step 7: Run focused tests**

```bash
npx tsx tests/canonicalFamilySocialLifeStateRemoval.test.ts
npx tsx tests/personalityHabitTrajectoryTests.ts
npx tsx tests/p42ContentDensityTests.ts
npm run validate:event-quality
```

Expected: tests PASS. Event-quality may still report pre-existing blockers/majors, but must not report malformed JSON, missing manifest consistency caused by this task, or forbidden life-state targets.

- [ ] **Step 8: Commit**

```bash
git add tests/canonicalFamilySocialLifeStateRemoval.test.ts \
  tests/personalityHabitTrajectoryTests.ts \
  tests/p42ContentDensityTests.ts \
  src/data/lines/family-life.json \
  src/data/event-asset-manifest.json \
  src/p20/habitTrajectorySlice.ts \
  src/p25/habitTrajectorySlice.ts
git commit -m "refactor: remove unsupported family axis content"
```

---

### Task 6: 删除塑形 UI、Feedback、身份推导与 Ending 权限

**Files:**
- Modify: `tests/canonicalFamilySocialLifeStateRemoval.test.ts`
- Delete: `src/utils/habitShapingSummary.ts`
- Modify: `src/core/ChoiceFeedbackGenerator.ts`
- Modify: `src/utils/playerFacingLabels.ts`
- Modify: `src/components/mainScreenModel.ts`
- Modify: `src/components/MainScreenLifeSummary.vue`
- Modify: `src/components/GameScreen.vue`
- Modify: `src/contracts/sessionProgression.ts:80-105`
- Modify: `src/p19/stateAccess.ts:88-113`
- Modify: `src/core/EndingSystem.ts:84-115,561-677`
- Modify: `tests/p41ChoiceFeedbackShapingTests.ts`
- Modify: `tests/p41HabitFeedbackTests.ts`
- Modify: `tests/mainScreenModel.test.ts`
- Modify: `tests/testLifeMemorySummary.ts`
- Modify: `tests/testRoadEndings.ts`
- Modify: `tests/p43ArchetypeRecapEndingTests.ts`

**Interfaces:**
- Removes: `MainScreenModel.shapingSummary` and Vue prop/row.
- Keeps: route, identity, experience, risk, tendency and practice trajectory surfaces.
- Ending family anchor becomes only `Boolean(spouse) || children > 0`.

- [ ] **Step 1: Add failing UI/identity/Ending tests**

Append:

```ts
import { buildMainScreenModel } from '../src/components/mainScreenModel';
import { inferLivedSelfUnderstanding } from '../src/p19/stateAccess';
import { EndingSystem } from '../src/core/EndingSystem';
import { generateChoiceFeedback } from '../src/core/ChoiceFeedbackGenerator';
import { LIFE_MEMORY_SCHEMA_VERSION } from '../src/types/lifeMemory';

function testShapingSurfaceIsRemoved(): void {
  const state = createState();
  const model = buildMainScreenModel(state.player, {
    schemaVersion: LIFE_MEMORY_SCHEMA_VERSION,
    derivedAtAge: state.player.age,
  });
  assert(!('shapingSummary' in model), 'main-screen model must not expose removed shaping row');

  const source = [
    'src/components/MainScreenLifeSummary.vue',
    'src/components/GameScreen.vue',
    'src/core/ChoiceFeedbackGenerator.ts',
    'src/utils/playerFacingLabels.ts',
  ].map(file => fs.readFileSync(path.resolve(file), 'utf8')).join('\n');
  assert(!/shapingSummary|shaping_familyBond_up|shaping_socialMomentum_up|SHAPING_AXES/.test(source), 'UI and feedback must not expose deleted shaping axes');
  assert(!fs.existsSync(path.resolve('src/utils/habitShapingSummary.ts')), 'obsolete shaping helper must be deleted');
}

function testIdentityAndEndingIgnoreLegacyAxes(): void {
  const state = createState();
  state.player.connections = 5;
  state.player.reputation = 5;
  const baseIdentity = inferLivedSelfUnderstanding(state);
  const injected = structuredClone(state);
  (injected.player.lifeStates as unknown as Record<string, number>).familyBond = 5;
  (injected.player.lifeStates as unknown as Record<string, number>).socialMomentum = 5;
  assert(inferLivedSelfUnderstanding(injected) === baseIdentity, 'legacy axes must not change self-understanding');

  const baseEnding = EndingSystem.determineEnding(state);
  const injectedEnding = EndingSystem.determineEnding(injected);
  assert(baseEnding.id === injectedEnding.id, 'legacy axes must not change ending selection');
  for (const ending of EndingSystem.ENDINGS) {
    assert(
      EndingSystem.canUnlockEnding(state, ending.id) === EndingSystem.canUnlockEnding(injected, ending.id),
      `legacy axes must not change eligibility for ${ending.id}`,
    );
  }
}

function testChoiceFeedbackDoesNotEmitShapingFlags(): void {
  const state = createState();
  const feedback = generateChoiceFeedback({
    effects: [],
    beforePlayer: state.player,
    afterPlayer: structuredClone(state.player),
  });
  assert(!feedback.player.longTermFlags.some(item => item.flag.startsWith('shaping_')), 'choice feedback must not synthesize shaping flags');
}
```

Call all three from the runner.

- [ ] **Step 2: Verify failure**

```bash
npx tsx tests/canonicalFamilySocialLifeStateRemoval.test.ts
```

Expected: FAIL because shaping helper/UI and ending reads remain.

- [ ] **Step 3: Delete shaping helper and feedback integration**

Delete `src/utils/habitShapingSummary.ts`.

In `ChoiceFeedbackGenerator.ts`, remove the shaping imports, `appendShapingFeedbackHints()` call and helper.

In `playerFacingLabels.ts`:

- remove imports from `habitShapingSummary`;
- delete `SHAPING_FEEDBACK_LABELS` and its merge/use in visibility/formatting logic;
- keep labels for concrete history flags such as `p9_echo_social_hook`, but rewrite “方向已被记住，后续机会会由此打开” to neutral history wording such as `童年交游经历已被记录` if the current label otherwise implies a hidden route.

- [ ] **Step 4: Remove main-screen shaping row**

In `mainScreenModel.ts`:

- remove the shaping helper import;
- remove `shapingSummary` from `MainScreenModel`;
- delete `MainScreenLifeStates`, `SOCIAL_MOMENTUM_TENDENCY_THRESHOLD`, the life-state multiplier block, and `buildShapingSummary()`;
- keep `tendencyContextMultiplier()` only for valid route-context behavior; remove the unused `player.lifeStates` local;
- remove `shapingSummary` from the returned model.

In `MainScreenLifeSummary.vue`, delete the entire “塑形” row and `shapingSummary` prop.

In `GameScreen.vue`, delete `:shaping-summary="mainScreenModel.shapingSummary"`.

In `sessionProgression.ts`, change the lifeStates comment to the three practice trajectories or remove `lifeStates` from `PlayerSummaryDto` if no valid client surface uses it. Do not retain a shaping-specific comment.

- [ ] **Step 5: Remove identity reads**

In `p19/stateAccess.ts`, delete the two early branches based on `socialMomentum` and `familyBond`. Leave existing chivalry/reputation, burden and loneliness logic unchanged.

- [ ] **Step 6: Remove Ending permissions exactly as designed**

In `EndingSystem.ts`:

1. `EMPTY_LIFE_STATES` contains only three Habits.
2. Remove the local `familyBond` from positive qualification.
3. `richest_man` returns `true` after general requirements pass.
4. Set:

```ts
const hasFamilyAnchor = Boolean(data.spouse) || data.children > 0;
```

5. `hermit_life`: require only `retired` at this branch; do not add replacement hidden conditions.
6. `bittersweet_success`: require `highAchievement && data.money < 0`.
7. `wanderer_life`: remove both old-axis predicates; retain `data.connections <= 10 && !hasModerateAchievement`.
8. Keep current ordering and priorities unchanged.

- [ ] **Step 7: Rewrite or remove obsolete shaping tests**

- `p41ChoiceFeedbackShapingTests.ts`: retain non-shaping feedback tests; delete shaping-axis expectations. If the file becomes empty, remove it from `tests/runRealTestGate.ts` and delete the file.
- `p41HabitFeedbackTests.ts`: delete shapingSummary expectations; keep practice-impact or ordinary feedback assertions.
- `mainScreenModel.test.ts`: remove `shapingSummary` assertions and add `!('shapingSummary' in model)`.
- `testLifeMemorySummary.ts`: remove fixture values and expectations tied to family/social identity.
- `testRoadEndings.ts` and `p43ArchetypeRecapEndingTests.ts`: update five-key lifeStates fixtures and add explicit spouse/children anchor tests.

- [ ] **Step 8: Run focused tests**

```bash
npx tsx tests/canonicalFamilySocialLifeStateRemoval.test.ts
npx tsx tests/mainScreenModel.test.ts
npx tsx tests/testLifeMemorySummary.ts
npx tsx tests/testRoadEndings.ts
npx tsx tests/p43ArchetypeRecapEndingTests.ts
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add tests/canonicalFamilySocialLifeStateRemoval.test.ts \
  tests/p41ChoiceFeedbackShapingTests.ts \
  tests/p41HabitFeedbackTests.ts \
  tests/mainScreenModel.test.ts \
  tests/testLifeMemorySummary.ts \
  tests/testRoadEndings.ts \
  tests/p43ArchetypeRecapEndingTests.ts \
  tests/runRealTestGate.ts \
  src/core/ChoiceFeedbackGenerator.ts \
  src/utils/playerFacingLabels.ts \
  src/components/mainScreenModel.ts \
  src/components/MainScreenLifeSummary.vue \
  src/components/GameScreen.vue \
  src/contracts/sessionProgression.ts \
  src/p19/stateAccess.ts \
  src/core/EndingSystem.ts
git add -u src/utils/habitShapingSummary.ts
git commit -m "refactor: remove family and social shaping surfaces"
```

---

### Task 7: 清理失效的 P20/P25/HVG/P44/P45 验证资产

**Files:**
- Modify/Delete only direct-reference files reported by Step 1, including:
  - `src/p20/habitTrajectorySlice.ts`
  - `src/p25/habitTrajectorySlice.ts`
  - `src/p25/p30HabitLedSimulationBaselines.ts`
  - `src/p25/p31HabitLedKeyChoiceBridges.ts`
  - `src/p25/p31HabitLedSimulationBaselines.ts`
  - `src/p25/p32BridgeParity.ts`
  - `src/p25/p32HabitLedShortChainSlice.ts`
  - `src/p25/p33HabitZeroOnRampSlice.ts`
  - `src/p25/p34LifetimeBirthToDeathSlice.ts`
  - `src/p25/p35MixedPinnacleLifetimeSlices.ts`
  - `src/p25/p37AdditionalMixedPinnacleLifetimeSlices.ts`
  - `src/p25/p39ContentPoolConsistencySlice.ts`
  - `src/p25/validationSlices.ts`
  - `src/p44/habitOperatorAudit.ts`
  - `src/p45/wealthEarlyAudit.ts`
  - `src/hvg/p129VisibleGrowthProofSlice.ts`
  - `src/hvg/p129TavernSampleBaseline.ts`
  - related tests and scripts
- Modify: `tests/runRealTestGate.ts` only when deleting a test entry

**Interfaces:**
- Keeps: validation of three explicit Habit trajectories.
- Deletes: proof claims that social/family axes are habits, semi-personality axes, visible growth, identity or route on-ramps.
- Does not “repair” history reports; generated reports remain outside runtime authority.

- [ ] **Step 1: Produce the authoritative direct-reference inventory**

Run:

```bash
rg -n --glob '*.{ts,tsx,json}' "familyBond|socialMomentum|habitShapingSummary|shaping_familyBond_up|shaping_socialMomentum_up" src tests scripts
```

Save the output in the implementation log. Classify each hit as one of:

```text
runtime/content        → must already be removed by Tasks 1-6
three-Habit fixture    → remove only the two obsolete properties
old-axis proof branch  → delete branch or whole file
Snapshot rejection test→ keep only in Task 9 tests, not runtime src
```

- [ ] **Step 2: Add a temporary source-cleanliness assertion**

Append to the canonical test:

```ts
function testHistoricalSourceAssetsDoNotModelDeletedAxes(): void {
  const roots = ['src/p20', 'src/p25', 'src/p44', 'src/p45', 'src/hvg'];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    const stack = [root];
    while (stack.length > 0) {
      const current = stack.pop()!;
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) stack.push(full);
        else if (/\.(ts|tsx|json)$/.test(entry.name)) {
          const source = fs.readFileSync(full, 'utf8');
          assert(!/familyBond|socialMomentum/.test(source), `obsolete axis remains in ${full}`);
        }
      }
    }
  }
}
```

Call it from the runner.

- [ ] **Step 3: Verify failure**

```bash
npx tsx tests/canonicalFamilySocialLifeStateRemoval.test.ts
```

Expected: FAIL and identify the first remaining historical source file.

- [ ] **Step 4: Clean mixed files without harming legal Habit coverage**

For each mixed P20/P25 file:

- remove type unions containing `socialMomentum | familyBond`;
- remove fixture properties for those fields;
- remove findings, bridge specs and eligibility cases whose only purpose is proving old-axis behavior;
- preserve training/study/business cases unchanged;
- where a retained social event is still needed for another route bridge, seed its new concrete flag/attribute prerequisite instead of a deleted axis.

Exact bridge replacements:

```text
p28_social_reputation_reinforcement sample
→ seed p28_social_network_opened = true

p29_social_momentum_patron_obligation sample
→ seed ally_network = true

p29_social_momentum_healer_network sample
→ seed medical_talent = true and connections >= 10 or reputation >= 10
```

Do not use deleted field injection.

- [ ] **Step 5: Delete obsolete proof-only files**

Delete a file only if, after removing old-axis branches, it has no valid three-Habit or unrelated responsibility. Expected candidates include the P129 social visible-growth proof and social-axis-specific audit surfaces.

When deleting a source file:

1. remove its imports from scripts;
2. remove its test file if the test proves only the deleted behavior;
3. remove the corresponding suite entry from `tests/runRealTestGate.ts`;
4. do not delete generated historical markdown reports in this task.

- [ ] **Step 6: Update P44/P45 outputs**

- `p44/habitOperatorAudit.ts`: audit only the three practice Habits; remove `SHAPING_AXES` imports and “self-understanding social/family” surfaces.
- `p45/wealthEarlyAudit.ts`: remove `socialMomentum` from checkpoint type, collection and report table; preserve money/business/Habit fields.

- [ ] **Step 7: Run affected gates**

Run every still-existing test named by the inventory, then:

```bash
npx tsx tests/canonicalFamilySocialLifeStateRemoval.test.ts
npm run gate:p20
npm run gate:p24
npm run audit:p44-habit
```

Expected: all executable focused gates PASS. The audit command may regenerate a report; do not commit pre-existing unrelated dirty report changes.

- [ ] **Step 8: Re-run inventory**

```bash
rg -n --glob '*.{ts,tsx,json}' "familyBond|socialMomentum|habitShapingSummary|shaping_familyBond_up|shaping_socialMomentum_up" src tests scripts
```

Expected at this stage: only tests intentionally injecting forbidden legacy keys for future Snapshot/repository rejection, plus central `PlayerLifeStates` definitions not yet removed in Task 8. No P20/P25/HVG/P44/P45 source hit remains.

- [ ] **Step 9: Commit**

Use explicit paths from the inventory; do not use `git add .`:

```bash
git add src/p20 src/p25 src/p44 src/p45 src/hvg tests scripts tests/runRealTestGate.ts
git commit -m "test: retire family and social axis validation assets"
```

Before committing, inspect `git diff --cached --name-only` and unstage any generated report or unrelated file.

---

### Task 8: 收窄 PlayerLifeStates 为三个 Habit 并修复所有 Fixtures

**Files:**
- Modify: `tests/canonicalFamilySocialLifeStateRemoval.test.ts`
- Modify: `src/types/eventTypes.ts:218-325`
- Modify: `src/data/life/lifeStates.ts`
- Modify: every remaining TypeScript/JSON fixture that explicitly creates five-key lifeStates
- Modify: `tests/canonicalDisciplineIndulgenceRemoval.test.ts`
- Modify: `tests/canonicalHabitPracticeNarrowing.test.ts`
- Modify: `tests/p41HabitFeedbackTests.ts`
- Modify: `tests/p45TrajectoryReplayTests.ts`
- Modify: `tests/mainScreenModel.test.ts`
- Modify: `tests/testLifeMemorySummary.ts`
- Modify: `tests/p43ArchetypeRecapEndingTests.ts`
- Modify: `tests/testRoadEndings.ts`

**Interfaces:**
- Produces exact canonical type:

```ts
export const LIFE_STATE_KEYS = [
  'trainingHabit',
  'studyHabit',
  'businessHabit',
] as const;
```

- `createDefaultPlayerLifeStates({ familyBond: 1 } as never)` throws unknown-key error at runtime.
- All code uses `createDefaultPlayerLifeStates()` where possible rather than hand-written repeated objects.

- [ ] **Step 1: Add failing model tests**

Append:

```ts
import { LIFE_STATE_KEYS } from '../src/types/eventTypes';

function testCanonicalLifeStateShape(): void {
  assertDeepEqual(
    [...LIFE_STATE_KEYS],
    ['trainingHabit', 'studyHabit', 'businessHabit'],
    'only three practice Habits remain',
  );
  assertDeepEqual(
    createDefaultPlayerLifeStates(),
    { trainingHabit: 0, studyHabit: 0, businessHabit: 0 },
    'default lifeStates contain only three Habits',
  );

  for (const key of ['familyBond', 'socialMomentum']) {
    let threw = false;
    try {
      createDefaultPlayerLifeStates({ [key]: 1 } as never);
    } catch (error) {
      threw = String(error).includes(`Unknown player life state: ${key}`);
    }
    assert(threw, `${key} override must be rejected`);
  }
}
```

Call it from the runner.

- [ ] **Step 2: Verify failure**

```bash
npx tsx tests/canonicalFamilySocialLifeStateRemoval.test.ts
```

Expected: FAIL because keys/default still include the two fields.

- [ ] **Step 3: Shrink central type and config**

In `src/types/eventTypes.ts`, replace `LIFE_STATE_KEYS` and `PlayerLifeStates` with exactly the three-Habit definitions in the Interfaces block.

In `src/data/life/lifeStates.ts`, keep only:

```ts
export const lifeStates: LifeStateConfig[] = [
  { key: 'trainingHabit', name: '练功实践', min: 0, max: 5, defaultValue: 0 },
  { key: 'studyHabit', name: '读书实践', min: 0, max: 5, defaultValue: 0 },
  { key: 'businessHabit', name: '营生实践', min: 0, max: 5, defaultValue: 0 },
];
```

Use “实践” labels, not “习惯” or “塑形”。

- [ ] **Step 4: Fix source fixtures first**

Run:

```bash
rg -n --glob '*.{ts,tsx,json}' "familyBond|socialMomentum" src
```

For every remaining non-Snapshot source fixture:

- delete the two properties when the fixture merely needs a complete default shape;
- use `createDefaultPlayerLifeStates({ trainingHabit: ..., studyHabit: ..., businessHabit: ... })` where available;
- do not cast around type errors by adding index signatures or `as any` except in explicit rejection tests.

Expected after this step:

```bash
rg -n --glob '*.{ts,tsx,json}' "familyBond|socialMomentum" src
```

returns only Snapshot error/rejection strings if such strings are deliberately kept in `src/contracts` or `src/headless`; ordinary runtime/content returns zero.

- [ ] **Step 5: Fix test fixtures**

Run:

```bash
rg -n --glob '*.{ts,tsx}' "familyBond|socialMomentum" tests
```

For ordinary fixtures, delete the properties or use `createDefaultPlayerLifeStates()`.

Keep legacy-key injection only inside the new canonical test and Snapshot contract rejection tests, written through:

```ts
(lifeStates as unknown as Record<string, unknown>).familyBond = 1;
```

This keeps the production type strict.

Update `canonicalDisciplineIndulgenceRemoval.test.ts` expected keys to:

```ts
['businessHabit', 'studyHabit', 'trainingHabit'].sort()
```

Update `canonicalHabitPracticeNarrowing.test.ts` practice trajectory fixture to contain only three Habits.

- [ ] **Step 6: Run TypeScript and focused tests**

```bash
npx tsc --noEmit --pretty false
npx tsx tests/canonicalFamilySocialLifeStateRemoval.test.ts
npx tsx tests/canonicalDisciplineIndulgenceRemoval.test.ts
npx tsx tests/canonicalHabitPracticeNarrowing.test.ts
```

Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git add src/types/eventTypes.ts src/data/life/lifeStates.ts src tests
git commit -m "refactor: narrow player life states to practice habits"
```

Before commit, verify staged files contain no unrelated generated report.

---

### Task 9: Snapshot 3.8.0 与旧 Key 双向严格拒绝

**Files:**
- Modify: `tests/canonicalFamilySocialLifeStateRemoval.test.ts`
- Modify: `src/contracts/gameStateSnapshot.ts:20-35`
- Modify: `src/contracts/fixtures/gameStateSnapshotAge50.ts:70-90`
- Modify: `src/contracts/validation/contractValidation.ts:63-88`
- Modify: `src/headless/snapshot/SnapshotConverter.ts:130-165` and `toSnapshot` validation path
- Modify: `tests/contracts/snapshotContract.test.ts:205-230`
- Modify: `tests/contracts/contractValidation.test.ts:56-82`
- Modify: any snapshot fixture asserting `3.7.0`

**Interfaces:**
- Produces: `GAME_STATE_SNAPSHOT_SCHEMA_VERSION = '3.8.0'`.
- Reader accepts only exact `3.8.0`.
- Validator and converter both reject missing Habit keys, old axis keys and arbitrary unknown keys.
- Serializer fails if a runtime object contains an injected old key.

- [ ] **Step 1: Add failing Snapshot tests**

Append imports and test:

```ts
import { GAME_STATE_SNAPSHOT_SCHEMA_VERSION } from '../src/contracts/gameStateSnapshot';
import { gameStateSnapshotAge50 } from '../src/contracts/fixtures/gameStateSnapshotAge50';
import { validateGameStateSnapshot, validatePlayerLifeStates } from '../src/contracts/validation/contractValidation';
import { defaultSnapshotConverter } from '../src/headless/snapshot/SnapshotConverter';

function testSnapshot380Boundary(): void {
  assert(GAME_STATE_SNAPSHOT_SCHEMA_VERSION === '3.8.0', 'Snapshot schema must be 3.8.0');
  assert(validatePlayerLifeStates({ trainingHabit: 0, studyHabit: 0, businessHabit: 0 }).ok, 'three-key lifeStates pass');

  for (const key of ['familyBond', 'socialMomentum']) {
    const invalid = { trainingHabit: 0, studyHabit: 0, businessHabit: 0, [key]: 1 };
    assert(!validatePlayerLifeStates(invalid).ok, `${key} must be forbidden`);
  }

  const oldVersion = structuredClone(gameStateSnapshotAge50) as any;
  oldVersion.metadata.schemaVersion = '3.7.0';
  assert(!validateGameStateSnapshot(oldVersion).ok, '3.7.0 snapshot must be rejected');

  for (const key of ['familyBond', 'socialMomentum']) {
    const invalid = structuredClone(gameStateSnapshotAge50) as any;
    invalid.state.player.lifeStates[key] = 1;
    assert(!validateGameStateSnapshot(invalid).ok, `${key} snapshot must be rejected`);
    let threw = false;
    try {
      defaultSnapshotConverter.fromSnapshot(invalid);
    } catch {
      threw = true;
    }
    assert(threw, `converter must reject ${key}`);
  }

  const runtime = defaultSnapshotConverter.fromSnapshot(structuredClone(gameStateSnapshotAge50));
  (runtime.player.lifeStates as unknown as Record<string, number>).familyBond = 1;
  let serializeThrew = false;
  try {
    defaultSnapshotConverter.toSnapshot(runtime);
  } catch {
    serializeThrew = true;
  }
  assert(serializeThrew, 'serializer must reject runtime residue instead of cleaning it');
}
```

Call it from the runner.

- [ ] **Step 2: Verify failure**

```bash
npx tsx tests/canonicalFamilySocialLifeStateRemoval.test.ts
```

Expected: FAIL on version and/or serializer boundary.

- [ ] **Step 3: Bump schema and fixture**

Set:

```ts
export const GAME_STATE_SNAPSHOT_SCHEMA_VERSION = '3.8.0' as const;
```

In `gameStateSnapshotAge50.ts`, use:

```ts
lifeStates: createDefaultPlayerLifeStates({
  trainingHabit: 5,
  studyHabit: 5,
  businessHabit: 5,
}),
```

Do not carry old values anywhere else.

- [ ] **Step 4: Keep validator exact-key logic**

`validatePlayerLifeStates()` already derives expected keys from `LIFE_STATE_KEYS`. Confirm it:

- requires all three keys;
- rejects all extra keys;
- enforces finite `0～5` numbers.

Do not special-case old keys by silently deleting them. Error text may remain generic:

```text
player.lifeStates.familyBond is forbidden
player.lifeStates.socialMomentum is forbidden
```

- [ ] **Step 5: Enforce serializer-side validation**

Locate `SnapshotConverter.toSnapshot()` and validate `state.player.lifeStates` before building the snapshot:

```ts
if (state.player.lifeStates !== undefined) {
  const result = validatePlayerLifeStates(state.player.lifeStates);
  if ('errors' in result) {
    throw new SnapshotConversionError('SNAPSHOT_INVALID', result.errors.join('; '));
  }
}
```

Do not spread into a new object first and thereby strip unknown keys.

- [ ] **Step 6: Update contract tests**

In `snapshotContract.test.ts`:

- rename “valid five-key” to “valid three-key”;
- explicitly reject schema `3.7.0`;
- add both old keys to reader/converter rejection;
- add serializer rejection.

In `contractValidation.test.ts`:

```ts
assert(validatePlayerLifeStates(validLifeStates).ok, 'valid three-key lifeStates passes');
```

Add invalid cases:

```ts
['familyBond', lifeStates => { lifeStates.familyBond = 1; }],
['socialMomentum', lifeStates => { lifeStates.socialMomentum = 1; }],
```

Keep discipline/indulgence and arbitrary-extra rejection.

- [ ] **Step 7: Run Snapshot suites**

```bash
npx tsx tests/canonicalFamilySocialLifeStateRemoval.test.ts
npm run test:contracts:snapshot
npm run test:contracts:validation
npm run test:contracts
npm run test:headless
```

Expected: all PASS.

- [ ] **Step 8: Commit**

```bash
git add tests/canonicalFamilySocialLifeStateRemoval.test.ts \
  tests/contracts/snapshotContract.test.ts \
  tests/contracts/contractValidation.test.ts \
  src/contracts/gameStateSnapshot.ts \
  src/contracts/fixtures/gameStateSnapshotAge50.ts \
  src/contracts/validation/contractValidation.ts \
  src/headless/snapshot/SnapshotConverter.ts
git commit -m "feat: upgrade snapshot after life-state removal"
```

---

### Task 10: Canonical Guard、文档、正式 Test Gate 与最终验证

**Files:**
- Modify: `tests/canonicalFamilySocialLifeStateRemoval.test.ts`
- Modify: `tests/runRealTestGate.ts:70-85`
- Modify: `docs/product/player-model.md`
- Create: `docs/superpowers/specs/2026-07-27-family-social-life-state-removal-design.md`
- Create: `docs/superpowers/plans/2026-07-27-family-social-life-state-removal.md`
- Modify: `docs/contracts/game-state-snapshot-contract.md`
- Modify: `docs/contracts/save-schema-versioning-policy.md`
- Modify: any current non-historical documentation that calls five lifeStates canonical

**Interfaces:**
- Repository guard scans `src/**/*.{ts,tsx,json}`.
- Ordinary runtime/content must contain zero `familyBond` and zero `socialMomentum` tokens.
- Allowed source occurrence should be zero; rejection literals belong in tests, not production code, unless generic validation naturally emits the key dynamically.

- [ ] **Step 1: Add final repository guard**

Replace the temporary historical-only guard with:

```ts
function testRepositoryGuard(): void {
  const forbidden = [
    { token: /\bfamilyBond\b/, label: 'familyBond' },
    { token: /\bsocialMomentum\b/, label: 'socialMomentum' },
    { token: /habitShapingSummary/, label: 'habitShapingSummary' },
    { token: /shaping_(?:familyBond|socialMomentum)_up/, label: 'legacy shaping feedback flag' },
  ];

  const visit = (directory: string): void => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const filePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(filePath);
        continue;
      }
      if (!/\.(ts|tsx|json)$/.test(entry.name)) continue;
      const source = fs.readFileSync(filePath, 'utf8');
      for (const rule of forbidden) {
        assert(!rule.token.test(source), `${rule.label} found in ${path.relative(process.cwd(), filePath)}`);
      }
    }
  };

  visit(path.resolve('src'));
}
```

Call it last in the canonical runner.

The guard intentionally does not scan `tests`, docs, reports or proof output.

- [ ] **Step 2: Verify guard and inspect any remaining source hit**

```bash
npx tsx tests/canonicalFamilySocialLifeStateRemoval.test.ts
rg -n --glob '*.{ts,tsx,json}' "familyBond|socialMomentum|habitShapingSummary|shaping_familyBond_up|shaping_socialMomentum_up" src
```

Expected: canonical test PASS and `rg` returns no matches.

- [ ] **Step 3: Add suite to the official gate**

Append to `tests/runRealTestGate.ts` immediately after the Habit narrowing test:

```ts
{
  name: 'canonicalFamilySocialLifeStateRemovalTests',
  entry: 'tests/canonicalFamilySocialLifeStateRemoval.test.ts',
},
```

- [ ] **Step 4: Write Canonical product documentation**

In `docs/product/player-model.md`, add a section with these exact requirements:

```text
familyBond / socialMomentum 已从 Canonical Player State 删除。

家庭语义由 Trait、spouse、children、具体 relationship 与事件专属 Fact 承载。
社交语义由 connections、reputation、具体 relationship 与事件专属 Fact 承载。

不得建立替代的家庭／社交通用数值轴；不得从 Trait、tag、收益、echo flag、时间或成功失败自动推导。
上述语义不得作为全局事件权重、人物原型、身份判断或 Ending 隐藏轴。
```

Update the canonical long-term structure so `lifeStates` lists only the three practice Habits.

- [ ] **Step 5: Write design and plan files into the repository**

Copy the approved documents verbatim to:

```text
docs/superpowers/specs/2026-07-27-family-social-life-state-removal-design.md
docs/superpowers/plans/2026-07-27-family-social-life-state-removal.md
```

Change the design header status from “待用户复核” to:

```text
状态：产品方案 C 与设计已确认，进入实施
```

Do not change substantive decisions while copying.

- [ ] **Step 6: Update Snapshot documentation**

In `game-state-snapshot-contract.md` and `save-schema-versioning-policy.md`:

- replace current schema `3.7.0` with `3.8.0`;
- state that `3.7.x` and earlier are rejected;
- describe `player.lifeStates` as exactly three practice Habit numbers;
- state that `familyBond / socialMomentum` are forbidden unknown keys;
- state there is no migration, fallback, cleaning, conversion or history reconstruction.

Do not describe lifeStates as “temporary life states”; use “长期实践轨迹” for the three Habit fields.

- [ ] **Step 7: Run focused test gate**

```bash
npx tsx tests/canonicalFamilySocialLifeStateRemoval.test.ts
npm test
npm run test:headless
npm run test:contracts
```

Expected:

```text
canonicalFamilySocialLifeStateRemoval PASS
npm test               exit 0
npm run test:headless  exit 0
npm run test:contracts exit 0
```

- [ ] **Step 8: Run formal TypeScript/build commands and classify only known debt**

```bash
npm run typecheck > /tmp/family-social-typecheck.log 2>&1; echo $?
npm run typecheck:p6b > /tmp/family-social-typecheck-p6b.log 2>&1; echo $?
npm run build > /tmp/family-social-build.log 2>&1; echo $?
```

Expected: either PASS, or exit `2` with only:

```text
src/core/RouteStateManager.ts:248
src/core/RouteStateManager.ts:249
```

Verify:

```bash
cat /tmp/family-social-typecheck.log
cat /tmp/family-social-typecheck-p6b.log
cat /tmp/family-social-build.log
```

Any third diagnostic is a regression and must be fixed before proceeding. Do not modify RouteStateManager in this plan.

- [ ] **Step 9: Run final source and Snapshot scans**

```bash
rg -n --glob '*.{ts,tsx,json}' "familyBond|socialMomentum" src
rg -n "3\.7\.0" src tests/contracts docs/contracts
rg -n "preferredStates|startingStates|stateBiases|habitShapingSummary" src
```

Expected:

- first command: no output;
- second command: only explicit historical-version rejection tests/text, never current-version claims;
- third command: no removed mechanism output.

- [ ] **Step 10: Review scope and working tree**

```bash
git status --short
git diff --stat
git diff -- docs/product/player-model.md src/types/eventTypes.ts src/data/life/lifeStates.ts
```

Confirm:

- no RouteStateManager modification;
- no unrelated relationship-system redesign;
- no six dirty report files staged;
- no `package-project.sh` staged;
- no generated report added unless the task explicitly owns it.

- [ ] **Step 11: Commit final guard and docs**

```bash
git add tests/canonicalFamilySocialLifeStateRemoval.test.ts \
  tests/runRealTestGate.ts \
  docs/product/player-model.md \
  docs/contracts/game-state-snapshot-contract.md \
  docs/contracts/save-schema-versioning-policy.md \
  docs/superpowers/specs/2026-07-27-family-social-life-state-removal-design.md \
  docs/superpowers/plans/2026-07-27-family-social-life-state-removal.md
git commit -m "docs: finalize family and social life-state removal"
```

- [ ] **Step 12: Whole-branch review**

Review the complete branch diff against the approved design. Required review questions:

```text
1. Is any producer or consumer still deriving a general family/social score?
2. Did any event condition get mechanically replaced without concrete semantics?
3. Do retained social events require the exact approved attributes/facts?
4. Are all five unsupported family events absent from runtime and manifest?
5. Can old Snapshot keys be silently removed or normalized anywhere?
6. Can the two deleted concepts still change identity, Life Memory or Ending?
7. Did this branch alter Route Lifecycle or unrelated Habit semantics?
```

Fix Critical or Important findings in one final fix wave, re-run Steps 7-10, then commit only the fix-wave files with an explicit message.

---

## Completion Evidence Template

The executing agent’s final report must include:

```text
1. Final HEAD
2. Task commit sequence
3. Deleted runtime fields and mechanisms
4. Retained social event conditions, one line per event
5. Deleted family event IDs
6. Snapshot version and rejection policy
7. Repository scan counts:
   familyBond: 0 in src
   socialMomentum: 0 in src
8. npm test / test:headless / test:contracts exit codes
9. typecheck / typecheck:p6b / build exit codes and exact diagnostics
10. Confirmation that RouteStateManager.ts:248-249 was not modified
11. Confirmation that dirty reports and package-project.sh were not staged or committed
12. Final review Critical/Important findings and fix-wave result
```
