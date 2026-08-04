/**
 * 人生轨迹系统
 * 
 * 追踪玩家的核心人生选择、身份、阵营和成长轨迹，
 * 确保事件触发的逻辑一致性和叙事连贯性。
 * 
 * @version 2.0.0
 * @since 2026-03-15
 */

import type { LifePath, LifeStage, GameState } from '../types/eventTypes';

export class LifePathManager {
  /**
   * 创建初始人生轨迹
   */
  static create(): LifePath {
    return {
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

      case 'became_hero':
        lifePath.faction = 'orthodox';
        break;

      case 'joined_demon_sect':
        lifePath.faction = 'demon';
        lifePath.commitments.cannotJoin.push('zhengdao');
        break;
    }
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

    // 2. 检查承诺约束
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

    // 3. 检查成就要求
    if (requirements.requiredAchievements) {
      for (const achievement of requirements.requiredAchievements) {
        if (!lifePath.achievements.includes(achievement)) {
          return false;
        }
      }
    }

    // 4. 检查人生阶段
    if (requirements.lifeStage) {
      if (lifePath.lifeStage !== requirements.lifeStage) {
        return false;
      }
    }

    return true;
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
    };
  }
}
