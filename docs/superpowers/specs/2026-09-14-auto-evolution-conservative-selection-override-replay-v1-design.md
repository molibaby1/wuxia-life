# Auto Evolution Conservative Selection Override Replay v1

## 1. Status

Status: DESIGN WRITTEN — AWAITING HUMAN SPEC REVIEW.

This spec defines an experiment only. It does not change production Selection, Product Decisions, Participant Contracts, Hypothesis generation, Solution / Reviewer behavior, PD-111 / PD-117, or gameplay.

The experiment asks one question:

> Given the current deterministic Selection baseline, can a semantic selector override it only when one challenger has clear, auditable superiority for the current bounded investigation slot, while otherwise keeping the baseline or explicitly abstaining?

A diagnostic pass does not authorize production change. It only allows a full 8-case frozen confirmatory replay.

---

## 2. Evidence Basis

Frozen source corpus:

```text
artifacts/ae-selection-priority-replay-v1-20260911/corpus.json
schemaVersion = ae-selection-priority-replay-corpus-v1
repositoryHead = 657b14b4b81ef4f3b3dc7ee1836e799d4497a13b
caseCount = 8
```

Historical Semantic Selection Replay:

```text
model = deepseek-v4-flash
8 cases × original/reversed = 16 jobs
success = 15
participant contract failure = 1
technical failure = 0
retry = 0
```

Repeatability replay added 16 independent invocations over four diagnostic cases, again with 15 successes and one participant contract failure.

Observed diagnostic patterns:

```text
ordinary-run-20260910-000005 → stable broad-materiality regression
ordinary-run-20260910-000006 → semantic near-tie / underdetermination
ordinary-run-20260910-000007 → strong presentation sensitivity
ordinary-run-20260911-000002 → mixed instability
```

The working root-cause hypothesis is not simple identity leakage, provider failure, or only presentation order. The current semantic objective is underdetermined: four qualitative criteria are treated as peer criteria while the Participant is forced to emit exactly one winner, with no eligibility gate, baseline opportunity cost, near-tie policy, or abstention boundary.

---

## 3. Experimental Scope

Diagnostic cases are frozen to exactly four:

```text
ordinary-run-20260910-000005
ordinary-run-20260910-000006
ordinary-run-20260910-000007
ordinary-run-20260911-000002
```

Each uses the already frozen:

```text
original
reversed
```

presentations. Candidate semantic content must not be regenerated or rewritten.

Matrix:

```text
4 cases × 2 presentations × 3 independent samples = 24 invocations
```

Model remains:

```text
deepseek-v4-flash
```

No model A/B, temperature tuning, best-of-N, voting, second judge, new natural run, Solution replay, Reviewer replay, or production modification is allowed.

---

## 4. Baseline

The deterministic baseline is the source hypothesis at `sourceIndex = 0`, matching current production's first-hypothesis rule.

The baseline is a conservative fallback, not a gold answer.

The trusted harness maps that source hypothesis to the presentation-local `candidateRef` and exposes only:

```text
baselineCandidateRef
```

The Participant must not receive historical source index, historical selection identity, presentation identity, or downstream outcome.

The same source baseline may therefore have different candidateRefs under original and reversed presentations.

---

## 5. Participant-Visible Input

Schema:

```text
ae-conservative-selection-input-v1
```

Shape:

```json
{
  "schemaVersion": "ae-conservative-selection-input-v1",
  "baselineCandidateRef": "candidate-X",
  "candidates": [
    {
      "candidateRef": "candidate-A",
      "hypothesis": "...",
      "observedBasis": ["..."],
      "feedbackRefs": ["..."],
      "evidenceRefs": ["..."],
      "patternEvidenceRefs": ["..."],
      "unknowns": ["..."],
      "productSignificance": "..."
    }
  ]
}
```

`patternEvidenceRefs` remains optional according to the frozen source candidate.

Participant-visible bytes and prompt prose must not expose:

```text
caseId
sessionId
presentationId
original / reversed
presentationIndex
sourceIndex
sourceHypothesisId
sourceHypothesisSha256
historicalSelectedHypothesisId
historical Solution / Reviewer / Decision / Execution
previous semantic replay winner
human audit result
```

The Participant may know only that `baselineCandidateRef` is the deterministic fallback to be replaced only by clear semantic superiority.

---

## 6. Trusted Mapping

Each job has a participant-invisible mapping:

```text
ae-conservative-selection-mapping-v1
```

Each entry records:

```text
candidateRef
presentationIndex
sourceIndex
sourceHypothesisId
sourceHypothesisSha256
isBaseline
```

The mapping binds:

```text
caseId
presentationId
presentationSha256
blindInputSha256
baselineSourceHypothesisSha256
```

Fail closed unless all conditions hold:

```text
exactly one isBaseline = true
baselineCandidateRef maps to sourceIndex = 0
every visible candidateRef maps one-to-one to one source candidate
all declared hashes and identities match
```

---

## 7. Decision Semantics

The Participant does not rank the set globally. It evaluates a conservative override boundary in two layers.

### Layer A — Investigation Eligibility

Eligibility uses only:

```text
Evidence Readiness
Problem Specificity
```

A candidate is eligible when current evidence forms a real, non-speculative problem, the scope is concentrated enough for one bounded investigation job, and one bounded investigation could materially reduce uncertainty or produce a useful Human handoff.

High product significance, broader scope, longer time horizon, dramatic framing, or easier implementation cannot compensate for poor eligibility.

### Layer B — Clear Superiority

Only eligible challengers can override.

Override requires all of:

1. one challenger has a concrete superiority over the baseline for the current investigation slot;
2. the superiority comes from material Product Materiality and/or Investigation Leverage, not merely broader scope;
3. the superiority is large enough to justify giving up an eligible baseline investigation;
4. the challenger remains bounded;
5. exactly one challenger satisfies the boundary.

No numeric score or hidden ranking contract is introduced.

---

## 8. Terminal Decisions

Only three decisions are valid.

### `KEEP_BASELINE`

Use when the baseline is eligible and no exactly-one challenger has clear superiority.

Near-tie while baseline is eligible must resolve to `KEEP_BASELINE`, not abstention.

### `OVERRIDE`

Use only when exactly one eligible challenger has clear superiority over the baseline.

The rationale must explain the superiority and why it is not merely a broad-materiality shortcut.

### `NO_CLEAR_PREFERENCE`

Use only when the baseline is not eligible and there is no exactly-one clear superior challenger, including the case where multiple challengers exceed the baseline but cannot be reliably distinguished.

It must not be used to avoid the conservative fallback when the baseline is eligible.

---

## 9. Response Contract

Schema:

```text
ae-conservative-selection-response-v1
```

Shape:

```json
{
  "schemaVersion": "ae-conservative-selection-response-v1",
  "decision": "KEEP_BASELINE",
  "selectedCandidateRef": "candidate-B",
  "rationale": {
    "baselineEligibility": "ELIGIBLE",
    "challengerEligibility": "NOT_APPLICABLE",
    "decisiveComparison": "...",
    "boundednessReason": "...",
    "overallReason": "..."
  }
}
```

Allowed decision values:

```text
KEEP_BASELINE
OVERRIDE
NO_CLEAR_PREFERENCE
```

Constraints:

```text
KEEP_BASELINE → selectedCandidateRef == baselineCandidateRef
OVERRIDE → selectedCandidateRef != baselineCandidateRef and resolves to one candidate
NO_CLEAR_PREFERENCE → selectedCandidateRef == null
```

No extra fields. Do not output numeric score, ranking, confidence, second choice, implementation ease, expected Reviewer acceptance, or execution eligibility.

---

## 10. Invocation Freeze and Retry

Before the first Participant call, create-only freeze all 24 jobs including:

```text
job identity
case / presentation / sample ordinal
invocation ordinal
model
system prompt hash
input hash
mapping hash
response schema version
acceptance criteria version
```

Invocation order must be deterministic and interleaved; it must not be changed based on intermediate outcomes.

Each invocation is isolated: independent request/conversation, no previous result, no cross-job memory.

Retry only a clear technical failure, at most once, with byte-identical prompt/input and the same model/job identity.

Do not retry a valid but undesirable decision or participant contract failure.

---

## 11. Preflight

Before any Participant call, verify:

1. frozen corpus and source artifact hashes;
2. original/reversed presentations match frozen source;
3. candidate semantic fields are unchanged;
4. participant-visible input contains no forbidden identity metadata;
5. baseline mapping is exactly one-to-one with source index 0;
6. mapping is complete and collision-free;
7. all input/mapping/presentation hashes bind correctly.

Any mismatch fails closed before invocation.

---

## 12. Artifacts

Experiment root:

```text
artifacts/ae-conservative-selection-override-replay-v1-20260914/
```

Before invocation:

```text
experiment.json
system-prompt.txt
jobs/<job-id>/job.json
jobs/<job-id>/input.json
jobs/<job-id>/mapping.json
```

After invocation, each job stores raw provider/participant response and either `result.json` or `failure.json`.

Experiment completion stores:

```text
execution.json
diagnostic-summary.json
```

Human override audit artifacts remain separate and must not be fed back into the same Participant jobs.

---

## 13. Diagnostic Pre-Registration

### `000005` — Protection

Historical replay produced five valid repeatability decisions all selecting the broader H4 candidate. This is the protection case against stable broad-materiality regression.

Gate:

```text
at least 5 / 6 valid decisions = KEEP_BASELINE
```

H4 must not remain a stable override. Failing this gate fails the diagnostic experiment even if aggregate permutation stability is high.

### `000006` — Near Tie

Historical repeatability mainly oscillated between H2 and H5 under both presentations.

No source hypothesis is predeclared as the gold answer. Acceptable behavior is a stable conservative outcome or a stable, auditable override. Continued sample-level oscillation among challengers without unique superiority fails.

### `000007` — Presentation Sensitivity

Historical original presentation strongly converged on H3 while reversed samples split across different challengers.

At least 5 of 6 valid decisions must share one source-level decision semantics:

```text
KEEP_BASELINE
or
NO_CLEAR_PREFERENCE
or
OVERRIDE to the same source hypothesis
```

### `000002` — Mixed Instability

Historical outcomes varied among H3/H4/H6. The new experiment may keep, abstain under the defined boundary, or stably override, but the resulting pattern must be interpretable and presentation-resistant.

---

## 14. Pairwise Permutation Gate

For each `(caseId, sampleOrdinal)`, compare original vs reversed. There are 12 planned pairs.

Agreement means:

```text
KEEP + KEEP
NO_CLEAR_PREFERENCE + NO_CLEAR_PREFERENCE
OVERRIDE + OVERRIDE to same sourceHypothesisSha256
```

Everything else disagrees.

Required gate:

```text
at least 10 of 12 planned pairs agree
```

Only pairs with two valid Participant decisions can contribute agreement. Missing pairs are handled by the technical sufficiency rule, not silently counted as agree/disagree.

---

## 15. Human Override Audit

Every `OVERRIDE` must receive blind Human audit comparing only baseline semantic content and challenger semantic content.

The Human must not see presentation order, source index, historical selection, sample ordinal, previous model outputs, or downstream historical outcome.

Audit questions:

```text
Is baseline investigation-eligible?
Is challenger investigation-eligible?
Is challenger materially superior for this slot?
Is superiority investigation leverage rather than only broader materiality?
Is challenger still bounded?
Does current evidence justify giving up baseline?
```

Verdict:

```text
SUPPORTED_OVERRIDE
UNSUPPORTED_OVERRIDE
INCONCLUSIVE
```

A stable unsupported override is failure, not success.

---

## 16. Technical Sufficiency

The experiment is `INCONCLUSIVE_TECHNICAL` if any condition holds:

```text
any case/presentation has fewer than 2 valid decisions
or
fewer than 10 valid original/reversed pairs remain
or
000005 has fewer than 5 valid decisions
```

Contract failures are recorded without retry. Technical failures may receive the single byte-identical retry defined above.

These thresholds determine whether the pre-registered gates are evaluable; missing data is not converted into a semantic failure.

---

## 17. Terminal Verdicts

Only three terminal verdicts are allowed.

### `CONSERVATIVE_OVERRIDE_SUPPORTED_ON_DIAGNOSTIC_CORPUS`

Requires:

- `000005` protection PASS;
- permutation gate PASS;
- technical sufficiency PASS;
- no systematic unsupported override;
- near-tie cases no longer primarily behave as arbitrary challenger switching.

This authorizes only a full 8-case frozen confirmatory replay.

### `CONSERVATIVE_OVERRIDE_NOT_SUPPORTED`

Use when any material semantic gate fails, including stable broad override, persistent presentation instability, random precision in near-ties, stable unsupported override, or degeneration into indiscriminate KEEP that misses clearly superior challengers.

Do not keep tuning the same prompt and rerun the same 24 jobs after this verdict. Return to Selection abstraction/responsibility design.

### `INCONCLUSIVE_TECHNICAL`

Use only when technical/contract failures make the pre-registered gates unevaluable.

---

## 18. Confirmatory Gate

Only after diagnostic support may the project design and execute a full 8-case frozen confirmatory replay.

That stage must separately pre-register its matrix and acceptance criteria, keep production Selection unchanged, and avoid hard-coding source IDs learned from the four diagnostic cases.

Only after confirmatory evidence may production Selection semantics be discussed.

---

## 19. Implementation Boundary and Tests

Implementation should reuse experiment-only Selection replay infrastructure where possible, especially frozen source validation, candidateRef mapping, hash binding, create-only artifacts, and isolated invocation patterns.

It must not require a production feature flag or production Selection modification.

Minimum test coverage:

- input/response contract validation;
- baselineCandidateRef exactly-once validation;
- original/reversed semantic parity;
- identity-blindness fail-closed checks;
- baseline source-index-0 mapping under both presentations;
- input/mapping/source hash mismatch failures;
- KEEP/OVERRIDE/NO_CLEAR source projection;
- pairwise permutation aggregation;
- protection and technical-sufficiency gates;
- terminal-verdict precedence;
- proof that ordinary AE sessions and production Selection are untouched.

---

## 20. Completion Evidence

The execution report must include at least:

```text
repository branch / HEAD
git status
frozen corpus hash
experiment manifest hash
system prompt hash
planned / valid / contract-failure / technical-failure counts
per-case source-level outcome table
12-pair permutation table
000005 protection result
all OVERRIDE Human audit verdicts
terminal verdict
ordinarySessionsExecuted flag
productionSelectionModified flag
```

Any retry must report its technical reason and byte-identical input verification.

---

## 21. Forbidden Scope Expansion

Do not modify or introduce:

```text
production selectFirstHypothesis
production Selection Participant
Hypothesis generation/schema
PD-111 / PD-117
Problem Package
Solution / Reviewer
gameplay
new ordinary AE run
downstream counterfactual execution
numeric ranking/scoring/confidence thresholds
best-of-N/voting/judge model
model comparison/temperature tuning
```

If the experiment cannot run without modifying production AE, stop and treat that as a design-boundary violation.

---

## 22. Approval Boundary

Until Human review accepts this written spec:

```text
no implementation plan
no experiment code
no 24-job execution
no Participant invocation
no production modification
```

After written-spec approval, the next step is `writing-plans` to produce the implementation plan and Codex-executable experiment task.
