import type { PlayerState } from '../types';

/**
 * 推进时间
 * @param state 当前状态
 * @param value 时间值
 * @param unit 时间单位
 * @returns 更新后的状态
 */
export function advanceTime(
  state: PlayerState,
  value: number,
  unit: 'year' | 'month' | 'day'
): Partial<PlayerState> {
  const updates: Partial<PlayerState> = {};
  
  if (unit === 'year') {
    // 按年推进：直接增加年龄
    updates.age = state.age + value;
    updates.timeUnit = 'year';
    updates.monthProgress = state.monthProgress;
    updates.dayProgress = state.dayProgress;
  } else if (unit === 'month') {
    // 按月推进
    const totalMonths = state.age * 12 + state.monthProgress + value;
    const newAge = Math.floor(totalMonths / 12);
    const newMonthProgress = totalMonths % 12;
    
    updates.age = newAge;
    updates.monthProgress = newMonthProgress;
    updates.timeUnit = 'month';
    updates.dayProgress = state.dayProgress;
  } else if (unit === 'day') {
    // 按天推进（假设每月 30 天）
    const totalDays = state.age * 360 + state.monthProgress * 30 + state.dayProgress - 1 + value;
    const newAge = Math.floor(totalDays / 360);
    const remainingDays = totalDays % 360;
    const newMonthProgress = Math.floor(remainingDays / 30);
    const newDayProgress = (remainingDays % 30) + 1;
    
    updates.age = newAge;
    updates.monthProgress = newMonthProgress;
    updates.dayProgress = newDayProgress;
    updates.timeUnit = 'day';
  }
  
  return updates;
}

/**
 * 格式化当前时间显示
 * @param state 当前状态
 * @returns 格式化的时间字符串
 */
export function formatTime(state: PlayerState): string {
  if (state.timeUnit === 'year') {
    return `${state.age}岁`;
  } else if (state.timeUnit === 'month') {
    const monthNames = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
    return `${state.age}岁 ${monthNames[state.monthProgress]}月`;
  } else {
    return `${state.age}岁 ${state.monthProgress + 1}月 ${state.dayProgress}日`;
  }
}

/**
 * 获取时间跨度的年数（用于剧情节点匹配）
 * @param value 时间值
 * @param unit 时间单位
 * @returns 等效的年数
 */
export function getTimeSpanInYears(value: number, unit: 'year' | 'month' | 'day'): number {
  if (unit === 'year') {
    return value;
  } else if (unit === 'month') {
    return value / 12;
  } else {
    return value / 360;
  }
}
