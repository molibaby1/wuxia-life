# Active Action-to-Life Echo Semantic Inventory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to execute this plan task-by-task.

**Goal:** Build a complete read-only producer/consumer map for active-action long-term facts, reclassify the 53 immediate-only observations, and recommend exactly one minimal next product Slice.

**Architecture:** Reuse existing Browser observations, checkpoints, complete-life traces, and current source manifests. Combine static owner scans with deterministic artifact analysis; do not change runtime behavior or product contracts.

**Tech Stack:** TypeScript, Node/tsx, JSON manifests, current Snapshot 3.13.0, Markdown reports, existing Trace and Browser artifacts.

## Global Constraints

- Read-only analysis only.
- Do not modify actions, events, conditions, scheduling, summaries, Life Memory, Ending, PlayerState, Snapshot, Contract, UI, persona, oracle, P8, or P11.
- Do not rerun the full 60-decision Browser workflow.
- Reuse existing artifacts first.
- Soft budget is 100k–180k tokens.
- Preserve dirty worktree; do not commit, reset, clean, stash, or discard unrelated changes.
- Recommend exactly one of A–E and do not implement it.

---

### Task 1: Freeze evidence and pre-stage fingerprint

**Files:**
- Create: `tests/experience/actionEchoInventoryTypes.ts`
- Create: `tests/experience/actionEchoInventoryTypes.test.ts`
- Create: `docs/test-reports/active-action-to-life-echo-semantic-inventory.md`

**Produces:**

```ts
type EchoConsumerFlag =
  | 'PERSISTED_STATE'
  | 'EVENT_GATE'
  | 'EVENT_PAYLOAD'
  | 'PERIOD_SUMMARY'
  | 'LIFE_MEMORY'
  | 'ENDING_CLASSIFICATION'
  | 'ENDING_EXPLANATION'
  | 'UI_ONLY';

type EchoDiagnosis =
  | 'NO_PERSISTENT_FACT'
  | 'PERSISTED_ONLY'
  | 'SYSTEM_CONSUMED_NOT_VISIBLE'
  | 'PLAYER_VISIBLE_EVENT_ECHO'
  | 'PLAYER_VISIBLE_SUMMARY_ECHO'
  | 'PLAYER_VISIBLE_ENDING_ECHO';

type CausalConfidence = 'DIRECT' | 'DERIVED' | 'UNPROVEN' | 'NONE';
```

- [ ] Verify the two previous reports exist.
- [ ] Locate the 60 observation artifact, 12 checkpoint manifest, and complete-life Trace artifacts.
- [ ] If an artifact is missing, document the exact missing path before regenerating only that artifact.
- [ ] Define deterministic JSON schemas for producer rows, consumer rows, observation reclassification, and candidate comparison.
- [ ] Test JSON round-trip and stable ordering.
- [ ] Run and record:

```bash
npm test
npm run validate:event-quality
npm run gate:playability
npm run gate:p11-scheduling
git diff --check
```

- [ ] Do not modify failing product or event files.

---

### Task 2: Inventory active-action producers and persistent facts

**Files:**
- Create: `tests/experience/inventoryActiveActionProducers.ts`
- Create: `tests/experience/inventoryActiveActionProducers.test.ts`
- Generate: `.tmp/active-action-echo-inventory/producers.json`

**Produces one row per formal action ID:**

```ts
type ActionProducerRow = {
  actionId: string;
  category: string;
  ownerFile: string;
  immediateEffects: string[];
  persistentFacts: Array<{
    path: string;
    writeType: 'set' | 'increment' | 'decrement' | 'add' | 'remove';
    canonical: boolean;
  }>;
  diminishingReturnSource?: string;
};
```

- [ ] Locate the formal active-action manifest or candidate owner.
- [ ] Enumerate only currently loaded formal actions.
- [ ] Trace execution through the real action executor.
- [ ] Record every canonical write, including lifeStates, attributes, flags, achievements, event records, relationships, Affiliation, and Title where applicable.
- [ ] Distinguish immediate presentation-only values from persisted state.
- [ ] Assert every formal action has exactly one execution owner.
- [ ] Assert all producer rows use stable action IDs.
- [ ] Run producer inventory tests.

---

### Task 3: Inventory formal consumers

**Files:**
- Create: `tests/experience/inventoryActionEchoConsumers.ts`
- Create: `tests/experience/inventoryActionEchoConsumers.test.ts`
- Generate: `.tmp/active-action-echo-inventory/consumers.json`

**Produces:**

```ts
type ActionConsumerRow = {
  factPath: string;
  consumerType: EchoConsumerFlag;
  ownerFile: string;
  formalLoaded: boolean;
  dependency: 'DIRECT' | 'DERIVED';
  playerVisible: boolean;
  visibleSurface?: string;
};
```

- [ ] Scan current formal event manifests before scanning event files.
- [ ] Record event conditions and payloads that read producer facts.
- [ ] Scan period-summary, Life Memory, life-summary, EndingSystem, ending presentation, main-screen, Local/API DTO, and Headless consumers.
- [ ] Mark deferred files `formalLoaded: false`.
- [ ] Do not count test-only assertions as product consumers.
- [ ] Do not infer dependencies from filenames or narrative text.
- [ ] Test that every recorded DIRECT consumer contains an actual code/data read of the fact.
- [ ] Test that deferred consumers are excluded from coverage totals.

---

### Task 4: Build the Echo Matrix and test LifeStates sufficiency

**Files:**
- Create: `tests/experience/buildActiveActionEchoMatrix.ts`
- Create: `tests/experience/buildActiveActionEchoMatrix.test.ts`
- Generate: `.tmp/active-action-echo-inventory/echo-matrix.json`

- [ ] Join producer facts to formal consumers.
- [ ] Preserve multiple consumer flags per action.
- [ ] Assign one primary diagnosis and causal confidence.
- [ ] For `trainingHabit`, `studyHabit`, and `businessHabit`, record:
  - producer actions;
  - persistence;
  - information lost by aggregation;
  - current consumers;
  - player-visible surfaces;
  - suitability for summary, event, and ending use.
- [ ] Identify action IDs that produce no persistent fact.
- [ ] Identify persisted facts with no player-visible consumer.
- [ ] Test the matrix on synthetic rows:
  - no persistent fact;
  - persisted only;
  - event gate not triggered;
  - visible summary;
  - ending explanation.
- [ ] Generate quantitative coverage totals.

---

### Task 5: Reclassify all 53 immediate-only observations

**Files:**
- Create: `tests/experience/reclassifyImmediateOnlyObservations.ts`
- Create: `tests/experience/reclassifyImmediateOnlyObservations.test.ts`
- Generate: `.tmp/active-action-echo-inventory/immediate-only-review.json`

**Produces:**

```ts
type ImmediateOnlyRevision =
  | 'TRUE_IMMEDIATE_ONLY'
  | 'PERSISTED_BUT_INVISIBLE'
  | 'CONSUMER_NOT_TRIGGERED_IN_WINDOW'
  | 'ANALYSIS_FALSE_NEGATIVE'
  | 'INSUFFICIENT_EVIDENCE';
```

- [ ] Load exactly the 53 observations previously classified immediate-only.
- [ ] Attach action producer facts and formal consumers.
- [ ] Require actual Trace or explicit dependency before classifying a visible echo.
- [ ] Do not promote an observation because a theoretical event exists.
- [ ] Record previous classification, revised classification, evidence, and causal confidence.
- [ ] Assert all 53 observations are present exactly once.
- [ ] Produce counts by action category, persona, and age window.
- [ ] Identify whether the prior 53/60 figure materially overstates the problem.

---

### Task 6: Compare A–E using fixed criteria

**Files:**
- Create: `tests/experience/compareActionEchoCandidates.ts`
- Create: `tests/experience/compareActionEchoCandidates.test.ts`
- Modify: the inventory report.

**Produces one row per candidate:**

```ts
type EchoCandidateEvaluation = {
  candidate: 'A' | 'B' | 'C' | 'D' | 'E';
  coveredActionIds: string[];
  coveredObservationCount: number;
  playerPerceptionPoint: string;
  systemsTouched: string[];
  needsNewState: boolean;
  eventQualityRisk: 'none' | 'low' | 'medium' | 'high';
  evidenceStrength: 'strong' | 'moderate' | 'weak';
  disqualifiers: string[];
};
```

- [ ] Evaluate A from existing lifeStates and summary consumers.
- [ ] Evaluate B only against 2–4 concrete high-value formal event opportunities.
- [ ] Evaluate C against current ending classifications and presentation inputs.
- [ ] Evaluate D using the strict new-state necessity test.
- [ ] Evaluate E against actual visible coverage and evidence limitations.
- [ ] Do not use a single weighted score to hide product judgment.
- [ ] Apply the decision order from `current-product-stage.md`.
- [ ] Select exactly one candidate.
- [ ] Explain why each rejected candidate is not the current priority.

---

### Task 7: Complete report and stop

**Files:**
- Modify: `docs/test-reports/active-action-to-life-echo-semantic-inventory.md`
- Modify: `docs/governance/current-product-stage.md`
- Modify: `docs/governance/product-decisions.md` only to merge PD-033.

- [ ] Complete every required report section.
- [ ] Include producer and consumer matrices or links to generated artifacts.
- [ ] State whether current lifeStates are sufficient.
- [ ] State whether new canonical state is necessary.
- [ ] Give one unique next-Slice recommendation.
- [ ] Explicitly state that the recommendation was not implemented.
- [ ] Merge PD-033 using the next free number if needed.
- [ ] Re-run:

```bash
npm test
npm run validate:event-quality
npm run gate:playability
npm run gate:p11-scheduling
git diff --check
```

- [ ] Compare exact failure fingerprints.
- [ ] Run all inventory-specific tests.
- [ ] Mark complete and stop without implementing A, B, C, D, or E.
