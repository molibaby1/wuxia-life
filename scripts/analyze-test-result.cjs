const fs = require('fs');
const files = fs.readdirSync('public/reports/').filter(f => f.startsWith('game-process-'));
const latest = files.sort().reverse()[0];
const data = JSON.parse(fs.readFileSync('public/reports/' + latest, 'utf-8'));

console.log('=== 测试统计 ===');
console.log('总事件数:', data.records.length);
console.log('总选择数:', data.records.filter(r => r.eventType === 'choice').length);
console.log('身份变更次数:', data.records.filter(r => r.log && r.log.includes('身份变更')).length);
console.log('最终年龄:', data.records[data.records.length - 1].age);
console.log('最终身份:', data.records[data.records.length - 1].gameState.identity);
console.log('最终结局 flags:', Object.keys(data.records[data.records.length - 1].gameState.player.flags).filter(f => f.includes('ending')));

console.log('\n=== 身份变更历史 ===');
data.records.filter(r => r.log && r.log.includes('身份变更')).forEach(r => {
  console.log(`${r.age}岁：${r.log.match(/身份变更：(\w+)/)[1]}`);
});

console.log('\n=== 因果统计 ===');
const lastRecord = data.records[data.records.length - 1];
console.log('善行:', lastRecord.gameState.karma?.good_karma || 0);
console.log('恶行:', lastRecord.gameState.karma?.evil_karma || 0);

console.log('\n=== 关键选择 ===');
const choices = lastRecord.gameState.criticalChoices || {};
Object.entries(choices).forEach(([key, value]) => {
  console.log(`${key}: ${value}`);
});
