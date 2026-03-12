# 剧情逻辑问题修复总结

## 修复的问题

### 1. ✅ 门派加入后剧情循环问题

**问题描述**：
玩家选择加入门派后，游戏未能触发后续剧情发展，而是直接进入"刻苦修炼"状态，经过一年后又重复出现门派加入选项，造成剧情循环。

**根本原因**：
- 门派录取节点清除了所有 flags (`flags: new Set()`)
- 但没有设置"已加入"的标记
- 招新公告的 condition 是 `state.sect === null`
- 当 sect 被设置后，理论上不应该再触发，但由于 flags 被清空，没有任何标记表明已经加入过门派

**修复方案**：
在录取节点的 autoEffect 中添加 `events` 标记：

```typescript
// 少林录取
autoEffect: (state) => ({
  age: state.age + 1,
  sect: '少林派',
  externalSkill: state.externalSkill + 10,
  internalSkill: state.internalSkill + 5,
  events: new Set(['joinedShaolin']), // 新增：设置已加入事件
  flags: new Set(),
})

// 武当录取
events: new Set(['joinedWudang']),

// 峨眉录取
events: new Set(['joinedEmei']),
```

**效果**：
- 加入门派后，`sect` 字段被正确设置
- 招新公告的 condition `state.sect === null` 不再满足
- 即使 flags 被清空，也有 `events` 记录表明已加入
- 不会重复触发门派加入剧情

---

### 2. ✅ 爱情线提供线索后无后续剧情问题

**问题描述**：
玩家选择"给意中人提供线索"的剧情分支后，系统未提供任何相应的后续剧情发展，导致剧情线中断。

**根本原因**：
阶段 3 的 condition 要求同时满足：
```typescript
condition: (state) => state.flags.has('approachedLove') && state.flags.has('helpedLove')
```

但"提供线索"选项只设置了 `events: new Set(['secondMeeting'])`，**没有设置任何 flag**，导致：
- `helpedLove` flag 不存在
- 阶段 3 的 condition 不满足
- 剧情无法继续

**修复方案**：

1. **为"提供线索"选项添加 flag**：
```typescript
{
  id: 'give_tips',
  text: '提供线索',
  effect: (state) => ({
    age: state.age + 1,
    flags: new Set(['helpedLove']), // 新增：设置帮助 flag
    events: new Set(['secondMeeting']),
    chivalry: state.chivalry + 5,
  }),
}
```

2. **简化阶段 3 的 condition**：
```typescript
// 修改前
condition: (state) => state.flags.has('approachedLove') && state.flags.has('helpedLove')

// 修改后
condition: (state) => state.flags.has('helpedLove')
```

3. **为"假装不认识"添加独立结局**：
```typescript
{
  id: 'love_stranger_path',
  minAge: 18,
  maxAge: 24,
  text: '自从你假装不认识后，你们的关系渐渐疏远。多年后听说 Ta 已与他人成婚。',
  condition: (state) => state.events.has('metLove') && state.events.has('secondMeeting') && !state.flags.has('helpedLove'),
  weight: 1000,
  autoNext: true,
  autoEffect: (state) => ({
    age: state.age + 5,
    martialPower: state.martialPower + 15,
    chivalry: Math.max(0, state.chivalry - 10),
    events: new Set(['loveEnded']),
  }),
}
```

**效果**：
- 选择"提供线索"也能进入感情发展线
- 选择"假装不认识"会有独立的悲伤结局
- 所有选择都有后续剧情，不会中断

---

### 3. ✅ 女性角色加入峨眉派却出现方丈的设定错误

**问题描述**：
玩家创建女性角色并加入峨眉派后，游戏中出现"方丈要传授易筋经"的剧情，与峨眉派设定（师太/掌门）严重冲突。

**根本原因**：
1. 少林专属剧情的 condition 只检查 `state.sect === '少林派'`
2. 但权重只有 30，低于普通剧情（50）
3. 导致其他门派的玩家也可能触发少林剧情

**修复方案**：

1. **提升所有门派专属剧情的权重到 1000**：

少林剧情：
```typescript
{
  id: 'shaolin_14_carry_water',
  condition: (state) => state.sect === '少林派',
  weight: 1000, // 从 30 提升到 1000
}

{
  id: 'shaolin_15_sutra',
  condition: (state) => state.sect === '少林派',
  weight: 1000, // 从 20 提升到 1000
}
```

武当剧情：
```typescript
{
  id: 'wudang_14_taiji',
  condition: (state) => state.sect === '武当派',
  weight: 1000, // 从 30 提升到 1000
}
```

峨眉剧情：
```typescript
{
  id: 'emei_14_sword',
  condition: (state) => state.sect === '峨眉派',
  weight: 1000, // 从 30 提升到 1000
}
```

2. **修复易筋经结果剧情的 condition**：
```typescript
// 修改前
condition: (state) => state.flags.has('stolenSutra') === false

// 修改后
condition: (state) => state.events.has('shaolinSutra') && !state.flags.has('stolenSutra')
```

**效果**：
- 只有少林弟子能触发少林剧情（方丈、易筋经）
- 只有武当弟子能触发武当剧情（张三丰、太极）
- 只有峨眉弟子能触发峨眉剧情（灭绝师太、峨眉剑法）
- 权重 1000 确保门派剧情优先于普通剧情

---

## 修改的文件

### 1. `/src/data/longEvents.ts`
- 门派录取节点添加 `events` 标记
- 爱情线"提供线索"选项添加 `helpedLove` flag
- 简化阶段 3 condition，移除 `approachedLove` 要求
- 添加"假装不认识"的独立结局

### 2. `/src/data/storyData.ts`
- 提升所有门派专属剧情的权重到 1000
- 修复易筋经结果剧情的 condition

---

## 测试验证

### 测试 1：门派加入流程
1. 创建角色，12-16 岁
2. 选择报名少林/武当/峨眉
3. 通过体魄和心性测试
4. 加入门派，获得对应加成
5. **验证**：不会再出现招新公告
6. **验证**：只触发对应门派的专属剧情

### 测试 2：爱情线完整流程
1. 16-22 岁，遇到意中人
2. 选择"提供线索"
3. **验证**：应该能进入"一起游历"剧情
4. **验证**：后续表白、求婚都应该正常触发

### 测试 3：门派剧情隔离
1. 创建女性角色，加入峨眉派
2. 14-16 岁
3. **验证**：应该出现"灭绝师太亲传剑法"，而不是"方丈"
4. **验证**：不会出现"易筋经"剧情（那是少林的）

---

## 技术要点

### 1. Flag vs Event 的使用
- **Flag**：临时状态，用于追踪长事件的进行中状态，事件结束后清除
- **Event**：永久记录，用于标记已发生的重大事件（如加入门派、结婚）

### 2. 权重优先级
- **1000**：长事件的下一阶段、门派专属剧情
- **100**：普通结果剧情
- **50-100**：单年龄节点
- **30-50**：年龄范围节点
- **30**：开放节点

### 3. Condition 设计原则
- 使用 `events` 检查永久状态（如是否加入门派）
- 使用 `flags` 检查临时状态（如长事件进行中）
- 使用 `!events.has()` 确保事件只触发一次
- 使用 `sect === '门派名'` 确保门派隔离

---

## 后续建议

1. **为所有长事件添加 event 标记**：
   - 武林大会结束后设置 `joinedTournament`
   - 爱情线结束后设置 `gotMarried` 或 `loveEnded`

2. **统一权重标准**：
   - 门派专属剧情：1000
   - 长事件下一阶段：1000
   - 普通剧情：50-100

3. **添加更多检查**：
   - 确保每个剧情节点都有适当的 condition
   - 避免不同剧情线之间的干扰
