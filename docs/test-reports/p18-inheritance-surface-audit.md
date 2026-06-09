# P18 Inheritable Asset And Burden Surface Audit (US-002)

Read-only inventory of what late-life achievements currently pass on versus what stops at personal summary.

## Scope

- Martial teachings: `martialHeritage`, `elderly-legacy.json`, training/sect events
- Technical skills: `scholarlyHeritage`, scholar/doctor legacy events
- Social capital: `connections`, `influence`, `merchantNetwork`, reputation events
- Wealth/industry: `money`, `wealth`, economy/career events, `family_legacy`
- Reputation: `reputation`, hero mantle flags, `reputation_legacy`
- Vendettas: `lifePath.commitments.swornEnemies`, P17 feud patterns
- Responsibilities: `mustProtect`, sect duty, `inheritance_legacy_complete`

## Channel Inventory

| Channel | Primary signals | Classification | Passes to successor? |
| --- | --- | --- | --- |
| Martial teachings | `martialHeritage`, `master_legacy`, organize-martial events | **partially config-driven** | Summary only; no successor ability score |
| Technical skills | `scholarlyHeritage`, doctor/scholar legacy | **content-only** | Episodic stat bumps |
| Social capital | `connections`, `influence` | **runtime-bound** | Player stats; not inheritable channel |
| Wealth/industry | `money`, `wealth`, `merchantNetwork` | **content-only** | `inheritance.json` child merchant path is one-shot |
| Reputation | `reputation`, `hero_rep_mantle` | **partially config-driven** | P17 hero maintenance; no heir-facing reputation transfer |
| Vendettas | `swornEnemies`, enemy lists | **partially config-driven** | P17 feud pressure on protagonist; not heir-specific burden |
| Responsibilities | `mustProtect`, sect_master, family obligations | **partially config-driven** | Listed in life-memory; no successor obligation channel |

## Collapse Patterns

1. **Achievement ends at flag** — `inheritance_legacy_complete`, `follower_legacy` set completion flags without shaping later-life successor outcome space.
2. **Positive-only carryover** — Heritage stats and legacy events reward the protagonist; inherited burden (vendetta, duty without capability) is absent.
3. **No channel polarity** — Config cannot express asset vs burden on the same inheritance dimension.
4. **Report-only wealth** — High `money`/`reputation` at end of life does not narrow or expand successor opportunities.

## P18 Priority (inheritance)

1. Explicit inheritance channel patterns with `asset` / `burden` / `mixed` polarity.
2. Profile-first triggers for teachings, network, vendetta, responsibility.
3. Successor-facing opportunity/risk weighting via shared later-life path.
4. Samples proving burden ≠ positive carryover.

No gameplay changes in US-002.
