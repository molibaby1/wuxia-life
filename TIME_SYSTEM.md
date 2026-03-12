# 时间系统使用说明

## 概述

为了支持长时间跨度的多步骤事件，我们实现了「年月双轨制」时间系统。现在游戏支持三种时间单位：
- **年 (year)**: 默认单位，适合普通剧情
- **月 (month)**: 适合中期事件（如师门任务、短途旅行）
- **日 (day)**: 适合短期事件（如闭关修炼、照顾病人）

## 类型定义

### PlayerState 新增字段

```typescript
interface PlayerState {
  // ... 原有字段 ...
  
  // 时间单位：'year' | 'month' | 'day'
  timeUnit: 'year' | 'month' | 'day';
  // 当前时间进度（按月或日计算）
  monthProgress: number; // 0-11
  dayProgress: number; // 1-30
}
```

### StoryNode 和 StoryChoice 新增字段

```typescript
interface StoryNode {
  // ... 原有字段 ...
  
  // 时间跨度配置
  timeSpan?: {
    value: number;
    unit: 'year' | 'month' | 'day';
  };
}

interface StoryChoice {
  // ... 原有字段 ...
  
  // 时间跨度配置
  timeSpan?: {
    value: number;
    unit: 'year' | 'month' | 'day';
  };
}
```

## 使用方法

### 1. 在剧情节点中使用时间跨度

```typescript
{
  id: 'closed_training',
  minAge: 15,
  maxAge: 50,
  text: '你决定闭关修炼，突破当前瓶颈。',
  timeSpan: { value: 30, unit: 'day' }, // 自动推进 30 天
  autoEffects: [{
    op: 'add',
    field: 'internalSkill',
    value: 10
  }],
}
```

### 2. 在选择支中使用时间跨度

```typescript
{
  id: 'journey_choice',
  minAge: 18,
  text: '你想去西域游历。',
  choices: [
    {
      id: 'quick_trip',
      text: '快速往返（6 个月）',
      timeSpan: { value: 6, unit: 'month' },
      effects: [...],
    },
    {
      id: 'slow_trip',
      text: '慢慢游历（2 年）',
      timeSpan: { value: 2, unit: 'year' },
      effects: [...],
    },
  ],
}
```

### 3. 多阶段长事件示例

```typescript
// 阶段 1: 开始
{
  id: 'mission_start',
  text: '师傅交给你一个任务。',
  choices: [
    {
      id: 'accept',
      text: '接受任务',
      timeSpan: { value: 30, unit: 'day' },
      effects: [{ op: 'addEvent', field: 'events', value: 'onMission' }],
    },
  ],
}

// 阶段 2: 任务进行中
{
  id: 'mission_progress',
  text: '你在执行任务的路上...',
  condition: (state) => state.events.has('onMission'),
  choices: [...]
}

// 阶段 3: 任务完成
{
  id: 'mission_complete',
  text: '你成功完成了任务！',
  condition: (state) => state.flags.has('missionDone'),
  autoEffects: [...],
}
```

## 时间计算规则

### 按年推进
- 直接增加年龄
- 保持月份和日期不变

### 按月推进
- 总月数 = 年龄 × 12 + 当前月份 + 增加月数
- 新年龄 = floor(总月数 / 12)
- 新月份 = 总月数 % 12

### 按日推进
- 假设每月 30 天，每年 360 天
- 总天数 = 年龄 × 360 + 月份 × 30 + 日期 + 增加天数
- 新年龄 = floor(总天数 / 360)
- 新月份 = floor((总天数 % 360) / 30)
- 新日期 = (总天数 % 30) + 1

## 工具函数

### advanceTime
```typescript
import { advanceTime } from './utils/timeSystem';

// 推进时间
const updates = advanceTime(state, 30, 'day');
// 返回：{ age: ..., monthProgress: ..., dayProgress: ..., timeUnit: 'day' }
```

### formatTime
```typescript
import { formatTime } from './utils/timeSystem';

// 格式化显示
const timeStr = formatTime(state);
// 返回："15 岁 三月 初五" 或 "15 岁"（取决于时间单位）
```

### getTimeSpanInYears
```typescript
import { getTimeSpanInYears } from './utils/timeSystem';

// 将时间跨度转换为年（用于剧情匹配）
const years = getTimeSpanInYears(90, 'day'); // 返回 0.25
```

## 最佳实践

### 1. 选择合适的时问单位
- **日常事件**: 使用 'day'（闭关、照顾病人、短期修炼）
- **中期事件**: 使用 'month'（师门任务、短途旅行、学习技艺）
- **长期事件**: 使用 'year'（长途游历、重大突破、人生转折）

### 2. 多阶段事件设计
```typescript
// 阶段 1: 触发
{
  id: 'event_start',
  choices: [{
    id: 'begin',
    timeSpan: { value: 7, unit: 'day' },
    effects: [{ op: 'addEvent', value: 'eventStarted' }],
  }],
}

// 阶段 2: 进展
{
  id: 'event_progress',
  condition: (state) => state.events.has('eventStarted'),
  choices: [{
    id: 'continue',
    timeSpan: { value: 30, unit: 'day' },
    effects: [{ op: 'addFlag', value: 'eventDone' }],
  }],
}

// 阶段 3: 结果
{
  id: 'event_result',
  condition: (state) => state.flags.has('eventDone'),
  autoEffects: [...],
}
```

### 3. 时间跨度与属性变化匹配
- 短期（几天）: 小幅属性变化（+1 到 +5）
- 中期（几月）: 中等属性变化（+5 到 +20）
- 长期（几年）: 大幅属性变化（+20 以上）

## 注意事项

1. **时间跨度会影响年龄匹配**: 长事件结束后，年龄可能已经增长，需要确保后续剧情的 minAge/maxAge 能匹配

2. **避免时间跳跃过大**: 单个事件的时间跨度建议不超过 5 年，否则玩家会有跳跃感

3. **保持逻辑连贯**: 长事件应该有明确的开始、进展、结束阶段

4. **提供时间反馈**: 在剧情文本中明确说明时间流逝（如「三个月后...」）

## 示例代码

完整示例请参考：
- `/src/data/longEventExample.ts` - 长事件示例集合

## 未来扩展

可以进一步细化到：
- **周**: 修改 timeSystem.ts，添加 week 单位
- **时辰**: 添加 hour 单位（1 天=12 时辰）
- **季节**: 添加 season 字段，增加沉浸感
