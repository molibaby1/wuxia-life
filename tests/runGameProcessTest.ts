#!/usr/bin/env tsx
/**
 * 游戏过程模拟测试执行脚本
 * 
 * 完全模拟真实用户的游戏体验流程：
 * 1. 创建角色
 * 2. 选择事件选项
 * 3. 推进时间
 * 4. 使用存档功能
 * 5. 查看历史记录
 * 6. 完整人生模拟（0 岁 → 死亡）
 * 
 * 使用方法：
 * npx tsx tests/runGameProcessTest.ts
 */

import { GameProcessSimulator } from './GameProcessSimulator';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REPORTS_DIR = path.join(__dirname, '..', 'scripts', 'life-simulator', 'reports');

/**
 * 运行游戏过程模拟测试
 */
async function runGameProcessTest() {
  console.log('🎮 开始游戏过程模拟测试...\n');
  console.log('📝 模拟真实玩家游戏体验流程\n');

  // 创建模拟器
  const simulator = new GameProcessSimulator({
    playerName: '模拟玩家',
    gender: 'male',
    simulateYears: 80,  // 模拟 80 年
    enableAutoSave: true,
    enableManualSave: false,
    saveInterval: 5,  // 每 5 年自动保存
    verbose: true
  });

  // 运行模拟
  const report = await simulator.simulate();

  // 复制到 life-simulator 报告目录
  copyReportToSimulator(report.id);

  // 打印总结
  console.log('\n' + '='.repeat(80));
  console.log('📊 游戏过程模拟测试总结');
  console.log('='.repeat(80));
  console.log(`测试时间：${new Date(report.timestamp).toLocaleString('zh-CN')}`);
  console.log(`玩家：${report.config.playerName}`);
  console.log(`总年数：${report.totalYears}年`);
  console.log(`最终年龄：${report.finalAge}岁`);
  console.log(`生存状态：${report.isAlive ? '✅ 在世' : '💀 已故'}`);
  if (report.deathReason) {
    console.log(`死亡原因：${report.deathReason}`);
  }
  console.log(`触发事件：${report.totalEvents}个`);
  console.log(`做出选择：${report.totalChoices}次`);
  console.log(`存档次数：${report.totalSaves}次`);
  console.log('='.repeat(80));
  console.log(`📄 报告已生成:`);
  console.log(`   HTML: tests/reports/game-process-${report.id}.html`);
  console.log(`   JSON: tests/reports/game-process-${report.id}.json`);
  console.log('='.repeat(80));
  console.log('✅ 游戏过程模拟测试完成！\n');
}

/**
 * 复制报告到 life-simulator 目录（以便在 index-full.html 中查看）
 */
function copyReportToSimulator(reportId: string) {
  const srcJson = path.join(process.cwd(), 'tests/reports', `game-process-${reportId}.json`);
  const srcHtml = path.join(process.cwd(), 'tests/reports', `game-process-${reportId}.html`);
  
  const destJson = path.join(REPORTS_DIR, `game-process-${reportId}.json`);
  const destHtml = path.join(REPORTS_DIR, `game-process-${reportId}.html`);

  // 确保目标目录存在
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }

  // 复制文件
  if (fs.existsSync(srcJson)) {
    fs.copyFileSync(srcJson, destJson);
    console.log(`📄 已复制 JSON 报告到：${destHtml}`);
  }
  if (fs.existsSync(srcHtml)) {
    fs.copyFileSync(srcHtml, destHtml);
    console.log(`📄 已复制 HTML 报告到：${destHtml}`);
  }

  // 更新 manifest
  updateManifest(reportId);
  
  // 自动更新 index-full.html
  updateIndexFullHtml();
}

/**
 * 更新 index-full.html
 */
function updateIndexFullHtml() {
  try {
    console.log(`\n🔄 正在更新 index-full.html...`);
    const generateScript = path.join(__dirname, '..', 'scripts', 'life-simulator', 'generate-manifest.ts');
    execSync(`npx tsx ${generateScript}`, {
      cwd: process.cwd(),
      stdio: 'inherit'
    });
    console.log(`✅ index-full.html 已更新\n`);
  } catch (error) {
    console.error(`⚠️  更新 index-full.html 失败:`, error);
  }
}

/**
 * 更新 manifest.json
 */
function updateManifest(reportId: string) {
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
      manifest.totalReports = (manifest.totalReports || 0) + 1;
    } catch (e) {
      // 使用默认 manifest
    }
  }
  
  // 确保 reports 数组存在
  if (!Array.isArray(manifest.reports)) {
    manifest.reports = [];
  }
  
  // 添加游戏过程测试报告
  manifest.reports.unshift({
    id: reportId,
    fileName: `game-process-${reportId}.json`,
    htmlFileName: `game-process-${reportId}.html`,
    name: `游戏过程模拟 ${new Date().toLocaleDateString('zh-CN')}`,
    generatedAt: new Date().toISOString(),
    type: 'game_process_test',
    statistics: {
      type: '游戏过程模拟',
      description: '完整模拟真实玩家游戏体验'
    }
  });
  
  // 保留最新的 100 个报告
  manifest.reports = manifest.reports.slice(0, 100);
  
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`✅ Manifest 已更新`);
}

// 运行测试
runGameProcessTest().catch(console.error);
