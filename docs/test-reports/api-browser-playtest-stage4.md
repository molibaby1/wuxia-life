# API Browser Playtest — Stage-4 Preschool Content & Pacing (US-012)

**PRD:** `docs/PRD/early-childhood-preschool-content-and-pacing.md`  
**Date:** 2026-06-20  
**Environment:** P6B API `http://localhost:8787` + Vite `http://127.0.0.1:5178` (`VITE_P6B_API_URL`)  
**Origin:** 书香门第 (`origin_scholar_family`)  
**Steps:** 35+ (API driver + browser spot-check)

## Setup

```bash
npm run p6b:serve
VITE_P6B_API_URL=http://localhost:8787 npm run dev
npm exec tsx scripts/runApiBrowserPlaytestStage2.ts
npm exec tsx scripts/runPreschoolDensityStage4.ts
npm run gate:playability
```

## Success metrics vs 2026-06-17 baseline

| Metric | Target | Stage-4 result | Baseline (2026-06-17) |
| --- | --- | --- | --- |
| Non-placeholder narrative beats / 35 steps | ≥8 | **22** (density script) | ~2–3 formal story beats; heavy filler |
| Ages 0–4 adult jianghu placeholder | 0 | **0** (stage2 API log) | Frequent「暂无江湖变故」 |
| Ages 5–7 placeholder / 35 steps | ≤3 | **0** (stage2) | Monotonous same copy every period |
| Age 5 vs 7 lite action pool | Not identical | **PASS** — 院中玩耍/街坊跑腿 vs 玩耍练功/帮工 | Same three actions 0–5y |
| Subjective playability | ≥★★★ | **★★★☆☆** | ★★☆☆☆ |

## Acceptance checklist

| Criterion | Result | Evidence |
| --- | --- | --- |
| ≥8 non-placeholder narrative beats by age 7 | **PASS** | `early-childhood-preschool-density-stage4.md` (beats=22) |
| Ages 0–4 zero adult placeholder | **PASS** | `api-browser-playtest-stage2.md` placeholder ages0–4=0 |
| Ages 5–7 placeholder ≤3/35 | **PASS** | stage2 total=0 |
| Age 5 vs 7 palette divergence | **PASS** | `preschoolLitePaletteBrowserVerifyTests.ts`; browser age-5 **童年时光** + lite options |
| Childhood planning intro framing | **PASS** | Browser MCP: title **童年时光**, home-season body at age 5 |
| Story-gap passive before planning | **PASS** | `early-childhood-story-gap-stage4.md` |
| Stat delta narrative binding | **PASS** | `early-childhood-stat-narrative-stage4.md` |
| Disturbance guard 0–7 | **PASS** | `earlyChildhoodDisturbanceGuardTests.ts` |
| `npm run gate:playability` | **PASS** | 0 blockers (2026-06-20 run) |
| Browser verified | **PASS** | Cursor browser MCP @ :5178 — 书香门第 0→5y planning UI |

## Subjective notes vs baseline

**Improved:** Passive/spine density in 3–7 band; no adult jianghu filler in 0–7; 4y 童年偏好 spine intact; lite planning at 5–7 uses childhood copy and graduated action ids; period summaries explain stat changes.

**Residual:** Passive title repetition over long sessions; 8–12 band out of scope; disturbance UI unchanged (correctly suppressed ≤7).

## Related reports

- `early-childhood-planning-intro-stage4.md` (US-002)
- `early-childhood-story-gap-stage4.md` (US-003)
- `early-childhood-preschool-density-stage4.md` (US-007)
- `early-childhood-stat-narrative-stage4.md` (US-010)
- Baseline: `api-browser-playtest-experience-2026-06-17.md` §3–§7
