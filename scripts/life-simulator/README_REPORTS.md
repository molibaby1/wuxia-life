# 测试报告中心 - 使用指南

## 📋 概述

已建立完整的测试报告管理系统，包括：

1. **统一存储** - 所有 JSON 报告存储在 `reports/` 目录
2. **单页应用** - `index.html` 提供统一的报告浏览界面
3. **分页导航** - 支持页码切换，高效浏览大量报告
4. **自动更新** - 每次测试后自动生成/更新报告清单

## 🎯 文件结构

```
scripts/life-simulator/
├── index.html                      # 报告中心主页面
├── generate-manifest.ts            # 清单生成脚本
├── simulator.ts                    # 模拟器（已集成自动更新）
├── reports/                        # 报告存储目录
│   ├── manifest.json               # 报告清单（自动生成）
│   ├── life-sim-report-*.json      # JSON 报告
│   └── life-sim-report-*.html      # HTML 报告
└── README_REPORTS.md               # 本文档
```

## 🚀 快速开始

### 1. 运行测试
```bash
cd /Users/zhouyun/code/wuxia-life
npx tsx scripts/life-simulator/simulator.ts --years=60
```

测试完成后会自动：
- ✅ 生成 JSON 报告 → `reports/life-sim-report-{timestamp}.json`
- ✅ 生成 HTML 报告 → `reports/life-sim-report-{timestamp}.html`
- ✅ 更新报告清单 → `reports/manifest.json`

### 2. 查看报告中心
```bash
# 方法 1: 直接打开文件
open scripts/life-simulator/index.html

# 方法 2: 在浏览器中访问
# 复制控制台输出的 file:// 路径
```

### 3. 手动更新清单
```bash
cd scripts/life-simulator
npx tsx generate-manifest.ts
```

## 📖 功能特性

### 报告中心界面

#### 1. 统计信息栏
- **报告总数**：显示找到的测试报告数量
- **分页导航**：上一页/下一页按钮
- **页码指示**：当前页/总页数

#### 2. 报告卡片
每个报告卡片包含：

**基本信息**：
- 报告名称和 ID
- 生成时间

**统计数据**：
- 总选择数（绿色）
- 状态变化次数
- AI 评分（绿色=有评分，黄色=无评分）
- 模拟时长（年）

**详细信息**：
- 起始年龄/结束年龄
- 随机性权重
- 门派信息
- 子女数量

**操作按钮**：
- 📖 查看详细 - 在新窗口打开 HTML 报告
- 💾 下载 JSON - 下载 JSON 原始数据

### 分页系统

- **每页显示**：5 份报告
- **导航方式**：上一页/下一页
- **自动计算**：总页数
- **按钮状态**：首页禁用上一页，末页禁用下一页

### 响应式设计

- ✅ 桌面端：完整布局
- ✅ 平板端：自适应网格
- ✅ 移动端：单列布局

## 📊 使用示例

### 示例 1：查看最新报告
1. 运行一次测试
2. 打开 `index.html`
3. 最新报告会显示在第一页第一个

### 示例 2：比较多次测试
1. 运行多次测试（不同参数）
2. 在报告中心使用分页浏览
3. 对比各次测试的统计数据

### 示例 3：下载特定报告
1. 在报告中心找到目标报告
2. 点击"💾 下载 JSON"
3. 获取原始数据进行深入分析

## 🔧 技术细节

### manifest.json 结构

```json
{
  "version": "1.0",
  "generatedAt": "2026-03-11T12:12:16.408Z",
  "totalReports": 10,
  "reports": [
    {
      "id": "sim_1773202336408",
      "fileName": "life-sim-report-1773202336408.json",
      "name": "测试报告 #1773202336408",
      "generatedAt": "2026-03-11T12:12:16.408Z",
      "config": {
        "startAge": 12,
        "endAge": 80,
        "randomnessWeight": 0.5,
        "simulationYears": 40
      },
      "statistics": {
        "totalChoices": 5,
        "totalStateChanges": 15,
        "lifespan": 80,
        "sect": "少林派",
        "children": 0
      },
      "aiEvaluation": {
        "overallScore": 100.0,
        "coherence": 100.0,
        "feedbackRelevance": 100.0,
        "stateTransitionLogic": 100.0,
        "decisionRationality": 100.0
      }
    }
    // ... 更多报告
  ]
}
```

### 自动更新流程

```
运行测试
  ↓
生成 JSON/HTML 报告
  ↓
保存到 reports/ 目录
  ↓
调用 generate-manifest.ts
  ↓
扫描所有 JSON 文件
  ↓
提取关键信息
  ↓
生成 manifest.json
  ↓
完成
```

## 📝 最佳实践

### 1. 定期清理旧报告
```bash
# 删除超过 30 天的报告
find reports/ -name "*.json" -mtime +30 -delete
find reports/ -name "*.html" -mtime +30 -delete

# 重新生成清单
npx tsx generate-manifest.ts
```

### 2. 批量测试
```bash
# 运行 10 次测试
for i in {1..10}; do
  npx tsx scripts/life-simulator/simulator.ts --years=50 --quiet
done

# 查看报告中心
open scripts/life-simulator/index.html
```

### 3. 参数对比测试
```bash
# 测试不同随机性
npx tsx scripts/life-simulator/simulator.ts --randomness=0.3
npx tsx scripts/life-simulator/simulator.ts --randomness=0.5
npx tsx scripts/life-simulator/simulator.ts --randomness=0.8

# 在报告中心对比结果
```

## 🎨 自定义

### 修改每页显示数量
编辑 `index.html`，找到：
```javascript
const reportsPerPage = 5;
```
修改为想要的数量。

### 修改排序方式
编辑 `generate-manifest.ts`，找到排序逻辑：
```javascript
reports.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
```
可改为按其他字段排序。

### 添加新字段
1. 在 `generate-manifest.ts` 中添加字段提取
2. 在 `index.html` 中添加显示

## ⚠️ 注意事项

1. **不要手动编辑 manifest.json** - 每次运行测试都会自动重新生成
2. **保持文件名格式** - 报告文件名包含时间戳，用于排序
3. **定期备份** - 重要的测试报告建议备份到其他位置
4. **磁盘空间** - 大量报告会占用磁盘空间，定期清理

## 🐛 故障排除

### 问题 1：报告中心显示"暂无报告"
**解决**：
```bash
# 检查 reports 目录是否存在
ls -la reports/

# 手动生成清单
npx tsx generate-manifest.ts
```

### 问题 2：清单生成失败
**解决**：
```bash
# 检查 JSON 文件是否损坏
cat reports/life-sim-report-*.json | head -5

# 删除损坏的文件
rm reports/life-sim-report-损坏的文件.json
```

### 问题 3：分页不工作
**解决**：
- 清除浏览器缓存
- 重新打开 index.html
- 检查浏览器控制台是否有错误

## 📈 未来改进

- [ ] 添加搜索功能
- [ ] 添加筛选功能（按时间、评分等）
- [ ] 添加图表可视化
- [ ] 支持导出 CSV 格式
- [ ] 添加报告对比功能

---

**创建时间**: 2026-03-11  
**版本**: 1.0  
**状态**: ✅ 完全可用
