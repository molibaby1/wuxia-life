# Early Childhood Stage-8 — Closure Report (US-006)

**Date:** 2026-06-21  
**PRD:** `docs/PRD/early-childhood-passive-density-and-trait-line-stage8.md`  
**Branch:** `ralph/early-childhood-passive-density-trait-line-stage8`

---

## 1. Scope delivered

| Story | Artifact | Status |
| --- | --- | --- |
| US-001 | `docs/test-reports/early-childhood-stage8-pool-audit.md` | ✅ |
| US-002 | `primaryOriginFlagTests` in `runRealTestGate.ts` + audit appendix | ✅ |
| US-003 | `preschool-passive-spine.json` + `early-childhood-stage8-passive-content.md` | ✅ |
| US-004 | `p22_childhood_poor_shaping` + `trait-poor-spine-stage8.md` | ✅ |
| US-005 | `early-childhood-opening-experience-final-playtest.md` (Stage-8 row) | ✅ |

---

## 2. Success metrics

来源：`docs/test-reports/early-childhood-opening-experience-final-playtest.md`（2026-06-21，US-005 RNG 补修后复跑）

| 指标 | Stage-7 baseline | Stage-8 结果 |
| --- | --- | --- |
| Gap 步 / 35 / 出身（书香 / 武林 / 商贾 / 边疆） | 4～5 | **2 / 2 / 2 / 0** |
| Stage-8 gap 门禁 (≤2) | — | **PASS** |
| Passive bleed | 0 | **0** |
| Spine bleed | 0 | **0** |
| Trait-line bleed | 0 | **0** |
| Poor trait spine (3～7) | 0 | **1** (`p22_childhood_poor_shaping`) |
| `primaryOriginFlagTests` CI | 未接线 | **pass** |
| 启发式评分 | ★★★☆☆ | ★★★★☆ / ★★★★☆ / ★★★★☆ / ★★★☆☆ |
| 被动同标题连出 (max) | — | 1 / 1 / 1 / 3（套件 PARTIAL，Stage-7 指标） |

固定 seed 下连续 3 次 `runEarlyChildhoodFinalPlaytest.ts` gap 均为 **2/2/2/0**（与上表一致）。

---

## 3. Stage-5/6/7 isolation — non-regression

```text
$ npm exec tsx tests/preschoolOriginIsolationTests.ts
preschoolOriginIsolationTests: ok

$ npm exec tsx tests/spineOriginIsolationTests.ts
✔ spineOriginIsolationTests passed

$ npm exec tsx tests/spineOriginConfigValidationTests.ts
✔ spineOriginConfigValidationTests passed

$ npm exec tsx tests/traitLineSpineEligibilityTests.ts
✔ traitLineSpineEligibilityTests passed
```

---

## 4. Frozen decisions honored

- ✅ 仅加内容 + CI 接线；未改 `isPreschoolPassiveEligible` / spine gate 语义  
- ✅ 新 passive 带正确 `originTags`；`preschoolOriginIsolationTests` 0 foreign  
- ✅ Poor spine 条件仅 `origin_poor_family`（无四主 OR）  
- ✅ Gap 指标沿用 `isGapPassiveTitle`；终验脚本新增 Stage-8 ≤2 门禁  
- ✅ **US-005 补修：** `selectPassiveNarrative` / `executeActiveAction` 随机调用纳入 `runWithRandomSync/Async`；固定 seed 下连续 3 次终验 gap **2/2/2/0** 完全一致  

---

## 4b. US-005 RNG determinism fix (post-closure)

**根因：** `HeadlessEngineSessionImpl.ensurePassivePresentation` 与 `executePassiveChildhoodTick` 在 seeded RNG 作用域外调用 `selectPassiveNarrative`，导致固定 `randomSeed` 下 gap 步仍波动（martial 曾出现 gap=3）。

**修复：** `src/headless/session/HeadlessEngineSessionImpl.ts`

- `ensurePassivePresentation` → `runWithRandomSync` 内选 passive
- `executePassiveChildhoodTick` → `runWithRandomAsync` 内选 passive
- `executeActiveAction` → 移除显式 `Math.random`，依赖 patched `Math.random`

**复验（2026-06-21）：**

```bash
# 连续 3 次，四出身 gap 均为 2/2/2/0
npm exec tsx scripts/runEarlyChildhoodFinalPlaytest.ts
```


## 5. Stage-9 candidates（PRD §6 非目标）

| 候选 | 说明 |
| --- | --- |
| **8～12 agency** | 35 步终龄常 >7；P16 形态与 spine 密度未在本 Stage 覆盖 |
| **Neutral spine dedup P2** | Stage-7 US-006 延后；spine id 重复调权 |
| Infant 0～2 chain 重写 | 不在 Stage-8 范围 |
| Trait / origin UI 合并 | 不在 Stage-8 范围 |

---

## 6. Handoff

- **A1-verify：** 本分支全 story `passes: true`；建议跑 `npm test` 全 gate  
- **内容后续：** 若长 run 被动同标题连出仍 PARTIAL，可 Stage-9 结合 agency 密度一并调  

---

**Decision:** **Stage-8 CLOSED** — 内容密度与 poor trait 最小线达标，机制层无回归
