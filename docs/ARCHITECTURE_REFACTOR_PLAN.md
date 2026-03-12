# 剧情事件系统架构重构方案

## 📋 问题分析

### 当前架构的问题

1. **配置与逻辑深度耦合**
   - 事件配置直接包含 JavaScript 函数
   - 每个事件重复实现相同逻辑
   - 缺少统一的副作用管理机制

2. **状态更新责任分散**
   - 事件配置、引擎、Store 都有状态更新逻辑
   - 合并逻辑不一致
   - 开发者难以预测行为

3. **缺少统一的完成标志机制**
   - 依赖开发者自觉设置
   - 没有架构级约束
   - 容易遗漏导致死循环

4. **条件检查的隐式依赖**
   - 条件逻辑分散
   - 缺少前置条件管理
   - 依赖链难以追踪

5. **缺少生命周期管理**
   - 没有统一的后处理
   - 事件完成标志手动设置
   - 缺少生命周期钩子

## 🏗️ 重构方案

### 方案 1：基于效果系统的声明式配置（推荐）

**核心思想**：将事件效果声明化，由统一的解释器执行

```typescript
// 1. 定义效果类型
type EffectType = 
  | { type: 'AGE_INCREMENT'; value: number }
  | { type: 'STAT_MODIFY'; stat: string; value: number; operator: 'add' | 'multiply' }
  | { type: 'FLAG_SET'; flag: string }
  | { type: 'EVENT_RECORD'; event: string }
  | { type: 'TIME_ADVANCE'; unit: 'year' | 'month'; value: number };

// 2. 声明式事件配置
interface StoryNode {
  id: string;
  minAge: number;
  maxAge?: number;
  text: string;
  condition?: Condition;
  weight?: number;
  autoNext?: boolean;
  
  // 声明式效果（而非函数）
  effects: EffectType[];
  
  // 自动设置的完成标志（由系统保证）
  onComplete?: {
    setEvent: string;  // 自动设置事件完成标志
    setFlag?: string;  // 可选的额外 flag
  };
  
  choices?: StoryChoice[];
}

// 3. 统一的效果执行器
class EffectExecutor {
  execute(effects: EffectType[], state: PlayerState): PlayerStateUpdates {
    const updates: PlayerStateUpdates = {};
    
    for (const effect of effects) {
      switch (effect.type) {
        case 'AGE_INCREMENT':
          updates.age = state.age + effect.value;
          break;
        case 'STAT_MODIFY':
          const currentValue = state[effect.stat as keyof PlayerState] as number;
          updates[effect.stat as keyof PlayerState] = 
            effect.operator === 'add' 
              ? currentValue + effect.value 
              : currentValue * effect.value;
          break;
        case 'FLAG_SET':
          if (!updates.flags) updates.flags = new Set();
          updates.flags.add(effect.flag);
          break;
        case 'EVENT_RECORD':
          if (!updates.events) updates.events = new Set();
          updates.events.add(effect.event);
          break;
        case 'TIME_ADVANCE':
          // 统一的时间推进逻辑
          const timeUpdates = advanceTime(state, effect.value, effect.unit);
          Object.assign(updates, timeUpdates);
          break;
      }
    }
    
    return updates;
  }
}

// 4. 事件配置示例
const bullyResultIgnored: StoryNode = {
  id: 'bully_result_ignored',
  minAge: 8,
  maxAge: 13,
  text: '你装作没看见，绕道而行...',
  condition: (state) => state.flags.has('ignoredBully'),
  autoNext: true,
  weight: 100,
  
  // 声明式效果
  effects: [
    { type: 'TIME_ADVANCE', unit: 'year', value: 1 },
  ],
  
  // 自动设置完成标志（系统保证）
  onComplete: {
    setEvent: 'bullyIgnored',
  },
};
```

**优势**：
- ✅ 配置与逻辑完全分离
- ✅ 效果执行统一化
- ✅ 完成标志强制设置
- ✅ 易于测试和验证

---

### 方案 2：基于模板的事件生成

**核心思想**：为常见事件模式创建模板，减少重复代码

```typescript
// 1. 事件模板系统
interface EventTemplate {
  id: string;
  condition?: (state: PlayerState) => boolean;
  weight: number;
  effects: EffectType[];
  onComplete: string;
}

// 2. 模板工厂
class EventTemplateFactory {
  // 模板：普通成长事件
  static createNormalGrowth(params: {
    id: string;
    ageRange: [number, number];
    text: string;
    statGrowth: Record<string, number>;
  }): StoryNode {
    return {
      ...params,
      effects: [
        { type: 'TIME_ADVANCE', unit: 'year', value: 1 },
        ...Object.entries(params.statGrowth).map(([stat, value]) => ({
          type: 'STAT_MODIFY' as const,
          stat,
          value,
          operator: 'add' as const,
        })),
      ],
      onComplete: params.id,  // 自动设置完成标志
    };
  }
  
  // 模板：剧情结果事件
  static createPlotResult(params: {
    id: string;
    ageRange: [number, number];
    text: string;
    triggerFlag: string;
    condition?: (state: PlayerState) => boolean;
  }): StoryNode {
    return {
      id: params.id,
      minAge: params.ageRange[0],
      maxAge: params.ageRange[1],
      text: params.text,
      condition: (state) => 
        state.flags.has(params.triggerFlag) && 
        !state.events.has(params.id) &&
        (!params.condition || params.condition(state)),
      autoNext: true,
      weight: 100,
      effects: [
        { type: 'TIME_ADVANCE', unit: 'year', value: 1 },
      ],
      onComplete: params.id,
    };
  }
}

// 3. 使用模板创建事件
const age8to12Normal = EventTemplateFactory.createNormalGrowth({
  id: 'age_8_to_12_normal',
  ageRange: [8, 12],
  text: '日复一日，你的武艺在逐渐进步。',
  statGrowth: {
    externalSkill: 2,
    internalSkill: 2,
    martialPower: 2,
  },
});

const bullyResultIgnored = EventTemplateFactory.createPlotResult({
  id: 'bully_result_ignored',
  ageRange: [8, 13],
  text: '你装作没看见，绕道而行...',
  triggerFlag: 'ignoredBully',
});
```

**优势**：
- ✅ 减少代码重复
- ✅ 强制统一的模式
- ✅ 类型安全
- ✅ 易于维护

---

### 方案 3：基于状态机的生命周期管理

**核心思想**：为事件链引入状态机，管理事件的生命周期

```typescript
// 1. 事件状态机
interface EventStateMachine {
  id: string;
  currentState: 'pending' | 'triggered' | 'completed';
  transitions: {
    from: string;
    to: string;
    condition?: (state: PlayerState) => boolean;
  }[];
}

// 2. 事件链管理器
class EventChainManager {
  private chains = new Map<string, EventStateMachine>();
  
  // 注册事件链
  registerChain(chainId: string, states: string[]) {
    this.chains.set(chainId, {
      id: chainId,
      currentState: 'pending',
      transitions: states.map((state, i) => ({
        from: state,
        to: states[i + 1] || 'completed',
      })),
    });
  }
  
  // 检查事件是否可触发
  canTrigger(chainId: string, eventId: string): boolean {
    const chain = this.chains.get(chainId);
    if (!chain) return true;
    
    return chain.currentState === 'pending' || 
           chain.currentState === eventId;
  }
  
  // 标记事件完成
  completeEvent(chainId: string, eventId: string) {
    const chain = this.chains.get(chainId);
    if (!chain) return;
    
    const transition = chain.transitions.find(t => t.from === eventId);
    if (transition) {
      chain.currentState = transition.to;
    }
  }
}

// 3. 使用示例
const loveStoryChain = new EventChainManager();
loveStoryChain.registerChain('loveStory', [
  'metLove',
  'loveDevelop',
  'proposed',
  'married',
]);

// 事件条件自动检查链状态
const loveDevelop: StoryNode = {
  id: 'love_develop',
  condition: (state) => 
    loveStoryChain.canTrigger('loveStory', 'loveDevelop'),
  effects: [...],
  onComplete: {
    setEvent: 'loveDevelop',
    callback: () => loveStoryChain.completeEvent('loveStory', 'loveDevelop'),
  },
};
```

**优势**：
- ✅ 强制的事件顺序
- ✅ 自动的状态流转
- ✅ 防止跳跃和重复
- ✅ 易于调试

---

## 🎯 推荐实施方案

### 阶段 1：引入效果系统（1-2 周）

1. **定义效果类型**
   ```typescript
   // src/types/effects.ts
   export type EffectDefinition = 
     | { type: 'TIME_ADVANCE'; unit: string; value: number }
     | { type: 'STAT_MODIFY'; stat: string; value: number }
     | { type: 'FLAG_SET'; flag: string }
     | { type: 'EVENT_RECORD'; event: string };
   ```

2. **实现效果执行器**
   ```typescript
   // src/core/EffectExecutor.ts
   export class EffectExecutor {
     execute(effects: EffectDefinition[], state: PlayerState): PlayerStateUpdates {
       // 统一执行逻辑
     }
   }
   ```

3. **重构现有事件**
   - 将 `autoEffect` 函数改为 `effects` 数组
   - 添加 `onComplete` 自动设置完成标志

### 阶段 2：引入模板系统（1 周）

1. **创建模板工厂**
   ```typescript
   // src/factories/EventTemplateFactory.ts
   export class EventTemplateFactory {
     static createNormalGrowth(params): StoryNode { ... }
     static createPlotResult(params): StoryNode { ... }
   }
   ```

2. **重构常见事件模式**
   - 普通成长事件
   - 剧情结果事件
   - 选择事件

### 阶段 3：引入状态机（可选，2 周）

1. **实现事件链管理器**
2. **为长线剧情添加状态机**
3. **添加调试工具**

---

## 📊 对比分析

| 方案 | 复杂度 | 收益 | 实施难度 | 推荐度 |
|------|--------|------|----------|--------|
| 效果系统 | 中 | 高 | 中 | ⭐⭐⭐⭐⭐ |
| 模板系统 | 低 | 中 | 低 | ⭐⭐⭐⭐ |
| 状态机 | 高 | 高 | 高 | ⭐⭐⭐ |

---

## 🛠️ 实施建议

### 立即实施（本周）

1. **修复死循环问题**
   - 为所有 `autoNext` 事件添加完成标志
   - 添加条件检查完成标志

2. **统一状态更新逻辑**
   - 在 `gameStore.updatePlayer` 中添加日志
   - 记录所有状态变更

3. **创建检测工具**
   - 死循环检测
   - 事件重复触发检测

### 短期实施（1-2 周）

1. **引入效果系统**
2. **重构 30% 的事件配置**
3. **建立代码审查清单**

### 中期实施（1 个月）

1. **完成所有事件重构**
2. **引入模板系统**
3. **添加自动化测试**

---

## 📝 最佳实践清单

### ✅ 事件配置规范

1. **必须设置完成标志**
   ```typescript
   // ✅ 正确
   onComplete: { setEvent: 'eventId' }
   
   // ❌ 错误
   // 无 onComplete
   ```

2. **使用声明式效果**
   ```typescript
   // ✅ 正确
   effects: [
     { type: 'TIME_ADVANCE', unit: 'year', value: 1 }
   ]
   
   // ❌ 错误
   autoEffect: (state) => ({ age: state.age + 1 })
   ```

3. **明确前置条件**
   ```typescript
   // ✅ 正确
   condition: (state) => 
     state.flags.has('triggerFlag') && 
     !state.events.has('eventId')
   
   // ❌ 错误
   condition: (state) => state.flags.has('triggerFlag')
   ```

### ✅ 代码审查清单

- [ ] 是否设置了完成标志？
- [ ] 是否使用声明式效果？
- [ ] 条件是否检查了完成标志？
- [ ] 是否有潜在的无限循环？
- [ ] 状态更新是否可预测？

---

**文档版本**: 1.0  
**创建日期**: 2026-03-12  
**作者**: Trae AI Assistant
