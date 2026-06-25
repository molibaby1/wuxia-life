# P45 Replay Persona Matrix

Generated: 2026-06-25

## Scope

This matrix fixes the bounded replay set for P45 phase 1.

It exists to answer one question:

- under fixed persona + seed replay, do different long-term shaping pushes produce different life directions?

This matrix is intentionally small.

It is not trying to cover every route, every edge case, or every content family in one pass.

## Replay Window

- Age window: `0-40`
- Required checkpoints: `10 / 20 / 30 / 40`
- Replay mode: deterministic local replay with fixed persona + seed
- Output target: terminal-readable summary plus `docs/test-reports/` artifacts

## Matrix

| Persona direction | Persona id | Seed | Expected shaping push | Early-life evidence focus | Target question |
| --- | --- | --- | --- | --- | --- |
| Martial / training-leaning | `p8-martial-lin` | `801` | Repeated training preference should accumulate into training-led shaping and martial route identity | training action frequency, `trainingHabit`, martial route or sect signals | Does training-first play become a martial life rather than generic growth? |
| Scholarly / study-leaning | `p8-scholar-su` | `802` | Repeated study preference should accumulate into study-led shaping and scholarly identity | study action frequency, `studyHabit`, scholar-path signals | Does study-first play become a scholar/healer/knowledge-led life rather than a stat variant of martial? |
| Business / livelihood-leaning | `p8-wealth-shen` | `804` | Repeated business preference should accumulate into livelihood shaping and merchant/wealth consequence patterns | business action frequency, `businessHabit`, wealth or merchant-network signals | Does livelihood shaping materially redirect growth and midlife obligations? |
| Mixed / balanced tendency | `p8-balanced-wei` | `808` | Mixed preference should avoid immediate single-axis collapse and show a blended but still readable trajectory | mixed action spread, top-2 shaping axes, non-extreme identity pattern | Does balanced play remain distinct from the specialized personas instead of collapsing into one of them? |

## Persona Selection Notes

These four personas are the minimum bounded set for the first P45 loop because they map directly to the PRD acceptance bar:

- martial
- scholarly
- business
- mixed

This first pass deliberately excludes `social`, `deviant`, and `explorer` personas from the core matrix.

Reason:

- those directions are still useful later
- but adding them now would expand story P45-003 from a bounded replay harness into a broader matrix program
- P45 phase 1 first needs a repeatable core answer across the four baseline shaping directions

## Expected Reading Contract Per Persona

Each replay sample must be readable through the same compact lens.

### 1. Early shaping push

Look for:

- active-action preference distribution
- early habit-axis accumulation
- first route or identity signal

### 2. Checkpoint trajectory

At each checkpoint `10 / 20 / 30 / 40`, record at minimum:

- dominant habit or semi-personality axes
- route or identity signal
- notable consequence, callback, or obligation signal

### 3. Final differentiation entry points

At final snapshot, record at minimum:

- dominant shaping lines from life memory
- route-status summary
- any readable midlife or later-life consequence hook

## Intended Comparison Axes

The first P45 replay loop compares the matrix on these dimensions only:

- growth emphasis
- dominant shaping axis
- route or identity drift
- midlife consequence pattern
- life-memory or recap differentiation entry point

If samples look weak, do not expand the matrix first.

Classify the weakness before increasing coverage.

## Re-run Contract

This matrix should remain small enough for frequent regression use.

For P45 phase 1, changes to the matrix should be rare.

If future work needs broader coverage, it should add a second-layer matrix instead of replacing this baseline set.
