# 玩家生命周期自动模拟测试系统 - 实现总结

## 📋 项目概述

已成功设计并实现一个**完整的玩家生命周期自动模拟测试系统**，该系统满足所有需求规格：

✅ 1. 自动模拟玩家从初始状态到游戏结束的完整生命周期过程  
✅ 2. 在所有交互节点处采用随机选择算法进行决策  
✅ 3. 详细记录每一次选择的时间戳、选择内容、系统反馈及相关游戏状态变化  
✅ 4. 生成结构化的测试报告（JSON/HTML），包含完整的选择路径、关键决策点及系统响应数据  
✅ 5. 基于 AI 的经验对记录过程进行逻辑合理性评估  
✅ 6. 可配置的模拟参数系统  

## 🎯 核心功能实现

### 1. 自动生命周期模拟

**实现文件**: [`simulator.ts`](file:///Users/zhouyun/code/wuxia-life/scripts/life-simulator/simulator.ts)

**核心特性**:
- 从起始年龄（默认 12 岁）模拟到结束年龄（默认 80 岁）
- 自动检测玩家死亡状态并终止模拟
- 支持门派入门、武林大会、爱情线等多条剧情线
- 智能节点匹配系统，确保长事件的正确触发

**关键代码**:
```typescript
async run(): Promise<SimulationReport> {
  // 初始化状态
  this.currentState = this.createInitialState();
  
  // 运行模拟
  while (await this.simulateYear()) {
    // 继续模拟
  }
  
  // 生成报告
  const report = await this.logger.generateReport(this.config, this.currentState);
  
  // AI 评估
  if (this.config.enableAiEvaluation) {
    const aiEvaluation = this.aiEvaluator.evaluate(
      report.choiceRecords,
      report.stateSnapshots
    );
    report.aiEvaluation = aiEvaluation;
  }
  
  return report;
}
```

### 2. 智能随机选择算法

**实现文件**: [`decisionEngine.ts`](file:///Users/zhouyun/code/wuxia-life/scripts/life-simulator/decisionEngine.ts)

**核心算法**:

#### a) 伪随机数生成器（支持种子）
```typescript
class SeededRandom implements IRandomEngine {
  private seed: number = 12345;
  
  random(): number {
    // LCG 算法
    const a = 1664525;
    const c = 1013904223;
    const m = Math.pow(2, 32);
    this.seed = (a * this.seed + c) % m;
    return this.seed / m;
  }
}
```

#### b) 权重计算系统
根据玩家属性动态计算每个选择的权重：
- **战斗选择**: 基于 `martialPower`
- **轻功选择**: 基于 `qinggong`
- **内力选择**: 基于 `internalSkill`
- **外功选择**: 基于 `externalSkill`
- **侠义选择**: 基于 `chivalry`
- **年龄因素**: 年轻人更倾向积极选择

```typescript
private calculateChoiceWeights(choices: StoryChoice[], state: PlayerState): Record<string, number> {
  const weights: Record<string, number> = {};
  
  choices.forEach(choice => {
    let weight = 1.0;
    
    // 条件检查
    if (choice.condition) {
      const conditionMet = choice.condition(state);
      if (!conditionMet) weight = 0;
    }
    
    // 属性权重
    const choiceId = choice.id.toLowerCase();
    if (choiceId.includes('fight')) {
      weight *= (0.5 + state.martialPower / 100);
    }
    if (choiceId.includes('qinggong')) {
      weight *= (0.5 + state.qinggong / 100);
    }
    
    weights[choice.id] = Math.max(0, weight);
  });
  
  return weights;
}
```

#### c) 混合选择策略
根据 `randomnessWeight` 参数决定：
- `randomnessWeight = 0`: 完全基于权重（智能选择）
- `randomnessWeight = 1`: 完全随机选择
- `randomnessWeight = 0.5`: 50% 概率按权重，50% 完全随机

### 3. 详细事件记录系统

**实现文件**: [`logger.ts`](file:///Users/zhouyun/code/wuxia-life/scripts/life-simulator/logger.ts)

**记录内容**:

#### a) 选择记录 (ChoiceRecord)
```typescript
interface ChoiceRecord {
  timestamp: string;           // 时间戳
  gameYear: number;            // 游戏内年龄
  nodeId: string;              // 节点 ID
  nodeText: string;            // 节点文本
  availableChoices: Array<{    // 可用选择列表
    id: string;
    text: string;
    condition?: any;
  }>;
  selectedChoiceId: string;    // 已选择 ID
  selectedChoiceText: string;  // 已选择文本
  selectionReason: string;     // 选择理由
  weights?: Record<string, number>;  // 权重信息
  systemFeedback: string;      // 系统反馈
  stateBefore: Partial<PlayerState>;  // 选择前状态
  stateAfter: Partial<PlayerState>;   // 选择后状态
  stateChanges: Array<{        // 状态变化详情
    field: string;
    oldValue: any;
    newValue: any;
  }>;
}
```

#### b) 状态快照 (StateSnapshot)
定期记录完整状态，用于 AI 评估和数据分析。

#### c) 关键决策点 (CriticalDecisionPoint)
自动识别重要决策：
- 门派选择 (`sect_join`)
- 武林大会 (`tournament`)
- 爱情选择 (`love`)
- 生死抉择 (`life_death`)

### 4. 结构化测试报告生成器

**支持格式**: JSON + HTML

#### JSON 报告
完整的结构化数据，包含：
- 报告元数据（ID、时间戳、配置）
- 完整选择记录数组
- 状态快照数组
- AI 评估报告
- 统计数据

#### HTML 报告
美观的可视化界面，特性：
- 响应式设计（支持移动端）
- 渐变背景和卡片布局
- 统计摘要面板
- AI 评估可视化
- 逻辑矛盾高亮显示
- 详细选择记录表格

**HTML 报告结构**:
```html
<div class="container">
  <div class="header">
    <h1>🎮 玩家生命周期模拟报告</h1>
    <p>生成时间：{timestamp}</p>
  </div>
  
  <div class="summary">
    <!-- 统计卡片 -->
  </div>
  
  <div class="section">
    <!-- AI 评估报告 -->
  </div>
  
  <div class="section">
    <!-- 选择记录表格 -->
  </div>
</div>
```

### 5. AI 逻辑合理性评估系统

**实现文件**: [`aiEvaluator.ts`](file:///Users/zhouyun/code/wuxia-life/scripts/life-simulator/aiEvaluator.ts)

#### 评估维度 1: 选择路径连贯性 (Coherence)
```typescript
evaluateCoherence(choiceRecords: ChoiceRecord[]): number {
  let score = 100;
  
  for (let i = 1; i < choiceRecords.length; i++) {
    const prev = choiceRecords[i - 1];
    const curr = choiceRecords[i];
    
    // 检测连续随机选择
    if (curr.selectionReason.includes('随机')) {
      consecutiveRandomChoices++;
      if (consecutiveRandomChoices > 3) score -= 2;
    }
    
    // 检测年龄跳跃
    const ageDiff = curr.gameYear - prev.gameYear;
    if (ageDiff > 5) score -= (ageDiff - 3) * 2;
    
    // 检测逻辑不连贯
    if (this.isInconsistentTransition(prev, curr)) score -= 10;
  }
  
  return Math.max(0, Math.min(100, score));
}
```

**检测项**:
- ✅ 连续随机选择过多
- ✅ 年龄跳跃过大
- ✅ 逻辑不连贯（如刚加入门派就参加其他活动）
- ✅ 死亡后仍有活动（严重错误）

#### 评估维度 2: 系统反馈关联性 (Feedback Relevance)
```typescript
evaluateFeedbackRelevance(choiceRecords: ChoiceRecord[]): number {
  let score = 100;
  
  choiceRecords.forEach(record => {
    // 检查反馈是否为空
    if (!record.systemFeedback) score -= 5;
    
    // 检查状态变化与选择的相关性
    const choiceId = record.selectedChoiceId.toLowerCase();
    if (choiceId.includes('fight')) {
      const hasRelevantChange = stateChanges.some(change =>
        ['martialPower', 'internalSkill'].includes(change.field)
      );
      if (!hasRelevantChange) score -= 3;
    }
  });
  
  return score;
}
```

**检测项**:
- ✅ 系统反馈为空
- ✅ 战斗选择无属性变化
- ✅ 学习选择无技能提升

#### 评估维度 3: 状态转换逻辑性 (State Transition Logic)
```typescript
evaluateStateTransitionLogic(snapshots: StateSnapshot[]): number {
  let score = 100;
  
  for (let i = 1; i < snapshots.length; i++) {
    const prev = snapshots[i - 1];
    const curr = snapshots[i];
    
    // 年龄倒流（严重错误）
    if (curr.age < prev.age) score -= 20;
    
    // 门派消失（非死亡）
    if (prev.state.sect && !curr.state.sect && !prev.state.deathReason) {
      score -= 15;
    }
  }
  
  return score;
}
```

**检测项**:
- ✅ 年龄倒流
- ✅ 年龄跳跃过大
- ✅ 门派状态不一致
- ✅ 生命值骤降
- ✅ Flags 异常消失

#### 评估维度 4: 决策合理性 (Decision Rationality)
```typescript
evaluateDecisionRationality(choiceRecords: ChoiceRecord[]): number {
  let score = 100;
  
  choiceRecords.forEach(record => {
    const { weights, selectedChoiceId, stateBefore } = record;
    
    // 权重分析
    if (weights) {
      const maxWeight = Math.max(...Object.values(weights));
      const selectedWeight = weights[selectedChoiceId];
      
      if (selectedWeight < maxWeight * 0.3) score -= 5;
    }
    
    // 属性匹配
    const choiceId = selectedChoiceId.toLowerCase();
    if (choiceId.includes('aggressive') && stateBefore.martialPower < 20) {
      score -= 3;
    }
  });
  
  return score;
}
```

**检测项**:
- ✅ 选择权重最低的选项
- ✅ 武功低却选择激进战斗
- ✅ 侠义低却选择帮助他人
- ✅ 所有权重为 0（配置错误）

#### 逻辑矛盾检测
```typescript
detectLogicConflicts(choiceRecords: ChoiceRecord[]): LogicConflict[] {
  const conflicts: LogicConflict[] = [];
  
  // 因果错误：死亡后还有活动
  for (let i = 0; i < choiceRecords.length - 1; i++) {
    const curr = choiceRecords[i];
    const next = choiceRecords[i + 1];
    
    if (curr.stateAfter.deathReason && next.gameYear > curr.gameYear) {
      conflicts.push({
        id: `conflict_${i}`,
        type: 'causality_error',
        severity: 'critical',
        description: `玩家在年龄 ${curr.gameYear} 死亡，但在年龄 ${next.gameYear} 仍有活动`,
        suggestedFix: '检查死亡状态判断逻辑',
      });
    }
  }
  
  // 状态不一致：多次加入门派
  const sectJoins = choiceRecords.filter(r => 
    r.stateAfter.sect && !r.stateBefore.sect
  );
  
  if (sectJoins.length > 1) {
    conflicts.push({
      id: 'conflict_sect',
      type: 'state_inconsistency',
      severity: 'high',
      description: `玩家多次加入门派 (${sectJoins.length} 次)`,
      suggestedFix: '检查门派加入条件',
    });
  }
  
  return conflicts;
}
```

**矛盾类型**:
- `causality_error`: 因果错误（死亡后活动）
- `state_inconsistency`: 状态不一致
- `event_order`: 事件顺序错误
- `condition_violation`: 条件违反

**严重程度**:
- `critical`: 严重（因果错误）
- `high`: 高（状态不一致）
- `medium`: 中
- `low`: 低

#### AI 总结生成
```typescript
generateSummary(dimensions, conflicts): string {
  const avgScore = (coherence + feedbackRelevance + 
                    stateTransitionLogic + decisionRationality) / 4;
  
  let summary = `本次模拟整体表现为${
    avgScore >= 80 ? '优秀' : avgScore >= 60 ? '良好' : '一般'
  }。`;
  
  if (dimensions.coherence >= 80) {
    summary += ' 选择路径连贯性好，决策过程自然流畅。';
  }
  
  if (conflicts.length === 0) {
    summary += ' 未发现明显的逻辑矛盾。';
  } else {
    summary += ` 发现 ${conflicts.length} 个逻辑矛盾，需要关注。`;
  }
  
  return summary;
}
```

#### 改进建议生成
自动根据评估结果生成针对性建议：
- 连贯性低 → 优化随机选择算法
- 反馈关联性低 → 增强选择与反馈关联
- 状态转换低 → 检查状态转换逻辑
- 决策合理性低 → 调整决策引擎
- 发现矛盾 → 提供具体修复建议

### 6. 可配置模拟参数系统

**配置接口**:
```typescript
interface SimulationConfig {
  simulationYears: number;        // 模拟时长（年数）
  randomnessWeight: number;       // 随机性权重 (0-1)
  logLevel: 'minimal' | 'normal' | 'detailed' | 'verbose';
  enableAiEvaluation: boolean;    // 是否启用 AI 评估
  verboseOutput: boolean;         // 是否输出详细日志
  randomSeed?: number;            // 随机种子
  startAge: number;               // 起始年龄
  endAge: number;                 // 结束年龄
}
```

**默认配置**:
```typescript
const DEFAULT_CONFIG: SimulationConfig = {
  simulationYears: 80,
  randomnessWeight: 0.5,
  logLevel: 'normal',
  enableAiEvaluation: true,
  verboseOutput: true,
  startAge: 12,
  endAge: 80,
};
```

**命令行参数解析**:
```typescript
const args = process.argv.slice(2);
const config: Partial<SimulationConfig> = {};

args.forEach(arg => {
  if (arg.startsWith('--years=')) {
    config.simulationYears = parseInt(arg.split('=')[1]);
  } else if (arg.startsWith('--randomness=')) {
    config.randomnessWeight = parseFloat(arg.split('=')[1]);
  } else if (arg.startsWith('--log=')) {
    config.logLevel = arg.split('=')[1] as any;
  } else if (arg === '--no-ai') {
    config.enableAiEvaluation = false;
  } else if (arg === '--quiet') {
    config.verboseOutput = false;
  }
});
```

## 📁 文件结构

```
scripts/life-simulator/
├── types.ts              # 类型定义（所有接口和类型）
├── decisionEngine.ts     # 决策引擎（随机选择算法）
├── logger.ts            # 日志记录系统（报告生成）
├── aiEvaluator.ts       # AI 评估系统（逻辑合理性分析）
├── simulator.ts         # 主模拟器（核心引擎）
└── README.md            # 使用文档

根目录:
└── LIFE_SIMULATOR_SUMMARY.md  # 本总结文档
```

## 🎯 使用指南

### 快速开始
```bash
cd /Users/zhouyun/code/wuxia-life
npx tsx scripts/life-simulator/simulator.ts
```

### 高级用法
```bash
# 自定义参数
npx tsx scripts/life-simulator/simulator.ts \
  --years=60 \
  --randomness=0.7 \
  --log=detailed \
  --no-ai \
  --quiet

# 批量测试
for i in {1..10}; do
  npx tsx scripts/life-simulator/simulator.ts --years=50 --quiet
done
```

### 输出文件
运行后会生成两个报告：
- `scripts/life-simulator/life-sim-report-{timestamp}.json`
- `scripts/life-simulator/life-sim-report-{timestamp}.html`

## 📊 测试报告示例

### JSON 报告结构
```json
{
  "reportId": "sim_1234567890",
  "generatedAt": "2024-01-01T12:00:00.000Z",
  "config": { ... },
  "startTime": "...",
  "endTime": "...",
  "duration": 12345,
  "totalChoices": 150,
  "criticalDecisions": 12,
  "choiceRecords": [ ... ],
  "stateSnapshots": [ ... ],
  "aiEvaluation": {
    "overallScore": 85.5,
    "dimensions": {
      "coherence": 88.0,
      "feedbackRelevance": 82.5,
      "stateTransitionLogic": 90.0,
      "decisionRationality": 81.5
    },
    "conflicts": [],
    "criticalDecisions": [ ... ],
    "summary": "...",
    "recommendations": [ ... ]
  },
  "statistics": { ... }
}
```

### HTML 报告预览
- 美观的渐变背景
- 统计卡片面板（总选择数、关键决策、寿命等）
- AI 评估结果（整体评分、各维度评分）
- 逻辑矛盾列表（如果有）
- 详细选择记录表格

## 🔍 应用场景

### 1. 自动化游戏测试
- 发现逻辑漏洞
- 测试边界情况
- 验证事件触发条件

### 2. 游戏平衡性分析
- 分析属性对进程的影响
- 评估事件触发频率
- 调整数值平衡

### 3. 内容验证
- 确保所有事件正常触发
- 验证剧情链完整性
- 检查状态转换正确性

### 4. 数据收集与分析
- 收集玩家行为数据
- 分析决策模式
- 为 AI 训练提供数据

## 🎉 总结

已成功实现一个**功能完整、架构清晰、高度可配置**的玩家生命周期自动模拟测试系统：

✅ **自动化**: 从开始到结束完全自动化模拟  
✅ **智能化**: 基于属性的智能决策算法  
✅ **详细记录**: 完整的时间戳、选择、反馈、状态变化  
✅ **结构化报告**: JSON + HTML 双格式  
✅ **AI 评估**: 4 个维度、矛盾检测、改进建议  
✅ **高度可配置**: 7 个配置参数、5 个命令行选项  

系统代码结构清晰，易于扩展和维护，可用于游戏测试、平衡性分析、内容验证等多种场景。

---

**开发完成时间**: 2024  
**版本**: v1.0  
**状态**: ✅ 完成
