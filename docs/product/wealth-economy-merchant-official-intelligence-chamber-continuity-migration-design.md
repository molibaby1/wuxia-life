# Merchant Official–Intelligence–Chamber Continuity Migration Design

**Status:** Human accepted on 2026-08-23; implementation delivered on 2026-08-23
**Authority:** Wealth / Economy Product Contract v1 (PD-064), Wealth Capacity Core (PD-065), Minimal Asset Semantics (PD-066), Merchant Shop migration (PD-067), Merchant Caravan migration (PD-068), Merchant Market Monopoly migration (PD-069)
**Scope:** `merchant_official_connection` → `merchant_intelligence_network` → `merchant_chamber_of_commerce` only

## 1. Problem

The merchant progression above the market stage is split between two incompatible economic models.

The delivered path now uses canonical economic identity:

```text
merchant talent
→ Wealth >= modest_savings
→ merchant_shop Asset
→ caravan
→ Wealth >= comfortable_means
→ market
→ monopoly may raise Wealth to wealthy
```

But the next three events still use the legacy wallet:

```text
merchant_official_connection
  heavy_bribe: money >= 500; legacy money writes
  moderate_bribe: legacy money write

merchant_intelligence_network
  money set 60

merchant_chamber_of_commerce
  merchant_intelligence && money >= 300
  money set 50
```

Repository-grounded reachability analysis shows that this wallet chain is not self-consistent. `merchant_intelligence_network` resets the wallet to 60 under the legacy default `stat_modify` semantics, so the immediately following `money >= 300` chamber gate blocks the canonical main progression. The block predates the earlier wallet migrations; it is not a regression introduced by the Market Monopoly slice.

This slice closes the earliest structural discontinuity without migrating `merchant_wealth_peak`, sect investment, business empire, or merchant endings.

## 2. Accepted Product Semantics

### 2.1 Official Connection

`merchant_official_connection` continues to be entered through the existing route identity:

```text
merchant_monopoly == true OR merchant_fair_trade == true
```

The event does not gain a new event-level Wealth requirement.

#### Heavy Bribe

Legacy semantics to retire:

```text
choice.conditions: money >= 500
money -500
money +150
```

Canonical semantics:

```text
condition: wealth_capacity_at_least wealthy
reputation +25 [additive]
charisma +12 [additive]
merchant_official_friend = true
money unchanged
Wealth unchanged
```

Product classification:

- `WEALTH_REQUIREMENT`
- `ALTERNATIVE_PATH`
- **not** a Wealth decrement
- **not** a `MAJOR_COMMITMENT` transition in v1

The player is using already-established large-scale economic capacity to buy a stronger path into official privilege. This choice does not provide evidence that the character's long-term economic identity has fallen from `wealthy` to `comfortable_means`.

The heavy path is therefore available naturally to the monopoly path after Market Monopoly, while a fair-trade character who remains `comfortable_means` can still continue through the moderate path.

#### Moderate Bribe

Legacy semantics to retire:

```text
money -30
```

Canonical semantics:

```text
no Wealth requirement
reputation +15 [additive]
charisma +8 [additive]
merchant_official_friend = true
money unchanged
Wealth unchanged
```

The old small wallet cost is not promoted to a Wealth transition. It is narrative-scale expenditure and does not materially change future economic opportunity space.

#### Refuse Bribe

The route remains the non-economic refusal branch:

```text
chivalry +10 [additive]
reputation -5 [additive]
merchant_official_friend is not set
money unchanged
Wealth unchanged
```

The branch intentionally does not continue into the official-friend → intelligence → chamber spine.

### 2.2 Intelligence Network

Legacy wallet producer to retire:

```text
money set 60
```

Canonical semantics:

```text
merchant_official_friend
→ merchant_intelligence_network
→ charisma +8 [additive]
→ reputation -5 [additive]
→ merchant_intelligence = true
→ money unchanged
→ Wealth unchanged
```

The durable product result is the intelligence-network milestone, not a wallet balance. The event is not a Wealth transition and does not add a new Asset.

### 2.3 Chamber of Commerce

Legacy gate and reward to retire:

```text
merchant_intelligence == true && money >= 300
money set 50
```

Canonical entry conditions:

```text
merchant_intelligence == true
AND wealth_capacity_at_least comfortable_means
```

Canonical outcome:

```text
wealth_capacity_raise_to wealthy
reputation +30 [additive]
charisma +12 [additive]
merchant_chamber_head = true
money unchanged
```

Product classification:

- entry `wealth_capacity_at_least comfortable_means` = `WEALTH_REQUIREMENT`
- becoming chamber head = `ECONOMIC_DEVELOPMENT`
- `wealth_capacity_raise_to wealthy` = `WEALTH_TRANSITION`

The entry requirement expresses that participation at chamber-leadership scale requires an established economic base. Becoming chamber head then represents a persistent expansion of economic influence and future economic opportunity space, so it raises Wealth Capacity to at least `wealthy`.

This keeps both accepted market routes coherent:

```text
Monopoly route
comfortable_means → market monopoly → wealthy
→ official → intelligence → chamber
→ wealthy (no-op)

Fair route
comfortable_means → fair competition → comfortable_means
→ moderate official connection → intelligence → chamber
→ wealthy
```

A direct `wealthy` chamber requirement is rejected because it would make the fair route structurally dependent on an unrelated extra Wealth producer. A no-Wealth chamber gate is also rejected because chamber leadership is explicitly an economic-scale milestone.

## 3. Canonical Condition Authoring

`EventChoice` has the formal field:

```ts
condition?: EventCondition
```

The legacy `heavy_bribe.conditions[]` is not part of the canonical choice availability contract. This slice replaces it with:

```json
{
  "condition": {
    "type": "wealth_capacity_at_least",
    "minimum": "wealthy"
  }
}
```

`merchant_chamber_of_commerce` keeps event-level `conditions[]`, but the mixed legacy expression is split into two formal conditions:

```json
[
  {
    "type": "expression",
    "expression": "flags.merchant_intelligence == true"
  },
  {
    "type": "wealth_capacity_at_least",
    "minimum": "comfortable_means"
  }
]
```

No OR/AND DSL extension is introduced.

## 4. Retained Stat Effects Are Explicitly Additive

`stat_modify` defaults to `operator = 'set'`. The current authoring uses positive/negative delta language but omits the operator. This slice must not freeze those legacy `set` semantics into the new migration contract.

Only the retained non-economic stat effects inside the three touched events are normalized to explicit `operator: "add"`:

| Event / choice | Canonical retained stat delta |
|---|---|
| `heavy_bribe` | `reputation +25`, `charisma +12` |
| `moderate_bribe` | `reputation +15`, `charisma +8` |
| `refuse_bribe` | `chivalry +10`, `reputation -5` |
| `merchant_intelligence_network` | `charisma +8`, `reputation -5` |
| `merchant_chamber_of_commerce` | `reputation +30`, `charisma +12` |

This is a slice-local authoring correction. It does **not** change `StatModifyHandler` or audit/fix unrelated merchant events.

## 5. Player-Facing Copy

Exact wallet numbers must leave choice copy in the migrated event.

Recommended minimal labels:

```text
heavy_bribe:
重孝换取特权（需财力：豪富，声望 +25）

moderate_bribe:
适度孝敬（声望 +15）

refuse_bribe:
拒绝，保持清白
```

The event body may continue to mention “银子” or “孝敬” as world/narrative language. Such prose does not imply a core wallet mechanic.

`merchant_intelligence_network` and `merchant_chamber_of_commerce` currently do not expose exact wallet numbers in player-facing copy, so no rewrite is required unless implementation finds a direct factual contradiction.

## 6. Runtime Invariants

Use a non-special money sentinel (for example `37`) and `player.traits = []` in deterministic runtime tests.

### Official

```text
wealthy + heavy_bribe
→ choice condition true
→ Wealth unchanged
→ money unchanged
→ reputation before +25
→ charisma before +12
→ merchant_official_friend = true

comfortable_means + heavy_bribe
→ choice condition false even if money = 999

comfortable_means + moderate_bribe
→ Wealth unchanged
→ money unchanged
→ reputation before +15
→ charisma before +8
→ merchant_official_friend = true
```

### Intelligence

```text
merchant_official_friend
→ execute intelligence autoEffects
→ Wealth unchanged
→ money unchanged
→ charisma before +8
→ reputation before -5
→ merchant_intelligence = true
```

### Chamber

```text
merchant_intelligence + comfortable_means
→ event conditions true
→ execute chamber autoEffects
→ wealthy
→ money unchanged
→ merchant_chamber_head = true

merchant_intelligence + wealthy
→ wealthy

merchant_intelligence + regional_magnate
→ regional_magnate

merchant_intelligence + modest_savings + money 999
→ Wealth condition false
```

### Downstream boundary

After chamber success:

```text
merchant_wealth_peak event condition
→ true because merchant_chamber_head == true
```

The slice must **not** execute or migrate `merchant_wealth_peak` as part of continuity proof. Its existing `wealth_capacity_set: regional_magnate` and legacy `money +200` remain deferred implementation reality.

## 7. Assets, Persistence, and Runtime Primitives

No new Asset is introduced.

```text
AssetId = merchant_shop only
```

The existing durable flags remain sufficient for this slice:

```text
merchant_official_friend
merchant_intelligence
merchant_chamber_head
```

No new persisted field, Snapshot migration, Wealth enum value, condition type, effect type, or compatibility layer is required.

Snapshot remains:

```text
3.15.0
```

## 8. Explicit Non-Goals

This design does not authorize migration or redesign of:

- `merchant_wealth_peak` legacy `money +200`;
- `merchant_sect_investment` money gates/costs;
- `merchant_business_empire` wallet effect;
- `merchant_ending_tycoon money >= 500`;
- `merchant_ending_bankrupt money <= 50`;
- other merchant endings;
- `origin_merchant_family money +200`;
- `identity-merchant.json` parallel wallet semantics;
- P26/P42 business-habit wallet producers;
- P17 `money + wealth`;
- global `money` retirement;
- a second Asset or market/official/chamber Asset;
- generic commercial-position or influence framework;
- Snapshot/save migration;
- Auto Evolution, B0, P8, or unrelated broad-gate repair.

## 9. Rejected Alternatives

### Alternative A — Migrate only Official Connection

Rejected as incomplete. It can clean the bribe choices but leaves `merchant_intelligence_network` resetting the wallet and `merchant_chamber_of_commerce` immediately blocking the main progression on `money >= 300`.

### Alternative B — Require `wealthy` to enter Chamber, no Chamber Wealth transition

Rejected because the delivered fair route ends Market Monopoly at `comfortable_means` and currently has no canonical intermediate producer that naturally raises it to `wealthy`. This would replace a wallet discontinuity with a Wealth discontinuity and make Chamber progression effectively monopoly-favored by accident.

### Alternative C — Remove Chamber's economic requirement entirely

Rejected because chamber leadership is an explicit economic-scale milestone. Requiring only the intelligence flag would undercut the Wealth Contract's role in strategic economic qualification.

### Alternative D — Treat Heavy Bribe as a Wealth decrement / Major Commitment

Rejected for v1. Both heavy and moderate routes produce the same core durable state (`merchant_official_friend`), and repository evidence does not support a persistent economic-identity downgrade from using the heavy path. Wealth may gate the option but is not consumed as a balance.

## 10. Acceptance Criteria

The slice is delivered only when all of the following are true:

1. `merchant_official_connection` no longer reads or writes exact `money` in any choice.
2. `heavy_bribe` uses singular `condition: wealth_capacity_at_least wealthy`; plural `conditions` is absent.
3. `moderate_bribe` and `refuse_bribe` remain available without a Wealth requirement.
4. All retained official stat deltas are explicit `operator: add`.
5. `merchant_intelligence_network` no longer writes `money`; it keeps Wealth unchanged and sets `merchant_intelligence`.
6. `merchant_chamber_of_commerce` no longer reads or writes exact `money`.
7. Chamber entry is `merchant_intelligence` AND `wealth_capacity_at_least comfortable_means`.
8. Chamber success uses `wealth_capacity_raise_to wealthy`, preserves higher Wealth levels, and sets `merchant_chamber_head`.
9. All retained intelligence/chamber stat deltas are explicit `operator: add`.
10. A fair-route `comfortable_means` character can reach Chamber through the moderate official path and becomes `wealthy` at Chamber.
11. A monopoly-route `wealthy` character remains `wealthy` through Chamber.
12. Legacy `money` sentinel is unchanged across the migrated Official → Intelligence → Chamber path.
13. `merchant_wealth_peak` remains downstream-reachable through `merchant_chamber_head` but is otherwise untouched, including its deferred `money +200`.
14. No new Asset, schema, runtime primitive, Snapshot version, or global money migration is introduced.
15. Scope-local tests pass in the real test gate; broad pre-existing failures remain separately attributed.

## 11. Governance Closure

On implementation delivery, repository governance should record the decision as **PD-070 — Merchant Official–Intelligence–Chamber continuity migrated from legacy wallet semantics**.

PD-070 should record only the accepted semantics in this design. It must not pre-decide the later `merchant_wealth_peak`, sect investment, empire, tycoon-ending, bankrupt-ending, or identity-merchant migrations.
