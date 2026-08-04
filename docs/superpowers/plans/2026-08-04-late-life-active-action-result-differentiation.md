# Late-Life Active Action Result Differentiation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Make late-life active-action result feedback deterministic, fact-based, and visibly different across action categories, actual deltas, repetition, and diminishing returns without changing gameplay behavior.

**Architecture:** First identify the single formal result owner and the existing before/after data flow. Extend or extract one shared pure presentation builder, then route Local, API, Headless, and Browser through the same semantic output. Validate with 12–16 focused scenarios and existing non-green failure fingerprints.

**Tech Stack:** TypeScript, Vue 3, Vite, current Local/API/Headless session contracts, Node/tsx tests, existing Browser harness.

## Global Constraints

- Do not modify action candidates, unlocks, costs, rewards, probability, diminishing-return rules, events, scheduling, PlayerState, Snapshot, Life Memory, persona, oracle, P8, or P11.
- Do not create action history or a generic narrative/template framework.
- Do not claim long-term echoes that did not occur.
- Reuse existing Baseline checkpoints and Browser harness.
- Browser sample limit is 12–16 focused scenarios.
- Soft execution budget is 150k–250k tokens.
- Preserve dirty worktree; do not commit, reset, clean, stash, or discard unrelated changes.
- Compare known non-green failures before and after.

---

### Task 1: Capture owner, baseline, and failing result tests

**Files:**
- Create: `tests/activeActionResultDifferentiation.test.ts`
- Create: `docs/test-reports/late-life-active-action-result-differentiation.md`
- Modify: `tests/runRealTestGate.ts`

**Interfaces:**
- Consumes: current active-action execution result, before/after state, Local/API/Headless result DTO, Browser result consumer.
- Produces: failing tests that define factual and deterministic result semantics.

- [ ] Trace the real data flow from action choice to Browser result and document:
  - execution owner;
  - before/after capture;
  - public delta owner;
  - diminishing-return source;
  - summary builder;
  - Local/API mapper;
  - Headless consumer;
  - Browser consumer.
- [ ] Run and record the pre-stage failure fingerprint:

```bash
npm test
npm run validate:event-quality
npm run gate:playability
npm run gate:p11-scheduling
git diff --check
```

- [ ] Write focused tests for:
  - martial normal positive delta;
  - martial diminishing return;
  - study normal positive delta;
  - study diminishing return;
  - business positive result;
  - business zero or negative result;
  - identical input determinism;
  - actual delta overriding theoretical configured effect.
- [ ] Write guards asserting the summary contains no:
  - hidden threshold;
  - future event promise;
  - ending prediction;
  - random variation.
- [ ] Register the suite in `tests/runRealTestGate.ts`.
- [ ] Run the suite and confirm it fails against the current repetitive behavior.

---

### Task 2: Implement the minimal shared result builder

**Files:**
- Modify: the existing formal result builder if one exists.
- Create only if necessary: `src/core/activeActionResultPresentation.ts`.
- Modify: the smallest existing execution-to-presentation owner set.

**Interfaces:**
- Produces one deterministic result presentation from existing formal inputs.

- [ ] Reuse existing public delta types and action metadata.
- [ ] Implement category-specific factual phrasing for the currently formal action categories.
- [ ] Handle:
  - positive delta;
  - negative delta;
  - zero delta;
  - mixed positive/negative delta;
  - diminishing return.
- [ ] Keep the canonical delta object unchanged.
- [ ] Do not execute effects or read hidden future outcomes.
- [ ] Do not add persistent counters.
- [ ] Ensure same input produces byte-identical output.
- [ ] Run:

```bash
npm exec -- tsx tests/activeActionResultDifferentiation.test.ts
npm run typecheck
```

Expected: focused semantic tests pass; remaining failures should be mapper or UI parity work.

---

### Task 3: Unify Local/API/Headless semantic output

**Files:**
- Modify: current session result DTO and mapper owners only where required.
- Modify: current Headless result extraction.
- Test: extend focused suite or create `tests/activeActionResultParity.test.ts`.

**Interfaces:**
- All execution modes consume the same summary and delta semantics.

- [ ] Identify whether Local and API currently rebuild result text separately.
- [ ] Remove duplicate semantic construction; keep transport-only mapping.
- [ ] Verify Local and API produce identical:
  - summary;
  - delta;
  - diminishing-return notice.
- [ ] Verify Headless records the same semantic output without reading Browser DOM.
- [ ] Do not modify Snapshot or persistent game state.
- [ ] Cover:
  - one martial normal case;
  - one study diminishing case;
  - one business negative or zero case.
- [ ] Run:

```bash
npm exec -- tsx tests/activeActionResultDifferentiation.test.ts
npm exec -- tsx tests/activeActionResultParity.test.ts
npm run typecheck:p6b
```

---

### Task 4: Update the Browser result consumer

**Files:**
- Modify: the existing Browser result-card component or view model that owns active-action result display.
- Do not modify unrelated event, period-summary, disturbance, or ending components.

**Interfaces:**
- Browser displays the shared formal result presentation.

- [ ] Preserve the current player-controlled continue flow.
- [ ] Display:
  - action-specific summary;
  - actual canonical delta;
  - diminishing-return notice when applicable.
- [ ] Avoid duplicate display of the same summary in base text and detail card.
- [ ] Do not add a long-term-echo section.
- [ ] Ensure zero delta is not presented as success.
- [ ] Ensure negative delta is visible and not softened into a positive claim.
- [ ] Run:

```bash
npm run typecheck
npm run build
```

---

### Task 5: Execute the 12–16 focused scenario matrix

**Files:**
- Reuse: previous Baseline Browser harness and checkpoint artifacts where still valid.
- Create only if necessary: `tests/activeActionResultBrowserAcceptance.ts`.
- Modify: the stage report.

**Interfaces:**
- Produces Browser evidence without rerunning the full 60-decision Baseline.

- [ ] Cover at least 12 scenarios:
  1. martial normal;
  2. martial repeat;
  3. martial diminishing;
  4. study normal;
  5. study repeat;
  6. study diminishing;
  7. business positive;
  8. business low, zero, or negative;
  9. business repeat or diminishing;
  10. martial-to-study switch;
  11. study-to-business switch;
  12. business-to-another-visible-action switch.
- [ ] Include:
  - one Local path;
  - one API path;
  - one middle-age sample;
  - one late-life sample;
  - one explicit negative or zero delta.
- [ ] Verify each visible result against the actual before/after state.
- [ ] Verify no application Console errors.
- [ ] Verify desktop and 390px no horizontal overflow.
- [ ] Stop at 16 scenarios; do not expand into another full Baseline.

---

### Task 6: Close verification and report

**Files:**
- Modify: `docs/test-reports/late-life-active-action-result-differentiation.md`
- Modify: `docs/governance/current-product-stage.md`

**Interfaces:**
- Produces completion evidence and preserves Action-to-Life Echo as deferred.

- [ ] Report:
  - root cause and owner;
  - changed files;
  - formal inputs used by the builder;
  - determinism evidence;
  - scenario matrix;
  - Local/API/Headless parity;
  - Browser evidence;
  - statements explicitly not made about long-term echoes.
- [ ] Run:

```bash
npm run typecheck
npm run typecheck:p6b
npm run build
npm test
npm run validate:event-quality
npm run gate:playability
npm run gate:p11-scheduling
git diff --check
```

- [ ] Compare `npm test` and event-quality failures against the pre-stage fingerprint.
- [ ] Confirm the new focused suites were actually executed by `npm test`.
- [ ] Mark complete only when:
  - no gameplay behavior changed;
  - result text reflects actual delta;
  - category and diminishing cases differ;
  - parity holds;
  - focused Browser matrix passes;
  - known failure set did not expand.
- [ ] Stop after completion. Do not implement Action-to-Life Echo.
