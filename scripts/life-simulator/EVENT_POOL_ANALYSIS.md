# 事件池系统深度分析报告

## 🔍 核心问题诊断

### 问题 1：长事件优先逻辑错误

**当前实现**（simulator.ts:170-216）：
```typescript
if (state.flags.size > 0) {
  // 有 flag 时，优先匹配长事件链
  if (targetPattern) {
    const longEventNodes = allNodes.filter(...);
    if (longEventNodes.length > 0) {
      return [longEventNodes[0]];  // ❌ 直接返回，不回退
    }
  }
  // ❌ 没有 else 分支，如果长事件不触发，直接跳过所有事件
}

const normalNodes = allNodes.filter(...);
return normalNodes.sort(...);
```

**问题**：
1. 当 `targetPattern` 存在但长事件条件不满足时，既不返回长事件，也不检查普通事件
2. 导致某些年份 `nodes.length === 0`，触发"平静的一年"

**实际案例**：
```
13 岁：appliedShaolin flag 设置
  → targetPattern = 'shaolin_'
  → 检查 shaolin_physical_test（条件不满足）
  → longEventNodes = []
  → 不返回任何节点
  → nodes.length === 0
  → 记录"平静的一年" ❌ 错误！
```

### 问题 2：事件统计错误

**我的错误分析**：
- 我说"只有 19 个事件" ❌
- 实际有**65 个事件** ✅

**事件类型分布**：
```
📊 实际事件统计（longEvents.ts）：
- 门派入门：13 个（招新、测试、录取/拒绝）
- 武林大会：13 个（公告、初赛、半决赛、决赛、结果）
- 爱情线：13 个（相遇、发展、表白、求婚、结婚）
- 自学成才：1 个
- 总计：40 个基础事件 + 25 个选择分支 = 65 个
```

### 问题 3：权重系统失效

**所有事件权重都是 1000**：
```typescript
weight: 1000, // 所有事件都一样
```

**后果**：
- 权重排序失去意义
- 所有事件优先级相同
- 无法区分"重要事件"和"日常事件"

## 🔧 修复方案

### 方案 1：修复长事件回退逻辑

```typescript
private getAvailableNodes(state: PlayerState, allNodes: StoryNode[]): StoryNode[] {
  if (state.flags.size > 0) {
    let targetPattern = '';
    
    // ... 设置 targetPattern 的逻辑 ...
    
    if (targetPattern) {
      const longEventNodes = allNodes.filter(
        node => node.minAge !== undefined &&
                node.minAge <= state.age &&
                (!node.maxAge || node.maxAge >= state.age) &&
                (!node.condition || this.evaluateCondition(node.condition, state)) &&
                node.id.includes(targetPattern)
      );
      
      if (longEventNodes.length > 0) {
        return longEventNodes.sort((a, b) => (b.weight || 0) - (a.weight || 0));
      }
      // ✅ 新增：如果长事件不触发，回退到普通事件
    }
  }
  
  // 普通事件（包括所有类型）
  const normalNodes = allNodes.filter(
    node => node.minAge !== undefined &&
            node.minAge <= state.age &&
            (!node.maxAge || node.maxAge >= state.age) &&
            (!node.condition || this.evaluateCondition(node.condition, state))
  );
  
  return normalNodes.sort((a, b) => (b.weight || 0) - (a.weight || 0));
}
```

### 方案 2：重构权重系统

```typescript
// 权重分级系统
const WEIGHTS = {
  CRITICAL: 10000,  // 关键剧情（必须触发）
  MAJOR: 5000,      // 主线事件
  NORMAL: 1000,     // 普通事件
  DAILY: 100,       // 日常事件
  RANDOM: 10,       // 随机事件
};

// 应用示例
{
  id: 'sect_recruitment_announcement',
  weight: WEIGHTS.CRITICAL,  // 10000
}
{
  id: 'tournament_announcement',
  weight: WEIGHTS.MAJOR,  // 5000
}
{
  id: 'daily_cultivation',
  weight: WEIGHTS.DAILY,  // 100
}
```

### 方案 3：添加日常事件池

创建新文件 `src/data/dailyEvents.ts`：

```typescript
export const dailyEvents: StoryNode[] = [
  // 日常修炼
  {
    id: 'daily_martial_practice',
    minAge: 12,
    maxAge: 80,
    text: '新的一年，你要如何修炼？',
    condition: (state) => !state.events.has('majorEventThisYear'),
    weight: 200,
    choices: [
      {
        id: 'practice_martial',
        text: '修炼武功',
        effect: (state) => ({
          martialPower: state.martialPower + 3,
          internalSkill: state.internalSkill + 2,
        }),
      },
      {
        id: 'practice_external',
        text: '修炼外功',
        effect: (state) => ({
          externalSkill: state.externalSkill + 3,
        }),
      },
      {
        id: 'practice_qinggong',
        text: '修炼轻功',
        effect: (state) => ({
          qinggong: state.qinggong + 3,
        }),
      },
    ],
  },
  
  // 江湖游历
  {
    id: 'daily_travel',
    minAge: 15,
    maxAge: 60,
    text: '你想出去游历江湖吗？',
    condition: (state) => state.chivalry >= 10,
    weight: 150,
    choices: [
      {
        id: 'travel_jianghu',
        text: '游历江湖',
        effect: (state) => ({
          chivalry: state.chivalry + 5,
          money: state.money + 50,
        }),
      },
      {
        id: 'stay_home',
        text: '留在家中',
        effect: (state) => ({
          internalSkill: state.internalSkill + 2,
        }),
      },
    ],
  },
  
  // 打工赚钱
  {
    id: 'daily_work',
    minAge: 15,
    maxAge: 70,
    text: '你需要赚钱维持生计。',
    condition: (state) => state.money < 200,
    weight: 100,
    choices: [
      {
        id: 'work_hard',
        text: '努力工作',
        effect: (state) => ({
          money: state.money + 150,
        }),
      },
      {
        id: 'work_normal',
        text: '普通工作',
        effect: (state) => ({
          money: state.money + 80,
        }),
      },
    ],
  },
  
  // 社交互动
  {
    id: 'daily_social',
    minAge: 15,
    maxAge: 80,
    text: '朋友邀请你聚会。',
    condition: (state) => state.chivalry >= 15,
    weight: 120,
    choices: [
      {
        id: 'attend_party',
        text: '参加聚会',
        effect: (state) => ({
          chivalry: state.chivalry + 3,
          money: state.money - 30,
        }),
      },
      {
        id: 'decline_party',
        text: '婉拒',
        effect: (state) => ({
          internalSkill: state.internalSkill + 1,
        }),
      },
    ],
  },
  
  // 随机奇遇
  {
    id: 'daily_encounter',
    minAge: 15,
    maxAge: 60,
    text: '你在路上遇到了...',
    condition: (state) => Math.random() < 0.15,  // 15% 概率
    weight: 180,
    choices: [
      {
        id: 'meet_master',
        text: '遇到隐世高人',
        effect: (state) => ({
          martialPower: state.martialPower + 5,
        }),
      },
      {
        id: 'find_herb',
        text: '发现珍贵草药',
        effect: (state) => ({
          money: state.money + 100,
        }),
      },
      {
        id: 'help_person',
        text: '帮助遇到困难的人',
        effect: (state) => ({
          chivalry: state.chivalry + 10,
        }),
      },
    ],
  },
];
```

### 方案 4：改进事件触发统计

```typescript
// 在模拟器中添加事件统计
private eventStats: Record<string, number> = {};

private recordChoice(...) {
  // 统计事件类型
  const eventType = this.getEventType(nodeId);
  this.eventStats[eventType] = (this.eventStats[eventType] || 0) + 1;
  
  // ... 其他记录逻辑 ...
}

private getEventType(nodeId: string): string {
  if (nodeId.includes('sect')) return '🏛️ 门派';
  if (nodeId.includes('tournament')) return '⚔️ 武林大会';
  if (nodeId.includes('love')) return '💕 爱情';
  if (nodeId.includes('daily')) return '📖 日常';
  if (nodeId.includes('encounter')) return '🎲 奇遇';
  return '📅 其他';
}

// 在报告末尾显示统计
console.log('\n📊 事件统计:');
Object.entries(this.eventStats).forEach(([type, count]) => {
  console.log(`   ${type}: ${count}次`);
});
```

## 📈 预期效果

### 修复前
```
30 年模拟：
- 总记录：65 条
- 门派事件：3 条
- 平静的一年：62 条
- 其他事件：0 条 ❌
```

### 修复后（预期）
```
30 年模拟：
- 总记录：70 条
- 门派事件：3 条
- 日常修炼：10 条
- 江湖奇遇：3 条
- 打工赚钱：5 条
- 社交互动：4 条
- 平静的一年：45 条 ✅
```

## 🎯 实施优先级

### P0：立即修复
1. ✅ 修复长事件回退逻辑
2. ✅ 确保所有事件都能被统计

### P1：短期改进
1. ✅ 添加日常事件池
2. ✅ 重构权重系统

### P2：中期优化
1. ⭕ 添加事件统计功能
2. ⭕ 改进 AI 评分系统

---

**分析完成时间**: 2026-03-11  
**核心问题**: 长事件回退逻辑错误  
**建议立即修复**: ✅
