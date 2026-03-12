# 解决 CORS 问题 - 使用说明

## 🐛 问题描述

当直接在浏览器中打开 `index.html` 时，会遇到 CORS 错误：

```
Access to fetch at 'file:///.../manifest.json' from origin 'null' has been blocked by CORS policy
```

**原因**：浏览器出于安全考虑，不允许从 `file://` 协议加载本地 JSON 文件。

## ✅ 解决方案

### 方案 1：使用内嵌数据的 HTML 文件（推荐）⭐

运行以下命令生成包含所有数据的 HTML 文件：

```bash
cd /Users/zhouyun/code/wuxia-life/scripts/life-simulator
npx tsx generate-manifest.ts
```

**输出**：
- ✅ `index-full.html` - 包含所有报告数据的完整 HTML
- ✅ `reports/manifest.json` - 独立的 JSON 清单

**使用**：
```bash
# 直接打开，无需 HTTP 服务器
open index-full.html
```

**优点**：
- ✅ 无需启动服务器
- ✅ 直接双击即可打开
- ✅ 所有数据内嵌在 HTML 中
- ✅ 加载速度快

### 方案 2：使用 HTTP 服务器

如果需要使用 `index.html`（动态加载数据），需要启动本地服务器：

```bash
cd /Users/zhouyun/code/wuxia-life

# 方法 1: 使用 http-server
npx http-server .

# 方法 2: 使用 Python
python3 -m http.server 8000

# 方法 3: 使用 Node.js 的 serve
npx serve .
```

然后访问：
```
http://localhost:8080/scripts/life-simulator/index.html
```

## 📋 完整工作流程

### 1. 运行测试
```bash
npx tsx scripts/life-simulator/simulator.ts --years=60
```

测试完成后会自动：
- 生成 JSON 报告 → `reports/life-sim-report-*.json`
- 生成 HTML 报告 → `reports/life-sim-report-*.html`
- 更新清单 → `reports/manifest.json`

### 2. 生成完整 HTML
```bash
cd scripts/life-simulator
npx tsx generate-manifest.ts
```

### 3. 查看报告
```bash
# 打开内嵌数据的 HTML（推荐）
open index-full.html

# 或者使用 HTTP 服务器
npx http-server ../..
# 访问 http://localhost:8080/scripts/life-simulator/index.html
```

## 🎯 文件说明

| 文件 | 说明 | 使用方式 |
|------|------|----------|
| `index.html` | 基础版本（需要 HTTP 服务器） | 需要服务器 |
| `index-full.html` | 完整版本（内嵌数据） | ✅ 直接打开 |
| `reports/manifest.json` | 报告清单数据 | 自动生成 |

## 💡 最佳实践

### 日常使用
```bash
# 1. 运行测试
npm run life-sim

# 2. 生成完整 HTML
cd scripts/life-simulator
npx tsx generate-manifest.ts

# 3. 打开查看
open index-full.html
```

### 批量测试后查看
```bash
# 运行多次测试
for i in {1..10}; do
  npx tsx scripts/life-simulator/simulator.ts --years=50 --quiet
done

# 生成并查看
cd scripts/life-simulator
npx tsx generate-manifest.ts
open index-full.html
```

## 🔧 自动化脚本

可以在 `package.json` 中添加脚本：

```json
{
  "scripts": {
    "life-sim": "tsx scripts/life-simulator/simulator.ts",
    "life-sim-view": "tsx scripts/life-simulator/generate-manifest.ts && open scripts/life-simulator/index-full.html"
  }
}
```

然后运行：
```bash
# 运行测试并查看
npm run life-sim-view -- --years=60
```

## ⚠️ 注意事项

1. **每次运行测试后**：需要重新运行 `generate-manifest.ts` 来更新数据
2. **文件大小**：`index-full.html` 会随着报告数量增加而变大
3. **浏览器缓存**：如果数据不更新，尝试清除浏览器缓存

## 🎉 总结

**最简单的方法**：
```bash
# 运行测试
npx tsx scripts/life-simulator/simulator.ts --years=60

# 生成并查看
cd scripts/life-simulator
npx tsx generate-manifest.ts
open index-full.html
```

这样就解决了 CORS 问题，无需任何服务器配置！

---

**更新时间**: 2026-03-11  
**状态**: ✅ 已解决
