# 剧情流程测试脚本使用说明

## 概述

已创建自动化测试脚本来验证剧情流程的正确性，可以：
- ✅ 模拟玩家选择
- ✅ 验证剧情节点是否正确衔接
- ✅ 检查 flags 和 events 是否正确设置
- ✅ 发现剧情逻辑问题

## 测试文件

### 1. `/scripts/runStoryTests.ts`
Node.js 环境运行的测试脚本，包含简化的 mock 数据。

**运行方法**：
```bash
cd /Users/zhouyun/code/wuxia-life
npx tsx scripts/runStoryTests.ts
```

### 2. `/src/utils/storyTest.ts`
TypeScript 版本的测试工具，可以直接导入游戏引擎使用。

## 当前测试结果

```
总测试：4
通过：1
失败：3
通过率：25.00%
```

### ✅ 通过的测试
- **爱情线 - 提供线索（修复测试）**：验证了"提供线索"选项现在可以正确进入后续剧情

### ❌ 失败的测试
1. **少林派入门**：步骤 3 找不到"answer_virtue"选择
2. **武当派入门**：步骤 2 找不到"taichi_perfect"选择
3. **爱情线 - 主动搭话**：步骤 2 找不到"help_investigate"选择

## 发现的问题

### 问题 1：节点匹配逻辑过于严格
测试脚本的 `getAvailableNodes` 函数在有 flag 时只匹配特定 ID 模式的节点，导致某些节点被错误过滤。

**修复方向**：
- 改进节点匹配逻辑
- 确保所有符合条件的节点都能被正确匹配

### 问题 2：Mock 数据不完整
测试脚本中的 mock 数据只包含部分节点，缺少完整的剧情链。

**修复方向**：
- 从实际游戏数据中导入完整的剧情节点
- 或者使用实际的 `storyData.ts` 文件

## 下一步改进

### 方案 A：使用实际游戏数据（推荐）

修改测试脚本，直接导入游戏的实际数据：

```typescript
import { storyNodes } from '../src/data/storyData';
import { evaluateCondition } from '../src/utils/storyInterpreter';

// 使用实际的 storyNodes 进行测试
```

**优点**：
- 测试的是真实数据
- 不需要维护 mock 数据
- 测试更准确

**缺点**：
- 需要处理浏览器 API 和 Node.js 的兼容性

### 方案 B：完善 mock 数据

在测试脚本中添加完整的剧情节点数据，包括：
- 所有门派的物理测试
- 心性测试
- 录取结果
- 完整的爱情线
- 完整的武林大会线

**优点**：
- 不依赖游戏代码
- 可以独立运行

**缺点**：
- 需要维护两份数据
- 可能与实际数据不同步

### 方案 C：创建 Jest/Vitest 测试框架

使用专业的测试框架，为每个长事件创建单元测试：

```typescript
import { describe, it, expect } from 'vitest';
import { getAvailableNodes } from '../src/data/storyData';

describe('门派入门事件', () => {
  it('应该正确触发少林派物理测试', () => {
    const state = createTestPlayer('male', 12);
    state.flags.add('appliedShaolin');
    
    const nodes = getAvailableNodes(state);
    expect(nodes.some(n => n.id === 'shaolin_physical_test')).toBe(true);
  });
});
```

**优点**：
- 专业的测试框架
- 更好的错误报告
- 易于扩展和维护

**缺点**：
- 需要配置测试环境
- 学习曲线

## 推荐的测试流程

### 1. 开发阶段
每次修改剧情数据后，运行测试脚本：
```bash
npx tsx scripts/runStoryTests.ts
```

### 2. CI/CD 阶段
在 GitHub Actions 或其他 CI 工具中集成测试：
```yaml
- name: Run story tests
  run: npx tsx scripts/runStoryTests.ts
```

### 3. 手动测试
对于复杂的剧情线，使用测试脚本生成测试报告，然后手动在游戏中验证。

## 扩展示例

### 添加新的测试用例

在 `scripts/runStoryTests.ts` 的 `main()` 函数中添加：

```typescript
const tests: TestCase[] = [
  // ... 现有测试 ...
  {
    name: '武林大会 - 冠军路线',
    description: '测试武林大会获得冠军的完整流程',
    initialAge: 18,
    initialGender: 'male',
    initialSect: null,
    choices: ['join_tournament', 'fight_careful', 'use_qinggong', 'final_all_out'],
    expectedEvents: ['tournament2024'],
    expectedFlags: ['tournamentChampion'],
  },
  // ... 更多测试 ...
];
```

### 验证特定剧情

创建一个专门的测试文件来验证特定剧情线：

```typescript
// scripts/testSectJoin.ts
import { runTestCase } from './runStoryTests';

const sectTest = {
  name: '峨眉派入门完整流程',
  description: '女性角色加入峨眉派的完整流程（验证修复）',
  initialAge: 12,
  initialGender: 'female',
  initialSect: null,
  choices: ['apply_emei', 'sword_perfect', 'answer_diligence'],
  expectedEvents: ['sectRecruitment', 'physicalTest', 'mentalTest', 'joinedEmei'],
  expectedFlags: [],
};

runTestCase(sectTest);
```

## 总结

测试脚本已经创建并可以运行，目前的价值在于：
1. ✅ **发现问题**：成功发现了节点匹配逻辑的问题
2. ✅ **验证修复**：验证了"提供线索"选项的修复
3. ✅ **自动化**：可以自动运行，不需要手动玩游戏

下一步建议：
- **优先实施方案 A**：使用实际游戏数据进行测试
- **完善测试覆盖**：为所有长事件添加测试用例
- **集成到开发流程**：每次修改剧情后自动运行测试
