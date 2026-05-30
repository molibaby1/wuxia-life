# P3 Midlife Experience and Trust Hardening — Route Contradiction Audit (US-015)

生成时间：2026-05-31

Story：**US-015 Audit Priority Route Contradictions**

权威输入：`docs/test-reports/p3-midlife-baseline.md`（W7）、`docs/test-reports/p3-midlife-trust-targets.md`（§3.4 B2）、`src/data/route-conflict-table.json`、`scripts/goldenLineGate.ts`。

本报告将 golden-line gate 的 route contradiction warning 追踪到具体事件、效果与引擎行为，供 **US-016 Fix Priority Route Contradictions** 做根因修复。未修改业务代码。

---

## 1. 摘要

| 维度 | 结论 |
| --- | --- |
| P3-GL 0–30 deterministic 样本触发 contradiction warning | **1/4**（仅 `golden-neutral-baseline`） |
| 矛盾路线对 | **sect + demonic**（`strong_exclusion`） |
| 终态 lifecycle | 两者均为 `active`，`lockedIn=false` |
| 主因分类 | **event data**（`sect_faction` 侧路写入）+ **route conflict rules**（门禁仅查 `lockedIn`）+ **simulation fallback**（neutral 无 route-track isolation） |
| P2-LEGACY 同类观察 | `official-track` 终态同样 sect+demonic active，但 **不在** golden-line gate 队列 |
| Priority-route 样本为何无矛盾 | `GameProcessSimulator.enforceRouteTrackIsolation()` 在 routeTrack 样本每 tick 清除互斥路线 |

**US-016 修复入口（优先级）：**

1. `sect_faction=unconventional` 经 `RouteStateManager` 激活 `demonic`，但 **不** 停用 `sect`、**不** 清除 `route_orthodox`。
2. `outlaw_identity_beginning` 可在已有 `route_orthodox` 时触发，效果只写 `sect_faction`，无 turn / 无 `route_demonic` 显式转向。
3. `GameEngineIntegration.passesRouteConflictChecks` 仅在 **lockedIn** 路线存在时阻断候选事件；本矛盾两条路线均未锁定。
4. neutral 样本无 routeTrack fixture isolation，真实暴露上述缺口；priority 样本被仿真层「消毒」掩盖。

---

## 2. 盘点方法

### 2.1 范围

| 队列 | 样本 | 终点年龄 | Gate 是否计 contradiction |
| --- | --- | ---: | --- |
| P3-GL | `golden-sect`, `golden-wanderer`, `golden-demonic`, `golden-neutral-baseline` | 30 | 是（continuity / route_health） |
| P2-LEGACY（上下文） | `official-track` 等 | 85 | 否（US-002 N7；仅 audit 参考） |

### 2.2 矛盾判定（与 gate 一致）

来源：`scripts/goldenLineGate.ts` → `detectRouteContradictions`

- 读取 `route-conflict-table.json` 中 `level=strong_exclusion` 的 priority 路线对。
- 终态 `routeStates` 中，若一对路线的 lifecycle 均 ∈ `{active, locked_in, temporary}` → 记为 contradiction。
- `golden-neutral-baseline` 无 `routeTrack` → severity **warning**；有 `routeTrack` 的样本 → **blocker**。

### 2.3 追踪字段

每条矛盾链记录：**age → eventId → choiceId → effects → flags 变化 → routeStates 变化 → routeHistory reason**。

复现命令：

```bash
npm run gate:golden-line
WUXIA_ENGINE_QUIET=1 ./node_modules/.bin/tsx scripts/runGoldenLineGate.ts
```

---

## 3. Deterministic 样本 contradiction 矩阵

| Sample | routeTrack | seed | Contradiction | 终态 active routes | 终态 route flags |
| --- | --- | ---: | --- | --- | --- |
| `golden-sect` | sect | 301 | **无** | sect:active | `route_orthodox` |
| `golden-wanderer` | wanderer | 302 | **无** | wanderer:active | `route_wanderer` |
| `golden-demonic` | demonic | 303 | **无** | demonic:**completed**（非 active） | `route_demonic`, `route_demonic_completed` |
| **`golden-neutral-baseline`** | neutral | 304 | **sect+demonic** | sect:active, demonic:active | `route_orthodox`（无 `route_demonic`） |

Gate 输出（W7，2026-05-30 基线一致）：

```text
continuity | warning | Route contradiction: sect and demonic both active (strong_exclusion)
sampleId: golden-neutral-baseline
```

---

## 4. 主矛盾链：golden-neutral-baseline（RC-01）

### 4.1 时间线

| Age | Event | Choice | Route 变化 | 关键 flags |
| ---: | --- | --- | --- | --- |
| 13 | `sect_path_choice` | `join_orthodox` | **sect** inactive→**active** | `route_orthodox=true` |
| 14 | `orthodox_initiation` | — | sect 保持 active | `route_orthodox` |
| 15–22 | love / daily / setback 链 | 多选 | sect 保持 active | `route_orthodox`, `orthodox_trial_active` |
| **23** | **`outlaw_identity_beginning`** | **`join_outlaw_conditional`** | **demonic** inactive→**active** | `sect_faction=unconventional`, `current_sect=shadow_sect`, **`route_orthodox` 仍为 true** |
| 24–29 | `outlaw_cultivation`, `outlaw_rise` 等 | — | sect + demonic 并存至 30 岁 | 同上 |

### 4.2 激活 sect 的精确效果（age 13）

事件：`sect_path_choice`（`youthEvents.json` / `sect-wudang.json`）

| 字段 | 值 |
| --- | --- |
| Choice | `join_orthodox` |
| Effects | `flag_set route_orthodox`; chivalry +10; relation master |
| Route 写入 | `RouteStateManager.syncFromFlagSet` → `route_orthodox` → **sect:active** |
| routeHistory | `{ routeId:"sect", from:"inactive", to:"active", age:13, reason:"sync_flag:route_orthodox" }` |

### 4.3 激活 demonic 的精确效果（age 23）

事件：`outlaw_identity_beginning`（`identity-demon.json`，active/candidate 线）

| 字段 | 值 |
| --- | --- |
| Choice | `join_outlaw_conditional` |
| Outcome | `success`（条件 `chivalry >= 0`；仿真时 chivalry≈13） |
| Effects | `outlaw_identity_done`; **`sect_faction=unconventional`**; `current_sect=shadow_sect`; stats |
| **未写入** | `route_demonic`、任何 `route_turn` metadata、sect 路线 `failed`/`turned` |
| Route 写入 | `FlagSetHandler` → `RouteStateManager.syncFromFlagSet(sect_faction, "unconventional")` → **demonic:active** |
| routeHistory | `{ routeId:"demonic", from:"inactive", to:"active", age:23, reason:"sync_flag:sect_faction" }` |
| sect 状态 | **未变**（仍 active，`reason: sync_flag:route_orthodox`） |

### 4.4 终态快照（age 30）

```json
{
  "routeStates": {
    "sect": { "lifecycle": "active", "lockedIn": false },
    "demonic": { "lifecycle": "active", "lockedIn": false }
  },
  "routeFlags": ["route_orthodox"]
}
```

**语义冲突：** 玩家 flag 仍显示「正道入门」（`route_orthodox`），但 `sect_faction=unconventional` 且 `current_sect=shadow_sect`；`routeStates` 同时认定 sect 与 demonic 为 active 主路线。

---

## 5. 根因分类

### 5.1 RC-01-A — Event data（主因）

| ID | 问题 | 位置 | 说明 |
| --- | --- | --- | --- |
| **ED-01** | `outlaw_identity_beginning` 无 orthodox 互斥条件 | `identity-demon.json` | 条件仅检查 `!current_sect`、`!outlaw_identity_done`；**不**检查 `route_orthodox` / sect active |
| **ED-02** | 效果用 `sect_faction` 而非显式路线转向 | 同上 | 写入 `sect_faction=unconventional`，**不** 设 `route_demonic`，**不** unset `route_orthodox` |
| **ED-03** | 无 turn / betrayal metadata | 同上 | 不满足 US-016 要求的 explicit turn event |
| **ED-04** | 对照：`outlaw_path_beginning` 双写 | `identity-outlaw.json` | 同时 `sect_faction` + `route_demonic`；仍不清理 `route_orthodox`，但至少有显式 demonic flag |

`FlagSetHandler` 在 `sect_faction=unconventional` 时仅删除 `orthodox_member`，**保留** `route_orthodox`（`EventExecutor.ts`）。

### 5.2 RC-01-B — Route conflict rules / 引擎门禁（主因）

| ID | 问题 | 位置 | 说明 |
| --- | --- | --- | --- |
| **RR-01** | `sect_faction` → demonic 隐式映射 | `RouteStateManager.FACTION_TO_ROUTE_ID` | `unconventional` 激活 demonic route，与显式 `route_demonic` 等效，但无冲突解析 |
| **RR-02** | 冲突门禁仅查 **lockedIn** | `GameEngineIntegration.passesRouteConflictChecks` | `getLockedCoreRoutes()` 过滤 `lockedIn=false` → outlaw 事件 **不被** strong_exclusion 阻断 |
| **RR-03** | Gate 终态查 active，运行时门禁查 locked | gate vs runtime 不一致 | 允许「双 active 未锁定」进入终态，gate 才报警 |
| **RR-04** | `resolveRouteConflict` 规则正确但未覆盖侧路 | `route-conflict-table.json` sect+demonic | 规则本身无误；缺口在 enforcement 范围 |

### 5.3 RC-01-C — Simulation choice strategy（促成因素）

| ID | 问题 | 说明 |
| --- | --- | --- |
| **SS-01** | `choiceTendency=balanced` 选中 `join_outlaw_conditional` | balanced 对 outlaw 选项无负分；`chivalry>=0` 分支在 age 23 命中 |
| **SS-02** | age 13 选中 `join_orthodox` | neutral 无 routeTrack 偏置；balanced 对 martial/chivalry 正效应默认加分，未强制 `stay_wanderer` |
| **SS-03** | 确定性可复现 | seed=304 固定 replay；非随机波动 |

仿真策略 **触发** 矛盾链，但 **不** 制造 sect+demonic 双写的数据/引擎缺口；换 seed 仍可能在 neutral 下复现同类结构。

### 5.4 RC-01-D — Simulation fallback / isolation（掩蔽因素）

| ID | 机制 | 位置 | 效果 |
| --- | --- | --- | --- |
| **FB-01** | `enforceRouteTrackIsolation` | `GameProcessSimulator.ts` | routeTrack 样本每 tick 清除互斥 `route_*` 并 `deactivateRoute` |
| **FB-02** | wanderer 短暂 demonic 被抹除 | golden-wanderer replay | age 24 `outlaw_identity_beginning` 曾激活 demonic，同 tick isolation → demonic→inactive |
| **FB-03** | sect/demonic fixture 预写单路线 | `applyRouteTrackFixtureBootstrap` | priority 样本不经过 neutral 的「先 orthodox 后 outlaw」路径 |

**结论：** priority-route 样本 **0 contradiction** 部分归功于仿真层 isolation，**不能** 证明 event/runtime 已安全；neutral baseline 才是有效探测器。

---

## 6. 次要观察：P2-LEGACY official-track（RC-02）

| 字段 | 值 |
| --- | --- |
| Sample | `official-track`（seed 201, routeTrack=official, years=85） |
| 矛盾终态 | sect:**active**, demonic:**active**, official:**completed** |
| 激活链 | age 13 `sect_path_choice`→`join_orthodox`；age 19 `outlaw_identity_beginning`→`join_outlaw_conditional` |
| Gate | experience / golden-line **不** 计 contradiction（US-002 N7） |
| 与 RC-01 关系 | **同一 event data + sect_faction 侧路**；额外 official 路线 completed，不消除 sect+demonic 互斥 |

US-016 修复 RC-01 后，应顺带验证 legacy 样本终态不再出现 sect+demonic 双 active。

---

## 7. 相关路线规则上下文

`route-conflict-table.json` priority pair：

| routeA | routeB | level | resolution |
| --- | --- | --- | --- |
| sect | demonic | strong_exclusion | block_candidate |
| hero | demonic | strong_exclusion | block_candidate |

当前缺口：**block_candidate 未在 sect active（未锁定）时阻止 demonic 侧路激活**。

soft_exclusion 对照（本 audit 未触发 contradiction warning）：

- sect + wanderer：soft_exclusion，unlocked 允许 temporary coexistence。
- golden-neutral 终态 wanderer=inactive，未测 soft 冲突。

---

## 8. US-016 修复建议（按 leverage 排序）

| 优先级 | 建议 | 针对根因 | 验收 |
| ---: | --- | --- | --- |
| P0 | `sect_faction` 写入时同步路线 lifecycle：切到 unconventional 须 **fail/turn sect** 或 **require turn event** | ED-02, RR-01 | neutral 终态 contradiction count=0 |
| P0 | `passesRouteConflictChecks` 扩展至 **active/locked_in** 的 strong_exclusion 对，不仅 lockedIn | RR-02, RR-03 | outlaw 在 sect active 时被 selectEvent 阻断 |
| P1 | `outlaw_identity_beginning` 增加 `route_orthodox`/sect active 前置或 metadata `routeTransition: turn` | ED-01, ED-03 | 显式转向链 + routeHistory reason |
| P1 | `FlagSetHandler`：`sect_faction=unconventional` 时 unset `route_orthodox` 或触发 sect failed | ED-01 | flags 与 routeStates 一致 |
| P2 | neutral 样本保留无 isolation（继续作探测器）；priority 样本 isolation 可保留作 test fixture | FB-01 | gate 仍仅 1 处 warning→0 |
| P2 | 回归：`official-track` 终态无 sect+demonic 双 active | RC-02 | gameplay simulation 诊断 |

---

## 9. 机器可读摘要

```json
{
  "story": "US-015",
  "contradictionCount": 1,
  "samples": [
    {
      "id": "golden-neutral-baseline",
      "seed": 304,
      "pair": ["sect", "demonic"],
      "severity": "warning",
      "chain": [
        { "age": 13, "eventId": "sect_path_choice", "choiceId": "join_orthodox", "routeEffect": "sect:active", "flags": ["route_orthodox"] },
        { "age": 23, "eventId": "outlaw_identity_beginning", "choiceId": "join_outlaw_conditional", "routeEffect": "demonic:active", "flags": ["sect_faction=unconventional"], "flagsNotCleared": ["route_orthodox"] }
      ],
      "rootCauses": ["event_data", "route_conflict_rules", "simulation_choice_strategy"],
      "maskingFactors": ["route_track_isolation_on_priority_samples"]
    }
  ],
  "legacyObservation": {
    "id": "official-track",
    "sameChain": true,
    "gateEnforced": false
  }
}
```

---

## 10. 验证

| Command | 预期 | 本 story 结果 |
| --- | --- | --- |
| `npm run typecheck` | exit 0 | 见 §11 |
| `npm run gate:golden-line` | 仍可 PASS；1 continuity warning | 与 US-001 W7 一致（修复属 US-016） |

---

## 11. US-015 验收对照

| Acceptance criterion | Status |
| --- | --- |
| Identify deterministic samples with route contradiction warnings | done — §3（1 样本：golden-neutral-baseline） |
| Identify exact events and effects activating conflicting route states | done — §4.2–4.3 |
| Classify root cause (event data / rules / simulation / fallback) | done — §5 |
| Produce route contradiction audit report | done — 本文档 |
| Do not modify business code | done |
| Typecheck passes | done — exit 0 |

---

## 12. 后续 story 入口

| Story | 与本 audit 的关系 |
| --- | --- |
| **US-016** Fix Priority Route Contradictions | 按 §8 实施；目标 B2：`route_contradiction_count=0` |
| US-013 Implement Payoff Hooks | 避免新 payoff 经 `sect_faction` 侧路引入 contradiction |
| US-029 Enforce P3 Gate | US-016 完成后将 W7 升为 blocker |

---

*P3-W4 / US-015 — 2026-05-31*
