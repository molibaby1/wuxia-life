# P73 Renown On-Ramp Gap Audit

> **Stage:** P73 — jianghu_renown_sage on-ramp spine
> **Purpose:** 审计 renown 路线过桥后的现有内容，明确 on-ramp 之前已有的基础 vs 需要补的最小 spine
> **Method:** 代码审计 + 配置审查，不做运行时改动

## 1. Existing Renown Infrastructure (Post-Entry)

### 1.1 Flags & Markers

| Flag | Source | Purpose |
|------|--------|---------|
| `ally_network` | childhood seed | 酒肆人脉种子，bridge 前置条件 |
| `tavern_midlife_renown_bridge` | P71 bridge | bridge 事件触发标记 |
| `tavern_embrace_renown` | P71 bridge | 选择踏入江湖的选择标记 |
| `tavern_renown_bridge_crossed` | P71 bridge | **bridge 跨越检查点** — renown 路线入口 |
| `route_renown_committed` | P71 bridge | 路线承诺标记 |
| `ordinary_tavern_midlife_done` | P56 midlife | 中年事件完成标记（互斥 guard） |

### 1.2 Events

| Event ID | File | Age | Role |
|----------|------|-----|------|
| `ordinary_tavern_midlife_renown_bridge` | `ordinary-origin-midlife.json` | 29 | **Bridge 事件** — "江湖名号"，踏入江湖的选择点 |

**只有 bridge 事件，没有 on-ramp / pressure / payoff 事件。**

### 1.3 Expression Surfaces

#### Sample Line Expression (`sampleLineExpression.ts`)

| Surface | Function | Renown Content |
|---------|----------|----------------|
| Sample line detection | `detectSampleLine()` | ✅ 识别 `tavern_renown_bridge_crossed` / `route_renown_committed` → `'renown'` |
| Current goal | `renownCurrentGoal()` | ✅ "凭人脉声名在江湖立足，常有人来寻你引荐主事" |
| Cost label | `deriveSampleLineCostLabel()` | ✅ "江湖声名之累" |
| Age-40 identity | `renownAge40Identity()` | ✅ "从酒肆走来的江湖名宿：人脉为基，引荐为径，声名是人情往来的重量。" |
| Destiny sentence | `deriveSampleLineDestinySentence()` | ❌ 无（仅 merchant 有） |

#### Ordinary Origin Expression (`ordinaryOriginExpression.ts`)

| Surface | Function | Renown Content |
|---------|----------|----------------|
| Current goal | `tavernCurrentGoal()` | ✅ "江湖上渐渐有了名声，常有人来寻你引荐" |
| Life memory | `tavernLifeMemory()` | ✅ "凭着酒肆里攒下的人脉和名声，渐渐在江湖上有了名号..." |
| Summary | `deriveOrdinaryOriginSummary()` | ✅ "酒肆出身的江湖人物：靠人脉和名声在江湖上立足。" |

#### Player-Facing Labels (`playerFacingLabels.ts`)

| Surface | Entry | Value |
|---------|-------|-------|
| Route display name | `ROUTE_DISPLAY_NAMES.renown` | "江湖名宿" |
| Route flag label | `ROUTE_FLAG_LABELS.route_renown_committed` | "江湖名宿之路" |
| Long-term flag label | `LONG_TERM_FLAG_LABELS.tavern_renown_bridge_crossed` | "踏上江湖名宿之路" |
| Route summary | `getPlayerRouteSummary()` | ✅ 识别 renown → "江湖名宿" / "路线进行中" |
| Raw route key | `readRawRouteKeyFromFlags()` | ✅ 识别 renown → `'renown'` |

### 1.4 Tests & Proof

| Test File | Coverage | Count |
|-----------|----------|-------|
| `p71TavernHandRenownBridgeTests.ts` | Bridge 事件触发 + flag 设置 + 3 个表达面 | ~15 assertions |
| `p72TavernHandRenownEntryDifferentiationTests.ts` | Sample line 检测 + 6 个表达面 + 差异化对比 | 15 tests |

### 1.5 What Merchant Has (Precedent)

Merchant trilogy 作为参考模板：

| Stage | Event Flag | Expression Updates |
|-------|------------|-------------------|
| Bridge | `*_merchant_bridge_crossed` | Goal/life-memory/summary (ordinary origin) |
| **On-ramp** | `magnate_on_ramp_done` | Current goal (entry-differentiated), cost label, "产业初成，巨贾之路刚起步" |
| Pressure | `magnate_midlife_pressure_done` | Current goal (differentiated pressure), cost label, "商号遍九州，人情债也遍九州" |
| Payoff | `magnate_payoff_done` | Current goal (success shape), cost label, destiny sentence |

## 2. On-Ramp Gap Analysis

### 2.1 What Exists Before On-Ramp

✅ Bridge 事件（age 29）  
✅ Bridge 后的 entry 表达（6+ surfaces）  
✅ Sample line 检测  
✅ 路线差异化（vs merchant / plain tavern）  
✅ Tavern-born 风味  

### 2.2 What the Minimum On-Ramp Spine Needs

类比 merchant `magnate_on_ramp`，renown on-ramp 最小 spine 需要：

| Component | Need | Priority |
|-----------|------|----------|
| **On-ramp 事件** | 过桥后的第一个标志性叙事节点 | 🔴 必须 |
| **On-ramp flag** | `renown_on_ramp_done` 或类似检查点 | 🔴 必须 |
| **Current goal 更新** | on-ramp 后的目标描述变化 | 🔴 必须 |
| **身份摘要深化** | on-ramp 后的 summary 变化 | 🟡 应该 |
| **Cost label 细化** | on-ramp 后的代价感增强 | 🟡 可选 |
| **Life memory 更新** | on-ramp 事件的记忆 | 🟡 应该 |

### 2.3 Gap Summary

**现状：** renown 路线只有 bridge + entry 标签，过桥后没有任何内容事件。

**最小 on-ramp spine 缺口：**
1. ❌ 没有 on-ramp 事件配置
2. ❌ 没有 on-ramp 检查点 flag
3. ❌ 没有 on-ramp 后的表达更新（goal / summary / memory）

**不需要（P73 范围外）：**
- Pressure 事件
- Payoff 事件
- 新的事件框架
- 第二条路线
- Full lifetime 内容波次

## 3. On-Ramp Design Direction (Teaser)

基于现有 tavern-born renown 风味，on-ramp 事件应该是：

- **触发时机：** bridge 后 2–3 年（age 31–33），给玩家一点"过桥"的缓冲
- **核心叙事：** "第一次真正的江湖声名事件"——比如有人慕名而来请你主持公道/调解纠纷/引荐高人
- **Tavern-born 风味：** 事件应与酒肆人脉、引荐、人际网络相关，而不是武功高低
- **Flag 接口：** 预留 `renown_midlife_pressure` / `renown_payoff` 接口

详细合同见 P73-003 scope contract + on-ramp contract。

## 4. Audit Conclusion

- **现有基础：** Bridge + entry differentiation 完整，6+ 表达面已就位
- **核心缺口：** 缺少第一个 post-bridge 内容事件（on-ramp spine）
- **最小补全：** 1 个 on-ramp 事件 + 2–3 个表达面更新 + 检查点 flag
- **风险可控：** 完全可在现有事件系统内实现，不需要新框架
- **Tavern-born 风味保留：** 基于人脉/引荐的叙事方向与现有 bridge 一致

---
**No runtime changes in this story.** 纯文档审计，零代码改动。
