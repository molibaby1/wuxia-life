#!/usr/bin/env tsx
/**
 * 统一测试执行脚本
 * 
 * 功能：
 * 1. 自动运行所有测试套件
 * 2. 生成 HTML 测试报告
 * 3. 生成 JSON 数据报告
 * 4. 在 life-simulator/index-full.html 中查看
 * 
 * 使用方法：
 * npx tsx scripts/run-all-tests.ts
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 测试报告输出目录
const REPORTS_DIR = path.join(__dirname, 'life-simulator/reports');

// 确保报告目录存在
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

interface TestResult {
  name: string;
  suite: string;
  passed: boolean;
  duration: number;
  output: string;
  timestamp: string;
}

interface TestReport {
  id: string;
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  passRate: number;
  totalDuration: number;
  suites: TestSuiteResult[];
  results: TestResult[];
}

interface TestSuiteResult {
  name: string;
  tests: number;
  passed: number;
  failed: number;
  duration: number;
}

// 测试套件配置
const TEST_SUITES = [
  {
    name: '游戏过程模拟测试',
    file: 'tests/runGameProcessTest.ts',
    description: '完整模拟真实玩家游戏体验流程（0 岁→死亡）'
  },
  {
    name: 'Phase 2 功能测试',
    file: 'tests/testPhase2Features.ts',
    description: '存档管理器、事件历史、自动保存/加载'
  },
  {
    name: 'Phase 2.3 性能优化测试',
    file: 'tests/testPerformanceOptimization.ts',
    description: '性能监控、事件预加载、内存管理'
  },
  {
    name: '游戏整体测试',
    file: 'tests/AllTests.ts',
    description: '核心功能、用户交互、性能、兼容性'
  },
  {
    name: '游戏引擎集成测试',
    file: 'tests/testGameEngineIntegration.ts',
    description: '完整生命周期模拟（童年→老年）'
  },
  {
    name: '前端集成测试',
    file: 'tests/testFrontendIntegration.ts',
    description: '前端组件与后端逻辑集成'
  }
];

/**
 * 运行单个测试套件
 */
function runTestSuite(suiteFile: string): { output: string; duration: number; success: boolean } {
  const startTime = Date.now();
  
  try {
    const output = execSync(`npx tsx ${suiteFile}`, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    const duration = Date.now() - startTime;
    return { output, duration, success: true };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    return { 
      output: error.stdout?.toString() || error.message, 
      duration, 
      success: false 
    };
  }
}

/**
 * 解析测试结果
 */
function parseTestOutput(output: string, suiteName: string): TestSuiteResult {
  const lines = output.split('\n');
  let tests = 0;
  let passed = 0;
  let failed = 0;
  
  // 尝试从输出中提取测试统计
  for (const line of lines) {
    // 匹配 "测试 1: xxx" 或 "✅ 测试名称"
    if (line.includes('测试') || line.includes('✅')) {
      tests++;
      if (line.includes('✅')) {
        passed++;
      } else if (line.includes('❌') || line.includes('失败')) {
        failed++;
      }
    }
    
    // 匹配总结行
    const totalMatch = line.match(/(\d+)\/(\d+)\s*通过/);
    if (totalMatch) {
      passed = parseInt(totalMatch[1]);
      tests = parseInt(totalMatch[2]);
      failed = tests - passed;
    }
  }
  
  // 如果没有找到统计，至少记录输出
  if (tests === 0) {
    tests = 1;
    passed = output.includes('✅') || output.includes('通过') ? 1 : 0;
    failed = tests - passed;
  }
  
  return {
    name: suiteName,
    tests,
    passed,
    failed,
    duration: 0 // 会在调用时设置
  };
}

/**
 * 生成 HTML 报告
 */
function generateHTMLReport(report: TestReport): string {
  const reportId = report.id;
  const timestamp = new Date(report.timestamp).toLocaleString('zh-CN');
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>测试报告 - ${timestamp}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    }

    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }

    .header h1 {
      font-size: 32px;
      margin-bottom: 10px;
    }

    .header p {
      opacity: 0.9;
      font-size: 14px;
    }

    .summary-bar {
      display: flex;
      justify-content: space-around;
      padding: 30px 40px;
      background: #f8f9fa;
      border-bottom: 2px solid #e9ecef;
    }

    .summary-stat {
      text-align: center;
    }

    .summary-stat .value {
      font-size: 36px;
      font-weight: bold;
      color: #667eea;
    }

    .summary-stat .label {
      font-size: 14px;
      color: #6c757d;
      margin-top: 5px;
    }

    .summary-stat.passed .value { color: #28a745; }
    .summary-stat.failed .value { color: #dc3545; }

    .content {
      padding: 40px;
    }

    .suite-section {
      margin-bottom: 40px;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      overflow: hidden;
    }

    .suite-header {
      background: #f8f9fa;
      padding: 15px 20px;
      border-bottom: 1px solid #e9ecef;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .suite-title {
      font-size: 18px;
      font-weight: bold;
      color: #333;
    }

    .suite-stats {
      display: flex;
      gap: 15px;
      font-size: 14px;
    }

    .suite-stats span {
      padding: 4px 12px;
      border-radius: 4px;
      background: white;
    }

    .suite-stats .passed { color: #28a745; background: #d4edda; }
    .suite-stats .failed { color: #dc3545; background: #f8d7da; }

    .suite-body {
      padding: 20px;
    }

    .test-output {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      white-space: pre-wrap;
      max-height: 400px;
      overflow-y: auto;
    }

    .footer {
      padding: 20px 40px;
      background: #f8f9fa;
      text-align: center;
      font-size: 14px;
      color: #6c757d;
      border-top: 1px solid #e9ecef;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
    }

    .status-badge.success {
      background: #28a745;
      color: white;
    }

    .status-badge.error {
      background: #dc3545;
      color: white;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎮 玩家生命周期模拟 - 测试报告</h1>
      <p>Phase 2 完整测试套件执行结果</p>
      <p style="margin-top: 10px; font-size: 12px;">${timestamp}</p>
    </div>

    <div class="summary-bar">
      <div class="summary-stat">
        <div class="value">${report.totalTests}</div>
        <div class="label">总测试数</div>
      </div>
      <div class="summary-stat passed">
        <div class="value">${report.passed}</div>
        <div class="label">通过</div>
      </div>
      <div class="summary-stat failed">
        <div class="value">${report.failed}</div>
        <div class="label">失败</div>
      </div>
      <div class="summary-stat">
        <div class="value">${report.passRate.toFixed(2)}%</div>
        <div class="label">通过率</div>
      </div>
      <div class="summary-stat">
        <div class="value">${(report.totalDuration / 1000).toFixed(2)}s</div>
        <div class="label">总耗时</div>
      </div>
    </div>

    <div class="content">
      ${report.suites.map((suite, index) => `
      <div class="suite-section">
        <div class="suite-header">
          <div class="suite-title">${index + 1}. ${suite.name}</div>
          <div class="suite-stats">
            <span class="passed">✅ ${suite.passed}/${suite.tests}</span>
            ${suite.failed > 0 ? `<span class="failed">❌ ${suite.failed} 失败</span>` : ''}
            <span>⏱️ ${(suite.duration / 1000).toFixed(2)}s</span>
          </div>
        </div>
        <div class="suite-body">
          <div class="test-output">${escapeHtml(suite.name)}</div>
        </div>
      </div>
      `).join('')}

      <div class="suite-section">
        <div class="suite-header">
          <div class="suite-title">📋 详细输出日志</div>
        </div>
        <div class="suite-body">
          <div class="test-output">${escapeHtml(report.results.map(r => r.output).join('\n\n'))}</div>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>报告 ID: ${reportId} | 生成时间：${timestamp}</p>
      <p style="margin-top: 10px;">
        <span class="status-badge ${report.failed === 0 ? 'success' : 'error'}">
          ${report.failed === 0 ? '✅ 所有测试通过' : '❌ 存在失败测试'}
        </span>
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * 转义 HTML 特殊字符
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * 生成报告 ID
 */
function generateReportId(): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  return `report_${timestamp}_${random}`;
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始运行完整测试套件...\n');
  
  const report: TestReport = {
    id: generateReportId(),
    timestamp: new Date().toISOString(),
    totalTests: 0,
    passed: 0,
    failed: 0,
    passRate: 0,
    totalDuration: 0,
    suites: [],
    results: []
  };

  // 运行每个测试套件
  for (const suite of TEST_SUITES) {
    console.log(`📋 运行测试套件：${suite.name}`);
    console.log(`   文件：${suite.file}`);
    console.log(`   描述：${suite.description}`);
    
    const result = runTestSuite(suite.file);
    
    const suiteResult = parseTestOutput(result.output, suite.name);
    suiteResult.duration = result.duration;
    
    report.suites.push(suiteResult);
    report.totalTests += suiteResult.tests;
    report.passed += suiteResult.passed;
    report.failed += suiteResult.failed;
    report.totalDuration += suiteResult.duration;
    
    report.results.push({
      name: suite.name,
      suite: suite.name,
      passed: suiteResult.passed === suiteResult.tests,
      duration: suiteResult.duration,
      output: result.output,
      timestamp: new Date().toISOString()
    });
    
    console.log(`   结果：${suiteResult.passed}/${suiteResult.tests} 通过`);
    console.log(`   耗时：${(suiteResult.duration / 1000).toFixed(2)}s\n`);
  }

  // 计算通过率
  report.passRate = report.totalTests > 0 
    ? (report.passed / report.totalTests) * 100 
    : 0;

  // 生成 HTML 报告
  const htmlContent = generateHTMLReport(report);
  const htmlFileName = `life-sim-report-${Date.now()}.html`;
  const htmlFilePath = path.join(REPORTS_DIR, htmlFileName);
  fs.writeFileSync(htmlFilePath, htmlContent, 'utf-8');
  
  console.log(`✅ HTML 报告已生成：${htmlFilePath}`);

  // 生成 JSON 报告
  const jsonFilePath = path.join(REPORTS_DIR, htmlFileName.replace('.html', '.json'));
  fs.writeFileSync(jsonFilePath, JSON.stringify(report, null, 2), 'utf-8');
  
  console.log(`✅ JSON 报告已生成：${jsonFilePath}`);

  // 更新 manifest.json
  updateManifest(htmlFileName, report);

  // 打印总结
  console.log('\n' + '='.repeat(80));
  console.log('📊 测试总结报告');
  console.log('='.repeat(80));
  console.log(`测试时间：${new Date(report.timestamp).toLocaleString('zh-CN')}`);
  console.log(`测试套件：${report.suites.length} 个`);
  console.log(`总测试数：${report.totalTests} 个`);
  console.log(`通过：${report.passed} ✅`);
  console.log(`失败：${report.failed} ${report.failed > 0 ? '❌' : ''}`);
  console.log(`通过率：${report.passRate.toFixed(2)}%`);
  console.log(`总耗时：${(report.totalDuration / 1000).toFixed(2)}s`);
  console.log('='.repeat(80));
  
  if (report.failed === 0) {
    console.log('🎉 所有测试通过！可以继续开发。');
  } else {
    console.log('⚠️  存在失败测试，请检查测试报告。');
  }
  console.log('='.repeat(80));
  
  console.log(`\n📄 查看报告:`);
  console.log(`   1. 打开文件：${htmlFilePath}`);
  console.log(`   2. 访问：http://localhost:5174/scripts/life-simulator/index-full.html`);
  console.log(`   3. 报告 ID: ${report.id}`);
}

/**
 * 更新 manifest.json
 */
function updateManifest(reportFileName: string, report: TestReport) {
  const manifestPath = path.join(REPORTS_DIR, 'manifest.json');
  let manifest: any = {
    version: "1.0",
    generatedAt: new Date().toISOString(),
    totalReports: 1,
    reports: []
  };
  
  if (fs.existsSync(manifestPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      manifest = existing;
      // 增加报告计数
      manifest.totalReports = (manifest.totalReports || 0) + 1;
    } catch (e) {
      // 使用默认 manifest
    }
  }
  
  // 确保 reports 数组存在
  if (!Array.isArray(manifest.reports)) {
    manifest.reports = [];
  }
  
  // 添加新报告
  manifest.reports.unshift({
    id: report.id,
    fileName: reportFileName.replace('.html', '.json'),
    htmlFileName: reportFileName,
    name: `Phase 2 测试报告 ${new Date(report.timestamp).toLocaleDateString('zh-CN')}`,
    generatedAt: report.timestamp,
    type: 'phase2_test',
    statistics: {
      totalTests: report.totalTests,
      passed: report.passed,
      failed: report.failed,
      passRate: report.passRate,
      duration: report.totalDuration,
      suites: report.suites.length
    }
  });
  
  // 保留最新的 100 个报告
  manifest.reports = manifest.reports.slice(0, 100);
  
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`✅ Manifest 已更新`);
}

// 运行主函数
main().catch(console.error);
