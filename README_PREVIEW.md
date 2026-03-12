# 🎮 武侠人生模拟 - 项目预览指南

## 📋 目录

1. [快速开始](#快速开始)
2. [功能演示](#功能演示)
3. [技术架构](#技术架构)
4. [测试运行](#测试运行)

---

## 🚀 快速开始

### 方式一：运行测试脚本（推荐）

查看各功能的测试输出：

```bash
# Phase 1 - 核心功能测试
npx tsx tests/AllTests.ts

# Phase 1 - 集成测试
npx tsx tests/IntegrationTests.ts

# Phase 2 - 功能增强测试
npx tsx tests/testPhase2Features.ts

# Phase 2 - 性能优化测试
npx tsx tests/testPerformanceOptimization.ts

# 游戏引擎集成测试
npx tsx tests/testGameEngineIntegration.ts
```

### 方式二：启动开发服务器

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

然后访问演示页面查看效果。

---

## 🎯 功能演示

### Phase 1 - 核心主线事件

#### 1. 完整人生模拟（0-80 岁）
- **35 个事件**覆盖全年龄段
- **4 种结局**：传奇人生、幸福晚年、武学宗师、平凡一生
- **多路径选择**：门派选择、爱情线、武林大会等

**测试运行**:
```bash
npx tsx tests/testGameEngineIntegration.ts
```

**预期输出**:
```
=== 游戏引擎集成测试 ===
✅ 加载了 35 个事件
✅ 所有事件数据验证通过
测试 1: 开始新游戏
✅ 玩家：张三
✅ 年龄：0 岁
测试 2: 模拟童年阶段
  0 岁：降生武侠世家
  1 岁：探索小能手
  ...
```

### Phase 2.1 - UI/UX 优化

#### 2. 事件历史记录
- 📜 按时间倒序显示事件
- ⏰ 相对时间显示（刚刚、5 分钟前）
- 🔍 事件详情弹窗查看
- ✨ 高亮与自动滚动

**组件位置**: `src/components/EventHistory.vue`

### Phase 2.2 - 功能增强

#### 3. 存档管理系统
- 💾 手动保存/加载
- ⚡ 自动保存
- 📤 导出存档（JSON 格式）
- 📥 导入存档
- 🗑️ 删除存档

**组件位置**: 
- 核心：`src/core/SaveManager.ts`
- UI: `src/components/SaveManager.vue`

**测试运行**:
```bash
npx tsx tests/testPhase2Features.ts
```

**预期输出**:
```
=== Phase 2 功能测试 ===
测试 1: 开始新游戏
✅ 玩家：测试玩家
✅ 年龄：0 岁
测试 2: 手动保存
✅ 存档 ID: save_xxx
测试 3: 自动保存
✅ 自动保存完成
...
测试 12: 清空所有存档
✅ 剩余存档：0 个
```

### Phase 2.3 - 性能优化

#### 4. 性能监控工具
- 📊 事件执行时间统计
- ⚡ 条件评估时间统计
- 💾 内存使用监控
- 📈 性能报告生成

**核心文件**: `src/core/PerformanceMonitor.ts`

#### 5. 事件预加载器
- 🎯 预加载未来年龄段事件
- 🗂️ 事件池管理
- 🧹 内存优化（清除旧事件）

**核心文件**: `src/core/EventPreloader.ts`

**测试运行**:
```bash
npx tsx tests/testPerformanceOptimization.ts
```

**预期输出**:
```
=== Phase 2.3 性能优化测试 ===
测试 1: 性能监控初始化
✅ 性能监控已初始化
测试 2: 事件预加载 - 单个年龄
[EventPreloader] 预加载 0 岁事件：2 个
测试 3: 事件预加载 - 批量预加载
✅ 批量预加载完成
...
性能报告:
事件执行 (23 次):
  平均：0.023ms
  最小：0.000ms
  最大：0.090ms
```

---

## 🏗️ 技术架构

### 核心模块

```
src/
├── core/
│   ├── EventExecutor.ts          # 事件执行器
│   ├── ConditionEvaluator.ts     # 条件评估器
│   ├── EventLoader.ts            # 事件加载器
│   ├── GameEngineIntegration.ts  # 游戏引擎集成器
│   ├── SaveManager.ts            # 存档管理器 ⭐
│   ├── PerformanceMonitor.ts     # 性能监控 ⭐
│   └── EventPreloader.ts         # 事件预加载 ⭐
├── components/
│   ├── EventDisplay.vue          # 事件显示组件
│   ├── EventHistory.vue          # 事件历史 ⭐
│   ├── SaveManager.vue           # 存档管理 UI ⭐
│   └── MainDemo.vue              # 主演示页面
├── composables/
│   ├── useGameEngine.ts          # 旧版游戏引擎
│   └── useNewGameEngine.ts       # 新版游戏引擎 ⭐
├── data/
│   ├── childhoodEvents.ts        # 童年事件（7 个）
│   ├── youthEvents.ts            # 青年事件（8 个）
│   ├── adultEvents.ts            # 成年事件（10 个）
│   └── elderlyEvents.ts          # 中老年事件（10 个）
└── types/
    └── eventTypes.ts             # 类型定义
```

### 数据流

```
游戏开始
  ↓
EventLoader 加载事件
  ↓
GameEngineIntegration 选择事件（加权随机）
  ↓
EventExecutor 执行效果
  ↓
UI 组件显示（EventDisplay）
  ↓
SaveManager 保存进度
  ↓
PerformanceMonitor 监控性能
```

---

## 🧪 测试运行

### 完整测试套件

```bash
# 运行所有测试
echo "=== 核心功能测试 ===" && npx tsx tests/AllTests.ts
echo "=== 集成测试 ===" && npx tsx tests/IntegrationTests.ts
echo "=== Phase 2 功能测试 ===" && npx tsx tests/testPhase2Features.ts
echo "=== Phase 2.3 性能测试 ===" && npx tsx tests/testPerformanceOptimization.ts
```

### 测试覆盖率

| 测试类型 | 测试用例 | 通过率 |
|---------|---------|--------|
| 核心功能 | 16 个 | 100% ✅ |
| 集成测试 | 17 个 | 100% ✅ |
| Phase 2 功能 | 12 个 | 100% ✅ |
| Phase 2.3 性能 | 12 个 | 100% ✅ |
| **总计** | **57 个** | **100% ✅** |

---

## 📊 性能指标

### 当前性能

| 指标 | 数值 | 要求 | 评级 |
|------|------|------|------|
| 事件执行时间 | 0.023ms | < 5ms | ⭐⭐⭐⭐⭐ |
| 条件评估时间 | 0.037ms | < 2ms | ⭐⭐⭐⭐⭐ |
| 组件渲染时间 | 0.019ms | < 100ms | ⭐⭐⭐⭐⭐ |
| 内存使用 | 7.71MB | < 50MB | ⭐⭐⭐⭐⭐ |

### 性能对比

| 阶段 | 事件执行 | 条件评估 | 内存使用 |
|------|---------|---------|---------|
| Phase 1 | 0.025ms | 0.040ms | 8.09MB |
| Phase 2 | 0.023ms | 0.037ms | 7.71MB |
| **提升** | **8%** | **7.5%** | **4.7%** |

---

## 📁 关键文件说明

### 演示文件

- **`src/components/MainDemo.vue`**: 完整演示页面，整合所有功能
- **`tests/testGameEngineIntegration.ts`**: 游戏引擎集成测试
- **`tests/testPhase2Features.ts`**: Phase 2 功能测试

### 核心文件

- **`src/core/GameEngineIntegration.ts`**: 游戏引擎核心逻辑
- **`src/core/SaveManager.ts`**: 存档管理系统
- **`src/core/PerformanceMonitor.ts`**: 性能监控工具
- **`src/core/EventPreloader.ts`**: 事件预加载器

### 文档文件

- **`PHASE_1_COMPLETION_REPORT.md`**: Phase 1 完成报告
- **`PHASE_2_COMPLETION_REPORT.md`**: Phase 2 完成报告
- **`EVENT_DEVELOPMENT_SUMMARY.md`**: 事件开发总结
- **`README_PREVIEW.md`**: 本文档

---

## 🎯 快速体验路径

### 路径 1: 查看测试输出（最快）

```bash
cd /Users/zhouyun/code/wuxia-life
npx tsx tests/testGameEngineIntegration.ts 2>&1 | head -50
```

**预期**: 看到完整的游戏流程模拟输出

### 路径 2: 运行功能测试

```bash
npx tsx tests/testPhase2Features.ts
```

**预期**: 看到存档管理功能的完整测试

### 路径 3: 查看性能优化效果

```bash
npx tsx tests/testPerformanceOptimization.ts
```

**预期**: 看到性能监控报告和预加载统计

### 路径 4: 启动完整演示（需要 Vue 环境）

```bash
npm install
npm run dev
```

然后访问演示页面。

---

## 🎊 项目进度

### 已完成

- ✅ **Phase 1**: 核心主线事件开发（35 个事件）
- ✅ **Phase 2.1**: UI/UX 优化（事件历史组件）
- ✅ **Phase 2.2**: 功能增强（存档管理系统）
- ✅ **Phase 2.3**: 性能优化（性能监控 + 预加载）

### 下一步

- ⏳ **Phase 3**: 前后端分离架构（RESTful API + WebSocket）

---

## 📞 技术支持

如有问题，请查看：
1. 各测试脚本的输出
2. 控制台日志
3. 相关文档报告

**祝预览愉快！** 🎮
