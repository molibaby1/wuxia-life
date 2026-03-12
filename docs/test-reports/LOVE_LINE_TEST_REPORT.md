# 感情线测试报告

## 测试目标

验证游戏感情线系统的行为，特别是：
1. 感情事件是否正常触发
2. 标志设置是否持久化
3. 是否存在"循环模式"（反复触发新的感情事件）
4. 测试环境与实际游戏是否使用相同逻辑

## 测试方法

使用 [`testFullLoveLine.ts`](file:///Users/zhouyun/code/wuxia-life/tests/testFullLoveLine.ts) 脚本：
- 从 0 岁模拟到 30 岁
- 自动检测并执行所有感情事件
- 记录所有 flags 和 events 的变化
- 验证标志的持久化

## 测试结果

### ✅ 青年感情事件系统（meet_love_interest）

**17 岁**：
- ✅ 触发感情事件（40% 概率）
- ✅ 选择"默默观察"选项
- ✅ 设置标志：`hasLoveInterest: true`、`romanticObserver: true`

**18-30 岁**：
- ✅ **没有再次触发**感情事件
- ✅ `hasLoveInterest` 标志**持续存在**
- ✅ 条件检查正常工作（`!flags.has("hasLoveInterest")` 返回 false）

**结论**：青年感情事件系统工作正常，**没有循环模式**。

### 📊 完整状态变化

```
17 岁前：flags = {}
17 岁：flags = { hasLoveInterest: true, romanticObserver: true }
18-25 岁：flags 保持不变 ✅
26-30 岁：flags 保持不变 ✅
最终：flags = { hasLoveInterest: true, romanticObserver: true, ... }
```

### 🎯 测试环境 vs 实际游戏

**测试环境**：
- ✅ 直接使用游戏引擎 API（`gameEngine`）
- ✅ 真实的事件选择逻辑（`selectEvent`）
- ✅ 真实的效果执行（`executeChoiceEffects`）
- ✅ 真实的条件评估（`conditionEvaluator`）

**结论**：测试环境与实际游戏使用**完全相同的核心逻辑**。

## 问题分析

### 您提到的"循环模式"可能的原因

1. **存档/读档问题**
   - 标志可能没有在存档中保存
   - 读档时标志可能没有正确恢复

2. **长线感情事件系统冲突**
   - `loveStoryEvents` 使用不同的标志系统（`events.metLove`）
   - 可能与青年事件系统产生冲突

3. **游戏版本差异**
   - 实际游戏可能使用了不同的事件版本
   - 标志名称或条件可能不同

## 建议改进

### 1. 统一标志系统

修改长线感情事件，使用统一的标志：

```typescript
// loveStoryEvents.ts
condition: (state) => !state.flags.hasLoveInterest  // 统一使用 hasLoveInterest
```

### 2. 添加全局感情标志

在所有感情事件中添加：

```typescript
effects: [
  {
    type: EffectType.FLAG_SET,
    target: 'inLoveStory',  // 全局标志
  },
  // ... 其他效果
]
```

### 3. 增强测试覆盖

运行感情线测试：

```bash
npx tsx tests/testFullLoveLine.ts
```

### 4. 存档/读档测试

创建专门的测试验证存档后标志是否保留：

```bash
npx tsx tests/testSaveLoadLoveFlags.ts
```

## 测试脚本

- [`testFullLoveLine.ts`](file:///Users/zhouyun/code/wuxia-life/tests/testFullLoveLine.ts) - 完整感情线测试
- [`testLoveLine.ts`](file:///Users/zhouyun/code/wuxia-life/tests/testLoveLine.ts) - 单点感情事件测试

## 运行测试

```bash
# 完整感情线测试
npx tsx tests/testFullLoveLine.ts

# 单点测试
npx tsx tests/testLoveLine.ts
```

## 结论

✅ **测试环境中感情线系统工作正常**
- 标志设置正确
- 标志持久化正常
- 没有循环模式

⚠️ **实际游戏中的问题可能需要检查**：
- 存档/读档逻辑
- 长线事件系统与青年事件系统的协调
- 游戏版本一致性

---

**最后更新**: 2026-03-12  
**测试者**: Trae AI Assistant
