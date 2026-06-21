# 幼年体验 Stage-8 设计规则（Passive 池加厚 · Poor trait 线 · Gap 收口）

**状态：** 已实施（2026-06-21）  
**前置：** Stage-1～7 机制验收 PASS（`early-childhood-opening-experience-final-playtest.md`）  
**关联 PRD：** `docs/PRD/early-childhood-passive-density-and-trait-line-stage8.md`  
**总验收证据：** 四出身 bleed 0；primary flag 冲突已在 `EventExecutor` flag_set 层修复

---

## 1. 问题域（来自总验收）

| # | 观察 | 数据 | 玩家感受 |
| --- | --- | --- | --- |
| G1 | **Gap / 轮换 neutral 被动偏多** | 四出身 35 步各 **4～5** gap 步 | 幼童期像「填空日历」，本出身场景不够 |
| G2 | **Poor trait 无 spine 内容** | trait gate 已有；catalog 几乎仅 `p22_childhood_street_shaping`（street） | 寒门 trait 只有 flag，缺 formative 叙事 |
| G3 | **Passive 同标题连出（边缘）** | 边疆 seed 连出 3（目标 ≤2） | Stage-7 去重已大幅改善，长 run 仍偶发 |
| G4 | **8～12 内容与 agency** | 35 步终龄 >7；gate 已有，密度未做 | **本 Stage 不覆盖** → Stage-9 |

---

## 2. 冻结策略

### 2.1 Passive 池加厚（G1 — P0）

**原则：** 只加 **本出身 + neutral** 条目；不引入 foreign tag；不改变 Stage-5 `isPreschoolPassiveEligible`。

| 动作 | 落点 |
| --- | --- |
| 审计各出身 3～7 合法池深度 | `preschool-passive-spine.json` + `infantPassiveNarrativeCatalog` 按 tag 计数 |
| 每出身新增 **2～4** 条 passive（或扩展现有 age band） | 同一 schema：`originTags`, `ageMin/Max`, `title`, `text` |
| 验收 | `runEarlyChildhoodFinalPlaytest.ts`：35 步 **gap 步 ≤2/出身**（baseline 4～5） |

**禁止：** 为填池降低 isolation 或回退到全量 pool。

### 2.2 Poor trait spine 最小集（G2 — P0）

| 动作 | 说明 |
| --- | --- |
| 新增 1～2 个 age 3～7 **trait-line** spine/auto 或 choice 事件 | 条件仅 `origin_poor_family`（不得 OR 四主 foreign flag） |
| 与 `isTraitLineSpineEligible` 对齐 | poor 线仅 poor flag；与四主 primary 并存时允许「贫寒底色」 |
| 参考 | `p22_childhood_street_shaping` 结构；tone 贫寒/节用/早慧，非边疆/商贾文案 |

### 2.3 Primary flag 回归（补丁收口）

| 动作 | 说明 |
| --- | --- |
| `EventExecutor` 设置四主 flag 时清除其他四主 flag | 已实现 |
| `tests/primaryOriginFlagTests.ts` 接入 `runRealTestGate.ts` | Stage-8 US-002 |

### 2.4 非目标（Stage-9+）

- 8～12 岁 P16 agency 形态与 spine 密度重写
- Neutral **spine** id 重复调权（Stage-7 US-006 P2）
- 修改 `origin_background` 四选一 UI

---

## 3. 验收口径

| 指标 | 目标 |
| --- | --- |
| Final playtest passive bleed | **0**（四出身） |
| Final playtest gap 步 / 35 步 | **≤2** 每出身 |
| Poor trait 局 age 3～7 | ≥1 poor-line spine 可触发（headless 或矩阵） |
| `primaryOriginFlagTests` | CI pass |
| Stage-5/6/7 隔离测试 | 不回归 |

---

**设计版本：** 0.1 · 2026-06-21
