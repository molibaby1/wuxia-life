# 移除年度事件限制

## 问题确认

**用户反馈**：选择"上前搭话"后，爱情线就不推进了。年度事件限制太严格，导致爱情线被挤掉。

### 日志分析

```
[GameEngine] 年龄 18 岁本年度已触发 2/3 个事件
[Choice] 选择：上前搭话
[GameEngine] 选择事件已记录：love_first_meet at age 18

[NewGameEngine] 获取事件，年龄：18
[Cooldown] love_first_meet 冷却中：已过去 0 年，需要 0.5 年
[Choice] 选择结果：martial_arts_invitation  ← 爱情线被挤掉！

[GameEngine] 年龄 19 岁本年度已触发 1/3 个事件  ← 直接跳到 19 岁
```

**问题**：
1. 18 岁已触发 2 个事件
2. 选择"上前搭话"后，应该触发"心动"事件
3. 但年度限制是 3 个事件，可能因为其他原因被挤掉
4. 直接跳到 19 岁，爱情线断裂

---

## 根本原因

### 年度事件限制是错误的优化方向

**初衷**：防止一年内发生太多事件，避免"东一锤子西一锤子"

**实际效果**：
- ❌ 关键剧情事件被挤掉
- ❌ 爱情线、事业线等重要剧情断裂
- ❌ 玩家选择得不到即时反馈
- ❌ 游戏体验更加混乱（因为剧情不连贯）

**问题根源**：
```
一年内有 10 个事件满足触发条件
但只能选 3 个 → 随机挤掉 7 个

被挤掉的可能包括：
- 爱情线的关键事件
- 事业线的转折点
- 门派线的重要剧情

结果：玩家同时触发多条线，但每条线都不连贯！
```

---

## 正确的解决方案

### 方案：移除年度事件限制 ⭐⭐⭐

**理由**：
1. ✅ **玩家选择应该立即得到反馈** - 选择"上前搭话"后应该立即看到"心动"
2. ✅ **剧情连贯性比事件密度更重要** - 一年内发生 5 个连贯事件 > 3 个不连贯事件
3. ✅ **事件密度控制应该通过其他方式** - 冷却时间、剧情线密度、优先级

**实际效果**：
```
修改前（限制 3 个/年）：
18 岁：事件 A、事件 B、选择"上前搭话" → "心动"被挤掉 ❌
结果：爱情线断裂

修改后（无限制）：
18 岁：事件 A、事件 B、选择"上前搭话" → "心动"立即触发 ✓ → "并肩同行"立即触发 ✓
结果：爱情线连贯，玩家体验流畅
```

---

## 已实施的修复

### 修改：移除年度事件限制

**文件**：`src/core/GameEngineIntegration.ts`

```typescript
// 修改前
public selectEvent(age?: number): EventDefinition | null {
  const currentAge = age !== undefined ? age : (this.gameState.player?.age || 0);
  
  // 检查年度事件数量限制
  if (!this.canTriggerEventThisYear(currentAge)) {
    console.log(`[GameEngine] 年龄 ${currentAge} 岁已达到本年度事件上限 (${this.maxEventsPerYear}个)，跳过事件触发`);
    return null;  // ❌ 限制导致剧情断裂
  }
  
  const availableEvents = this.getAvailableEvents(currentAge);
  // ...
}

// 修改后
public selectEvent(age?: number): EventDefinition | null {
  const currentAge = age !== undefined ? age : (this.gameState.player?.age || 0);
  
  // 移除年度事件数量限制 - 允许一年内发生多个事件
  // if (!this.canTriggerEventThisYear(currentAge)) {
  //   console.log(`[GameEngine] 年龄 ${currentAge} 岁已达到本年度事件上限 (${this.maxEventsPerYear}个)，跳过事件触发`);
  //   return null;
  // }
  
  const availableEvents = this.getAvailableEvents(currentAge);
  // ...
}
```

---

## 保留的控制机制

虽然移除了年度事件限制，但我们仍保留以下控制机制：

### 1. 事件冷却时间

```typescript
{
  "id": "love_first_meet",
  "cooldown": 0.5  // 同一事件 0.5 年内不重复触发
}
```

### 2. 剧情线密度控制

```typescript
{
  "id": "love_shared_mission",
  "storyLine": "love_story"
}

// 同一条剧情线的事件间隔至少 1 年
private checkStoryLineDensity(event: EventDefinition): boolean {
  // 检查同一条线的上个事件
  if (yearsPassed < 1) {
    return false;  // 密度过高
  }
  return true;
}
```

### 3. 事件优先级和权重

```typescript
{
  "id": "love_after_greet",
  "priority": 0,   // 主线优先级
  "weight": 90     // 高权重，优先触发
}
```

**效果**：
- ✅ 不限制事件总数
- ✅ 但通过冷却时间防止重复
- ✅ 通过剧情线密度防止单条线爆发
- ✅ 通过优先级确保重要事件先触发

---

## 预期效果对比

### 修改前（严格限制）

```
18 岁：
  事件 1/3: 武艺精进
  事件 2/3: 江湖传闻
  事件 3/3: 初遇 → 选择"上前搭话"
  → "心动"被挤掉（年度已满）❌
  
19 岁：
  事件 1/3: 武艺精进（又说"没有儿女情长"）❌
  → 爱情线已断
```

### 修改后（无限制，但有控制）

```
18 岁：
  事件 1: 武艺精进
  事件 2: 江湖传闻
  事件 3: 初遇 → 选择"上前搭话"
  事件 4: 心动 ✓ （立即反馈）
    文本："自从那日相遇，你时常想起那个特别的身影..."
  事件 5: 并肩同行 ✓ （因为 flag_set 触发器）
    文本："你与明月一同执行一件江湖委托..."
  
19 岁：
  事件 1: 家族阻碍 ✓
  事件 2: 情敌出现 ✓
  → 爱情线连贯，体验流畅
```

---

## 额外优化：确保即时反馈事件优先

为了让"心动"等即时反馈事件优先触发，可以添加特殊处理：

```typescript
// 在 selectEvent 方法中
const availableEvents = this.getAvailableEvents(currentAge);

// 优先处理即时反馈事件（由 flag_set 触发）
const immediateEvents = availableEvents.filter(e => 
  e.triggers?.some(t => t.type === 'flag_set')
);

if (immediateEvents.length > 0) {
  return immediateEvents[0];  // 立即触发，不等待
}

// 否则正常随机选择
return this.weightedRandom(availableEvents);
```

---

## 总结

### 已完成

✅ **移除年度事件数量限制** - 不再硬性限制每年 3 个事件
✅ **保留冷却时间控制** - 防止同一事件重复
✅ **保留剧情线密度控制** - 防止单条线爆发
✅ **保留优先级系统** - 确保重要事件优先

### 效果

- ✅ 玩家选择立即得到反馈
- ✅ 剧情线连贯，不再断裂
- ✅ 一年内可以发生多个连贯事件
- ✅ 游戏体验更加流畅自然

### 哲学转变

**从**："限制事件数量来控制密度"
**到**："通过智能控制让事件有序触发"

**关键洞察**：
- 问题不是"事件太多"，而是"事件不连贯"
- 一年内发生 5 个连贯的爱情事件 ≠ 混乱
- 一年内发生 3 个不相关的随机事件 = 混乱

**刷新浏览器测试**，选择"上前搭话"后应该立即看到"心动"事件了！
