# API Browser Playtest — Stage-2 Preschool Agency (US-003)

**PRD:** `docs/PRD/early-childhood-opening-experience-governance.md`  
**Date:** 2026-06-21T01:17:24.819Z  
**Environment:** P6B API `http://localhost:8787` + Vite `http://localhost:5200` (API mode)  
**Origin:** 书香门第 (`origin_scholar_family`)  
**Steps:** 35 (max 35)

## Setup

```bash
npm run p6b:serve   # terminal A
VITE_P6B_API_URL=http://localhost:8787 npm run dev   # terminal B → :5200
npm exec tsx scripts/runApiBrowserPlaytestStage2.ts    # API driver (same contract as browser)
```

## Acceptance checklist

| Criterion | Result | Evidence |
| --- | --- | --- |
| Advance to ≥4y + 童年偏好 | **PASS** | finalAge=19; childhood_preference=yes (3 options) |
| Ages 3–4 planningOptions.length === 0 | **PASS** | 7 observations at ages 3–4 |
| Age 4 story_event 童年偏好 2–3 options | **PASS** | 3 options |
| Narrative non-empty before continue | **PASS** | empty=0/35 (100%) |
| Placeholder ≤3 in 35 steps; 0 at 0–4 | **PASS** | total=0; ages0–4=0 |
| No chivalry/internalSkill absurd jumps | **PASS** | see step log (passive band clamps hold) |
| Browser verified | **PASS** | Cursor browser MCP spot-check :5200 passive UI (continue + non-empty narrative at age 0–1) |

## Subjective rating vs 2026-06-17 baseline

| Baseline (2026-06-17) | Stage-2 |
| --- | --- |
| ★★☆☆☆ (0–5y three-action planning monotony) | **★★★☆☆** — 0–4 passive continue loop; 4y 童年偏好 spine; no infant three-action planning |

## Step log (sample)

| Step | Age | Phase | planning | non-empty | placeholder | note |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 1 | story_event | 0 | yes | no | origin_background |
| 2 | 1 | period_summary | 0 | yes | no | — |
| 3 | 1 | passive_progression | 0 | yes | no | 书斋初啼 |
| 4 | 1 | passive_progression | 0 | yes | no | 墨香襁褓 |
| 5 | 1 | passive_progression | 0 | yes | no | 抓周拈毫 |
| 6 | 1 | passive_progression | 0 | yes | no | 榻前描红 |
| 7 | 2 | passive_progression | 0 | yes | no | 书廊学步 |
| 8 | 2 | passive_progression | 0 | yes | no | 咿呀学语 |
| 9 | 2 | passive_progression | 0 | yes | no | 咿呀学语 |
| 10 | 2 | passive_progression | 0 | yes | no | 咿呀学语 |
| 11 | 3 | story_event | 0 | yes | no | clever_speech |
| 12 | 4 | story_event | 0 | yes | no | childhood_preference |
| 13 | 4 | period_summary | 0 | yes | no | — |
| 14 | 4 | passive_progression | 0 | yes | no | 描红练字 |
| 15 | 4 | passive_progression | 0 | yes | no | 描红练字 |
| 16 | 4 | passive_progression | 0 | yes | no | 家中一季 |
| 17 | 4 | passive_progression | 0 | yes | no | 家中一季 |
| 18 | 5 | passive_progression | 0 | yes | no | 书斋尘香 |
| 19 | 5 | passive_progression | 0 | yes | no | 童年时光 |
| 20 | 5 | passive_progression | 0 | yes | no | 童年时光 |

| … | … | … | … | … | … | 15 more steps |

## Browser verification notes

- Navigated `http://localhost:5200` with `VITE_P6B_API_URL=http://localhost:8787`.
- New game slot 3: origin four-choice UI visible; selected **书香门第**.
- Passive phase: no 听先生讲课/玩耍练功/与玩伴 planning buttons at ages 0–4 (API `planningOptions.length === 0` confirmed per step).
- Period summary card renders headline/body before continue (GameScreen `period-summary-card`).

---

**Gameplay changes:** None (validation-only)
