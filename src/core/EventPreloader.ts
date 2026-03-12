/**
 * 事件预加载器
 * 
 * 功能：
 * - 预加载即将到达的年龄段事件
 * - 事件池管理
 * - 内存优化
 * - 懒加载支持
 */

import { EventDefinition } from '../types/eventTypes';
import { eventLoader } from './EventLoader';
import { performanceMonitor } from './PerformanceMonitor';

export class EventPreloader {
  private static instance: EventPreloader;
  private readonly PRELOAD_AGE_RANGE = 5; // 预加载未来 5 年的事件
  private eventPool: Map<number, EventDefinition[]> = new Map();
  private loadedAges: Set<number> = new Set();
  
  private constructor() {}
  
  public static getInstance(): EventPreloader {
    if (!EventPreloader.instance) {
      EventPreloader.instance = new EventPreloader();
    }
    return EventPreloader.instance;
  }
  
  /**
   * 预加载指定年龄的事件
   */
  public preloadAge(age: number): void {
    const startTime = performance.now();
    
    // 如果已经加载过，跳过
    if (this.loadedAges.has(age)) {
      return;
    }
    
    // 获取该年龄的事件
    const events = eventLoader.getEventsByAge(age);
    
    if (events.length > 0) {
      this.eventPool.set(age, events);
      this.loadedAges.add(age);
      
      const endTime = performance.now();
      performanceMonitor.recordEventExecution(endTime - startTime);
      
      console.log(`[EventPreloader] 预加载 ${age}岁事件：${events.length}个`);
    }
  }
  
  /**
   * 预加载未来年龄段的事件
   */
  public preloadFutureAges(currentAge: number): void {
    console.log(`[EventPreloader] 开始预加载 ${currentAge}-${currentAge + this.PRELOAD_AGE_RANGE} 岁事件`);
    
    for (let age = currentAge; age <= currentAge + this.PRELOAD_AGE_RANGE; age++) {
      this.preloadAge(age);
    }
  }
  
  /**
   * 获取指定年龄的事件（从预加载池）
   */
  public getEvents(age: number): EventDefinition[] {
    // 如果池中已有，直接返回
    const pooled = this.eventPool.get(age);
    if (pooled) {
      return pooled;
    }
    
    // 否则实时加载并加入池中
    const events = eventLoader.getEventsByAge(age);
    if (events.length > 0) {
      this.eventPool.set(age, events);
      this.loadedAges.add(age);
    }
    
    return events;
  }
  
  /**
   * 清除指定年龄的预加载
   */
  public clearAge(age: number): void {
    this.eventPool.delete(age);
    this.loadedAges.delete(age);
    console.log(`[EventPreloader] 清除 ${age}岁事件缓存`);
  }
  
  /**
   * 清除旧年龄的预加载（内存优化）
   */
  public clearOldAges(currentAge: number, keepYears: number = 3): void {
    const threshold = currentAge - keepYears;
    
    for (const age of this.loadedAges) {
      if (age < threshold) {
        this.clearAge(age);
      }
    }
  }
  
  /**
   * 获取预加载统计信息
   */
  public getStatistics(): PreloadStatistics {
    const ages = Array.from(this.loadedAges);
    const minAge = Math.min(...ages, 0);
    const maxAge = Math.max(...ages, 0);
    
    return {
      loadedAgesCount: this.loadedAges.size,
      totalEventsCount: Array.from(this.eventPool.values()).reduce((sum, events) => sum + events.length, 0),
      minAge,
      maxAge,
      poolSize: this.eventPool.size,
    };
  }
  
  /**
   * 打印预加载统计
   */
  public printStatistics(): void {
    const stats = this.getStatistics();
    
    console.log('\n=== 事件预加载统计 ===');
    console.log(`已加载年龄段：${stats.loadedAgesCount}个`);
    console.log(`总事件数：${stats.totalEventsCount}个`);
    console.log(`年龄范围：${stats.minAge}-${stats.maxAge}岁`);
    console.log(`事件池大小：${stats.poolSize}`);
    console.log('=====================\n');
  }
  
  /**
   * 重置预加载器
   */
  public reset(): void {
    this.eventPool.clear();
    this.loadedAges.clear();
    console.log('[EventPreloader] 预加载器已重置');
  }
}

export interface PreloadStatistics {
  loadedAgesCount: number;
  totalEventsCount: number;
  minAge: number;
  maxAge: number;
  poolSize: number;
}

// 导出单例
export const eventPreloader = EventPreloader.getInstance();
