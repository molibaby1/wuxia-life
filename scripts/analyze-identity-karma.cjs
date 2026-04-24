const fs = require('fs');
const path = require('path');

// 读取最新的 JSON 报告
const reportsDir = path.join(__dirname, '..', 'public', 'reports');
const jsonFiles = fs.readdirSync(reportsDir)
  .filter(f => f.startsWith('game-process-') && f.endsWith('.json'))
  .sort((a, b) => {
    const statA = fs.statSync(path.join(reportsDir, a));
    const statB = fs.statSync(path.join(reportsDir, b));
    return statB.mtime - statA.mtime;
  });

if (jsonFiles.length === 0) {
  console.log('❌ 未找到游戏过程报告');
  process.exit(1);
}

const latestFile = jsonFiles[0];
const filePath = path.join(reportsDir, latestFile);
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log(`📊 检查报告：${latestFile}`);
console.log(`总记录数：${data.records.length}`);

// 追踪身份变更
let previousIdentity = null;
let identityChanges = [];

data.records.forEach((record, index) => {
  const currentIdentity = record.gameState?.identity;
  
  if (currentIdentity && currentIdentity !== previousIdentity) {
    identityChanges.push({
      recordIndex: index,
      age: record.age,
      eventId: record.eventId,
      from: previousIdentity,
      to: currentIdentity,
    });
    previousIdentity = currentIdentity;
  }
});

console.log(`\n=== 身份变更历史 ===`);
if (identityChanges.length > 0) {
  identityChanges.forEach(change => {
    console.log(`${change.age}岁 (记录 #${change.recordIndex}): ${change.eventId} - ${change.from || '无'} → ${change.to}`);
  });
} else {
  console.log('无身份变更');
}

// 检查最终状态
const lastRecord = data.records[data.records.length - 1];
console.log(`\n=== 最终状态 ===`);
console.log(`最终年龄：${lastRecord.age}`);
console.log(`最终身份：${lastRecord.gameState?.identity || '无'}`);
const endingFlags = [
  ...Object.keys(lastRecord.gameState?.player?.flags || {}).filter(f => f.includes('ending')),
  ...Object.keys(lastRecord.gameState?.flags || {}).filter(f => f.includes('ending')),
];
console.log(`最终结局 flags:`, endingFlags);
console.log(`结局信息:`, lastRecord.gameState?.ending);

// 因果统计
console.log(`\n=== 因果统计 ===`);
const karma = lastRecord.gameState?.karma;
if (karma) {
  console.log(`善行：${karma.good_karma || 0}`);
  console.log(`恶行：${karma.evil_karma || 0}`);
  console.log(`因果历史：${karma.history?.length || 0} 条`);
} else {
  console.log('无因果记录');
}

// 关键选择
console.log(`\n=== 关键选择 ===`);
const criticalChoices = lastRecord.gameState?.criticalChoices || {};
Object.entries(criticalChoices).forEach(([key, value]) => {
  console.log(`${key}: ${value}`);
});

if (Object.keys(criticalChoices).length === 0) {
  console.log('无关键选择记录');
}
