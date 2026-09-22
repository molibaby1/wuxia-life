# Preschool Content Capacity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** 仅在现有 preschool passive authored catalog 中新增 Human-approved 的 8 条 shared-neutral experiences，并增加 focused semantic regressions；不修改 selector/runtime/schema。

**Architecture:** 继续使用现有 PassiveNarrativeEntry。8 条新内容只进入 src/data/lines/preschool-passive-spine.json，由现有 merged catalog 自动进入 unified pool；selector、season packing、eventHistory no-reuse 与 3-beat/3-month 语义均保持现状。focused tests 证明 age staging、neutral-only、无 flags/stats，以及 unified pool 会在 generic gap 前消费新增 authored content。

**Tech Stack:** TypeScript / JSON / tsx tests

**Spec:** docs/superpowers/specs/2026-09-22-preschool-content-capacity-authoring-design.md

## Global Constraints

- 本计划只实现 authority identifier 为 preschool-content-capacity-authoring-20260922 的已批准 authoring set。
- Exactly 8 new entries。
- 新增内容只放入 src/data/lines/preschool-passive-spine.json。
- 8 条继续使用现有 PassiveNarrativeEntry。
- 8 条全部使用 originTags: ["neutral"]。
- 8 条全部不得含 statDeltas 或 flags。
- 不新增 Person、choice、Milestone、Relationship、player state、prerequisite/schema、TaskLine、StoryArc 或 runtime abstraction。
- 不修改 src/data/preschoolPassiveSpine.ts。
- 不修改 src/core/activePlanning/annualPassiveMemory.ts。
- 只有在 implementation 时真实发现 accepted semantics 与当前 architecture 冲突，才允许 STOP、返回 Human；不能自行扩 scope。
- 不修改 scheduler、selection weighting、origin affinity、gap placeholder、0–3 behavior、3-beat shape、3-month cadence 或 history reuse semantics。
- 不新增 origin-specific content。
- 不运行 AE、resume historical session、replay 或 natural PVER。
- 不修改 HFL、其他 docs authority、scripts 或 artifacts。
- 8 条是一个 Human-approved Minimum Event Set / authoring set，不人为拆成 8 个独立 implementation commits。
- final title/text 是本计划锁定的 implementation-level wording；implementation 不得借文案改变 accepted Authoring Card 的产品语义。
- 如果某句 final copy 被发现违反 authority scope，不自行重写语义；在 Plan review / implementation review 中明确指出冲突并 STOP。

## Approved Entry Set and Final Player-facing Copy

以下 8 条必须全部实现，ID、title、text、年龄窗口和 originTags 均锁定。最终 copy 是 implementation-level wording；它不能新增 choice、flags、stats、Person、Relationship 或其他 mechanics。

### A. Peer conflict / repair

~~~text
id: preschool_neutral_peer_repair
title: 闹别扭
text: 你和玩伴为一件小事争得脸红，谁也不肯先开口。过了半日，你把手里的小玩意递回去，对方也悄悄挪近了些，先前那点气便慢慢散了。
ageMin: 5
ageMax: 7
originTags: ["neutral"]
~~~

Copy 必须保持 peer conflict / repair：事情上的输赢与同伴关系分离，不创建正式 Person 或 friendship / relationship state。

### B. Peer cooperation

~~~text
id: preschool_neutral_peer_cooperation
title: 一起做完
text: 你和几个孩子合力收拾一件麻烦事，有人做到一半想溜，你们只好重新分工。等事情终于做完，你才明白答应一起做的事，不能只顾自己先走。
ageMin: 6
ageMax: 7
originTags: ["neutral"]
~~~

Copy 必须保持 peer cooperation：合作、分工、遵守约定，不创建正式好友系统或 Relationship state。

### C. First entrusted responsibility

~~~text
id: preschool_neutral_entrusted_task
title: 交给你的事
text: 大人临时把一件要紧的小事托给你照看。中途外头很热闹，你几次想跑去看，最后还是守在原处，第一次觉得「交给我」三个字有些分量。
ageMin: 5
ageMax: 7
originTags: ["neutral"]
~~~

Copy 必须保持 entrusted responsibility，并与 preschool_neutral_broken_bowl 区分：前者是被托付之后产生责任意识，不能写成另一条“弄坏东西 → 挨骂”。

### D. Care for a younger child

~~~text
id: preschool_neutral_care_younger
title: 牵住小手
text: 大人腾不开手，让你暂时照看一个更小的孩子。对方一会儿要哭、一会儿乱跑，你手忙脚乱地把人哄住，才知道照顾别人远没有看起来轻松。
ageMin: 6
ageMax: 7
originTags: ["neutral"]
~~~

Copy 中的更小孩子只能是 transient role，不创建 Person、sibling relation 或 Family runtime。

### E. Find a way back

~~~text
id: preschool_neutral_find_way_back
title: 自己认路
text: 一次随家人出门，你转眼没看见熟悉的身影。慌了一阵后，你认出先前经过的地方，又向可信的大人问了路，终于自己找回了该去的方向。
ageMin: 5
ageMax: 7
originTags: ["neutral"]
~~~

Copy 必须保持主动解决轻度分离，不升级为失踪、绑架、重大危险、trauma 或 survival runtime，并与 preschool_neutral_waiting_threshold 的被动等待区分。

### F. Speak for oneself

~~~text
id: preschool_neutral_speak_for_self
title: 自己开口
text: 有陌生的大人问起你的来意，身边的人没有替你回答。你起初声音很小，还是把事情一字一句说清楚了，对方也认真听完，没有把你只当小孩子敷衍过去。
ageMin: 6
ageMax: 7
originTags: ["neutral"]
~~~

Copy 必须保持 social agency，不退化成普通购物或跑腿日志。

### G. Care for a sick adult

~~~text
id: preschool_neutral_care_sick_family
title: 递水守静
text: 家里一个平日照顾你的人病得没什么精神。你学着放轻脚步，递水拿布，还拦住旁人别太吵，第一次发现大人也会有需要别人照顾的时候。
ageMin: 5
ageMax: 7
originTags: ["neutral"]
~~~

Copy 必须保持角色反转：childhood_fever 是被照顾者，本条是孩子照顾平日照顾自己的大人；不创建疾病系统、正式 Parent Person 或长期 health state。

### H. Household disruption participation

~~~text
id: preschool_neutral_household_disruption
title: 急雨忙家
text: 一阵急雨来得突然，家里顿时忙着收东西、挪开怕湿的物件。你也抱着能搬动的东西来回跑，雨停以后才发现，原来一个家也要大家一起照应。
ageMin: 6
ageMax: 7
originTags: ["neutral"]
~~~

Copy 必须保持短暂、可恢复的 household participation，不升级为破产、迁居、家庭死亡、战争灾难或 Household runtime。

## File Structure

本计划只有一个 implementation task，文件职责如下：

- Modify: src/data/lines/preschool-passive-spine.json
  - 追加上述 exactly 8 条 PassiveNarrativeEntry。
  - 不添加 statDeltas、flags 或任何新字段。
  - 不修改、删除、重命名或重新解释既有 entry。
- Modify: tests/preschoolPassiveSpineTests.ts
  - 增加集中 authoring contract regression。
  - 锁定 8 个 ID、非空 copy、精确年龄窗、neutral-only 和无 stats/flags。
  - 锁定 age 4/5/6/7 staged unlock。
- Modify only if needed: tests/annualPassiveMemoryTests.ts
  - 增加 unified-pool integration proof。
  - 该测试必须使用 deterministic fixture 证明新增 authored capacity 在 gap 前被消费。
- Do not modify: src/data/preschoolPassiveSpine.ts
- Do not modify: src/core/activePlanning/annualPassiveMemory.ts
- No other production files are expected to change.
- No other test files are expected to change.

### Interfaces used by the implementation task

- Consumes:
  - PassiveNarrativeEntry from src/data/passiveNarrativeTypes.ts；
  - getPreschoolPassiveEntries(age)；
  - isNeutralOnlyPreschoolEntry(entry)；
  - isForeignExclusivePreschoolEntry(entry, playerOriginTag)；
  - preparePreschoolSeasonMemory(state, deterministicRandom)；
  - existing martialPreschoolState(age) fixture in tests/annualPassiveMemoryTests.ts。
- Produces:
  - 8 catalog rows discoverable through getPreschoolPassiveEntries；
  - age-staged neutral candidates consumed by selectPreschoolSeasonEntry through the existing merged catalog；
  - focused tests proving the accepted contract without changing selector/runtime/schema。

## Review Focus

1. Age staging：age 4 不得进入任何新条目；age 5 只能进入 4 个 ageMin=5 条目；age 6 和 age 7 必须进入全部 8 条。验证归属：Task 1, RED A contract test。
2. Neutral-only isolation：8 条的 originTags 必须精确等于 ["neutral"]，不能带 foreign 或 origin-specific tag。验证归属：Task 1, RED A contract test；post-GREEN preschoolOriginIsolationTests。
3. No unauthorized mechanics：8 条不得包含 statDeltas 或 flags，不得引入 Person、choice、Milestone、Relationship 或 runtime。验证归属：Task 1, RED A contract test与 JSON diff review。
4. Authored-before-gap：在 martial origin 与 neutral 合法池中只留下 4 条 age-5 approved entries 时，season 必须返回 3 个 distinct approved authored beats，不得提前 generic gap。验证归属：Task 1, RED B integration test。
5. Existing catalog stability：既有 entry 的 ID、title、text、age window、origin tags 不得被修改、删除或重命名；验证归属：Task 1, GREEN catalog-only diff review、既有 preschoolPassiveSpineTests assertions、origin isolation regression 与 post-GREEN full file diff。

## Task 1: Add approved shared-neutral preschool capacity

**Files:**
- Modify: src/data/lines/preschool-passive-spine.json
- Modify: tests/preschoolPassiveSpineTests.ts
- Modify only if needed: tests/annualPassiveMemoryTests.ts

**No production code files may be modified.** The implementation task remains catalog-plus-focused-regressions only.

### RED A — Authoring contract regression

- [ ] **Step 1: Add the concentrated contract test in tests/preschoolPassiveSpineTests.ts**

Add a test function named testApprovedPreschoolCapacityAuthoringSet and call it from runPreschoolPassiveSpineTests. Define the exact accepted contract:

~~~ts
const approved = [
  {
    id: 'preschool_neutral_peer_repair',
    ageMin: 5,
    ageMax: 7,
  },
  {
    id: 'preschool_neutral_peer_cooperation',
    ageMin: 6,
    ageMax: 7,
  },
  {
    id: 'preschool_neutral_entrusted_task',
    ageMin: 5,
    ageMax: 7,
  },
  {
    id: 'preschool_neutral_care_younger',
    ageMin: 6,
    ageMax: 7,
  },
  {
    id: 'preschool_neutral_find_way_back',
    ageMin: 5,
    ageMax: 7,
  },
  {
    id: 'preschool_neutral_speak_for_self',
    ageMin: 6,
    ageMax: 7,
  },
  {
    id: 'preschool_neutral_care_sick_family',
    ageMin: 5,
    ageMax: 7,
  },
  {
    id: 'preschool_neutral_household_disruption',
    ageMin: 6,
    ageMax: 7,
  },
] as const;
~~~

Build a lookup from the existing age-band catalog, then for every approved row assert:

~~~ts
const entry = entriesById.get(spec.id);
assert(entry !== undefined, 'approved id exists: ' + spec.id);
assert(entry.title.length > 0, 'approved title is non-empty: ' + spec.id);
assert(entry.text.length > 0, 'approved text is non-empty: ' + spec.id);
assert(entry.ageMin === spec.ageMin, 'approved ageMin: ' + spec.id);
assert(entry.ageMax === spec.ageMax, 'approved ageMax: ' + spec.id);
assert(
  entry.originTags.length === 1 && entry.originTags[0] === 'neutral',
  'approved entry is exactly neutral-only: ' + spec.id,
);
assert(entry.statDeltas === undefined, 'approved entry has no statDeltas: ' + spec.id);
assert(entry.flags === undefined, 'approved entry has no flags: ' + spec.id);
~~~

The test must also assert the staged availability:

~~~ts
const idsAtAge = (age: number): Set<string> =>
  new Set(getPreschoolPassiveEntries(age).map(entry => entry.id));
const approvedIds = new Set(approved.map(spec => spec.id));
const age5Ids = new Set(
  approved.filter(spec => spec.ageMin === 5).map(spec => spec.id),
);
const age6Ids = new Set(approved.map(spec => spec.id));

assert(
  [...approvedIds].every(id => !idsAtAge(4).has(id)),
  'none of the approved entries is available at age 4',
);
assert(
  [...age5Ids].every(id => idsAtAge(5).has(id)) &&
    [...approvedIds].filter(id => idsAtAge(5).has(id)).length === 4,
  'age 5 exposes exactly the four ageMin=5 approved entries',
);
assert(
  [...age6Ids].every(id => idsAtAge(6).has(id)),
  'age 6 exposes all approved entries',
);
assert(
  [...age6Ids].every(id => idsAtAge(7).has(id)),
  'age 7 exposes all approved entries',
);
~~~

The implementation must keep the exact final title/text from the Approved Entry Set section. The RED failure on the starting HEAD must be natural: the approved IDs do not exist in the catalog. Do not add an artificial always-failing assertion.

- [ ] **Step 2: Run RED A against the starting HEAD**

Run:

~~~bash
npm exec tsx tests/preschoolPassiveSpineTests.ts
~~~

Expected result before catalog implementation: FAIL because the first approved ID lookup cannot find the approved authored entry. Do not modify production files or catalog while capturing this RED evidence in the future implementation session.

### RED B — Unified pool consumes new capacity before gap

- [ ] **Step 3: Add the deterministic integration test in tests/annualPassiveMemoryTests.ts**

Add a test function named testApprovedCapacityEntriesAreConsumedBeforeGap and call it from runAnnualPassiveMemoryTests.

Use the existing martialPreschoolState(5) fixture. Define the four age-5 approved IDs exactly:

~~~ts
const age5ApprovedIds = new Set([
  'preschool_neutral_peer_repair',
  'preschool_neutral_entrusted_task',
  'preschool_neutral_find_way_back',
  'preschool_neutral_care_sick_family',
]);
~~~

Construct the legal age-5 pool from matching martial-origin entries plus neutral-only entries, excluding any other canonical origin:

~~~ts
const age5Entries = getPreschoolPassiveEntries(5);
const legalEntries = age5Entries.filter(
  entry =>
    isNeutralOnlyPreschoolEntry(entry) ||
    (entry.originTags.includes('martial') && !isNeutralOnlyPreschoolEntry(entry)),
);
~~~

Pre-consume every legal entry except the four approved IDs:

~~~ts
const state = martialPreschoolState(5);
state.eventHistory = legalEntries
  .filter(entry => !age5ApprovedIds.has(entry.id))
  .map(entry => ({ eventId: entry.id, age: 5 }));
const historyBeforePrepare = JSON.stringify(state.eventHistory);
~~~

Prepare the season using deterministic random input and assert the full outcome:

~~~ts
const plan = preparePreschoolSeasonMemory(state, () => 0);
const ids = plan.entries.map(entry => entry.id);

assert(plan.entries.length === 3, 'season remains three beats');
assert(plan.entries.every(entry => !isPreschoolGap(entry)), 'authored entries precede gap');
assert(ids.every(id => age5ApprovedIds.has(id)), 'all beats use age-5 approved capacity');
assert(new Set(ids).size === 3, 'new authored IDs are distinct within the season');
assert(
  plan.entries.every(entry => !isForeignExclusivePreschoolEntry(entry, 'martial')),
  'new season does not surface foreign canonical-origin content',
);
assert(
  JSON.stringify(state.eventHistory) === historyBeforePrepare,
  'preparing the season does not mutate input state',
);
~~~

This proves the rows are first-class neutral candidates in the current unified pool rather than static catalog dead rows. The RED failure on the starting HEAD must be natural: because the approved IDs do not exist, the pre-consumed legal pool is exhausted and preparePreschoolSeasonMemory returns generic gap entries. Do not modify selector weighting or scheduler behavior to make this pass.

- [ ] **Step 4: Run RED B against the starting HEAD**

Run:

~~~bash
npm exec tsx tests/annualPassiveMemoryTests.ts
~~~

Expected result before catalog implementation: FAIL because the prepared season contains generic gap entries rather than the four approved age-5 IDs. This is the expected missing-capacity RED, not permission to change runtime code.

### GREEN — Catalog-only implementation

- [ ] **Step 5: Add the exact 8 approved rows to src/data/lines/preschool-passive-spine.json**

Append or place the 8 entries using the existing JSON style. Each row must contain only the existing PassiveNarrativeEntry fields required by the accepted contract:

~~~json
{
  "id": "approved-id",
  "title": "locked title",
  "text": "locked text",
  "originTags": ["neutral"],
  "ageMin": 5,
  "ageMax": 7
}
~~~

Use the exact ID, title, text, ageMin, ageMax and originTags from the Approved Entry Set section. Do not add statDeltas or flags. Do not modify any existing JSON row, ordering semantics, or age window. Do not touch src/data/preschoolPassiveSpine.ts or src/core/activePlanning/annualPassiveMemory.ts.

- [ ] **Step 6: Run GREEN focused regressions**

Run:

~~~bash
npm exec tsx tests/preschoolPassiveSpineTests.ts
npm exec tsx tests/annualPassiveMemoryTests.ts
~~~

Expected result: both commands exit successfully. The authoring contract test proves all eight rows and staged availability; the integration test proves all three age-5 season beats come from the remaining approved neutral capacity before any gap.

- [ ] **Step 7: Review the catalog diff for accidental scope expansion**

Run:

~~~bash
git diff -- src/data/lines/preschool-passive-spine.json
git diff -- tests/preschoolPassiveSpineTests.ts tests/annualPassiveMemoryTests.ts
git diff --check
~~~

Confirm the production diff contains exactly 8 new JSON rows and no existing-row edits; the test diff contains only the two focused regressions; no selector/runtime/schema file changed.

## Required Post-GREEN Semantic Verification

- [ ] **Step 8: Run all required focused semantic regressions**

Run each command fresh:

~~~bash
npm exec tsx tests/preschoolPassiveSpineTests.ts
npm exec tsx tests/annualPassiveMemoryTests.ts
npm exec tsx tests/preschoolOriginIsolationTests.ts
npm exec tsx tests/preschoolPlaceholderGovernanceTests.ts
npm exec tsx tests/preschoolLitePaletteBrowserVerifyTests.ts
npm run typecheck
git diff --check
~~~

Required evidence:

- preschoolPassiveSpineTests proves the eight IDs, copy presence, exact age ranges, neutral-only tags, absent statDeltas/flags and existing spine invariants.
- annualPassiveMemoryTests proves 3-beat season packing, deterministic authored-before-gap behavior, distinct IDs, input-state immutability and existing three-month/headless season behavior.
- preschoolOriginIsolationTests proves no foreign canonical-origin content across the origin matrix and writes its existing generated report under artifacts/gates; do not stage that ignored/generated artifact.
- preschoolPlaceholderGovernanceTests proves the existing childhood placeholder boundary remains unchanged.
- preschoolLitePaletteBrowserVerifyTests proves the existing age-5/age-7 lite planning palette boundary remains unchanged.
- npm run typecheck proves TypeScript integration without production selector/runtime edits.
- git diff --check proves no whitespace errors.

Semantic Verification must stop if any check fails. It must not be replaced by a natural-run claim.

## Natural PVER Boundary

Natural Player-visible Experience Review is a later independent stage and is not part of this implementation task. Do not run AE, replay, browser/player PVER, or natural observation in this plan.

After Semantic Verification, a later authorized review may examine:

- whether early generic fallback is reduced;
- whether ages 5–7 show more meaningful stage progression;
- whether childhood is less dominated by origin-family skill practice;
- whether any new copy semantically collides with existing content;
- whether whole-pool structural exhaustion remains.

A failed PVER returns to PD-120 Gap Diagnosis. It does not authorize automatic catalog expansion.

## STOP Conditions

Stop and return to Human / Authoring Contract if any of the following occurs:

- an accepted entry requires a field outside id, title, text, originTags, ageMin and ageMax;
- a copy conflicts with the approved Card meaning or scope;
- implementation requires modifying src/data/preschoolPassiveSpine.ts;
- implementation requires modifying src/core/activePlanning/annualPassiveMemory.ts;
- implementation requires changing scheduler, weighting, origin affinity, gap placeholder, history reuse, 0–3 flow, 3-beat shape or 3-month cadence;
- implementation requires Person, choice, Milestone, Relationship, player state, prerequisite/schema, TaskLine, StoryArc or runtime abstraction;
- an approved ID is missing from the catalog without a catalog-only explanation;
- a test can pass only by weakening an assertion, accepting a foreign origin, allowing age-4 access, allowing stats/flags, or changing selector/runtime behavior;
- a test reveals an existing entry was modified, deleted, renamed or assigned a different age window;
- RED cannot fail naturally from missing approved IDs / missing capacity on the starting HEAD.

## Non-goals

This plan does not authorize:

- scheduler tuning;
- selection-weight tuning;
- origin affinity changes;
- generic placeholder copy changes;
- 0–3 content changes;
- origin-specific content;
- Person;
- relationships;
- choices;
- stats;
- flags;
- new schema;
- new runtime;
- HFL;
- AE;
- natural PVER;
- changes to src/data/preschoolPassiveSpine.ts;
- changes to src/core/activePlanning/annualPassiveMemory.ts.

## Plan Self-review

The plan has been checked against the accepted authority and current implementation:

- all 8 approved IDs are listed once in the contract, copy section and RED A contract;
- all age ranges are 5–7 or 6–7 exactly as accepted;
- all 8 final title/text pairs are locked in the plan;
- all 8 rows are explicitly neutral-only and stat/flag free;
- age 4/5/6/7 staging is deterministic and testable;
- RED A and RED B fail naturally on the current starting HEAD because the approved IDs are absent;
- GREEN requires only the catalog addition, with no selector/runtime change;
- the authored-before-gap fixture uses eventHistory and deterministic random input rather than probability claims;
- the plan keeps Semantic Verification separate from natural PVER;
- no temporary or undecided product semantic is left for implementation to invent.

## Implementation Handoff

Future implementation should execute Task 1 as one bounded authoring set, preserving the RED → GREEN sequence. It should not start implementation until this plan has been reviewed as the accepted execution input.

NEXT_REVIEW_INPUT: REPOSITORY_REQUIRED
