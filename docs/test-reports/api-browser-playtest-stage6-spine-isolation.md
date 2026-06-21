# API Playtest — Stage-6 Spine Origin Isolation (US-006)

**PRD:** `docs/PRD/early-childhood-spine-origin-isolation.md`  
**Date:** 2026-06-21T00:59:26.551Z  
**Environment:** P6B API `http://localhost:8787` (headless driver; browser contract equivalent)  
**Origin:** 书香门第 (`origin_scholar_family`)  
**Steps:** 35

## Setup

```bash
npm run p6b:serve   # terminal A
npm exec tsx scripts/runApiBrowserPlaytestStage2.ts
```

## Spine bleed acceptance

| Criterion | Result | Evidence |
| --- | --- | --- |
| 35-step 书香 run spine bleed flags | **PASS** | bleed flags=0 (target 0) |
| No `p22_origin_frontier_orphan` | **PASS** | step ids in log below |

## Bleed events (if any)

None.

## Story_event ids (ages 0–7)

- step 1 age 1: `origin_background`
- step 11 age 3: `clever_speech`
- step 12 age 4: `childhood_preference`
- step 22 age 6: `martial_arts_enlightenment`
- step 24 age 7: `p22_childhood_street_shaping`
- step 30 age 8: `martial_focus_payoff`
- step 31 age 14: `sect_choice`
- step 33 age 15: `love_first_meet`
- step 35 age 18: `martial_arts_invitation`

---

**Contract:** `isForeignExclusiveSpineEvent(event, origin_scholar_family)` on each story_event step.
