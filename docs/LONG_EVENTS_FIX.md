# 长事件优先级问题已修复

## 问题原因

之前设置了 flag 后，长事件的下一阶段没有被触发，而是跳到了其他普通剧情。

**根本原因**：
1. `getAvailableNodes` 函数只匹配包含 'result'、'_win'、'_lose' 等关键词的 flag 节点
2. 长事件的下一阶段节点 ID 不符合这些模式（如 `shaolin_physical_test`、`love_second_encounter`）
3. 因此被忽略，游戏继续匹配其他普通剧情

## 解决方案

### 1. 修改节点匹配逻辑
在 `getAvailableNodes` 函数中，增加长事件节点 ID 模式的识别：

```typescript
// 优先匹配长事件的下一阶段（检查 flag 条件）
if (state.flags.size > 0) {
  const longEventNodes = storyNodes.filter(
    node => node.minAge !== undefined &&
            node.minAge <= state.age &&
            checkNodeCondition(node, state) &&
            (
              // 原有的结果节点模式
              node.id.includes('result') || 
              node.id.includes('_win') || 
              node.id.includes('_lose') || 
              // ...
              // 长事件节点模式
              node.id.includes('tournament_') ||
              node.id.includes('love_') ||
              node.id.includes('sect_') ||
              node.id.includes('physical_test') ||
              node.id.includes('mental_test') ||
              node.id.includes('accepted') ||
              node.id.includes('rejected')
            )
    );
    
    if (longEventNodes.length > 0) {
      return [longEventNodes[0]];
    }
}
```

### 2. 提高长事件节点权重
将所有长事件节点的权重从 100 提升到 1000，确保它们总是被优先选择：

```typescript
{
  id: 'shaolin_physical_test',
  minAge: 12,
  maxAge: 17,
  text: '...',
  condition: (state) => state.flags.has('appliedShaolin'),
  weight: 1000, // 高权重，确保优先触发
  choices: [...]
}
```

## 修改的文件

### 1. `/src/data/storyData.ts`
- 修改 `getAvailableNodes` 函数
- 增加长事件节点 ID 模式识别

### 2. `/src/data/longEvents.ts`
- 所有长事件节点的 `weight` 从 100 改为 1000

## 现在的行为

### 门派入门事件
1. 选择报名少林 → 设置 `appliedShaolin` flag
2. **下一回合立即触发** 体魄测试（因为 flag 存在 + 高权重）
3. 完成测试 → 设置 `physicalPass` flag
4. **下一回合立即触发** 心性测试
5. 完成测试 → 设置 `mentalPass` flag
6. **下一回合立即触发** 录取结果

### 武林大会事件
1. 选择参加大会 → 设置 `joinedTournament` flag
2. **下一回合立即触发** 初赛
3. 完成初赛 → 设置 `preliminaryWin` flag
4. **下一回合立即触发** 半决赛
5. 完成半决赛 → 设置 `semifinalWin` flag
6. **下一回合立即触发** 决赛

### 爱情线事件
1. 选择打招呼 → 设置 `approachedLove` flag
2. **下一回合立即触发** 再次相遇
3. 选择帮忙 → 设置 `helpedLove` flag
4. **下一回合立即触发** 感情发展

## 优先级规则

现在的节点匹配优先级：

1. **最高优先级**：有 flag 且 ID 匹配长事件模式的节点（权重 1000）
2. **高优先级**：有 flag 的结果节点（权重 100）
3. **中优先级**：单年龄节点（权重 50-100）
4. **低优先级**：年龄范围节点（权重 40-50）
5. **最低优先级**：开放节点（权重 30-40）

## 测试验证

### 测试步骤
1. 创建新角色
2. 12-16 岁时选择报名门派
3. 应该**立即**进入体魄测试，不会插入其他剧情
4. 完成测试后**立即**进入心性测试
5. 最后**立即**进入录取结果

### 预期结果
- 长事件的各个阶段应该**连续触发**，中间不会插入其他剧情
- 每个阶段完成后，下一阶段在下一回合立即出现
- 不会被"岁月流逝"或其他随机事件打断

## 技术细节

### 条件检查顺序
```typescript
// 1. 检查 flag（长事件优先）
if (state.flags.size > 0) {
  const longEventNodes = ... // 匹配长事件模式
  if (longEventNodes.length > 0) {
    return [longEventNodes[0]]; // 立即返回
  }
}

// 2. 检查单年龄节点
const exactAgeNodes = ...

// 3. 检查年龄范围节点
const rangeNodes = ...

// 4. 检查开放节点
const openEndedNodes = ...

// 5. 返回默认节点
return [safeDefaultNode];
```

### flag 清除时机
长事件的 flag 在以下时机清除：
- **自动清除**：结果节点（autoEffect 中 `flags: new Set()`）
- **手动清除**：某些阶段完成后

这样可以确保：
- 长事件进行中被正确追踪
- 长事件结束后不会重复触发
- 新的长事件可以正常开始
