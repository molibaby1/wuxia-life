# P45 Trajectory Validation Contract

Generated: 2026-06-25

## Scope

This contract defines how P45 judges the existing long-term shaping mechanism.

This stage validates one narrow question only:

- Do long-term choices and sustained tendencies actually steer lives toward different growth directions over a whole-life replay?

This stage does **not** cover:

- minimal playable sample-line packaging
- runtime rewrites
- new player-facing visibility polish
- full content expansion
- treating gate PASS as sufficient proof by itself

## Validation Questions

P45 evidence must answer all of the following.

### Q1. Directional steering

Under fixed persona + seed replay, do different long-term preference pushes produce different dominant growth directions rather than only small stat noise?

Expected evidence:

- dominant shaping axes diverge by persona
- growth emphasis diverges by persona
- route or identity signals are not all collapsing to the same pattern

### Q2. Cumulative divergence over time

Do differences persist and accumulate across major age checkpoints instead of appearing only in one late summary line?

Expected evidence:

- age 10, 20, 30, 40 checkpoints can be compared
- divergence is visible before final recap only
- midlife state is not effectively identical across most personas

### Q3. Early-shaping to later-outcome traceability

Can later route, identity, obligation, or consequence signals be traced back to earlier shaping tendencies?

Expected evidence:

- early action preference or repeated tendency
- corresponding habit or semi-personality accumulation
- later callback, route, identity, consequence, or recap difference

### Q4. Weak-sample interpretation

If samples do not diverge clearly, can the result be interpreted as a mechanism weakness rather than dismissed as random variance?

Weak samples must first be classified into one of these buckets:

- content coverage thin
- trigger density too low
- shaping signal too weak
- callback too late or too weak
- route differentiation collapse

P45 does not jump from weak evidence straight to runtime rewrite proposals.

## Required Evidence Bundle

P45 cannot be called quantitatively validated without all items below.

1. A fixed replay persona + seed matrix with bounded coverage.
2. A deterministic replay harness that can rerun the same samples.
3. Compact trajectory output readable in terminal and saved under `docs/test-reports/`.
4. Checkpoint-level evidence for at least:
   - major age nodes
   - dominant shaping axes
   - route or identity signals
   - midlife consequence deltas
   - life-memory or summary differentiation entry points
5. At least one explicit comparison showing where trajectories diverge or collapse.

The following do **not** satisfy the evidence bar on their own:

- `gate:*` PASS
- a single event slice proving a condition is triggerable
- one persona having strong feedback while others remain collapsed
- final summary prose that sounds different without checkpoint evidence

## Success Bar

### Pass

Mark this stage `pass` only if all conditions below hold.

- Most replay personas in the bounded matrix form a readable dominant shaping direction by age 20.
- Differences remain visible across age 20 to age 40 rather than converging back into one generic life path.
- At least three persona directions show materially different growth emphasis, route or identity signals, or midlife consequence patterns.
- Final life-memory or recap output preserves those differences instead of flattening them into one shared identity pattern.
- Any weak samples are limited and classifiable without blocking the main conclusion.

### Warning

Mark this stage `warning` when the mechanism is present but quantitatively weak.

Typical warning patterns:

- divergence exists, but only in one layer such as stats or recap text
- divergence appears too late to support whole-life steering claims
- one or more target personas collapse into similar route or identity outcomes
- callbacks exist but are too sparse or too opaque to support a causal reading
- final recap differs more than the lived trajectory itself

`warning` means the mechanism is runtime-complete but not yet strongly validated as a life-direction steering system.

### Fail

Mark this stage `fail` when the replay evidence cannot support the steering claim.

Typical fail patterns:

- most personas remain trajectory-similar through age 30 to 40
- replayed differences are dominated by seed noise instead of persona push
- route or identity outputs collapse broadly across the matrix
- later outcomes cannot be meaningfully traced back to earlier shaping
- evidence is non-repeatable or depends on manual UI play

## Interpretation Rules

Use these rules when reading results.

1. Structural correctness is not enough.
   Existing gates and regression tests can prove the mechanism exists, but they do not alone prove that whole-life direction materially diverges.

2. A final summary line is supporting evidence, not primary proof.
   Primary proof comes from checkpoint-level trajectory differences.

3. A single strong persona does not validate the mechanism globally.
   The bounded matrix must show repeatable differentiation across multiple shaping directions.

4. A weak sample is still useful evidence.
   It should be routed into a weakness bucket instead of being hand-waved away or immediately used to justify runtime redesign.

## Story Boundaries For P45-001

This story only defines the contract.

It does not:

- change gameplay behavior
- add or modify replay execution code
- change persona definitions
- produce the actual trajectory report

Those belong to later P45 stories in sequence.
