# 四出身 0～2 岁被动链验收报告

生成时间：2026-06-17T21:57:56.336Z  
决策：**PASS**  
真源：`origin-infant-passives.json` + `selectPassiveNarrative` / `HeadlessEngineSessionImpl.passive_continue`  
对照：`childhood-origin-infant-passive-index.md` AC-X-1～AC-X-4

---

## 总览

| AC | 描述 | 方法 | 结果 |
| --- | --- | --- | --- |
| AC-X-1 | 互斥：0～2 岁被动 ID 仅本链前缀 + 共用 filler | 选择器 12 期模拟 | PASS |
| AC-X-2 | Agency：10 期无三选一、无规划占位句 | 选择器 ≥10 期 + headless 0/1/2 岁相位 | PASS |
| AC-X-3 | 差异化：两两链节点重合度 <50%，链收官 | 选择器模拟至 2 岁 | PASS |
| AC-X-4 | 继续前叙事非空、首回合无荒谬数值跳变 | headless 首 tick | PASS |

---

## AC-X-1 互斥

四出身被动推进 ID 均符合本链 `*_infant_*` 前缀或共用 filler。

允许共用：`infant_crawl_home`、`infant_passive_gap`（过渡句：「这一季你在家人怀抱与啼哭声中度过，尚不知…」）

---

## AC-X-2 Agency

| 出身 | 被动期数 | 规划违规 | 占位句命中 |
| --- | --- | --- | --- |
| 书香门第 | 12 | 0 | 0 |
| 武林世家 | 12 | 0 | 0 |
| 商贾之家 | 12 | 0 | 0 |
| 边疆异族 | 12 | 0 | 0 |

---

## AC-X-3 矩阵差异化

| 对比 | 交集 | 并集 | 重合度 | 结果 |
| --- | --- | --- | --- | --- |
| 书香门第 × 武林世家 | 0 | 10 | 0.0% | PASS |
| 书香门第 × 商贾之家 | 0 | 10 | 0.0% | PASS |
| 书香门第 × 边疆异族 | 0 | 10 | 0.0% | PASS |
| 武林世家 × 商贾之家 | 0 | 10 | 0.0% | PASS |
| 武林世家 × 边疆异族 | 0 | 10 | 0.0% | PASS |
| 商贾之家 × 边疆异族 | 0 | 10 | 0.0% | PASS |

链完成：书香门第=是；武林世家=是；商贾之家=是；边疆异族=是

---

## AC-X-4 实机回归（headless 等价）

| 出身 | 继续前空叙事 | 数值违规 | 首回合 Δ |
| --- | --- | --- | --- |
| 书香门第 | 0 | 无 | {"comprehension":1} |
| 武林世家 | 0 | 无 | {} |
| 商贾之家 | 0 | 无 | {"comprehension":1} |
| 边疆异族 | 0 | 无 | {} |

首回合禁止 `chivalry` / `internalSkill` / `martialPower` / `money` 跳变（仅审计 passive tick 本身，不含 spine）。

---

## 选择器模拟明细

### 书香门第（选择器模拟 12 期）

| 项 | 值 |
| --- | --- |
| 被动 ID 序列 | scholar_infant_01_hall_birth → scholar_infant_02_swaddle_ink → infant_passive_gap → infant_passive_gap → scholar_infant_03_grasp_brush → scholar_infant_04_trace_red → infant_crawl_home → infant_crawl_home → scholar_infant_05_corridor_steps → infant_crawl_home → infant_crawl_home → infant_crawl_home |
| 链节点（有序） | scholar_infant_01_hall_birth → scholar_infant_02_swaddle_ink → scholar_infant_03_grasp_brush → scholar_infant_04_trace_red → scholar_infant_05_corridor_steps |
| 链完成 | 是 |
| 顺序违规 | 无 |
| 互斥违规 ID | 无 |

### 武林世家（选择器模拟 12 期）

| 项 | 值 |
| --- | --- |
| 被动 ID 序列 | martial_infant_01_hall_birth → martial_infant_02_swaddle_dummy → infant_passive_gap → infant_passive_gap → martial_infant_03_grasp_wood → martial_infant_04_corridor_watch → infant_crawl_home → infant_crawl_home → martial_infant_05_yard_steps → infant_crawl_home → infant_crawl_home → infant_crawl_home |
| 链节点（有序） | martial_infant_01_hall_birth → martial_infant_02_swaddle_dummy → martial_infant_03_grasp_wood → martial_infant_04_corridor_watch → martial_infant_05_yard_steps |
| 链完成 | 是 |
| 顺序违规 | 无 |
| 互斥违规 ID | 无 |

### 商贾之家（选择器模拟 12 期）

| 项 | 值 |
| --- | --- |
| 被动 ID 序列 | merchant_infant_01_shop_birth → merchant_infant_02_swaddle_abacus → infant_passive_gap → infant_passive_gap → merchant_infant_03_grasp_scale → merchant_infant_04_counter_crawl → infant_crawl_home → infant_crawl_home → merchant_infant_05_alley_steps → infant_crawl_home → infant_crawl_home → infant_crawl_home |
| 链节点（有序） | merchant_infant_01_shop_birth → merchant_infant_02_swaddle_abacus → merchant_infant_03_grasp_scale → merchant_infant_04_counter_crawl → merchant_infant_05_alley_steps |
| 链完成 | 是 |
| 顺序违规 | 无 |
| 互斥违规 ID | 无 |

### 边疆异族（选择器模拟 12 期）

| 项 | 值 |
| --- | --- |
| 被动 ID 序列 | frontier_infant_01_camp_birth → frontier_infant_02_swaddle_wind → infant_passive_gap → infant_passive_gap → frontier_infant_03_grasp_bow → frontier_infant_04_tent_crawl → infant_crawl_home → infant_crawl_home → frontier_infant_05_rampart_steps → infant_crawl_home → infant_crawl_home → infant_crawl_home |
| 链节点（有序） | frontier_infant_01_camp_birth → frontier_infant_02_swaddle_wind → frontier_infant_03_grasp_bow → frontier_infant_04_tent_crawl → frontier_infant_05_rampart_steps |
| 链完成 | 是 |
| 顺序违规 | 无 |
| 互斥违规 ID | 无 |

---

## Headless 隔离 passive 明细

### 书香门第（headless 0/1/2 岁相位）

| 项 | 值 |
| --- | --- |
| 相位检查次数 | 3 |
| 规划选项峰值 | 0 |
| 规划/相位违规 | 0 |
| 占位句命中 | 0 |
| 继续前空叙事 | 0 |
| 首回合属性 Δ（age 0 tick） | {"comprehension":1} |
| 数值违规 | 无 |

### 武林世家（headless 0/1/2 岁相位）

| 项 | 值 |
| --- | --- |
| 相位检查次数 | 3 |
| 规划选项峰值 | 0 |
| 规划/相位违规 | 0 |
| 占位句命中 | 0 |
| 继续前空叙事 | 0 |
| 首回合属性 Δ（age 0 tick） | {} |
| 数值违规 | 无 |

### 商贾之家（headless 0/1/2 岁相位）

| 项 | 值 |
| --- | --- |
| 相位检查次数 | 3 |
| 规划选项峰值 | 0 |
| 规划/相位违规 | 0 |
| 占位句命中 | 0 |
| 继续前空叙事 | 0 |
| 首回合属性 Δ（age 0 tick） | {"comprehension":1} |
| 数值违规 | 无 |

### 边疆异族（headless 0/1/2 岁相位）

| 项 | 值 |
| --- | --- |
| 相位检查次数 | 3 |
| 规划选项峰值 | 0 |
| 规划/相位违规 | 0 |
| 占位句命中 | 0 |
| 继续前空叙事 | 0 |
| 首回合属性 Δ（age 0 tick） | {} |
| 数值违规 | 无 |

---

## 复现命令

```bash
npm run report:infant-passive-verification
npx tsx tests/infantPassiveChainVerificationTests.ts
```

关联门禁：`npm run gate:p16`、`npm run gate:playability`
