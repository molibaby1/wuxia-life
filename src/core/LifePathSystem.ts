/**
 * 人生轨迹系统
 * 
 * 追踪玩家的核心人生选择、身份、阵营和成长轨迹，
 * 确保事件触发的逻辑一致性和叙事连贯性。
 * 
 * @version 2.0.0
 * @since 2026-03-15
 */

import type { LifePath, LifeStage, FactionType, PlayerIdentity, GameState } from '../types/eventTypes';

export class LifePathManager {
  /**
   * 创建初始人生轨迹
   */
  static create(): LifePath {
    return {
      primaryIdentity: 'none',
      faction: 'neutral',
      lifeStage: 'growth',
      achievements: [],
      relationships: {
        allies: [],
        enemies: [],
        mentors: [],
        disciples: []
      },
      commitments: {
        cannotJoin: [],
        mustProtect: [],
        swornEnemies: []
      },
      focus: {
        martial: 0,
        business: 0,
        academic: 0,
        leadership: 0
      }
    };
  }

  /**
   * 初始化人生轨迹
   */
  static initialize(state: GameState): GameState {
    if (!state.lifePath) {
      state.lifePath = this.create();
    }
    return state;
  }

  /**
   * 设置核心身份
   */
  static setPrimaryIdentity(state: GameState, identity: PlayerIdentity): GameState {
    if (!state.lifePath) {
      state.lifePath = this.create();
    }

    const { lifePath } = state;

    // 检查是否可以转换身份
    if (!this.canChangeIdentity(lifePath, identity)) {
      console.warn(`[LifePath] 无法转换身份：${lifePath.primaryIdentity} → ${identity}`);
      return state;
    }

    lifePath.primaryIdentity = identity;

    // 更新阵营
    const newFaction = this.getIdentityFaction(identity);
    if (newFaction !== 'neutral' && lifePath.faction === 'neutral') {
      lifePath.faction = newFaction;
    }

    return state;
  }

  /**
   * 检查身份转换是否合法
   */
  static canChangeIdentity(lifePath: LifePath, newIdentity: PlayerIdentity): boolean {
    // 如果还没有确定身份，可以转换
    if (lifePath.primaryIdentity === 'none') {
      return true;
    }

    // 如果已有誓敌，不能转换为敌对阵营身份
    if (lifePath.commitments.swornEnemies.includes('mojiao')) {
      if (newIdentity === 'demon' || newIdentity === 'assassin') {
        return false;
      }
    }

    // 如果已有必须保护的对象，不能转换为邪恶身份
    if (lifePath.commitments.mustProtect.includes('common_people')) {
      if (newIdentity === 'demon' || newIdentity === 'assassin') {
        return false;
      }
    }

    // 专注度检查：如果某项专注度已经很高，不能突然转换
    if (lifePath.focus.martial > 80) {
      if (['merchant', 'scholar', 'official'].includes(newIdentity)) {
        return false;
      }
    }

    if (lifePath.focus.business > 80) {
      if (['hero', 'assassin', 'beggar'].includes(newIdentity)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 记录重大成就
   */
  static recordAchievement(state: GameState, achievement: string, description?: string): GameState {
    if (!state.lifePath) {
      state.lifePath = this.create();
    }

    const { lifePath } = state;

    // 避免重复记录
    if (!lifePath.achievements.includes(achievement)) {
      lifePath.achievements.push(achievement);
    }

    // 根据成就添加承诺和关系
    this.applyAchievementEffects(lifePath, achievement);

    return state;
  }

  /**
   * 应用成就效果
   */
  private static applyAchievementEffects(lifePath: LifePath, achievement: string): void {
    switch (achievement) {
      case 'defeated_demon_sect':
        lifePath.commitments.swornEnemies.push('mojiao');
        lifePath.faction = 'orthodox';
        lifePath.relationships.enemies.push('mojiao');
        break;

      case 'saved_village':
        lifePath.commitments.mustProtect.push('common_people');
        break;

      case 'created_sect':
        lifePath.focus.leadership = Math.min(100, lifePath.focus.leadership + 30);
        break;

      case 'became_hero':
        lifePath.faction = 'orthodox';
        lifePath.primaryIdentity = 'hero';
        break;

      case 'joined_demon_sect':
        lifePath.faction = 'demon';
        lifePath.primaryIdentity = 'demon';
        lifePath.commitments.cannotJoin.push('zhengdao');
        break;
    }
  }

  /**
   * 增加专注度
   */
  static addFocus(
    state: GameState,
    type: 'martial' | 'business' | 'academic' | 'leadership',
    amount: number
  ): GameState {
    if (!state.lifePath) {
      state.lifePath = this.create();
    }

    const { lifePath } = state;
    const oldValue = lifePath.focus[type];
    lifePath.focus[type] = Math.min(100, lifePath.focus[type] + amount);

    if (oldValue < 50 && lifePath.focus[type] >= 50) {
    }
    if (oldValue < 80 && lifePath.focus[type] >= 80) {
    }

    return state;
  }

  /**
   * 检查事件是否可以触发
   */
  static canTriggerEvent(state: GameState, eventConfig: any): boolean {
    if (!state.lifePath) {
      return true; // 还没初始化，允许触发
    }

    const { lifePath } = state;
    const requirements = eventConfig.requirements;

    if (!requirements) {
      return true; // 没有要求，允许触发
    }

    // 1. 检查阵营兼容性
    if (requirements.faction) {
      if (requirements.faction !== 'neutral' && lifePath.faction !== requirements.faction) {
        return false;
      }
    }

    // 2. 检查身份兼容性
    if (requirements.identity) {
      if (!this.isIdentityCompatible(lifePath.primaryIdentity, requirements.identity)) {
        return false;
      }
    }

    // 3. 检查承诺约束
    if (requirements.cannotHaveCommitment) {
      if (lifePath.commitments.swornEnemies.includes(requirements.cannotHaveCommitment)) {
        return false;
      }
      if (lifePath.commitments.cannotJoin.includes(requirements.cannotHaveCommitment)) {
        return false;
      }
    }

    if (requirements.mustHaveCommitment) {
      if (!lifePath.commitments.swornEnemies.includes(requirements.mustHaveCommitment) &&
          !lifePath.commitments.mustProtect.includes(requirements.mustHaveCommitment)) {
        return false;
      }
    }

    // 4. 检查专注度
    if (requirements.minFocus) {
      const { type, value } = requirements.minFocus;
      if (lifePath.focus[type] < value) {
        return false;
      }
    }

    // 5. 检查成就要求
    if (requirements.requiredAchievements) {
      for (const achievement of requirements.requiredAchievements) {
        if (!lifePath.achievements.includes(achievement)) {
          return false;
        }
      }
    }

    // 6. 检查人生阶段
    if (requirements.lifeStage) {
      if (lifePath.lifeStage !== requirements.lifeStage) {
        return false;
      }
    }

    return true;
  }

  /**
   * 检查身份兼容性
   */
  private static isIdentityCompatible(current: PlayerIdentity, required: string | string[]): boolean {
    if (Array.isArray(required)) {
      return required.includes(current);
    }
    return current === required;
  }

  /**
   * 获取身份所属阵营
   */
  static getIdentityFaction(identity: PlayerIdentity): FactionType {
    const factions: Record<PlayerIdentity, FactionType> = {
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

    return factions[identity] || 'neutral';
  }

  /**
   * 更新人生阶段
   */
  static updateLifeStage(state: GameState): GameState {
    if (!state.lifePath) {
      return state;
    }

    const age = state.player?.age || 0;
    let newStage: LifeStage = 'growth';

    if (age <= 20) {
      newStage = 'growth';
    } else if (age <= 35) {
      newStage = 'development';
    } else if (age <= 55) {
      newStage = 'achievement';
    } else {
      newStage = 'legacy';
    }

    if (state.lifePath.lifeStage !== newStage) {
      state.lifePath.lifeStage = newStage;
    }

    return state;
  }

  /**
   * 添加关系
   */
  static addRelationship(
    state: GameState,
    type: 'ally' | 'enemy' | 'mentor' | 'disciple',
    name: string
  ): GameState {
    if (!state.lifePath) {
      state.lifePath = this.create();
    }

    const { lifePath } = state;
    const relationshipMap = {
      ally: lifePath.relationships.allies,
      enemy: lifePath.relationships.enemies,
      mentor: lifePath.relationships.mentors,
      disciple: lifePath.relationships.disciples
    };

    const list = relationshipMap[type];
    if (!list.includes(name)) {
      list.push(name);
    }

    // 如果是敌人，添加到誓敌
    if (type === 'enemy' && !lifePath.commitments.swornEnemies.includes(name)) {
      lifePath.commitments.swornEnemies.push(name);
    }

    return state;
  }

  /**
   * 序列化人生轨迹（用于存档）
   */
  static serialize(state: GameState): any {
    if (!state.lifePath) return null;
    return { ...state.lifePath };
  }

  /**
   * 反序列化人生轨迹（用于读档）
   */
  static deserialize(data: any): LifePath {
    if (!data) return this.create();
    return {
      primaryIdentity: data.primaryIdentity || 'none',
      faction: data.faction || 'neutral',
      lifeStage: data.lifeStage || 'growth',
      achievements: data.achievements || [],
      relationships: data.relationships || {
        allies: [],
        enemies: [],
        mentors: [],
        disciples: []
      },
      commitments: data.commitments || {
        cannotJoin: [],
        mustProtect: [],
        swornEnemies: []
      },
      focus: data.focus || {
        martial: 0,
        business: 0,
        academic: 0,
        leadership: 0
      }
    };
  }
}
