/**
 * 随机选择引擎 - 实现智能随机选择算法
 */

import type { IRandomEngine } from './types';

/**
 * 伪随机数生成器（支持种子）
 */
class SeededRandom implements IRandomEngine {
  private seed: number = 12345;

  constructor(seed?: number) {
    if (seed !== undefined) {
      this.seed = seed;
    }
  }

  setSeed(seed: number): void {
    this.seed = seed;
  }

  /**
   * 生成 0-1 之间的随机数（使用 LCG 算法）
   */
  random(): number {
    // LCG 参数
    const a = 1664525;
    const c = 1013904223;
    const m = Math.pow(2, 32);
    
    this.seed = (a * this.seed + c) % m;
    return this.seed / m;
  }

  /**
   * 从数组中随机选择一个元素
   */
  choose<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot choose from empty array');
    }
    const index = Math.floor(this.random() * array.length);
    return array[index];
  }

  /**
   * 根据权重随机选择
   * @param items 带权重的项目数组
   */
  weightedChoose<T>(items: Array<{ item: T; weight: number }>): T {
    if (items.length === 0) {
      throw new Error('Cannot choose from empty items');
    }

    // 计算总权重
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    
    if (totalWeight <= 0) {
      // 如果所有权重都是 0，退化为均匀随机
      return this.choose(items.map(i => i.item));
    }

    // 随机选择一个权重值
    let random = this.random() * totalWeight;
    
    // 找到对应的项目
    for (const { item, weight } of items) {
      if (random < weight) {
        return item;
      }
      random -= weight;
    }

    // 理论上不会到这里，但为了类型安全返回最后一个
    return items[items.length - 1].item;
  }
}

/**
 * 智能决策引擎 - 结合随机性和属性权重
 */
export class DecisionEngine implements IDecisionEngine {
  private randomEngine: IRandomEngine;

  constructor(randomEngine?: IRandomEngine) {
    this.randomEngine = randomEngine || new SeededRandom();
  }

  /**
   * 计算选择的权重
   */
  private calculateChoiceWeights(
    choices: StoryChoice[],
    state: PlayerState,
    randomnessWeight: number
  ): Record<string, number> {
    const weights: Record<string, number> = {};

    choices.forEach(choice => {
      let weight = 1.0;

      // 如果有条件，检查条件满足程度
      if (choice.condition) {
        try {
          const conditionMet = choice.condition(state);
          if (!conditionMet) {
            weight = 0; // 条件不满足，权重为 0
          }
        } catch {
          weight = 0.5; // 条件评估失败，给中等权重
        }
      }

      // 根据选择 ID 推断类型并调整权重
      const choiceId = choice.id.toLowerCase();
      
      // 战斗相关选择 - 根据武功值
      if (choiceId.includes('fight') || choiceId.includes('attack')) {
        weight *= (0.5 + state.martialPower / 100);
      }
      
      // 轻功相关选择 - 根据轻功值
      if (choiceId.includes('qinggong') || choiceId.includes('agility')) {
        weight *= (0.5 + state.qinggong / 100);
      }
      
      // 内力相关选择 - 根据内力值
      if (choiceId.includes('internal') || choiceId.includes('neili')) {
        weight *= (0.5 + state.internalSkill / 100);
      }
      
      // 外功相关选择 - 根据外功值
      if (choiceId.includes('strength') || choiceId.includes('external')) {
        weight *= (0.5 + state.externalSkill / 100);
      }
      
      // 侠义相关选择 - 根据侠义值
      if (choiceId.includes('help') || choiceId.includes('save') || choiceId.includes('brave')) {
        weight *= (0.5 + state.chivalry / 100);
      }
      
      // 谨慎选择 - 根据性格（这里简化处理）
      if (choiceId.includes('careful') || choiceId.includes('cautious')) {
        weight *= 1.2; // 稍微偏好谨慎选择
      }
      
      // 积极选择 - 根据年龄（年轻人更积极）
      if (choiceId.includes('active') || choiceId.includes('aggressive')) {
        weight *= (state.age < 30 ? 1.3 : 0.8);
      }

      weights[choice.id] = Math.max(0, weight);
    });

    return weights;
  }

  /**
   * 做出选择
   */
  async makeChoice(
    nodeId: string,
    choices: StoryChoice[],
    state: PlayerState,
    config: SimulationConfig
  ): Promise<{
    selectedChoice: StoryChoice;
    reason: string;
    weights?: Record<string, number>;
  }> {
    if (choices.length === 0) {
      throw new Error('No choices available');
    }

    if (choices.length === 1) {
      return {
        selectedChoice: choices[0],
        reason: '唯一可用选择',
      };
    }

    const { randomnessWeight } = config;

    // 计算权重
    const weights = this.calculateChoiceWeights(choices, state, randomnessWeight);

    // 根据随机性权重决定选择策略
    const randomValue = this.randomEngine.random();
    
    if (randomValue > randomnessWeight) {
      // 完全随机选择（只从权重>0 的中选择）
      const validChoices = choices.filter((_, index) => weights[choices[index].id] > 0);
      if (validChoices.length > 0) {
        return {
          selectedChoice: this.randomEngine.choose(validChoices),
          reason: '随机选择',
          weights,
        };
      }
    }

    // 根据权重选择
    const weightedItems = choices.map(choice => ({
      item: choice,
      weight: weights[choice.id] || 0,
    }));

    const selectedChoice = this.randomEngine.weightedChoose(weightedItems);
    
    return {
      selectedChoice,
      reason: `基于权重选择 (随机性=${randomnessWeight.toFixed(2)})`,
      weights,
    };
  }
}

// 导出类型
export type { IRandomEngine, IDecisionEngine };
