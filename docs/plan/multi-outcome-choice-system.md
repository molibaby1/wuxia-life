# 多结果分支系统设计

## 需求
为选择添加多个可能的结果，根据条件判定触发哪个。

## 数据结构设计

### 1. ChoiceOutcome 接口

```typescript
interface ChoiceOutcome {
  id: string;                    // 结果ID
  condition: EventCondition;      // 触发条件（表达式或简单条件）
  text: string;                   // 结果描述（显示给玩家）
  effects: EffectDefinition[];    // 该结果的效果
  weight?: number;                // 权重（当多个条件满足时）
}
```

### 2. EventChoice 扩展

在现有 `EventChoice` 中添加可选的 `outcomes` 字段：

```typescript
interface EventChoice {
  id: string;
  text: string;
  condition?: EventCondition;
  effects: EffectDefinition[];  // 向后兼容：作为默认/单一结果

  // 新增：多结果
  outcomes?: ChoiceOutcome[];   // 多个可能的结果

  // 新增：默认结果（当无 outcome 匹配时使用 effects）
  defaultOutcome?: boolean;
}
```

### 3. 执行逻辑

当选择有 `outcomes` 时：
1. 按顺序检查每个 outcome 的 condition
2. 第一个满足条件的 outcome 被选中
3. 如果没有 outcome 匹配，使用原有的 effects

### 4. 示例 JSON

```json
{
  "id": "challenge_warrior",
  "text": "挑战成名高手",
  "outcomes": [
    {
      "id": "success",
      "condition": {
        "type": "expression",
        "expression": "martialPower >= 60"
      },
      "text": "你武艺高强，轻松取胜！江湖人称你为少年高手！",
      "effects": [
        {"type": "stat_modify", "stat": "reputation", "value": 20},
        {"type": "stat_modify", "stat": "martialPower", "value": 10}
      ]
    },
    {
      "id": "partial",
      "condition": {
        "type": "expression",
        "expression": "martialPower >= 40"
      },
      "text": "你苦战一场，虽然艰难取胜，但也令江湖人士刮目相看。",
      "effects": [
        {"type": "stat_modify", "stat": "reputation", "value": 10},
        {"type": "stat_modify", "stat": "constitution", "value": -5}
      ]
    },
    {
      "id": "failure",
      "condition": {
        "type": "expression",
        "expression": "true"
      },
      "text": "你实力不济，败下阵来。但对方欣赏你的勇气，邀请你改日再战。",
      "effects": [
        {"type": "stat_modify", "stat": "reputation", "value": -5},
        {"type": "stat_modify", "stat": "chivalry", "value": 5}
      ]
    }
  ]
}
```

## 实施步骤

1. 在 `eventTypes.ts` 中添加 `ChoiceOutcome` 接口
2. 修改 `EventChoice` 接口添加 `outcomes` 字段
3. 在 `EventExecutor` 中实现分支结果选择逻辑
4. 在 `GameEngineIntegration` 中处理结果显示
5. 为示例选项添加多结果

## 向后兼容

- 如果 `outcomes` 为空或未定义，使用原有的 `effects`
- 现有选择无需修改
