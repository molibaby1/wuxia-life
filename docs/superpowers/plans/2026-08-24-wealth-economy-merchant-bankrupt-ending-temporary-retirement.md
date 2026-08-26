# Merchant Bankrupt Ending Temporary Retirement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the invalid legacy-wallet-driven merchant bankruptcy ending from the active event pool without inventing replacement bankruptcy semantics, while preserving all successful merchant endings and existing Wealth/Asset contracts.

**Architecture:** This is a configuration/catalog retirement using the repository's existing event-removal pattern: delete `merchant_ending_bankrupt` from `merchant.json`, synchronize the generated event-asset manifest, and add a focused real-gate regression suite proving the event no longer exists or competes with Tycoon. No runtime primitive, scheduler change, new failure state, Wealth rule, Asset, or Snapshot migration is required.

**Tech Stack:** TypeScript, JSON event authoring, Node `assert`, existing `EventLoader`, `GameEngineIntegration`, event-asset inventory generator, real test gate.

**Spec:** `docs/product/wealth-economy-merchant-bankrupt-ending-temporary-retirement-design.md`

## Global Constraints

- Scope is only temporary retirement of `merchant_ending_bankrupt` plus directly required active-catalog manifest/test/gate/docs synchronization.
- Do not add a replacement bankruptcy condition, flag, fact, event, Wealth rule, or Asset rule.
- `money <= 50`, `no_surplus`, `merchant_shop_failed`, and loss of `merchant_shop` ownership must not be reinterpreted as bankruptcy.
- Do not modify `merchant_ending_tycoon`, `merchant_ending_royal`, `merchant_ending_chamber`, or `merchant_ending_hidden_wealth` production definitions.
- Do not modify formal-event scheduler selection, ending precedence, event priority, or weight semantics.
- Snapshot remains exactly `3.15.0`.
- `merchant_shop` remains the only formal `AssetId`.
- Do not migrate identity-merchant, P26/P42, origin money, P17, global money, Auto Evolution, B0, P8, or unrelated broad failures.
- Preserve unrelated dirty work; do not reset/clean/stash/overwrite it.
- Default `commits = 0`; do not create a commit unless Human explicitly requests one after delivery.

---

## File Map

**Create**
- `tests/merchantBankruptEndingTemporaryRetirement.test.ts` — focused catalog/manifest/runtime regression for the retired ending.
- `docs/product/wealth-economy-merchant-bankrupt-ending-temporary-retirement-design.md` — accepted product design copied from the provided artifact if not already present.

**Modify**
- `src/data/lines/merchant.json` — delete only `merchant_ending_bankrupt`.
- `src/data/event-asset-manifest.json` — generated inventory synchronization after event removal.
- `artifacts/reports/product-experience-governance-event-asset-audit.md` — generated inventory report synchronization if the repository generator updates this tracked artifact.
- `tests/runRealTestGate.ts` — register `merchantBankruptEndingTemporaryRetirement`.
- `docs/product/wealth-economy-product-contract-design.md` — Part B implementation/deferred inventory only.
- `docs/governance/product-decisions.md` — add PD-072.
- `docs/README.md` — index the retirement design as delivered.

**Inspect only unless an exact regression proves synchronization is required**
- `tests/merchantLateEconomicProgressionLegacyMoneyMigration.test.ts`
- `tests/merchantOfficialIntelligenceChamberLegacyMoneyMigration.test.ts`
- `tests/merchantMarketMonopolyLegacyMoneyMigration.test.ts`
- `tests/merchantCaravanLegacyMoneyMigration.test.ts`
- `tests/merchantShopLegacyMoneyMigration.test.ts`
- `src/core/EventLoader.ts`
- `src/core/GameEngineIntegration.ts`

Do not edit the runtime loader or scheduler merely to retire one event.

---

### Task 1: RED — Freeze Temporary Retirement Semantics

**Files:**
- Create: `tests/merchantBankruptEndingTemporaryRetirement.test.ts`
- Inspect: `src/data/lines/merchant.json`
- Inspect: `src/data/event-asset-manifest.json`

**Interfaces:**
- Consumes: `EventLoader.getInstance().getEventById(id)`, `GameEngineIntegration.getAvailableEvents(age)`, `GameEngineIntegration.getGameState()`.
- Produces: focused assertions that define retirement as catalog absence, manifest absence, and no ending competition.

- [ ] **Step 1: Create focused helpers and baseline state setup**

Write the test with exact imports and helpers:

```ts
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { EventLoader } from '../src/core/EventLoader';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';

function startState(name: string) {
  const engine = new GameEngineIntegration();
  engine.startNewGame(name, 'male');
  const state = engine.getGameState();
  state.player.traits = [];
  return { engine, state };
}

function availableIds(engine: GameEngineIntegration, age: number): Set<string> {
  return new Set(engine.getAvailableEvents(age).map(event => event.id));
}
```

- [ ] **Step 2: Assert the bankrupt event is absent from the active catalog**

Add:

```ts
function testBankruptEventRetiredFromCatalog(): void {
  assert.equal(
    EventLoader.getInstance().getEventById('merchant_ending_bankrupt'),
    undefined,
    'retired bankruptcy ending must not exist in the active EventLoader catalog',
  );

  for (const id of [
    'merchant_ending_tycoon',
    'merchant_ending_royal',
    'merchant_ending_chamber',
    'merchant_ending_hidden_wealth',
  ]) {
    assert(EventLoader.getInstance().getEventById(id), `${id} must remain active`);
  }
}
```

- [ ] **Step 3: Assert the event-asset manifest no longer inventories the retired event**

Add:

```ts
function testBankruptEventRemovedFromManifest(): void {
  const manifest = JSON.parse(
    fs.readFileSync(path.resolve('src/data/event-asset-manifest.json'), 'utf8'),
  ) as {
    summary: { totalEventsInRuntime: number };
    events: Array<{ eventId: string; sourceFile: string; runtimeLoaded: boolean }>;
  };

  assert.equal(
    manifest.events.some(event => event.eventId === 'merchant_ending_bankrupt'),
    false,
    'retired bankruptcy ending must leave the event-asset manifest',
  );
}
```

Do not hard-code the global runtime-event count in the regression test; catalog growth elsewhere is unrelated to this product contract.

- [ ] **Step 4: Add low-wallet false-positive regression**

Add:

```ts
function testLowWalletAloneCannotProduceBankruptcyEnding(): void {
  const { engine, state } = startState('Merchant Bankruptcy Retirement Low Wallet');
  state.player.age = 65;
  state.player.money = 0;
  state.flags.merchant_talent = true;
  state.player.flags.merchant_talent = true;

  const ids = availableIds(engine, 65);
  assert.equal(ids.has('merchant_ending_bankrupt'), false);
}
```

- [ ] **Step 5: Add Tycoon coexistence regression at `money = 0`**

Add:

```ts
function testTycoonRemainsEligibleWithoutBankruptCompetition(): void {
  const { engine, state } = startState('Merchant Bankruptcy Retirement Tycoon');
  state.player.age = 70;
  state.player.money = 0;
  state.player.wealthCapacity = 'regional_magnate';
  state.flags.merchant_talent = true;
  state.player.flags.merchant_talent = true;
  state.flags.merchant_empire = true;
  state.player.flags.merchant_empire = true;

  const ids = availableIds(engine, 70);
  assert.equal(ids.has('merchant_ending_tycoon'), true);
  assert.equal(ids.has('merchant_ending_bankrupt'), false);
}
```

This test proves the retirement removes the known false-positive competitor without changing Tycoon eligibility.

- [ ] **Step 6: Add the test runner**

```ts
function run(): void {
  testBankruptEventRetiredFromCatalog();
  testBankruptEventRemovedFromManifest();
  testLowWalletAloneCannotProduceBankruptcyEnding();
  testTycoonRemainsEligibleWithoutBankruptCompetition();
  console.log('merchantBankruptEndingTemporaryRetirement.test.ts: ok');
}

run();
```

- [ ] **Step 7: Run the focused suite and verify RED**

Run:

```bash
npm exec tsx tests/merchantBankruptEndingTemporaryRetirement.test.ts
```

Expected: **FAIL** because `merchant_ending_bankrupt` still exists in `EventLoader`, still exists in the manifest, and can appear for low-wallet merchant states.

Do not weaken the test by adding an impossible replacement condition.

---

### Task 2: Remove the Invalid Ending from the Active Catalog

**Files:**
- Modify: `src/data/lines/merchant.json`
- Test: `tests/merchantBankruptEndingTemporaryRetirement.test.ts`

**Interfaces:**
- Consumes: current static EventLoader import of `src/data/lines/merchant.json`.
- Produces: no active `merchant_ending_bankrupt` event definition; all other merchant endings unchanged.

- [ ] **Step 1: Delete only the `merchant_ending_bankrupt` event object**

In `src/data/lines/merchant.json`, remove the complete object whose ID is:

```json
"id": "merchant_ending_bankrupt"
```

Delete its age range, trigger, condition, copy, ending metadata, and `ending_merchant_bankrupt` effect together with the event object.

Do not edit adjacent Tycoon/Royal/Chamber/Hidden-Wealth event definitions.

- [ ] **Step 2: Verify the JSON remains valid and the loader no longer exposes the event**

Run:

```bash
node -e "const fs=require('fs'); JSON.parse(fs.readFileSync('src/data/lines/merchant.json','utf8')); console.log('merchant.json: valid')"
npm exec tsx -e "import { EventLoader } from './src/core/EventLoader.ts'; console.log(EventLoader.getInstance().getEventById('merchant_ending_bankrupt'))"
```

Expected:

```text
merchant.json: valid
undefined
```

- [ ] **Step 3: Run the focused suite and confirm the remaining RED is manifest synchronization**

Run:

```bash
npm exec tsx tests/merchantBankruptEndingTemporaryRetirement.test.ts
```

Expected: **FAIL** only because `src/data/event-asset-manifest.json` still contains the retired event.

If the test fails because Tycoon or another successful ending disappeared, stop and repair the catalog edit before continuing.

---

### Task 3: Synchronize Event-Asset Inventory

**Files:**
- Modify: `src/data/event-asset-manifest.json`
- Modify if generated/tracked: `artifacts/reports/product-experience-governance-event-asset-audit.md`
- Test: `tests/merchantBankruptEndingTemporaryRetirement.test.ts`

**Interfaces:**
- Consumes: repository command `npm run report:event-asset-inventory` (`scripts/inventoryEventAssets.ts`).
- Produces: generated catalog inventory that no longer lists `merchant_ending_bankrupt`.

- [ ] **Step 1: Run the canonical inventory generator**

Run:

```bash
npm run report:event-asset-inventory
```

The generator writes:

```text
src/data/event-asset-manifest.json
artifacts/reports/product-experience-governance-event-asset-audit.md
```

Expected semantic delta:

- `merchant_ending_bankrupt` disappears from manifest events;
- `merchant.json` event count decreases by one;
- runtime event total decreases by one relative to the pre-task baseline;
- deferred runtime-event count decreases by one relative to the pre-task baseline;
- merchant golden-line overlap count remains unchanged.

Do not treat a changed generation timestamp as a gameplay change.

- [ ] **Step 2: Inspect generated diffs for scope**

Run:

```bash
git diff -- src/data/event-asset-manifest.json artifacts/reports/product-experience-governance-event-asset-audit.md
```

Expected: inventory/report changes attributable only to regenerating after removal of one age-65–75 merchant event, plus generation timestamp changes.

If unrelated event inventory changes appear, stop and report the baseline drift rather than silently staging broad generated churn.

- [ ] **Step 3: Run the focused suite and verify GREEN**

Run:

```bash
npm exec tsx tests/merchantBankruptEndingTemporaryRetirement.test.ts
```

Expected: **PASS**.

---

### Task 4: Register the Real Gate and Prove No Replacement Semantics Were Added

**Files:**
- Modify: `tests/runRealTestGate.ts`
- Test: `tests/merchantBankruptEndingTemporaryRetirement.test.ts`
- Inspect: `src/types/wealthCapacity.ts`
- Inspect: `src/types/assetTypes.ts` or current canonical AssetId source

**Interfaces:**
- Consumes: existing real-gate registration array.
- Produces: registered suite name `merchantBankruptEndingTemporaryRetirement`.

- [ ] **Step 1: Register the focused suite**

Add exactly one entry beside the existing merchant migration suites:

```ts
{ name: 'merchantBankruptEndingTemporaryRetirement', entry: 'tests/merchantBankruptEndingTemporaryRetirement.test.ts' },
```

Do not reorder unrelated gates.

- [ ] **Step 2: Add explicit no-replacement assertions to the focused test**

Read the active merchant source as text and assert the retired ending/flag is not silently replaced by a new bankruptcy label:

```ts
function testNoReplacementBankruptcyStateIntroduced(): void {
  const merchantSource = fs.readFileSync(path.resolve('src/data/lines/merchant.json'), 'utf8');
  assert.equal(merchantSource.includes('merchant_ending_bankrupt'), false);
  assert.equal(merchantSource.includes('ending_merchant_bankrupt'), false);
  assert.equal(merchantSource.includes('merchant_business_collapsed'), false);
  assert.equal(merchantSource.includes('merchant_bankrupt'), false);
}
```

Call it from `run()`.

This is intentionally narrow to the touched merchant source; do not assert that the historical word `bankrupt` disappears from docs/governance.

- [ ] **Step 3: Verify the focused suite and neighboring merchant/Wealth suites**

Run:

```bash
npm exec tsx tests/merchantBankruptEndingTemporaryRetirement.test.ts
npm exec tsx tests/merchantLateEconomicProgressionLegacyMoneyMigration.test.ts
npm exec tsx tests/merchantOfficialIntelligenceChamberLegacyMoneyMigration.test.ts
npm exec tsx tests/merchantMarketMonopolyLegacyMoneyMigration.test.ts
npm exec tsx tests/merchantCaravanLegacyMoneyMigration.test.ts
npm exec tsx tests/merchantShopLegacyMoneyMigration.test.ts
npm exec tsx tests/wealthCapacityEventSemantics.test.ts
npm exec tsx tests/merchantShopAssetVertical.test.ts
```

Expected: all **PASS**.

Do not modify neighboring production semantics to satisfy this task.

---

### Task 5: Synchronize Product Authority and Delivery Inventory

**Files:**
- Create or update: `docs/product/wealth-economy-merchant-bankrupt-ending-temporary-retirement-design.md`
- Modify: `docs/product/wealth-economy-product-contract-design.md`
- Modify: `docs/governance/product-decisions.md`
- Modify: `docs/README.md`

**Interfaces:**
- Consumes: Human-accepted retirement design and delivered implementation facts from Tasks 1–4.
- Produces: PD-072 and Part B inventory that distinguish temporary retirement from a bankruptcy model.

- [ ] **Step 1: Land the accepted Formal Design**

Copy the supplied design artifact to:

```text
docs/product/wealth-economy-merchant-bankrupt-ending-temporary-retirement-design.md
```

After implementation verification, set its status to implementation delivered without changing the accepted semantics.

- [ ] **Step 2: Add PD-072**

Append a decision using the existing PD format:

```markdown
### PD-072：Merchant bankrupt ending temporarily retired pending real failure semantics

**实施决策（Human accepted：2026-08-24）**

- `merchant_ending_bankrupt` is removed from the active event catalog because legacy `money <= 50` is no longer valid bankruptcy evidence after the merchant Wealth migration.
- No replacement Wealth condition, bankruptcy flag/fact, Asset rule, or ending precedence rule is introduced in this slice.
- `no_surplus`, `merchant_shop_failed`, and loss of `merchant_shop` ownership are explicitly not redefined as bankruptcy.
- Tycoon/Royal/Chamber/Hidden-Wealth endings and the formal-event scheduler remain unchanged.
- Bankruptcy may return only after concrete persistent business-failure gameplay and its ending interaction are Human-approved.

**重新讨论条件**

- 需要设计并实现 late-game business collapse / insolvency gameplay；
- 需要重新引入 Merchant bankruptcy ending；
- 需要修改 merchant ending arbitration/precedence；
- 需要引入新的 persistent failure state、Asset semantics 或 Wealth post-failure transition。
```

Do not rewrite PD-064–071 history.

- [ ] **Step 3: Update Product Contract Part B only**

Update the implementation/deferred inventory so it states:

```text
merchant_ending_bankrupt
→ temporarily retired from active catalog
→ legacy money <= 50 consumer removed
→ no replacement bankruptcy semantics yet
```

Keep Part A unchanged, especially the existing rule that `no_surplus` does not mean bankruptcy.

Where the late-economy inventory currently says Bankruptcy remains deferred, replace only the stale implementation-status wording with the more exact state:

```text
temporary retirement delivered; future business-failure semantics remain deferred
```

Do not claim bankruptcy is solved or modeled.

- [ ] **Step 4: Update README index**

Add the new design to the current Wealth/Economy product-design index using the same style as the prior merchant migration designs and mark it delivered only after focused verification is green.

- [ ] **Step 5: Review authority consistency**

Run:

```bash
grep -n "merchant_ending_bankrupt\|PD-072\|bankrupt" \
  docs/product/wealth-economy-product-contract-design.md \
  docs/governance/product-decisions.md \
  docs/product/wealth-economy-merchant-bankrupt-ending-temporary-retirement-design.md \
  docs/README.md
```

Confirm there is no statement that:

- `no_surplus` equals bankruptcy;
- a replacement bankruptcy flag now exists;
- the global ending scheduler was changed;
- bankruptcy semantics are fully implemented.

---

### Task 6: Closure Verification and Scope Attribution

**Files:**
- Verify all files from Tasks 1–5.
- Do not create a commit.

**Interfaces:**
- Consumes: delivered retirement implementation and registered focused suite.
- Produces: closure evidence for Human review.

- [ ] **Step 1: Run focused merchant/Wealth regression suites**

Run:

```bash
npm exec tsx tests/merchantBankruptEndingTemporaryRetirement.test.ts
npm exec tsx tests/merchantLateEconomicProgressionLegacyMoneyMigration.test.ts
npm exec tsx tests/merchantOfficialIntelligenceChamberLegacyMoneyMigration.test.ts
npm exec tsx tests/merchantMarketMonopolyLegacyMoneyMigration.test.ts
npm exec tsx tests/merchantCaravanLegacyMoneyMigration.test.ts
npm exec tsx tests/merchantShopLegacyMoneyMigration.test.ts
npm exec tsx tests/wealthCapacityEventSemantics.test.ts
npm exec tsx tests/wealthMerchantVerticalSlice.test.ts
npm exec tsx tests/merchantShopAssetVertical.test.ts
npm exec tsx tests/AllTests.ts
```

Expected: all scope-local/canonical suites **PASS**.

- [ ] **Step 2: Run repository contract/build gates**

Run:

```bash
npm run typecheck
npm run test:contracts
npm run test:headless
npm run test:headless:parity
npm run build
git diff --check
```

Expected: **PASS** for scope-local required checks.

- [ ] **Step 3: Run event-quality validation**

Run:

```bash
npm run validate:event-quality
```

If the command still exits non-zero because of known broad blockers, report the counts and explicitly verify there is no new issue attributable to removal of `merchant_ending_bankrupt`.

Do not repair unrelated event-quality debt.

- [ ] **Step 4: Run the full real gate**

Run:

```bash
npm test
```

From the real-gate output, explicitly report PASS/FAIL for at least:

```text
merchantBankruptEndingTemporaryRetirement
merchantLateEconomicProgressionLegacyMoneyMigration
merchantOfficialIntelligenceChamberLegacyMoneyMigration
merchantMarketMonopolyLegacyMoneyMigration
merchantCaravanLegacyMoneyMigration
merchantShopLegacyMoneyMigration
wealthCapacityEventSemantics
merchantShopAssetVertical
```

If any scope-local suite fails, final result must be:

```text
MERCHANT_BANKRUPT_ENDING_TEMPORARY_RETIREMENT_REGRESSION_REMAINS
```

If scope-local suites pass and `npm test` fails only on established broad/source-freeze/B0/P9/P11/P40/etc. failures, report those failures without expanding this task.

- [ ] **Step 5: Inspect exact mutation boundary**

Run:

```bash
git status --short
git diff --stat
git diff -- src/data/lines/merchant.json \
  src/data/event-asset-manifest.json \
  artifacts/reports/product-experience-governance-event-asset-audit.md \
  tests/merchantBankruptEndingTemporaryRetirement.test.ts \
  tests/runRealTestGate.ts \
  docs/product/wealth-economy-merchant-bankrupt-ending-temporary-retirement-design.md \
  docs/product/wealth-economy-product-contract-design.md \
  docs/governance/product-decisions.md \
  docs/README.md
```

Confirm no changes to:

```text
merchant_ending_tycoon production semantics
merchant_ending_royal
merchant_ending_chamber
merchant_ending_hidden_wealth
EventLoader runtime logic
GameEngineIntegration scheduler logic
Wealth enum/runtime handlers
AssetId/schema
Snapshot
identity-merchant
P26/P42
Auto Evolution / B0 / P8
```

- [ ] **Step 6: Final report**

Use exactly this structure:

```text
## 1. Result
MERCHANT_BANKRUPT_ENDING_TEMPORARY_RETIREMENT_DELIVERED
or
MERCHANT_BANKRUPT_ENDING_TEMPORARY_RETIREMENT_REGRESSION_REMAINS

## 2. Changed files
implementation/catalog
manifest/generated inventory
tests/gate
docs/governance

## 3. Retirement semantics
merchant_ending_bankrupt active catalog = absent
legacy money <= 50 bankruptcy gate = retired
replacement bankruptcy state = none

## 4. Runtime proof
merchant_talent + money 0 → no bankrupt ending
merchant_empire + regional_magnate + money 0 → tycoon eligible, bankrupt absent

## 5. Verification
focused suites
AllTests
typecheck
contracts
headless/parity
build
event-quality
npm test

## 6. Broad failures
scope-local vs out-of-scope attribution

## 7. Mutation boundary
scheduler mutation = 0
Wealth mutation = 0
Asset mutation = 0
Snapshot = 3.15.0
new bankruptcy flag/fact = 0
business-failure gameplay = 0
unrelated dirty work preserved = yes
commits = 0

## 8. Deviations
None
```

Do not create a commit after reporting delivery. Human review is the next gate.
