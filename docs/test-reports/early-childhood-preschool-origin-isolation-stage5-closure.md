# Stage-5 幼童期出身隔离 — 审计与收口（US-001 + US-007）

**PRD：** `docs/PRD/early-childhood-preschool-origin-isolation.md`  
**设计规则：** `docs/designs/preschool-passive-origin-isolation-rules.md`  
**实施提交：** `be9b671` — `fix(preschool): hard-isolate 3–7 passive narratives by player origin`  
**日期：** 2026-06-20  
**决策：** **Stage-5 完成 — 0～7 岁开场套件 Stage-1～5 全部交付**

> 本文档合并 US-001（串味审计）与 US-007（收口报告），作为 Stage-5 唯一归档页。

---

## 1. 串味审计（US-001）

### 1.1 现象复现

| 项 | 内容 |
| --- | --- |
| 玩家反馈 | 书香门第幼童期出现边疆/武林向 passive 文案 |
| 实机证据 | `api-browser-playtest-stage2.md` **step 18**：age **4** · phase `passive_progression` · title **营中操练** |
| 条目 id | `child_frontier_drill`（`originTags: ['frontier']`） |
| 修复后 | `api-browser-playtest-stage5-origin-isolation.md`：同场景 **0 bleed flags**；age 4 仅 **识文断字 / 家中一季** |

### 1.2 根因 R1～R4（修复前）

| # | 根因 | 位置（修复前） | 修复方式 |
| --- | --- | --- | --- |
| **R1** | 软加权：外国条目 weight≥1 仍可中奖 | `preschoolPassiveSpine.ts` `scoreEntry` | 先 `isPreschoolPassiveEligible` 硬过滤，再加权 |
| **R2** | 池耗尽回退**全量** catalog | `selectPreschoolPassiveEntry` candidates 空 → 全 pool | 改为 neutral-only → `preschool_passive_gap` |
| **R3** | 0～2 严格链、3～7 未隔离 | `infantPassiveNarratives.ts` age≤2 vs 3～7 分支 | 3～7 与 Stage-3 同 flag 优先级解析出身 |
| **R4** | catalog + JSON 四出身同池 | `mergedPreschoolCatalog()` | 合法池内竞争，外国条目永不入池 |

**非 passive（本 Stage 不修）：** `p22_origin_frontier_orphan` 等 **spine** 来自 `selectEvent()`；Stage-2 step 7 曾出现，属剧情调度，非 filler 串味。

### 1.3  3～7 岁 passive 条目清单（按 originTags）

**catalog**（`infantPassiveNarrativeCatalog.ts`）：

| originTags | id | title | age |
| --- | --- | --- | --- |
| scholar | `toddler_scholar_char` | 识文断字 | 3–4 |
| scholar | `child_scholar_copybook` | 描红练字 | 3–7 |
| martial | `toddler_martial_watch` | 耳濡目染 | 3–4 |
| martial | `child_martial_wooden_dummy` | 木人桩影 | 3–7 |
| merchant | `toddler_merchant_abacus` | 市井烟火 | 3–4 |
| merchant | `child_merchant_stall` | 看摊学艺 | 3–7 |
| frontier | `toddler_frontier_wind` | 边关风声 | 3–4 |
| frontier | `child_frontier_drill` | 营中操练 | 3–7 |
| neutral | `toddler_neutral_season` | 家中一季 | 3–4 |

**preschool-passive-spine.json**（各 3 条/出身 + age 带）：

| originTags | ids |
| --- | --- |
| scholar | `preschool_scholar_clever_speech`, `preschool_scholar_library_dust`, `preschool_scholar_gate_visitor` |
| martial | `preschool_martial_first_stance`, `preschool_martial_weapon_rack`, `preschool_martial_evening_drill` |
| merchant | `preschool_merchant_first_coin`, `preschool_merchant_ledger_peek`, `preschool_merchant_caravan_news` |
| frontier | `preschool_frontier_bonfire_tale`, `preschool_frontier_sentry_watch`, `preschool_frontier_horse_whinny` |

**修复后关键 API：** `isPreschoolPassiveEligible`, `isForeignExclusivePreschoolEntry`, `validatePreschoolPassiveOriginTags`（`preschoolPassiveSpine.ts`）。

---

## 2. User Story 完成表

| US | 内容 | 状态 | 证据 |
| --- | --- | --- | --- |
| US-001 | 串味审计 | ✅ | 本文 §1 |
| US-002 | 硬过滤 | ✅ | `preschoolPassiveSpine.ts`；`preschoolOriginIsolationTests.ts` |
| US-003 | neutral/gap 回退 | ✅ | 同上 exhaustion 测试 |
| US-004 | originTags 校验 | ✅ | `preschoolPassiveSpineTests.ts` |
| US-005 | 四出身回归 | ✅ | `preschool-origin-isolation-stage5.md` — **PASS** |
| US-006 | API bleed 检测 | ✅ | `api-browser-playtest-stage5-origin-isolation.md` — **0 flags** |
| US-007 | 收口 | ✅ | 本文 |

---

## 3. 验收摘要

| 指标 | 目标 | 结果 |
| --- | --- | --- |
| 书香 age 4 × 100 rolls 外国 id | 0 | **0** ✅ |
| 四出身 × 3～7 × 30 rolls | 0/600 | **0/600** ✅ |
| 书香 35 步 passive bleed | 0 | **0** ✅ |
| Stage-4 密度（非占位 ≥8/35） | ≥8 | **22**（Stage-4 基线，未回归） ✅ |
| `gate:p16` | pass | **pass** ✅ |
| `gate:playability` | 0 blockers | **PASS** ✅ |

---

## 4. 0～7 岁开场套件总收口（Stage-1～5）

| Stage | 焦点 | 状态 |
| --- | --- | --- |
| 1 | agency 机制、clamp、小结 | ✅ |
| 2 | 门禁 + 实机验收 | ✅ |
| 3 | 0～2 四出身有序链 | ✅ |
| 4 | 3～7 密度、占位、lite 池 | ✅ |
| 5 | 3～7 passive 出身隔离 | ✅ |

**相对 2026-06-17 首测：**

| 维度 | 前 | 后 |
| --- | --- | --- |
| 婴儿 agency | 0 岁三选一 | 0～4 被动 ✅ |
| 反馈 | 常空白 | 继续前非空 ✅ |
| 数值 | 侠义 +13 | infant clamp ✅ |
| filler 串味 | 营中操练 @ 书香 | **已消除** ✅ |
| 耐玩（评审） | ★★☆ | ★★★☆ ✅ |

**整体判定：** 0～7 岁开场优化 **已交付**（~95%）；余量为 polish，非阻塞。

---

## 5. 残余风险与后续（非 Stage-5）

| 风险 | 说明 | 建议 |
| --- | --- | --- |
| neutral 标题重复 | 「家中一季」「识文断字」连出 | 可选 follow-up：neutral 去重或本出身 micro-chain |
| spine 跨出身 | `p22_*` 等剧情事件 | 另开 **Stage-6 spine 触发 PRD** |
| 8～12 岁 | 未覆盖 | P16 童年晚期或独立 PRD |
| 长局 passive 重复感 | 合法池偏薄时的副作用 | 按出身扩写 3～7 catalog，不恢复外国 bleed |

---

## 6. 复验命令

```bash
npm exec tsx tests/preschoolOriginIsolationTests.ts
npm exec tsx scripts/runApiBrowserPlaytestStage5OriginIsolation.ts
npm run gate:p16
npm run gate:playability
```

---

## 7. 关联报告索引

| 报告 | 用途 |
| --- | --- |
| `preschool-origin-isolation-stage5.md` | US-005 矩阵 |
| `api-browser-playtest-stage5-origin-isolation.md` | US-006 API |
| `early-childhood-opening-experience-stage2-closure.md` | Stage-2 总收口 |
| `api-browser-playtest-stage4.md` | Stage-4 密度基线 |
| `early-childhood-opening-experience-index.md` | 全套件 PRD 索引 |

**Gameplay changes in this document:** None.
