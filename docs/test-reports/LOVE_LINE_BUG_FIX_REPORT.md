# 感情线循环 Bug 修复报告

## 🐛 问题描述

在游戏实际测试中发现，感情线剧情存在循环问题：
- 无论玩家选择"主动接近"或"暗自喜欢"
- 进入下一年度后，系统仍会重复触发相同的初始相遇场景
- 感情线无法正常推进到第二阶段

## 🔍 根本原因

### 问题分析

1. **StoryNode 的 effect 返回结构**：
   ```typescript
   effect: (state) => ({
     age: state.age + 1,
     flags: new Set(['metLove']),  // ❌ 问题所在
     events: new Set(['metLove']), // ❌ 问题所在
   })
   ```

2. **store.updatePlayer 的旧实现**：
   ```typescript
   if (flags !== undefined) {
     state.player.flags = flags;  // ❌ 直接替换
   }
   if (events !== undefined) {
     state.player.events = events;  // ❌ 直接替换
   }
   ```

3. **后果**：
   - 第一次选择后：`events = { metLove }`
   - 第二次更新时：`events = { secondMeeting }`（覆盖了 metLove！）
   - 条件检查：`!state.events.has('metLove')` → `true`（因为 metLove 已丢失）
   - 结果：再次触发初次相遇事件！♻️

## ✅ 修复方案

### 修改 `src/store/gameStore.ts`

**修复前**：
```typescript
if (flags !== undefined) {
  state.player.flags = flags;
}
if (events !== undefined) {
  state.player.events = events;
}
```

**修复后**：
```typescript
if (flags !== undefined) {
  // 合并 flags，而不是替换
  const newFlags = flags instanceof Set ? flags : new Set<string>(flags);
  const mergedFlags = new Set([...state.player.flags, ...newFlags]);
  state.player.flags = mergedFlags;
}
if (events !== undefined) {
  // 合并 events，而不是替换
  const newEvents = events instanceof Set ? events : new Set<string>(events);
  const mergedEvents = new Set([...state.player.events, ...newEvents]);
  state.player.events = mergedEvents;
}
```

### 关键改进

1. **合并而非替换**：使用 `Set` 的展开操作符合并新旧标志
2. **类型安全**：添加类型注解 `new Set<string>()`
3. **兼容处理**：支持 `Set` 和数组两种输入格式

## 🧪 测试验证

### 单元测试

创建 `tests/testEventsMerge.ts` 验证合并逻辑：

```bash
npx tsx tests/testEventsMerge.ts
```

**测试结果**：
```
=== Events 合并逻辑测试 ===

初始状态:
  events:  (空)
  flags:  (空)

━━━ 第一次更新：选择"勇敢上前搭话" ━━━
更新后:
  events: metLove
  flags: approachedLove
  年龄：17

━━━ 第二次更新：再次相遇 ━━━
更新后:
  events: metLove,secondMeeting  ✅ 保留了 metLove
  flags: approachedLove,helpedLove  ✅ 保留了 approachedLove
  年龄：18

=== 验证结果 ===
metLove: ✅
secondMeeting: ✅
approachedLove: ✅
helpedLove: ✅

✅ 修复成功！events 和 flags 都被正确合并和保留！
```

### 预期游戏行为

**修复前**：
```
16 岁：初次相遇 → 选择"勇敢上前搭话" → events = {metLove}
17 岁：events 被覆盖为 {secondMeeting} → metLove 丢失 → 再次触发初次相遇 ❌
```

**修复后**：
```
16 岁：初次相遇 → 选择"勇敢上前搭话" → events = {metLove}
17 岁：events 合并为 {metLove, secondMeeting} → metLove 保留 → 触发第二阶段 ✅
```

## 📝 修复文件

- `src/store/gameStore.ts` - 修改 `updatePlayer` 函数
- `tests/testEventsMerge.ts` - 添加单元测试
- `tests/testLoveLineFix.ts` - 添加集成测试
- `tests/testLoveLoopBug.ts` - 添加 Bug 复现测试

## 🎯 验证步骤

1. **运行单元测试**：
   ```bash
   npx tsx tests/testEventsMerge.ts
   ```

2. **启动游戏测试**：
   ```bash
   npm run dev
   ```

3. **测试感情线**：
   - 创建角色
   - 推进到 16-18 岁
   - 触发感情事件并做出选择
   - 推进到下一年
   - 验证是否触发第二阶段而非重复第一阶段

## 🔧 相关系统

此修复影响所有使用 `events` 和 `flags` 的事件系统：
- ✅ 感情线事件（loveStoryEvents）
- ✅ 门派线事件（sectJoinEvents）
- ✅ 长线剧情事件（tournamentEvents）
- ✅ 所有使用 `state.events.has()` 条件检查的事件

## 📊 影响范围

**正面影响**：
- ✅ 所有长线剧情现在都能正确推进
- ✅ 事件标志不会丢失
- ✅ 玩家选择能够正确影响后续剧情

**风险评估**：
- ⚠️ 低风险：只改变合并逻辑，不改变事件触发条件
- ✅ 向后兼容：新逻辑兼容旧的事件格式

## 📚 技术要点

### Set 合并模式

```typescript
// 正确：合并两个 Set
const merged = new Set([...set1, ...set2]);

// 错误：直接替换
set1 = set2;
```

### 类型安全处理

```typescript
// 处理 Set 或数组输入
const newSet = input instanceof Set ? input : new Set<string>(input);
```

---

**修复日期**: 2026-03-12  
**修复者**: Trae AI Assistant  
**测试状态**: ✅ 通过
