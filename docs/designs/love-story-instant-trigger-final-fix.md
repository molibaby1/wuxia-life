# 爱情线即时触发最终修复

## 问题根源

爱情线即时触发不生效的根本原因有**三个**：

### 1. `executeEffects` 浅拷贝问题 ⭐⭐⭐

**问题**：
```typescript
// 原代码
let newState = { ...state };  // 浅拷贝，flags 对象引用相同
```

**结果**：`flag_set` 效果修改了 `newState.player.flags`，但因为浅拷贝，修改被后续的效果处理器覆盖了。

**修复**：
```typescript
// 深拷贝 state，确保 flags 等嵌套对象被正确复制
let newState = {
  ...state,
  player: state.player ? {
    ...state.player,
    flags: { ...(state.player.flags || {}) },
    events: [...(state.player.events || [])],
    items: [...(state.player.items || [])],
    relationships: [...(state.player.relationships || [])],
  } : undefined,
};
```

---

### 2. `applyGameState` 破坏响应式 ⭐⭐⭐

**问题**：
```typescript
// 原代码
this.gameState.player.flags = { ...(nextState.player.flags || {}) };
```

**结果**：创建了新对象，破坏了 Vue 的响应式系统。

**修复**：
```typescript
// 保持响应式，使用 Object.assign 而不是创建新对象
if (this.gameState.player.flags) {
  Object.assign(this.gameState.player.flags, nextState.player.flags || {});
} else {
  this.gameState.player.flags = { ...(nextState.player.flags || {}) };
}
```

---

### 3. `ConditionEvaluator` 不支持 `state.player.flags` ⭐⭐⭐

**问题**：
```typescript
// 原代码
const hasFlag = !!state.flags[flagName];  // 只检查 state.flags
```

**结果**：爱情线事件的条件 `flags.has("love_started")` 检查失败，因为 flag 在 `state.player.flags` 中，不在 `state.flags` 中。

**修复**：
```typescript
// 支持 state.flags 和 state.player.flags 两种方式
const hasFlag = !!state.flags?.[flagName] || !!state.player?.flags?.[flagName];
```

---

## 验证结果

### 测试日志

```
事件：初遇
选择：上前搭话
[FlagSetHandler] 设置 flag: love_started
[ImmediateEvent] 发现 1 个即时反馈事件，立即触发
事件：心动  ← 成功触发！
```

### 完整流程

```
15 岁：
  事件：初遇
  选择：上前搭话
    → [FlagSetHandler] 设置 flag: love_started
    → [ImmediateEvent] 发现 1 个即时反馈事件，立即触发
    → 事件：心动 ✓
      文本："自从那日相遇，你时常想起那个特别的身影..."
    → 事件：并肩同行 ✓
      文本："你与明月一同执行一件江湖委托..."
  
  → 爱情线完整连贯 ✓
```

---

## 修改的文件

### 1. `src/core/EventExecutor.ts`

**修改**：`executeEffects` 方法深拷贝 player 对象

```typescript
// 深拷贝 state，确保 flags 等嵌套对象被正确复制
let newState = {
  ...state,
  player: state.player ? {
    ...state.player,
    flags: { ...(state.player.flags || {}) },
    events: [...(state.player.events || [])],
    items: [...(state.player.items || [])],
    relationships: [...(state.player.relationships || [])],
  } : undefined,
};
```

---

### 2. `src/core/GameEngineIntegration.ts`

**修改**：`applyGameState` 方法保持响应式

```typescript
// 修复：保持响应式，使用 Object.assign 而不是创建新对象
if (this.gameState.player.flags) {
  Object.assign(this.gameState.player.flags, nextState.player.flags || {});
} else {
  this.gameState.player.flags = { ...(nextState.player.flags || {}) };
}
```

---

### 3. `src/core/ConditionEvaluator.ts`

**修改**：`replaceFunctionCalls` 方法支持两种 flags

```typescript
// 支持 state.flags 和 state.player.flags 两种方式
const hasFlag = !!state.flags?.[flagName] || !!state.player?.flags?.[flagName];
```

---

## 总结

### 问题链条

1. `executeEffects` 浅拷贝 → `flag_set` 设置的 flag 被覆盖
2. `applyGameState` 破坏响应式 → flag 设置后丢失
3. `ConditionEvaluator` 不支持 `player.flags` → 条件检查失败

### 修复效果

✅ **深拷贝 state** - 确保 flags 在效果链中正确传递
✅ **保持响应式** - 确保 flag 设置后不丢失
✅ **支持两种 flags** - 确保条件检查正确

### 最终结果

- ✅ 选择"上前搭话"后，立即触发"心动"
- ✅ "心动"后，立即触发"并肩同行"
- ✅ 爱情线完整连贯，不再断裂
- ✅ 模拟测试验证通过

**爱情线即时触发问题已完全修复！** 🎉
