# Merchant Late Economic Progression Legacy Money Migration Design

**Status:** Human accepted on 2026-08-23; implementation delivered on 2026-08-23
**Authority:** Wealth / Economy Product Contract v1 (PD-064), Wealth Capacity Core (PD-065), Minimal Asset Semantics (PD-066), Merchant Shop migration (PD-067), Merchant Caravan migration (PD-068), Merchant Market Monopoly migration (PD-069), Merchant Official–Intelligence–Chamber migration (PD-070)
**Scope:** `merchant_wealth_peak` → `merchant_sect_investment` → `merchant_business_empire` → `merchant_ending_tycoon` only

## 1. Problem

The canonical merchant economic spine is now wallet-neutral through Chamber leadership:

```text
merchant talent
→ merchant_shop Asset
→ caravan
→ market
→ official connection
→ intelligence network
→ chamber leadership
→ Wealth at least wealthy
```

The next four events still mix canonical Wealth Capacity with a legacy wallet chain:

```text
merchant_wealth_peak
  → wealth_capacity_set regional_magnate
  → money +200

merchant_sect_investment
  → heavy choice: money >=500
  → all choices write negative money values with default set semantics

merchant_business_empire
  → money set 150

merchant_ending_tycoon
  → merchant_empire && money >=500
```

Repository-grounded analysis established that this wallet chain is not self-consistent. `merchant_business_empire` sets money to 150, while `merchant_ending_tycoon` requires 500, so the canonical late-game spine cannot naturally close the tycoon ending. The same analysis also found that sect investment costs are authored as default `set` operations, so negative values clamp the wallet to zero rather than behaving as ordinary subtraction. The wallet is therefore no longer a reliable carrier for these late-game product semantics.

This slice migrates the late progression into explicit Wealth Capacity, route milestone flags, and additive non-economic stat effects. It intentionally does **not** solve bankruptcy semantics or global money retirement.

## 2. Accepted Product Semantics

### 2.1 `merchant_wealth_peak`

Legacy wallet effect to retire:

```text
money +200
```

Canonical outcome remains:

```text
wealth_capacity_set regional_magnate
merchant_wealthy = true
reputation +25 [additive]
charisma +10 [additive]
money unchanged
```

Product meaning:

> The event is the explicit Wealth identity transition from `wealthy` to `regional_magnate`. The legacy `money +200` is no longer needed once the downstream sect/empire/tycoon wallet chain is migrated.

Classification:

- `WEALTH_TRANSITION`
- legacy wallet continuity retired
- milestone flag retained

The existing `wealth_capacity_set regional_magnate` remains valid. At this point in the accepted merchant spine, Chamber leadership raises the player only to `wealthy`; there is no higher Wealth level above `regional_magnate`. Changing this effect to `raise_to` would add no current product capability, so this slice keeps the existing primitive.

The retained `reputation` and `charisma` effects must become explicit additive deltas. Their current default `set` authoring can erase accumulated player progression and interfere with other endings such as Royal Merchant.

### 2.2 `merchant_sect_investment`

All legacy wallet reads/writes in this event are retired.

The event continues to require:

```text
merchant_wealthy == true
```

No new event-level Wealth requirement is added.

#### Heavy righteous investment — first formal Wealth Major Commitment

Legacy semantics to retire:

```text
choice.conditions: money >=500
money set -500 → clamp 0
```

Canonical semantics:

```text
condition: wealth_capacity_at_least regional_magnate
wealth_capacity_set wealthy
chivalry +20 [additive]
reputation +30 [additive]
martialPower +10 [additive]
merchant_invest_good = true
money unchanged
```

Product classification:

- `WEALTH_REQUIREMENT`
- `MAJOR_COMMITMENT`
- `ALTERNATIVE_PATH`

Product meaning:

> The player deliberately commits enough strategic economic capacity to materially change their economic identity. A `regional_magnate` can choose to make this exceptional investment, after which the character remains wealthy but no longer has `regional_magnate`-level surplus capacity.

This is an intentional Wealth downgrade, not an accidental arithmetic consequence. It is therefore expressed with the already-existing `wealth_capacity_set wealthy`, not with `wealth_capacity_raise_to`.

The requirement must use the canonical singular choice field:

```text
choice.condition
```

not legacy `choice.conditions[]`.

The Heavy path must **not** be represented as `wealth_capacity_at_least wealthy`: every canonical player entering the sect stage has already passed Wealth Peak and therefore would satisfy that gate automatically. `regional_magnate` is the meaningful requirement because the choice spends one strategic Wealth tier.

#### Standard righteous investment

Canonical semantics:

```text
no Wealth requirement
Wealth unchanged
chivalry +10 [additive]
reputation +15 [additive]
merchant_invest_good = true
money unchanged
```

The investment is still an important route choice, but current repository evidence does not support an identity-level economic downgrade.

#### Evil investment

Canonical semantics:

```text
no Wealth requirement
Wealth unchanged
martialPower +15 [additive]
chivalry -10 [additive]
merchant_invest_evil = true
money unchanged
```

#### Invest in both sides

Canonical semantics:

```text
no Wealth requirement
Wealth unchanged
charisma +12 [additive]
merchant_invest_both = true
money unchanged
```

### 2.3 `merchant_business_empire`

Legacy wallet effect to retire:

```text
money set 150
```

Canonical outcome:

```text
wealth_capacity_raise_to regional_magnate
reputation +20 [additive]
charisma +10 [additive]
merchant_empire = true
money unchanged
```

Product classification:

- `ECONOMIC_DEVELOPMENT`
- Wealth restoration / re-establishment after a Major Commitment
- durable milestone flag retained

Product meaning:

> Establishing the commercial empire creates or restores `regional_magnate`-level strategic economic capacity.

For the Heavy sect route:

```text
regional_magnate
→ heavy Major Commitment
→ wealthy
→ business empire
→ regional_magnate
```

For the other sect routes:

```text
regional_magnate
→ standard investment
→ regional_magnate
→ business empire
→ regional_magnate (no-op)
```

The event does not introduce a sixth Wealth level. `regional_magnate` remains the top canonical Wealth Capacity.

`merchant_empire` remains a milestone flag, not a new Asset. Repository evidence does not show current ownership lifecycle, add/remove semantics, or future behavior that depends on owning a separate empire entity.

### 2.4 `merchant_ending_tycoon`

Legacy ending gate to retire:

```text
merchant_empire == true
AND money >=500
```

Canonical ending gate:

```text
merchant_empire == true
AND wealth_capacity_at_least regional_magnate
```

The two requirements must remain distinct:

- `merchant_empire` proves the durable commercial achievement;
- `regional_magnate` proves the player's current strategic economic identity.

Product meaning:

> The Tycoon ending requires both having built a commercial empire and still possessing top-tier strategic economic capacity.

This prevents Wealth Capacity from becoming a universal ending key. `regional_magnate` alone must **not** unlock the ending, because Wealth Peak already reaches that level before the commercial empire milestone exists.

The ending condition should use formal event conditions rather than embedding Wealth in an expression:

```text
conditions:
  - expression: merchant_empire == true
  - wealth_capacity_at_least regional_magnate
```

Legacy money must no longer affect Tycoon eligibility: a player with `money = 0` can qualify if both canonical conditions are true, while a player with very high legacy money but only `wealthy` must fail.

## 3. Wealth Major Commitment Boundary

This slice is the first accepted implementation of a Wealth Capacity **Major Commitment** that intentionally reduces Wealth.

The permitted pattern is narrow:

```text
regional_magnate
→ explicit high-impact economic choice
→ persistent route result
→ wealthy
```

It does **not** authorize generic Wealth spending, arbitrary `-1` tier arithmetic, or automatic costs.

A Wealth downgrade remains legal only when all of the following are true:

1. the event represents a strategic commitment large enough to change economic identity;
2. the downgrade is explicitly authored, not derived from ordinary spending;
3. the event yields a persistent gameplay result;
4. the product design specifically authorizes that transition.

For this slice, only `invest_righteous_heavy` meets that bar.

## 4. Route Continuity

### 4.1 Heavy investment route

```text
Chamber
→ wealthy
→ Wealth Peak
→ regional_magnate
→ heavy righteous investment
→ wealthy
→ merchant_invest_good
→ Business Empire
→ regional_magnate
→ merchant_empire
→ Tycoon eligibility
```

### 4.2 Standard sect routes

```text
Chamber
→ wealthy
→ Wealth Peak
→ regional_magnate
→ standard righteous / evil / both
→ regional_magnate remains
→ corresponding merchant_invest_* flag
→ Business Empire
→ regional_magnate remains
→ merchant_empire
→ Tycoon eligibility
```

The `merchant_invest_good`, `merchant_invest_evil`, and `merchant_invest_both` flags remain unchanged so the existing merchant-martial patron bridge and achievement/profile consumers continue to work.

## 5. Player-Facing Copy

Copy must stop presenting precise wallet requirements or costs for this slice.

### Wealth Peak

The event body may continue using narrative phrases such as “富可敌国” or “财富巅峰”. It must not promise a precise cash reward.

### Sect Heavy

The old choice text:

```text
巨额投资正道（需金钱≥500，侠义 +20）
```

must be replaced with copy that exposes the actual strategic trade-off without numeric wallet language. The text should communicate:

- this is an exceptional / heavy commitment;
- it consumes one tier of strategic Wealth Capacity;
- it provides the stronger righteous-route outcome.

A suitable direction is:

```text
倾力扶持正道（重大投入：财力降至豪富，侠义提升）
```

Exact wording may be adjusted to match existing game style, but it must not introduce an unimplemented investment system or numeric silver promise.

Standard sect choices may keep their current short route labels after money effects are removed because they already do not expose numeric wallet costs.

### Business Empire / Tycoon

Existing narrative copy may remain if it does not promise a numeric wallet balance. The Tycoon ending must not show a legacy `500` requirement.

## 6. Compatibility and Runtime Boundary

No new runtime primitive is required.

Existing mechanisms are sufficient:

- `wealth_capacity_set`
- `wealth_capacity_raise_to`
- `wealth_capacity_at_least`
- `stat_modify` with explicit `operator: add`
- route milestone flags
- event-level condition arrays
- singular `choice.condition`

No change is authorized to:

- Wealth enum;
- `PlayerState.wealthCapacity` schema;
- Asset schema;
- Snapshot version;
- save migration;
- `StatModifyHandler` defaults;
- global condition grammar.

Snapshot remains `3.15.0`.

## 7. Explicit Non-Goals

This slice does **not** migrate or decide:

- `merchant_ending_bankrupt`;
- bankruptcy product semantics;
- `merchant_ending_royal`;
- `merchant_ending_chamber`;
- `merchant_ending_hidden_wealth`;
- `identity-merchant.json` wallet semantics;
- P26/P42 businessHabit wallet producers;
- `origin_merchant_family money +200`;
- P17 `money + wealth`;
- global `money` retirement;
- second Asset;
- a commercial-empire Asset;
- a sixth Wealth Capacity level;
- a generic Wealth-spending framework;
- Auto Evolution, B0, P8, or broad baseline failures.

`merchant_ending_bankrupt` is explicitly deferred because `no_surplus` is not equivalent to bankruptcy. It requires a separate product model based on actual business failure evidence rather than a direct Wealth substitution.

## 8. Required Runtime Proof

Implementation must prove at minimum:

### Wealth Peak

```text
wealthy + peak
→ regional_magnate
→ money unchanged
→ reputation +25
→ charisma +10
→ merchant_wealthy
```

### Heavy sect investment

Eligibility:

```text
regional_magnate + money 0
→ available

wealthy + money 999
→ unavailable
```

Execution:

```text
regional_magnate
→ heavy
→ wealthy
→ money unchanged
→ additive chivalry/reputation/martialPower
→ merchant_invest_good
```

### Other sect investments

```text
regional_magnate
→ righteous / evil / both
→ regional_magnate remains
→ money unchanged
→ correct additive stats
→ correct merchant_invest_* flag
```

### Business Empire

Heavy route recovery:

```text
wealthy + merchant_invest_good
→ business empire
→ regional_magnate
```

Ordinary route no-op:

```text
regional_magnate + merchant_invest_evil/both/good
→ business empire
→ regional_magnate
```

Both must keep money unchanged and set `merchant_empire`.

### Tycoon ending

```text
merchant_empire + regional_magnate + money 0
→ eligible

merchant_empire + wealthy + money 999
→ not eligible

regional_magnate + no merchant_empire + money 999
→ not eligible
```

### End-to-end late spine

At least one real execution path must prove:

```text
wealthy + chamber_head
→ peak
→ regional_magnate
→ heavy investment
→ wealthy
→ empire
→ regional_magnate
→ tycoon eligibility
```

with a sentinel legacy money value unchanged through the entire migrated chain.

## 9. Governance Closure

After implementation and verification:

- add the focused migration suite to `tests/runRealTestGate.ts`;
- update Wealth / Economy Contract Part B implementation inventory only;
- add PD-071 recording this accepted late progression migration;
- index this design in `docs/README.md` as delivered;
- mark this design implementation delivered.

PD-071 must record that Heavy sect investment is the first explicitly authorized Wealth Major Commitment downgrade in the current product, but it must **not** generalize that into reusable Wealth-spending arithmetic.

## 10. Acceptance Criteria

The slice is complete only when all of the following are true:

1. `merchant_wealth_peak`, `merchant_sect_investment`, `merchant_business_empire`, and `merchant_ending_tycoon` no longer read/write legacy `money` within this slice.
2. Peak still sets `regional_magnate`, but no longer produces `money +200`.
3. Peak retained `reputation` / `charisma` deltas are explicit additive effects.
4. Heavy sect investment uses singular `condition: wealth_capacity_at_least regional_magnate`.
5. Heavy sect investment intentionally sets Wealth to `wealthy` and leaves money unchanged.
6. Standard righteous, evil, and both-side investments do not change Wealth and leave money unchanged.
7. All retained sect stat deltas are explicit additive effects.
8. Business Empire raises Wealth to at least `regional_magnate`, leaves money unchanged, and retains `merchant_empire`.
9. Business Empire retained stats are explicit additive effects.
10. Tycoon requires both `merchant_empire` and `wealth_capacity_at_least regional_magnate`, with no money condition.
11. Existing `merchant_invest_*` flags and downstream patron bridge consumers remain intact.
12. `merchant_ending_bankrupt` and all other explicit non-goals remain untouched.
13. AssetId remains only `merchant_shop`; Snapshot remains `3.15.0`.
14. Scope-local tests pass and the real gate shows no new scope-local regression.
