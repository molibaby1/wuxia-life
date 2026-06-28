# Simulation-Driven Optimization Workflow

## 1. Purpose

This document defines the default workflow for gameplay-experience optimization in `wuxia-life`.

It exists to prevent three common failures:

1. treating every experience problem as a broad architecture task
2. tuning many unrelated surfaces at once without attribution
3. moving into `world profile` or `runtime` before evidence shows `tuning_config` is insufficient

The default rule is:

- **First classify with simulation**
- **Then optimize in the narrowest layer that can plausibly solve the problem**
- **Then verify with before/after evidence and guardrails**

This workflow is the default path for future experience-optimization sessions unless a newer approved PRD explicitly overrides it.

## 2. Layer Order

All experience issues must be handled in this order:

1. **`tuning_config`**
2. **`world profile` / content structure**
3. **shared `runtime`**

Do not skip upward by default.

### 2.1 `tuning_config`

Use this layer first for problems such as:

- event frequency too high or too low
- same-class repetition
- pacing too flat or too crowded
- one route or family of content mechanically over-occupying timelines
- payoff spacing or density needing bounded adjustment

Typical surfaces:

- `weight`
- `cooldown`
- trigger probability
- repetition pressure configs
- one bounded pacing knob

### 2.2 `world profile` / content structure

Escalate here only when the problem is not mainly about frequency or spacing, but about missing or weak theme-owned meaning.

Typical signals:

- wuxia flavor is under-expressed even when pacing is acceptable
- different worldviews cannot be swapped cleanly because meaning is scattered
- route identity, summary signals, action families, or theme-owned content need structural ownership
- tuning can reduce pressure, but cannot create the missing kind of experience

Typical work:

- profile-owned schema
- profile-owned content pools
- route and identity expression inside theme-owned config
- content diversification that belongs to the worldview rather than generic balance knobs

### 2.3 shared `runtime`

Escalate here only when the existing config and profile layers cannot express the needed behavior.

Typical signals:

- the desired behavior has no existing config representation
- every attempted fix is blocked by execution-model limitations
- the issue is caused by scheduler, evaluator, or engine semantics rather than authored content/config

Runtime is the last resort, not the default optimization lane.

## 3. One-Issue-One-Slice Rule

Each optimization slice must be framed as a **problem slice**, not a broad feature wave.

A valid slice contains:

- one problem statement
- 2 to 3 target metrics
- explicit in-scope surfaces
- explicit out-of-scope surfaces
- one regression bundle
- one before/after report

Invalid slice shape:

- “improve the whole game feel”
- “optimize several systems together”
- “fix repetition, pacing, route identity, and content thinness in one pass”

## 4. Required Flow For Every Slice

### Step 1: Write the issue statement

Describe the player-facing problem in concrete terms.

Good examples:

- “adult family/love events mechanically crowd out the rest of adulthood”
- “some lives spend too long in low-impact spans”
- “early setback visibility remains too high in ages 10–12”

Bad examples:

- “the game is not fun enough”
- “the experience needs more polish”

### Step 2: Turn the issue into measurable metrics

Every slice must define:

- command
- sample count
- seed range or deterministic fixture
- target metrics
- acceptance direction

Examples:

- `runsWithFamilyAdjacentSameClass / sampleCount`
- `maxLowImpactSpanYears`
- `runsWithSetback10to12 / sampleCount`

If the issue cannot be measured at all, do not jump directly to implementation. First create the audit or report that makes it measurable.

### Step 3: Classify the issue

Before changing code, state the current classification:

- `tuning_config`
- `world profile`
- `runtime`

This classification must include a short rationale.

Examples:

- “This is `tuning_config` because the problem is repeated same-class occupation and can plausibly be affected by weights, cooldowns, and repetition pressure.”
- “This is `world profile` because the missing behavior is theme-owned identity expression, not generic pacing.”
- “This is `runtime` because no current config path can express the required scheduling rule.”

### Step 4: Freeze the allowed surfaces

Every slice must declare allowed and forbidden surfaces.

Example:

- allowed: `family-life.json`, `love.json`, `P20_REPETITION_DEFAULT`, exactly one pacing knob
- forbidden: `routeDefinitions`, `echoHooks`, `src/core/**`, new world profile semantics

This prevents sessions from silently drifting into a bigger redesign.

### Step 5: Capture baseline before tuning

Before any optimization change, save baseline evidence under `docs/test-reports/` or `docs/designs/`.

Minimum baseline contents:

- command used
- RNG method
- sample size
- metric values
- key hotspot notes

No slice is complete if the “before” only exists in memory or chat.

### Step 6: Do bounded optimization

During implementation:

- touch only the approved layer
- prefer 1 to 2 primary levers
- keep attribution clean
- avoid broad “just in case” changes

If one pacing knob was the agreed boundary, do not expand to multiple pacing surfaces inside the same slice.

### Step 7: Re-run guardrails

Every slice must rerun the relevant quality floor after changes.

Common bundle:

- `npm run typecheck`
- target metric audit command
- `npm run gate:playability`
- `npm run gate:p20`
- any slice-specific regression command

Green guardrails do **not** automatically mean the experience problem is solved. They only mean the slice did not obviously break the floor.

### Step 8: Produce before/after evidence

The closing report must explicitly mark each target metric as:

- **Improved**
- **Regressed**
- **Inconclusive**

It must also state:

- whether the issue should remain in `tuning_config`
- whether it should escalate to `world profile`
- whether it truly requires `runtime`

Do not hide an inconclusive result inside optimistic prose.

## 5. Escalation Rules

Move from `tuning_config` to `world profile` only when at least one of the following is true:

- the same issue has had one or more bounded tuning passes and core metrics remain materially unchanged
- tuning one metric keeps harming another core metric
- the problem is clearly about missing theme-owned expression rather than pressure/spacing
- further tuning would over-suppress valid content instead of solving the root cause

Move from `world profile` to `runtime` only when:

- the intended behavior has no credible profile/config representation
- the blocker is execution semantics, not content ownership

## 6. What Counts As A Successful Slice

A slice is successful only if all of the following are true:

1. target metrics moved in the required direction, or the report explicitly proves why the slice is inconclusive
2. the agreed guardrails stayed green
3. the change stayed inside the declared layer boundary
4. the closing report tells the next session whether to continue tuning or escalate

“Tests passed” alone is not enough.

## 7. Output Contract For Future Sessions

Any session working on experience optimization should produce these artifacts when relevant:

- PRD or scoped slice doc in `docs/PRD/`
- target/non-goal doc in `docs/designs/` or `docs/`
- baseline audit in `docs/test-reports/`
- regression report in `docs/test-reports/`
- before/after evidence report in `docs/test-reports/`

Each session should answer these five questions explicitly:

1. What exact player-facing issue is being worked on?
2. How is that issue measured?
3. Which layer is allowed for this slice?
4. What commands prove the result?
5. If the slice is not enough, what is the next escalation layer?

## 8. Session Handoff Rules

When starting a new session for experience optimization, the session prompt should instruct the assignee to read:

1. the active PRD or slice doc
2. this workflow document
3. the latest baseline or before/after report for the issue
4. the latest regression report for the same slice

The prompt should also say:

- do not broaden scope
- do not jump to `world profile` or `runtime` without evidence
- if verification is requested, rerun the exact failing checks rather than starting a fresh broad review

## 9. Current Project Interpretation

Based on the approved direction so far:

- repetition pressure
- event density
- low-impact span reduction
- bounded payoff spacing

should default to **`tuning_config` first**.

The following belong to later escalation lanes when evidence justifies them:

- making world profile the true authoritative theme root
- moving scattered wuxia semantics into profile-owned structures
- introducing new runtime semantics that existing config/profile cannot express

This means future sessions should not treat every remaining experience problem as proof that the project must immediately expand `world profile` or `runtime`.

## 10. Practical Template

Use this short template at the top of a new optimization slice:

```md
## Issue
- Player-facing problem:

## Metrics
- Command:
- Sample count / seeds:
- M1:
- M2:
- M3:

## Classification
- Layer: tuning_config / world profile / runtime
- Why:

## Allowed Surfaces
- 

## Out Of Scope
- 

## Guardrails
- 

## Done When
- 
```

Generated to standardize cross-session execution for simulation-driven experience optimization.
