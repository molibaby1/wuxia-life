/**
 * 测试类型导出是否正确
 */

// 测试从不同类型路径导入
import type { TalentDefinition } from '../src/types/eventTypes';
import type { TalentDefinition as TalentDefinition2 } from '../src/types';
import {
  LIFE_ROAD_IDS,
  LIFE_ROAD_LABELS,
  LIFE_ROAD_STAGES,
  NON_ROAD_STATE_KEYS,
  PUBLIC_ATTRIBUTE_LABELS,
  formatLifeRoadLabel,
  isLifeRoadId,
  isLifeRoadStage,
} from '../src/types';

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

console.log('\n四道路规范：');
console.log('  - 道路 ID:', LIFE_ROAD_IDS.join(', '));
console.log('  - 道路标签:', LIFE_ROAD_IDS.map((id) => LIFE_ROAD_LABELS[id]).join(', '));
console.log('  - 道路阶段:', LIFE_ROAD_STAGES.join(', '));
console.log('  - 公共属性:', Object.values(PUBLIC_ATTRIBUTE_LABELS).join(', '));
console.log('  - 非道路字段:', NON_ROAD_STATE_KEYS.join(', '));

if (
  LIFE_ROAD_IDS.length !== 4
  || formatLifeRoadLabel('martial') !== '武道'
  || formatLifeRoadLabel('statecraft') !== '经世'
  || !isLifeRoadId('official')
  || isLifeRoadId('merchant')
  || !isLifeRoadStage('locked_in')
  || isLifeRoadStage('turned')
) {
  throw new Error('四道路规范导出校验失败');
}

console.log('✓ 四道路规范导出校验通过');

console.log('\n=== 所有测试通过 ===');
