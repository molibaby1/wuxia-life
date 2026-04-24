# 爱情线事件链断裂问题修复

## 问题描述

**用户反馈**：爱情线只有"相遇"事件，后续事件（阻碍→情敌→别离→重逢→误会→相救）从来没见过。

## 根本原因分析

### 问题一：年龄跨度太大导致断裂

```typescript
// 当前配置
1. love_first_meet (初遇)
   - 年龄：15-35 岁
   - 设置 flag: "love_started"

2. love_shared_mission (并肩同行) ← 关键断裂点
   - 年龄：17-23 岁  ← 必须等到 17 岁！
   - 需要 flag: "love_started"
   
3. love_family_obstacle (家族阻碍)
   - 年龄：19-25 岁  ← 必须等到 19 岁！
   - 需要 flag: "love_bonded"
```

**问题**：
- 玩家 15 岁初遇后，要等 2 年才能触发下一个事件
- 这 2 年内会触发很多其他事件（每年 3 个 = 6 个事件）
- 到 17 岁时，"并肩同行"很容易被其他事件挤掉
- 一旦错过，整个爱情线就断了！

### 问题二：优先级太低

```typescript
// 当前优先级
love_first_meet: priority = 1, weight = 50
love_shared_mission: priority = 1, weight = 45
love_family_obstacle: priority = 1, weight = 40

// 对比其他事件
sect_choice (门派选择): priority = 0, weight = 80  ← 优先级更高
prologue events: priority = 0  ← 主线剧情优先级
```

**问题**：
- 爱情线优先级是 1（低优先级）
- 主线事件优先级是 0（高优先级，数字越小优先级越高）
- 每年最多 3 个事件，爱情线很容易被挤掉

### 问题三：没有保底机制

```typescript
// 当前触发逻辑
if (age >= 17 && flags.has("love_started")) {
  // 有可能触发，但也可能被其他事件挤掉
}

// 缺少：
// - 没有触发时的重试机制
// - 没有强制触发保护
// - 没有事件链连续性保证
```

### 问题四：年度事件限制加剧问题

```typescript
// 新增的限制（刚才实施的）
private maxEventsPerYear = 3; // 每年最多 3 个事件

// 结果：
15 岁：初遇 (1/3) + 其他事件 (2/3)
16 岁：其他事件 (3/3) ← 爱情线没触发
17 岁：其他事件 (3/3) ← "并肩同行"被挤掉
18 岁：其他事件 (3/3) ← 爱情线已断，无法触发
...
```

---

## 解决方案

### 方案一：添加事件链保护机制 ⭐⭐⭐ 推荐

**核心思想**：关键剧情事件享有优先级保护，不被挤掉。

```typescript
// 修改 love.json
{
  "id": "love_shared_mission",
  "priority": 0,  // 提升到主线优先级
  "weight": 80,   // 提高权重
  "storyLine": "love_story",
  "requiresChain": "love_first_meet",  // 新增：必须在前置事件后触发
  "chainPriority": true,  // 新增：链式事件优先级保护
  // ...
}
```

**实现逻辑**：

```typescript
// 在 GameEngineIntegration.ts 中添加
private checkChainProtection(event: EventDefinition): boolean {
  // 如果这是某个事件链的后续事件
  if (event.chainPriority && event.requiresChain) {
    const chainEvent = this.gameState.player?.events
      .find(e => e.eventId === event.requiresChain);
    
    if (chainEvent) {
      // 前置事件已触发，这个事件必须给它机会
      // 即使今年事件已满，也要触发
      return true;
    }
  }
  
  return true;
}

// 修改 selectEvent 方法
public selectEvent(age?: number): EventDefinition | null {
  const availableEvents = this.getAvailableEvents(currentAge);
  
  // 优先处理链式保护事件
  const protectedEvents = availableEvents.filter(e => e.chainPriority);
  if (protectedEvents.length > 0) {
    return protectedEvents[0]; // 直接触发，不占用年度名额
  }
  
  // 普通事件仍受年度限制
  // ...
}
```

---

### 方案二：缩小年龄跨度 ⭐⭐ 简单有效

**核心思想**：让后续事件能在前置事件后尽快触发。

```typescript
// 修改前
love_first_meet: { min: 15, max: 35 }
love_shared_mission: { min: 17, max: 23 }  // ← 等 2 年

// 修改后
love_first_meet: { min: 15, max: 35 }
love_shared_mission: { min: 16, max: 25 }  // ← 只等 1 年
  triggers: [
    { type: "age_reach", value: 16 },
    { type: "flag_set", flag: "love_started" }  // ← 新增触发条件
  ]
```

**具体修改**：

```typescript
// 1. love_shared_mission (并肩同行)
{
  "ageRange": { "min": 16, "max": 25 },  // 16 岁就可以
  "triggers": [
    { "type": "age_reach", "value": 16 },
    { "type": "random", "value": 0.5 }  // 50% 概率触发
  ],
  "conditions": [
    { "type": "expression", "expression": "flags.has(\"love_started\")" }
  ],
  "priority": 0,  // 提升到主线优先级
  "weight": 70    // 提高权重
}

// 2. love_family_obstacle (家族阻碍)
{
  "ageRange": { "min": 17, "max": 26 },  // 17 岁就可以
  "triggers": [
    { "type": "age_reach", "value": 17 }
  ],
  "conditions": [
    { "type": "expression", "expression": "flags.has(\"love_bonded\")" }
  ],
  "priority": 0,
  "weight": 65
}

// 3. love_rival_appears (情敌出现)
{
  "ageRange": { "min": 18, "max": 27 },  // 18 岁就可以
  "priority": 0,
  "weight": 60
}
```

---

### 方案三：添加事件链管理器 ⭐⭐⭐⭐ 彻底解决

**核心思想**：将爱情线组织成完整的事件链，按顺序强制触发。

```typescript
// 创建 EventChainManager.ts
const loveStoryChain = {
  id: 'love_story',
  name: '明月情缘',
  events: [
    'love_first_meet',      // 1. 初遇
    'love_shared_mission',  // 2. 并肩同行
    'love_family_obstacle', // 3. 家族阻碍
    'love_rival_appears',   // 4. 情敌出现
    'love_separation',      // 5. 别离
    'love_reunion',         // 6. 重逢
    'love_misunderstanding',// 7. 误会
    'love_final_choice',    // 8. 最终抉择
  ],
  currentIndex: 0,
};

// 触发逻辑
public canTriggerEvent(event: EventDefinition): boolean {
  const chain = this.getCurrentChain();
  if (!chain) return true;
  
  const nextEventId = chain.events[chain.currentIndex];
  
  // 只允许触发下一个事件
  if (event.id !== nextEventId) {
    return false;
  }
  
  return true;
}
```

---

## 推荐实施方案（组合拳）

### 第一步：缩小年龄跨度（立即实施）

让事件能在前置事件后尽快触发。

### 第二步：提高优先级（立即实施）

让爱情线事件不被其他事件挤掉。

### 第三步：添加触发保护（短期实施）

确保关键事件一定能触发。

---

## 具体修改内容

### 修改文件：`src/data/lines/love.json`

```typescript
// 1. love_first_meet (初遇) - 保持不变
{
  "id": "love_first_meet",
  "priority": 0,  // 提升到主线优先级
  "weight": 80,   // 提高权重
  "storyLine": "love_story"
}

// 2. love_shared_mission (并肩同行) - 关键修改
{
  "id": "love_shared_mission",
  "ageRange": { "min": 16, "max": 25 },  // 16 岁就可以
  "priority": 0,  // 提升到主线优先级
  "weight": 70,   // 提高权重
  "storyLine": "love_story",
  "cooldown": 0.5,  // 冷却时间缩短（0.5 年 = 6 个月）
  "conditions": [
    {
      "type": "expression",
      "expression": "flags.has(\"love_started\") && !flags.has(\"love_bonded\")"
    }
  ]
}

// 3. love_family_obstacle (家族阻碍)
{
  "ageRange": { "min": 17, "max": 26 },
  "priority": 0,
  "weight": 65,
  "storyLine": "love_story"
}

// 4. love_rival_appears (情敌出现)
{
  "ageRange": { "min": 18, "max": 27 },
  "priority": 0,
  "weight": 60,
  "storyLine": "love_story"
}

// 5. love_separation (别离)
{
  "ageRange": { "min": 19, "max": 28 },
  "priority": 0,
  "weight": 55,
  "storyLine": "love_story"
}

// 6. love_reunion (重逢)
{
  "ageRange": { "min": 20, "max": 30 },
  "priority": 0,
  "weight": 50,
  "storyLine": "love_story"
}

// 7. love_misunderstanding (误会)
{
  "ageRange": { "min": 21, "max": 31 },
  "priority": 0,
  "weight": 45,
  "storyLine": "love_story"
}
```

---

## 预期效果

### 修改前（断裂）

```
15 岁：初遇 ✓
16 岁：其他事件（爱情线被挤掉）
17 岁：其他事件（并肩同行被挤掉）← 断裂
18 岁：其他事件
... 爱情线结束
```

### 修改后（连贯）

```
15 岁：初遇 ✓ (priority=0, weight=80)
16 岁：并肩同行 ✓ (priority=0, weight=70, 年龄门槛降到 16)
17 岁：家族阻碍 ✓ (priority=0, weight=65, 年龄门槛降到 17)
18 岁：情敌出现 ✓ (priority=0, weight=60)
19 岁：别离 ✓
20 岁：重逢 ✓
21 岁：误会 ✓
22 岁：最终抉择 ✓
```

---

## 额外优化：添加保底触发机制

```typescript
// 在 GameEngineIntegration.ts 中
private checkGuaranteedTrigger(event: EventDefinition): boolean {
  // 检查是否是故事线的关键事件
  if (event.storyLine) {
    const lastEvent = this.getLastStoryLineEvent(event.storyLine);
    
    if (lastEvent) {
      const yearsPassed = currentAge - lastEvent.age;
      
      // 如果距离上个事件已经很久（>2 年），强制触发
      if (yearsPassed >= 2) {
        console.log(`[Guarantee] ${event.storyLine} 线已中断${yearsPassed}年，强制触发`);
        return true;
      }
    }
  }
  
  return false;
}
```

---

## 总结

**问题根源**：
1. ❌ 年龄跨度太大（15 岁初遇，17 岁才能下一步）
2. ❌ 优先级太低（容易被其他事件挤掉）
3. ❌ 没有保底机制（错过就断了）
4. ❌ 年度事件限制加剧问题

**解决方案**：
1. ✅ 缩小年龄跨度（16 岁就能触发下一步）
2. ✅ 提高优先级（priority=0，不被挤掉）
3. ✅ 提高权重（weight=70-80，更容易选中）
4. ✅ 添加故事线标签（storyLine: 'love_story'）
5. ✅ 添加保底触发（中断 2 年强制触发）

**修改文件**：
- `src/data/lines/love.json` - 调整年龄、优先级、权重
- `src/core/GameEngineIntegration.ts` - 添加保底触发机制（可选）

立即实施后，爱情线应该能完整体验了！
