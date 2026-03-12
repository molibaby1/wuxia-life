# 测试系统与游戏本体一致性分析报告

## 🔍 核心差异分析

### 差异 1：初始年龄设定

**游戏本体** (`gameStore.ts:5-32`):
```typescript
function createInitialState(name: string, gender: 'male' | 'female'): PlayerState {
  return {
    age: 0,  // ✅ 游戏从 0 岁（出生）开始
    gender,
    name,
    sect: null,
    martialPower: 0,
    externalSkill: 0,
    internalSkill: 0,
    qinggong: 0,
    chivalry: 0,
    money: 0,
    // ...
  };
}
```

**测试系统** (`simulator.ts:68-89`):
```typescript
private createInitialState(): PlayerState {
  return {
    age: this.config.startAge,  // ❌ 默认从 12 岁开始
    gender: Math.random() > 0.5 ? 'male' : 'female',
    name: '模拟玩家',
    sect: null,
    martialPower: 10 + Math.floor(Math.random() * 20),  // ❌ 随机初始属性
    externalSkill: 10 + Math.floor(Math.random() * 20),
    internalSkill: 10 + Math.floor(Math.random() * 20),
    qinggong: 10 + Math.floor(Math.random() * 20),
    chivalry: 20 + Math.floor(Math.random() * 30),
    money: 100 + Math.floor(Math.random() * 100),
    // ...
  };
}
```

**差异**：
- ❌ 年龄：游戏从 0 岁开始，测试从 12 岁开始
- ❌ 属性：游戏从 0 开始，测试随机生成（10-30）
- ❌ 金钱：游戏从 0 开始，测试随机生成（100-200）

**影响**：
1. 缺少 0-11 岁的成长记录
2. 初始属性不一致导致事件触发条件不同
3. 测试结果无法反映真实游戏体验

### 差异 2：时间推进机制

**游戏本体** (`gameStore.ts:60-64`):
```typescript
// 处理时间跨度
if (timeSpan) {
  const timeUpdates = advanceTime(state.player, timeSpan.value, timeSpan.unit);
  Object.assign(state.player, timeUpdates);
}
```

**测试系统** (`simulator.ts:629-631`):
```typescript
// 年龄增长
this.currentState.age++;
```

**差异**：
- ❌ 游戏使用 `advanceTime()` 函数，可能包含月份、日期等精细计算
- ❌ 测试系统简单 `age++`，忽略了详细的时间计算

### 差异 3：状态更新逻辑

**游戏本体** (`gameStore.ts:51-84`):
```typescript
const updatePlayer = (updates: Partial<PlayerState>) => {
  if (!state.player) return;
  
  if (!state.player.alive) {
    return;  // ✅ 死亡后不能更新
  }
  
  const { alive, deathReason, title, flags, events, timeSpan, ...safeUpdates } = updates;
  
  // 特殊字段单独处理
  if (timeSpan) {
    const timeUpdates = advanceTime(state.player, timeSpan.value, timeSpan.unit);
    Object.assign(state.player, timeUpdates);
  }
  
  Object.assign(state.player, safeUpdates);
  
  if (flags !== undefined) {
    state.player.flags = flags;  // ✅ 直接替换
  }
  if (events !== undefined) {
    state.player.events = events;  // ✅ 直接替换
  }
};
```

**测试系统** (`simulator.ts:280-320`):
```typescript
private applyChoiceEffect(choice: StoryChoice, state: PlayerState) {
  // ...
  
  // 累积 flags
  if (effects.flags) {
    const oldFlags = Array.from(state.flags);
    effects.flags.forEach((flag: string) => {
      if (!state.flags.has(flag)) {
        state.flags.add(flag);  // ✅ 累积添加
      }
    });
  }
  
  // 累积 events
  if (effects.events) {
    const oldEvents = Array.from(state.events);
    effects.events.forEach((event: string) => {
      if (!state.events.has(event)) {
        state.events.add(event);  // ✅ 累积添加
      }
    });
  }
}
```

**差异**：
- ⚠️ flags/events处理：游戏本体直接替换，测试系统累积添加
- ⚠️ 这可能导致测试与游戏行为不一致

### 差异 4：事件触发条件

**游戏本体** (实际运行):
```typescript
// 玩家通过 UI 选择，逐步触发事件
// 1. 创建角色（0 岁）
// 2. 每年选择行动
// 3. 达到条件触发事件
```

**测试系统**:
```typescript
// 自动化选择，可能跳过关键步骤
// 1. 创建角色（12 岁，随机属性）
// 2. 自动选择（基于权重）
// 3. 可能错过某些事件触发时机
```

## 🔧 修复方案

### 方案 1：完全对齐游戏本体（推荐）

#### 修改初始状态
```typescript
private createInitialState(): PlayerState {
  return {
    age: 0,  // ✅ 从 0 岁开始
    gender: Math.random() > 0.5 ? 'male' : 'female',
    name: '模拟玩家',
    sect: null,
    martialPower: 0,  // ✅ 从 0 开始
    externalSkill: 0,
    internalSkill: 0,
    qinggong: 0,
    chivalry: 0,
    money: 0,
    flags: new Set(),
    events: new Set(),
    children: 0,
    alive: true,
    deathReason: null,
    title: null,
    timeUnit: 'year',
    monthProgress: 0,
    dayProgress: 1,
  };
}
```

#### 修改配置
```typescript
const DEFAULT_CONFIG: SimulationConfig = {
  simulationYears: 80,
  randomnessWeight: 0.5,
  logLevel: 'normal',
  enableAiEvaluation: true,
  verboseOutput: true,
  startAge: 0,  // ✅ 改为 0
  endAge: 80,
};
```

#### 使用时间系统
```typescript
// 导入游戏的时间系统
import { advanceTime } from '../../src/utils/timeSystem';

// 在 simulateYear() 中
private async simulateYear(): Promise<boolean> {
  // ...
  
  // 使用游戏的时间推进函数
  const timeUpdates = advanceTime(this.currentState, 1, 'year');
  Object.assign(this.currentState, timeUpdates);
  
  // ...
}
```

### 方案 2：保持测试独立性但添加一致性验证

如果测试系统需要独立于游戏本体（例如用于压力测试、边界测试），则需要：

1. **明确标注差异**：在文档中说明与游戏的差异
2. **添加验证模式**：定期与游戏本体对比验证
3. **提供配置选项**：允许切换"游戏一致模式"和"测试模式"

## 📊 一致性对比表

| 特性 | 游戏本体 | 测试系统（当前） | 测试系统（修复后） |
|------|----------|------------------|-------------------|
| **初始年龄** | 0 岁 | 12 岁 ❌ | 0 岁 ✅ |
| **初始属性** | 全 0 | 随机 10-30 ❌ | 全 0 ✅ |
| **初始金钱** | 0 | 随机 100-200 ❌ | 0 ✅ |
| **时间推进** | advanceTime() | age++ ❌ | advanceTime() ✅ |
| **flags 处理** | 直接替换 | 累积添加 ⚠️ | 可配置 ✅ |
| **events 处理** | 直接替换 | 累积添加 ⚠️ | 可配置 ✅ |
| **死亡检查** | 严格 | 有检查 ✅ | 严格 ✅ |
| **事件触发** | 手动选择 | 自动选择 ⚠️ | 可配置 ✅ |

## 🎯 实施建议

### 立即执行（P0）
1. ✅ 修改初始年龄为 0 岁
2. ✅ 修改初始属性为 0
3. ✅ 修改初始金钱为 0
4. ✅ 使用 `advanceTime()` 函数

### 短期改进（P1）
1. ⏳ 添加"游戏一致模式"配置
2. ⏳ 验证 flags/events 处理逻辑
3. ⏳ 添加一致性测试用例

### 中期验证（P2）
1. ⏳ 对比测试结果与游戏实际运行
2. ⏳ 验证事件触发率一致性
3. ⏳ 验证数值计算一致性

## 📝 测试原则

### 核心原则
1. **真实性**：测试必须反映游戏实际行为
2. **可重复性**：相同输入产生相同输出
3. **完整性**：覆盖所有游戏场景
4. **独立性**：测试之间互不影响

### 验证方法
1. **对比测试**：同时运行游戏和测试，对比结果
2. **边界测试**：测试极端条件下的行为
3. **回归测试**：确保修复不引入新问题

---

**分析完成时间**: 2026-03-11  
**核心问题**: 测试系统与游戏本体存在 4 处关键差异  
**建议立即修复**: ✅
