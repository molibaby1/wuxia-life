# PRD: Global Money Retirement — E2 to E3

> Status: HUMAN APPROVED FOR RALPH EXECUTION
> Scope: Phase E2 Player-Facing Money Presentation Retirement + Phase E3 Current Money Authoring / Runtime Capability Retirement
> Product truth: this Markdown is authoritative over the paired `global-money-retirement-e2-e3.prd.json`
> Execution boundary: stop after E3 closure; do **not** enter E4 / Phase F

## 0. Executive Summary

Wuxia-Life has completed the gameplay-semantic retirement of the legacy `money` wallet.

Repository state at the E1 boundary:

- Formal EventLoader money writes: `0`.
- Normal gameplay money mutations after initialization: `0`.
- Normal gameplay decisions/outcomes that depend on `player.money`: `0`.
- `wealthCapacity` is the canonical strategic economic state.
- `PlayerState.money`, Snapshot `3.15.0`, the new-game `money: 100` compatibility seed, UI presentation, DTO transport, and dormant/generic money capabilities still exist.

This PRD removes two remaining layers without crossing the persistence boundary:

1. **E2:** stop showing or transporting the retired wallet as a player-facing resource.
2. **E3:** remove current-engine authoring/runtime affordances that could silently reintroduce money gameplay.

After this PRD is complete, `money` may still exist physically for compatibility, snapshots, excluded/dead legacy sources, fixtures, and historical analysis code, but it must no longer be:

- a live player-facing resource;
- a current-engine event stat target;
- a current-engine expression condition property;
- an implicit active-planning cost fallback;
- a reachable CriticalChoice consequence;
- a canonical origin/trait stat authoring dimension;
- a formal EventLoader authoring option that can be reintroduced without a failing guard.

E4 / Phase F will later remove the compatibility field and bump the snapshot schema under a separate Human gate.

---

## 1. Product Alignment and Authority

### 1.1 Product problem

The wallet is dead as gameplay semantics but remains visible and technically re-introducible. A player can still see “银两” even though gameplay no longer produces or consumes it, and current generic code still contains authoring surfaces capable of writing or gating on `money`.

That creates two failures:

1. **Product contradiction:** the UI exposes a resource that no longer controls play.
2. **Regression risk:** future content can accidentally resurrect the retired wallet through generic authoring/runtime paths.

### 1.2 Authority

Implementation must remain aligned with:

- `docs/product/player-model.md`
- `docs/product/wealth-economy-product-contract-design.md`
- `docs/governance/product-decisions.md`, especially PD-092 and PD-093
- `docs/contracts/save-schema-versioning-policy.md`
- `AGENTS.md`

Frozen product rules:

- Wuxia-Life does not simulate ordinary daily cashflow.
- `wealthCapacity` is the canonical strategic economic state.
- Do not introduce hidden numeric Wealth, wallet aliases, Wealth XP, or ordinary Wealth Capacity decrements.
- Formal gameplay events already have zero money producers.
- Difficulty setbacks already have zero money mutations.
- E2/E3 do not remove the compatibility field or change save-schema version.

---

## 2. Ralph Execution Preconditions

This PRD is designed for the installed Ralph dual-document workflow.

Run with both files:

```text
/ralph-run --prd docs/PRD/global-money-retirement-e2-e3.prd.json --prd-md docs/PRD/global-money-retirement-e2-e3.md
```

### 2.1 Clean execution workspace is mandatory

Ralph creates one commit per Story. Do **not** run this PRD in a worktree containing unrelated D8–E1/evolution/P25 dirty changes.

Before Story 1:

- execute in an isolated clean branch/worktree that already contains the Human-accepted state through E1;
- unrelated dirty/untracked files must not be present;
- if that prerequisite is not satisfied, stop before implementation rather than committing unrelated work.

### 2.2 Do not use the stale single-document runner for this PRD

The repository `scripts/ralph-cursor-agent.sh` currently supplies the JSON execution index but does not explicitly supply/read the paired Markdown product truth as required by the installed `ralph-run` Skill.

For this PRD:

- use `/ralph-run` with both paths as shown above;
- updating the runner script is **not** part of E2/E3.

### 2.3 One Story per iteration

Every Story below is intended to fit one Ralph iteration and one commit. A Story must not opportunistically implement a later Story.

---

## 3. Global Invariants

These must remain true after every Story unless that Story explicitly narrows a presentation/type surface:

1. Formal EventLoader money writes remain `0`.
2. Normal gameplay money mutation loci remain `0`.
3. Normal gameplay money consumers remain `0`.
4. `wealthCapacity` behavior is unchanged.
5. No Wealth downgrade mechanism is added.
6. No hidden numeric economy is added.
7. `PlayerState.money` remains physically present until E4 / Phase F.
8. New-game `money: 100` remains until E4 / Phase F.
9. Snapshot schema remains exactly `3.15.0`.
10. Snapshot required keys / canonical keys are not changed.
11. Compatibility copy/restore of `money` is not changed.
12. Unloaded legacy wallet JSON is not bulk-rewritten in this PRD.
13. Narrative words such as “财富”, “银两”, “财物”, “家财” are not globally banned; only obsolete resource/delta presentation or authoring capability is retired.

---

# Phase E2 — Player-Facing Money Presentation Retirement

## 4. E2 Outcome

At E2 closure:

```text
normal gameplay money producer = 0
normal gameplay money consumer = 0
live player-facing money resource presentation = 0
```

`PlayerState.money` may still exist internally for compatibility, but normal players must no longer see a wallet number, wallet resource row, wallet ending stat, or wallet progression delta.

---

## 5. US-001 — Retire the live main-screen silver resource

**User story:** As a player, I want the main screen to show the canonical strategic economy state only, so that the UI does not present a dead wallet as an active resource.

### Requirements

- In `src/components/mainScreenModel.ts`:
  - remove `money` from `MainScreenPlayer` presentation requirements;
  - `topResources` contains `wealthCapacity` and no `money` entry;
  - the expanded `资源` group contains `wealthCapacity` and no `money` entry;
  - remove comments/descriptions that call money a “阶段性周转余额” or otherwise tell players it remains a resource.
- In `src/components/GameScreen.vue`:
  - the API-to-main-screen presentation mapping no longer copies `p.money` into `attributePanelPlayer`.
- Do not change `PlayerState.money`, Snapshot, API DTO shape, or gameplay logic in this Story.
- Update focused main-screen tests so both local-engine and API-mode presentation are money-free.

### Acceptance

- Main-screen top resource row shows 财力 and no 银两 resource.
- Expanded resource group shows 财力 and no 银两 resource.
- Main-screen presentation model does not require a `money` field.
- Main-screen focused tests pass.
- Typecheck passes.
- Verify in browser using dev-browser skill.

---

## 6. US-002 — Retire ending-screen and ending-review money presentation

**User story:** As a player finishing a life, I want the ending to summarize meaningful life outcomes rather than display a retired wallet number.

### Requirements

- In `src/components/EndingScreen.vue`:
  - remove the 银两 stat row;
  - remove `money` from the component's presentation prop shape.
- In `src/App.vue`:
  - stop constructing/passing `money` solely for ending presentation in API mode.
- In `src/core/EndingSystem.ts`:
  - remove the `财富：${player.money}` review line;
  - preserve all ending classification logic and other review fields.
- In `src/core/endingPresentation.ts`:
  - retire the unreachable `player.money < 0` quiet-life branches;
  - replace them with the already-valid non-wallet narrative alternative that matches the same life axis;
  - do not introduce Wealth Capacity requirements or ending reclassification.
- Preserve the ending's existing martial/chivalry/life-memory presentation.

### Acceptance

- EndingScreen renders no 银两/钱包 numeric stat.
- Ending review text does not print `player.money` as 财富.
- Quiet-family ending presentation does not branch on `player.money`.
- Ending classification results are unchanged for equivalent states that differ only in `money`.
- Existing ending/quiet-family focused tests pass after expectation updates.
- Typecheck passes.
- Verify in browser using dev-browser skill.

---

## 7. US-003 — Retire money from progression and period-delta presentation

**User story:** As a player, I want progression overlays and period summaries to report only live gameplay stats, so that compatibility-only money cannot appear as a change notification.

### Requirements

- In `src/core/activePlanning/periodSummaryBuilder.ts`:
  - remove `money` from `PUBLIC_NUMERIC_STATS`;
  - remove the `money: '银两'` label.
- In `src/types/progressionOverlay.ts`:
  - remove `money` from `PLAYER_RESULT_STATS`;
  - remove the money display label from `getStatName`.
- A before/after state difference in only `money` must produce no money delta line/card.
- Preserve all other stat delta calculations and labels.
- Do not change active-action rewards/costs in this Story.

### Acceptance

- Period summaries do not emit 银两 deltas.
- Player-delta and automatic-stage overlay cards do not emit 银两 deltas.
- Existing non-money delta ordering/labels are preserved.
- Focused progression/active-planning tests pass.
- Typecheck passes.
- Verify in browser using dev-browser skill.

---

## 8. US-004 — Remove money from the session progression presentation DTO

**User story:** As an API/UI consumer, I want the session progression payload to expose only live player-facing state, so that the retired wallet is no longer transported as presentation data.

### Requirements

- Remove `money` from `PlayerSummaryDto` in `src/contracts/sessionProgression.ts`.
- Remove `money` from `mapPlayerSummary` in `server/src/services/sessionProgressionMapper.ts`.
- Update API/UI consumers and tests that depend on `PlayerSummaryDto` so none expect or transport `money`.
- This Story removes `money` only from the session presentation DTO; it does **not** remove it from `PlayerState`, Snapshot, session runtime state, or compatibility persistence.
- Do not change session phases, terminal structure, life-memory mapping, or owned-asset mapping.

### Acceptance

- Session progression API player payload has no `money` field.
- API-mode main screen and ending continue to render without a money field.
- Session progression contract/mapping tests pass.
- No Snapshot/player-state schema change occurs.
- Typecheck passes.
- Tests pass.
- Verify in browser using dev-browser skill.

---

## 9. US-005 — Establish the E2 presentation-zero guard and close E2 governance

**User story:** As a maintainer, I want a regression guard and governance record for E2 so that a compatibility wallet cannot silently reappear in live player-facing surfaces.

### Requirements

- Add a focused regression, recommended name:
  - `tests/globalMoneyPlayerFacingPresentationRetirement.test.ts`
- Register it in `tests/runRealTestGate.ts`.
- Guard the live E2 surfaces, not every repository string:
  - `mainScreenModel` resource surfaces contain no money stat;
  - ending presentation/review does not read/display money;
  - progression/period delta presentation does not include money;
  - `PlayerSummaryDto` does not expose money.
- The guard must **not** require `rg money src = 0`.
- The guard must explicitly preserve:
  - `PlayerState.money`;
  - Snapshot `3.15.0` compatibility field;
  - new-game `money: 100` seed;
  - formal money producer zero.
- Add the next narrow Product Decision after PD-093 (expected PD-094 only if that is the actual next free ID):
  - player-facing wallet presentation is retired because money has no remaining gameplay producer/consumer;
  - compatibility/runtime capability retirement is deferred to E3/E4.

### Acceptance

- E2 dedicated regression passes and is registered in the real gate.
- Live player-facing money presentation guard is zero.
- Compatibility money field and Snapshot `3.15.0` are explicitly preserved.
- Formal EventLoader money writes remain zero.
- Normal gameplay money mutation remains zero.
- Narrow E2 Product Decision is recorded once with the actual next PD number.
- Typecheck passes.
- Tests pass.

---

# Phase E3 — Current Money Authoring / Runtime Capability Retirement

## 10. E3 Outcome

At E3 closure, the **current production engine and current authoring surface** must no longer offer a supported path to make `money` gameplay-active again.

Expected boundary:

```text
formal money producers = 0
normal gameplay money mutations = 0
normal gameplay money consumers = 0
live player-facing money presentation = 0
current-engine money authoring/runtime capability = retired
compatibility field / Snapshot money = still present
```

This is not a repository-wide string purge. Excluded old engines, fixtures, historical reports, and unloaded deferred JSON can still contain money references until the later compatibility/final-closure batch, provided they cannot re-enter the current formal runtime without a failing guard.

---

## 11. US-006 — Retire `stat_modify money` from the current EventExecutor

**User story:** As a content maintainer, I want the current formal event executor to reject/ignore money as a stat target so that new formal content cannot revive wallet mutation.

### Requirements

- In `src/core/EventExecutor.ts`:
  - remove `money` from `StatModifyHandler.MODIFIABLE_PLAYER_STATS`;
  - remove the money-specific clamp/range branch.
- A `stat_modify` effect targeting `money` must no longer change `player.money` through the current EventExecutor.
- Preserve all supported non-money stat behavior.
- Do not remove `PlayerState.money`.
- Do not change Wealth Capacity effect handlers.
- Update tests that intentionally exercised `stat_modify money` so they assert retirement rather than support.

### Acceptance

- Current EventExecutor cannot mutate money via `stat_modify`.
- Formal EventLoader money writes remain zero.
- Existing non-money `stat_modify` tests pass.
- Wealth Capacity effect tests pass.
- PlayerState/Snapshot money field remains unchanged.
- Typecheck passes.
- Tests pass.

---

## 12. US-007 — Retire money expression/condition access from the current ConditionEvaluator

**User story:** As a content maintainer, I want current event conditions to be unable to gate on the retired wallet so that future content cannot revive exact-balance eligibility.

### Requirements

- In `src/core/ConditionEvaluator.ts`:
  - remove `money` from `DIRECT_PLAYER_PROPERTIES`.
- Expressions such as `player.money >= N` or equivalent direct money identifiers must be rejected/fail closed by the current ConditionEvaluator.
- Preserve all supported canonical properties and `wealth_capacity_at_least` behavior.
- Do not add a money alias to Wealth Capacity.
- Formal loaded content must remain free of money conditions.

### Acceptance

- Current ConditionEvaluator cannot use money as a direct player property.
- Money expressions fail closed without changing unrelated condition behavior.
- `wealth_capacity_at_least` tests continue to pass.
- Formal loaded catalog has zero money conditions.
- Typecheck passes.
- Tests pass.

---

## 13. US-008 — Retire dormant active-planning wallet fallback capability

**User story:** As a maintainer, I want active planning to require explicit live stat channels so that an omitted cost stat cannot silently default back to the retired wallet.

### Requirements

- In `src/types/activeActionTypes.ts`, make active-action costs explicitly name their stat channel rather than treating an absent stat as money.
- In `src/core/activePlanning/ActionResultResolver.ts`:
  - remove `cost.stat ?? 'money'` fallback;
  - use only explicit cost stat channels.
- In `src/core/activePlanning/ageActionStatCaps.ts`:
  - remove the money-specific early-childhood cap branch.
- Ensure current `activeActionCatalog` and `childhoodActionCatalog` remain valid (their current `costs: []` behavior is unchanged).
- Do not invent a Wealth Capacity cost channel.
- Do not change action reward balancing, repetition rules, risk, duration, or habit effects.

### Acceptance

- Missing active-action cost stat no longer implies money.
- Active-planning age caps contain no money-specific logic.
- Existing active-action catalogs still resolve with unchanged current gameplay results.
- No Wealth Capacity spending mechanism is introduced.
- Active-planning focused tests pass.
- Typecheck passes.
- Tests pass.

---

## 14. US-009 — Retire unreachable CriticalChoice wallet consequences

**User story:** As a maintainer, I want active CriticalChoice code to contain no dormant wallet consequences so that a future choice catalog change cannot revive hidden money rewards.

### Requirements

- In `src/core/CriticalChoiceSystem.ts`:
  - remove `player.money += 500` from the `life_goal / merchant` dead branch;
  - remove `player.money += 200` from the `marriage_choice / arranged` dead branch;
  - preserve all existing non-money consequences in those branches.
- Do not redesign CriticalChoice catalog reachability.
- Do not replace these dead wallet consequences with Wealth Capacity transitions.
- Preserve current reachable `sect_choice` behavior.

### Acceptance

- CriticalChoiceSystem contains no direct money mutation consequence.
- Existing non-money life-goal/marriage-choice consequences remain as authored.
- Reachable sect-choice behavior is unchanged.
- CriticalChoice focused tests pass.
- Typecheck passes.
- Tests pass.

---

## 15. US-010 — Retire legacy origin/trait wallet authoring

**User story:** As a maintainer, I want origin/trait metadata to stop advertising money as a canonical stat dimension so that legacy parallel origin data cannot reintroduce wallet initialization.

### Requirements

- In `src/data/traits/origins.ts`:
  - remove the three legacy `initialStats` money entries (`merchant_house`, `poor_family`, `streetborn` or their current equivalents);
  - preserve all non-money initial stats, summaries, flavor, and event biases.
- In `src/types/eventTypes.ts`:
  - remove `money` from `TraitStatKey` after origin/trait authoring no longer needs it.
- Do not change canonical `origin.json` Wealth Capacity initialization.
- Do not convert poor/street origins into Wealth Capacity changes in this Story.
- Preserve PD-080 behavior: normal new-game trait application must not regain wallet effects.

### Acceptance

- Legacy origin trait metadata contains no money initial stat entry.
- `TraitStatKey` no longer includes money.
- Canonical merchant origin Wealth Capacity behavior is unchanged.
- Normal new-game origin/trait tests remain money-independent.
- Typecheck passes.
- Tests pass.

---

## 16. US-011 — Retire current money-specific effect vocabulary and authoring examples

**User story:** As a content author, I want current types/examples to stop teaching or advertising wallet effects so that new content is guided toward canonical Wealth semantics instead.

### Requirements

- In current production event types:
  - remove `MONEY_MODIFY` / `money_modify` from the current `EffectType` vocabulary when no current formal handler exists;
  - remove current-engine/player-facing branches that special-case `money_modify` (for example stale effect-description handling in `useNewGameEngine`) if they are reachable only through that retired vocabulary.
- Update `src/data/eventExamples.ts` so examples no longer demonstrate money conditions or money stat modification; use an existing non-money stat or canonical Wealth example appropriate to the example's purpose.
- Do **not** bulk-delete excluded old-engine files in this Story.
- Do **not** remove `PlayerState.money` or Snapshot fields.
- Preserve canonical `wealth_capacity_at_least`, `wealth_capacity_set`, and `wealth_capacity_raise_to` examples/support.

### Acceptance

- Current `EffectType` does not expose `MONEY_MODIFY`.
- Current authoring examples do not demonstrate wallet conditions or wallet mutations.
- Current UI/composable code has no active `money_modify` presentation case tied to the current type vocabulary.
- Wealth Capacity authoring examples/support remain valid.
- Typecheck passes.
- Tests pass.

---

## 17. US-012 — Establish a formal authoring guard against wallet re-import

**User story:** As a maintainer, I want the formal content gate to fail if wallet authoring is reintroduced so that deferred legacy files cannot silently become live by being added to `events.json`.

### Requirements

- Add or extend a deterministic regression/validation guard over the **formal EventLoader imports**.
- The guard must reject all of the following in the formal loaded catalog:
  - executable `stat_modify` targeting/stat=`money`;
  - `money_modify` effects;
  - expression/condition authoring that reads exact money (`player.money`, direct money identifier, or current equivalent).
- It must operate from `src/data/events.json` / EventLoader authority, not `event-asset-manifest.json` counts.
- It must explicitly protect the current `412`-event formal source semantics without hard-coding `415` from stale manifest data.
- Deferred/unloaded legacy JSON with wallet authoring may remain physically present, but importing it into the formal catalog must fail the guard until separately migrated/retired.
- Do not rewrite the ~178 unloaded wallet writes in this Story.

### Acceptance

- Formal loader authoring guard passes on current catalog.
- A focused synthetic/probe money effect fails the guard.
- A focused synthetic/probe money condition fails the guard.
- Formal EventLoader remains zero money writes and zero money conditions.
- Deferred wallet backlog is not bulk-modified.
- Typecheck passes.
- Tests pass.

---

## 18. US-013 — Establish E3 capability-zero closure and governance

**User story:** As the Human owner, I want one final E2–E3 closure gate so that the repository has a stable boundary before compatibility-field removal is separately authorized.

### Requirements

- Add a focused closure regression, recommended name:
  - `tests/globalMoneyCurrentRuntimeCapabilityRetirement.test.ts`
- Register it in `tests/runRealTestGate.ts`.
- The closure guard must establish all of the following:
  - formal EventLoader money writes = 0;
  - formal EventLoader money conditions = 0;
  - Difficulty Setback money mutations = 0;
  - main/ending/progression/session presentation surfaces expose no money;
  - current EventExecutor cannot `stat_modify money`;
  - current ConditionEvaluator cannot read money expressions;
  - active planning has no implicit money fallback/cap;
  - CriticalChoiceSystem has no direct money mutations;
  - current origin/trait authoring has no money stat;
  - current `EffectType` has no `money_modify` capability;
  - formal authoring guard is active.
- The same closure guard must preserve the compatibility boundary:
  - `PlayerState.money` still exists;
  - new-game `money: 100` still exists;
  - Snapshot schema remains `3.15.0` and still carries/requires money;
  - no E4/Phase F field removal happened.
- Add the next narrow Product Decision after the E2 PD (expected PD-095 only if it is the actual next free ID):
  - current gameplay/presentation/authoring/runtime no longer owns money;
  - remaining money ownership is compatibility + excluded/dead legacy + fixtures/history;
  - E4/Phase F requires separate Human authorization and a snapshot bump.
- Run targeted E1/D16/D14–D10 regressions and current E2/E3 tests.

### Acceptance

- E3 dedicated closure regression passes and is registered in the real gate.
- Current production gameplay/presentation/authoring/runtime money capability is zero under the PRD definition.
- `PlayerState.money`, new-game seed, and Snapshot `3.15.0` remain intact.
- E1 and D16 money-zero regressions pass.
- E2 dedicated presentation-zero regression passes.
- Narrow E3 Product Decision is recorded once with the actual next PD number.
- Typecheck passes.
- Tests pass.

---

## 19. Explicit Non-Goals / Deferred Scope

The following are **not authorized** by this PRD:

### 19.1 E4 / Phase F compatibility removal

Do not remove or change:

- `PlayerState.money`;
- `createInitialState money: 100`;
- `applyGameState` compatibility copy;
- `SnapshotPlayerState.money`;
- canonical Snapshot required/player-key lists;
- Snapshot schema `3.15.0`;
- save/load migration policy;
- compatibility round-trip behavior.

### 19.2 Bulk historical/deferred content migration

Do not bulk rewrite/delete:

- the ~29 unloaded line files / ~178 wallet writes identified by E0;
- excluded old `storyData` / long-event engine wallet data;
- historical P16/P20/P25/P45 simulation/report fixtures solely to chase `rg money` zero;
- tests/fixtures that still need the compatibility field before Phase F.

The E3 formal authoring guard is the anti-resurrection mechanism for this batch.

### 19.3 New economy design

Do not introduce:

- `wealth_capacity_lower_to`;
- spendable Wealth points;
- wallet aliases;
- hidden economic reserve/score;
- Wealth Capacity XP;
- ordinary economic penalties replacing removed money.

### 19.4 Unrelated cleanup

Do not refactor adjacent UI, rewrite narrative prose globally, change event scheduling, or repair unrelated broad-test baseline debt.

---

## 20. Verification Strategy

### 20.1 Per-Story minimum

Every Story:

- run `npm run typecheck`;
- run focused tests for touched logic;
- run browser verification for UI Stories as required by Ralph.

### 20.2 Phase closure checks

At E2 closure:

- E2 dedicated presentation-zero regression;
- existing main-screen / ending / active-planning / API progression focused tests;
- E1 and D16 regressions.

At E3 closure:

- E3 dedicated capability-zero regression;
- formal money producer/condition guard;
- E2 dedicated regression;
- E1/D16 and D14–D10 regressions;
- current ConditionEvaluator/EventExecutor/active-planning/CriticalChoice/origin focused tests.

### 20.3 Broad suite attribution

`npm test` / `validate:event-quality` may contain pre-existing failures such as B0 source-freeze or historical quality debt. A Story is blocked only by failures attributable to that Story. Ralph must record baseline attribution in `progress.txt`; it must not “fix” unrelated failures.

---

## 21. Stop Conditions

Stop the current Story and mark it BLOCKED rather than expanding scope if any of these occur:

1. A supposedly presentation-only money read is discovered to affect gameplay eligibility/scoring/scheduling.
2. Removing a current money capability requires deleting `PlayerState.money` or changing Snapshot `3.15.0`.
3. A UI Story requires a product redesign of Wealth Capacity rather than simple wallet retirement.
4. Active planning contains a newly discovered reachable money reward/cost not documented by E0.
5. CriticalChoice money branches have become reachable in the current catalog.
6. A formal loaded event currently contains a money condition/write (regression from D16).
7. Removing `money_modify` requires modifying excluded old-engine architecture rather than the current type/composable surface.
8. The E3 guard cannot distinguish formal imports from unloaded legacy backlog without rewriting backlog content.
9. Worktree isolation/commit safety prerequisite is not satisfied.
10. A change would cross into E4/Phase F persistence-field removal.

---

## 22. E2–E3 Completion Contract

This PRD is complete only when all Ralph Stories pass and the final repository state satisfies:

```text
Formal EventLoader money writes                 = 0
Formal EventLoader money conditions             = 0
Difficulty Setback money mutations              = 0
Normal gameplay money producer                  = 0
Normal gameplay money consumer                  = 0
Live player-facing money presentation           = 0
Session player presentation DTO money           = absent
Current EventExecutor stat_modify money support = retired
Current ConditionEvaluator money access         = retired
Active-planning implicit money fallback         = retired
CriticalChoice direct money consequences        = retired
Current origin/trait money authoring             = retired
Current money_modify authoring vocabulary        = retired
Formal wallet re-import guard                    = active

PlayerState.money                                = still present
New-game money:100                               = still present
Snapshot schema                                  = 3.15.0
Snapshot money compatibility                     = still present
E4 / Phase F                                     = NOT STARTED
```

Plain-language product result:

> Players no longer see or interact with an “银两” resource, and current Wuxia-Life gameplay/content authoring can no longer accidentally bring that wallet back. The only remaining wallet state is an intentionally isolated compatibility residue waiting for a separately authorized persistence/schema removal.

After Ralph completes all Stories, run the paired post-run discovery pass before treating E2–E3 as finally accepted:

```text
/discovery-pass --mode post-run --prd docs/PRD/global-money-retirement-e2-e3.prd.json --prd-md docs/PRD/global-money-retirement-e2-e3.md
```

Do not begin E4 / Phase F until Human reviews that discovery result and explicitly authorizes the next PRD.
