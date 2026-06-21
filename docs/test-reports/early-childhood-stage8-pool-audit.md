# Early Childhood Stage-8 — Passive Pool & Gap Baseline Audit (US-001)

**Date:** 2026-06-21  
**PRD:** `docs/PRD/early-childhood-passive-density-and-trait-line-stage8.md`  
**Design:** `docs/designs/childhood-experience-stage8-content-rules.md`  
**Repro:** `npm exec tsx scripts/runStage8PoolAudit.ts`

---

## 1. Executive summary

| 指标 | Baseline (Stage-7 终验) | Stage-8 目标 |
| --- | --- | --- |
| Gap 步 / 35 步 / 出身 | **4～5** | **≤2** |
| Passive bleed (3～7) | 0 | 0 |
| Poor trait spine (3～7) | **0** | **≥1** |
| Street trait spine (3～7) | 1 (`p22_childhood_street_shaping`, age 6–10) | 保持 |

**根因：** `selectPreschoolPassiveEntry` 优先非 neutral 池；各出身 exclusive 条目仅 **3 条/出身**（age band 稀疏），history 去重 + title dedup 后易回落 `preschool_passive_gap`（轮换 neutral 标题）。

**Stage-8 动作：** 每出身新增 **≥2** passive（US-003）；poor trait spine **≥1**（US-004）；`primaryOriginFlagTests` 接入 CI（US-002）。

---

## 2. Final playtest gap baseline（Stage-7 终验）

来源：`docs/test-reports/early-childhood-opening-experience-final-playtest.md`（2026-06-21）

| 出身 | Gap 步 / 35 步 |
| --- | --- |
| 书香门第 | **5** |
| 武林世家 | **4** |
| 商贾之家 | **4** |
| 边疆异族 | **4** |

Gap 判定：`scripts/runEarlyChildhoodFinalPlaytest.ts` 中 `GAP_TITLE_MARKERS` + `isGapPassiveTitle`（含 `preschool_passive_gap` id 与占位标题「本期暂无强求的江湖变故」等轮换 neutral 标题）。

套件 bleed / 占位 / 3～4 规划：**PASS**；被动同标题连出：**PARTIAL**（边疆 seed 连出 3）。

---

## 3. Eligible passive pool depth（origin × age 3–7）

计数口径：`preschool-passive-spine.json` + `infantPassiveNarrativeCatalog`（`ageMin ≥ 3 && ageMax ≤ 7`）合并 catalog；对玩家 origin tag 集合 `{neutral, <origin>}` 调用 `isPreschoolPassiveEligible`。

格式：`总数 (exclusive e + neutral n)`

| Origin | Age 3 | Age 4 | Age 5 | Age 6 | Age 7 |
| --- | --- | --- | --- | --- | --- |
| scholar | 4 (3e+1n) | 3 (2e+1n) | 2 (2e+0n) | 3 (3e+0n) | 3 (3e+0n) |
| martial | 4 (3e+1n) | 4 (3e+1n) | 2 (2e+0n) | 3 (3e+0n) | 3 (3e+0n) |
| merchant | 4 (3e+1n) | 4 (3e+1n) | 2 (2e+0n) | 3 (3e+0n) | 3 (3e+0n) |
| frontier | 4 (3e+1n) | 4 (3e+1n) | 2 (2e+0n) | 3 (3e+0n) | 3 (3e+0n) |

**观察：**

- 四出身对称：config 内各 **3** 条 exclusive passive（`preschool-passive-spine.json`）。
- Age **5** exclusive 池最薄（2 条），与 35 步 run 中多次落入 neutral/gap 相关。
- Infant catalog 为 age 3–4 补充 1 条 neutral/出身（`clever_speech` 等共享 spine 映射）。

---

## 4. Poor trait spine inventory（age 3–7）

`inferTraitLineExclusiveFlag` 扫描全事件 catalog：

| Event id | Age range | Trait line |
| --- | --- | --- |
| `p22_childhood_street_shaping` | 6–10 | **origin_streetborn**（street） |

**Poor (`origin_poor_family`)：** **0** 条 age 3–7 trait-line spine — 与 PRD G2 / 终验「Poor trait spine」观察一致。

Street 线已有 P22；poor 线 gate（`isTraitLineSpineEligible`）已就绪，缺内容。

---

## 5. Proposed new passive slots（2–4 / 出身，仅草图）

满足 US-003「≥2 新条目/出身」；主题贴合出身、避开现有 title。

### 书香门第 (scholar)

| 草图 title | Age band | 主题 |
| --- | --- | --- |
| 蒙学跟读 | 4–5 | 跟兄长念千字文，错字被温言纠正 |
| 雨巷听书 | 5–6 | 雨天在廊下听先生讲史，记下半句警句 |
| 砚边涂鸦 | 3–4 | 偷蘸墨在案上画圈，被笑称「未来画师」 |

### 武林世家 (martial)

| 草图 title | Age band | 主题 |
| --- | --- | --- |
| 木人试拳 | 5–6 | 对练功木人乱拳，拳风虽弱却有架势 |
| 晨雾跑桩 | 4–5 | 雾中跟师兄绕桩，喘得厉害却不肯停 |
| 跌打药酒 | 3–4 | 跌了一跤被敷药酒，记住辛辣气味 |

### 商贾之家 (merchant)

| 草图 title | Age band | 主题 |
| --- | --- | --- |
| 柜台数货 | 5–6 | 帮伙计数布匹，数到十便得意 |
| 议价旁听 | 4–5 | 帘后听父亲与客人还价，学「再添一文」 |
| 秤杆平衡 | 3–4 | 玩小秤砣，被教「轻重要公平」 |

### 边疆异族 (frontier)

| 草图 title | Age band | 主题 |
| --- | --- | --- |
| 风沙掩目 | 5–6 | 风起沙扬，第一次被教用袖遮面 |
| 毡帐炊烟 | 4–5 | 跟母亲看帐外炊烟，辨风向与归人 |
| 蹄印初识 | 3–4 | 泥地马蹄印，被指认「几骑来过」 |

---

## 6. Non-goals（本 Stage 不改）

- `isPreschoolPassiveEligible` / spine gate 语义
- 8～12 agency（Stage-9）
- Neutral spine 重复调权 P2（Stage-7 US-006）

---

## Appendix A — CI wiring（US-002）

`tests/primaryOriginFlagTests.ts` 已接入 `tests/runRealTestGate.ts`，位于 `spineOriginConfigValidationTests` 之后：

```bash
npm exec tsx tests/primaryOriginFlagTests.ts
# 或完整 gate：
npm test
```

覆盖：`EventExecutor` 四主 `flag_set` 互斥清除、`resolvePrimaryOriginFamilyFlag` 在冲突 flag 下以 `origin_background` 事件记录为准、边疆 primary 后 passive 无 foreign bleed。

---

**Decision:** 审计完成 — 可并行 US-003（passive 加厚）与 US-004（poor spine）
