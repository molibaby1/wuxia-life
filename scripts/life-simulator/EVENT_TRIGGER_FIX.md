# 事件触发机制差异分析 - 测试环境 vs 游戏本体

## 🔍 核心问题

**用户反馈**：
- ✅ 游戏本体：能正常遇到比武大会、仙草等事件
- ❌ 测试环境：这些事件完全无法触发

## 📊 事件触发条件对比

### 1. 武林大会事件

**游戏本体** (`storyData.ts:1601`):
```typescript
{
  id: 'martial_tournament_announcement',
  minAge: 22,  // ✅ 22 岁触发
  maxAge: 35,
  text: '五年一度的武林大会召开了，你要去参加吗？',
  condition: (state) => !state.events.has('martialTournament'),
  weight: 30,
  choices: [{
    id: 'join_tournament',
    text: '参加大会',
    condition: (state) => state.martialPower >= 30,  // ✅ 武功≥30
  }],
}
```

**长事件版本** (`longEvents.ts:354`):
```typescript
{
  id: 'tournament_announcement',
  minAge: 18,  // ⚠️ 18 岁触发
  maxAge: 35,
  text: '江湖传闻，五年一度的武林大会即将在华山召开！',
  condition: (state) => state.martialPower >= 25 && !state.events.has('tournament2024'),
  weight: 30,
  choices: [{
    id: 'join_tournament',
    text: '报名参加',
    // ✅ 无额外条件
  }],
}
```

**差异分析**：
| 项目 | 游戏本体 | 长事件版 | 测试系统 |
|------|----------|----------|----------|
| 触发年龄 | 22 岁 | 18 岁 | 18 岁 |
| 武功要求 | ≥30 | ≥25 | ≥25 |
| 事件标记 | `martialTournament` | `tournament2024` | `tournament2024` |
| 权重 | 30 | 30 | 30 |

**问题 1：年龄不一致**
- 游戏本体：22 岁触发
- 测试系统：18 岁触发
- **结果**：测试系统在 18-21 岁期间尝试触发，但玩家武功可能不够

**问题 2：武功成长不足**
```
测试系统实际数据：
0-11 岁：属性全 0
12 岁：加入门派
13 岁：体魄测试（失败）
14 岁：被拒绝，martialPower = 5
15-18 岁：无成长，martialPower = 5
18 岁：尝试触发武林大会 ❌ 失败（需要 25，实际只有 5）
```

### 2. 仙草事件

**游戏本体** (`storyData.ts:1560`):
```typescript
{
  id: 'encounter_immortal_grass',
  minAge: 15,  // ✅ 15 岁+
  maxAge: 80,
  text: '你在江湖上已有小名气，一日在山中发现一株发光的仙草！',
  condition: (state) => !state.flags.has('hasEatenImmortalGrass'),
  weight: 100,  // ✅ 高权重
  choices: [
    {
      id: 'eat_immortal_grass',
      text: '吃下仙草',
      effect: (state) => ({ 
        age: state.age + 1, 
        internalSkill: state.internalSkill + 50,
        martialPower: state.martialPower + 30,
      }),
    },
  ],
}
```

**测试系统**：
```
❌ 未找到仙草事件！
```

**问题 3：事件源不一致**
- 游戏本体：从 `storyData.ts` 加载
- 测试系统：只从 `longEvents.ts` 加载
- **结果**：`storyData.ts` 中的大量事件（包括仙草）未被测试系统加载

## 🔧 根本原因分析

### 原因 1：数据源割裂 ❌

**游戏本体**：
```typescript
// 实际使用的数据源
import { storyNodes } from './data/storyData';  // 包含仙草等事件
import { longEvents } from './data/longEvents';  // 包含长事件
```

**测试系统**：
```typescript
// 只加载了长事件
const { sectJoinEvents, tournamentEvents, loveEvents } = 
  require('../../src/data/longEvents.ts');
```

**缺失的数据**：
- ❌ `storyData.ts` 中的 60+ 个普通事件
- ❌ 仙草、比武大会、奇遇等经典事件
- ❌ 日常修炼、江湖游历等事件

### 原因 2：属性成长曲线不匹配 ❌

**游戏本体的成长**：
```
玩家通过实际游玩获得属性提升：
├─ 完成新手任务：+10 属性
├─ 击败小怪：+5 属性
├─ 修炼武功：+8 属性/年
└─ 到 18 岁时：武功≈50-80 ✅ 可以触发武林大会
```

**测试系统的成长**：
```
自动模拟的属性提升：
├─ 0-11 岁：全 0
├─ 12 岁：加入门派（无提升）
├─ 13 岁：体魄测试失败（martialPower = 5）
├─ 14 岁：被拒绝（martialPower = 5）
├─ 15-18 岁：无事件，无成长
└─ 18 岁时：武功=5 ❌ 无法触发武林大会
```

### 原因 3：事件触发逻辑不一致 ❌

**游戏本体**：
```typescript
// 每次玩家行动后检查
function checkEventTrigger() {
  const availableNodes = storyNodes.filter(node => 
    node.minAge <= player.age &&
    node.maxAge >= player.age &&
    (!node.condition || node.condition(player))
  );
  
  // 按权重排序，但有随机性
  return availableNodes.sort((a, b) => {
    const weightDiff = b.weight - a.weight;
    return weightDiff - Math.random() * 20;  // ✅ 有随机扰动
  });
}
```

**测试系统**：
```typescript
// 纯 deterministic 的选择
const availableNodes = nodes.filter(...);
return availableNodes.sort((a, b) => b.weight - a.weight);  // ❌ 无随机性
```

## 🎯 修复方案

### 方案 1：统一数据源（推荐）⭐

**步骤**：
1. 测试系统同时加载 `storyData.ts` 和 `longEvents.ts`
2. 确保事件 ID 不冲突
3. 统一触发条件

**实现**：
```typescript
// 修改 simulator.ts
private loadStoryNodes(): StoryNode[] {
  try {
    const { storyNodes } = require('../../src/data/storyData');
    const { sectJoinEvents, tournamentEvents, loveEvents } = 
      require('../../src/data/longEvents');
    
    // 合并所有事件
    const allNodes = [
      ...(storyNodes || []),
      ...(sectJoinEvents || []),
      ...(tournamentEvents || []),
      ...(loveEvents || []),
    ];
    
    console.log(`📚 已加载 ${allNodes.length} 个故事节点`);
    console.log(`   - storyData: ${storyNodes?.length || 0} 个`);
    console.log(`   - longEvents: ${sectJoinEvents?.length || 0} 个`);
    
    return allNodes;
  } catch (error) {
    console.error('❌ 加载事件失败:', error);
    return [];
  }
}
```

### 方案 2：改进属性成长系统

**添加基础成长事件**：
```typescript
// 每年自动触发
{
  id: 'annual_cultivation',
  minAge: 12,
  maxAge: 80,
  text: '新的一年，你勤加修炼。',
  autoNext: true,
  weight: 50,
  autoEffect: (state) => ({
    martialPower: state.martialPower + 3,
    internalSkill: state.internalSkill + 2,
    externalSkill: state.externalSkill + 2,
  }),
}
```

### 方案 3：添加随机扰动

**修改决策引擎**：
```typescript
// 在权重排序时添加随机性
return availableNodes.sort((a, b) => {
  const weightDiff = b.weight - a.weight;
  const randomFactor = (Math.random() - 0.5) * 20;  // ✅ 添加扰动
  return weightDiff + randomFactor;
});
```

## 📈 预期效果

### 修复前
```
0-11 岁：平静（12 次）
12 岁：门派招新
13 岁：体魄测试（失败）
14 岁：被拒绝
15-80 岁：平静（66 次）❌ 无任何事件

武林大会：❌ 未触发（武功不够）
仙草事件：❌ 未触发（未加载）
```

### 修复后（预期）
```
0-11 岁：平静（12 次）
12 岁：门派招新
13 岁：体魄测试
14 岁：心性测试
15 岁：修炼成长
16 岁：仙草事件 ✅
17 岁：修炼成长
18 岁：修炼成长
19 岁：修炼成长
20 岁：修炼成长
21 岁：修炼成长
22 岁：武林大会 ✅（武功≈35）
...

总事件数：15-20 个（vs 当前 3 个）
```

## 🎯 实施优先级

### P0：立即修复
1. ✅ 加载 `storyData.ts` 中的所有事件
2. ✅ 合并事件池

### P1：短期改进
1. ⏳ 添加基础成长事件
2. ⏳ 添加随机扰动

### P2：中期优化
1. ⏳ 验证属性成长曲线
2. ⏳ 对比游戏实际触发率

---

**分析完成时间**: 2026-03-11  
**核心问题**: 数据源割裂 + 属性成长不足  
**建议立即修复**: ✅
