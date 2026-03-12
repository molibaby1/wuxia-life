# 玩家生命周期自动模拟测试系统 v1.0

## 🎯 系统概述

这是一个完整的玩家生命周期自动模拟测试系统，能够：

1. **自动模拟**玩家从初始状态到游戏结束的完整生命周期过程
2. **智能决策**在所有交互节点处采用随机选择算法进行决策
3. **详细记录**每一次选择的时间戳、选择内容、系统反馈及相关游戏状态变化
4. **生成报告**结构化的测试报告（JSON + HTML），包含完整的选择路径、关键决策点及系统响应数据
5. **AI 评估**基于规则的经验对记录过程进行逻辑合理性评估

## 🚀 快速开始

### 基本用法

```bash
cd /Users/zhouyun/code/wuxia-life
npx tsx scripts/life-simulator/simulator.ts
```

### 高级用法

```bash
# 自定义模拟参数
npx tsx scripts/life-simulator/simulator.ts --years=60 --randomness=0.7 --log=detailed

# 禁用 AI 评估
npx tsx scripts/life-simulator/simulator.ts --no-ai

# 静默模式（只输出报告）
npx tsx scripts/life-simulator/simulator.ts --quiet

# 组合使用
npx tsx scripts/life-simulator/simulator.ts --years=80 --randomness=0.5 --log=verbose --no-ai --quiet
```

## ⚙️ 配置参数

| 参数 | 说明 | 类型 | 默认值 | 示例 |
|------|------|------|--------|------|
| `--years=` | 模拟时长（年数） | number | 80 | `--years=60` |
| `--randomness=` | 随机性权重 (0-1) | float | 0.5 | `--randomness=0.7` |
| `--log=` | 日志级别 | string | 'normal' | `--log=verbose` |
| `--no-ai` | 禁用 AI 评估 | boolean | false | `--no-ai` |
| `--quiet` | 静默模式 | boolean | false | `--quiet` |

### 日志级别说明

- `minimal`: 只记录关键信息
- `normal`: 记录标准日志（默认）
- `detailed`: 详细记录每个选择
- `verbose`: 最详细的调试信息

### 随机性权重说明

- `0.0`: 完全基于属性权重（智能选择）
- `0.5`: 平衡随机性和权重（默认）
- `1.0`: 完全随机选择

## 📊 输出报告

系统会生成两个报告文件：

1. **JSON 报告**: `life-sim-report-{timestamp}.json`
   - 完整的结构化数据
   - 包含所有选择记录和状态快照
   - 适合程序分析和存档

2. **HTML 报告**: `life-sim-report-{timestamp}.html`
   - 美观的可视化界面
   - 响应式设计，支持移动端
   - 包含统计图表和 AI 评估结果

### 报告内容

#### 基本信息
- 报告 ID 和生成时间
- 模拟配置参数
- 模拟开始/结束时间
- 总耗时

#### 统计数据
- 总选择次数
- 关键决策点数量
- 平均每个选择耗时
- 状态变化总次数
- 触发的事件总数
- 寿命（年）
- 加入的门派
- 最终头衔
- 婚姻状况
- 子女数量
- 死亡原因

#### 详细记录
- 完整的选择路径（时间戳、年龄、节点、选择内容）
- 每次选择的系统反馈
- 状态变化详情
- 选择理由和权重信息

#### AI 评估报告（如果启用）
- 整体合理性评分 (0-100)
- 各维度评分：
  - 选择路径连贯性
  - 系统反馈关联性
  - 状态转换逻辑性
  - 决策合理性
- 发现的逻辑矛盾
- 关键决策点评估
- AI 总结意见
- 改进建议

## 🤖 AI 评估维度

### 1. 选择路径连贯性 (Coherence)
评估玩家选择的前后一致性：
- 检测连续随机选择
- 检测年龄跳跃
- 检测逻辑不连贯（如刚加入门派就参加其他活动）

### 2. 系统反馈关联性 (Feedback Relevance)
评估选择与反馈的匹配度：
- 检查系统反馈是否为空
- 检查状态变化与选择的相关性
- 战斗选择是否有属性变化
- 学习选择是否有技能提升

### 3. 状态转换逻辑性 (State Transition Logic)
评估游戏状态的转换是否合理：
- 年龄增长是否连续
- 门派状态是否一致
- 生命值变化是否合理
- Flags 的一致性检查

### 4. 决策合理性 (Decision Rationality)
评估决策是否符合角色属性：
- 权重分析（是否选择了低权重选项）
- 属性匹配（武功低却选择激进战斗）
- 性格匹配（侠义低却选择帮助他人）

## 📁 系统架构

```
scripts/life-simulator/
├── types.ts              # 类型定义
├── decisionEngine.ts     # 决策引擎（随机选择算法）
├── logger.ts            # 日志记录系统
├── aiEvaluator.ts       # AI 评估系统
├── simulator.ts         # 主模拟器
└── README.md            # 使用文档
```

### 核心组件

#### 1. DecisionEngine（决策引擎）
- 实现智能随机选择算法
- 支持基于属性的权重计算
- 可配置随机性权重

#### 2. SimulatorLogger（日志记录器）
- 记录所有选择事件
- 生成状态快照
- 导出 JSON/HTML 报告

#### 3. AiEvaluator（AI 评估器）
- 多维度评分系统
- 逻辑矛盾检测
- 关键决策点识别
- 自动生成改进建议

#### 4. LifeSimulator（主模拟器）
- 控制模拟流程
- 协调各组件工作
- 应用游戏规则

## 🎮 使用示例

### 示例 1：快速测试
```bash
npx tsx scripts/life-simulator/simulator.ts
```
使用默认配置运行一次完整模拟。

### 示例 2：短时间测试
```bash
npx tsx scripts/life-simulator/simulator.ts --years=30
```
模拟 30 年的人生。

### 示例 3：高随机性测试
```bash
npx tsx scripts/life-simulator/simulator.ts --randomness=0.9
```
90% 的随机性，测试极端情况。

### 示例 4：详细日志
```bash
npx tsx scripts/life-simulator/simulator.ts --log=verbose
```
输出最详细的调试信息。

### 示例 5：批量测试
```bash
for i in {1..10}; do
  npx tsx scripts/life-simulator/simulator.ts --years=50 --quiet --no-ai
done
```
运行 10 次快速模拟，用于压力测试。

## 🔍 应用场景

### 1. 游戏测试
- 自动化测试游戏流程
- 发现逻辑漏洞和边界情况
- 验证事件触发条件

### 2. 平衡性分析
- 分析不同属性对游戏进程的影响
- 评估事件触发的频率
- 调整数值平衡

### 3. 内容验证
- 确保所有事件都能正常触发
- 验证剧情链的完整性
- 检查状态转换的正确性

### 4. 数据收集
- 收集玩家行为数据
- 分析决策模式
- 为 AI 训练提供数据

## 📝 注意事项

1. **性能考虑**: 完整模拟（80 年）可能需要几分钟时间
2. **内存使用**: 详细日志级别会占用更多内存
3. **随机种子**: 当前版本每次运行使用不同的随机种子
4. **数据持久化**: 报告文件会保存在 `scripts/life-simulator/` 目录

## 🛠️ 扩展开发

### 添加新的决策策略

编辑 `decisionEngine.ts`，在 `calculateChoiceWeights` 方法中添加新的权重计算逻辑。

### 添加新的评估维度

编辑 `aiEvaluator.ts`，添加新的 `evaluate*` 方法并在 `evaluate` 方法中调用。

### 自定义报告格式

编辑 `logger.ts`，修改 `generateHtmlReport` 或添加新的导出方法。

## 📄 许可证

MIT License

## 👥 作者

玩家生命周期自动模拟测试系统开发团队

---

**Happy Testing! 🎉**
