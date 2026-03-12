# 游戏过程模拟测试指南

## 🎯 核心概念

**游戏过程模拟测试**是一种**完全模拟真实用户体验**的测试方法，它会：

1. ✅ **创建角色**：和真实玩家一样开始新游戏
2. ✅ **选择事件选项**：模拟玩家决策过程
3. ✅ **推进时间**：体验完整的人生历程（0 岁 → 死亡）
4. ✅ **使用存档功能**：测试自动保存机制
5. ✅ **查看历史记录**：验证事件追踪功能
6. ✅ **触发所有事件**：体验童年、青年、成年、老年各阶段

**与传统单元测试的区别**：
- ❌ 单元测试：测试独立功能点
- ✅ 过程模拟：测试完整用户体验流程

---

## 🚀 快速开始

### 运行游戏过程模拟测试

```bash
cd /Users/zhouyun/code/wuxia-life
npx tsx tests/runGameProcessTest.ts
```

### 查看测试报告

**方式 1 - 直接打开 HTML 文件**:
```bash
open tests/reports/game-process-*.html
```

**方式 2 - 通过报告中心**:
```
http://localhost:5174/scripts/life-simulator/index-full.html
```

---

## 📊 测试报告示例

### 总结信息

```
📊 游戏过程模拟测试总结
================================================================================
测试时间：2026/3/12 12:01:21
玩家：模拟玩家
总年数：63 年
最终年龄：80 岁
生存状态：✅ 在世
触发事件：63 个
做出选择：42 次
存档次数：38 次
================================================================================
```

### HTML 报告内容

报告包含以下部分：

1. **概览卡片**
   - 总经历年数
   - 最终年龄
   - 生存状态
   - 触发事件数
   - 做出选择数
   - 存档次数

2. **统计信息**
   - 童年事件 (0-12 岁)
   - 青年事件 (13-18 岁)
   - 成年事件 (19-54 岁)
   - 老年事件 (55+ 岁)
   - 自动事件 vs 选择事件
   - 武力成长
   - 金钱成长
   - 加入门派

3. **游戏过程时间线**
   - 按年龄顺序展示每个事件
   - 显示事件类型（自动/选择）
   - 记录玩家的选择
   - 展示状态变化

4. **详细数据表**
   - 年龄、事件 ID、事件名称
   - 类型、武力、金钱
   - 触发时间

---

## 🔧 配置选项

### 自定义模拟参数

```typescript
const simulator = new GameProcessSimulator({
  playerName: '我的角色',  // 玩家名称
  gender: 'male',          // 性别：'male' | 'female'
  simulateYears: 80,       // 模拟年数
  enableAutoSave: true,    // 启用自动保存
  enableManualSave: false, // 启用手动保存
  saveInterval: 5,         // 自动保存间隔（年）
  verbose: true            // 详细日志输出
});

await simulator.simulate();
```

### 配置文件位置

- 模拟器：[`tests/GameProcessSimulator.ts`](file:///Users/zhouyun/code/wuxia-life/tests/GameProcessSimulator.ts)
- 执行脚本：[`tests/runGameProcessTest.ts`](file:///Users/zhouyun/code/wuxia-life/tests/runGameProcessTest.ts)

---

## 📋 测试流程详解

### 步骤 1: 创建角色

```
📝 步骤 1: 创建角色
[GameEngine] 新游戏开始：模拟玩家 (male)
   ✅ 玩家：模拟玩家
   ✅ 年龄：0 岁
   ✅ 性别：male
```

**模拟内容**:
- 调用 `gameEngine.startNewGame()`
- 设置玩家名称和性别
- 初始化游戏状态

### 步骤 2: 模拟人生历程

```
━━━ 0 岁 ━━━
   事件：降生武侠世家
   类型：auto
   描述：人生的第一刻，命运的齿轮开始转动。...
   ✅ 自动触发

━━━ 4 岁 ━━━
   事件：童年选择
   类型：choice
   描述：人生的重要选择往往从小开始。...
   可用选项 (3 个):
     1. focus_on_study
     2. play_outside
     3. balance_both
   ✅ 选择：focus_on_study
```

**模拟内容**:
- 获取当前年龄的可用事件
- 自动事件：直接触发
- 选择事件：智能选择选项
- 执行事件效果
- 推进时间
- 定期自动保存

### 步骤 3: 生成测试报告

```
📝 步骤 3: 生成测试报告
📄 JSON 报告：tests/reports/game-process-xxx.json
📄 HTML 报告：tests/reports/game-process-xxx.html
```

**报告内容**:
- 完整的游戏过程记录
- 统计数据
- 时间线
- 详细数据表

---

## 🎯 智能决策系统

### 选择策略

模拟器使用智能策略选择事件选项：

1. **优先选择增加属性的选项**
   ```typescript
   if (effect.operator === 'add' && effect.value > 0) {
     return choice;  // 选择正面效果
   }
   ```

2. **其次选择有意义的选项**
   - 推动剧情发展
   - 触发特殊事件

3. **最后随机选择**
   - 增加测试覆盖率

### 示例

```
事件：童年选择
选项 1: 专心学习 → 增加武力 +2
选项 2: 外出玩耍 → 增加快乐 +5
选项 3: 平衡发展 → 武力 +1, 快乐 +2

✅ 选择：专心学习（增加武力）
```

---

## 📊 数据统计

### 年龄段统计

```
童年事件 (0-12 岁): 15 个
青年事件 (13-18 岁): 8 个
成年事件 (19-54 岁): 25 个
老年事件 (55+ 岁): 15 个
```

### 事件类型统计

```
自动事件：21 个
选择事件：42 个
```

### 成长统计

```
武力成长：+30
金钱成长：+100
加入门派：峨眉派
```

---

## 🔍 故障排查

### 问题 1: 无可用事件

**现象**:
```
⚠️  无可用事件
```

**原因**: 
- 事件条件不满足
- 事件已触发过（once 标签）
- 年龄不在事件范围内

**解决**:
- 检查事件条件配置
- 验证事件年龄范围
- 查看游戏状态是否满足条件

### 问题 2: 选择效果未执行

**现象**:
- 选择了选项但没有效果

**原因**:
- 选项没有配置 effects
- 效果执行失败

**解决**:
- 检查选项配置
- 查看效果执行日志

### 问题 3: 报告未生成

**检查项**:
1. 确认 `tests/reports/` 目录存在
2. 确认有写入权限
3. 检查终端错误信息

---

## 💡 最佳实践

### 1. 每次开发后运行

```bash
# 完成功能开发后
npx tsx tests/runGameProcessTest.ts

# 验证没有破坏现有功能
```

### 2. 定期回归测试

```bash
# 每周运行一次，保存报告
npx tsx tests/runGameProcessTest.ts > weekly-test.txt

# 对比历史报告
```

### 3. 结合其他测试

```bash
# 完整测试流程
npx tsx scripts/run-all-tests.ts

# 包含：
# - 游戏过程模拟测试
# - Phase 2 功能测试
# - 性能优化测试
# - 整体测试
# - 集成测试
```

---

## 📁 文件结构

```
wuxia-life/
├── tests/
│   ├── GameProcessSimulator.ts    # 游戏过程模拟器核心
│   ├── runGameProcessTest.ts      # 测试执行脚本
│   └── reports/
│       ├── game-process-xxx.html  # HTML 报告
│       └── game-process-xxx.json  # JSON 数据
├── scripts/
│   ├── run-all-tests.ts           # 统一测试脚本
│   └── life-simulator/reports/    # 报告中心目录
│       ├── game-process-xxx.html  # 复制的报告
│       └── manifest.json          # 报告索引
└── TESTING_GUIDE.md               # 本指南
```

---

## 🎉 成功标志

当你看到以下输出时，说明测试成功：

```
✅ 游戏过程模拟测试完成！

📄 已复制 JSON 报告到：...
📄 已复制 HTML 报告到：...
✅ Manifest 已更新

================================================================================
📊 游戏过程模拟测试总结
================================================================================
测试时间：2026/3/12 12:01:21
玩家：模拟玩家
总年数：63 年
最终年龄：80 岁
生存状态：✅ 在世
触发事件：63 个
做出选择：42 次
存档次数：38 次
================================================================================
```

---

## 📞 需要帮助？

### 查看相关文档

- [快速测试指南](file:///Users/zhouyun/code/wuxia-life/scripts/QUICK_TEST.md)
- [完整测试指南](file:///Users/zhouyun/code/wuxia-life/scripts/TESTING_GUIDE.md)
- [Phase 2 测试报告](file:///Users/zhouyun/code/wuxia-life/tests/reports/PHASE2_FULL_TEST_REPORT_2026-03-12.md)

### 查看报告

- [最新游戏过程报告](file:///Users/zhouyun/code/wuxia-life/scripts/life-simulator/reports/game-process-gp_1773288081745_ebfafa57.html)
- [报告中心页面](file:///Users/zhouyun/code/wuxia-life/scripts/life-simulator/index-full.html)

---

**最后更新**: 2026-03-12  
**文档版本**: 1.0  
**维护者**: Trae AI Assistant
