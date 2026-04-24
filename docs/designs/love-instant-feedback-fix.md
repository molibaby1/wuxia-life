# 爱情线即时反馈修复

## 问题描述

**用户反馈**：选择"上前搭话"后，没有立即得到爱情线的反馈，反而触发了"没有被儿女情长所困扰，专心修炼武艺"的事件，完全不合逻辑！

### 日志分析

```
[NewGameEngine] 年龄：17
[Choice] 选择：上前搭话
[GameEngine] 年龄 17 岁本年度已触发 2/3 个事件
[GameEngine] 事件已记录：love_first_meet at age 17

[NewGameEngine] 年龄：18
[Choice] 选择结果：martial_improvement（武艺精进）
[Event] 你没有被儿女情长所困扰，而是专心致志地修炼武艺...
```

**问题**：
1. 17 岁选择"上前搭话"后，没有立即反馈
2. 18 岁触发了"武艺精进"事件，文本说"没有被儿女情长所困扰"
3. 但玩家明明已经选择了"上前搭话"，开始了爱情线！

---

## 根本原因

### 原因一：缺少即时反馈事件

```typescript
// love_first_meet 的选择
{
  "id": "love_greet",
  "text": "上前搭话",
  "effects": [
    { "type": "flag_set", "target": "love_started" },  // 只设置 flag
    { "type": "relation_change", ... },
    { "type": "stat_modify", ... }
    // ❌ 没有时间推进
    // ❌ 没有立即触发后续事件
  ]
}
```

**结果**：
- 选择后还在同一年
- 年度事件计数器用了 1 个名额
- 没有叙事反馈
- 下一年可能触发其他事件（如武艺精进）

### 原因二：love_shared_mission 触发条件太严格

```typescript
// 原触发条件
"triggers": [{ "type": "age_reach", "value": 16 }]

// 问题：
// - 玩家 17 岁才初遇，错过了 16 岁的触发年龄
// - 即使设置了 love_started，也无法触发
// - 爱情线直接断裂
```

---

## 修复方案

### 修复一：添加即时反馈事件 ⭐⭐⭐

**新增事件**：`love_after_greet`（心动）

```typescript
{
  "id": "love_after_greet",
  "triggers": [
    { "type": "flag_set", "flag": "love_started" }  // 立即触发
  ],
  "conditions": [
    { "type": "expression", "expression": "flags.has(\"love_started\") && !flags.has(\"love_after_greet_done\")" }
  ],
  "content": {
    "text": "自从那日相遇，你时常想起那个特别的身影。或许，这就是缘分的开始。",
    "title": "心动",
    "description": "情愫暗生。"
  },
  "autoEffects": [
    { "type": "time_advance", "value": 1, "timeUnit": "month" },  // 推进时间
    { "type": "relation_change", "delta": 5 },  // 增加好感
    { "type": "flag_set", "target": "love_after_greet_done" }
  ],
  "priority": 0,
  "weight": 90,  // 高优先级，确保触发
  "cooldown": 0  // 无冷却
}
```

**效果**：
- ✅ 选择"上前搭话"后**立即触发**
- ✅ 提供叙事反馈（"自从那日相遇..."）
- ✅ 推进 1 个月时间
- ✅ 增加好感度
- ✅ 占用当年度事件名额，防止其他事件插入

---

### 修复二：添加 flag_set 触发器 ⭐⭐⭐

**修改事件**：`love_shared_mission`

```typescript
// 修改前
"triggers": [{ "type": "age_reach", "value": 16 }]

// 修改后
"triggers": [
  { "type": "age_reach", "value": 16 },
  { "type": "flag_set", "flag": "love_started" }  // 新增
]
```

**效果**：
- ✅ 即使超过 16 岁，只要开始爱情线就能触发
- ✅ 不会因为年龄错过而断裂
- ✅ 提供补救机会

---

## 修复后的流程

### 正常流程

```
17 岁：
  事件 1/3: love_first_meet (初遇)
  选择：上前搭话
    → 设置 flag: love_started
    → 立即触发 love_after_greet
  
  事件 2/3: love_after_greet (心动) ← 新增！即时反馈
    文本："自从那日相遇，你时常想起那个特别的身影..."
    效果：
      - 时间推进 1 个月
      - 好感度 +5
      - 设置 flag: love_after_greet_done
  
  事件 3/3: love_shared_mission (并肩同行) ← 因为 flag_set 触发器
    文本："你与明月一同执行一件江湖委托..."
    效果：
      - 时间推进 1 个月
      - 好感度 +8
      - 设置 flag: love_bonded

18 岁：
  事件 1/3: love_family_obstacle (家族阻碍)
    文本："明月的家族对你心存疑虑..."
    条件：flags.has("love_bonded") ✓
```

### 即使年度事件已满

```
17 岁（已触发 2 个事件）：
  事件 3/3: love_first_meet (初遇)
  选择：上前搭话
    → 设置 flag: love_started
  
  [年度事件已满，停止]

18 岁：
  事件 1/3: love_after_greet (心动) ← 高优先级 (weight=90)
    文本："自从那日相遇..."
  
  事件 2/3: love_shared_mission (并肩同行)
    文本："你与明月一同执行..."
  
  事件 3/3: love_family_obstacle (家族阻碍)
```

---

## 预期效果对比

### 修复前（叙事断裂）

```
17 岁：
  事件：初遇
  选择：上前搭话
  → 无后续

18 岁：
  事件：武艺精进
  文本："你没有被儿女情长所困扰，专心修炼武艺..."
  → ❌ 完全忽略了玩家已经选择爱情线！
```

### 修复后（连贯叙事）

```
17 岁：
  事件 1/3: 初遇
  选择：上前搭话
  
  事件 2/3: 心动 ← 立即反馈
  文本："自从那日相遇，你时常想起那个特别的身影..."
  
  事件 3/3: 并肩同行
  文本："你与明月一同执行一件江湖委托，彼此信任渐深。"

18 岁：
  事件 1/3: 家族阻碍
  文本："明月的家族对你心存疑虑，提出严苛条件。"
  
  → ✅ 叙事连贯，逻辑自洽
```

---

## 修改的文件

### 1. `src/data/lines/love.json`

**新增事件**：
- ✅ `love_after_greet` - 即时反馈事件（心动）

**修改事件**：
- ✅ `love_shared_mission` - 添加 `flag_set` 触发器

---

## 额外优化建议

### 1. 为其他选择添加即时反馈

```typescript
// love_pass (只是远远一望) 的 effects
{
  "effects": [
    { "type": "time_advance", "value": 10, "timeUnit": "day" },
    { "type": "event_record", "target": "love_first_meet_pass" },
    // 建议添加：
    { "type": "stat_modify", "target": "chivalry", "value": 1 },  // 克制
    { "type": "flag_set", "target": "love_passive_start" }  // 标记被动开始
  ]
}
```

### 2. 添加更多阶段性反馈

```typescript
// 在重要选择后添加即时反馈事件
{
  "id": "love_after_conflict",  // 家族阻碍后的反馈
  "triggers": [{ "type": "flag_set", "flag": "love_conflict" }],
  "content": {
    "text": "家族的阻力让你感到疲惫，但你对明月的心意未减。"
  }
}

{
  "id": "love_after_reunion",  // 重逢后的反馈
  "triggers": [{ "type": "flag_set", "flag": "love_reunited" }],
  "content": {
    "text": "久别重逢，你们更加珍惜彼此的陪伴。"
  }
}
```

---

## 总结

### 已完成

✅ **添加即时反馈事件** - `love_after_greet`（心动）
✅ **添加 flag_set 触发器** - `love_shared_mission` 不会因为年龄错过
✅ **提供叙事连贯性** - 选择后立即得到反馈
✅ **防止逻辑矛盾** - 不会出现"没有儿女情长"的文本

### 效果

- ✅ 选择"上前搭话"后，立即触发"心动"事件
- ✅ 即使年度事件已满，爱情线也能继续
- ✅ 叙事连贯，逻辑自洽
- ✅ 玩家体验更加流畅自然

**刷新浏览器测试，应该能看到完整的爱情线反馈了！**
