# P25 Wave 1 Review Fix Prompts

Ordered fixes from A1 Planner-Verify (2026-06-23).

---

## Fix 1 — Required: `lone_sword_legend` simulation reachability

**Context:** `docs/test-reports/p25-lifetime-simulation-baseline-metrics.json` lists unlock rates for 4/5 mainstream achievements. `lone_sword_legend` never unlocks across seeds 1001–1024.

**Root cause:** In `src/p25/validationSlices.ts`, `lone_sword_path` uses `connections: 10` but `WUXIA_COMPOSITE_DESTINY_OUTCOMES` for `lone_sword_legend` requires `social_capital minValue: 15` (frozen P16 semantics: ≥15).

**Tasks:**
1. Update `lone_sword_path` fixture so `connections >= 15` while keeping `p16_rare_master_encounter` and without `p16_alliance_brokered`.
2. Re-run `npm exec tsx scripts/runP25SimulationBaseline.ts`.
3. Confirm `achievementUnlockRates.lone_sword_legend > 0` in output JSON.
4. Update `docs/test-reports/p25-lifetime-simulation-baseline-metrics.md`, `p25-wave1-rebalance-evidence.md`, and `p25-wave1-closure-report.md` metrics tables if values change.
5. Re-run `npm exec tsx tests/p25LifetimeSimulationTests.ts`.

**Acceptance:** Baseline JSON includes all 5 frozen mainstream achievement IDs with non-zero unlock rate for `lone_sword_legend` on at least one seed bucket; tests and gates remain PASS.

---

## Fix 2 — Optional: pathDivergenceProxy direction gap

**Context:** Post-rebalance `pathDivergenceProxy` is 0.208; baseline acceptance direction mentions ≥0.25.

**Tasks:** Either tune representative paths/seeds to approach 0.25, or document in closure that 0.25 is aspirational and defer to Wave 2 sim tuning.

**Acceptance:** Closure report and baseline MD explicitly state met/deferred status for the 0.25 direction target.

---

## Fix 3 — Optional: stale discovery gaps doc

**Context:** `agent_docs/p25-wuxia-lifetime-simulation-experience-gaps.md` still describes pre-implementation bootstrap state.

**Tasks:** Run post-run discovery or manually update the doc to reflect Wave 1 completion and remaining North Star gaps for Wave 2+.

**Acceptance:** Gaps doc no longer claims US-001..008 are pending or achievements missing from config.
