const fs = require('fs');
const files = fs.readdirSync('public/reports/').filter(f => f.startsWith('game-process-'));
const latest = files.sort().reverse()[0];
const data = JSON.parse(fs.readFileSync('public/reports/' + latest, 'utf-8'));

console.log('=== 10 岁强身健体事件详情 ===\n');
const r = data.records.find(rec => rec.age === 10 && rec.eventTitle === '强身健体');
if (r) {
  console.log('Event:', r.eventTitle);
  console.log('Type:', r.eventType);
  console.log('Choices:', r.availableChoices ? r.availableChoices.length : 0);
  console.log('Selected:', r.selectedChoice ? r.selectedChoice.text : 'none');
  console.log('Flags (global):', Object.keys(r.gameState.flags || {}).filter(f => f.includes('tutorial')).length);
  console.log('Player flags:', Object.keys(r.gameState.player.flags || {}).filter(f => f.includes('tutorial')).length);
  if (r.gameState.player.flags && Object.keys(r.gameState.player.flags).filter(f => f.includes('tutorial')).length > 0) {
    console.log('Player flag names:', Object.keys(r.gameState.player.flags).filter(f => f.includes('tutorial')).join(', '));
  }
} else {
  console.log('Event not found');
}

console.log('\n=== 10-11 岁所有事件 ===\n');
data.records.filter(rec => rec.age >= 10 && rec.age <= 11).forEach(r => {
  const playerFlags = Object.keys(r.gameState.player.flags || {}).filter(f => f.includes('tutorial'));
  console.log(`${r.age}岁：${r.eventTitle} (player flags: ${playerFlags.length})`);
});
