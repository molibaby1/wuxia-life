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

import { EventCategory, EventPriority } from '../types/eventTypes';
import type { EventDefinition } from '../types/eventTypes';
import eventsIndexJson from '../data/events.json';
import generalEventsJson from '../data/lines/general.json';
import originEventsJson from '../data/lines/origin.json';
import officialEventsJson from '../data/lines/official.json';
import loveEventsJson from '../data/lines/love.json';
import tutorialEventsJson from '../data/lines/tutorial.json';
import middleAgeCareerEventsJson from '../data/lines/middle-age-career.json';
import familyLifeEventsJson from '../data/lines/family-life.json';
import jianghuConflictEventsJson from '../data/lines/jianghu-conflict.json';
import elderlyLegacyEventsJson from '../data/lines/elderly-legacy.json';
import sectBeggarsEventsJson from '../data/lines/sect-beggars.json';
import sectBorderEventsJson from '../data/lines/sect-border.json';
import sectMarginalEventsJson from '../data/lines/sect-marginal.json';
import sectShaolinEventsJson from '../data/lines/sect-shaolin.json';
import sectWudangEventsJson from '../data/lines/sect-wudang.json';
import trainingEventsJson from '../data/lines/training.json';

const generalEvents = generalEventsJson as EventDefinition[];
const loveEvents = loveEventsJson as EventDefinition[];
const officialEvents = officialEventsJson as EventDefinition[];
const originEvents = originEventsJson as EventDefinition[];
const tutorialEvents = tutorialEventsJson as EventDefinition[];
const middleAgeCareerEvents = middleAgeCareerEventsJson as EventDefinition[];
const familyLifeEvents = familyLifeEventsJson as EventDefinition[];
const jianghuConflictEvents = jianghuConflictEventsJson as EventDefinition[];
const elderlyLegacyEvents = elderlyLegacyEventsJson as EventDefinition[];
const sectBeggarsEvents = sectBeggarsEventsJson as EventDefinition[];
const sectBorderEvents = sectBorderEventsJson as EventDefinition[];
const sectMarginalEvents = sectMarginalEventsJson as EventDefinition[];
const sectShaolinEvents = sectShaolinEventsJson as EventDefinition[];
const sectWudangEvents = sectWudangEventsJson as EventDefinition[];
const trainingEvents = trainingEventsJson as EventDefinition[];
const eventsIndex = eventsIndexJson as {
  version: string;
  imports: string[];
  notes?: string;
};

/**
 * 事件加载器类
 */
export class EventLoader {
  private static instance: EventLoader;
  private allEvents: EventDefinition[] = [];
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
    const lineMap: Record<string, EventDefinition[]> = {
      './lines/origin.json': originEvents,
      './lines/general.json': generalEvents,
      './lines/love.json': loveEvents,
      './lines/tutorial.json': tutorialEvents,
      './lines/official.json': officialEvents,
      './lines/middle-age-career.json': middleAgeCareerEvents,
      './lines/family-life.json': familyLifeEvents,
      './lines/jianghu-conflict.json': jianghuConflictEvents,
      './lines/elderly-legacy.json': elderlyLegacyEvents,
      './lines/sect-beggars.json': sectBeggarsEvents,
      './lines/sect-border.json': sectBorderEvents,
      './lines/sect-marginal.json': sectMarginalEvents,
      './lines/sect-shaolin.json': sectShaolinEvents,
      './lines/sect-wudang.json': sectWudangEvents,
      './lines/training.json': trainingEvents,
    };
    
    const orderedLines = (eventsIndex.imports || [])
      .map(path => lineMap[path])
      .filter(Boolean);
    
    // 合并所有事件（按入口文件顺序组织）
    this.allEvents = orderedLines.flat();
    
    console.log(`[EventLoader] 加载了 ${this.allEvents.length} 个事件`);
    
    // 建立索引
    this.buildIndexes();
  }
  
  /**
   * 建立事件索引
   */
  private buildIndexes(): void {
    this.eventsById.clear();
    
    for (const event of this.allEvents) {
      // 按 ID 索引
      this.eventsById.set(event.id, event);
    }
    
    console.log(`[EventLoader] 索引建立完成，事件池大小：${this.allEvents.length}`);
  }
  
  /**
   * 根据年龄获取可用事件
   */
  public getEventsByAge(age: number): EventDefinition[] {
    return this.allEvents.filter(event => this.getWeightForAge(event, age) > 0);
  }

  /**
   * 获取事件在指定年龄下的权重
   */
  public getWeightForAge(event: EventDefinition, age: number): number {
    if (event.ageWeights && event.ageWeights.length > 0) {
      let maxWeight = 0;
      for (const rule of event.ageWeights) {
        const max = rule.max ?? rule.min;
        if (age >= rule.min && age <= max) {
          maxWeight = Math.max(maxWeight, rule.weight);
        }
      }
      return maxWeight;
    }
    
    const max = event.ageRange.max ?? event.ageRange.min;
    if (age < event.ageRange.min || age > max) {
      return 0;
    }
    return event.weight ?? 0;
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
    return this.allEvents.filter(event => {
      const max = event.ageRange.max ?? event.ageRange.min;
      return event.ageRange.min <= maxAge && max >= minAge;
    });
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
    console.log(`入口文件：${eventsIndex.imports.join(', ')}`);
    
    console.log(`出身线：${originEvents.length} 个`);
    console.log(`通用事件：${generalEvents.length} 个`);
    console.log(`爱情线：${loveEvents.length} 个`);
    console.log(`官场线：${officialEvents.length} 个`);
    console.log(`丐帮线：${sectBeggarsEvents.length} 个`);
    console.log(`边地线：${sectBorderEvents.length} 个`);
    console.log(`江湖争议派：${sectMarginalEvents.length} 个`);
    console.log(`佛门线：${sectShaolinEvents.length} 个`);
    console.log(`名门线：${sectWudangEvents.length} 个`);
    console.log(`修炼线：${trainingEvents.length} 个`);
    
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
