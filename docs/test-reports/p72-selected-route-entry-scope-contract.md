# P72 Selected Route Entry Scope Contract

> **Date:** 2026-06-29
> **Stage:** P72 Wuxia Selected Next Route Entry Differentiation
> **Story:** P72-002 — Lock P72 scope contract
> **Selected Route:** `jianghu_renown_sage` (江湖名宿, mainstream tier)
> **Preceding Stage:** P71 — Playable bridge closed

---

## 1. Purpose

本 scope contract 确保 P72 严格保持为 **entry differentiation 阶段**，不扩散到更深的路线 densification。P72 建立在 P71 bridge 已闭合的基础上，只在 bridge 后的第一层入口添加差异化，让 `jianghu_renown_sage` 路线在共享目的地路径上保持身份。

---

## 2. Stage Boundary

### 2.1 What P72 Is

P72 是 **bounded post-bridge entry differentiation stage**：

- 建立在 P71 bridge 已闭合的前提上
- 只处理 early post-bridge / entry-adjacent differentiation
- 通过现有 carrier 实现差异化（不建新系统）
- 回答"这条新路线是否值得进入 merchant trilogy 式的更深优化"

### 2.2 What P72 Is NOT

P72 **不是**：
- Full route content wave
- Pressure / payoff differentiation stage
- Success-cost / success-shape stage
- New route framework stage
- Multi-route planning stage

---

## 3. Allowed Layers

P72 只允许在以下层级做改动：

### 3.1 Light Configuration (允许)

- 向现有 expression 函数添加新的条件分支
- 向现有 detection 函数添加新的 flag 识别
- **不允许**新增事件 ID、选择结构、或新的 flag 系统
- **不允许**修改现有 gate 逻辑（除非是 bug 修复）

### 3.2 Expression (允许)

- `sampleLineExpression.ts` 中的 renown 分支
  - `detectSampleLine()` 识别 renown
  - Renown-specific currentGoal
  - Renown-specific costLabel
  - Renown-specific age40Identity
- `deriveLifeMemorySummary.ts` 中的 renown 路由状态
- `ordinaryOriginExpression.ts` 中的已有 bridge 分支（P71 已完成，P72 不改）
- **不允许**新增 UI 组件
- **不允许**新增 expression surface

### 3.3 Proof (允许)

- Targeted proof 文档（comparison-style）
- 展示 entry markers 和 expression 差异
- **不要求** full lifetime exhaust
- **不要求** stat threshold 全链验证

### 3.4 Narrow Tests (允许)

- 新增 entry differentiation 回归测试
- 复用现有 test harness
- 覆盖 entry markers、expression、comparison-level assertions
- **不重写**全量测试体系
- **不新增**测试框架

---

## 4. Forbidden Expansions

以下内容明确禁止在 P72 实施，推迟到后续阶段：

### 4.1 Pressure / Payoff Waves (禁止)

- ❌ Renown midlife pressure events
- ❌ Renown payoff events
- ❌ Pressure/payoff expression differentiation
- ❌ Cost-shape differentiation beyond entry-level cost label

### 4.2 New Systems (禁止)

- ❌ Renown route framework
- ❌ Reputation economy system
- ❌ Faction system
- ❌ New event loader or selector
- ❌ New UI components

### 4.3 Full Route Expansion (禁止)

- ❌ Full renown sample line spine (on_ramp / pressure / payoff)
- ❌ Renown-specific habit pools
- ❌ Renown-specific narrative catalog
- ❌ Multiple origin bridges for renown
- ❌ Mentor-bond renown bridge

### 4.4 Deeper Differentiation (禁止)

- ❌ Success-cost differentiation
- ❌ Success-shape / destiny sentence
- ❌ Late-life recap differentiation
- ❌ Archetype-specific renown flavors

---

## 5. Boundary Guards

为了确保 scope 不漂移，设置以下 guard rails：

### 5.1 Code Change Guard

| Metric | Limit | Rationale |
|--------|-------|-----------|
| New event IDs | 0 | No new events — entry differentiation is expression-only |
| New flag names | ≤2 | Only if absolutely needed for detection; prefer reusing P71 flags |
| New files | ≤4 | Test file + proof doc + 2 doc artifacts |
| Runtime code files modified | ≤3 | sampleLineExpression.ts + deriveLifeMemorySummary.ts + maybe 1 more |

### 5.2 Priority Guard

Implementation 优先级：
1. **First:** `detectSampleLine()` renown recognition
2. **Second:** Renown currentGoal + costLabel + age40Identity
3. **Third:** Life memory summary integration
4. **Fourth:** Tests + proof
5. **Never in P72:** Spine events, new systems, pressure/payoff

### 5.3 Rollback Guard

如果任何改动需要：
- 新增超过 2 个 flag
- 修改 gate 逻辑
- 新增事件
- 新增 UI 组件

...那么这个改动 **不属于 P72**，应该移到后续阶段。

---

## 6. P72 / P73 Boundary

### P72 Delivers
- ✅ Renown recognition in sample line expression
- ✅ 3+ entry-specific readable signals (currentGoal, costLabel, age40Identity)
- ✅ Tavern-born renown flavor differentiation
- ✅ Targeted proof of entry differentiation
- ✅ Narrow regression tests
- ✅ Closure report with go/no-go for deeper differentiation

### P73+ Would Deliver (Deferred)
- 🔜 Renown on-ramp spine event
- 🔜 Renown midlife pressure event
- 🔜 Renown payoff event
- 🔜 Full stat chain verification
- 🔜 Pressure/payoff expression differentiation
- 🔜 Additional origin bridges for renown

---

## 7. Success Criteria for P72 Scope

P72 scope contract 成功当且仅当：

1. ✅ 所有改动都在 allowed layers 内
2. ✅ 没有 forbidden expansions
3. ✅ Code change guard 指标在限制内
4. ✅ P71 bridge 证据不退化
5. ✅ 共享终点链仍稳定可触发
6. ✅ Entry differentiation 是 runtime-visible 的（不只是文档结论）

---

## 8. Pre-existing P71 Assets (Not Reimplemented)

以下是 P71 已交付的资产，P72 直接复用，不重做：

| Asset | P71 Status | P72 Action |
|-------|-----------|------------|
| `tavern_renown_bridge_crossed` flag | ✅ Done | Reuse — entry detection |
| `route_renown_committed` flag | ✅ Done | Reuse — route detection |
| Bridge event `ordinary_tavern_midlife_renown_bridge` | ✅ Done | Reuse — no changes |
| `tavernCurrentGoal()` renown branch | ✅ Done | Reuse — no changes |
| `tavernLifeMemory()` renown branch | ✅ Done | Reuse — no changes |
| `deriveOrdinaryOriginSummary()` renown branch | ✅ Done | Reuse — no changes |
| P71 regression tests | ✅ Done | Must continue passing |

---

**P72-002 complete.** Scope contract saved.
