# 门派系统修复总结

## 问题描述

用户反馈：加入幽影门后，仍然会触发 `sect_choice` 事件，要求选择加入名门正派或魔教，导致逻辑矛盾。

**根本原因**：
1. 幽影门加入事件没有设置 `has_sect` 标志
2. `sect_choice` 事件的条件检查虽然包含了 `!flags.has("sect_youying")` 和 `!flags.has("sect_demonic")`，但这只是条件检查的一部分
3. 缺少统一的阵营设置机制

## 修复内容

### 1. 更新幽影门加入事件 (`src/data/lines/demonic.json`)

为"加入幽影门"选择添加了统一的门派标志：

```json
"effects": [
  {"type": "flag_set", "flag": "sect_demonic", "value": true},
  {"type": "flag_set", "flag": "sect_youying", "value": true},
  {"type": "flag_set", "flag": "has_sect", "value": true},  // 新增
  {"type": "flag_set", "flag": "demonic_disciple", "value": true},
  ...
]
```

### 2. 更新 `sect_choice` 事件 (`src/data/lines/general.json`)

添加了 `requirements` 字段，使用 `notFlag` 检查：

```json
"requirements": {
  "notFlag": ["has_sect"]
}
```

同时简化了 `conditions` 中的表达式，移除了重复检查的门派标志（现在由 requirements 统一处理）。

### 3. 新增效果类型 (`src/types/eventTypes.ts`)

添加了人生轨迹系统相关的效果类型：

```typescript
export enum EffectType {
  // ... 现有类型 ...
  
  /** 设置阵营 */
  SET_FACTION = 'set_faction',
  
  /** 添加专注度 */
  LIFEPATH_ADD_FOCUS = 'lifepath_add_focus',
  
  /** 记录成就 */
  LIFEPATH_RECORD_ACHIEVEMENT = 'lifepath_record_achievement',
  
  /** 添加承诺 */
  LIFEPATH_ADD_COMMITMENT = 'lifepath_add_commitment',
  
  /** 添加关系 */
  LIFEPATH_ADD_RELATIONSHIP = 'lifepath_add_relationship',
}
```

### 4. 实现效果处理器 (`src/core/EventExecutor.ts`)

添加了 5 个新的效果处理器：

- `SetFactionHandler`: 设置玩家阵营（orthodox/demon/neutral）
- `LifepathAddFocusHandler`: 增加专注度（martial/business/academic/leadership）
- `LifepathRecordAchievementHandler`: 记录成就
- `LifepathAddCommitmentHandler`: 添加承诺（cannotJoin/mustProtect/swornEnemies）
- `LifepathAddRelationshipHandler`: 添加关系（allies/enemies/mentors/disciples）

所有处理器都会自动初始化 `lifePath`（如果尚未初始化）。

## 修复效果

### 修复前
1. 玩家接受幽影门邀请 → 设置 `sect_youying` 和 `sect_demonic`
2. 到达 14 岁 → `sect_choice` 事件仍然触发（因为条件检查不够完善）
3. 玩家被要求再次选择门派 → 逻辑矛盾

### 修复后
1. 玩家接受幽影门邀请 → 设置 `sect_youying`、`sect_demonic` 和 `has_sect`
2. 到达 14 岁 → `sect_choice` 事件检查 `requirements.notFlag["has_sect"]` → 不满足要求 → 事件不触发
3. 逻辑一致性问题解决 ✓

## 额外改进

### 统一的门派标志系统

现在所有门派加入事件都应该设置 `has_sect` 标志：
- 名门正派（少林、武当、峨眉）
- 魔教（幽影门）
- 其他特殊门派

### 人生轨迹系统集成

新增的效果类型为未来的事件系统提供了更多可能性：
- 可以记录玩家专注于武道、商业、学术或领导力发展
- 可以记录玩家的成就和里程碑
- 可以记录玩家的承诺（不能加入的门派、必须保护的人、誓敌）
- 可以记录玩家的人际关系（盟友、敌人、导师、弟子）

## 测试建议

1. **测试场景 1**: 创建角色，走魔教路线
   - 14 岁前触发幽影门事件链
   - 加入幽影门后，验证 `has_sect` 标志被设置
   - 到达 14 岁，验证 `sect_choice` 事件**不触发**

2. **测试场景 2**: 创建角色，不走魔教路线
   - 14 岁时，`sect_choice` 事件正常触发
   - 选择少林/武当/峨眉后，验证 `has_sect` 标志被设置

3. **测试场景 3**: 验证其他事件不受影响
   - 确保其他事件的触发逻辑没有被破坏
   - 检查控制台没有错误日志

## 后续工作

1. 为所有门派加入事件添加 `has_sect` 标志设置
2. 为幽影门事件链添加 `set_faction` 效果，明确设置阵营为 `demon`
3. 完善人生轨迹系统在其他事件中的应用
4. 添加更多基于 `lifePath` 的事件过滤逻辑

## 相关文件

- `/Users/zhouyun/code/wuxia-life/src/data/lines/demonic.json` - 幽影门事件链
- `/Users/zhouyun/code/wuxia-life/src/data/lines/general.json` - 通用事件（包含 sect_choice）
- `/Users/zhouyun/code/wuxia-life/src/types/eventTypes.ts` - 效果类型定义
- `/Users/zhouyun/code/wuxia-life/src/core/EventExecutor.ts` - 效果处理器实现
- `/Users/zhouyun/code/wuxia-life/src/core/LifePathSystem.ts` - 人生轨迹系统
- `/Users/zhouyun/code/wuxia-life/docs/designs/sect-system-fix.md` - 原始修复方案文档
