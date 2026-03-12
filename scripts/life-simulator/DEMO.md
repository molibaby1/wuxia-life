# 玩家生命周期自动模拟测试系统 - 演示指南

## 🎬 系统演示

### 1. 基本演示

#### 运行一次完整模拟
```bash
cd /Users/zhouyun/code/wuxia-life
npx tsx scripts/life-simulator/simulator.ts
```

**输出示例**:
```
🎮 ==================================================
玩家生命周期自动模拟测试系统 v1.0
==================================================

📋 模拟配置:
   起始年龄：12
   结束年龄：80
   随机性权重：0.5
   日志级别：normal
   AI 评估：启用

📦 加载剧情数据...
📚 已加载 0 个故事节点

👤 初始状态:
   性别：male
   年龄：12
   武功：10
   外功：14
   内力：10
   轻功：27
   侠义：37

🚀 开始模拟...

✅ 模拟完成!

📊 生成报告...
🤖 执行 AI 评估...

   整体评分：100.0 / 100
   连贯性：100.0
   反馈关联性：100.0
   状态转换：100.0
   决策合理性：100.0

   AI 总结：本次模拟整体表现为优秀。
   
📄 导出报告...
📄 JSON 报告已导出：...
📄 HTML 报告已导出：...

🎉 模拟测试全部完成!
```

### 2. 高级配置演示

#### 自定义模拟参数
```bash
# 模拟 60 年，随机性 70%，详细日志
npx tsx scripts/life-simulator/simulator.ts \
  --years=60 \
  --randomness=0.7 \
  --log=detailed
```

#### 禁用 AI 评估（更快）
```bash
npx tsx scripts/life-simulator/simulator.ts --no-ai --years=50
```

#### 静默模式（批量测试用）
```bash
npx tsx scripts/life-simulator/simulator.ts --quiet --years=30
```

### 3. 查看生成的报告

#### 查找最新报告
```bash
# 列出所有报告
ls -lh scripts/life-simulator/life-sim-report-*

# 打开最新 HTML 报告（macOS）
open scripts/life-simulator/life-sim-report-*.html

# 查看 JSON 报告内容
cat scripts/life-simulator/life-sim-report-*.json | head -50
```

### 4. 批量测试演示

#### 运行 10 次模拟
```bash
for i in {1..10}; do
  echo "运行第 $i 次模拟..."
  npx tsx scripts/life-simulator/simulator.ts --years=50 --quiet --no-ai
done

echo "批量测试完成！"
ls -lh scripts/life-simulator/life-sim-report-* | tail -10
```

## 📊 报告内容解析

### HTML 报告结构

1. **顶部标题栏**
   - 报告标题
   - 生成时间

2. **统计摘要面板**
   - 总选择次数
   - 关键决策点数量
   - 寿命（年）
   - 状态变化次数
   - 门派
   - 子女数量

3. **AI 评估报告**
   - 整体评分（大字显示）
   - 四个维度评分：
     * 连贯性
     * 反馈关联性
     * 状态转换逻辑性
     * 决策合理性
   - 逻辑矛盾列表（如果有）
   - AI 总结
   - 改进建议

4. **选择记录表格**
   - 序号
   - 年龄
   - 节点 ID
   - 选择内容
   - 选择理由
   - 状态变化

### JSON 报告结构

```json
{
  "reportId": "sim_1234567890",
  "generatedAt": "2024-01-01T12:00:00.000Z",
  "config": { ... },
  "statistics": {
    "totalChoices": 150,
    "criticalDecisions": 12,
    "lifespan": 80,
    "sect": "武当派",
    "children": 3,
    ...
  },
  "aiEvaluation": {
    "overallScore": 85.5,
    "dimensions": { ... },
    "conflicts": [ ... ],
    "recommendations": [ ... ]
  },
  "choiceRecords": [ ... ],
  "stateSnapshots": [ ... ]
}
```

## 🎯 实际应用场景

### 场景 1: 游戏测试
```bash
# 测试新添加的事件是否正常触发
npx tsx scripts/life-simulator/simulator.ts --years=80 --log=verbose

# 检查报告中的事件触发记录
grep "tournament" scripts/life-simulator/life-sim-report-*.json
```

### 场景 2: 平衡性分析
```bash
# 运行多次模拟收集数据
for i in {1..20}; do
  npx tsx scripts/life-simulator/simulator.ts --years=60 --quiet --no-ai
done

# 分析 JSON 报告中的统计数据
# - 平均寿命
# - 门派加入率
# - 武林大会参与率
```

### 场景 3: 边界测试
```bash
# 测试极端属性
# 修改 simulator.ts 中的 createInitialState 方法
# 设置极高的属性值
npx tsx scripts/life-simulator/simulator.ts --years=100

# 测试极低属性
npx tsx scripts/life-simulator/simulator.ts --years=100 --randomness=0.9
```

### 场景 4: AI 评估验证
```bash
# 启用 AI 评估，检查逻辑矛盾
npx tsx scripts/life-simulator/simulator.ts --years=80

# 查看 AI 评估结果
# - 整体评分
# - 发现的矛盾
# - 改进建议
```

## 🔍 调试技巧

### 查看详细日志
```bash
# 使用 verbose 日志级别
npx tsx scripts/life-simulator/simulator.ts --log=verbose --years=20
```

### 只运行特定年龄段
```bash
# 只模拟 12-30 岁
npx tsx scripts/life-simulator/simulator.ts --years=18
```

### 分析特定事件
```bash
# 在 JSON 中搜索特定事件
grep -A 5 "sect_join" scripts/life-simulator/life-sim-report-*.json
```

## 📈 性能提示

### 快速测试
```bash
# 短时间 + 静默 + 无 AI = 最快
npx tsx scripts/life-simulator/simulator.ts --years=20 --quiet --no-ai
```

### 完整分析
```bash
# 完整模拟 + 详细日志 + AI 评估 = 最详细
npx tsx scripts/life-simulator/simulator.ts --years=80 --log=verbose
```

### 批量测试性能
```bash
# 100 次快速模拟（约需 5-10 分钟）
time (for i in {1..100}; do
  npx tsx scripts/life-simulator/simulator.ts --years=50 --quiet --no-ai > /dev/null
done)
```

## 🎓 学习路径

### 初学者
1. 运行基本示例
2. 查看 HTML 报告
3. 理解各项统计数据

### 中级用户
1. 调整配置参数
2. 分析 AI 评估结果
3. 运行批量测试

### 高级用户
1. 扩展决策引擎
2. 添加新的评估维度
3. 自定义报告格式

## 📝 下一步

系统已经可以正常运行！下一步可以：

1. **添加实际游戏数据**：
   - 解析 `longEvents.ts` 文件
   - 加载真实的故事节点

2. **增强决策引擎**：
   - 添加更多权重计算规则
   - 实现机器学习模型

3. **扩展 AI 评估**：
   - 添加更多评估维度
   - 集成真正的 AI 模型

4. **优化报告系统**：
   - 添加图表可视化
   - 支持导出 PDF 格式

---

**Happy Simulating! 🎉**
