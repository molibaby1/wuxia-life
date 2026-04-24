# 事件触发系统重构计划

## 问题分析

### 当前问题
1. **事件触发门槛缺失** - 大部分事件没有设置合理的触发门槛
2. **背景与事件不匹配** - 武夫背景可以触发科举事件，商人背景可以触发江湖传奇
3. **多条事件线同时触发** - 仕途、江湖、爱情等事件互不干扰
4. **触发逻辑分散** - `conditions`、`requirements`、`triggers` 分散在不同位置

### 根因
- 事件触发检查主要依赖 `age_reach` 触发器
- 条件检查使用表达式评估，但没有检查角色背景
- 缺少"经历门槛"机制 - 某些事件应该要求先触发过特定事件

---

## 重构方案

### 1. 门槛类型设计

```typescript
interface EventThreshold {
  /** 门槛类型 */
  type: 'attribute' | 'background' | 'experience' | 'flag' | 'identity';
  
  /** 评估方式 */
  evaluation: 'minimum' | 'maximum' | 'range' | 'required' | 'forbidden';
  
  /** 门槛值 */
  value: number | string | string[] | boolean;
  
  /** 错误消息（用于调试） */
  message?: string;
}
```

### 2. 门槛检查流程

```
事件选择流程:
1. 获取所有可用事件（按年龄、触发器过滤）
2. 门槛检查（新增）
   - 属性门槛：检查角色属性是否满足
   - 背景门槛：检查角色出身是否匹配
   - 经历门槛：检查是否触发过前置事件
   - 身份门槛：检查当前身份是否匹配
3. 现有检查（保留）
   - 条件检查（conditions）
   - 属性要求（requirements）
   - 冷却检查
   - 人生轨迹兼容性
4. 加权随机选择
```

### 3. 事件数据扩展

为事件添加 `thresholds` 字段：

```json
{
  "id": "official_entry",
  "name": "入仕机会",
  "thresholds": {
    "background": {
      "required": ["origin_scholar_family", "origin_official_family"],
      "evaluation": "at_least_one"
    },
    "attribute": {
      "comprehension": { "min": 15 },
      "charisma": { "min": 10 }
    }
  },
  "conditions": [
    { "type": "expression", "expression": "!flags.has('route_official')" }
  ]
}
```

### 4. 门槛评估器实现

创建 `ThresholdEvaluator` 类：

```typescript
class ThresholdEvaluator {
  // 检查属性门槛
  checkAttributeThresholds(thresholds: Record<string, ThresholdConfig>): boolean;
  
  // 检查背景门槛
  checkBackgroundThresholds(thresholds: BackgroundThreshold): boolean;
  
  // 检查经历门槛
  checkExperienceThresholds(thresholds: ExperienceThreshold): boolean;
  
  // 检查身份门槛
  checkIdentityThresholds(thresholds: IdentityThreshold): boolean;
}
```

---

## 实施步骤

### Phase 1: 基础设施（30%）
- [ ] 在 `EventDefinition` 类型中添加 `thresholds` 字段
- [ ] 创建 `ThresholdEvaluator` 类
- [ ] 在 `GameEngineIntegration` 中集成门槛检查

### Phase 2: 门槛类型实现（40%）
- [ ] 实现属性门槛检查
- [ ] 实现背景门槛检查（支持 origin_ 标签）
- [ ] 实现经历门槛检查（支持事件链）
- [ ] 实现身份门槛检查（支持 identity 标签）

### Phase 3: 事件数据更新（20%）
- [ ] 为科举/仕途事件添加背景门槛
- [ ] 为江湖事件添加经历门槛
- [ ] 为商业事件添加背景门槛
- [ ] 为江湖身份事件添加身份门槛

### Phase 4: 验证与优化（10%）
- [ ] 运行模拟测试
- [ ] 调整门槛参数
- [ ] 性能优化

---

## 预期效果

### 优化前
- 武夫背景 → 触发科举事件 ✓（不合理）
- 商人背景 → 触发江湖传奇 ✓（不合理）
- 所有事件线同时发生

### 优化后
- 武夫背景 → 科举事件触发率降低 80%
- 商人背景 → 科举事件触发率降低 90%
- 江湖事件需要先有江湖经历
- 事件触发更符合角色设定

---

## 风险与限制

1. **兼容性** - 现有事件条件需要迁移到新系统
2. **性能** - 门槛检查可能增加事件选择时间
3. **调试** - 需要清晰的日志帮助调试门槛问题
