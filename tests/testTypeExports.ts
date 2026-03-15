/**
 * 测试类型导出是否正确
 */

// 测试从不同类型路径导入
import type { TalentDefinition } from '../src/types/eventTypes';
import type { TalentDefinition as TalentDefinition2 } from '../src/types';

console.log('=== 类型导入测试 ===\n');

// 创建一个测试天赋对象
const testTalent: TalentDefinition = {
  id: 'test_talent',
  name: '测试天赋',
  description: '这是一个测试天赋',
  type: 'combat',
  rarity: 'common',
  growthBonus: {
    martialPower: 0.1
  }
};

const testTalent2: TalentDefinition2 = {
  id: 'test_talent_2',
  name: '测试天赋 2',
  description: '这是另一个测试天赋',
  type: 'social',
  rarity: 'rare',
  growthBonus: {
    charisma: 0.2
  }
};

console.log('✓ 直接从 eventTypes.ts 导入成功');
console.log('✓ 从 types/index.ts 导入成功');
console.log('✓ TalentDefinition 类型定义正确');
console.log('\n测试天赋对象:');
console.log(JSON.stringify(testTalent, null, 2));
console.log(JSON.stringify(testTalent2, null, 2));

console.log('\n=== 所有测试通过 ===');
