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
console.log(`总记录数：${data.records.length}\n`);

// 检查前言事件
console.log('=== 前言事件检查 (0-10 岁) ===\n');
const prologueEvents = data.records.filter(r => r.age <= 10 && r.event?.id?.startsWith('prologue_'));

if (prologueEvents.length > 0) {
  console.log(`✅ 检测到 ${prologueEvents.length} 个前言事件\n`);
  prologueEvents.forEach(record => {
    console.log(`${record.age}岁：${record.event.name} (${record.event.id})`);
    if (record.selectedChoice) {
      console.log(`  选择：${record.selectedChoice.text}`);
    }
    console.log('');
  });
} else {
  console.log('❌ 未检测到前言事件！\n');
  console.log('检查 0-10 岁的事件:');
  data.records.filter(r => r.age <= 10).forEach(record => {
    console.log(`${record.age}岁：${record.event?.name || '无事件'} (${record.event?.id || '无'})`);
  });
}

// 检查事件流程的合理性
console.log('\n=== 事件流程合理性检查 ===\n');

// 1. 检查年龄递进
const ages = data.records.map(r => r.age).filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);
console.log(`年龄覆盖：${ages[0]}岁 - ${ages[ages.length - 1]}岁`);

// 2. 检查事件类型分布
const eventTypes = {};
data.records.forEach(record => {
  const type = record.event?.type || 'unknown';
  eventTypes[type] = (eventTypes[type] || 0) + 1;
});

console.log('\n事件类型分布:');
Object.entries(eventTypes).forEach(([type, count]) => {
  console.log(`  ${type}: ${count} 个`);
});

// 3. 检查关键事件
console.log('\n=== 关键事件检查 ===\n');
const keyEvents = [
  'prologue_divine_birth',
  'prologue_family_trial', 
  'prologue_strict_master',
  'prologue_peer_competition',
  'prologue_youth_oath',
  'hero_first_case',
  'career_good_evil_war',
  'elderly_final_ending'
];

keyEvents.forEach(eventId => {
  const found = data.records.find(r => r.event?.id === eventId);
  if (found) {
    console.log(`✅ ${eventId} - ${found.age}岁触发`);
  } else {
    console.log(`❌ ${eventId} - 未触发`);
  }
});

// 4. 检查结局
console.log('\n=== 结局检查 ===\n');
const lastRecord = data.records[data.records.length - 1];
console.log(`最终年龄：${lastRecord.age}岁`);
console.log(`最终身份：${lastRecord.gameState?.identity || '无'}`);
console.log(`结局：${lastRecord.gameState?.ending?.name || '无'} (${lastRecord.gameState?.ending?.id || '无'})`);

// 5. 合理性评估
console.log('\n=== 合理性评估 ===\n');
let issues = [];

// 检查是否有前言事件
if (prologueEvents.length === 0) {
  issues.push('缺少前言事件链');
}

// 检查是否有身份变更
const identityChange = data.records.find(r => r.gameState?.identity && r.age > 0);
if (!identityChange) {
  issues.push('未检测到身份变更');
}

// 检查是否有结局
if (!lastRecord.gameState?.ending) {
  issues.push('未触发结局');
}

if (issues.length > 0) {
  console.log('⚠️  发现问题:');
  issues.forEach(issue => console.log(`  - ${issue}`));
} else {
  console.log('✅ 事件流程合理，无明显问题！');
}
