/**
 * 属性成长系统
 * 
 * 负责：
 * - 属性成长计算（考虑天赋加成）
 * - 属性上限检查
 * - 修炼效率计算
 */

import { talentSystem } from './TalentSystem';

export class StatGrowthSystem {
  /**
   * 计算属性成长值
   * @param statName 属性名
   * @param baseGrowth 基础成长值
   * @param talentIds 玩家拥有的天赋列表
   * @returns 实际成长值
   */
  public calculateGrowth(
    statName: string,
    baseGrowth: number,
    talentIds: string[]
  ): number {
    const growthMultiplier = talentSystem.calculateGrowthBonus(statName, talentIds);
    const actualGrowth = baseGrowth * growthMultiplier;
    
    return Math.round(actualGrowth * 10) / 10; // 保留 1 位小数
  }

  /**
   * 检查属性是否超过上限
   * @param statName 属性名
   * @param currentValue 当前值
   * @param talentIds 玩家拥有的天赋列表
   * @returns 是否超过上限
   */
  public isStatOverCap(
    statName: string,
    currentValue: number,
    talentIds: string[]
  ): boolean {
    const cap = talentSystem.calculateStatCap(statName, talentIds);
    return currentValue > cap;
  }

  /**
   * 限制属性值不超过上限
   * @param statName 属性名
   * @param value 属性值
   * @param talentIds 玩家拥有的天赋列表
   * @returns 限制后的值
   */
  public clampToCap(
    statName: string,
    value: number,
    talentIds: string[]
  ): number {
    const cap = talentSystem.calculateStatCap(statName, talentIds);
    return Math.min(value, cap);
  }

  /**
   * 计算外功修炼成长
   * @param trainingIntensity 训练强度 (1-10)
   * @param comprehension 悟性
   * @param talentIds 天赋列表
   * @returns 外功成长值
   */
  public calculateExternalGrowth(
    trainingIntensity: number,
    comprehension: number,
    talentIds: string[]
  ): number {
    // 基础成长 = 训练强度 * 0.5
    const baseGrowth = trainingIntensity * 0.5;
    
    // 悟性加成 = 悟性 * 1%
    const comprehensionBonus = 1 + (comprehension * 0.01);
    
    // 最终成长 = 基础成长 * 悟性加成 * 天赋加成
    const growth = baseGrowth * comprehensionBonus;
    
    return this.calculateGrowth('externalSkill', growth, talentIds);
  }

  /**
   * 计算内功修炼成长
   * @param meditationTime 打坐时间 (分钟)
   * @param comprehension 悟性
   * @param talentIds 天赋列表
   * @returns 内功成长值
   */
  public calculateInternalGrowth(
    meditationTime: number,
    comprehension: number,
    talentIds: string[]
  ): number {
    // 基础成长 = 打坐时间 * 0.3
    const baseGrowth = meditationTime * 0.3;
    
    // 悟性加成 = 悟性 * 1.5%
    const comprehensionBonus = 1 + (comprehension * 0.015);
    
    // 最终成长
    const growth = baseGrowth * comprehensionBonus;
    
    return this.calculateGrowth('internalSkill', growth, talentIds);
  }

  /**
   * 计算轻功修炼成长
   * @param practiceTime 练习时间 (小时)
   * @param constitution 体魄
   * @param talentIds 天赋列表
   * @returns 轻功成长值
   */
  public calculateQinggongGrowth(
    practiceTime: number,
    constitution: number,
    talentIds: string[]
  ): number {
    // 基础成长 = 练习时间 * 0.4
    const baseGrowth = practiceTime * 0.4;
    
    // 体魄加成 = 体魄 * 0.5%
    const constitutionBonus = 1 + (constitution * 0.005);
    
    // 最终成长
    const growth = baseGrowth * constitutionBonus;
    
    return this.calculateGrowth('qinggong', growth, talentIds);
  }

  /**
   * 计算功力综合成长
   * @param externalGrowth 外功成长
   * @param internalGrowth 内功成长
   * @returns 功力成长值
   */
  public calculateMartialPowerGrowth(
    externalGrowth: number,
    internalGrowth: number
  ): number {
    // 功力成长 = (外功成长 + 内功成长) / 2
    return (externalGrowth + internalGrowth) / 2;
  }

  /**
   * 计算体魄修炼成长
   * @param exerciseIntensity 锻炼强度 (1-10)
   * @param talentIds 天赋列表
   * @returns 体魄成长值
   */
  public calculateConstitutionGrowth(
    exerciseIntensity: number,
    talentIds: string[]
  ): number {
    const baseGrowth = exerciseIntensity * 0.6;
    return this.calculateGrowth('constitution', baseGrowth, talentIds);
  }

  /**
   * 批量计算属性成长
   * @param growths 成长配置 { statName: baseGrowth }
   * @param talents 天赋列表
   * @returns 成长结果 { statName: actualGrowth }
   */
  public calculateBatchGrowth(
    growths: { [statName: string]: number },
    talentIds: string[]
  ): { [statName: string]: number } {
    const results: { [statName: string]: number } = {};
    
    Object.entries(growths).forEach(([statName, baseGrowth]) => {
      results[statName] = this.calculateGrowth(statName, baseGrowth, talentIds);
    });
    
    return results;
  }

  /**
   * 获取属性成长说明
   * @param statName 属性名
   * @param baseGrowth 基础成长
   * @param talentIds 天赋列表
   * @returns 成长说明文本
   */
  public getGrowthDescription(
    statName: string,
    baseGrowth: number,
    talentIds: string[]
  ): string {
    const growthMultiplier = talentSystem.calculateGrowthBonus(statName, talentIds);
    const actualGrowth = baseGrowth * growthMultiplier;
    const bonusPercent = Math.round((growthMultiplier - 1) * 100);
    
    const statNames: { [key: string]: string } = {
      'martialPower': '功力',
      'externalSkill': '外功',
      'internalSkill': '内功',
      'qinggong': '轻功',
      'constitution': '体魄',
      'charisma': '魅力',
      'comprehension': '悟性',
      'knowledge': '学识',
      'connections': '人脉',
      'reputation': '声望',
      'wealth': '财富',
      'chivalry': '侠义'
    };
    
    const statNameCn = statNames[statName] || statName;
    const bonusText = bonusPercent >= 0 ? `+${bonusPercent}%` : `${bonusPercent}%`;
    
    return `${statNameCn}: ${baseGrowth} → ${actualGrowth.toFixed(1)} (天赋加成 ${bonusText})`;
  }
}

// 导出单例
export const statGrowthSystem = new StatGrowthSystem();
