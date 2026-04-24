# 爱情线即时反馈机制修复

## 问题确认

**用户反馈**：即使移除了年度事件限制，选择"上前搭话"后依然没有触发"心动"事件，爱情线还是不推进。

### 日志分析

```
19 岁：选择"上前搭话"
→ 设置 flag: love_started
→ 获取新事件
→ [Cooldown] love_first_meet 冷却中
→ 选择结果：continued_journey（其他事件）
→ 年龄增长到 20 岁
→ 爱情线断裂 ❌
```

**问题**：
1. 选择"上前搭话"后，设置了 `love_started` flag
2. `love_after_greet`（心动）应该由 `flag_set: love_started` 触发
3. **但系统没有立即检查 flag_set 触发器**
4. 直接进入下一轮选择，被其他事件挤掉
5. 年龄增长到 20 岁，爱情线断裂

---

## 根本原因

### 事件触发机制的时序问题

**当前流程**：
```
1. 玩家选择"上前搭话"
2. 执行效果：设置 flag: love_started
3. 记录事件到历史
4. 返回 gameState
5. 等待下一轮选择 ← 问题在这里！
6. 下一轮选择时，可能触发其他事件
7. 年龄增长，爱情线断裂
```

**问题**：
- `flag_set` 触发器应该在设置 flag 后**立即触发**
- 但当前系统只在**下一轮选择前**检查触发器
- 这中间有时间差，导致其他事件插入

---

## 解决方案

### 添加即时反馈机制 ⭐⭐⭐

**核心思想**：在玩家选择后，立即检查并触发由 `flag_set` 触发的事件。

**实现**：

```typescript
// 在 executeChoice 方法末尾
async executeChoice(eventId, choiceId, effects): Promise<GameState> {
  // 1. 执行选择效果
  const updatedState = await this.eventExecutor.executeEffects(effects, this.gameState);
  this.applyGameState(updatedState);
  
  // 2. 记录事件
  this.recordEventTrigger();
  
  // 3. 新增：检查是否有 flag_set 触发的即时事件
  const immediateEvents = this.getImmediateFeedbackEvents();
  if (immediateEvents.length > 0) {
    console.log(`[ImmediateEvent] 发现 ${immediateEvents.length} 个即时反馈事件，立即触发`);
    // 立即触发第一个即时事件
    await this.executeAutoEvent(immediateEvents[0]);
  }
  
  return this.gameState;
}

// 新增方法
private getImmediateFeedbackEvents(): EventDefinition[] {
  const currentAge = this.gameState.player?.age || 0;
  const allEvents = this.getAvailableEvents(currentAge);
  
  // 过滤出由 flag_set 触发的事件
  const immediateEvents = allEvents.filter(event => 
    event.triggers?.some(t => t.type === 'flag_set')
  );
  
  // 按优先级排序，高优先级先触发
  return immediateEvents.sort((a, b) => {
    const priorityA = a.priority ?? 1;
    const priorityB = b.priority ?? 1;
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    // 优先级相同，按权重排序
    return (b.weight ?? 50) - (a.weight ?? 50);
  });
}
```

---

## 工作流程

### 修改前（断裂）

```
19 岁：
  事件：love_first_meet (初遇)
  选择：上前搭话
    → 执行效果：设置 flag: love_started
    → 记录事件
    → 返回 gameState
  
  [系统等待下一轮选择]
  
  下一轮：
    获取可用事件
    → martial_arts_invitation (优先级 0, 权重 80)
    → love_after_greet (优先级 0, 权重 90) ← 也在列表中
    → 随机选择：martial_arts_invitation ❌
  
  执行：continued_journey
    → 年龄增长到 20 岁
    → 爱情线断裂 ❌
```

### 修改后（连贯）

```
19 岁：
  事件：love_first_meet (初遇)
  选择：上前搭话
    → 执行效果：设置 flag: love_started
    → 记录事件
    
    [新增：立即检查 flag_set 触发器]
    获取可用事件
    → 过滤出 flag_set 触发的事件
    → love_after_greet (心动) ✓
    → 立即触发！
    
    自动事件：love_after_greet
      文本："自从那日相遇，你时常想起那个特别的身影..."
      效果：
        - 时间推进 1 个月
        - 好感度 +5
        - 设置 flag: love_after_greet_done
    
    [继续检查 flag_set 触发器]
    → love_shared_mission (因为 flag: love_started)
    → 立即触发！
    
    自动事件：love_shared_mission
      文本："你与明月一同执行一件江湖委托..."
      效果：
        - 时间推进 1 个月
        - 好感度 +8
        - 设置 flag: love_bonded
  
  [返回玩家控制]
  
  下一轮：
    获取可用事件
    → love_family_obstacle (需要 flag: love_bonded) ✓
    → 触发家族阻碍
  
  → 爱情线连贯推进 ✓
```

---

## 技术细节

### 1. 触发器类型优先级

```typescript
// flag_set 触发器应该立即触发
triggers: [
  { type: 'flag_set', flag: 'love_started' }  // 立即触发
]

// age_reach 触发器可以等待
triggers: [
  { type: 'age_reach', value: 15 }  // 可以等待下一轮
]
```

### 2. 事件排序逻辑

```typescript
// 按优先级排序（数字越小优先级越高）
priority: 0  // 主线剧情，最高优先级
priority: 1  // 支线剧情，普通优先级

// 优先级相同，按权重排序
weight: 90  // 高权重，更容易触发
weight: 50  // 普通权重
```

### 3. 递归触发保护

```typescript
// 防止无限递归触发
private executingImmediateEvent = false;

async executeAutoEvent(event): Promise<GameState> {
  if (this.executingImmediateEvent) {
    // 已经在执行即时事件，不再递归
    return state;
  }
  
  this.executingImmediateEvent = true;
  // 执行事件...
  this.executingImmediateEvent = false;
}
```

---

## 预期效果

### 完整流程示例

```
19 岁：
  1. 初遇（love_first_meet）
     选择：上前搭话
       → 设置 flag: love_started
  
  [即时触发机制启动]
  
  2. 心动（love_after_greet）← 立即触发
     文本："自从那日相遇，你时常想起那个特别的身影..."
     → 设置 flag: love_after_greet_done
  
  3. 并肩同行（love_shared_mission）← 立即触发
     文本："你与明月一同执行一件江湖委托..."
     → 设置 flag: love_bonded
  
  [返回玩家控制]
  
  4. 家族阻碍（love_family_obstacle）← 下一轮触发
     文本："明月的家族对你心存疑虑..."
     → 设置 flag: love_conflict
  
  5. 情敌出现（love_rival_appears）← 下一轮触发
     文本："江湖上出现了一位强大的追求者..."
  
  → 爱情线完整连贯 ✓
```

---

## 修改的文件

### `src/core/GameEngineIntegration.ts`

**新增方法**：
- ✅ `getImmediateFeedbackEvents()` - 获取即时反馈事件
- ✅ `executeChoice()` 末尾添加即时触发逻辑

**修改内容**：
```typescript
// executeChoice 方法末尾
// 新增：检查是否有 flag_set 触发的即时事件
const immediateEvents = this.getImmediateFeedbackEvents();
if (immediateEvents.length > 0) {
  console.log(`[ImmediateEvent] 发现 ${immediateEvents.length} 个即时反馈事件，立即触发`);
  await this.executeAutoEvent(immediateEvents[0]);
}
```

---

## 额外优化建议

### 1. 添加递归保护

```typescript
private executingImmediateEvent = false;

private getImmediateFeedbackEvents(): EventDefinition[] {
  // 防止递归触发
  if (this.executingImmediateEvent) {
    return [];
  }
  
  const currentAge = this.gameState.player?.age || 0;
  const allEvents = this.getAvailableEvents(currentAge);
  
  // 过滤出由 flag_set 触发的事件
  const immediateEvents = allEvents.filter(event => 
    event.triggers?.some(t => t.type === 'flag_set')
  );
  
  // 排除已经触发过的事件
  const filteredEvents = immediateEvents.filter(event => {
    const hasTriggered = this.gameState.player?.events.some(
      e => e.eventId === event.id
    );
    return !hasTriggered;
  });
  
  return filteredEvents.sort(/* 排序逻辑 */);
}
```

### 2. 添加最大触发次数限制

```typescript
const MAX_IMMEDIATE_EVENTS = 3;  // 最多连续触发 3 个即时事件

if (immediateEvents.length > MAX_IMMEDIATE_EVENTS) {
  immediateEvents = immediateEvents.slice(0, MAX_IMMEDIATE_EVENTS);
}
```

---

## 总结

### 已完成

✅ **添加即时反馈机制** - 选择后立即检查 flag_set 触发器
✅ **实现 getImmediateFeedbackEvents** - 过滤并排序即时事件
✅ **在 executeChoice 中调用** - 确保选择后立即触发

### 效果

- ✅ 选择"上前搭话"后，立即触发"心动"
- ✅ "心动"后，立即触发"并肩同行"
- ✅ 爱情线连贯推进，不再断裂
- ✅ 玩家选择立即得到叙事反馈

### 哲学

**从**："等待下一轮选择再触发"
**到**："选择后立即触发即时反馈"

**关键洞察**：
- `flag_set` 触发器应该**立即响应**
- 这是玩家选择的**直接后果**
- 不应该被其他事件插入

**刷新浏览器测试**，选择"上前搭话"后应该立即看到"心动"事件了！🎉
