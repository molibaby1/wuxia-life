/**
 * 事件加载器 - 整合所有人生阶段事件
 * 
 * 功能：
 * - 加载所有事件数据（童年、青年、成年、中老年）
 * - 提供事件查询接口
 * - 支持事件池管理
 * 
 * @version 1.0.0
 * @since 2026-03-12
 */

import { EventDefinition, EventCategory, EventPriority } from '../types/eventTypes';
import { childhoodEvents } from '../data/childhoodEvents';
import { youthEvents } from '../data/youthEvents';
import { adultEvents } from '../data/adultEvents';
import { elderlyEvents } from '../data/elderlyEvents';

/**
 * 事件加载器类
 */
export class EventLoader {
  private static instance: EventLoader;
  private allEvents: EventDefinition[] = [];
  private eventsByAge: Map<number, EventDefinition[]> = new Map();
  private eventsById: Map<string, EventDefinition> = new Map();
  
  private constructor() {
    this.loadAllEvents();
  }
  
  /**
   * 获取单例实例
   */
  public static getInstance(): EventLoader {
    if (!EventLoader.instance) {
      EventLoader.instance = new EventLoader();
    }
    return EventLoader.instance;
  }
  
  /**
   * 加载所有事件
   */
  private loadAllEvents(): void {
    // 合并所有事件
    this.allEvents = [
      ...childhoodEvents,
      ...youthEvents,
      ...adultEvents,
      ...elderlyEvents,
    ];
    
    console.log(`[EventLoader] 加载了 ${this.allEvents.length} 个事件`);
    
    // 建立索引
    this.buildIndexes();
  }
  
  /**
   * 建立事件索引
   */
  private buildIndexes(): void {
    // 按年龄索引
    this.eventsByAge.clear();
    this.eventsById.clear();
    
    for (const event of this.allEvents) {
      // 按年龄范围索引
      for (let age = event.ageRange.min; age <= event.ageRange.max; age++) {
        if (!this.eventsByAge.has(age)) {
          this.eventsByAge.set(age, []);
        }
        this.eventsByAge.get(age)!.push(event);
      }
      
      // 按 ID 索引
      this.eventsById.set(event.id, event);
    }
    
    console.log(`[EventLoader] 索引建立完成，覆盖年龄范围：0-80 岁`);
  }
  
  /**
   * 根据年龄获取可用事件
   */
  public getEventsByAge(age: number): EventDefinition[] {
    return this.eventsByAge.get(age) || [];
  }
  
  /**
   * 根据 ID 获取事件
   */
  public getEventById(id: string): EventDefinition | undefined {
    return this.eventsById.get(id);
  }
  
  /**
   * 获取所有事件
   */
  public getAllEvents(): EventDefinition[] {
    return [...this.allEvents];
  }
  
  /**
   * 根据分类获取事件
   */
  public getEventsByCategory(category: EventCategory): EventDefinition[] {
    return this.allEvents.filter(event => event.category === category);
  }
  
  /**
   * 根据优先级获取事件
   */
  public getEventsByPriority(priority: EventPriority): EventDefinition[] {
    return this.allEvents.filter(event => event.priority === priority);
  }
  
  /**
   * 获取指定年龄范围内的所有事件
   */
  public getEventsInAgeRange(minAge: number, maxAge: number): EventDefinition[] {
    return this.allEvents.filter(event => 
      event.ageRange.min <= maxAge && event.ageRange.max >= minAge
    );
  }
  
  /**
   * 验证事件数据完整性
   */
  public validateEvents(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    for (const event of this.allEvents) {
      // 验证必需字段
      if (!event.id) {
        errors.push(`事件缺少 ID: ${JSON.stringify(event)}`);
      }
      if (!event.version) {
        errors.push(`事件 ${event.id} 缺少版本号`);
      }
      if (!event.category) {
        errors.push(`事件 ${event.id} 缺少分类`);
      }
      if (!event.ageRange) {
        errors.push(`事件 ${event.id} 缺少年龄范围`);
      }
      if (!event.content) {
        errors.push(`事件 ${event.id} 缺少内容`);
      }
      
      // 验证事件类型
      if (!event.eventType || !['auto', 'choice', 'ending'].includes(event.eventType)) {
        errors.push(`事件 ${event.id} 的事件类型无效：${event.eventType}`);
      }
      
      // 验证自动事件
      if (event.eventType === 'auto' && !event.autoEffects) {
        errors.push(`自动事件 ${event.id} 缺少 autoEffects`);
      }
      
      // 验证选择事件
      if (event.eventType === 'choice') {
        if (!event.choices || event.choices.length === 0) {
          errors.push(`选择事件 ${event.id} 缺少 choices`);
        } else {
          event.choices.forEach((choice, index) => {
            if (!choice.id) {
              errors.push(`事件 ${event.id} 的第 ${index} 个选择缺少 ID`);
            }
            if (!choice.text) {
              errors.push(`事件 ${event.id} 的第 ${index} 个选择缺少文本`);
            }
            if (!choice.effects || choice.effects.length === 0) {
              errors.push(`事件 ${event.id} 的第 ${index} 个选择缺少效果`);
            }
          });
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
  
  /**
   * 打印事件统计信息
   */
  public printStatistics(): void {
    console.log('\n=== 事件加载统计 ===');
    console.log(`总事件数：${this.allEvents.length}`);
    
    // 按阶段统计
    const childhoodCount = childhoodEvents.length;
    const youthCount = youthEvents.length;
    const adultCount = adultEvents.length;
    const elderlyCount = elderlyEvents.length;
    
    console.log(`童年事件：${childhoodCount} 个`);
    console.log(`青年事件：${youthCount} 个`);
    console.log(`成年事件：${adultCount} 个`);
    console.log(`中老年事件：${elderlyCount} 个`);
    
    // 按类型统计
    const autoEvents = this.allEvents.filter(e => e.eventType === 'auto').length;
    const choiceEvents = this.allEvents.filter(e => e.eventType === 'choice').length;
    const endingEvents = this.allEvents.filter(e => e.eventType === 'ending').length;
    
    console.log(`\n自动事件：${autoEvents} 个`);
    console.log(`选择事件：${choiceEvents} 个`);
    console.log(`结局事件：${endingEvents} 个`);
    
    // 按分类统计
    const mainStoryCount = this.getEventsByCategory(EventCategory.MAIN_STORY).length;
    const sideQuestCount = this.getEventsByCategory(EventCategory.SIDE_QUEST).length;
    const specialEventCount = this.getEventsByCategory(EventCategory.SPECIAL_EVENT).length;
    
    console.log(`\n主线剧情：${mainStoryCount} 个`);
    console.log(`支线任务：${sideQuestCount} 个`);
    console.log(`特殊事件：${specialEventCount} 个`);
    
    // 验证结果
    const validation = this.validateEvents();
    console.log(`\n数据验证：${validation.valid ? '✅ 通过' : '❌ 失败'}`);
    if (!validation.valid) {
      console.log('错误:', validation.errors);
    }
    
    console.log('====================\n');
  }
}

// 创建并导出单例
export const eventLoader = EventLoader.getInstance();

// 打印统计信息
eventLoader.printStatistics();
