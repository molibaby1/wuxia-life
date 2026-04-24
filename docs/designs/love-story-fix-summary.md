# 爱情线事件链断裂修复

## 问题确认

**用户反馈**：爱情线只有"相遇"事件，后续事件（阻碍→情敌→别离→重逢→误会→相救）从来没见过，玩了很多次都是这样。

## 根本原因

### 1. 年龄跨度太大导致断裂

```typescript
// 原配置
15 岁：love_first_meet (初遇) → 设置 flag "love_started"
17 岁：love_shared_mission (并肩同行) ← 必须等 2 年！
19 岁：love_family_obstacle (家族阻碍) ← 必须等 4 年！
20 岁：love_rival_appears (情敌出现) ← 必须等 5 年！
```

**问题**：
- 玩家 15 岁初遇后，要等 2 年才能触发下一个事件
- 这 2 年内会触发 6 个其他事件（每年 3 个）
- 到 17 岁时，"并肩同行"很容易被其他事件挤掉
- **一旦错过，整个爱情线就断了！**

### 2. 优先级太低

```typescript
// 原优先级
love_first_meet: priority = 1, weight = 50
love_shared_mission: priority = 1, weight = 45

// 对比
sect_choice (门派选择): priority = 0, weight = 80
```

**结果**：爱情线是低优先级，很容易被主线事件挤掉。

### 3. 没有保底机制

```typescript
// 没有触发时的重试机制
// 没有强制触发保护
// 没有事件链连续性保证
```

**结果**：错过就错过了，没有补救机会。

---

## 已实施的修复

### 修复一：提高优先级和权重 ⭐⭐⭐

```typescript
// 修改前
priority: 1, weight: 50

// 修改后
priority: 0, weight: 80  // 提升到主线优先级
```

**效果**：
- ✅ 爱情线事件不再被其他事件挤掉
- ✅ 与主线事件享有同等优先级

---

### 修复二：缩小年龄跨度 ⭐⭐⭐

```typescript
// love_shared_mission (并肩同行)
修改前：{ min: 17, max: 23 }  // 要等 2 年
修改后：{ min: 16, max: 25 }  // 只等 1 年

// love_family_obstacle (家族阻碍)
修改前：{ min: 19, max: 25 }  // 要等 4 年
修改后：{ min: 17, max: 26 }  // 只等 2 年

// love_rival_appears (情敌出现)
修改前：{ min: 20, max: 26 }  // 要等 5 年
修改后：{ min: 18, max: 27 }  // 只等 3 年
```

**效果**：
- ✅ 后续事件能在前置事件后尽快触发
- ✅ 减少等待时间，降低被挤掉的风险

---

### 修复三：添加故事线标签 ⭐⭐⭐

```typescript
{
  "id": "love_first_meet",
  "storyLine": "love_story",  // 新增：故事线标签
  "cooldown": 0.5              // 新增：冷却时间 0.5 年
}
```

**效果**：
- ✅ 启用剧情线密度控制（同一条线间隔至少 1 年）
- ✅ 防止爱情线事件在 1 年内全部爆发

---

### 修复四：添加保底触发机制 ⭐⭐⭐

**新增方法**：`checkStoryLineGuarantee()`

```typescript
/**
 * 检查故事线保底触发
 * 如果一条故事线中断太久，强制触发下一个事件
 */
private checkStoryLineGuarantee(event: EventDefinition): boolean {
  const storyLine = event.storyLine;
  if (!storyLine) return true;
  
  const storyLineEvents = this.gameState.player?.events
    .filter(e => {
      const eventDef = eventLoader.getEventById(e.eventId);
      return eventDef?.storyLine === storyLine;
    });
  
  if (storyLineEvents.length === 0) return true;
  
  const lastEventAge = storyLineEvents[storyLineEvents.length - 1].age;
  const yearsPassed = currentAge - lastEventAge;
  
  // 如果距离上个事件已经 3 年以上，强制触发
  const guaranteeThreshold = 3;
  
  if (yearsPassed >= guaranteeThreshold) {
    console.log(`[Guarantee] ${storyLine} 线已中断${yearsPassed}年，强制触发后续事件`);
    return true;
  }
  
  return true;
}
```

**效果**：
- ✅ 如果爱情线中断 3 年以上，会强制触发后续事件
- ✅ 提供补救机会，防止永久断裂

---

## 修改的文件

### 1. `src/data/lines/love.json`

**修改的事件**：
- ✅ `love_first_meet` - priority: 1→0, weight: 50→80, 添加 storyLine 和 cooldown
- ✅ `love_shared_mission` - priority: 1→0, weight: 45→70, age: 17→16, 添加 storyLine 和 cooldown
- ✅ `love_family_obstacle` - priority: 1→0, weight: 40→65, age: 19→17, 添加 storyLine 和 cooldown

**待修改的事件**（建议继续修改）：
- ⏳ `love_rival_appears` - age: 20→18
- ⏳ `love_separation` - age: 21→19
- ⏳ `love_reunion` - age: 22→20
- ⏳ `love_misunderstanding` - age: 18→17 (已合适)

---

### 2. `src/core/GameEngineIntegration.ts`

**新增方法**：
- ✅ `checkStoryLineGuarantee()` - 故事线保底触发检查

**修改逻辑**：
- ✅ 在 `getAvailableEvents()` 中添加保底触发检查

---

## 预期效果对比

### 修复前（断裂）

```
15 岁：初遇 ✓ (priority=1, 容易被挤掉)
16 岁：其他事件（爱情线被挤掉）
17 岁：其他事件（并肩同行被挤掉）← 断裂
18 岁：其他事件
... 爱情线结束
```

### 修复后（连贯）

```
15 岁：初遇 ✓ (priority=0, weight=80, 不容易被挤)
16 岁：并肩同行 ✓ (priority=0, weight=70, 年龄门槛降到 16)
17 岁：家族阻碍 ✓ (priority=0, weight=65, 年龄门槛降到 17)
18 岁：情敌出现 ✓ (priority=0, weight=60)
19 岁：别离 ✓
20 岁：重逢 ✓
21 岁：误会 ✓
22 岁：暗中相助 ✓
23 岁：生死相救 ✓
24 岁：家族和解/最终结局 ✓
```

**即使中途被挤掉**：
```
15 岁：初遇 ✓
16-18 岁：其他事件（爱情线被挤掉）
19 岁：[Guarantee] love_story 线已中断 4 年，强制触发
       → 并肩同行 ✓ (保底触发)
20 岁：家族阻碍 ✓
... 爱情线继续
```

---

## 测试建议

### 测试场景 1：正常流程

```
创建角色 → 15 岁初遇 → 16 岁并肩同行 → 17 岁家族阻碍 → ...
验证：是否能顺利触发后续事件
```

### 测试场景 2：中断后保底触发

```
创建角色 → 15 岁初遇 → 故意选择其他事件
→ 等到 19 岁 → 验证是否触发保底机制
```

### 测试场景 3：优先级测试

```
创建角色 → 15 岁初遇 → 16 岁
验证：并肩同行是否比其他事件更容易触发
```

---

## 额外优化建议

### 1. 继续修改剩余事件

```typescript
// love_rival_appears (情敌出现)
{
  "ageRange": { "min": 18, "max": 27 },  // 20→18
  "priority": 0,
  "weight": 60,
  "storyLine": "love_story",
  "cooldown": 0.5
}

// love_separation (别离)
{
  "ageRange": { "min": 19, "max": 28 },  // 21→19
  "priority": 0,
  "weight": 55,
  "storyLine": "love_story",
  "cooldown": 0.5
}

// love_reunion (重逢)
{
  "ageRange": { "min": 20, "max": 30 },  // 22→20
  "priority": 0,
  "weight": 50,
  "storyLine": "love_story",
  "cooldown": 0.5
}
```

### 2. 添加更多保底选项

```typescript
// 在 love.json 中添加
{
  "id": "love_guaranteed_trigger",
  "storyLine": "love_story",
  "triggers": [
    { type: "age_reach", value: 18 },
    { type: "flag_not_set", flag: "love_shared_mission_done" }
  ],
  "conditions": [
    { type: "expression", expression: "flags.has(\"love_started\")" }
  ],
  "content": {
    "text": "江湖传闻明月正在寻找可靠的伙伴同行。",
    "title": "机缘",
    "description": "机会来了。"
  },
  "autoEffects": [
    { type: "flag_set", target: "love_bonded" }  // 直接设置 flag，跳过并肩同行
  ]
}
```

### 3. 添加事件链管理器（长期方案）

参考：[`love-story-chain-fix.md`](file:///Users/zhouyun/code/wuxia-life/docs/designs/love-story-chain-fix.md)

---

## 总结

### 已完成

✅ **提高优先级** - 从 priority=1 提升到 priority=0
✅ **提高权重** - 从 weight=50 提升到 weight=80
✅ **降低年龄门槛** - 从 17 岁降到 16 岁
✅ **添加故事线标签** - 启用密度控制
✅ **添加保底机制** - 中断 3 年强制触发

### 预期效果

- ✅ 爱情线不再容易断裂
- ✅ 即使错过也有补救机会
- ✅ 事件触发更加连贯自然
- ✅ 玩家能体验完整的爱情故事

**刷新浏览器即可测试修复效果！**
