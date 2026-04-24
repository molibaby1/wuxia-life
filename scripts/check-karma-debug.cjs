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

// 检查 karma 变化
let totalGoodKarma = 0;
let totalEvilKarma = 0;
let karmaChanges = [];

data.records.forEach((record, index) => {
  const karma = record.gameState?.karma;
  if (karma && (karma.good_karma > 0 || karma.evil_karma > 0)) {
    karmaChanges.push({
      recordIndex: index,
      age: record.gameState?.player?.age,
      good_karma: karma.good_karma,
      evil_karma: karma.evil_karma,
      history: karma.history?.length || 0,
    });
    
    totalGoodKarma = Math.max(totalGoodKarma, karma.good_karma);
    totalEvilKarma = Math.max(totalEvilKarma, karma.evil_karma);
  }
});

console.log(`\n=== 因果统计 ===`);
console.log(`最大善行：${totalGoodKarma}`);
console.log(`最大恶行：${totalEvilKarma}`);
console.log(`\n有 karma 值的记录数：${karmaChanges.length}/${data.records.length}`);

if (karmaChanges.length > 0) {
  console.log(`\n前 5 个 karma 变化:`);
  karmaChanges.slice(0, 5).forEach(change => {
    console.log(`  记录 #${change.recordIndex} (${change.age}岁): 善=${change.good_karma}, 恶=${change.evil_karma}, 历史=${change.history}`);
  });
} else {
  console.log(`\n❌ 未检测到任何 karma 值！`);
}

// 检查包含 karma_change 效果的事件
console.log(`\n=== 检查 karma_change 效果 ===`);
let eventsWithKarmaChange = 0;
data.records.forEach((record, index) => {
  if (record.event) {
    const choices = record.event.choices || [];
    choices.forEach(choice => {
      if (choice.effects) {
        choice.effects.forEach(effect => {
          if (effect.karma_change && (effect.karma_change.good > 0 || effect.karma_change.evil > 0)) {
            eventsWithKarmaChange++;
            if (eventsWithKarmaChange <= 3) {
              console.log(`  记录 #${index}: ${record.event?.name} - ${choice.text} (善:${effect.karma_change.good}, 恶:${effect.karma_change.evil})`);
            }
          }
        });
      }
    });
  }
});

console.log(`\n包含 karma_change 的事件选择数：${eventsWithKarmaChange}`);
