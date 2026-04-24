# 背景差异化事件系统设计方案

## 1. 系统目标

解决当前游戏中所有玩家经历相同事件序列的问题，实现根据不同初始背景生成差异化事件体验。

## 2. 当前问题分析

- 所有玩家在 1 岁时选择出身背景（武林世家、书香门第、商贾之家、边疆异族）
- 但后续事件系统并未充分利用背景信息，导致同质化体验
- "书香门第"背景玩家同样经历大量武学相关事件
- 缺乏基于背景的事件权重系统

## 3. 设计方案

### 3.1 背景标识系统
为每个事件添加背景相关标签，使用 `backgroundWeight` 属性：

```json
{
  "metadata": {
    "backgroundWeights": {
      "scholar": 0.3,    // 书香门第权重
      "merchant": 0.2,   // 商贾之家权重
      "wuxia": 0.8,     // 武林世家权重
      "frontier": 0.1    // 边疆异族权重
    }
  }
}
```

### 3.2 条件过滤机制
在事件筛选时，根据玩家背景动态调整事件触发概率：

```typescript
function calculateBackgroundWeight(event: EventDefinition, playerOrigin: string): number {
  const baseWeight = event.weight || 50;
  const backgroundWeights = event.metadata?.backgroundWeights || {};
  const multiplier = backgroundWeights[playerOrigin] || 0.5; // 默认 0.5
  return baseWeight * multiplier;
}
```

### 3.3 专属事件系统
为每种背景创建专属事件链，确保差异化体验：

#### 3.3.1 书香门第 (Scholar Family)
- 文学启蒙、诗书礼仪
- 学堂求学、科举之路
- 文人雅士交往
- 仕途发展
- 减少武学事件比例

#### 3.3.2 商贾之家 (Merchant Family) 
- 商业启蒙、理财之道
- 商路开拓、贸易往来
- 商会结交
- 市场波动、商业危机
- 减少武学事件比例

#### 3.3.3 武林世家 (Wuxia Family)
- 家传武学、武学渊源
- 同门交流、师门传承
- 门派事务
- 维持原有武学事件

#### 3.3.4 边疆异族 (Frontier Minority)
- 异域文化、独特技能
- 边境生活、马背文化
- 异族冲突与融合
- 独特武学风格

## 4. 实现步骤

### 第一阶段：基础架构
1. 修改事件选择算法，加入背景权重计算
2. 为现有事件添加背景权重标签
3. 创建背景相关的条件评估函数

### 第二阶段：专属事件
1. 为书香门第添加文人事件链
2. 为商贾之家添加商业事件链
3. 为边疆异族添加文化事件链
4. 调整武林世家事件权重

### 第三阶段：高级特性
1. 实现事件依赖背景的动态调整
2. 添加背景转换机制
3. 优化事件权重平衡

## 5. 技术实现

### 5.1 在 GameEngineIntegration.ts 中修改 selectEvent 方法

```typescript
private selectEvent(): EventDefinition | null {
  // ... 现有逻辑 ...
  
  // 根据玩家背景调整事件权重
  const playerOrigin = this.getPlayerOrigin(); // 获取玩家背景
  weightedEvents.forEach(event => {
    const backgroundWeight = this.calculateBackgroundWeight(event, playerOrigin);
    event.weight = backgroundWeight;
  });
  
  // ... 后续逻辑 ...
}
```

### 5.2 添加辅助方法

```typescript
private getPlayerOrigin(): string {
  const state = this.gameState;
  if (state.player?.flags?.origin_scholar_family) return 'scholar';
  if (state.player?.flags?.origin_merchant_family) return 'merchant';
  if (state.player?.flags?.origin_wuxia_family) return 'wuxia';
  if (state.player?.flags?.origin_frontier) return 'frontier';
  return 'common'; // 默认
}

private calculateBackgroundWeight(event: EventDefinition, playerOrigin: string): number {
  const baseWeight = event.weight || 50;
  const backgroundWeights = event.metadata?.backgroundWeights || {};
  const multiplier = backgroundWeights[playerOrigin] || 0.5; // 默认 0.5
  return Math.max(baseWeight * multiplier, 1); // 确保最小权重为 1
}
```

## 6. 预期效果

- 不同背景玩家将体验到显著差异化的事件流程
- 书香门第玩家更多遇到文人雅士、科举仕途相关事件
- 商贾之家玩家更多遇到商业贸易、理财相关事件
- 武林世家玩家继续享受传统武侠体验
- 边疆异族玩家体验独特文化特色
- 保持一定的事件多样性，避免过于单一