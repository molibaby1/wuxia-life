# PRD — Auto Evolution Skeleton 005: Investigation → Modification Work

> 状态：CLOSED / Human accepted（2026-08-15 corrective Human final review PASS）
>
> 首次真实 invocation：REJECTED（target-specific solution leakage）；historical evidence retained。
> current Modification Work proposal：NOT YET ACCEPTED FOR IMPLEMENTATION。
> Auto PRD / game modification / Candidate / Phase 0 / 下一 Skeleton：NOT YET AUTHORIZED。

## Goal

Prove one real, Human-selected, already completed Hypothesis Investigation can produce at most one bounded, traceable, player-observable Modification Work Proposal for Human review, then STOP.

## Authority

This PRD is subordinate to:

1. `docs/product/auto-evolution-model.md`
2. Human ACCEPTED Skeleton 005 design / this stage execution task

If this PRD, its paired JSON, or runtime inference disagree, higher authority wins:

`auto-evolution-model + accepted stage design > PRD.md > prd.json > runtime inference`

This PRD does not create a generic Participant / Planner / Skill / permission framework.

## Fixed real target

- runRef: `minimal-external-feedback-smoke-001`
- hypothesisId: `hypothesis-000002`

The target must already exist as a completed Hypothesis Investigation with consistent provenance/hashes. If it cannot be verified, zero external calls and STOP. Do not rerun game, feedback, hypothesis, or investigation to backfill it.

## External smoke authorization

After every deterministic prerequisite passes, exactly one DeepSeek Modification Work invocation is authorized:

- provider: `deepseek`
- model requested: `deepseek-v4-flash`
- thinking: disabled
- input: fixed allowlist only — selected hypothesis, structured investigation, bounded evidence pack, necessary provenance
- no repository / source code / PRD / Git / historical Skeleton evidence
- no retry / no second participant call

## Result contract

Result is a strict `proposal | no_proposal` union.

A proposal must include `proposedChange`, `scopeRefs`, `evidenceRefs`, `expectedPlayerObservableDifference`, `unknowns`, `risks`, and `nonGoals`.

- `scopeRefs` must sit in the current-product bounded mechanism slice
- `evidenceRefs` must exist in the supplied evidence
- unknown fields fail closed
- reject `patch`, `file path`, `implementation steps`, `PRD`, `shell command`, `score`, `confidence`, and similar out-of-bound fields

`no_proposal` is a legal completed invocation, but it cannot prove Skeleton 005 success.

Participant proposal is not product truth and not an automatic modification command.

## Acceptance

The single Story passes only if:

1. the sealed completed investigation for the fixed target verifies (status, hashes, provenance);
2. `npm run typecheck` passes;
3. `npx tsx tests/evolution/runModificationWorkTests.ts` passes;
4. `npx tsx tests/evolution/runHypothesisInvestigationTests.ts` passes;
5. exactly one authorized DeepSeek Modification Work invocation completes;
6. raw provider/participant responses are preserved;
7. the structured result is a validated proposal with in-slice scope refs, in-pack evidence refs, and a player-observable expected difference;
8. Human review evidence is produced;
9. execution STOPs without executable PRD, Wuxia-Life change, Candidate, Phase 0, or the next Skeleton.

Contract tests passing alone do not announce Skeleton 005 product PASS. Human final review remains required. This PRD must not be written CLOSED by implementation.

## Product closure

- First real invocation: **REJECTED** during Human final review. Reason: target-specific solution leakage in production prompt. Archived at `artifacts/reports/evolution/modification-work/modification-work-runs/minimal-external-feedback-smoke-001/_rejected-first-pass-hypothesis-000002/`. Historical evidence retained; not success evidence.
- Corrective: generic Role instructions + contamination tests + exactly one additional DeepSeek invocation. Evidence: `.tmp/evolution/skeleton-005/`.
- Corrective Human final review: **PASS**（2026-08-15）.
- Skeleton 005: **CLOSED / Human accepted**.
- current Modification Work proposal remains **NOT YET ACCEPTED FOR IMPLEMENTATION**.
- Auto PRD / game modification / Candidate / Phase 0 / next Skeleton remain **NOT YET AUTHORIZED**.
