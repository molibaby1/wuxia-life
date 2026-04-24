# 补充选项事件结果文本计划

## 背景

当前系统已支持 `outcomes` 多结果分支，但许多选择事件的选项没有 `text` 字段，导致玩家选择后看不到有意义的结果描述。

## 目标

为所有选择事件的选项补充结果描述文本（`text` 字段）。

## 实施步骤

### 1. 分析现有选项事件

检查以下文件中的选项：
- `love.json` - 恋爱线
- `chivalry-events.json` - 江湖线
- `general.json` - 通用线
- `identity-hero.json` - 大侠线
- `identity-demon.json` - 邪派线
- `identity-wanderer.json` - 游侠线
- 其他含选择事件的文件

### 2. 为选项添加 text 字段

对于有 `outcomes` 的选项：
- 每个 outcome 已有 `text` 字段 ✅

对于没有 `outcomes` 但有 `effects` 的选项：
- 添加统一的 `text` 字段描述效果

### 3. 验证

- TypeScript 编译通过
- 运行模拟器测试

## 文件清单

| 文件 | 选项数 | 需要补充 |
|------|--------|----------|
| love.json | ~15 | 部分 |
| chivalry-events.json | ~8 | 大部分 |
| general.json | ~10 | 部分 |
| identity-hero.json | ~6 | 部分 |
| identity-demon.json | ~4 | 已完成 |
| identity-wanderer.json | ~4 | 部分 |
| martial-arts-meeting.json | ~8 | 已完成 |
| sect-*.json (各门派) | ~15 | 部分 |

## 优先级

1. **高**：用户常遇到的选项（初遇、门派入门等）
2. **中**：江湖事件选项
3. **低**：其他选项
