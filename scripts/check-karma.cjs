const fs = require('fs');
const files = fs.readdirSync('public/reports/').filter(f => f.startsWith('game-process-'));
const latest = files.sort().reverse()[0];
const data = JSON.parse(fs.readFileSync('public/reports/' + latest, 'utf-8'));
const last = data.records[data.records.length - 1];

console.log('Has karma:', !!last.gameState.karma);
if (last.gameState.karma) {
  console.log('Karma:', JSON.stringify(last.gameState.karma, null, 2));
} else {
  console.log('Karma is undefined');
}

// 检查所有记录中的 karma 变化
console.log('\n=== Karma 变化历史 ===');
data.records.forEach((r, i) => {
  if (r.gameState.karma && (r.gameState.karma.good_karma > 0 || r.gameState.karma.evil_karma > 0)) {
    console.log(`记录 ${i} (${r.age}岁): 善行=${r.gameState.karma.good_karma}, 恶行=${r.gameState.karma.evil_karma}`);
  }
});
