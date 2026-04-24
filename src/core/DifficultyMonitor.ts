/**
 * 难度数据监控器
 *
 * 追踪和记录游戏过程中的难度相关指标
 *
 * @version 1.0.0
 * @since 2026-03-19
 */

import { reactive } from 'vue';
import type { DifficultyMetrics } from '../types/difficultyTypes';

const INITIAL_METRICS: DifficultyMetrics = {
  totalChoices: 0,
  totalFailures: 0,
  failureRate: 0,
  totalEventsTriggered: 0,
  gateBlockedAttempts: 0,
  setbackEventsTriggered: 0,
  playerSurvivalRate: 100,
  eventsPerAge: {},
  lastUpdated: Date.now()
};

/**
 * 难度数据监控器
 */
export const difficultyMonitor = reactive({
  metrics: { ...INITIAL_METRICS } as DifficultyMetrics,

  /**
   * 记录选择结果
   */
  recordChoice(failed: boolean): void {
    this.metrics.totalChoices++;
    if (failed) {
      this.metrics.totalFailures++;
    }
    this.updateFailureRate();
    this.metrics.lastUpdated = Date.now();
  },

  /**
   * 记录事件触发
   */
  recordEventTrigger(eventId: string, age: number): void {
    this.metrics.totalEventsTriggered++;
    if (!this.metrics.eventsPerAge[age]) {
      this.metrics.eventsPerAge[age] = 0;
    }
    this.metrics.eventsPerAge[age]++;
    this.metrics.lastUpdated = Date.now();
  },

  /**
   * 记录门槛阻挡
   */
  recordGateBlocked(eventId: string): void {
    this.metrics.gateBlockedAttempts++;
    this.metrics.lastUpdated = Date.now();
  },

  /**
   * 记录挫折事件触发
   */
  recordSetbackEvent(eventId: string): void {
    this.metrics.setbackEventsTriggered++;
    this.metrics.lastUpdated = Date.now();
  },

  /**
   * 更新存活状态
   */
  updateSurvivalRate(alive: boolean): void {
    this.metrics.playerSurvivalRate = alive ? 100 : 0;
    this.metrics.lastUpdated = Date.now();
  },

  /**
   * 更新失败率
   */
  updateFailureRate(): void {
    if (this.metrics.totalChoices > 0) {
      this.metrics.failureRate =
        (this.metrics.totalFailures / this.metrics.totalChoices) * 100;
    }
  },

  /**
   * 获取监控报告
   */
  getReport(): string {
    const { metrics } = this;
    const ageKeys = Object.keys(metrics.eventsPerAge);
    const eventsByAge: number[] = Object.values(metrics.eventsPerAge) as number[];
    const totalEvents = eventsByAge.reduce((a, b) => a + b, 0);
    const avgEventsPerAge = ageKeys.length > 0
      ? (totalEvents / ageKeys.length).toFixed(2)
      : '0';

    return `
=== 难度监控报告 ===
【选择统计】
总选择次数: ${metrics.totalChoices}
失败次数: ${metrics.totalFailures}
失败率: ${metrics.failureRate.toFixed(2)}%

【事件统计】
事件触发数: ${metrics.totalEventsTriggered}
门槛阻挡数: ${metrics.gateBlockedAttempts}
挫折事件数: ${metrics.setbackEventsTriggered}
平均每年事件: ${avgEventsPerAge}

【存活状态】
存活率: ${metrics.playerSurvivalRate}%

【更新时间】
${new Date(metrics.lastUpdated).toLocaleString()}
    `.trim();
  },

  /**
   * 获取简短的统计摘要
   */
  getShortSummary(): string {
    const { metrics } = this;
    return `失败率: ${metrics.failureRate.toFixed(1)}% | 事件: ${metrics.totalEventsTriggered} | 挫折: ${metrics.setbackEventsTriggered} | 存活: ${metrics.playerSurvivalRate}%`;
  },

  /**
   * 获取 JSON 格式的指标
   */
  getMetricsJSON(): string {
    return JSON.stringify(this.metrics, null, 2);
  },

  /**
   * 重置监控数据
   */
  reset(): void {
    this.metrics = { ...INITIAL_METRICS };
  },

  /**
   * 导出指标数据
   */
  exportMetrics(): DifficultyMetrics {
    return { ...this.metrics };
  },

  /**
   * 导入指标数据
   */
  importMetrics(data: DifficultyMetrics): void {
    this.metrics = { ...data };
  },

  /**
   * 获取失败率趋势
   */
  getFailureRateTrend(): 'improving' | 'worsening' | 'stable' {
    if (this.metrics.totalChoices < 5) {
      return 'stable';
    }

    const recentChoices = Math.min(20, this.metrics.totalChoices);
    const recentFailures = Math.min(
      this.metrics.totalFailures,
      Math.ceil(recentChoices * 0.5)
    );
    const recentRate = (recentFailures / recentChoices) * 100;

    if (recentRate < this.metrics.failureRate - 5) {
      return 'improving';
    } else if (recentRate > this.metrics.failureRate + 5) {
      return 'worsening';
    }
    return 'stable';
  },

  /**
   * 获取按年龄的事件分布
   */
  getEventsByAgeRange(
    startAge: number,
    endAge: number
  ): { age: number; count: number }[] {
    const result: { age: number; count: number }[] = [];

    for (let age = startAge; age <= endAge; age++) {
      if (this.metrics.eventsPerAge[age]) {
        result.push({
          age,
          count: this.metrics.eventsPerAge[age]
        });
      }
    }

    return result;
  }
});

export default difficultyMonitor;
