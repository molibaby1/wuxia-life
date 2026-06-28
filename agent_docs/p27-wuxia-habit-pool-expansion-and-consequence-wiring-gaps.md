# P27 Discovery Gaps — Habit Pool Expansion And Consequence Wiring

**Date:** 2026-06-24  
**Mode:** post-run (`--pipeline-auto --spawn-stage`)  
**Parent PRD:** `docs/PRD/p27-wuxia-habit-pool-expansion-and-consequence-wiring.md`  
**Finalize commit:** `3653b06`  
**Verify:** `agent_docs/p27-wuxia-habit-pool-expansion-and-consequence-wiring-verify-result.md` → PASS

---

## Stage Assessment

| Dimension | Status | Evidence |
| --- | --- | --- |
| **stage_status** | **CLEAR** | 10/10 stories `passes: true`; Goals §2 + Success Metrics §5 met (P20 dual-read mirrors, P21 echo, 2 P17 consequences + P26 business = 3 axes, 1 medical sample, regression + P20 slice, closure) |
| **end_state_status** | **OPEN** | P25 North Star §8 Discovery CLEAR 清单未全勾选；半人格轴 `socialMomentum` / `familyBond` 在内容 JSON 零 `lifeStates.*` 读者；medical 池 habit 迁移仅 1 样本；§6 重玩 proxy 与 habit 链余量仍属 OPEN |

---

## Gap Inventory

| ID | Gap | Route | Evidence | Target |
| --- | --- | --- | --- | --- |
| GAP-P27-001 | `socialMomentum` / `familyBond` 半人格轴未作为内容分流器接入任何 `src/data/lines` 事件 | **next-stage** | P27 Non-goals §3；`grep lifeStates.(socialMomentum\|familyBond)` in lines → 0 hits；`dailyEvents.ts` / `GameEngineIntegration.ts` 仅有 runtime 权重 | P28 |
| GAP-P27-002 | Medical 池除 `p27_study_habit_healer_reinforcement` 外仍 stat/talent gate only | **next-stage** | `p27-closure-report.md` §5；`p27-habit-pool-audit-delta.md` §5 | P28+ (partial) |
| GAP-P27-003 | `src/p24/sliceFixtures.ts` 仍 seed legacy `business_habit` | **defer** | `p27-closure-report.md` §5；P27 scope 已完成 wealth validationSlices | Future P24 pass |
| GAP-P27-004 | `src/p25/habitTrajectorySlice.ts` 未纳入 P27 后果/echo 事件 | **next-stage** | `p27-verify-result.md` optional gap；slice 仍仅 P26 later-echo IDs | P28 |
| GAP-P27-005 | P20 replay tests 保留 legacy-only gate fixtures（无阻断） | **defer** | `p27-closure-report.md` §5 optional | Keep compat |
| GAP-END-08-01 | North Star §8：主流/混合/巅峰可玩样本 — P25 prd 全绿但 habit+半人格内容链未闭合 | **next-stage** (reconcile) | P25 all passes; habit trajectory 链 OPEN | End-state track |
| GAP-END-08-02 | North Star §8：平凡出身 ≥3 可区分轨迹 — P25 US-017–020 Met | **defer** | `p25-ordinary-origin-slice.md` | Met |
| GAP-END-08-03 | North Star §8：验收切片零自相矛盾 — consistency slice PASS | **defer** | `highSeverityContradictionCount: 0` | Met |
| GAP-END-08-04 | North Star §8：巅峰运气+选择门禁 — P25 pinnacle baseline Met | **defer** | `p25-pinnacle-baseline-metrics` | Met |
| GAP-END-08-05 | North Star §8：`gate:playability` / `gate:p20` 不退化 | **defer** | P27 verify 四命令 PASS | Met |
| GAP-END-SEMIPERSON | 半人格轴内容分流器缺失阻碍 Wave 1 `jianghu_renown_sage` 行为-led 路径深化 | **next-stage** | North Star §3.1 名望/人脉线；P27 closure §7 | P28 |

---

## In-Stage Delta

**None.** P27 scope 已全部 `passes: true`；上述 gap 均超出 P27 Non-goals（不扩半人格轴）或属 defer。禁止改写已关闭 story。

---

## Next-Stage PRD

| Field | Value |
| --- | --- |
| **spawned** | `true` |
| **stage_slug** | `p28-wuxia-semi-personality-axis-content-wiring` |
| **prd_md** | `docs/PRD/p28-wuxia-semi-personality-axis-content-wiring.md` |
| **prd_json** | `docs/PRD/p28-wuxia-semi-personality-axis-content-wiring.prd.json` |
| **queued_behind_current** | `false` |
| **Gaps addressed** | GAP-P27-001, GAP-P27-004, GAP-END-SEMIPERSON |

---

## Verification (Discovery Run)

```bash
npx tsc --noEmit                                      # PASS 2026-06-24
npm exec tsx tests/personalityHabitTrajectoryTests.ts  # PASS
npm exec tsx tests/p20ReplayabilityTests.ts            # PASS
npm exec tsx tests/p25LifetimeSimulationTests.ts       # PASS
git log -1 --oneline 3653b06                            # finalize commit present
```

All 10 P27 stories: `passes: true` in `p27-wuxia-habit-pool-expansion-and-consequence-wiring.prd.json`.
