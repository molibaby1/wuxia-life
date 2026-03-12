# 测试系统使用文档

## 快速开始

### 运行测试
```bash
cd /Users/zhouyun/code/wuxia-life
npx tsx scripts/runStoryTests-full.ts
```

## 测试结果（当前）

```
总测试数：6
通过：1
失败：5
通过率：16.67%
```

## 发现的问题及修复方案

### 问题 1: 门派入门缺少录取阶段

**现象**: 少林、武当、峨眉入门测试都卡在mentalTest，没有触发accepted节点

**原因**: 
- `shaolin_accepted` 等节点的 condition 检查 `flags.has('mentalPass')`
- 但 mentalTest 的 effect 设置了 `flags: new Set(['mentalPass'])`
- 下一个回合时，由于节点匹配逻辑，优先匹配了其他节点

**修复方案**:
1. 修改 `getAvailableNodes` 函数，确保 `accepted` 节点优先级最高
2. 或者修改 accepted 节点的 condition，同时检查 events

**修复代码** (在 longEvents.ts 中):
```typescript
{
  id: 'shaolin_accepted',
  condition: (state) => 
    state.flags.has('appliedShaolin') && 
    state.flags.has('mentalPass'),
  // 改为:
  // condition: (state) => 
  //   state.flags.has('appliedShaolin') && 
  //   state.flags.has('mentalPass') &&
  //   !state.events.has('joinedShaolin'),
}
```

### 问题 2: 爱情线第 3 步无法触发

**现象**: 选择 help_investigate 或 give_tips 后，下一步找不到 love_develop_relationship

**原因**:
- 第 2 步后 flags 有 `helpedLove`
- `getAvailableNodes` 优先匹配包含特定关键词的节点
- 但 `love_develop_relationship` 包含 `love_`，应该被匹配
- 实际可用节点只有 `sect_recruitment_announcement`

**修复方案**:
检查 `getAvailableNodes` 函数的过滤逻辑

### 问题 3: 峨眉派 answer_virtue 条件不满足

**现象**: 测试设置 chivalry=50，但 answer_virtue 的 condition (chivalry>=15) 不满足

**原因**: 
- 可能是条件检查函数的问题
- 或者 player 状态在传递过程中被修改

## 测试用例编写指南

### 基本结构
```typescript
{
  name: '测试名称',
  description: '测试描述',
  initialAge: 12,
  initialGender: 'male',
  initialSect: null,
  initialExternalSkill: 15, // 可选，覆盖默认值
  initialInternalSkill: 15,
  initialChivalry: 20,
  choices: ['choice1', 'choice2', 'choice3'],
  expectedNodes: ['node1', 'node2', 'node3'],
  expectedEvents: ['event1', 'event2'],
  expectedFlags: ['flag1'],
}
```

### 添加新测试
在 `scripts/runStoryTests-full.ts` 的 `testCases` 数组中添加：

```typescript
{
  name: '新测试',
  description: '描述',
  initialAge: 18,
  initialGender: 'male',
  initialSect: '武当派',
  initialMartialPower: 60,
  choices: ['join_tournament', 'fight_careful'],
  expectedNodes: ['tournament_announcement', 'tournament_preliminary'],
  expectedEvents: ['tournament2024'],
  expectedFlags: ['joinedTournament'],
}
```

## 调试技巧

### 1. 查看可用节点
测试输出会显示每一步的可用节点：
```
可用节点 (2): sect_recruitment_announcement, love_first_meeting
```

### 2. 检查条件
如果显示"条件不满足"，检查：
- 玩家的属性值是否正确
- condition 函数是否写对

### 3. 单步调试
添加 `console.log` 查看状态：
```typescript
console.log('Player state:', player);
console.log('Flags:', Array.from(player.flags));
console.log('Events:', Array.from(player.events));
```

## 下一步改进

### 1. 使用真实数据
目前使用 mock 数据，应该：
- 直接导入 `longEvents.ts` 中的实际数据
- 或者将剧情数据导出为 JSON

### 2. 增加测试覆盖
添加更多测试用例：
- 武林大会完整流程
- 所有门派的失败路线
- 爱情线的不同结局
- 自学成才路线

### 3. 自动化 CI
在 GitHub Actions 中集成：
```yaml
- name: Run story tests
  run: npx tsx scripts/runStoryTests-full.ts
```

## 常见问题

### Q: 为什么测试失败？
A: 测试失败说明剧情逻辑有问题，需要根据错误信息修复剧情数据。

### Q: 如何跳过某个测试？
A: 在 testCases 数组中注释掉对应的测试对象。

### Q: 测试通过但游戏还是有问题？
A: 测试使用的是 mock 数据，可能与实际游戏数据不同步。需要导入真实数据。
