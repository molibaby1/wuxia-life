/**
 * 挑战系统 - 处理选择失败概率计算
 *
 * @version 1.0.0
 * @since 2026-03-19
 */

import type { PlayerStats, EventDefinition } from '../types/eventTypes';
import type {
  ChallengeScene,
  ChoiceFailureCheck,
  FailureFeedback
} from '../types/difficultyTypes';
import { CHALLENGE_SCENES, getChallengeScene } from '../data/challengeScenes';
import { difficultyManager } from './DifficultyManager';

/**
 * 计算挑战失败概率
 *
 * 公式: 失败概率 = 基础概率 × 难度系数 × 能力修正 × 测试模式倍数
 *
 * 能力修正规则:
 * - 能力 < 合格阈值: +20%
 * - 能力 >= 优秀阈值: -failureRateReduction
 */
export function calculateFailureProbability(
  scene: ChallengeScene,
  playerStats: PlayerStats,
  testModeMultiplier: number = 1.0
): ChoiceFailureCheck {
  let baseFailureRate = scene.baseFailureRate;
  const abilityAssessment: ChoiceFailureCheck['abilityAssessment'] = [];
  let totalModifier = 1.0;

  for (const stat of scene.relevantStats) {
    const statValue = (playerStats as any)[stat] || 0;
    const threshold = scene.thresholds[stat];

    if (threshold) {
      let status: 'insufficient' | 'qualified' | 'excellent' = 'qualified';
      let modifier = 0;

      if (statValue < threshold.qualified) {
        status = 'insufficient';
        modifier = 0.2;
        totalModifier += 0.2;
      } else if (statValue >= threshold.excellent) {
        status = 'excellent';
        modifier = -threshold.failureRateReduction;
        totalModifier -= threshold.failureRateReduction;
      }

      abilityAssessment.push({
        stat,
        value: statValue,
        threshold: threshold.qualified,
        status,
        modifier
      });
    }
  }

  const difficultyCoefficient = difficultyManager.config.failureProbabilityCoefficient;
  const finalFailureRate = Math.max(
    5,
    Math.min(
      95,
      baseFailureRate * difficultyCoefficient * totalModifier * testModeMultiplier
    )
  );

  const failureReason = generateFailureReason(abilityAssessment);

  return {
    sceneId: scene.id,
    sceneName: scene.name,
    baseFailureRate,
    abilityAssessment,
    failureReason,
    difficultyModifier: difficultyCoefficient,
    testModeMultiplier,
    finalFailureRate,
    isFailed: rollForFailure(finalFailureRate)
  };
}

/**
 * 根据事件定义计算失败概率
 */
export function calculateFailureProbabilityForEvent(
  event: EventDefinition,
  playerStats: PlayerStats
): ChoiceFailureCheck | null {
  if (!event.challengeScene?.enableFailureCheck) {
    return null;
  }

  const sceneId = event.challengeScene.sceneId;
  const scene = getChallengeScene(sceneId);

  if (!scene) {
    console.warn(`[ChallengeSystem] 未找到挑战场景: ${sceneId}`);
    return null;
  }

  const testModeMultiplier = difficultyManager.config.testModeEnabled ? 1.5 : 1.0;
  return calculateFailureProbability(scene, playerStats, testModeMultiplier);
}

/**
 * 执行失败判定
 */
export function rollForFailure(failureRate: number): boolean {
  const roll = Math.random() * 100;
  return roll < failureRate;
}

/**
 * 生成失败原因描述
 */
function generateFailureReason(assessment: ChoiceFailureCheck['abilityAssessment']): string {
  const insufficient = assessment.filter(a => a.status === 'insufficient');
  const excellent = assessment.filter(a => a.status === 'excellent');

  if (insufficient.length === 0 && excellent.length === 0) {
    return '能力评估完成，中规中矩';
  }

  const reasons: string[] = [];

  if (insufficient.length > 0) {
    const stats = insufficient.map(a => `${a.stat}(${a.value}/${a.threshold})`).join(', ');
    reasons.push(`以下能力不足: ${stats}`);
  }

  if (excellent.length > 0) {
    const stats = excellent.map(a => `${a.stat}(${a.value})`).join(', ');
    reasons.push(`以下能力优秀: ${stats}`);
  }

  return reasons.join('; ');
}

/**
 * 获取失败反馈
 */
export function getFailureFeedback(
  event: EventDefinition,
  check: ChoiceFailureCheck
): FailureFeedback {
  const feedbackType = determineFeedbackType(check);
  const textFeedback = event.challengeScene?.failureText ||
    generateGenericFailureText(check.sceneName);

  return {
    visualType: feedbackType,
    textFeedback,
    detailedDescription: check.failureReason,
    soundEffect: getSoundEffectForType(feedbackType),
    animationDuration: getAnimationDuration(feedbackType)
  };
}

/**
 * 确定失败反馈类型
 */
function determineFeedbackType(check: ChoiceFailureCheck): FailureFeedback['visualType'] {
  if (check.finalFailureRate >= 70) {
    return 'red_flash';
  } else if (check.finalFailureRate >= 50) {
    return 'shake';
  } else if (check.finalFailureRate >= 30) {
    return 'icon_shake';
  }
  return 'none';
}

/**
 * 生成通用失败文本
 */
function generateGenericFailureText(sceneName: string): string {
  const templates = [
    `面对${sceneName}的挑战，你感到力不从心...`,
    `${sceneName}的难度超出你的能力范围...`,
    `在${sceneName}中遭遇了挫折...`,
    `你的实力还不足以应对${sceneName}...`,
    `${sceneName}让你认识到了自己的不足...`
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * 根据反馈类型获取音效
 */
function getSoundEffectForType(type: FailureFeedback['visualType']): string {
  const soundMap: Record<FailureFeedback['visualType'], string> = {
    shake: 'fail_shake.mp3',
    red_flash: 'fail_critical.mp3',
    darken: 'fail_dark.mp3',
    icon_shake: 'fail_light.mp3',
    none: ''
  };
  return soundMap[type];
}

/**
 * 获取动画时长
 */
function getAnimationDuration(type: FailureFeedback['visualType']): number {
  const durationMap: Record<FailureFeedback['visualType'], number> = {
    shake: 500,
    red_flash: 800,
    darken: 600,
    icon_shake: 300,
    none: 0
  };
  return durationMap[type];
}

/**
 * 检查场景是否为高难度场景
 */
export function isHighDifficultyScene(sceneId: string): boolean {
  const scene = getChallengeScene(sceneId);
  if (!scene) return false;
  return scene.baseFailureRate >= 60;
}

/**
 * 获取场景描述
 */
export function getSceneDescription(sceneId: string): string | undefined {
  const scene = getChallengeScene(sceneId);
  return scene?.description;
}

/**
 * 计算推荐属性值
 */
export function getRecommendedStats(sceneId: string): Record<string, number> {
  const scene = getChallengeScene(sceneId);
  if (!scene) return {};

  const recommendations: Record<string, number> = {};
  for (const stat of scene.relevantStats) {
    const threshold = scene.thresholds[stat];
    if (threshold) {
      recommendations[stat] = threshold.excellent;
    }
  }
  return recommendations;
}
