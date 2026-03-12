/**
 * 生成测试报告清单
 * 扫描 reports 目录下的所有 JSON 文件，生成 manifest.json
 */

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const reportsDir = join(__dirname, 'reports');
const manifestPath = join(reportsDir, 'manifest.json');
const indexPath = join(__dirname, 'index-full.html');

console.log('📦 正在扫描测试报告...\n');

// 确保 reports 目录存在
if (!existsSync(reportsDir)) {
  console.error('❌ reports 目录不存在！');
  process.exit(1);
}

// 扫描所有 JSON 文件
const files = readdirSync(reportsDir)
  .filter(file => file.endsWith('.json') && file !== 'manifest.json')
  .sort((a, b) => {
    // 按文件名排序（包含时间戳）
    return b.localeCompare(a);
  });

console.log(`找到 ${files.length} 份测试报告\n`);

// 读取每个报告的基本信息
const reports = files.map(fileName => {
  try {
    const filePath = join(reportsDir, fileName);
    const content = readFileSync(filePath, 'utf-8');
    const report = JSON.parse(content);

    // 检测报告类型并提取关键信息
    const isGameProcessReport = fileName.startsWith('game-process-');
    
    if (isGameProcessReport) {
      // 游戏过程测试报告格式
      return {
        id: report.id || fileName,
        fileName,
        name: `游戏过程模拟 ${new Date(report.timestamp).toLocaleDateString('zh-CN')}`,
        type: 'game_process',
        generatedAt: report.timestamp,
        config: {
          startAge: 0,
          endAge: report.finalAge || 80,
          randomnessWeight: 0.5,
          simulationYears: report.totalYears,
        },
        statistics: {
          totalChoices: report.totalChoices,
          totalStateChanges: report.totalEvents,
          lifespan: report.finalAge,
          sect: report.statistics?.sectJoined || '无',
          children: report.statistics?.children || 0,
          deathReason: report.deathReason || '在世',
        },
        aiEvaluation: null,
        duration: report.duration || 0,
      };
    } else {
      // 传统 life-sim 报告格式
      return {
        id: report.reportId || fileName,
        fileName,
        name: `测试报告 #${fileName.replace('life-sim-report-', '').replace('.json', '')}`,
        type: 'life_sim',
        generatedAt: report.generatedAt,
        config: {
          startAge: report.config?.startAge,
          endAge: report.config?.endAge,
          randomnessWeight: report.config?.randomnessWeight,
          simulationYears: report.config?.simulationYears,
        },
        statistics: {
          totalChoices: report.statistics?.totalChoices,
          totalStateChanges: report.statistics?.totalStateChanges,
          lifespan: report.statistics?.lifespan,
          sect: report.statistics?.sect,
          children: report.statistics?.children,
          deathReason: report.statistics?.deathReason,
        },
        aiEvaluation: report.aiEvaluation ? {
          overallScore: report.aiEvaluation.overallScore,
          coherence: report.aiEvaluation.dimensions?.coherence,
          feedbackRelevance: report.aiEvaluation.dimensions?.feedbackRelevance,
          stateTransitionLogic: report.aiEvaluation.dimensions?.stateTransitionLogic,
          decisionRationality: report.aiEvaluation.dimensions?.decisionRationality,
        } : null,
        duration: report.duration,
      };
    }
  } catch (error) {
    console.error(`⚠️  读取 ${fileName} 失败:`, error.message);
    return null;
  }
}).filter(report => report !== null);

// 按生成时间排序（最新的在前）
reports.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());

// 生成清单
const manifest = {
  version: '1.0',
  generatedAt: new Date().toISOString(),
  totalReports: reports.length,
  reports,
};

// 写入 manifest.json
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

console.log('✅ 报告清单生成成功!\n');
console.log(`📄 清单文件：${manifestPath}`);
console.log(`📊 报告总数：${reports.length}`);

if (reports.length > 0) {
  console.log('\n📋 最新报告:');
  reports.slice(0, 3).forEach((report, i) => {
    console.log(`   ${i + 1}. ${report.name}`);
    console.log(`      生成时间：${new Date(report.generatedAt).toLocaleString('zh-CN')}`);
    console.log(`      选择次数：${report.statistics.totalChoices}`);
    console.log(`      AI 评分：${report.aiEvaluation ? report.aiEvaluation.overallScore.toFixed(1) : 'N/A'}`);
  });
}

// 生成包含内嵌数据的 HTML 文件
console.log('\n📄 生成内嵌数据的 HTML 文件...');
const indexFullHtmlPath = join(__dirname, 'index-full.html');

try {
  let indexHtml = readFileSync(indexFullHtmlPath, 'utf-8');
  
  // 在 </head> 之前插入数据脚本
  const dataScript = `  <script>
    // 内嵌的报告数据（由 generate-manifest.ts 自动生成）
    window.REPORTS_DATA = ${JSON.stringify(manifest, null, 2)};
  <\/script>
`;
  
  // 找到 </head> 标签并在此之前插入
  const modifiedHtml = indexHtml.replace('</head>', dataScript + '</head>');
  
  writeFileSync(indexFullHtmlPath, modifiedHtml, 'utf-8');
  console.log('✅ 内嵌数据 HTML 生成成功!\n');
  console.log(`🌐 完整报告中心：${indexFullHtmlPath}`);
  console.log('💡 提示：直接打开此文件即可查看所有报告，无需 HTTP 服务器\n');
} catch (error) {
  console.error('⚠️  生成内嵌 HTML 失败:', error);
}

console.log('🌐 访问 index.html 查看完整报告列表\n');
