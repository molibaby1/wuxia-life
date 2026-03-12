# 年龄记录跳跃问题 - 修复报告

**问题发现时间**: 2026-03-12  
**问题描述**: 测试报告中年龄记录都是 2 岁一跳（0, 2, 4, 6, 8...），而不是连续的每年记录

---

## 一、问题定位

### 1.1 问题现象

查看测试报告的 `gameYear` 字段：
```json
"gameYear": 0
"gameYear": 2  // ❌ 应该是 1
"gameYear": 4  // ❌ 应该是 3
"gameYear": 6  // ❌ 应该是 5
```

### 1.2 根本原因

**年龄被重复计算了两次**：

1. **第一次**：事件的 `effect` 或 `autoEffect` 中已经包含 `age: state.age + 1`
2. **第二次**：测试系统在事件处理后，又调用了 `advanceTime(this.currentState, 1, 'year')`

**代码对比**：

```typescript
// 游戏本体（正确）
const effect = node.autoEffect(state);  // 返回 { age: state.age + 1 }
store.updatePlayer(effect);  // 直接应用，年龄 +1
// ✅ 没有额外的时间推进

// 测试环境（错误 - 修复前）
const effects = node.autoEffect(state);  // 返回 { age: state.age + 1 }
applyChoiceEffect(effects, state);  // 年龄变成 state.age + 1
const timeUpdates = advanceTime(state, 1, 'year');  // ❌ 又加了 1 岁！
Object.assign(state, timeUpdates);  // 年龄变成 state.age + 2
```

### 1.3 影响范围

- **自动节点**：`autoEffect` 包含 `age+1`，后又调用 `advanceTime` → 年龄 +2
- **选择节点**：`effect` 包含 `age+1`，后又调用 `advanceTime` → 年龄 +2
- **年度总结**：手动 `age++`，没有额外调用 → 年龄 +1（正常）

**结果**：大部分事件导致年龄 +2，看起来像"跳着记录"

---

## 二、修复方案

### 2.1 修复原则

**游戏本体的设计**：
- 事件的 `effect` / `autoEffect` 负责所有状态更新，包括年龄增长
- 不需要额外的时间推进函数

**修复方法**：
- 移除测试系统中的 `advanceTime` 调用
- 完全信任事件的 `effect` / `autoEffect` 返回值

### 2.2 修复内容

#### 修复 1: 自动节点

**文件**: `simulator.ts` - `simulateYear()` 方法

**修复前**：
```typescript
// 记录自动节点
this.recordAutoNode(..., eventAge);

// ❌ 错误：又调用了一次 advanceTime
const timeUpdates = advanceTime(this.currentState, 1, 'year');
Object.assign(this.currentState, timeUpdates);
this.recordStateSnapshot();
```

**修复后**：
```typescript
// 记录自动节点
this.recordAutoNode(..., eventAge);

// ✅ 正确：autoEffect 中已经包含 age+1，不需要再调用 advanceTime
this.recordStateSnapshot();
```

#### 修复 2: 选择节点

**文件**: `simulator.ts` - `simulateYear()` 方法

**修复前**：
```typescript
// 记录选择
this.recordChoice(..., eventAge);

// ❌ 错误：effect 中已经包含 age+1，又调用了 advanceTime
const timeUpdates = advanceTime(this.currentState, 1, 'year');
Object.assign(this.currentState, timeUpdates);
this.recordStateSnapshot();
```

**修复后**：
```typescript
// 记录选择
this.recordChoice(..., eventAge);

// ✅ 正确：effect 中已经包含 age+1，不需要再调用 advanceTime
this.recordStateSnapshot();
```

---

## 三、验证结果

### 3.1 修复前

```
"gameYear": 0
"gameYear": 2
"gameYear": 4
"gameYear": 6
"gameYear": 8
"gameYear": 10
...
```

**问题**：每岁都跳着记录，实际是每年都有事件，但年龄显示错误

### 3.2 修复后

```
"gameYear": 0
"gameYear": 1
"gameYear": 2
"gameYear": 3
"gameYear": 4
"gameYear": 5
"gameYear": 6
"gameYear": 7
"gameYear": 8
"gameYear": 9
"gameYear": 10
"gameYear": 11
"gameYear": 12
"gameYear": 13
"gameYear": 14
"gameYear": 15
"gameYear": 16
"gameYear": 17
"gameYear": 18
"gameYear": 19
"gameYear": 20
"gameYear": 25  // ✅ 这是事件效果（一次性 +5 岁），不是 bug
"gameYear": 30  // ✅ 这是事件效果（一次性 +5 岁）
```

**效果**：
- ✅ 年龄记录连续（0-20 岁每年都有记录）
- ✅ 与游戏本体一致
- ✅ 特殊事件的年龄跳跃是游戏设计（如"江湖岁月，匆匆而过"一次 +5 岁）

### 3.3 控制台输出验证

```bash
[0 岁] 新的一年开始了...
  [0 岁] 你降生在一个武侠世家，哭声洪亮，远近皆闻。...
[1 岁] 新的一年开始了...
  [1 岁] 你学会了走路，开始在家中四处探索，经常搞些小破坏。...
[2 岁] 新的一年开始了...
  [2 岁] 这一年你长高了不少，也更懂事了。...
[3 岁] 新的一年开始了...
  [3 岁] 你已经能说会道，常常逗得家人开怀大笑。...
[4 岁] 新的一年开始了...
  [4 岁] 你只喜欢玩耍，对读书练功毫无兴趣。...
...
[20 岁] 新的一年开始了...
[25 岁] 新的一年开始了...  // ✅ 事件效果
[30 岁] 新的一年开始了...  // ✅ 事件效果
```

---

## 四、总结

### 4.1 核心教训

**测试系统不能自行"优化"或"改进"游戏逻辑**：
- 之前错误地认为需要统一的 `advanceTime` 来推进时间
- 实际上游戏本体中，每个事件的 `effect` 已经处理了所有状态更新
- 额外的时间推进导致年龄重复计算

### 4.2 修复要点

1. ✅ **信任游戏设计**：事件的 `effect` / `autoEffect` 包含所有必要的状态更新
2. ✅ **不要画蛇添足**：移除多余的 `advanceTime` 调用
3. ✅ **保持一致性**：测试系统与游戏本体完全一致

### 4.3 验证方法

```bash
# 运行测试
cd /Users/zhouyun/code/wuxia-life/scripts/life-simulator
npx tsx simulator.ts --years=20 --log=verbose

# 检查年龄记录
cat reports/*.json | grep -o '"gameYear": [0-9]*' | head -30
# 应该看到连续的年龄：0, 1, 2, 3, 4, 5...
```

---

**修复完成时间**: 2026-03-12  
**修复人员**: AI Assistant  
**验证状态**: ✅ 年龄记录已连续，与游戏本体一致
