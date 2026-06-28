# P32 Discovery Gaps — Wave 1 Habit-Led Runtime Sim Parity

**Date:** 2026-06-24  
**Mode:** post-run (`--pipeline-auto --spawn-stage`)  
**Parent PRD:** `docs/PRD/p32-wuxia-wave1-habit-led-runtime-sim-parity.md`  
**Finalize commit:** `bb480b9`  
**End-state:** `docs/designs/p25-lifetime-simulation-north-star.md`

---

## Stage Assessment

| Dimension | Status | Evidence |
| --- | --- | --- |
| **stage_status** | **CLEAR** | 7/7 stories `passes: true`; Goals §2 + Success Metrics §5 met (parity audit, JSON↔resolver tests for 3 bridges, renown short-chain sim, runtime baseline 100% aligned vs P31 static, regression, P32-006 skip documented, closure) |
| **end_state_status** | **OPEN** | North Star §8 Discovery CLEAR 清单未全勾选；§8 item 1 主流/混合/巅峰可玩样本 **Partial**（renown runtime short-chain + medical parity-only；mixed/pinnacle habit-led 未扩）；habit zero birth→death e2e 仍缺失 |

---

## Gap Inventory

| ID | Gap | Route | Evidence | Target |
| --- | --- | --- | --- | --- |
| GAP-P32-001 | Medical two-event runtime short-chain **skipped** (P32-006)；`medical_sage_healer` runtime unlock 仅经 parity tests + P31 static fixtures | **next-stage** | `p32-006-second-path-skip.md`; `p32-closure-report.md` §4, §7 | P33 |
| GAP-P32-002 | `medical_poison_path` JSON mutex drift — resolver blocks all bridges; JSON choice effects 不检查 (P32-RISK-003) | **next-stage** | `p32-runtime-bridge-parity-audit-delta.md` §2.2; closure §7 Monitor | P33 |
| GAP-P32-003 | Habit zero birth→death lifetime sim 仍缺失（GAP-P31-003 carry-forward）；P32 short-chain 使用 seeded habit threshold | **next-stage** (partial) | `p32-closure-report.md` §7; P32 Non-goals §3 | P33 (partial slice) |
| GAP-P32-004 | Runtime baseline medical unlock 列为 **monitor**（parity only，无 event-driven 100%） | **next-stage** | `p32-runtime-sim-baseline-delta.md` §Delta table | P33 |
| GAP-P32-005 | `mentor_bond` habit-led social bridge 未交付 | **defer** | P31 defer carry-forward; `ally_network` 已足够 renown unlock | Future if thematic coverage needed |
| GAP-P32-006 | `medical_imperial` habit-led bridge 未交付 | **defer** | P31 defer; `medical_divine_doctor_fame` + `medical_pure` 已覆盖 unlock | Future medical wave |
| GAP-END-08-01 | North Star §8 item 1：主流/混合/巅峰可玩样本 — Wave 1 medical **Partial**（parity not runtime short-chain）；mixed/pinnacle Missing | **next-stage** (partial) | `p32-closure-report.md` §8; North Star §8 | P33 partial + end-state track |
| GAP-END-08-02 | North Star §8：平凡出身 ≥3 可区分轨迹 | **defer** | P25 ordinary-origin slice | Met (P25) |
| GAP-END-08-03 | North Star §8：验收切片零自相矛盾 | **defer** | P25 validation | Met (P25) |
| GAP-END-08-04 | North Star §8：巅峰运气+选择门禁 | **defer** | P25 pinnacle baseline | Met (Wave 2 config) |
| GAP-END-08-05 | North Star §8：`gate:playability` / `gate:p20` 不退化 | **defer** | P32 verify PASS | Met |
| GAP-END-MEDICAL-REMAIN | Medical 池全量 habit 迁移未完成（3/18） | **defer** | P32 Non-goals §3 | Future medical wave |
| GAP-END-MIXED-PIN | 混合/巅峰成就可玩样本与 habit-led trace 未扩展 | **defer** | North Star §3.2–3.3, §8 | P25 Wave 2–3 track |
| GAP-END-W2-W4 | Wave 2–4 成就与出身扩展 | **defer** | P32 Non-goals §3 | P25 end-state track |
| GAP-P24-FIXTURE | `src/p24/sliceFixtures.ts` legacy `business_habit` | **defer** | P29 gaps carry-forward | Future P24 reconciliation |

---

## In-Stage Delta

**None.** P32 scope 已全部 `passes: true`；上述 gap 均超出 P32 Non-goals（P32-006 skip-first 已执行、不要求 birth→death e2e、不强制 poison mutex fix、不交付 Wave 2–4 / full medical pool）或属 defer。禁止改写已关闭 story。

---

## Next-Stage PRD

| Field | Value |
| --- | --- |
| **spawned** | `true` |
| **stage_slug** | `p33-wuxia-wave1-medical-runtime-short-chain-and-e2e-slice` |
| **prd_md** | `docs/PRD/p33-wuxia-wave1-medical-runtime-short-chain-and-e2e-slice.md` |
| **prd_json** | `docs/PRD/p33-wuxia-wave1-medical-runtime-short-chain-and-e2e-slice.prd.json` |
| **queued_behind_current** | `false` |
| **Gaps addressed** | GAP-P32-001, GAP-P32-002, GAP-P32-003 (partial), GAP-P32-004, GAP-END-08-01 (partial) |

---

## Verification (Discovery Run)

```bash
npm run typecheck                                      # PASS 2026-06-24
npm exec tsx tests/p25LifetimeSimulationTests.ts       # PASS
npm exec tsx tests/p32RuntimeParityTests.ts            # PASS
npm exec tsx scripts/runP32HabitLedSimulationBaseline.ts  # PASS (renown 100%)
git log -1 --oneline bb480b9                           # finalize commit present
```

All 7 P32 stories: `passes: true` in `p32-wuxia-wave1-habit-led-runtime-sim-parity.prd.json`.

Content evidence:

- `docs/test-reports/p32-runtime-bridge-parity-audit-delta.md`: 3-bridge JSON↔resolver inventory + P32-RISK-003 poison mutex
- `src/p25/p32BridgeParity.ts`, `tests/p32RuntimeParityTests.ts`: automated parity at threshold + mutex cases
- `src/p25/p32HabitLedShortChainSlice.ts`: renown event-driven short-chain (`jianghu_renown_sage` 100% without static resolver)
- `docs/test-reports/p32-renown-short-chain-slice.md`, `p32-runtime-sim-baseline-delta.md`, `p32-runtime-sim-baseline-metrics.json`
- `docs/test-reports/p32-006-second-path-skip.md`: medical short-chain deferred with evidence
- `docs/test-reports/p32-closure-report.md`: remaining queue + North Star §8 OPEN items
