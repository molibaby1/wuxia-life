# 游戏事件系统改进计划

## 背景分析

基于3次模拟测试，发现以下严重问题：

### 问题1：事件无限重复触发 🔴 严重

| 事件 | 触发次数 | 年龄段 |
|------|---------|--------|
| family_reunion | 7-12次 | 41-70岁 |
| merchant_empire | 7次 | 52-68岁 |
| elderly_legend_continues | 5次 | 75-79岁 |
| family_family_honor | 5次 | 48-55岁 |

**根本原因**：事件缺少 `once: true` 属性，冷却机制只检查上次触发时间，没有限制最大触发次数。

### 问题2：同一年龄触发多个事件 🟠 中等

- 13岁：3个事件（sect_path_choice, orthodox_trial_entry, youth_begins）
- 20岁：12个事件
- 36岁：8个事件

**根本原因**：没有事件密度限制，引擎允许所有满足条件的事件同时触发。

### 问题3：事件数据不完整 🟡 中等

约80+个事件的choice选项缺少 `id` 字段，aut o事件缺少 `autoEffects`。

### 问题4：缺乏重玩价值 🔴 严重

- 所有路线结果几乎相同（传奇+盟主+结婚+生子+退隐）
- 不管选择什么路线，最终都是完美结局

---

## 改进方案

### 方案A：快速修复（推荐先做）

#### A1. 事件添加 `maxTriggers` 属性

为以下事件添加 `maxTriggers: 2-3`，允许触发2-3次：

```json
{
  "id": "family_reunion",
  "maxTriggers": 3,
  ...
}
```

**涉及事件**：
- family_reunion - 允许3次
- merchant_empire - 允许2次
- elderly_legend_continues - 允许2次
- family_family_honor - 允许3次
- family_grandchild_born - 允许2次
- 其他身份结局事件

#### A2. 修复事件数据完整性

自动生成缺失的 choice.id 和 autoEffects。

---

### 方案B：增强冷却机制

#### B1. 添加 `maxTriggers` 属性支持

```typescript
interface EventDefinition {
  maxTriggers?: number;  // 最多触发次数，默认无限制
}
```

#### B2. 增强引擎冷却逻辑

```typescript
// 检查最大触发次数
if (event.maxTriggers && triggerCount >= event.maxTriggers) {
  return false; // 已达到最大触发次数
}
```

---

### 方案C：事件密度控制

#### C1. 重新启用故事线密度限制

在 `GameEngineIntegration.ts` 中恢复 `checkStoryLineDensity` 方法。

#### C2. 限制每年触发事件数量

```typescript
const MAX_EVENTS_PER_YEAR = 3;
```

---

### 方案D：增加结局多样性

#### D1. 设计多种结局类型

- **正道领袖**：成为名门正派掌门
- **魔道霸主**：统治武林魔道
- **江湖浪子**：自由行走江湖
- **商界巨贾**：富甲天下
- **退隐山林**：远离江湖纷争

#### D2. 根据选择分支结局

基于玩家的关键选择（flag组合）决定最终结局。

---

## 实施优先级

| 优先级 | 任务 | 预估工作量 |
|--------|------|-----------|
| P0 | A1: 为高频事件添加 maxTriggers | 2小时 |
| P0 | A2: 修复事件数据完整性 | 4小时 |
| P1 | B1-B2: 增强冷却机制 | 4小时 |
| P1 | C1-C2: 事件密度控制 | 3小时 |
| P2 | D1-D2: 结局多样性 | 8小时 |

---

## 待验证

1. 修复后重新运行3次模拟测试
2. 确认事件不再无限重复
3. 确认事件密度合理
4. 确认有不同结局
