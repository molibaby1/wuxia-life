/**
 * 身份兼容性系统
 * 
 * 定义不同身份之间的兼容关系，防止逻辑矛盾的身份组合。
 * 
 * @version 2.0.0
 * @since 2026-03-15
 */

import type { PlayerIdentity } from '../types/eventTypes';

/**
 * 身份兼容性数据
 */
export interface IdentityCompatibilityData {
  compatible: PlayerIdentity[];      // 兼容的身份
  neutral: PlayerIdentity[];         // 中性的身份（不加分也不减分）
  incompatible: PlayerIdentity[];    // 不兼容的身份（互斥）
}

/**
 * 身份兼容性矩阵
 */
export const IdentityCompatibility: Record<PlayerIdentity, IdentityCompatibilityData> = {
  // 正道阵营
  hero: {
    compatible: ['scholar', 'hermit', 'sect_leader', 'doctor', 'beggar'],
    neutral: ['merchant', 'official'],
    incompatible: ['demon', 'assassin']
  },
  
  // 魔道阵营
  demon: {
    compatible: ['assassin'],
    neutral: [],
    incompatible: ['hero', 'scholar', 'hermit', 'doctor', 'beggar', 'sect_leader', 'merchant', 'official']
  },
  
  // 中立阵营 - 商人
  merchant: {
    compatible: ['scholar', 'official', 'doctor'],
    neutral: ['hero', 'hermit'],
    incompatible: ['demon', 'assassin', 'beggar']
  },
  
  // 中立阵营 - 学者
  scholar: {
    compatible: ['hero', 'merchant', 'doctor', 'hermit'],
    neutral: ['official'],
    incompatible: ['demon', 'assassin', 'beggar']
  },
  
  // 中立阵营 - 隐士
  hermit: {
    compatible: ['hero', 'scholar', 'doctor', 'beggar'],
    neutral: ['merchant'],
    incompatible: ['demon', 'assassin', 'sect_leader', 'official']
  },
  
  // 正道阵营 - 掌门
  sect_leader: {
    compatible: ['hero', 'scholar'],
    neutral: ['doctor'],
    incompatible: ['demon', 'assassin', 'hermit', 'beggar', 'official']
  },
  
  // 魔道阵营 - 刺客
  assassin: {
    compatible: ['demon'],
    neutral: [],
    incompatible: ['hero', 'scholar', 'doctor', 'beggar', 'sect_leader', 'official']
  },
  
  // 正道阵营 - 医者
  doctor: {
    compatible: ['hero', 'scholar', 'hermit', 'merchant'],
    neutral: ['official'],
    incompatible: ['demon', 'assassin', 'beggar']
  },
  
  // 正道阵营 - 乞丐
  beggar: {
    compatible: ['hero', 'hermit'],
    neutral: ['doctor'],
    incompatible: ['demon', 'assassin', 'merchant', 'sect_leader', 'official']
  },
  
  // 中立阵营 - 官员
  official: {
    compatible: ['merchant', 'scholar'],
    neutral: ['hero'],
    incompatible: ['demon', 'assassin', 'hermit', 'beggar', 'sect_leader']
  },
  
  // 特殊：无身份
  none: {
    compatible: [],
    neutral: ['hero', 'demon', 'merchant', 'scholar', 'hermit', 'sect_leader', 'assassin', 'doctor', 'beggar', 'official'],
    incompatible: []
  }
};

/**
 * 身份阵营归属
 */
export const IdentityFactions: Record<PlayerIdentity, 'orthodox' | 'demon' | 'neutral'> = {
  hero: 'orthodox',
  sect_leader: 'orthodox',
  doctor: 'orthodox',
  beggar: 'orthodox',
  demon: 'demon',
  assassin: 'demon',
  merchant: 'neutral',
  scholar: 'neutral',
  hermit: 'neutral',
  official: 'neutral',
  none: 'neutral'
};

/**
 * 检查两个身份是否兼容
 */
export function areIdentitiesCompatible(id1: PlayerIdentity, id2: PlayerIdentity): boolean {
  const compat = IdentityCompatibility[id1];
  if (!compat) return true;
  
  return compat.compatible.includes(id2) || compat.neutral.includes(id2);
}

/**
 * 获取身份所属阵营
 */
export function getIdentityFaction(identity: PlayerIdentity): 'orthodox' | 'demon' | 'neutral' {
  return IdentityFactions[identity] || 'neutral';
}

/**
 * 检查身份和阵营是否兼容
 */
export function isIdentityFactionCompatible(identity: PlayerIdentity, faction: 'orthodox' | 'demon' | 'neutral'): boolean {
  const identityFaction = getIdentityFaction(identity);
  
  if (faction === 'neutral') return true;
  return identityFaction === faction;
}

/**
 * 检查身份数组是否包含当前身份
 */
export function identityMatches(identity: PlayerIdentity, required: string | string[]): boolean {
  if (Array.isArray(required)) {
    return required.includes(identity);
  }
  return identity === required;
}

/**
 * 获取身份转换的后果
 */
export function getIdentityTransitionEffects(
  fromIdentity: PlayerIdentity,
  toIdentity: PlayerIdentity
): {
  allowed: boolean;
  reason?: string;
  consequences: string[];
} {
  const compat = IdentityCompatibility[fromIdentity];
  const consequences: string[] = [];
  
  // 检查是否兼容
  if (compat.incompatible.includes(toIdentity)) {
    return {
      allowed: false,
      reason: `${fromIdentity} 与 ${toIdentity} 互斥`,
      consequences: []
    };
  }
  
  // 检查阵营转换
  const fromFaction = getIdentityFaction(fromIdentity);
  const toFaction = getIdentityFaction(toIdentity);
  
  if (fromFaction !== toFaction && fromFaction !== 'neutral') {
    consequences.push(`阵营转换：${fromFaction} → ${toFaction}`);
    consequences.push('可能遭到原阵营敌视');
  }
  
  // 检查专注度损失
  if (fromIdentity !== 'none') {
    consequences.push('之前积累的专注度会部分损失');
  }
  
  return {
    allowed: true,
    consequences
  };
}
