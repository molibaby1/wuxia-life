/**
 * 难度配置管理器
 *
 * 管理全局难度配置，支持预设和自定义配置
 *
 * @version 1.0.0
 * @since 2026-03-19
 */

import { reactive } from 'vue';
import type {
  DifficultyConfig,
  DifficultyPreset
} from '../types/difficultyTypes';
import { DIFFICULTY_PRESETS, DEFAULT_DIFFICULTY_CONFIG } from '../types/difficultyTypes';

const STORAGE_KEY = 'wuxia_difficulty_config';

const isBrowser =
  typeof window !== 'undefined' &&
  typeof window.localStorage !== 'undefined' &&
  typeof window.localStorage.getItem === 'function';

/**
 * 难度配置管理器（响应式单例）
 */
export const difficultyManager = reactive({
  config: { ...DEFAULT_DIFFICULTY_CONFIG } as DifficultyConfig,

  /**
   * 更新配置
   */
  updateConfig(partial: Partial<DifficultyConfig>): void {
    Object.assign(this.config, partial);
    this.saveConfig();
  },

  /**
   * 重置为默认配置
   */
  resetConfig(): void {
    this.config = { ...DEFAULT_DIFFICULTY_CONFIG };
    this.saveConfig();
  },

  /**
   * 启用测试模式
   */
  enableTestMode(): void {
    this.config.testModeEnabled = true;
    this.config.failureProbabilityCoefficient = 1.5;
    this.config.setbackEventProbability = 2.0;
    this.saveConfig();
  },

  /**
   * 禁用测试模式
   */
  disableTestMode(): void {
    this.config.testModeEnabled = false;
    this.config.failureProbabilityCoefficient = 1.0;
    this.config.setbackEventProbability = 1.0;
    this.saveConfig();
  },

  /**
   * 切换测试模式
   */
  toggleTestMode(): void {
    if (this.config.testModeEnabled) {
      this.disableTestMode();
    } else {
      this.enableTestMode();
    }
  },

  /**
   * 应用预设难度
   */
  applyPreset(preset: DifficultyPreset): void {
    const presetConfig = DIFFICULTY_PRESETS[preset];
    if (!presetConfig) {
      console.warn(`[DifficultyManager] 未知的预设难度: ${preset}`);
      return;
    }

    this.config.failureProbabilityCoefficient = presetConfig.failureProbabilityCoefficient;
    this.config.eventThresholdCoefficient = presetConfig.eventThresholdCoefficient;
    this.config.setbackEventProbability = presetConfig.setbackEventProbability;
    this.config.testModeEnabled = false;

    this.saveConfig();
  },

  /**
   * 获取当前预设名称
   */
  getCurrentPreset(): DifficultyPreset | 'custom' {
    const current = {
      failureProbabilityCoefficient: this.config.failureProbabilityCoefficient,
      eventThresholdCoefficient: this.config.eventThresholdCoefficient,
      setbackEventProbability: this.config.setbackEventProbability
    };

    for (const [name, preset] of Object.entries(DIFFICULTY_PRESETS)) {
      if (
        preset.failureProbabilityCoefficient === current.failureProbabilityCoefficient &&
        preset.eventThresholdCoefficient === current.eventThresholdCoefficient &&
        preset.setbackEventProbability === current.setbackEventProbability
      ) {
        return name as DifficultyPreset;
      }
    }

    return 'custom';
  },

  /**
   * 获取预设描述
   */
  getPresetDescription(preset: DifficultyPreset): string {
    return DIFFICULTY_PRESETS[preset]?.description || '';
  },

  /**
   * 获取所有预设列表
   */
  getAllPresets(): { name: DifficultyPreset; description: string }[] {
    return Object.entries(DIFFICULTY_PRESETS).map(([name, preset]) => ({
      name: name as DifficultyPreset,
      description: preset.description
    }));
  },

  /**
   * 保存配置到 localStorage
   */
  saveConfig(): void {
    if (!isBrowser) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.warn('[DifficultyManager] 保存配置失败', e);
    }
  },

  /**
   * 从 localStorage 加载配置
   */
  loadConfig(): void {
    try {
      if (!isBrowser) return;
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.config = { ...DEFAULT_DIFFICULTY_CONFIG, ...parsed };
      }
    } catch (e) {
      console.warn('[DifficultyManager] 加载配置失败', e);
    }
  },

  /**
   * 验证配置是否有效
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (
      this.config.failureProbabilityCoefficient < 0.5 ||
      this.config.failureProbabilityCoefficient > 2.0
    ) {
      errors.push('失败概率系数应在 0.5-2.0 范围内');
    }

    if (
      this.config.eventThresholdCoefficient < 0.5 ||
      this.config.eventThresholdCoefficient > 2.0
    ) {
      errors.push('事件触发门槛系数应在 0.5-2.0 范围内');
    }

    if (
      this.config.setbackEventProbability < 0 ||
      this.config.setbackEventProbability > 2.0
    ) {
      errors.push('挫折事件触发概率应在 0-2.0 范围内');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * 获取配置摘要
   */
  getSummary(): string {
    const preset = this.getCurrentPreset();
    const presetText = preset === 'custom' ? '自定义' : preset.toUpperCase();

    return `
难度配置 [${presetText}]:
- 失败概率系数: ${this.config.failureProbabilityCoefficient}
- 事件触发门槛: ${this.config.eventThresholdCoefficient}
- 挫折事件概率: ${this.config.setbackEventProbability}
- 测试模式: ${this.config.testModeEnabled ? '开启' : '关闭'}
    `.trim();
  }
});

difficultyManager.loadConfig();

export default difficultyManager;
