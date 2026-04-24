# 游戏流程优化 - 第一阶段实施总结

## 实施时间
2026-03-16

## 问题回顾

你反馈游戏体验"东一锤子西一锤子"，非常混乱。经过分析，我们发现了**五大核心问题**：

1. ❌ **事件之间没有因果关系** - 可以跳过所有前置步骤直接创建门派
2. ❌ **多条剧情线同时爆发** - 20 岁一年内触发 13 个事件（爱情 + 边地 + 师门 + 仕途）
3. ❌ **玩家选择不影响后续** - 选择名门正派后仍然可以触发魔教事件
4. ❌ **成长过程跳跃式发展** - 从新手直接变成宗师，缺少积累过程
5. ❌ **事件触发缺乏约束** - 每年触发 10+ 个事件，平均每月 1 个重大事件

---

## 已实施的改进

### 改进一：降低年度事件密度 ⭐⭐⭐

**修改文件**：[`src/core/GameEngineIntegration.ts`](file:///Users/zhouyun/code/wuxia-life/src/core/GameEngineIntegration.ts#L32-L34)

**改动**：
```typescript
// 修改前
private maxEventsPerYear: number = 5; // 每年最多 5 个事件

// 修改后
private maxEventsPerYear: number = 3; // 每年最多 3 个事件
```

**效果**：
- ✅ 每年最多触发 3 个重大事件（原来是 5 个）
- ✅ 避免了一年内发生太多事情的情况
- ✅ 给每个事件足够的叙事空间

---

### 改进二：添加事件冷却时间系统 ⭐⭐⭐

**修改文件**：
- [`src/core/GameEngineIntegration.ts`](file:///Users/zhouyun/code/wuxia-life/src/core/GameEngineIntegration.ts#L265-L288) - 实现冷却检查
- [`src/types/eventTypes.ts`](file:///Users/zhouyun/code/wuxia-life/src/types/eventTypes.ts#L436-L437) - 添加 cooldown 字段

**新增方法**：
```typescript
private checkEventCooldown(event: EventDefinition): boolean {
  const lastTriggered = this.gameState.player?.events
    .filter(e => e.eventId === event.id)
    .pop();
  
  if (!lastTriggered) {
    return true; // 第一次触发，无冷却
  }
  
  const currentAge = this.gameState.player?.age || 0;
  const yearsPassed = currentAge - lastTriggered.age;
  
  // 获取冷却时间（默认 2 年）
  const cooldown = event.cooldown ?? 2;
  
  if (yearsPassed < cooldown) {
    console.log(`[Cooldown] ${event.id} 冷却中：已过去 ${yearsPassed} 年，需要 ${cooldown} 年`);
    return false; // ❌ 冷却期未过
  }
  
  return true;
}
```

**效果**：
- ✅ 同一事件不会在短时间内重复触发
- ✅ 默认冷却时间 2 年（可在事件定义中自定义）
- ✅ 防止"去年刚重逢，今年又重逢"的尴尬

---

### 改进三：添加剧情线密度控制 ⭐⭐⭐

**修改文件**：
- [`src/core/GameEngineIntegration.ts`](file:///Users/zhouyun/code/wuxia-life/src/core/GameEngineIntegration.ts#L290-L326) - 实现密度检查
- [`src/types/eventTypes.ts`](file:///Users/zhouyun/code/wuxia-life/src/types/eventTypes.ts#L439-L440) - 添加 storyLine 字段

**新增方法**：
```typescript
private checkStoryLineDensity(event: EventDefinition): boolean {
  const storyLine = event.storyLine;
  if (!storyLine) {
    return true; // 没有剧情线标签，不检查
  }
  
  const currentAge = this.gameState.player?.age || 0;
  
  // 获取同一条剧情线最近触发的事件
  const recentEvents = this.gameState.player?.events
    .filter(e => {
      const eventDef = eventLoader.getEventById(e.eventId);
      return eventDef?.storyLine === storyLine;
    })
    .sort((a, b) => b.age - a.age);
  
  if (recentEvents.length === 0) {
    return true; // 这条线没有触发过事件
  }
  
  const lastEventAge = recentEvents[0].age;
  const yearsPassed = currentAge - lastEventAge;
  
  // 同一条剧情线的事件间隔至少 1 年
  const minInterval = 1;
  
  if (yearsPassed < minInterval) {
    console.log(`[StoryLine] ${storyLine} 密度过高：距离上次事件 ${yearsPassed} 年，需要间隔 ${minInterval} 年`);
    return false; // ❌ 密度过高
  }
  
  return true;
}
```

**效果**：
- ✅ 同一条剧情线的事件间隔至少 1 年
- ✅ 防止"爱情线 7 个事件在 1 年内全部爆发"的情况
- ✅ 让每条剧情线都有足够的发展时间

**使用示例**：
```typescript
// 爱情线事件
{
  id: 'love_reunion',
  storyLine: 'love_story',  // 标签：爱情线
  cooldown: 2,              // 冷却 2 年
  // ...
}

// 边地线事件
{
  id: 'border_trade',
  storyLine: 'border_adventure',  // 标签：边地线
  // ...
}
```

---

### 改进四：添加新字段支持

**修改文件**：[`src/types/eventTypes.ts`](file:///Users/zhouyun/code/wuxia-life/src/types/eventTypes.ts#L436-L440)

**新增字段**：
```typescript
export interface EventDefinition {
  // ... 现有字段 ...
  
  /** 冷却时间（年）- 防止事件重复触发 */
  cooldown?: number;
  
  /** 剧情线标签 - 用于密度控制 */
  storyLine?: string;
}
```

**效果**：
- ✅ 事件定义支持冷却时间
- ✅ 事件定义支持剧情线标签
- ✅ 为后续优化提供基础

---

## 使用指南

### 为事件添加冷却时间

```typescript
{
  id: 'love_reunion',
  ageRange: { min: 20, max: 30 },
  cooldown: 2,  // 冷却 2 年
  storyLine: 'love_story',
  // ...
}
```

### 为事件添加剧情线标签

```typescript
// 爱情线
{
  id: 'love_first_meet',
  storyLine: 'love_story',
  // ...
}

{
  id: 'love_confession',
  storyLine: 'love_story',
  cooldown: 1,  // 至少间隔 1 年
  // ...
}

// 边地线
{
  id: 'border_first_trip',
  storyLine: 'border_adventure',
  // ...
}

// 师门线
{
  id: 'sect_farewell',
  storyLine: 'sect_story',
  // ...
}
```

---

## 预期效果对比

### 改进前（混乱）

```
20 岁一年内触发 13 个事件：
💕 爱情线：7 个事件（相遇→阻碍→情敌→别离→重逢→误会→相救）
🏜️ 边地线：4 个事件（随行→护商→猎场→巡行）
🏔️ 师门线：1 个事件（辞别师门）
🏛️ 仕途线：1 个事件（入仕机会）

平均每月 1 个重大事件，玩家根本来不及体验每个事件的情感冲击。
```

### 改进后（有序）

```
20 岁：触发 3 个事件
- 💕 爱情线：初次相遇（storyLine: love_story）
- 🏔️ 师门线：辞别师门（storyLine: sect_story）
- 🏛️ 仕途线：入仕机会（storyLine: career）

21 岁：触发 2 个事件
- 💕 爱情线：家族阻碍（距离上次爱情事件 1 年，✓）
- 🏜️ 边地线：边地随行（storyLine: border_adventure）

22 岁：触发 3 个事件
- 💕 爱情线：情敌出现（距离上次爱情事件 1 年，✓）
- 🏜️ 边地线：护商任务（距离上次边地事件 1 年，✓）
- 🏔️ 修炼线：武功突破

...

每条剧情线都有足够的发展空间，玩家可以充分体验每个事件的意义。
```

---

## 技术细节

### 事件触发流程

```
年龄到达 → 获取可用事件
           ↓
       过滤检查（6 层）
           ↓
    1. 基础条件检查 ✓
    2. 是否已触发 ✓
    3. 人生轨迹兼容性 ✓
    4. 属性门槛 ✓
    5. 事件冷却时间 ✓  ← 新增
    6. 剧情线密度 ✓    ← 新增
           ↓
      按优先级排序
           ↓
      加权随机选择
           ↓
      返回事件（最多 3 个/年）
```

### 日志输出示例

```
[Cooldown] love_reunion 冷却中：已过去 1 年，需要 2 年
[StoryLine] love_story 密度过高：距离上次事件 0 年，需要间隔 1 年
[GameEngine] 年龄 20 岁已达到本年度事件上限 (3 个)，跳过事件触发
```

---

## 下一步建议

### 短期（1-2 天）

1. **为现有事件添加 storyLine 标签**
   - 爱情事件：`storyLine: 'love_story'`
   - 边地事件：`storyLine: 'border_adventure'`
   - 师门事件：`storyLine: 'sect_story'`
   - 仕途事件：`storyLine: 'career'`
   - 魔教事件：`storyLine: 'demon_path'`
   - 正道事件：`storyLine: 'orthodox_path'`

2. **为重复事件添加 cooldown**
   - 重逢类事件：`cooldown: 2`
   - 相遇类事件：`cooldown: 1`
   - 修炼类事件：`cooldown: 1`

### 中期（3-5 天）

3. **实施人生主线系统**
   - 18 岁选择核心人生方向
   - 为事件添加 `lifePath` 标签
   - 只触发对应主线的事件

4. **添加更多属性门槛**
   - 创建门派：武力≥70
   - 武林盟主：武力≥85 + 侠义≥70
   - 商业帝国：金钱≥1000

### 长期（1-2 周）

5. **实施事件链系统**
   - 定义事件链（成长→发展→成就→传承）
   - 强制按顺序触发
   - 建立因果关系

---

## 总结

### 已完成的改进

✅ **年度事件密度降低** - 从 5 个/年降到 3 个/年
✅ **事件冷却系统** - 防止同一事件重复触发
✅ **剧情线密度控制** - 同一条线间隔至少 1 年
✅ **类型定义扩展** - 支持 cooldown 和 storyLine 字段

### 预期效果

- ✅ 游戏体验更加连贯，不再"东一锤子西一锤子"
- ✅ 每条剧情线都有足够的发展空间
- ✅ 玩家有足够时间体验每个事件的情感冲击
- ✅ 事件触发更加合理，符合常理

### 后续工作

虽然第一阶段改进已完成，但仍需：
1. 为现有事件添加 storyLine 标签
2. 为重复事件添加 cooldown
3. 实施人生主线系统（彻底解决连贯性）
4. 添加更多属性门槛（防止跳跃式成长）

**游戏流程优化第一阶段完成！** 🎉

刷新浏览器即可体验改进效果！
