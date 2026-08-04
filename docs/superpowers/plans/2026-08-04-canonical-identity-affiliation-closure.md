# Canonical Identity and Affiliation Closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the generic canonical identity model, replace split sect membership with one canonical Affiliation, and present affiliation, title, direction, experience, and ending as separate concepts.

**Architecture:** Perform one breaking canonical cutover. `player.affiliation` becomes the only current organization owner; generic identity state and `lifePath.primaryIdentity` are removed. Formal events use explicit facts instead of identity gates, and every runtime surface consumes the same Affiliation and Title fields.

**Tech Stack:** TypeScript 5.9, Vue 3, Vite, JSON event catalog, Node/tsx tests, canonical Snapshot Contract, Headless/API session progression.

## Global Constraints

- Follow `docs/product/player-model.md` and `docs/governance/product-decisions.md#PD-041`.
- Snapshot target is exactly `3.13.0`; reject every earlier version.
- Life Memory target is exactly `3.0.0`.
- Do not implement migration, fallback, dual-write, or silent cleanup.
- Do not create occupation, multi-identity, affiliation history, or multi-organization state.
- Do not infer Affiliation from event text, event ID, persona, Trace, or generic route flags.
- Do not change EndingSystem classification or thresholds.
- Preserve the user's existing dirty worktree; do not commit, reset, clean, stash, or discard unrelated changes.
- Complete the whole stage unless a structural blocker from `current-product-stage.md` is hit.

---

## Planned file structure

**Create**

- `src/core/affiliationCatalog.ts` — closed Affiliation IDs and display metadata.
- `tests/canonicalIdentityAffiliationClosure.test.ts` — canonical types, runtime, event data, Snapshot, and parity guards.
- `tests/playerRolePresentation.test.ts` — main-screen and EndingScreen presentation guards.
- `docs/test-reports/canonical-identity-affiliation-closure.md` — final evidence report.

**Delete**

- `src/core/IdentitySystem.ts` — generic identity classifier and effects.

**Primary modifications**

- `src/types/eventTypes.ts`
- `src/types/lifeMemory.ts`
- `src/core/EventExecutor.ts`
- `src/core/GameEngineIntegration.ts`
- `src/core/LifePathSystem.ts`
- `src/core/deriveLifeMemorySummary.ts`
- `src/contracts/gameStateSnapshot.ts`
- `src/contracts/validation/canonicalGameStateValidation.ts`
- `src/contracts/fixtures/gameStateSnapshotAge50.ts`
- `src/contracts/sessionProgression.ts`
- `server/src/services/sessionProgressionMapper.ts`
- current formally loaded identity and sect event JSON files
- `src/components/mainScreenModel.ts`
- `src/components/MainScreenLifeSummary.vue`
- `src/components/AttributePanel.vue`
- `src/components/EndingScreen.vue`
- `src/components/GameScreen.vue`
- `src/App.vue`
- affected tests and `tests/runRealTestGate.ts`

---

### Task 1: Add failing canonical closure guards

**Files:**
- Create: `tests/canonicalIdentityAffiliationClosure.test.ts`
- Create: `tests/playerRolePresentation.test.ts`
- Modify: `tests/runRealTestGate.ts`

**Interfaces:**
- Consumes: current runtime types, Snapshot validator, EventLoader manifest, main-screen model, EndingScreen source.
- Produces: regression guards that fail until all old identity/sect sources are removed.

- [ ] **Step 1: Write canonical source guards**

Assert all of the following:

```ts
assert.equal(GAME_STATE_SNAPSHOT_SCHEMA_VERSION, '3.13.0');
assert.equal(LIFE_MEMORY_SCHEMA_VERSION, '3.0.0');
assert(!('sect' in state.player));
assert.equal(state.player.affiliation, null);
assert(!('identity' in state));
assert(!('primaryIdentity' in (state.lifePath ?? {})));
```

Read production source files and fail if they contain active imports or declarations for:

```text
IdentitySystem
IdentityInfo
PlayerIdentity
state.identity
player.sect
flags.current_sect
lifePath.primaryIdentity
```

Do not scan historical reports or analysis taxonomies.

- [ ] **Step 2: Write event catalog guards**

Load `src/data/events.json`, open only its formal imports, and recursively assert:

```text
no triggerConditions.identity
no thresholds.identity
no requirements.identity used as runtime gate
no flag_set current_sect
no flag_unset current_sect
```

Allow the word `identity` in filenames, category, tags, names, and narrative text.

- [ ] **Step 3: Write Snapshot rejection guards**

Create a valid `3.13.0` fixture with:

```ts
player: {
  affiliation: 'wudang',
  title: '武当长老',
}
```

Assert rejection of:

```ts
legacy.metadata.schemaVersion = '3.12.0';
legacy.state.player.sect = '武当派';
legacy.state.identity = { identities: ['hero'], primary: 'hero' };
legacy.state.lifePath.primaryIdentity = 'hero';
```

- [ ] **Step 4: Write presentation guards**

Assert:

```text
Main screen label contains 所属
Main screen does not contain 暂无身份
EndingScreen does not render 身份摘要
EndingScreen does not use ending name as player.title
API ending player mapping preserves nullable title
Affiliation and title are separate display values
```

- [ ] **Step 5: Register both suites**

Add near the other canonical suites:

```ts
{ name: 'canonicalIdentityAffiliationClosure', entry: 'tests/canonicalIdentityAffiliationClosure.test.ts' },
{ name: 'playerRolePresentation', entry: 'tests/playerRolePresentation.test.ts' },
```

- [ ] **Step 6: Run tests and confirm they fail for the intended legacy sources**

Run:

```bash
npm exec -- tsx tests/canonicalIdentityAffiliationClosure.test.ts
npm exec -- tsx tests/playerRolePresentation.test.ts
```

Expected: failures reference current `3.12.0`, `IdentitySystem`, `sect`, identity projection, and “暂无身份”.

---

### Task 2: Cut over canonical types and persistence

**Files:**
- Create: `src/core/affiliationCatalog.ts`
- Modify: `src/types/eventTypes.ts`
- Modify: `src/types/lifeMemory.ts`
- Modify: `src/contracts/gameStateSnapshot.ts`
- Modify: `src/contracts/validation/canonicalGameStateValidation.ts`
- Modify: `src/contracts/fixtures/gameStateSnapshotAge50.ts`
- Modify: affected Snapshot and canonical tests

**Interfaces:**
- Produces:
  ```ts
  export type AffiliationId =
    | 'shaolin'
    | 'wudang'
    | 'beggars'
    | 'border'
    | 'shadow_sect';

  export function getAffiliationDefinition(
    id: AffiliationId,
  ): AffiliationDefinition;
  ```

- [ ] **Step 1: Add the closed Affiliation type and catalog**

Implement five exact IDs and metadata:

```ts
const AFFILIATIONS = {
  shaolin: { displayName: '少林寺', organizationClass: 'orthodox' },
  wudang: { displayName: '武当派', organizationClass: 'orthodox' },
  beggars: { displayName: '丐帮', organizationClass: 'neutral' },
  border: { displayName: '边关守军', organizationClass: 'neutral' },
  shadow_sect: { displayName: '幽影门', organizationClass: 'unconventional' },
} as const;
```

Unknown IDs must not fall back to raw strings.

- [ ] **Step 2: Replace PlayerState sect**

Change:

```ts
sect: string | null;
```

to:

```ts
affiliation: AffiliationId | null;
```

Keep:

```ts
title: string | null;
```

- [ ] **Step 3: Remove generic identity types and state**

Delete:

```text
PlayerIdentity
IdentityInfo
IdentityCriteria
IdentityEffects
GameState.identity
```

- [ ] **Step 4: Remove `LifePath.primaryIdentity`**

Delete the field and every method or requirement whose only purpose is primary identity:

```text
setPrimaryIdentity
canChangeIdentity
getIdentityFaction
requirements.identity
identity compatibility
```

Keep unrelated faction, achievement, relationship, and commitment behavior.

- [ ] **Step 5: Update Snapshot contract**

Set:

```ts
GAME_STATE_SNAPSHOT_SCHEMA_VERSION = '3.13.0';
```

Snapshot player requires:

```ts
affiliation: AffiliationId | null;
title: string | null;
```

Snapshot state no longer permits `identity`. LifePath no longer permits `primaryIdentity`.

Update exact-key validators, required keys, fixtures, converters, adapter tests, and version assertions.

- [ ] **Step 6: Update Life Memory schema**

Set:

```ts
LIFE_MEMORY_SCHEMA_VERSION = '3.0.0';
```

Remove:

```ts
identity?: { primary: string; all: string[] };
```

Do not replace it with another generic role list.

- [ ] **Step 7: Run contract and type verification**

Run:

```bash
npm run typecheck
npm run test:contracts
npm exec -- tsx tests/canonicalIdentityAffiliationClosure.test.ts
```

Expected: contract-level failures should now be limited to runtime producers, event data, DTOs, and UI consumers not yet migrated.

---

### Task 3: Remove IdentitySystem and migrate formal identity gates

**Files:**
- Delete: `src/core/IdentitySystem.ts`
- Modify: `src/core/EventExecutor.ts`
- Modify: `src/core/GameEngineIntegration.ts`
- Modify: `src/core/deriveLifeMemorySummary.ts`
- Modify: `src/core/LifePathSystem.ts`
- Modify: formally loaded:
  - `src/data/lines/identity-hero.json`
  - `src/data/lines/identity-merchant.json`
  - `src/data/lines/identity-year-events.json`
- Modify or delete tests that directly protect IdentitySystem.

**Interfaces:**
- Consumes: existing stats, flags, event history, achievements, and Affiliation.
- Produces: no generic identity state; equivalent content eligibility based on explicit facts.

- [ ] **Step 1: Remove automatic identity writes**

Delete from effect execution:

```ts
IdentitySystem.determineIdentity(...)
IdentitySystem.recordIdentity(...)
```

Delete direct engine methods:

```text
addIdentity
removeIdentity
hasIdentity
getIdentities
```

Delete identity copying in `applyGameState`.

- [ ] **Step 2: Remove identity runtime guards**

Delete:

```text
EventExecutor.canTriggerEvent() identity block
GameEngineIntegration.checkThresholds() identity block
```

Delete identity-related trigger and threshold type members.

- [ ] **Step 3: Build the migration matrix**

Use the former criteria as the existing behavior baseline:

```text
outlaw       chivalry <= -80
hero         chivalry >= 80 AND reputation >= 50
sect_leader  reputation >= 60 AND martialPower >= 70 AND establish_sect
merchant     money >= 5000 AND business_empire
scholar      comprehension >= 80 AND write_famous_book
assassin     martialPower >= 60 AND chivalry <= -30 AND assassination_success
doctor       chivalry >= 50 AND heal_many_people
official     reputation >= 50 AND comprehension >= 60 AND become_official
hermit       retired
```

Record every formally loaded event gate and its replacement in the closure report.

Unproducible values such as the current `warrior` and typo-based beggar identity are treated as always false under the old runtime:

- remove them from required any-of sets when another producible option remains;
- remove them from forbidden sets;
- stop if a required set becomes empty.

- [ ] **Step 4: Migrate hero events**

Replace generic hero requirements with explicit current-state criteria. Remove duplicate legacy `requirements.identity` and `thresholds.identity`.

Do not change event copy, choices, rewards, scheduling, or IDs.

- [ ] **Step 5: Migrate merchant events**

Replace merchant identity with:

```text
money >= 5000
business_empire flag present
```

Preserve all other event-specific gates.

- [ ] **Step 6: Migrate identity-year events**

Replace required or forbidden identity lists with the equivalent explicit facts. Preserve the current reachability of formerly unproducible values as defined above.

- [ ] **Step 7: Remove IdentitySystem-only tests**

Delete or rewrite:

```text
tests/testIdentityKarmaSystem.ts
IdentitySystem sections in tests/testMerchantStatecraftVerticalSlice.ts
IdentitySystem-only assertions in canonicalMartialNonEventProducerPruning.test.ts
```

Keep tests for karma, merchant content, and martial semantics that do not depend on generic identity.

- [ ] **Step 8: Run focused tests**

Run:

```bash
npm exec -- tsx tests/canonicalIdentityAffiliationClosure.test.ts
npm run test:sample-lines-routes
npm run validate:event-quality
```

Expected: no loaded runtime identity gate remains and event validation stays green.

---

### Task 4: Add canonical Affiliation effects and migrate producers

**Files:**
- Modify: `src/types/eventTypes.ts`
- Modify: `src/core/EventExecutor.ts`
- Modify: `src/core/GameEngineIntegration.ts`
- Modify formally loaded files containing `current_sect`:
  - `src/data/lines/general.json`
  - `src/data/lines/chivalry-events.json`
  - `src/data/lines/identity-demon.json`
  - `src/data/lines/identity-outlaw.json`
  - `src/data/lines/sect-beggars.json`
  - `src/data/lines/sect-border.json`
  - `src/data/lines/sect-marginal.json`
  - `src/data/lines/sect-shaolin.json`
  - `src/data/lines/sect-wudang.json`
- Modify: affected event and Headless tests.

**Interfaces:**
- Produces:
  ```ts
  { type: 'affiliation_set'; value: AffiliationId }
  { type: 'affiliation_clear' }
  ```

- [ ] **Step 1: Add handlers**

`affiliation_set` replaces `state.player.affiliation`.

`affiliation_clear` sets it to `null`.

Both operations are deterministic and idempotent.

They must not mutate:

```text
sect_faction
lifePath.faction
route flags
title
```

- [ ] **Step 2: Initialize and copy Affiliation**

New game:

```ts
affiliation: null
```

`applyGameState` copies `affiliation` exactly.

No `sect` fallback is allowed.

- [ ] **Step 3: Migrate join producers**

Replace each:

```json
{ "type": "flag_set", "target": "current_sect", "value": "..." }
```

with:

```json
{ "type": "affiliation_set", "value": "..." }
```

Preserve existing route, faction, rank, trial, cooldown, and event-record effects.

- [ ] **Step 4: Migrate leave producers**

Replace each:

```json
{ "type": "flag_unset", "target": "current_sect" }
```

with:

```json
{ "type": "affiliation_clear" }
```

- [ ] **Step 5: Migrate conditions**

Replace checks such as:

```text
flags.has("current_sect")
```

with exact player Affiliation checks:

```text
player.affiliation != null
player.affiliation == "shaolin"
```

Do not infer membership from route flags.

- [ ] **Step 6: Add behavior tests**

Cover:

```text
join each of five affiliations
repeat same set is idempotent
switch replaces current affiliation
clear from set state
clear from null state
Snapshot round-trip
Local/Headless parity
route and sect_faction flags remain explicit and unchanged
```

- [ ] **Step 7: Run focused verification**

Run:

```bash
npm exec -- tsx tests/canonicalIdentityAffiliationClosure.test.ts
npm run test:headless
npm run test:headless:parity
npm run test:contracts
```

---

### Task 5: Migrate API and player-facing presentation

**Files:**
- Modify: `src/contracts/sessionProgression.ts`
- Modify: `server/src/services/sessionProgressionMapper.ts`
- Modify: `src/components/mainScreenModel.ts`
- Modify: `src/components/MainScreenLifeSummary.vue`
- Modify: `src/components/AttributePanel.vue`
- Modify: `src/components/EndingScreen.vue`
- Modify: `src/components/GameScreen.vue`
- Modify: `src/App.vue`
- Modify: affected component and contract tests.

**Interfaces:**
- PlayerSummaryDto produces:
  ```ts
  affiliation: AffiliationId | null;
  title: string | null;
  ```

- [ ] **Step 1: Update API DTO and mapper**

Remove `sect`. Add required nullable `affiliation` and `title`.

Map exact runtime values; do not derive from flags or ending.

- [ ] **Step 2: Replace main-screen identity summary**

Rename model and component prop:

```text
identitySummary → affiliationSummary
```

Rename label:

```text
身份 → 所属
```

Value:

```text
catalog display name
or 无固定所属
```

Do not add a replacement generic role list.

- [ ] **Step 3: Replace stage tags**

Use Affiliation display name and explicit Title if present. Keep route/tendency presentation in its existing separate surface.

- [ ] **Step 4: Remove AttributePanel identity heuristic**

Delete `playerIdentities`, `identityNameMap`, and code that groups:

```text
route
marriage
parenthood
retirement
sect leadership
```

under “身份”.

Render Affiliation and Title separately. Existing route and status feedback may remain in their own sections.

- [ ] **Step 5: Correct EndingScreen ownership**

Use:

```text
endingInfo.name → ending heading, epitaph, share summary
player.title    → optional explicit title line only
player.affiliation → optional affiliation line only
```

Delete:

```text
身份摘要
暂无身份
lifeMemory.identity
```

- [ ] **Step 6: Remove API title synthesis**

In `App.vue`, stop assigning:

```ts
title: terminal.ending?.name
```

Pass the actual DTO title and Affiliation.

- [ ] **Step 7: Update tests**

Cover Local and API with:

1. no Affiliation and no Title;
2. `wudang` Affiliation and no Title;
3. `wudang` plus explicit `武当长老`;
4. ending `martial_god` with `title = null`;
5. ending name differs from explicit Title.

- [ ] **Step 8: Run presentation tests**

Run:

```bash
npm exec -- tsx tests/playerRolePresentation.test.ts
npm exec -- tsx tests/mainScreenModel.test.ts
npm run typecheck
npm run build
```

---

### Task 6: Remove residual production sources and close the stage

**Files:**
- Modify: remaining affected production tests and fixtures.
- Modify: `docs/governance/product-decisions.md`
- Modify: `docs/governance/current-product-stage.md`
- Create: `docs/test-reports/canonical-identity-affiliation-closure.md`

**Interfaces:**
- Produces: final evidence that no forbidden production source remains.

- [ ] **Step 1: Run scoped residual scans**

Production and current contracts must have zero active matches for:

```bash
rg -n "IdentitySystem|IdentityInfo|PlayerIdentity|state\.identity|player\.sect|current_sect|primaryIdentity"   src/core src/components src/contracts src/types server/src src/data/lines tests/contracts tests/headless
```

Allowed matches must be limited to:

- migration test names or rejection fixtures;
- narrative filenames, categories, tags, and historical analysis taxonomy;
- the closure report explaining removed fields.

Review every match manually; do not perform blind global replacement.

- [ ] **Step 2: Run the complete command set**

```bash
npm exec -- tsx tests/canonicalIdentityAffiliationClosure.test.ts
npm exec -- tsx tests/playerRolePresentation.test.ts
npm run typecheck
npm run typecheck:p6b
npm run build
npm test
npm run test:contracts
npm run test:headless
npm run test:headless:parity
npm run test:sample-lines-routes
npm run validate:event-quality
npm run gate:playability
npm run gate:p11-scheduling
git diff --check
```

Confirm P8 remains PASS with no new blocker and P11 remains PASS.

- [ ] **Step 3: Perform Browser acceptance**

Use at least:

```text
one unaffiliated path
one formal Affiliation path
one terminal path
```

Verify:

- main screen says “所属”, never “暂无身份”;
- Affiliation display uses catalog name;
- explicit Title is separate;
- ending name is not persisted or displayed as Title;
- Local and API display the same values;
- save, refresh, and load preserve Affiliation and Title;
- Console has no application errors;
- desktop and 390px have no horizontal overflow.

- [ ] **Step 4: Write the closure report**

Include:

```text
identity gate migration matrix
Affiliation producer/consumer matrix
Snapshot and Life Memory version evidence
Local/API/Headless parity
Browser screenshots or recorded DOM assertions
all commands and exit codes
dirty worktree preservation
```

- [ ] **Step 5: Update governance status**

After all completion criteria pass:

- update PD-020 to Snapshot `3.13.0`;
- mark PD-041 implemented;
- mark the current stage complete;
- stop without entering late-life actions or long-term echo work.
