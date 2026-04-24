const fs = require('fs');
const files = fs.readdirSync('public/reports/').filter(f => f.startsWith('game-process-'));
const latest = files.sort().reverse()[0];
const data = JSON.parse(fs.readFileSync('public/reports/' + latest, 'utf-8'));

console.log('=== 10-18 岁事件检查 ===\n');
data.records.filter(r => r.age >= 10 && r.age <= 18).forEach(r => {
  const tutorialFlags = Object.keys(r.gameState.flags).filter(f => f.includes('tutorial'));
  console.log(`${r.age}岁：${r.eventTitle}`);
  console.log(`  事件类型：${r.eventType}`);
  console.log(`  Tutorial Flags: ${tutorialFlags.length} 个`);
  if (tutorialFlags.length > 0) {
    console.log(`  Flags: ${tutorialFlags.join(', ')}`);
  }
  console.log('');
});
