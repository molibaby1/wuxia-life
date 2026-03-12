/**
 * 事件触发率测试脚本
 * 运行多次模拟，统计四个关键事件的触发率
 */

import { LifeSimulator } from './simulator';
import { writeFileSync } from 'fs';
import { join } from 'path';

interface EventStats {
  bullyCount: number;
  enemyCount: number;
  loveCount: number;
  tournamentCount: number;
  totalRuns: number;
}

async function runTest(): Promise<EventStats> {
  const stats: EventStats = {
    bullyCount: 0,
    enemyCount: 0,
    loveCount: 0,
    tournamentCount: 0,
    totalRuns: 0,
  };
  
  const totalRuns = 20;  // 运行 20 次
  console.log(`🔍 开始事件触发率测试，共运行 ${totalRuns} 次模拟...\n`);
  
  for (let i = 0; i < totalRuns; i++) {
    const simulator = new LifeSimulator({
      simulationYears: 40,
      randomnessWeight: 0.5,
      logLevel: 'minimal',
      enableAiEvaluation: false,
      verboseOutput: false,
      startAge: 12,
      endAge: 80,
    });
    
    const report = await simulator.run();
    stats.totalRuns++;
    
    // 检查事件记录
    let hasBully = false;
    let hasEnemy = false;
    let hasLove = false;
    let hasTournament = false;
    
    for (const record of report.choiceRecords) {
      if (record.nodeId.includes('bully')) hasBully = true;
      if (record.nodeId.includes('enemy')) hasEnemy = true;
      if (record.nodeId.includes('love')) hasLove = true;
      if (record.nodeId.includes('tournament')) hasTournament = true;
    }
    
    if (hasBully) stats.bullyCount++;
    if (hasEnemy) stats.enemyCount++;
    if (hasLove) stats.loveCount++;
    if (hasTournament) stats.tournamentCount++;
    
    const runNum = i + 1;
    const markers = [
      hasBully ? '✅恶棍' : '❌恶棍',
      hasEnemy ? '✅仇家' : '❌仇家',
      hasLove ? '✅意中人' : '❌意中人',
      hasTournament ? '✅比武' : '❌比武',
    ];
    
    console.log(`第${runNum}次：${markers.join(' ')}`);
  }
  
  // 统计结果
  console.log('\n' + '='.repeat(60));
  console.log('📊 事件触发率统计结果');
  console.log('='.repeat(60));
  
  const calcRate = (count: number) => ((count / stats.totalRuns) * 100).toFixed(1) + '%';
  
  console.log(`\n总测试次数：${stats.totalRuns}`);
  console.log(`\n1. 恶棍欺人事件：${stats.bullyCount}/${stats.totalRuns} = ${calcRate(stats.bullyCount)}`);
  console.log(`2. 仇家寻仇事件：${stats.enemyCount}/${stats.totalRuns} = ${calcRate(stats.enemyCount)}`);
  console.log(`3. 意中人事件：${stats.loveCount}/${stats.totalRuns} = ${calcRate(stats.loveCount)}`);
  console.log(`4. 比武大会事件：${stats.tournamentCount}/${stats.totalRuns} = ${calcRate(stats.tournamentCount)}`);
  
  console.log('\n' + '='.repeat(60));
  
  // 评估结果
  const allRates = [
    stats.bullyCount / stats.totalRuns,
    stats.enemyCount / stats.totalRuns,
    stats.loveCount / stats.totalRuns,
    stats.tournamentCount / stats.totalRuns,
  ];
  
  const avgRate = (allRates.reduce((a, b) => a + b, 0) / allRates.length * 100).toFixed(1);
  console.log(`平均触发率：${avgRate}%`);
  
  if (parseFloat(avgRate) >= 40) {
    console.log('✅ 测试结果：优秀（平均触发率≥40%）');
  } else if (parseFloat(avgRate) >= 30) {
    console.log('✅ 测试结果：良好（平均触发率≥30%）');
  } else if (parseFloat(avgRate) >= 20) {
    console.log('⚠️  测试结果：一般（平均触发率≥20%）');
  } else {
    console.log('❌ 测试结果：需改进（平均触发率<20%）');
  }
  
  // 导出结果
  const result = {
    timestamp: new Date().toISOString(),
    totalRuns: stats.totalRuns,
    events: {
      bully: { count: stats.bullyCount, rate: calcRate(stats.bullyCount) },
      enemy: { count: stats.enemyCount, rate: calcRate(stats.enemyCount) },
      love: { count: stats.loveCount, rate: calcRate(stats.loveCount) },
      tournament: { count: stats.tournamentCount, rate: calcRate(stats.tournamentCount) },
    },
    averageRate: avgRate + '%',
  };
  
  const outputPath = join(process.cwd(), 'event-trigger-stats.json');
  writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`\n📄 详细结果已导出：${outputPath}`);
  
  return stats;
}

// 运行测试
runTest().catch(console.error);
