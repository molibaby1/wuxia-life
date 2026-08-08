# Life Memory Unlock Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a blocking, explicit confirmation card when a new formal Achievement or derived Life Milestone appears after a gameplay result.

**Architecture:** Keep Achievement and Milestone derivation unchanged. Add one pure diff helper that compares two `LifeMemorySummary` projections and returns only newly visible entries, then let `GameScreen` own the transient notice and confirmation gate. The notice is presentation-only: it is not persisted, does not modify `GameState`, and uses the existing Local/API Life Memory inputs.

**Tech Stack:** Vue 3 `<script setup>`, TypeScript, existing `LifeMemorySummary` types, repository `tsx` test runners.

## Global Constraints

- Do not add PlayerState, GameState, Snapshot, save, migration, or milestone-ledger fields.
- Do not change Achievement/Milestone condition evaluation, labels, priorities, or rewards.
- Do not show notices for existing entries on initial mount or after loading a save/session.
- Only entries with `visibility === 'player'` can be shown.
- Multiple entries produced by one state update are combined into one notice and dismissed together.
- Preserve the existing dirty worktree; modify only the files listed below.

---

### Task 1: Add a pure new-unlock diff helper

**Files:**
- Create: `src/components/lifeMemoryFeedback.ts`
- Test: `tests/lifeMemoryFeedback.test.ts`
- Modify: `tests/runRealTestGate.ts`

**Interfaces:**
- Consumes: `LifeMemorySummary` from `src/types/lifeMemory.ts`.
- Produces: `LifeMemoryFeedbackItem` and `collectNewLifeMemoryFeedback(previous, current)` for `GameScreen.vue`.

- [ ] **Step 1: Write the failing tests**

```ts
import { strict as assert } from 'node:assert';
import { collectNewLifeMemoryFeedback } from '../src/components/lifeMemoryFeedback';
import type { LifeMemorySummary } from '../src/types/lifeMemory';

const base = (overrides: Partial<LifeMemorySummary> = {}): LifeMemorySummary => ({
  schemaVersion: '3.1.0',
  derivedAtAge: 18,
  ...overrides,
});

const milestone = (id: string, label: string) => ({
  id, visibility: 'player' as const, sortKey: 80, label,
  description: `${label}说明`, category: 'study' as const,
  evidenceLabels: ['主动读书 1 次'],
  diagnostic: { milestoneId: id.replace('milestone-', ''), conditionTypes: ['action_count' as const] },
});

const achievement = (id: string, label: string) => ({
  id, visibility: 'player' as const, sortKey: 70, label,
  category: 'moral' as const, diagnostic: { achievementId: id, sourceFlags: [] },
});

const previous = base({ achievedMilestones: [milestone('milestone-old', '旧印记')], achievements: [] });
const current = base({
  achievedMilestones: [milestone('milestone-old', '旧印记'), milestone('milestone-new', '新印记')],
  achievements: [achievement('save-village', '拯救村庄')],
});
const feedback = collectNewLifeMemoryFeedback(previous, current);
assert.deepEqual(feedback.map(item => item.id), ['achievement-save-village', 'milestone-new']);
assert.equal(feedback[1]?.description, '新印记说明');
assert.deepEqual(collectNewLifeMemoryFeedback(current, current), []);
assert.deepEqual(collectNewLifeMemoryFeedback(base(), base()), []);
console.log('lifeMemoryFeedback: ok');
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm exec -- tsx tests/lifeMemoryFeedback.test.ts`

Expected: FAIL because `src/components/lifeMemoryFeedback.ts` does not yet export the helper.

- [ ] **Step 3: Implement the minimal helper**

Define the output shape as:

```ts
export type LifeMemoryFeedbackKind = 'achievement' | 'milestone';

export interface LifeMemoryFeedbackItem {
  id: string;
  kind: LifeMemoryFeedbackKind;
  label: string;
  description?: string;
  evidenceLabels: string[];
}
```

`collectNewLifeMemoryFeedback` must build visible current entries, compare IDs against the corresponding visible previous entries, return new Achievements first and new Milestones second, and keep each source array's existing order. Formal Achievements have no description/evidence in the current contract, so return an empty evidence array and omit description; Milestones copy `description` and `evidenceLabels`.

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `npm exec -- tsx tests/lifeMemoryFeedback.test.ts`

Expected: PASS with `lifeMemoryFeedback: ok`.

- [ ] **Step 5: Register the focused suite**

Add `{ name: 'lifeMemoryFeedback', entry: 'tests/lifeMemoryFeedback.test.ts' }` beside the existing Life Memory/Milestone suites in `tests/runRealTestGate.ts`, without changing any other gate registration.

### Task 2: Render and confirm the blocking notice in GameScreen

**Files:**
- Modify: `src/components/GameScreen.vue`
- Modify: `tests/gameScreenPresentationTests.ts`

**Interfaces:**
- Consumes: `lifeMemorySummary` and `collectNewLifeMemoryFeedback` from Task 1.
- Produces: a transient `lifeMemoryFeedbackNotice` rendered above the game content, plus a `confirmLifeMemoryFeedback` handler.

- [ ] **Step 1: Add presentation-source assertions**

Extend `tests/gameScreenPresentationTests.ts` to assert that `GameScreen.vue` contains:

```ts
assert(source.includes('collectNewLifeMemoryFeedback'), 'GameScreen must diff Life Memory feedback');
assert(source.includes('lifeMemoryFeedbackNotice'), 'GameScreen must render the unlock notice state');
assert(source.includes('aria-modal="true"'), 'unlock notice must be modal to assistive technology');
assert(source.includes('知道了'), 'unlock notice must require explicit confirmation');
assert(source.includes('if (lifeMemoryFeedbackNotice.value) return;'), 'continuation must be blocked while notice is open');
```

- [ ] **Step 2: Run the presentation test and verify it fails**

Run: `npm exec -- tsx tests/gameScreenPresentationTests.ts`

Expected: FAIL because the notice state and markup do not exist yet.

- [ ] **Step 3: Add the transient notice state and baseline watcher**

Import `watch` and the Task 1 helper. Keep a non-reactive `Set<string>` of seen feedback IDs and a `hasLifeMemoryBaseline` flag. Watch `lifeMemorySummary` with `immediate: true`; on the first callback, seed the set from the current player-visible Achievement/Milestone IDs without opening a notice. On later callbacks, compare the previous/current summaries, ignore IDs already seen, add new IDs to the set, and set the notice to the returned batch when non-empty. This prevents initial page load and save/session restore from replaying historical unlocks while still surfacing a result that appears during the active session.

- [ ] **Step 4: Add the blocking card markup**

Render a fixed backdrop/card when `lifeMemoryFeedbackNotice` is non-null:

```vue
<div v-if="lifeMemoryFeedbackNotice" class="life-memory-feedback-backdrop">
  <section class="life-memory-feedback-card" role="dialog" aria-modal="true" aria-labelledby="life-memory-feedback-title">
    <p class="progression-source-label">新的成长反馈</p>
    <h2 id="life-memory-feedback-title">{{ lifeMemoryFeedbackNotice.title }}</h2>
    <ul>
      <li v-for="item in lifeMemoryFeedbackNotice.items" :key="item.id">
        <strong>{{ item.label }}</strong>
        <span v-if="item.description">{{ item.description }}</span>
        <span v-for="evidence in item.evidenceLabels" :key="`${item.id}-${evidence}`">依据：{{ evidence }}</span>
      </li>
    </ul>
    <button type="button" class="continue-btn btn" @click="confirmLifeMemoryFeedback">知道了</button>
  </section>
</div>
```

Use “新的成就” when the batch contains only Achievements, “新的里程碑” when it contains only Milestones, and “新的成就与里程碑” for a mixed batch. Do not add an auto-dismiss timer or a close-on-backdrop-click path.

- [ ] **Step 5: Gate continuation and style the card**

At the beginning of `continueToNext`, return while the notice is open. `confirmLifeMemoryFeedback` clears only the transient notice. Add scoped styles that make the backdrop fixed and full viewport, keep the card keyboard/focus-visible friendly, and ensure it sits above choices and progression cards without changing underlying content layout.

- [ ] **Step 6: Run the presentation test and verify it passes**

Run: `npm exec -- tsx tests/gameScreenPresentationTests.ts`

Expected: PASS with `gameScreenPresentationTests: ok`.

### Task 3: Typecheck and run the narrow regression bundle

**Files:**
- No additional source files; inspect only the Task 1–2 diff.

- [ ] **Step 1: Run the focused helper and presentation tests together**

Run: `npm exec -- tsx tests/lifeMemoryFeedback.test.ts && npm exec -- tsx tests/gameScreenPresentationTests.ts`

Expected: both exit 0.

- [ ] **Step 2: Run TypeScript validation**

Run: `npm run typecheck`

Expected: exit 0 with no new diagnostics.

- [ ] **Step 3: Review the diff boundary**

Run: `git diff -- src/components/lifeMemoryFeedback.ts src/components/GameScreen.vue tests/lifeMemoryFeedback.test.ts tests/gameScreenPresentationTests.ts tests/runRealTestGate.ts`

Confirm every changed line belongs to unlock feedback, no formal-state or persistence code changed, and pre-existing dirty files remain untouched.

- [ ] **Step 4: Commit only the approved feature files**

After the user approves implementation and all checks pass, stage only:

```bash
git add src/components/lifeMemoryFeedback.ts src/components/GameScreen.vue tests/lifeMemoryFeedback.test.ts tests/gameScreenPresentationTests.ts tests/runRealTestGate.ts
git commit -m "feat: show explicit life milestone feedback"
```
