# PRD: Global Money Retirement — E4 to Phase F

> Status: HUMAN APPROVED FOR RALPH EXECUTION
> Scope: Phase E4 Compatibility Dependency Closure + Phase F Physical Legacy Economic Field Removal
> Product truth: this Markdown is authoritative over the paired `global-money-retirement-e4-phase-f.prd.json`
> Execution boundary: complete Global Money Retirement / Wealth Consolidation physical closure; do **not** redesign Wealth Capacity, Assets, ordinary cashflow, or unrelated legacy content

## 0. Executive Summary

Wuxia-Life has completed E2–E3 product acceptance through PD-096.

Accepted repository/product boundary before this PRD:

- Formal EventLoader money writes: `0`.
- Formal EventLoader money conditions: `0`.
- Difficulty Setback money mutations: `0`.
- Normal gameplay money producers/consumers: `0`.
- Live player-facing money presentation: `0`.
- Current formal money authoring/runtime ownership: `0`.
- Wuxia World Profile does not expose `money` as a stat/resource authority.
- `wealthCapacity` is the sole formal strategic economic capacity.
- Compatibility fields still physically exist: `PlayerState.money`, optional numeric `PlayerState.wealth`, new-game `money: 100`, Snapshot `3.15.0` money/wealth fields, and compatibility copy/validation paths.
- Anti-reintroduction guards and excluded/history references intentionally still contain the words `money` / `wealth`.

This PRD closes the remaining implementation debt in two phases:

1. **E4 — Compatibility Dependency Closure:** remove current compiled analysis, simulation, generic numeric access, and numeric-wealth capabilities that would otherwise keep the legacy balance fields structurally necessary.
2. **Phase F — Physical Removal:** atomically remove `money` and optional numeric `wealth` from the canonical player/snapshot shape, remove the new-game seed/copy paths, bump the strict Snapshot schema exactly once from `3.15.0` to `3.16.0`, reject old/extra fields with no migration, and close repository authority.

Final canonical economic player state after this PRD:

```text
wealthCapacity: WealthCapacity
```

There is no `money` balance and no numeric `wealth` balance/score in `PlayerState` or Snapshot.

This PRD does **not** remove the word “wealth” when it means a route preference, narrative theme, historical identifier, or non-numeric content tag. It removes only the retired numeric economic state/capability.

---

## 1. Product Alignment and Authority

### 1.1 Authority to read before implementation

Use the current repository authority in this order:

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/product/player-model.md`
4. `docs/product/wealth-economy-product-contract-design.md` — Part A product semantics are authoritative; Part B is explicitly a dated implementation inventory and must not override newer PDs/current source
5. `docs/governance/product-decisions.md`, especially PD-092 through PD-096
6. `docs/contracts/game-state-snapshot-contract.md`
7. `docs/contracts/save-schema-versioning-policy.md`
8. Current implementation and focused tests

Do not infer product direction from historical PRDs or unloaded legacy files.

### 1.2 Frozen product decisions

The following are not open for redesign in this PRD:

- `wealthCapacity` is the only formal strategic economic capacity.
- Five Capacity tiers remain unchanged.
- No hidden numeric Wealth score, Wealth XP, wallet alias, or ordinary daily cashflow simulation.
- Wealth Requirements remain non-consuming by default.
- Wealth transitions remain event-driven and strategic.
- Wealth Capacity is **not** a universal route/destiny key.
- Do not convert generic legacy `money` / numeric `wealth` thresholds into Wealth Capacity merely to preserve old thresholds.
- Do not introduce `wealth_capacity_lower_to` or ordinary loss-driven Capacity downgrades.
- `merchant_shop` remains the only formal Asset; no Asset expansion in this PRD.
- Runtime save policy performs no migration. Old snapshots are rejected; external tooling must recreate a current snapshot if needed.

### 1.3 Why optional numeric `wealth` is included

The accepted final player-model direction is not merely “remove money.” The final canonical economic state is:

```text
wealthCapacity only
```

Current source still contains optional numeric `wealth?: number` in runtime/snapshot types and exact numeric wealth authoring/condition capabilities. Leaving it behind would preserve a second numeric economic source and violate the same consolidation goal.

Therefore Phase F removes both:

```text
PlayerState.money
PlayerState.wealth?   # numeric legacy field only
```

This does **not** retire unrelated meanings such as:

```text
choiceTendency: 'wealth'
routePreference: 'wealth'
p8-wealth-shen
pathAffinity.wealth
narrative text about wealth/财富
```

unless a Story explicitly proves that a specific occurrence is a numeric player-state capability.

---

## 2. Ralph Execution Preconditions

This document and the paired JSON are **planning artifacts only until Human execution approval**.

Do not start `/ralph-run` solely because these files exist.

After Human approval, run the dual-document workflow:

```text
/ralph-run --prd docs/PRD/global-money-retirement-e4-phase-f.prd.json --prd-md docs/PRD/global-money-retirement-e4-phase-f.md
```

### 2.1 Branch-only is the default; worktree is optional

A worktree is **not required** for this PRD.

Preferred execution shape:

```text
accepted clean E2–E3 tip
→ ordinary branch ralph/global-money-retirement-e4-phase-f
→ one Story / one commit
→ post-run discovery
→ Human final review
```

Before US-001:

- start from the clean Human-accepted E2–E3 product tip containing PD-096;
- the latest reported accepted tip is `8d414be`, but repository Git is the authority at execution time;
- if the actual starting tip does not contain the accepted E2–E3 state, STOP;
- working tree must be clean except for this paired PRD if the PRD is intentionally added as the first documentation commit;
- unrelated evolution/P25/other dirty work must not be present;
- create/switch to `ralph/global-money-retirement-e4-phase-f` using the repository commit helper or an already-approved equivalent;
- do not create a worktree unless the Human explicitly needs parallel filesystem work.

### 2.2 Commit protocol

The current repository contains `scripts/agent-git-commit.sh`; use the installed Ralph commit protocol.

- one Story per commit;
- prefer explicit-path commit ownership;
- do not silently fall back to parallel/naked git commands if the helper fails;
- if the helper is missing or incompatible at execution time, STOP before implementation and report infrastructure drift.

### 2.3 Do not use the stale single-document runner

`scripts/ralph-cursor-agent.sh` does not make the paired Markdown product truth explicit to every iteration.

For this PRD use `/ralph-run` with both `--prd` and `--prd-md` paths.

### 2.4 One Story per iteration

Each Story below is a single Ralph unit. Do not opportunistically implement later Story scope.

---

## 3. Global Invariants

These remain true throughout E4 and after Phase F unless a Story explicitly changes the compatibility/schema field itself:

1. Formal EventLoader money writes remain `0`.
2. Formal EventLoader money conditions remain `0`.
3. Formal loaded catalog numeric-`wealth` writes/conditions must become and remain `0`.
4. Difficulty Setback money mutation remains `0`.
5. Normal gameplay does not produce/consume exact money or numeric wealth.
6. Live player-facing wallet/numeric-wealth presentation remains `0`.
7. `wealthCapacity` enum/ordering/labels/requirements/transitions remain unchanged.
8. No Wealth Capacity downgrade primitive is added.
9. No hidden numeric economic replacement is added.
10. No generic `resources` destiny threshold may be replaced by Wealth Capacity merely to preserve a legacy gate.
11. `merchant_shop` Asset semantics remain unchanged.
12. Formal EventLoader scope is `events.json` / `EventLoader` authority; stale manifest counts do not become authority.
13. Unloaded legacy wallet files are not bulk-rewritten in this PRD.
14. Anti-reintroduction guards may continue to contain literal `money` / numeric `wealth` strings.
15. Narrative/theme identifiers containing `wealth` are not numeric state by name alone.
16. Snapshot version changes **once only**, in US-008: `3.15.0 → 3.16.0`.
17. No runtime migration, fallback, default injection, aliasing, or silent cleanup is introduced for old snapshots.

---

# Phase E4 — Compatibility Dependency Closure

## 4. E4 Outcome

E4 does **not** physically remove the compatibility fields yet.

At E4 closure the only current compiled ownership of exact `money` / numeric `wealth` must be the narrow core compatibility boundary needed for the final atomic schema change:

```text
PlayerState compatibility fields
GameEngine initialization/copy compatibility
SnapshotPlayerState compatibility fields
canonical snapshot/runtime key validation
canonical snapshot fixture(s)
```

Everything else in current compiled analysis/runtime/tooling must no longer require those balances.

Excluded legacy files, historical tests/evidence, narrative route labels, and anti-reintroduction guards may remain where explicitly classified.

---

## 5. US-001 — Retire numeric wealth alias from current runtime/authoring

**User story:** As the product owner, I want optional numeric `wealth` to stop being a current runtime/authoring capability so that `wealthCapacity` remains the sole formal economic authority before physical field removal.

### Repository facts at planning time

Current source still includes numeric-wealth affordances such as:

- `PlayerStats.wealth?`;
- `StatModifyHandler.MODIFIABLE_PLAYER_STATS` containing `wealth`;
- `ConditionEvaluator.DIRECT_PLAYER_PROPERTIES` containing `wealth`;
- `ChoiceRequirementExplanation` mapping exact numeric `wealth` to “财富”;
- Snapshot / `PlayerState.wealth?` compatibility fields;
- unloaded legacy files with exact `wealth` conditions/writes.

### Requirements

- Remove numeric `wealth` from current `PlayerStats` authoring/challenge stat shape when it represents exact player economic balance.
- Remove `wealth` from current EventExecutor stat-modify capability.
- Exact numeric `wealth` expression access must fail closed in the current ConditionEvaluator, parallel to retired `money`.
- `ChoiceRequirementExplanation` must not present an exact numeric `wealth` threshold as a current requirement; it must be unsupported/fail-closed.
- Extend the formal EventLoader anti-reintroduction guard to reject:
  - `stat_modify` targeting exact numeric `wealth`;
  - exact `wealth` / `player.wealth` expression conditions;
  - without matching `wealthCapacity`.
- Confirm the 412-event formal loaded catalog has zero numeric-wealth writes/conditions.
- Do **not** remove `PlayerState.wealth?` or Snapshot `wealth?` yet; those are Phase F compatibility fields.
- Do **not** rename route preferences, persona IDs, pathAffinity keys, narrative tags, or ordinary prose containing `wealth`.
- Do **not** alias exact numeric wealth to `wealthCapacity`.

### Acceptance

- EventExecutor cannot mutate numeric `wealth`.
- ConditionEvaluator cannot read exact numeric `wealth` expressions.
- Requirement explanation does not expose exact numeric `wealth` as “财富” stat gating.
- Formal EventLoader rejects numeric-wealth write/condition re-import while accepting Wealth Capacity conditions/effects.
- Formal loaded catalog numeric-wealth writes = `0`; conditions = `0`.
- `PlayerState.wealth?` and Snapshot `wealth?` still physically exist after this Story.
- Existing E2/E3 money guards remain green.
- Focused numeric-wealth retirement tests pass.
- Typecheck passes.
- Tests pass.

---

## 6. US-002 — Retire composite-destiny `resources → money` semantics

**User story:** As the product owner, I want generic composite-destiny `resources` thresholds to stop reading exact wallet balance so that final field removal does not turn Wealth Capacity into a universal route key or preserve a hidden numeric economy.

### Repository facts at planning time

Current P16/P25 profile tooling still contains a separate analytical path:

```text
DestinyDimension 'resources'
→ readDimensionValueForDestiny(..., 'resources')
→ player.money
```

Representative current outcomes include `resources` thresholds in:

- `sect_leader_statesman`;
- `medical_sage_healer`;
- `founding_patriarch`;
- `merchant_magnate`;
- `merchant_martial_patron`.

This path is not normal gameplay authority, but it is current compiled profile/simulation code and conflicts with physical removal.

### Requirements

- Remove `resources` from **Composite Destiny `DestinyDimension`** only where it means the retired exact balance dimension.
- Remove the `resources → player.money` branch from `readDimensionValueForDestiny`.
- Remove exact numeric `resources` requirements from current Wuxia composite/pinnacle/mixed destiny definitions.
- Do not replace them with `wealthCapacity`, numeric `wealth`, a synthetic score, or another arbitrary stat.
- Preserve all remaining martial/reputation/social/key-choice/luck requirements.
- Update `crossTrackGroups.requirementIndices` after requirement deletion so they point to the intended surviving requirements.
- If a cross-track group exists only to represent the removed balance requirement, remove that group rather than inventing a substitute track.
- Do not globally remove unrelated meanings of the word `resources`, such as origin material exposure tags, maintenance dimensions, or narrative opportunity tags, unless they directly resolve to exact legacy balance.

### Acceptance

- No current Composite Destiny requirement uses `DestinyDimension = 'resources'` for an exact player balance.
- `readDimensionValueForDestiny` does not read `player.money` or numeric `player.wealth`.
- No Wealth Capacity replacement gate is introduced.
- Merchant and non-merchant outcome definitions retain their non-economic gates.
- Cross-track indices are valid after requirement removal.
- Focused P16/P25 composite destiny tests pass after expectation updates.
- Typecheck passes.
- Tests pass.

---

## 7. US-003 — Close generic numeric player-stat write/read escape paths

**User story:** As a maintainer, I want generic numeric player-stat utilities to accept only current canonical numeric stats so that removed economic fields cannot be recreated dynamically after Phase F.

### Problem

`readPlayerNumeric(player, key: string)` and `writePlayerNumeric(player, key: string, value)` currently accept arbitrary strings. Active-planning deltas also use broad string stat keys.

Even after physical type removal, an arbitrary `money` / `wealth` key could otherwise be dynamically written onto the runtime object if a future caller bypassed formal EventLoader guards.

### Requirements

- Establish one explicit current numeric-player-stat allowlist/type for generic read/write paths.
- Exclude exact `money`, numeric `wealth`, and categorical `wealthCapacity` from generic numeric mutation.
- Narrow `readPlayerNumeric` / `writePlayerNumeric` or add an equivalent validated boundary so arbitrary keys cannot silently create player properties.
- Active-planning reward/cost/delta application must reject or fail closed for unsupported stat keys rather than writing an arbitrary property.
- Current active-action/childhood-action catalogs must continue to work unchanged for valid stats.
- Condition/requirement parsing that receives strings must validate against its own current supported allowlist before numeric read.
- Do not build a new generic stat registry/framework beyond what is needed for this closure.

### Acceptance

- Passing `money` or exact numeric `wealth` through generic current numeric write paths cannot create/mutate those properties.
- Valid current active-action numeric stat deltas still apply exactly.
- No `wealthCapacity` numeric coercion is introduced.
- Focused active-planning/player-stat-access tests pass.
- Typecheck passes.
- Tests pass.

---

## 8. US-004 — Retire compatibility-only money/wealth observability and report surfaces

**User story:** As a maintainer, I want current diagnostics and audit/report models to stop transporting dead balance fields so that observability does not keep compatibility state alive.

### Planning-time targets

Inspect current source before editing. Known candidates include:

- `src/p45/wealthEarlyAudit.ts` money checkpoint/Markdown column;
- `src/headless/playability/experienceTraceTypes.ts` tracked `money` / numeric `wealth` keys;
- `src/p16/infantPassiveChainVerification.ts` money snapshot field;
- `src/types/simulationRecordTypes.ts` `statistics.moneyGrowth`;
- `src/headless/playability/adaptToGameProcessReport.ts` synthetic `moneyGrowth: 0`;
- `src/data/attributeMeanings.ts` dead/current metadata that still advertises `money` as an attribute;
- current experience/browser test tooling that parses “银两” as a visible field.

### Requirements

- Remove exact money/numeric-wealth fields from current observability/report outputs when they no longer carry accepted product semantics.
- Remove `moneyGrowth` from current simulation report types/adapters and focused consumers; do not replace with Wealth Capacity arithmetic.
- Remove money/numeric wealth from headless experience-trace numeric stat delta selection.
- Remove P45 wallet checkpoint/report columns; preserve habits, businessAcumen, route signals, and other audit dimensions.
- Remove infant/passive verification wallet stat snapshots if they are only legacy balance observations.
- Remove obsolete attribute metadata that still presents `money` as a current player attribute.
- Update focused tests/scripts that consume these report shapes.
- Preserve route/persona words containing `wealth` when they mean narrative route preference rather than numeric wealth.

### Acceptance

- Current headless trace/report/audit surfaces do not emit exact money or numeric wealth as player stats.
- Current simulation summary has no `moneyGrowth` field.
- P45 audit no longer displays or serializes wallet balance.
- Current browser/experience acceptance tooling does not expect a visible 银两 field.
- No replacement numeric economy is added.
- Focused report/headless/audit tests pass.
- Typecheck passes.
- Tests pass.

---

## 9. US-005 — Decouple P16–P23 compiled fixtures/slices from legacy balance fields

**User story:** As a maintainer, I want current compiled legacy validation slices outside P25 to stop constructing or mutating `PlayerState.money`/numeric `wealth` so that Phase F can remove the fields without preserving obsolete simulation semantics.

### Scope

Use current source reachability, not a fixed filename list. Known compiled areas with money fixture/state use include P16, P17, P18, P19, P20, and P23.

### Requirements

- Remove exact money/numeric-wealth fixture values, direct mutations, and result fields that no longer affect accepted outcomes.
- Preserve all non-economic scenario distinctions: martial power, reputation, connections, habits, flags, family/legacy signals, etc.
- Where an old test used money sentinel variation solely to prove invariance after prior retirement, replace that proof with a direct assertion on the actual surviving semantic input/output; do not keep a fake balance solely for the test.
- Do not replace removed fixture money with Wealth Capacity unless the current accepted product contract for that exact scenario already uses Wealth Capacity.
- Do not change normal gameplay scheduling/route semantics.

### Acceptance

- Current compiled P16–P23 source does not require `PlayerState.money` or numeric `PlayerState.wealth` for these legacy validation/report slices.
- Existing retirement conclusions remain true without sentinel balances.
- P16–P23 focused tests/gates used by the repository remain semantically equivalent on surviving dimensions.
- Typecheck passes.
- Tests pass.

---

## 10. US-006 — Retire P25 wallet bookkeeping from current simulations

**User story:** As a maintainer, I want current P25 simulation models to stop carrying synthetic wallet bookkeeping so that historical simulation scaffolding cannot force the canonical player model to retain a dead numeric economy.

### Scope

Known current P25 balance scaffolding includes representative path fixtures, simulation baselines, `createSimulationPlayerState`, short-chain snapshots, P34–P37 lifetime slices, mixed/ordinary/pinnacle baselines, consequence consistency, and content-pool fixtures.

### Requirements

- Remove `money` / numeric `wealth` from `Partial<PlayerState>` P25 fixtures and `createSimulationPlayerState` options/state construction.
- Remove local wallet accumulation/deduction bookkeeping from P34–P37 and related result/report fields where it no longer gates any accepted outcome after US-002.
- Remove `simulatedStatDelta.money` values that are synthetic P25 bookkeeping rather than live declared gameplay effects.
- Preserve study/training/business habits, martial/reputation/connections/businessAcumen, flags, bridge events, choice/luck gates, and terminal outcome checks.
- Do not reinterpret old wallet values as Wealth Capacity.
- Do not bulk-edit historical artifact JSON under `artifacts/` or unrelated old reports.

### Acceptance

- Current compiled `src/p25/**` no longer depends on exact `PlayerState.money` or numeric `PlayerState.wealth`.
- P25 simulations do not maintain a hidden local wallet solely to reproduce old thresholds.
- P25 outcome gates do not gain Wealth Capacity substitutes.
- Focused P25 simulation/consistency/parity tests pass after expectation updates.
- Typecheck passes.
- Tests pass.

---

## 11. US-007 — Establish E4 compatibility-only boundary guard and governance

**User story:** As the Human owner, I want a deterministic pre-removal guard proving that exact balance fields are now compatibility-only so that Phase F can perform one atomic physical/schema deletion.

### Requirements

Add/register a focused E4 regression, suggested name:

```text
tests/globalMoneyE4CompatibilityBoundary.test.ts
```

The test should be reachability-aware. It must **not** require repository-wide literal-string zero.

It must prove, at minimum:

- formal loaded money and numeric-wealth writes/conditions = `0`;
- current EventExecutor/ConditionEvaluator cannot author/read exact money or numeric wealth;
- generic numeric writer cannot dynamically create money/numeric wealth;
- Composite Destiny no longer resolves generic `resources` to legacy balances;
- current observability/report/P16–P25 compiled paths no longer structurally depend on exact balances;
- E2/E3 player-facing/runtime closure remains true;
- the only allowed current compiled compatibility ownership before Phase F is the explicit core set:
  - `PlayerState.money`;
  - `PlayerState.wealth?`;
  - `GameEngineIntegration` new-game money seed / compatibility copy and optional wealth copy;
  - `SnapshotPlayerState.money` / `wealth?`;
  - canonical player/snapshot validation key lists;
  - canonical snapshot fixture(s).

Allowed non-ownership references include:

- EventLoader/ConditionEvaluator/choice-explanation deny/fail-closed guards;
- D6 auto-choice ignore guards;
- route/persona/pathAffinity `wealth` identifiers;
- unloaded/excluded legacy content;
- tests/history explicitly used as negative evidence.

### Governance

Record a narrow next Product Decision (expected PD-097, but use the actual next free number) stating that E4 has reduced exact money/numeric wealth to compatibility-only core ownership and authorized the already-approved Phase F physical deletion in this PRD.

Do not claim physical removal yet.

### Acceptance

- E4 compatibility boundary test passes and is registered in the real test gate.
- Allowed compatibility ownership is explicit and narrow.
- No live analytical/runtime consumer remains outside the allowed set.
- Snapshot still exactly `3.15.0` after US-007.
- `PlayerState.money` / numeric `wealth?` still exist after US-007.
- E1/D16/E2/E3 protections remain green.
- Narrow E4 PD recorded.
- Typecheck passes.
- Tests pass.

---

# Phase F — Physical Legacy Economic Field Removal

## 12. Phase F Outcome

Phase F removes the final compatibility fields and closes the canonical schema.

Final required state:

```text
PlayerState:
  wealthCapacity: WealthCapacity
  no money
  no numeric wealth

Snapshot 3.16.0:
  player.wealthCapacity required
  player.money forbidden unknown field
  player.wealth forbidden unknown field
```

No old snapshot is migrated or normalized.

---

## 13. US-008 — Atomically remove legacy economic fields and bump Snapshot to 3.16.0

**User story:** As the product owner, I want the canonical runtime and persistence shape to contain only Wealth Capacity so that the retired balance implementations no longer exist physically.

### Atomicity rule

This is the **only Story** allowed to change `GAME_STATE_SNAPSHOT_SCHEMA_VERSION`.

Target version is exactly:

```text
3.16.0
```

If execution starts from any schema other than the accepted `3.15.0` baseline, STOP and replan; do not auto-increment or perform a second bump.

### Runtime requirements

Remove exact legacy economic fields from canonical runtime types:

- remove `PlayerState.money`;
- remove numeric `PlayerState.wealth?`;
- remove numeric `PlayerStats.wealth?` if any compatibility declaration remains after US-001;
- remove new-game `money: 100` seed;
- remove `GameEngineIntegration.applyGameState` money copy;
- remove optional numeric wealth copy/cleanup path.

A fresh game must have `wealthCapacity` and no own `money` / numeric `wealth` property.

### Snapshot requirements

- Bump `GAME_STATE_SNAPSHOT_SCHEMA_VERSION` once: `3.15.0 → 3.16.0`.
- Remove `money` and numeric `wealth` from `SnapshotPlayerState`.
- Remove them from canonical player allowlists, required keys, numeric validation keys, canonical snapshot player keys, and fixtures.
- `toSnapshot()` serializes no money/numeric wealth.
- `fromSnapshot()` accepts only `3.16.0` canonical snapshots and never synthesizes old fields.
- Top-level runtime state validation rejects dynamically injected `player.money` / numeric `player.wealth` as unknown/forbidden canonical player fields.
- Snapshot validation rejects those fields at both top-level `state.player` and nested `eventHistory[*].stateSnapshot.player` boundaries.
- Old `3.15.0` snapshots are rejected as unsupported; there is no migration/fallback/default injection.
- Browser save/export and headless serialization/hydration continue to share this one strict contract.

### Contract documentation

Update the current persistence contracts in the same Story so repository docs never describe the new runtime with the old schema:

- `docs/contracts/game-state-snapshot-contract.md`;
- `docs/contracts/save-schema-versioning-policy.md`;
- `docs/contracts/headless-snapshot-conversion-boundary.md` if it states the old version/shape.

The docs must explicitly state:

- current version `3.16.0` only;
- exact money/numeric wealth fields are no longer part of canonical player state;
- `wealthCapacity` remains required/categorical;
- old `3.15.0` must be externally recreated if needed; runtime does not migrate it.

### Acceptance

- `PlayerState` has no `money` and no numeric `wealth` field.
- Fresh engine state has neither property.
- Snapshot player shape has neither property.
- Snapshot version is exactly `3.16.0` and changed once in this PRD.
- Runtime/snapshot validators reject dynamically injected money/numeric wealth.
- Old `3.15.0` snapshot is rejected; no migration occurs.
- `wealthCapacity` round-trips unchanged through browser/headless snapshot conversion.
- Canonical snapshot fixture is updated and valid.
- Focused runtime/snapshot/save/headless contract tests pass.
- Typecheck passes.
- Tests pass.

---

## 14. US-009 — Migrate regression fixtures/tests to the money-free canonical player shape

**User story:** As a maintainer, I want current regression tests and executable fixtures to assert the new canonical shape directly so that old sentinel balances do not masquerade as active compatibility requirements.

### Requirements

Use current failures/source scans after US-008. Update only executable/current tests and fixtures that actively construct, read, mutate, or assert the removed runtime fields.

Expected classes include:

- canonical persistence/snapshot tests with `3.15.0` literals;
- Global Money retirement tests that still set money sentinels to prove “unchanged” behavior;
- Wealth Capacity semantics tests that compare against `player.money`;
- merchant/route/ending fixtures that include money only because `PlayerState` previously required it;
- headless/browser/experience fixtures that still expect wallet fields;
- simulation/test harnesses that calculate/display `moneyGrowth` or initial/final money.

Preferred migration semantics:

- replace “money remains unchanged” assertions with “no money property is created / no exact-wallet effect exists” where that is the real invariant;
- keep formal anti-reintroduction tests that intentionally contain `money` / numeric `wealth` strings as negative fixtures;
- keep unloaded legacy content evidence tests when their purpose is to prove the guard rejects re-import;
- do not erase historical narrative words merely to make grep clean;
- remove hard-coded `3.15.0` expectations from current-contract tests by updating them to `3.16.0` where version exactness is the contract;
- do not weaken snapshot/version rejection tests.

### Validation

At minimum run:

```text
npm run typecheck
npm run test:contracts
npm run test:headless
npm test
```

Also run focused E1/D16/E2/E3/E4/Phase-F tests.

Broad pre-existing unrelated failures may be attributed, but any newly attributable failure caused by removed fields must be fixed in this Story rather than deferred.

### Acceptance

- Current executable tests no longer require `PlayerState.money` or numeric `PlayerState.wealth` to exist.
- Negative anti-reintroduction fixtures remain meaningful.
- Current contract tests assert Snapshot `3.16.0` exactly.
- E1 through E4 regression guards remain green under the money-free state.
- Wealth Capacity tests assert no legacy field creation rather than sentinel preservation.
- `npm run test:contracts` passes.
- `npm run test:headless` passes, except only repository-documented pre-existing baseline blockers with clear attribution.
- `npm test` has no newly attributable legacy-field failure.
- Typecheck passes.
- Tests pass.

---

## 15. US-010 — Close Global Money Retirement authority and final zero guard

**User story:** As the Human owner, I want one final repository guard and authority update proving that canonical economic state has converged on Wealth Capacity so this migration can be closed without ambiguity.

### Final guard

Add/register a focused final regression, suggested name:

```text
tests/globalMoneyPhysicalRemovalClosure.test.ts
```

It must prove:

1. runtime `PlayerState` canonical shape has no `money` / numeric `wealth`;
2. fresh player state has no such own properties;
3. Snapshot `3.16.0` player shape has no such fields;
4. runtime and snapshot validators reject injected exact balance fields;
5. old `3.15.0` is rejected with no migration;
6. `wealthCapacity` is required and round-trips;
7. formal EventLoader money/numeric-wealth authoring remains zero/rejected;
8. Difficulty Setback money mutation remains zero;
9. current EventExecutor/ConditionEvaluator/generic numeric writer cannot restore exact balance state;
10. live presentation/profile/report surfaces do not own exact balances;
11. Composite Destiny has no exact balance `resources` dimension;
12. unloaded legacy files remain non-authoritative and cannot be imported without guard failure.

Do **not** implement repository-wide literal `money|wealth` zero. Valid remaining text includes anti-reintroduction guards, route/persona/theme labels, historical docs/evidence, and unloaded legacy content.

### Product authority updates

Update current authority, not historical evidence:

- `docs/product/player-model.md`: replace the old “PlayerState.money / optional wealth are pending implementation reality” statement with the final canonical state: economic capacity = `wealthCapacity`; no exact wallet/numeric wealth player field.
- `docs/product/wealth-economy-product-contract-design.md`:
  - preserve the explicitly dated Part B historical inventory as historical evidence;
  - update/append the current implementation/decision section so `money` + numeric optional `wealth` final handling is no longer listed as unresolved;
  - state Snapshot `3.16.0`, no runtime migration, unloaded legacy backlog remains excluded and protected by re-import guards;
  - do not rewrite old dated observations as if they were always false.
- `docs/README.md`: update current Snapshot contract version references if present.
- `docs/governance/product-decisions.md`: record one final narrow decision (expected PD-098, use actual next free number) closing physical legacy economic field removal and Snapshot `3.16.0`.

### Final Product Decision must freeze

- canonical player economic state = `wealthCapacity` only;
- `money` and numeric `wealth` are not PlayerState/Snapshot fields;
- Snapshot `3.16.0` is strict current-only;
- no runtime migration/fallback for `3.15.0`;
- anti-reintroduction guards remain intentionally;
- unloaded legacy wallet content is not current gameplay authority and is not bulk-migrated by this PRD;
- route preference/narrative uses of the token `wealth` are not numeric wealth state;
- reopening exact wallet/numeric wealth gameplay requires a new Human product decision.

### Final validation

Run focused closure plus:

```text
npm run typecheck
git diff --check
npm run test:contracts
npm run test:headless
npm test
npm run validate:event-quality
```

Also run the focused historical protections for D16, E1, E2, E3, E4 and Wealth Capacity semantics.

Broad failures block final closure only if attributable to this PRD or if they invalidate the canonical runtime/persistence contract. Existing unrelated content-quality/source-freeze/test-instability debt must be reported, not silently fixed here.

### Acceptance

- Final physical-removal guard is registered and green.
- Canonical runtime has no exact money/numeric wealth fields.
- Snapshot is strict `3.16.0`, no money/numeric wealth fields, no migration.
- `wealthCapacity` remains sole formal strategic economic capacity.
- E1/D16/E2/E3/E4 protections remain green.
- Product authority and persistence contracts agree with implementation.
- Final Product Decision recorded.
- No unrelated legacy content purge occurred.
- Typecheck passes.
- `git diff --check` passes.
- Tests pass subject only to explicitly attributed pre-existing non-causal baseline failures.
- STOP after closure; do not start another economy redesign.

---

## 16. Snapshot Version and Migration Rules

This PRD authorizes exactly one schema transition:

```text
3.15.0 → 3.16.0
```

Rules:

- Do not create an intermediate `3.15.x` or second bump.
- Do not accept both versions.
- Do not write a migrator.
- Do not silently delete old fields while loading a `3.15.0` snapshot.
- Do not inject default money/wealth values.
- Do not infer Wealth Capacity from old balances.
- Existing external/historical snapshots remain evidence; current runtime rejects them until externally recreated under `3.16.0`.

---

## 17. Allowed Remaining `money` / `wealth` References After Final Closure

Final success is semantic/structural zero, **not string zero**.

Allowed examples include:

### Anti-reintroduction / rejection

```text
EventLoader rejects stat_modify money
EventLoader rejects exact numeric wealth
ConditionEvaluator explicitly rejects retired property
D6 ignores legacy target === money
negative tests construct forbidden fields
```

### Narrative / route identity

```text
choiceTendency: 'wealth'
routePreference: 'wealth'
p8-wealth-shen
pathAffinity.wealth
“财富”“银两” in ordinary historical/world narrative where no state balance is implied
```

### Excluded/history

```text
unloaded money-events/economy/shop JSON
old excluded EffectExecutor/storyData/longEvents
historical test fixtures/artifacts/reports that are not current executable authority
```

A final guard must distinguish these from live state ownership.

---

## 18. Non-Goals

Do not use this PRD to:

- migrate or delete every unloaded wallet JSON file;
- rewrite historical reports/artifacts;
- rename all `wealth` route/theme identifiers;
- create a generic economy framework;
- add ordinary income/expense simulation;
- add Wealth Capacity arithmetic or downgrade mechanics;
- create a numeric Wealth score;
- expand Asset beyond `merchant_shop`;
- redesign composite destiny beyond removing the obsolete exact-balance dimension;
- change Auto Evolution workflow/evolution files;
- fix unrelated P9/P11/B0/event-quality debt;
- add save migration tooling.

---

## 19. Validation and Attribution Policy

### 19.1 Story-local verification

Every Story must run:

```text
npm run typecheck
```

and the focused tests for the modified subsystem.

Stories modifying runtime/tests should run the relevant executable test(s) directly and use `Tests pass` to mean those attributable checks are green.

### 19.2 Broad verification

Use broad suites at phase closure and final closure. Current repository has known unrelated/baseline instability from earlier work; do not expand scope to fix it unless the failure is attributable to this PRD.

Required final attribution categories:

```text
PASS
ATTRIBUTABLE_BLOCKER
PRE_EXISTING / NON_CAUSAL
NOT_RUN (with reason)
```

No “all tests pass” claim may hide known failures.

---

## 20. STOP Conditions

Immediately stop the current Story and report `NOT_CLOSED` / blocker if any of the following occurs:

1. Starting branch does not contain Human-accepted E2–E3 + PD-096.
2. Working tree contains unrelated dirty changes that cannot be attributed safely.
3. Implementing the Story would require a Wealth Capacity downgrade or hidden numeric replacement.
4. Removing Composite Destiny `resources` would require inventing a new universal economic gate to preserve old outcome thresholds.
5. Current repository authority requires exact numeric wealth/money as a formal product field contrary to PD-096/final player model direction.
6. Snapshot baseline is no longer exactly `3.15.0` before US-008.
7. A second Snapshot bump appears necessary.
8. Runtime compatibility would require loading/migrating old snapshots rather than rejecting them.
9. `wealthCapacity` round-trip or current Merchant progression would be broken by the planned removal.
10. Formal loaded catalog unexpectedly contains active exact numeric money/wealth authoring that cannot be classified under accepted product decisions.
11. Ralph commit helper/protocol is unavailable and the execution framework has not been separately authorized to change.
12. A Story would require bulk editing unloaded legacy content/history to make grep zero.

Do not resolve these by alias/fallback/compatibility shims.

---

## 21. Post-Run Discovery and Human Final Review

Ralph completion means execution complete, not product acceptance.

After all Stories are `passes: true`, STOP and run a post-run discovery pass before declaring final closure:

```text
/discovery-pass --mode post-run --prd docs/PRD/global-money-retirement-e4-phase-f.prd.json --prd-md docs/PRD/global-money-retirement-e4-phase-f.md
```

Discovery should specifically search for:

- live/current `player.money` or numeric `player.wealth` reads/writes;
- new-game/default exact balance creation;
- snapshot/schema/DTO copies missed by guards;
- generic string-key writers that can recreate removed properties;
- exact `wealth` condition/effect authoring confused with `wealthCapacity`;
- current reports/profile/simulation surfaces still treating exact balances as state;
- stale current authority docs claiming `3.15.0` or pending money/wealth compatibility;
- hidden migration/fallback logic accepting old snapshots.

Do not treat valid anti-reintroduction/history/narrative references as automatic defects.

Final Human acceptance occurs only after discovery closure.

---

## 22. Execution Approval Boundary

Current status of this document:

```text
HUMAN APPROVED FOR RALPH EXECUTION
```

Creating this PRD does not authorize Ralph to run.

Once the Human approves this PRD for execution, the accepted design authority plus this implementation PRD authorizes the 10 Stories in priority order without repeated per-Story Human gates, subject to the STOP conditions above.
