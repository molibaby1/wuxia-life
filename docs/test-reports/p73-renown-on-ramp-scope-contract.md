# P73 Renown On-Ramp Scope Contract

> **Stage:** P73 — jianghu_renown_sage on-ramp spine
> **Purpose:** 明确 P73 范围边界，防止扩散成 full renown content wave

## 1. P73 Mission

为 `jianghu_renown_sage` 建立最小可玩的 on-ramp spine——过桥后的第一个标志性叙事事件，让 renown 路线从"有标签"变成"有内容"。

**这不是 full renown content wave，而是最小 bounded 的 spine。**

## 2. Allowed Layers

P73 只允许在以下四层做改动：

### Layer 1: Event Configuration (事件配置)
- 新增 1 个 on-ramp spine 事件
- 通过现有事件系统（ordinary-origin 或 sample-lines-spine）配置
- 新增 on-ramp 检查点 flag（`renown_on_ramp_done` 或类似）
- 触发条件：post-bridge + age 范围 + 最小声望/人脉门槛

### Layer 2: Player-Facing Expression (玩家可见表达)
- 更新 currentGoal（on-ramp 前后有差异）
- 更新 life memory / summary
- 更新 cost label（可选，如增强代价感）
- 不新增 UI 组件
- 通过现有载体传递（sampleLineExpression / ordinaryOriginExpression / playerFacingLabels）

### Layer 3: Targeted Proof (定向验证)
- 产出 1 份 bridge → on-ramp 路径的 targeted proof
- 展示事件触发 + 表达变化
- 不要求 full lifetime exhaust
- 支持是否继续 pressure 阶段的决策

### Layer 4: Narrow Regression Tests (窄回归测试)
- 覆盖 on-ramp 触发条件
- 覆盖事件触发 + flag 设置
- 覆盖表达更新
- 覆盖与 merchant / plain tavern 的差异化断言
- 复用现有 test harness
- 不重写全量测试体系

## 3. Forbidden Expansions

以下内容明确禁止在 P73 实施：

### 3.1 No Pressure Wave
- ❌ 不做 midlife pressure 事件
- ❌ 不做 renown 路线的代价/压力深化
- ❌ 不做"声名之累"的具体事件化表达
- **Defer to P74+**

### 3.2 No Payoff Wave
- ❌ 不做 age-40 identity 深化
- ❌ 不做 late-life payoff / legacy
- ❌ 不做 destiny sentence
- **Defer to P75+**

### 3.3 No New Systems
- ❌ 不新建事件框架或调度器
- ❌ 不新建 route framework
- ❌ 不新增 UI 组件或屏幕
- 复用现有事件系统 + 表达载体

### 3.4 No Full Route Expansion
- ❌ 不做全生命周期内容波次
- ❌ 不补全 youth / late-life 内容
- ❌ 不做 stat threshold gate 验证
- 只做 on-ramp 这一个里程碑

### 3.5 No Second Route
- ❌ 不扩展到 `medical_sage_healer` 或其他新路线
- ❌ 不做第二条 renown-adjacent 路线
- 仅聚焦 `jianghu_renown_sage` + `tavern_hand` origin

### 3.6 No Other Origins
- ❌ 不扩展到 farm_peasant / town_apprentice 的 renown 路径
- 仅处理 tavern_hand origin 的 renown 路线

## 4. Boundary Guards

### 4.1 Story Boundaries
- **US-001 / US-002 / US-003:** 文档阶段，零运行时改动
- **US-004:** 事件配置 + flag 设置（核心实现）
- **US-005:** 表达更新（玩家感知）
- **US-006:** Targeted proof（验证）
- **US-007:** 窄回归测试（防护）
- **US-008:** Closure report（收口）

### 4.2 Quality Priority Order
1. 触发稳定性 → 事件必须可靠触发
2. 风味正确性 → tavern-born renown 风味必须贯穿
3. 表达清晰度 → 玩家能感知到"过桥后有了第一个真正的江湖事件"
4. 测试覆盖度 → 窄覆盖即可，但关键路径必须有防护

### 4.3 Regression Guard
- P71 bridge evidence 不退化
- P72 entry differentiation evidence 不退化
- Merchant on-ramp (magnate_on_ramp) 不受影响
- 其他 ordinary origin 路径不受影响

## 5. What "On-Ramp Spine" Means

类比 merchant trilogy 的 on-ramp（`magnate_on_ramp`）：

| Dimension | Merchant On-Ramp | Renown On-Ramp (P73) |
|-----------|------------------|---------------------|
| **Role** | 过桥后的第一个标志性节点 | 过桥后的第一个标志性节点 |
| **Count** | 1 个事件 | 1 个事件 |
| **Flag** | `magnate_on_ramp_done` | `renown_on_ramp_done`（或类似） |
| **Expression** | currentGoal + costLabel 更新 | currentGoal + summary/memory 更新 |
| **Flavor** | "产业初成，巨贾之路刚起步" | "江湖声名初显，引荐之路渐宽" |
| **Subsequent** | pressure → payoff | pressure → payoff (deferred) |

**On-ramp 不是 pressure，不是 payoff，它是"你已经上路了，第一个里程碑到了"。**

## 6. Rollback Plan

若 P73 实施中发现问题：
1. 回退到 P72 entry-only 状态
2. 只需移除 on-ramp 事件配置 + 对应的表达分支
3. P71/P72 基础设施不受影响
4. 回退成本：低（配置 + 表达分支，无系统级改动）

## 7. Contract Verification

本 scope contract 通过以下方式验证：
- [ ] US-001 gap audit 输出 → 确认缺口在 on-ramp 层
- [ ] US-003 on-ramp contract → 明确 on-ramp 具体内容
- [ ] US-004 event wiring → 仅 1 个新事件
- [ ] US-005 expression → 仅更新现有载体
- [ ] US-007 tests → 窄范围回归
- [ ] US-008 closure → 明确后续阶段 defer 清单
