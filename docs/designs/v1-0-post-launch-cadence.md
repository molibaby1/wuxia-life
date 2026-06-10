# v1.0 Post-Launch Cadence

Version rhythm after v1.0 ships — replaces open-ended phase expansion with bounded release trains.

## v1.0 → v1.0.1 hotfix path

| Trigger | Response window | Scope |
|---------|-----------------|-------|
| Crash, save corruption, progression soft-lock | Immediate hotfix branch | Runtime fix only; no content expansion |
| Mislabeled mandatory event blocking new players | 24–72h hotfix | Single-event content/config patch |
| Gate regression on playability or profile load | Block next candidate until fixed | Minimal diff with regression proof |

Hotfixes require: upstream gate pass, one-sentence RC note, no new systems modules.

## Patch cadence (v1.0.x)

**Cadence:** every 2–4 weeks after launch stabilization.

| Class | Examples | Not in patch |
|-------|----------|--------------|
| Balance patch | Repetition pressure, pacing multipliers, survivability tuning | New archetype families |
| UX clarity patch | First-run copy, route labels, summary wording | UI layout redesign |
| RC follow-up | Alignment indicator drift, false-positive redirection samples | New playtest dimensions |

Patches must cite at least one alignment indicator or RC comparison outcome when changing player-facing quality.

## Content wave cadence (v1.1+)

**Cadence:** monthly or bi-monthly content waves after first patch train stabilizes.

| Class | Examples | Deferred from hotfix/patch |
|-------|----------|----------------------------|
| Content wave | New mid/late events, echo hooks, legacy beats | Crash fixes |
| Legacy/endgame reinforcement | P19/P18 depth on existing routes | Global scheduler changes |
| Live-ops expansion | P22-style weak-origin waves | Theme additions |

## Issue routing

| Issue type | Train |
|------------|-------|
| Release blocker (cannot ship / cannot play) | Hotfix |
| Launch-quality (readable but weak dimension) | Patch |
| Replay depth, route variety, endgame resonance | Content wave |
| Internal report cleanliness only | Defer — not a launch train |

## Anti-patterns

- Opening a new `Pxx` systems phase instead of a versioned train
- Shipping content waves without RC comparison on affected dimensions
- Using hotfix path for balance or narrative expansion
