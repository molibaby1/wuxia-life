# P57 Sample Lines Second 40+ Node — Gap Audit

> **Date:** 2026-06-27  
> **Stage:** P57 optional second 40+ node  
> **Reference:** P53 scope contract, P54 residual polish closure

## 1. Current Age-45 Payoff Completeness

### Orthodox (seed 301)

| Item | Detail |
|------|--------|
| Spine event | `orthodox_age45_legacy_stewardship` (age 44–48) |
| Theme | 传承守门 — sect stewardship transfer |
| Post flags | `orthodox_age45_payoff_done`, `orthodox_age45_legacy_steward_done` |
| Expression | currentGoal → 「传承守门，门派遗命在肩」 |
| Completeness | **High.** Covers identity acceptance + responsibility handoff. Narrative arc: childhood seed → trial → cost → gray pressure → age-40 identity → age-45 legacy stewardship. The age-45 payoff resolves the stewardship question definitively. |

### Demonic (seed 303)

| Item | Detail |
|------|--------|
| Spine event | `demonic_age45_territory_consolidation` (age 44–48) |
| Theme | 地盘既固 — territory consolidation + backlash/isolation |
| Post flags | `demonic_age45_payoff_done`, `demonic_age45_territory_consolidated` |
| Expression | currentGoal → 「地盘既固，反噬与孤立加深」 |
| Completeness | **Medium-High.** Covers the cost-of-power arc. The "backlash/isolation" framing implies ongoing consequences, but the event itself is a single milestone. The post-payoff expression already points forward (反噬加深), leaving some narrative tail. |

### Merchant (seed 804)

| Item | Detail |
|------|--------|
| Spine event | `merchant_age45_expansion_fork` (age 44–48) |
| Theme | 扩张分岔 — expansion fork with debt/favor tensions |
| Post flags | `merchant_age45_payoff_done`, `merchant_age45_expansion_fork_done` |
| Expression | currentGoal → 「扩张分岔已至，债与人情并重」 |
| Completeness | **Medium.** The "fork" framing implies a choice point, but the event is a single auto-trigger. Additionally, seed 804 runs the magnate chain (P55) which overlaps: `magnate_payoff` also sets `merchant_age45_payoff_done`. The standard merchant path may feel less resolved than the magnate path. |

## 2. Narrative Gap Assessment

### Age range: 48 → terminal (age ~50+)

| Line | Gap? | Assessment |
|------|------|------------|
| Orthodox | **Low** | Legacy stewardship is a natural terminal-ish beat. Adding a second node risks repeating "sect responsibility" without new narrative material. The existing P46 endgame recovery patterns already handle late-life. |
| Demonic | **Low-Medium** | The "backlash deepens" expression hints at more, but a second node would need to introduce a genuinely new theme (e.g., reckoning, legacy of fear) rather than just more territory巩固. Risk of repetition is moderate. |
| Merchant | **Medium** | The expansion fork is less narratively conclusive than the other two lines. A second node about succession pressure or legacy could add value, but P55 magnate already covers this space for the merchant-magnate path. Standard merchant may benefit, but the overlap with magnate reduces uniqueness. |

### Terminal event overlap

All three lines hit the existing P46 endgame system at terminal age. The P46 `elderly-legacy.json` and `EndingSystem` already provide late-life closure. Any second node must be strictly between age-45 and terminal, not replace endgame.

## 3. Which Lines Have Genuine Second-Node Gaps

| Line | Genuine gap? | Reasoning |
|------|-------------|-----------|
| Orthodox | **No** | Age-45 stewardship is conclusive. Second node would likely repeat "sect duty" theme. |
| Demonic | **Marginal** | Backlash/isolation framing leaves slight tail, but a second node needs a distinct theme (not just consolidation round 2). Could be go if theme is carefully bounded. |
| Merchant | **Marginal** | Expansion fork is less conclusive, but P55 magnate covers the "succession/legacy" space for merchant-origin players. Standard merchant second node would overlap with magnate territory. |

## 4. Conclusion

The current age-45 payoffs are **substantially complete** for all three lines. The narrative gap between age-45 and terminal is narrow and already partially covered by P46 endgame patterns. A second 40+ node per line would likely **repeat** rather than **extend** the existing payoff themes.

**Recommendation:** Most lines are **no-go** for second nodes. If any line is go, it should be the one with the clearest thematic gap — currently none stands out strongly. P57 may result in a "all no-go" outcome, which the PRD explicitly allows as a success result (FR-5).

---

## Appendix A — Orthodox Second-Node Contract (US-003)

| Item | Detail |
|------|--------|
| Theme | Mentor succession / legacy codex — passing institutional knowledge to the next generation |
| Prerequisites | `orthodox_age45_payoff_done` (stewardship already transferred) |
| Difference from age-45 | Age-45 is "receiving the keys"; second node would be "what you do with them" — active mentorship vs. passive custody |
| Constraint | Do not rewrite orthodox core route; no new childhood/route events |
| Go/No-Go | **No-Go.** Age-45 stewardship already implies mentorship. A second node would restate the same theme with marginal narrative gain. The P46 endgame system covers late-life legacy closure. |

## Appendix B — Demonic Second-Node Contract (US-004)

| Item | Detail |
|------|--------|
| Theme | Backlash escalation / rule-making — the cost of consolidated power becomes personal (trusted lieutenants rebel, health deteriorates from dark arts, or forced moral reckoning) |
| Prerequisites | `demonic_age45_payoff_done` + `demonic_age45_territory_consolidated` |
| Difference from age-45 | Age-45 is "territory is secure but isolation grows"; second node would be "isolation becomes crisis" — the implied consequences actually arrive |
| Constraint | Do not rewrite demonic core route; maintain existing flag semantics |
| Go/No-Go | **Marginal No-Go.** The backlash theme is already in the age-45 expression. A second node risks being "more of the same." P46 endgame recovery patterns already handle late-life demonic closure. If go, theme must be sharply distinct from consolidation. |

## Appendix C — Demonic Second-Node Contract (US-005)

| Item | Detail |
|------|--------|
| Theme | Succession pressure / scale crisis — the merchant empire outgrows the founder; choosing between personal wealth and institutional legacy |
| Prerequisites | `merchant_age45_payoff_done` + `merchant_age45_expansion_fork_done` |
| Difference from age-45 | Age-45 is "expansion fork — choose direction"; second node would be "consequences of that choice at scale" — debt/favor system strains under weight |
| Constraint | Keep merchant debt, favor, expansion semantics intact; do not conflict with P55 magnate path |
| Go/No-Go | **Marginal No-Go.** P55 magnate already covers the "merchant legacy at scale" space for players on the magnate path. Standard merchant second node would overlap. The expansion fork is less conclusive than other lines, but the marginal benefit doesn't justify the configuration/test cost. |
