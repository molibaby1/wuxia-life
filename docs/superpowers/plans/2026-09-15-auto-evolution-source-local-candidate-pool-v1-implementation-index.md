# Auto Evolution Source-local Candidate Pool v1 Implementation Program

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace winner-takes-all first-hypothesis processing with the Human-accepted Source-local Candidate Pool / Multi-candidate Session v1 while preserving PD-111 evidence isolation, PD-100 HFL semantics, fail-closed execution boundaries, and legacy report readability.

**Architecture:** This program is intentionally split into three execution plans. Plan A lands authority and establishes candidate/pool contracts plus a candidate-local lane and deterministic serial scheduler. Plan B adds durable Logical Session state, Host slice budgeting/resume, candidate-local continuation, source-change execution, and HFL retention. Plan C migrates reporting/indexing/durable-evidence semantics and closes backward compatibility. Each plan must be reviewed and verified before the next plan begins.

**Tech Stack:** TypeScript, Node.js fs/path/crypto APIs, custom executable TypeScript test files (`npm exec -- tsx ...`), existing Wuxia-Life AE contracts and Phase0 provenance, existing P2 configuration execution and HFL/reporting infrastructure.

**Spec:** `docs/designs/auto-evolution-source-local-candidate-pool-v1.md` — source copy supplied in this handoff at `approved/auto-evolution-source-local-candidate-pool-v1.md`.

## Global Constraints

- Baseline repository: `molibaby1/wuxia-life`, branch `dev`, verified planning HEAD `99a37a93785bfccadad3fdfc9281dff2b3ea472e`.
- Before implementation, re-read current `dev`; if HEAD moved, re-check every touched file and update line references without changing the Human-accepted semantics.
- Authority Gate precedes runtime code: land the accepted design spec, PD-118, `auto-evolution-model.md` sync, and `current-product-stage.md` sync in a documentation-only commit.
- Core invariant: `candidate terminal != candidate pool exhausted`.
- Original hypothesis order is deterministic processing order only; never derive importance, quality, priority, or survival from it.
- No LLM Selector, ranking, priority score, semantic filter, candidate merge, semantic dedupe, cross-source candidate matching, or cross-source rebinding.
- PD-111 remains fail-closed: diagnostic scope equals `activeCandidate.evidenceRefs`; raw Phase0 internal source and forbidden hidden data never enter Solution/Reviewer workspaces.
- Candidate lifecycle is orthogonal to Decision route. Ordinary `SKIP`, `DEFER`, `ESCALATE_HUMAN`, and terminal `DEFER_MORE_WORK_REQUESTED` complete one candidate and continue the Pool.
- Effective `READY_FOR_CONFIG_EXECUTION` is a source-change barrier; do not activate a later current-source candidate after READY.
- Only successful authorized execution + scope verification + deterministic verification + real rerun + valid sealed new source may supersede old pending candidates.
- Maximum source-changing transitions per Logical Session remains exactly `1` in v1.
- Each Candidate Lane gets at most one bounded continuation; ordinary semantic retry remains `0`; envelope retransmission remains separate transport recovery.
- Per Host execution slice Participant hard workflow budget is exactly `11` jobs; normal budget pause occurs only at candidate boundaries.
- A started Candidate Lane must have enough admitted capacity to finish its maximum legal lane unless a real fail-closed failure occurs.
- HFL trigger scope is unchanged: only effective formal `ESCALATE_HUMAN` automatically creates retained HFL state.
- Logical Session does not own an overall product route. Session lifecycle is workflow state only.
- Historical multi-round manifests, reports, Selection artifacts, and HFL items remain readable; do not rewrite or backfill historical evidence.
- Do not expand autonomous code/config authority, Participant/model routing, full P3, or gameplay/content scope.
- Do not weaken repository/provenance/scope/verification fail-closed checks to make the migration pass.
- Use TDD for behavior changes: failing targeted test → minimal implementation → targeted pass → commit.
- Run verification commands fresh before each completion claim.

---

## Current Implementation Facts to Preserve or Replace Deliberately

At the planning baseline:

- `scripts/evolution/runProblemAgnosticAgentSolutionLoop.ts` performs Feedback → Hypothesis → `selectFirstHypothesis` → bounded attribution → Problem Package → Solution → optional Reviewer → Decision, and writes `selection/selected-hypothesis.json`.
- `scripts/evolution/freshProblemTransfer/selectFirstHypothesis.ts` deterministically selects array index `0`; this is the winner-selection implementation leaving the new active path.
- `scripts/evolution/multiRoundRunManifestContract.ts` owns legacy `multi-round-run-manifest-v1/v2` and summaries, including `lastRoundTerminalRoute`; keep it as a legacy read contract.
- `scripts/evolution/multiRoundExecutionValidation.ts` owns current two-round orchestration, one session-wide continuation, 11-job session budget, one source-changing execution, verification, and rerun.
- `scripts/evolution/operator/runOrdinaryEvolution.ts` currently creates a new session per invocation under `.tmp/evolution/<sessionId>` and archives one ordinary-run capsule/report per invocation.
- `scripts/evolution/humanFollowup/retainHumanFollowupWorkItem.ts` currently retains `selection/selected-hypothesis.json`; the new path must retain candidate activation/original hypothesis provenance instead.
- `scripts/evolution/reporting/buildOperationalRunReport.ts`, `buildHumanReviewSummary.ts`, and `buildOperationalObservabilityIndex.ts` assume round/workflow-oriented single-route observability and must gain new-schema paths without breaking legacy inputs.
- `scripts/evolution/problemAgnosticSolution/agentWorkspace.ts` fingerprints the authoritative product surface while `scripts/evolution/workspaceAuthoritySurface.ts` excludes `artifacts/**` and `.tmp/evolution/**`. This permits durable Host state under `artifacts/evolution/**` without making Host metadata look like a product-source mutation.
- `package-project.sh` includes normal `artifacts/evolution/**` files except the separately curated `artifacts/evolution/run-evidence` root and pruned generic `inputs`/`workspaces` directories. The durable session-state layout must remain package-visible and must not use pruned generic directory names for required state.

---

## Program Order

1. **Plan A — Authority, Contracts, Candidate Lane, Serial Pool Foundation**  
   File: `docs/superpowers/plans/2026-09-15-auto-evolution-candidate-pool-v1-plan-a-foundation.md`
2. **Plan B — Durable Logical Session, Resume, Budget, Source Transition, HFL**  
   File: `docs/superpowers/plans/2026-09-15-auto-evolution-candidate-pool-v1-plan-b-runtime.md`
3. **Plan C — Reporting, Snapshots, Index, Durable Evidence, Legacy Closure**  
   File: `docs/superpowers/plans/2026-09-15-auto-evolution-candidate-pool-v1-plan-c-observability.md`

Do not start Plan B before Plan A acceptance. Do not start Plan C before Plan B acceptance.

---

## Program Acceptance Matrix

The whole program is complete only when all rows are proven by fresh tests or deterministic integration evidence:

| Scenario | Required result |
| --- | --- |
| Zero hypotheses | Existing `noProblemAssessment` remains authoritative; no synthetic candidate or Selection artifact |
| H1 `SKIP`, H2 exists | H1 `COMPLETED`; H2 is activated |
| H1 `DEFER`, H2 exists | H1 `COMPLETED`; H2 is activated |
| H1 `ESCALATE_HUMAN`, H2 exists | One retained HFL item for H1; H2 continues |
| H1 uses continuation, H2 later requests more work | H2 still has its own one-continuation entitlement |
| H2 is original `hypothesis-000002` | H2 remains `hypothesis-000002`; it is never renumbered to `000001` |
| H2 diagnostic attribution | Exact scope equals H2 `evidenceRefs`; H1/H3 evidence cannot leak in |
| Host slice lacks capacity to start H3 | Session `PAUSED` at candidate boundary; H3 remains `PENDING` |
| Resume same session | Feedback/Hypothesis are not rerun for the same Source Epoch; exact next PENDING candidate activates |
| Repository/source/hypothesis/binding mismatch on resume | Fail closed; no silent rebase/regeneration/rebinding |
| Crash after valid terminal candidate artifacts but before Pool update | Deterministic reconciliation; no semantic retry |
| Crash before valid terminal candidate artifacts | Candidate/Session interrupted; no semantic retry |
| Candidate READY | Pool enters source-change barrier; no later current-source candidate starts |
| READY execution succeeds and new sealed Source B exists | Old pending candidates become `SUPERSEDED`; Source B gets a fresh Feedback/Hypothesis/Pool |
| Execution/verification/rerun fails | Old pending candidates are not superseded; Session fail-closes |
| Source B produces another READY | Pause at source-change authority limit; no second mutation |
| Two candidates escalate | Two independent HFL items; no semantic merge |
| Mixed SKIP + DEFER + ESCALATE | Report shows independent candidate facts; no overall/dominant route |
| Paused session with HFL item | Human surface can show both `RESUME_SESSION` and `REVIEW_HUMAN_FOLLOWUP` |
| Multiple Host slices | Multiple immutable report snapshots group under one Logical Session in the index |
| Legacy v1/v2 manifests and historical reports | Continue to parse/render without migration or backfill |
| Paused logical session | Recoverable evidence may exist, but terminal forensic closure is not claimed |

---

## Program-Wide Verification Gate

At the end of each plan, run the targeted `npm exec -- tsx tests/evolution/<file>.test.ts` commands named in that plan. At final closure run the repository commands that actually exist on current `dev`:

```bash
npm run typecheck
npm run test:contracts
npm run build
git diff --check
```

Then run the existing project real test gate only after the implementation is otherwise green. In current `package.json`, that gate is `npm test` (`tsx tests/runRealTestGate.ts`):

```bash
npm test
```

If `npm test` has an unrelated pre-existing failure, preserve the full output and classify it; do not weaken the gate or broaden this implementation to fix unrelated gameplay issues.

Do not manufacture a natural `READY_FOR_CONFIG_EXECUTION` run solely to improve acceptance evidence. Deterministic test fixtures are sufficient for implementation closure; subsequent natural RUN / OBSERVE evidence is a separate product observation step.
