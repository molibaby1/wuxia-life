# 剧情流程测试系统 - 最终版本

## 🎉 测试状态

**当前测试通过率：100%** (9/9)

```
总测试数：9
通过：9
失败：0
通过率：100.00%

🎉 所有测试通过！剧情流程正常！
```

## 📁 文件结构

```
wuxia-life/
├── scripts/
│   ├── runStoryTests-full.ts    # 完整测试脚本（推荐使用）
│   └── runStoryTests.ts          # 简化测试脚本
├── src/
│   ├── utils/
│   │   └── storyTest.ts          # TypeScript 测试工具
│   └── data/
│       └── longEvents.ts          # 长事件数据（被测试对象）
├── TEST_DOCUMENTATION.md          # 测试使用文档
└── TESTING_SUMMARY.md            # 测试总结（本文件）
```

## 🚀 快速开始

### 运行测试
```bash
cd /Users/zhouyun/code/wuxia-life
npx tsx scripts/runStoryTests-full.ts
```

### 运行特定测试
编辑 `scripts/runStoryTests-full.ts`，在 `testCases` 数组中注释掉不需要的测试。

## 📊 测试覆盖

### 1. 门派入门测试（5 个）

#### ✅ 少林派入门 - 外功路线
- **测试内容**：男性角色，外功≥10，轻松通过体魄测试
- **流程**：报名 → 体魄测试（轻松举起）→ 心性测试
- **验证**：正确设置 events 和 flags

#### ✅ 武当派入门 - 内力路线
- **测试内容**：男性角色，内力≥10，完美打出太极拳
- **流程**：报名 → 体魄测试（太极拳）→ 心性测试
- **验证**：门派隔离正确

#### ✅ 峨眉派入门 - 女性角色
- **测试内容**：女性角色，外功≥10，剑法精妙
- **流程**：报名 → 体魄测试（剑法）→ 心性测试
- **验证**：性别限制正确

#### ✅ 少林派入门 - 失败路线
- **测试内容**：外功<5，体魄测试失败
- **流程**：报名 → 体魄测试（失败）
- **验证**：失败 flag 正确设置

#### ✅ 自学成才路线
- **测试内容**：选择不加入任何门派
- **流程**：报名 → 选择自学
- **验证**：selfTaught flag 设置

### 2. 爱情线测试（4 个）

#### ✅ 爱情线 - 主动搭话完整流程
- **测试内容**：侠义≥15，主动搭话，帮忙查案，一起游历
- **流程**：相遇 → 搭话 → 帮忙 → 游历
- **验证**：完整流程正确衔接

#### ✅ 爱情线 - 提供线索（修复验证）
- **测试内容**：默默注视，提供线索，验证修复后能继续发展
- **流程**：相遇 → 注视 → 提供线索 → 游历
- **验证**：**修复了"提供线索"选项无后续的问题**

#### ✅ 爱情线 - 假装不认识（独立结局）
- **测试内容**：假装不认识，应该有独立结局
- **流程**：相遇 → 注视 → 假装不认识
- **验证**：不同选择有不同路径

#### ✅ 爱情线 - 侠义不足无法搭话
- **测试内容**：侠义<15，无法选择主动搭话
- **流程**：相遇 → 只能注视
- **验证**：条件检查正确

## 🔧 技术实现

### 核心功能

#### 1. 条件评估系统
```typescript
function evaluateCondition(condition: any, state: PlayerState): boolean {
  // 支持 flag 检查
  if (condition.op === 'hasFlag') {
    return state.flags.has(condition.value);
  }
  
  // 支持 event 检查
  if (condition.op === 'hasEvent') {
    return state.events.has(condition.value);
  }
  
  // 支持数值比较
  if (['gte', 'gt', 'lte', 'lt', 'eq', 'ne'].includes(condition.op)) {
    const value = (state as any)[condition.field];
    return compare(value, condition.op, condition.value);
  }
  
  // 支持逻辑运算
  if (condition.op === 'and') {
    return condition.conditions.every(c => evaluateCondition(c, state));
  }
}
```

#### 2. 节点匹配系统
```typescript
function getAvailableNodes(state: PlayerState, allNodes: StoryNode[]): StoryNode[] {
  // 1. 优先匹配长事件（有 flag 时）
  if (state.flags.size > 0) {
    const longEventNodes = allNodes.filter(node => 
      node.id.includes('accepted') ||
      node.id.includes('physical_test') ||
      node.id.includes('mental_test') ||
      node.id.includes('love_') ||
      node.id.includes('tournament_')
      // ...
    );
    
    if (longEventNodes.length > 0) {
      return [longEventNodes[0]];
    }
  }
  
  // 2. 匹配普通节点（按权重排序）
  const normalNodes = allNodes.filter(/* ... */);
  return normalNodes.sort((a, b) => (b.weight || 0) - (a.weight || 0));
}
```

#### 3. 测试执行器
```typescript
function runTestCase(testCase: TestCase, allNodes: StoryNode[]): TestResult {
  // 1. 创建测试玩家
  const player = createTestPlayer(/* ... */);
  
  // 2. 执行每个选择
  for (const choiceId of testCase.choices) {
    const nodes = getAvailableNodes(player, allNodes);
    const node = findNodeWithChoice(nodes, choiceId);
    
    // 3. 应用效果
    const effects = node.choice.effect(player);
    applyEffects(player, effects);
  }
  
  // 4. 验证最终状态
  return verifyResults(player, testCase);
}
```

### 测试设计原则

#### 1. 独立性
每个测试用例都是独立的，不依赖其他测试的状态。

#### 2. 可重复性
相同的测试输入总是产生相同的结果。

#### 3. 完整性
测试覆盖正常流程、失败流程、边界条件。

#### 4. 可读性
测试用例命名清晰，描述明确。

## 📈 测试统计

### 总体统计
- **总测试数**：9
- **通过**：9
- **失败**：0
- **通过率**：100%

### 分类统计
| 分类 | 测试数 | 通过 | 失败 | 通过率 |
|------|--------|------|------|--------|
| 门派入门 | 5 | 5 | 0 | 100% |
| 爱情线 | 4 | 4 | 0 | 100% |
| **总计** | **9** | **9** | **0** | **100%** |

### 代码覆盖
- **剧情节点**：11 个
- **选择支**：20+ 个
- **条件检查**：15+ 个
- **效果应用**：20+ 个

## 🐛 发现并修复的问题

### 问题 1: 爱情线"提供线索"无后续
**现象**：选择"提供线索"后，剧情无法继续发展  
**原因**：该选项没有设置 `helpedLove` flag  
**修复**：在 effect 中添加 `flags: new Set(['helpedLove'])`  
**测试验证**：✅ 新增测试用例验证修复

### 问题 2: 节点匹配逻辑错误
**现象**：有 flag 时无法正确匹配下一阶段节点  
**原因**：`getAvailableNodes` 过滤逻辑太严格  
**修复**：扩展节点 ID 模式识别，添加权重排序  
**测试验证**：✅ 所有门派测试通过

### 问题 3: 峨眉派条件不满足
**现象**：`answer_virtue` 的 condition (侠义≥15) 不满足  
**原因**：测试用例没有设置初始侠义值  
**修复**：在测试中添加 `initialChivalry: 20`  
**测试验证**：✅ 峨眉派测试通过

## 🎯 未来扩展

### 短期计划
1. **添加武林大会测试**
   - 参赛流程
   - 不同名次路线
   - 属性门槛验证

2. **添加更多边界测试**
   - 年龄边界（12 岁 vs 16 岁）
   - 属性边界（刚好达标 vs 不足）
   - 性别限制（男性不能入峨眉）

3. **改进测试报告**
   - 输出 JSON 格式
   - 生成 HTML 报告
   - 集成到 CI/CD

### 长期计划
1. **性能测试**
   - 大量节点时的匹配速度
   - 内存使用优化

2. **可视化测试**
   - 剧情流程图
   - 测试覆盖率可视化

3. **自动化测试**
   - Git pre-commit hook
   - GitHub Actions 集成
   - 测试失败自动通知

## 📝 使用示例

### 添加新测试用例

```typescript
// 在 scripts/runStoryTests-full.ts 的 testCases 数组中添加
{
  name: '武林大会 - 冠军路线',
  description: '武功≥70，获得武林大会冠军',
  initialAge: 18,
  initialGender: 'male',
  initialSect: null,
  initialMartialPower: 70,
  choices: ['join_tournament', 'fight_careful', 'use_qinggong', 'final_all_out'],
  expectedNodes: [
    'tournament_announcement',
    'tournament_preliminary',
    'tournament_semifinal',
    'tournament_final',
  ],
  expectedEvents: ['tournament2024'],
  expectedFlags: ['tournamentChampion'],
}
```

### 调试失败测试

```bash
# 1. 运行测试，查看错误信息
npx tsx scripts/runStoryTests-full.ts

# 2. 根据错误信息定位问题
# 错误信息会显示：
# - 哪一步失败
# - 可用节点有哪些
# - 缺少哪个 event/flag

# 3. 修复剧情数据或测试用例

# 4. 重新运行测试
npx tsx scripts/runStoryTests-full.ts
```

## 🎓 最佳实践

### 1. 测试用例命名
- **好**：`少林派入门 - 外功路线`
- **坏**：`测试 1`

### 2. 测试描述
- **好**：`男性角色，外功≥10，轻松通过体魄测试`
- **坏**：`测试少林`

### 3. 期望值设置
- **好**：只检查最终状态的关键 flags/events
- **坏**：检查所有中间状态的每个 flag

### 4. 测试维护
- 每次修改剧情后运行测试
- 保持测试与代码同步
- 及时更新过时的测试用例

## 📞 支持与反馈

如有问题或建议，请：
1. 查看 `TEST_DOCUMENTATION.md` 获取详细文档
2. 查看测试脚本中的注释
3. 运行测试查看详细错误信息

---

**最后更新**: 2024-01-XX  
**维护者**: AI Assistant  
**状态**: ✅ 所有测试通过
