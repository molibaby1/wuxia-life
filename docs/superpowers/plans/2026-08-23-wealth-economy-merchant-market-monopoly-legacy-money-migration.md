# Merchant Market Monopoly Legacy Money Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retire legacy `money +80/+40` from `merchant_market_monopoly`, migrate monopoly path to `wealth_capacity_raise_to: wealthy`, keep fair path Wealth-neutral, and preserve downstream flag-based continuity.

**Architecture:** Reuse existing `wealth_capacity_raise_to` and `stat_modify` primitives only. Modify only the two market choices in `merchant.json`. Prove authoring + runtime + downstream continuity with one new focused test, then synchronize predecessor migration guards, real gate, PD-069, and Contract Part B.

**Tech Stack:** TypeScript, JSON-authored events, Node `assert`, existing EventLoader / ConditionEvaluator / GameEngineIntegration / Wealth Capacity infrastructure.

**Spec:** `docs/product/wealth-economy-merchant-market-monopoly-legacy-money-migration-design.md`

## Global Constraints

- Wealth Capacity remains categorical: `no_surplus`, `modest_savings`, `comfortable_means`, `wealthy`, `regional_magnate`.
- Reuse existing `wealth_capacity_raise_to`; do not add a new Wealth runtime primitive.
- `wealth_capacity_raise_to` remains monotonic and must never lower current Wealth Capacity.
- `monopoly_trade` raises to at least `wealthy`; `fair_competition` must not mutate Wealth Capacity.
- High legacy `money` must not substitute for accepted Wealth semantics on either choice.
- `merchant_shop` remains the only AssetId; no market-position Asset or schema.
- Snapshot remains exactly `3.15.0`; no persisted-field or save migration.
- Do not modify `merchant_official_connection`, `merchant_chamber_of_commerce`, endings, origin, `merchant_wealth_peak`, P17, or global money retirement.
- Do not modify Auto Evolution / B0 / P8.
- Existing unrelated dirty work must be preserved; do not reset/clean it.
- Do not create commits unless explicitly requested by the Human.

## Allowed

- `merchant_market_monopoly` two choices only
- focused migration test
- directly required existing focused-test synchronization
- real-gate registration
- PD-069
- Contract Part B
- README / design closure

## Forbidden

- downstream merchant money migration
- chamber threshold migration
- official bribe migration
- endings migration
- `wealth_peak` / `business_empire` / origin money migration
- Asset changes
- Snapshot change
- P17 change
- global money field retirement
- unrelated broad gate fixes
- Auto Evolution changes

---

## File Structure

**Create**
- `tests/merchantMarketMonopolyLegacyMoneyMigration.test.ts` — focused authoring + runtime + downstream-continuity proof for this slice.

**Modify**
- `src/data/lines/merchant.json` — migrate only `merchant_market_monopoly` choice effects/copy.
- `tests/merchantCaravanLegacyMoneyMigration.test.ts` — retire the predecessor guard that intentionally required market money effects to remain deferred.
- `tests/merchantShopLegacyMoneyMigration.test.ts` — retire the same deferred-market-money guard.
- `tests/runRealTestGate.ts` — register the new focused test.
- `docs/product/wealth-economy-product-contract-design.md` — update Part B implementation inventory after verification.
- `docs/governance/product-decisions.md` — add PD-069 only after implementation semantics are verified.
- `docs/README.md` — index the accepted/delivered market monopoly migration design.

**Inspect; modify only if direct exact-contract regression proves necessary**
- `tests/wealthMerchantVerticalSlice.test.ts`
- `tests/p95MerchantOperatingChainTests.ts`
- other merchant-focused tests that directly freeze the changed market choice authoring shape.

**Do not modify**
- Wealth runtime implementation (`src/types/wealthCapacity.ts`, `src/core/EventExecutor.ts`) unless a pre-existing bug in an already accepted primitive is independently demonstrated; this plan expects no runtime change.
- `merchant_official_connection`, `merchant_ending_hidden_wealth`, `merchant_chamber_of_commerce`, or any other downstream event JSON.
- Asset schema / ownership module.
- Snapshot / save schema.

---

### Task 1: RED — Freeze accepted event semantics

**Files:**
- Create: `tests/merchantMarketMonopolyLegacyMoneyMigration.test.ts`

**Interfaces:**
- Consumes existing `wealth_capacity_raise_to` effect.
- Consumes existing `stat_modify` reputation effects.
- Consumes existing `merchant_monopoly` / `merchant_fair_trade` flags.
- Produces a focused executable specification for Tasks 2–3.

- [ ] **Step 1: Add helpers**

Reuse the helper style from `tests/merchantCaravanLegacyMoneyMigration.test.ts`:

```ts
function getEvent(id: string): EventDefinition { ... }
function getChoice(event: EventDefinition, id: string): EventChoice { ... }
function hasMoneyEffect(choice: EventChoice): boolean { ... }
function hasAdditiveStatEffect(choice: EventChoice, stat: string, value: number): boolean { ... }
function baseState(): GameState { ... }
```

Use a real `GameEngineIntegration.startNewGame(...)` state, not a hand-invented partial state.

- [ ] **Step 2: Add RED authoring assertions — monopoly**

```ts
const market = getEvent('merchant_market_monopoly');
const monopoly = getChoice(market, 'monopoly_trade');

assert.equal(hasMoneyEffect(monopoly), false);
assert(
  monopoly.effects?.some(
    effect => effect.type === 'wealth_capacity_raise_to'
      && effect.minimum === 'wealthy',
  ),
);
assert(hasAdditiveStatEffect(monopoly, 'reputation', -10));
assert(
  monopoly.effects?.some(
    effect => effect.type === 'flag_set'
      && effect.flag === 'merchant_monopoly'
      && effect.value === true,
  ),
);
```

Copy guard:

```ts
assert.equal(monopoly.text.includes('金钱'), false);
assert.equal(monopoly.text.includes('+80'), false);
```

- [ ] **Step 3: Add RED authoring assertions — fair**

```ts
const fair = getChoice(market, 'fair_competition');

assert.equal(hasMoneyEffect(fair), false);
assert.equal(
  fair.effects?.some(effect => effect.type === 'wealth_capacity_raise_to'),
  false,
);
assert(hasAdditiveStatEffect(fair, 'reputation', 10));
assert(
  fair.effects?.some(
    effect => effect.type === 'flag_set'
      && effect.flag === 'merchant_fair_trade'
      && effect.value === true,
  ),
);
assert.equal(fair.text.includes('金钱'), false);
assert.equal(fair.text.includes('+40'), false);
```

- [ ] **Step 4: Run the new test and confirm RED for the intended reasons**

```bash
npm exec tsx tests/merchantMarketMonopolyLegacyMoneyMigration.test.ts
```

Expected before implementation: FAIL because `merchant_market_monopoly` still contains legacy money effects and wallet copy.

Do not change the test to match the old implementation.

---

### Task 2: Minimal `merchant.json` migration

**Files:**
- Modify: `src/data/lines/merchant.json`
- Test: `tests/merchantMarketMonopolyLegacyMoneyMigration.test.ts`

**Interfaces:**
- Consumes existing `wealth_capacity_raise_to`.
- Preserves event-level entry conditions unchanged.

- [ ] **Step 1: Migrate `monopoly_trade`**

Delete only:

```json
{"type": "stat_modify", "stat": "money", "value": 80}
```

Add:

```json
{"type": "wealth_capacity_raise_to", "minimum": "wealthy"}
```

Keep reputation penalty and monopoly flag. Because product intent is additive reputation change and `StatModifyHandler` defaults to `operator = 'set'`, add explicit additive authoring:

```json
{"type": "stat_modify", "stat": "reputation", "value": -10, "operator": "add"}
```

Update choice text to stop exposing wallet reward, e.g.:

```text
垄断经营（财力跃升，声望受损）
```

Do not edit event body narrative unless needed to remove an exact wallet promise in choice-adjacent copy.

- [ ] **Step 2: Migrate `fair_competition`**

Delete only:

```json
{"type": "stat_modify", "stat": "money", "value": 40}
```

Keep reputation gain and fair-trade flag. Add explicit additive authoring:

```json
{"type": "stat_modify", "stat": "reputation", "value": 10, "operator": "add"}
```

Do not add any Wealth transition.

Update choice text if needed so it no longer implies a cash reward, e.g.:

```text
公平竞争（保持财力，声望提升）
```

- [ ] **Step 3: Leave everything else in `merchant.json` untouched**

Confirm by diff that these remain unchanged:

- `merchant_market_monopoly` entry `conditions[]`
- `merchant_official_connection`
- `merchant_chamber_of_commerce`
- `merchant_ending_hidden_wealth`
- all other merchant events

- [ ] **Step 4: Run the focused authoring assertions**

```bash
npm exec tsx tests/merchantMarketMonopolyLegacyMoneyMigration.test.ts
```

Expected: authoring assertions pass; runtime assertions may still fail until Task 3.

---

### Task 3: Runtime proof

**Files:**
- Modify: `tests/merchantMarketMonopolyLegacyMoneyMigration.test.ts`

**Interfaces:**
- Consumes `GameEngineIntegration.executeChoiceEffects(...)`.
- Consumes monotonic `wealth_capacity_raise_to` runtime semantics.

- [ ] **Step 1: Monopoly runtime matrix**

Use sentinel `money = 37` and `traits = []` to reduce growth-multiplier noise where helpful.

Prove:

```text
comfortable_means + monopoly → wealthy
wealthy + monopoly             → wealthy
regional_magnate + monopoly    → regional_magnate
```

For each case also prove:

```text
money before === money after
merchant_monopoly flag set
reputation decreased additively
```

- [ ] **Step 2: Fair runtime proof**

From `comfortable_means`, execute `fair_competition` and prove:

```text
wealthCapacity remains comfortable_means
money before === money after
merchant_fair_trade flag set
reputation increased additively
```

- [ ] **Step 3: Run the focused test**

```bash
npm exec tsx tests/merchantMarketMonopolyLegacyMoneyMigration.test.ts
```

Expected: PASS for Tasks 1–3 assertions.

---

### Task 4: Downstream continuity

**Files:**
- Modify: `tests/merchantMarketMonopolyLegacyMoneyMigration.test.ts`
- Modify: `tests/merchantCaravanLegacyMoneyMigration.test.ts`
- Modify: `tests/merchantShopLegacyMoneyMigration.test.ts`

**Interfaces:**
- Consumes `ConditionEvaluator` against real downstream event conditions.
- Does not migrate downstream money requirements.

- [ ] **Step 1: Prove official-connection continuity**

After executing monopoly choice in isolation, assert:

```ts
const official = getEvent('merchant_official_connection');
assert.equal(
  evaluator.evaluate(official.conditions![0], stateAfterMonopoly),
  true,
);
```

Repeat after fair choice with `merchant_fair_trade`.

Do not execute downstream bribe choices; only prove branch identity remains reachable.

- [ ] **Step 2: Prove hidden-wealth continuity**

After fair choice, set `chivalry >= 50` on the resulting state and assert:

```ts
const hiddenWealth = getEvent('merchant_ending_hidden_wealth');
assert.equal(
  evaluator.evaluate(hiddenWealth.conditions![0], stateAfterFair),
  true,
);
```

- [ ] **Step 3: Retire predecessor deferred-money guards**

`tests/merchantCaravanLegacyMoneyMigration.test.ts` and `tests/merchantShopLegacyMoneyMigration.test.ts` currently assert that market choices still contain money effects as intentional deferred debt. Replace that guard with the delivered boundary, e.g.:

```ts
const market = getEvent('merchant_market_monopoly');
for (const choice of market.choices ?? []) {
  assert.equal(hasMoneyEffect(choice), false);
}
```

Make only the minimum synchronization required by direct exact-contract regression elsewhere.

- [ ] **Step 4: Run adjacent focused suites**

```bash
npm exec tsx tests/merchantMarketMonopolyLegacyMoneyMigration.test.ts
npm exec tsx tests/merchantCaravanLegacyMoneyMigration.test.ts
npm exec tsx tests/merchantShopLegacyMoneyMigration.test.ts
```

Expected: PASS.

---

### Task 5: Real gate + governance sync

**Files:**
- Modify: `tests/runRealTestGate.ts`
- Modify: `docs/product/wealth-economy-product-contract-design.md`
- Modify: `docs/governance/product-decisions.md`
- Modify: `docs/README.md`
- Repository design location: `docs/product/wealth-economy-merchant-market-monopoly-legacy-money-migration-design.md`

**Interfaces:**
- Produces real-gate coverage for the market monopoly slice.
- Produces PD-069 after verified implementation.
- Updates Part B implementation reality without changing Product Contract Part A.

- [ ] **Step 1: Register the focused test**

Add adjacent to existing merchant migration suites:

```ts
{
  name: 'merchantMarketMonopolyLegacyMoneyMigration',
  entry: 'tests/merchantMarketMonopolyLegacyMoneyMigration.test.ts',
},
```

- [ ] **Step 2: Run the registered test directly once more**

```bash
npm exec tsx tests/merchantMarketMonopolyLegacyMoneyMigration.test.ts
```

Expected: PASS.

- [ ] **Step 3: Update Wealth Contract Part B only**

Record implementation facts equivalent to:

- `merchant_market_monopoly` no longer reads/writes exact `money` on either choice;
- `monopoly_trade` uses `wealth_capacity_raise_to wealthy`;
- `fair_competition` remains Wealth-neutral;
- `merchant_monopoly` / `merchant_fair_trade` remain route milestone flags;
- downstream official / hidden-wealth consumers remain flag-based;
- no second Asset, no Snapshot change.

Do not modify Part A accepted Product Contract semantics.

- [ ] **Step 4: Add PD-069**

Add a concise Product Decision recording the delivered implementation boundary. It must explicitly state:

> Market Monopoly legacy wallet rewards retired. Monopoly path now represents an economic identity transition to at least `wealthy`; fair path retains Wealth while gaining reputation and fair-trade identity. This does not introduce a new Asset or migrate downstream merchant wallet consumers.

- [ ] **Step 5: Update docs index**

Add the market monopoly migration design under accepted product contracts / current Wealth migration docs.

Update the caravan design README entry so it no longer claims market `money +80/+40` remain deferred debt.

- [ ] **Step 6: Run documentation diff check**

```bash
git diff --check
```

Expected: PASS.

---

### Task 6: Closure verification

**Files:**
- No new production scope beyond Task 2.
- Modify documentation only if fresh verification status requires factual correction.

- [ ] **Step 1: Run focused Wealth / merchant suites**

At minimum:

```bash
npm exec tsx tests/merchantMarketMonopolyLegacyMoneyMigration.test.ts
npm exec tsx tests/merchantCaravanLegacyMoneyMigration.test.ts
npm exec tsx tests/merchantShopLegacyMoneyMigration.test.ts
npm exec tsx tests/wealthCapacityEventSemantics.test.ts
npm exec tsx tests/wealthMerchantVerticalSlice.test.ts
npm exec tsx tests/merchantShopAssetVertical.test.ts
npm exec tsx tests/AllTests.ts
```

Expected: scope-local PASS.

- [ ] **Step 2: Run canonical gates**

```bash
npm run typecheck
npm run test:contracts
npm run test:headless
npm run test:headless:parity
npm run build
git diff --check
```

Expected: scope-local PASS. Record current AllTests count; do not hard-code a historical count in implementation logic.

- [ ] **Step 3: Run the real gate**

```bash
npm test
```

This command must actually be executed even if known broad baselines remain red.

From the log explicitly report the registered Wealth / Asset / Merchant Shop / Merchant Caravan / Merchant Market Monopoly suites. If those pass and final failure is only pre-existing / unrelated broad gates (B0 / P9 / P11 / P40 etc.), do not widen this task.

If a clean scope-local suite fails because of this slice, closure is blocked until that regression is fixed.

- [ ] **Step 4: Run final diff and scope searches**

```bash
rg -n 'monopoly_trade|fair_competition|"id": "merchant_market_monopoly"' src/data/lines/merchant.json
rg -n 'merchant_market_monopoly' tests docs
git status --short
git diff --name-only
```

Interpretation:

- `merchant_market_monopoly` choices must have no exact `money` effect.
- monopoly must contain `wealth_capacity_raise_to wealthy`.
- fair must contain no Wealth transition.
- no second AssetId or new persisted field may exist.
- unrelated dirty work must remain untouched.

---

## Acceptance Criteria

The slice may be reported as `MERCHANT_MARKET_MONOPOLY_LEGACY_MONEY_MIGRATION_DELIVERED` only when:

1. `monopoly_trade` contains no legacy `money` effect and raises Wealth to at least `wealthy`.
2. `fair_competition` contains no legacy `money` effect and does not mutate Wealth Capacity.
3. `comfortable_means + monopoly → wealthy`; `wealthy/regional_magnate + monopoly` do not downgrade.
4. `comfortable_means + fair → comfortable_means`.
5. Both choices leave legacy `money` unchanged at runtime.
6. `merchant_monopoly` / `merchant_fair_trade` flags and reputation effects remain correct.
7. `merchant_official_connection` and `merchant_ending_hidden_wealth` remain reachable through flags without the retired wallet padding.
8. Choice copy no longer exposes `金钱 +80/+40`.
9. No second Asset is added; `merchant_shop` remains the only AssetId.
10. Snapshot remains `3.15.0`; no save/schema migration occurs.
11. Focused tests and canonical compile/contract/headless/build checks pass.
12. `npm test` is actually run and scope-local registered suites pass.
13. No unrelated broad-gate repair or refactor is bundled.
14. Documentation / PD-069 reflect actual verified implementation, not intended future work.

## Final Report Format

### 1. Result

Return one of:

```text
MERCHANT_MARKET_MONOPOLY_LEGACY_MONEY_MIGRATION_DELIVERED
MERCHANT_MARKET_MONOPOLY_LEGACY_MONEY_MIGRATION_REGRESSION_REMAINS
```

### 2. Changed files

List exact implementation, tests/gate, and docs changes.

### 3. Market semantics

Report monopoly / fair path effects and copy.

### 4. Downstream continuity

Report official-connection and hidden-wealth reachability without retired wallet padding.

### 5. Verification

Report focused tests, typecheck, contracts, headless/parity, build, AllTests, real gate, and diff check.

### 6. Broad failures

If any broad gate remains red, separate exact scope-local failures from pre-existing / unrelated failures.

### 7. Mutation boundary

Confirm no Asset/Snapshot/global-money expansion and that unrelated dirty work was preserved.

### 8. Deviations

Write `None` if there are none.

---

## Plan Self-Review (completed at authoring time)

1. **No numeric `+80/+40 → wealthy` mapping** — monopoly uses event-level `wealth_capacity_raise_to: wealthy`, not wallet arithmetic conversion.
2. **Fair path Wealth-neutral** — fair choice explicitly forbids `wealth_capacity_raise_to`.
3. **No new Asset/schema** — only existing flags `merchant_monopoly` / `merchant_fair_trade`.
4. **No downstream money migration** — official/chamber/ending events remain out of scope.
5. **Runtime money immutability** — Task 3 requires `money before === money after` for both choices.
6. **No downgrade on `regional_magnate`** — runtime matrix explicitly covers `regional_magnate + monopoly → regional_magnate`.
7. **Correct stat operator** — migration adds explicit `"operator": "add"` for reputation; tests freeze additive semantics instead of default `set`.
8. **No TODO/TBD/placeholder** — plan uses concrete file paths and commands only.
9. **Referenced files/interfaces exist** — verified against current repository: `merchant.json`, `merchantCaravanLegacyMoneyMigration.test.ts`, `merchantShopLegacyMoneyMigration.test.ts`, `runRealTestGate.ts`, `wealth_capacity_raise_to`, downstream events `merchant_official_connection` and `merchant_ending_hidden_wealth`.
