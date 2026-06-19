# Stage-2 Experience Governance Closure (US-005)

**PRD:** `docs/PRD/early-childhood-opening-experience-governance.md`  
**Branch:** `ralph/early-childhood-opening-experience-governance`  
**Date:** 2026-06-20  
**Decision:** **Stage-2 complete — recommend opening Stage-3/4 in parallel**

---

## Evidence index

| Story | Artifact | Result |
| --- | --- | --- |
| US-001 | `docs/test-reports/early-childhood-stage1-baseline-confirmation.md` | Stage-1 wiring confirmed |
| US-002 | `docs/test-reports/early-childhood-stage2-gate-regression.md` | gate:p16 + gate:playability pass; 0 blockers |
| US-002 | `docs/test-reports/p8-playability-gate-latest.md` | Early samples: 0–4 passive, lite planning from age 5 |
| US-003 | `docs/test-reports/api-browser-playtest-stage2.md` | 书香门第 → age 7; 0–4 passive; ★★★ vs ★★ baseline |
| US-004 | `docs/test-reports/early-childhood-origin-divergence-stage2.md` | 5/6 pairs <50%; 书香×边疆 70.6% flagged |

---

## Baseline metrics for Stage-3 / Stage-4 sub-agents

| Metric | Stage-2 value | Target / note |
| --- | --- | --- |
| 0–2 岁规划三选一 | 0 / all origins (headless) | ✅ met |
| 4 岁前「暂无江湖变故」占位 | 0 (playtest + API) | ✅ met |
| 35 步内占位总计 | 0 | ✅ met (was frequent in 2026-06-17) |
| 继续前叙事非空率 | 100% (35/35 API steps) | ✅ met (≥95%) |
| 四出身两两重合度 | 5/6 pairs <50%; 书香×边疆 **70.6%** | ⚠️ partial — Stage-3 origin chains |
| gate:p16 + gate:playability | pass, 0 blockers | ✅ met |
| 主观耐玩（评审） | ★★★☆☆ vs 2026-06-17 ★★☆☆☆ | +1 档 |

---

## Residual risks

1. **被动重复感** — 0–4 岁 passive 循环已正确，但叙事池仍偏薄；Stage-4 密度 PRD 负责加厚。
2. **Spine 密度** — 4 岁「童年偏好」可达，但 35 步内正式 story_event 仍偏少；Stage-4 pacing 目标。
3. **5–7 lite planning 单调** — gate 样本显示 age 5 起 lite 行动重复；非 Stage-2 阻塞，记入 Stage-4。
4. **API 契约缺口（已修）** — `router.ts` 曾遗漏 `player` / `periodSummary` / `passiveNarrative` 与 `passive_continue` ack；US-003 期间已补齐 + volatile cache on choice。
5. **出身差异化** — 书香×边疆 重合 70.6%；Stage-3 四链 quest dequeue 为首选修复路径。

---

## Stage-3 entry recommendation

**Proceed:** Stage-2 gates green; infant/preschool agency behavior matches frozen PRD §3. Stage-3（出身链接线）与 Stage-4（3–7 密度）可并行开工，不以 Stage-2 partial overlap 阻塞。

**Priority for Stage-3:** 降低 shared spine + passive filler 对 书香×边疆 重合的拉动；顺序 dequeue `origin-infant-passives.json` 链。

---

## Repro commands (full suite)

```bash
npm run gate:p16
npm exec tsx tests/headless/p72SessionPhase.test.ts
npm exec tsx tests/p16OriginDestinyTests.ts
npm exec tsx tests/p9PlayabilityTests.ts
npm run gate:playability
npm exec tsx scripts/runEarlyChildhoodOriginDivergenceStage2.ts
npm run p6b:serve   # + VITE_P6B_API_URL dev for browser
npm exec tsx scripts/runApiBrowserPlaytestStage2.ts
```

---

**No further code changes in this story.**
