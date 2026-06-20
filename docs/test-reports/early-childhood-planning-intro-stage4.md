# Stage-4 US-002: Childhood Planning Intro Framing

**Date:** 2026-06-20  
**Branch:** `ralph/early-childhood-preschool-content-and-pacing`  
**Scope:** Ages 0–7 planning placeholder / intro copy governance (split 2/2 after US-001 resolver)

## Summary

| Check | Target | Result |
| --- | --- | --- |
| Ages 0–4 adult jianghu placeholder | 0 occurrences of「本期暂无强求的江湖变故」 | **PASS** (unit + API script) |
| Ages 5–7 intro title | Childhood framing (`童年时光`) | **PASS** |
| Ages 5–7 intro body | Home/childhood language, no career/jianghu optimization | **PASS** |
| Ages 5–7 placeholder frequency (35 steps) | ≤3 (full closure US-012) | **DEFERRED** — tracked here; verified in `api-browser-playtest-stage4.md` |

## Copy bands (`resolvePlanningPlaceholderText`)

| Age | Title | Framing |
| --- | --- | --- |
| 0–2 | 岁月静流 | 家人怀抱，不知江湖 |
| 3–4 | 家中一季 | 庭院与亲人，被动/home |
| 5–7 | 童年时光 | 家中庭院、亲人玩伴；下方 lite 行动 |
| 8+ | 规划本期人生 | Adult placeholder (unchanged) |

`App.vue` planning-gap paths and `GameScreen.vue` active_planning title both read from the resolver — no hardcoded adult copy for age ≤7.

## Automated verification

```bash
npm run typecheck
npx tsx tests/preschoolPlaceholderGovernanceTests.ts
```

## API playthrough (0→4, no adult placeholder)

Requires P6B API on `:8787`:

```bash
npm run p6b:serve   # terminal 1
npx tsx scripts/runApiBrowserPlaytestStage2.ts   # terminal 2 — inspect StepLog placeholderHit for ages 0–4
```

Expected: `placeholderHit=false` for all steps while `age ≤ 4`.

## Browser spot-check (5–7 planning intro)

Requires Vite dev + P6B API:

```bash
npm run p6b:serve   # terminal 1
npm run dev         # terminal 2 — open app, new game 书香门第, advance to age 5+
```

At `active_planning`: card title **童年时光**, body mentions 家中/庭院/亲人/玩伴; no「江湖变故」or「规划本期人生」.

**Verified 2026-06-20:** Browser MCP at `http://127.0.0.1:5178` — 书香门第 save, age **5**, heading **童年时光**, body「这一季在家中庭院与亲人、玩伴身边度过…」, 2 lite planning options; no adult jianghu placeholder.

## Placeholder frequency note (5–7, 35 steps)

Target ≤3 adult-style planning placeholders per 35 steps is enforced by story-gap scheduling (US-003+) and spine density (US-004–007). US-002 documents the metric; US-012 playtest closure reports measured counts.
