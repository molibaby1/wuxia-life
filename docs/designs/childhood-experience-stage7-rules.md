# 幼年体验 Stage-7 设计规则（Spine 扩 band · Trait 线 · Neutral 去重）

**状态：** 规划（待实施）  
**前置：** Stage-5 passive 隔离、Stage-6 spine 隔离（0～7 P0 band）  
**关联 PRD：** `docs/PRD/early-childhood-childhood-experience-stage7.md`  
**Stage-6 残余：** `docs/test-reports/early-childhood-spine-origin-isolation-stage6-closure.md` §4

---

## 1. 问题域

Stage-6 在 `getAvailableEvents` 路径对 age ≤ 7 的 origin-exclusive spine 做了硬门禁，但 closure §4 仍留三类缺口：

| # | 缺口 | 当前行为 | 玩家可见症状 |
| --- | --- | --- | --- |
| G1 | **8～12 spine band** | `SPINE_ORIGIN_EXCLUSIVE_AGE_MAX = 7`，age > 7 一律放行 | 8～12 岁仍可能抽到外国出身 spine（若 catalog 有 origin-exclusive 条目） |
| G2 | **daily 回退路径** | `selectEvent` 无 formal 候选时走 `dailyEventSystem.selectEvent`，不经 `getAvailableEvents` 门禁 | 今日 daily pool 无 origin-exclusive 语义，但 **未来** catalog 加 tag 或 runtime 变体带 stageFit 时会 bypass |
| G3 | **trait 线 spine** | Stage-6 只 block「四主出身 foreign exclusive」；`origin_poor_family` / `origin_streetborn` 条件仍可解锁 **trait 向** P22 事件 | 书香 + poor_family trait 可能仍见贫寒/街头 shaping 文案，与主出身叙事并存时「串味」 |
| G4 | **neutral 重复** | Stage-5 仅隔离，未去重；neutral pool 共享 + history 仅按 id | 3～7 passive 或 0～7 spine 反复出现相同标题（如 clever_speech 变体、neutral filler 标题） |

---

## 2. 冻结策略（Stage-7）

### 2.1 Spine gate 扩 band（G1 + G2）

**决策：统一常量 + 双路径接线，不做二选一。**

| 动作 | 落点 | 说明 |
| --- | --- | --- |
| 常量 | `src/p16/spineOriginIsolation.ts` | `SPINE_ORIGIN_EXCLUSIVE_AGE_MAX`: **7 → 12**（与 PRD Q1 默认、设计 §3.2「可扩展至 12」一致） |
| 主路径 | `GameEngineIntegration.getAvailableEvents` | 已有；随常量自动扩 band |
| 回退路径 | `DailyEventSystem.selectEvent` **或** `GameEngineIntegration.selectEvent` daily 分支 | 对 `buildEvent()` 产出的 `EventDefinition` 调用 `isSpineOriginEligible`；exclusive 且 mismatch → 从 candidates 剔除（**硬过滤**，非降权） |
| 审计 band | 测试矩阵 | P0 仍强制 **0～7**（Stage-6 回归）；P1 新增 **8～12** 抽样 |

**不推荐：** 仅扩常量不审计 8～12 catalog — 可能误杀未分类条目或漏掉 bleed。

**daily 池现状（2026-06）：** `src/data/life/dailyEvents.ts` 按 trait weight，无 `origin_*` stageFit。接线为 **防御性**：catalog 变更时不回归。

### 2.2 Trait 线事件治理（G3）

**决策：主出身权威不变；trait 线事件单独 eligibility 层。**

```
age ≥ 1 且 resolvePrimaryOriginFamilyFlag(state) = P（四主之一）
  → 四主 foreign exclusive spine：必须 match P（Stage-6，保持）
  → trait-line spine（inferTraitLineExclusiveFlag）：仅当 trait flag 与事件声明一致，且不与 P 冲突

resolvePrimaryOriginFamilyFlag = null（origin_background 前）
  → trait startingFlags 可解锁 trait-line 事件（贫寒/街头 formative）
  → 四主 exclusive 仍 blocked（无 P 时不误开 foreign 主出身池）
```

**Trait-line 判定（配置 + 运行时）：**

| 事件条件 / flag | 归类 |
| --- | --- |
| `origin_poor_family`（无四主 OR 与主 flag 并存） | trait-line: poor |
| `origin_streetborn` | trait-line: street |
| `p22_frontier_orphan_shaped` 等 shaping 后继 | 跟随前置 trait/frontier 规则，审计时挂链 |
| 四主 `origin_*_family` / `origin_frontier` exclusive | 主出身 exclusive（Stage-6） |

**并存规则（冻结）：**

- 书香 + `origin_poor_family`：**不得**见 frontier/scholar/martial/merchant **foreign** exclusive（Stage-6 ✅）
- 书香 + `origin_poor_family`：**可以**见 poor-line 事件 **若** PRD 产品确认「贫寒底色」；**不得**见 street-line；反之亦然
- trait-line 与主出身 spine **同 period 互斥** 不强制；但 foreign 主出身 exclusive 永远 hard block

**实现落点候选：**

- `src/p16/traitLineSpineEligibility.ts`（新）或扩展 `spineOriginIsolation.ts`
- `inferTraitLineExclusiveFlag(event)` + `isTraitLineSpineEligible(event, state)`
- CI：扩展 `spineOriginConfigValidation.ts` — poor/street 条件不得与四主 OR 同 branch（Stage-6 已有 warn，Stage-7 对 trait-line 条目 whitelist）

### 2.3 Neutral passive 标题去重（G4）

**决策：Stage-5 合法池内增加「近期标题抑制」，可选轻量 micro-chain。**

| 层级 | 范围 | 策略 |
| --- | --- | --- |
| Passive 3～7 | `selectPreschoolPassiveEntry` | 候选 scoring 中：若 `entry.title` 与最近 N（建议 **5**）条 passive history 标题相同 → weight × 0 或剔除 |
| Spine neutral | `getAvailableEvents` / repetition multiplier | 扩展 `NEUTRAL_SPINE_EVENT_IDS` 去重：同 id 家族（如 toddler_*）共用 repetition key |
| Micro-chain（P2） | 每出身 neutral | 3～4 条顺序 neutral micro-chain，dequeue 优先于纯随机 — **非 P0** |

**不动：** Stage-5 硬隔离逻辑、`isPreschoolPassiveEligible` 语义、origin+neutral → neutral-only → gap 回退顺序。

---

## 3. 验收口径（摘要）

| 指标 | 目标 |
| --- | --- |
| Stage-6 回归 | `preschoolOriginIsolationTests` + `spineOriginIsolationTests`（0～7 矩阵）**不回归** |
| Spine 8～12 | 四出身 × age {8,9,10,11,12} × 30 rolls：foreign exclusive id **0%** |
| Daily 回退 | headless：强制走 daily 分支时，注入 mock exclusive daily → **不得**选中 mismatch |
| Trait-line | 四主 × {poor_family, streetborn, none} × age 1～7：foreign exclusive **0%**；trait-line 仅匹配 trait |
| Neutral 去重 | 书香 age 3～7 × 50 passive：同一 title 连续出现 **≤2**；35 步内 top title 占比 **≤25%** |
| Gates | `gate:p16`、`gate:playability` pass |

---

## 4. 非目标

- 8～12 全量 spine **内容重写**（仅 gate + 审计 + 明显错误配置）
- 0～2 infant quest 链改动（Stage-3）
- 替换 `selectEvent` 加权架构
- poor/street **新内容量产**（除非审计证明池空）
- `.prd.json` 生成

---

**设计版本：** 0.1 · 2026-06-21
