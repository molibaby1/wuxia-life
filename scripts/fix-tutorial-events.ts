/**
 * 修复教程事件格式
 * 1. 将 content.choices 移动到顶层 choices
 * 2. 将 add_stats 转换为 stat_modify
 * 3. 将 set_flag 转换为 flag_set
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const filePath = join(process.cwd(), 'src/data/lines/tutorial.json');
console.log('处理文件：src/data/lines/tutorial.json');

const content = readFileSync(filePath, 'utf-8');
const events = JSON.parse(content);

let modified = false;

events.forEach((event: any) => {
  // 将 content.choices 移动到顶层 choices
  if (event.content?.choices && !event.choices) {
    event.choices = event.content.choices;
    delete event.content.choices;
    modified = true;
    console.log(`  ✓ 事件 ${event.id}: 移动 choices 到顶层`);
  }
  
  // 处理 choices 中的 effects
  if (event.choices) {
    event.choices.forEach((choice: any) => {
      if (choice.effects) {
        const newEffects = [];
        for (const effect of choice.effects) {
          // 转换 add_stats 为 stat_modify
          if (effect.type === 'add_stats' && effect.stats) {
            for (const [stat, value] of Object.entries(effect.stats)) {
              newEffects.push({
                type: 'stat_modify',
                target: stat,
                value: value as number,
                operator: 'add'
              });
            }
            modified = true;
            console.log(`  ✓ 事件 ${event.id}: 转换 add_stats 为 stat_modify`);
          } 
          // 转换 set_flag 为 flag_set
          else if (effect.type === 'set_flag') {
            newEffects.push({
              type: 'flag_set',
              target: effect.flag,
              value: effect.value
            });
            modified = true;
            console.log(`  ✓ 事件 ${event.id}: 转换 set_flag 为 flag_set`);
          }
          // 修复 flag_set 的字段名（flag -> target）
          else if (effect.type === 'flag_set' && effect.flag) {
            newEffects.push({
              type: 'flag_set',
              target: effect.flag,
              value: effect.value
            });
            modified = true;
            console.log(`  ✓ 事件 ${event.id}: 修复 flag_set 字段名`);
          }
          else {
            newEffects.push(effect);
          }
        }
        choice.effects = newEffects;
      }
    });
  }
});

if (modified) {
  const newContent = JSON.stringify(events, null, 2);
  writeFileSync(filePath, newContent, 'utf-8');
  console.log(`  ✓ 文件已更新\n`);
} else {
  console.log(`  - 无需修改\n`);
}

console.log('完成！');
