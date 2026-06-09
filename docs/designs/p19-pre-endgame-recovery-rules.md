# P19 Pre-Endgame Closure Recovery Rules (US-005)

## Combined recovery model

Pre-endgame recovery merges five dimensions before final summary:

1. **Relationship** — reconciliation, relational fallout, ally obligation closure
2. **Vendetta** — sworn enemy resolution or escalation
3. **Faction** — protection reward, exposure collapse, duty fulfillment
4. **Inheritance / legacy** — succession continuity, burden without capability
5. **Obligation** — mustProtect, sect debt, unfinished duty flags

Each active `preEndgameRecoveryPattern` contributes intensity and optional `summaryLine`.

## Recovery kinds (first pass)

| Kind | Meaning | Example effect |
| --- | --- | --- |
| `reconciliation` | Relationship/feud partially closed | Explicit summary line; opportunity boost |
| `reward` | Faction/legacy duty honored | Protection/reward line; lower risk multiplier |
| `collapse` | Unmet obligation or neglected legacy | Exposure/collapse line; risk boost |
| `retribution` | Vendetta or betrayal closes destructively | Retribution line; high risk, mixed opportunity |

## Summary visibility

- **Explicit in summary** — `explicitInSummary: true` patterns append `summaryLine` to final composition
- **Implicit in weighting** — patterns without explicit lines still affect opportunity/risk multipliers and category inputs

## Deferred beyond P19

- Per-NPC closure dialogue trees
- Player-chosen closure branches at age 65+
- Full scheduler rewrite for dedicated closure event lane
