/**
 * 游戏引擎集成器 - 将事件系统集成到游戏引擎
 * 
 * 功能：
 * - 事件选择（加权随机）
 * - 事件触发条件检查
 * - 事件效果执行
 * - 游戏状态管理
 * 
 * @version 1.0.0
 * @since 2026-03-12
 */

import { reactive, isReactive } from 'vue';
import { EventPriority } from '../types/eventTypes';
import type { EventDefinition, GameState, Effect } from '../types/eventTypes';
import { eventLoader } from './EventLoader';
import { EventExecutor } from './EventExecutor';
import { ConditionEvaluator, type Condition } from './ConditionEvaluator';
import { talentSystem } from './TalentSystem';
import { statGrowthSystem } from './StatGrowthSystem';

/**
 * 游戏引擎集成器类
 */
export class GameEngineIntegration {
  private eventExecutor: EventExecutor;
  private conditionEvaluator: ConditionEvaluator;
  private gameState: GameState;
  private maxEventsPerYear: number = 5; // 每年最多触发 5 个重大事件
  private eventsThisYear: number = 0;
  private lastYear: number = -1;
  
  constructor() {
    this.eventExecutor = new EventExecutor();
    this.conditionEvaluator = new ConditionEvaluator();
    // 初始化天赋系统
    talentSystem.loadTalents();
    // 先创建普通对象
    const initialState = this.createInitialState();
    // 然后包装为响应式
    this.gameState = reactive(initialState);
  }
  
  /**
   * 创建初始游戏状态
   */
  private createInitialState(): GameState {
    return {
      player: {
        name: '玩家',
        gender: 'male',
        age: 0,
        martialPower: 0,
        externalSkill: 0,
        internalSkill: 0,
        qinggong: 0,
        chivalry: 0,
        charisma: 0,
        constitution: 10,
        comprehension: 10,
        money: 100,
        reputation: 0,
        connections: 0,
        health: 100,
        energy: 100,
        alive: true,
        items: [],
        flags: {},
        events: [],
        relationships: [],
      },
      currentTime: {
        year: 1,
        month: 1,
        day: 1,
      },
      flags: {},
      events: [],
      relations: {},
    };
  }
  
  /**
   * 获取当前游戏状态（响应式）
   */
  public getGameState(): GameState {
    // 返回响应式对象的引用
    return this.gameState;
  }
  
  /**
   * 获取响应式游戏状态（用于 Vue 组件直接绑定）
   */
  public getReactiveGameState(): GameState {
    return this.gameState;
  }

  /**
   * 将新状态合并到响应式对象，避免丢失响应性
   */
  private applyGameState(nextState: GameState): void {
    if (!isReactive(this.gameState)) {
      this.gameState = reactive(nextState);
      return;
    }

    Object.assign(this.gameState, nextState);

    if (nextState.player) {
      if (!this.gameState.player) {
        this.gameState.player = nextState.player;
      } else {
        Object.assign(this.gameState.player, nextState.player);
        this.gameState.player.items = [...(nextState.player.items || [])];
        this.gameState.player.events = [...(nextState.player.events || [])];
        this.gameState.player.flags = { ...(nextState.player.flags || {}) };
        this.gameState.player.relationships = [...(nextState.player.relationships || [])];
      }
    } else {
      this.gameState.player = nextState.player;
    }

    if (nextState.currentTime) {
      if (!this.gameState.currentTime) {
        this.gameState.currentTime = nextState.currentTime;
      } else {
        Object.assign(this.gameState.currentTime, nextState.currentTime);
      }
    } else {
      this.gameState.currentTime = nextState.currentTime;
    }

    this.gameState.flags = { ...(nextState.flags || {}) };
    this.gameState.events = [...(nextState.events || [])];
    this.gameState.relations = { ...(nextState.relations || {}) };
  }
  
  /**
   * 设置玩家属性
   */
  public setPlayerAttributes(attrs: Partial<GameState['player']>): void {
    if (this.gameState.player) {
      Object.assign(this.gameState.player, attrs);
    }
  }
  
  /**
   * 根据年龄获取可用事件（加权随机选择）
   */
  public getAvailableEvents(age: number): EventDefinition[] {
    const events = eventLoader.getEventsByAge(age);
    
    // 过滤满足条件的事件
    const availableEvents = events.filter(event => {
      // 检查条件
      if (event.conditions && event.conditions.length > 0) {
        for (const condition of event.conditions) {
          if (!this.conditionEvaluator.evaluate(condition, this.gameState)) {
            return false;
          }
        }
      }
      
      // 检查是否已经发生过（对于只触发一次的事件）
      if (event.metadata?.tags?.includes('once')) {
        const hasOccurred = this.gameState.events.some(e => e.eventId === event.id);
        if (hasOccurred) {
          return false;
        }
      }
      
      return true;
    });
    
    // 按优先级排序
    availableEvents.sort((a, b) => {
      return (a.priority ?? EventPriority.NORMAL) - (b.priority ?? EventPriority.NORMAL);
    });
    
    return availableEvents;
  }
  
  /**
   * 选择一个事件（加权随机）
   */
  public selectEvent(age?: number): EventDefinition | null {
    // 如果没有传入年龄参数，使用游戏引擎当前年龄
    const currentAge = age !== undefined ? age : (this.gameState.player?.age || 0);
    
    // 检查年度事件数量限制
    if (!this.canTriggerEventThisYear(currentAge)) {
      console.log(`[GameEngine] 年龄 ${currentAge} 岁已达到本年度事件上限 (${this.maxEventsPerYear}个)，跳过事件触发`);
      return null;
    }
    
    const availableEvents = this.getAvailableEvents(currentAge);
    
    if (availableEvents.length === 0) {
      return null;
    }
    
    // 过滤掉已触发的事件（所有事件都只触发一次）
    const triggeredEventIds = new Set(this.gameState.player?.events.map(e => e.eventId) || []);
    const untriggeredEvents = availableEvents.filter(event => {
      // 如果事件已经触发过，则过滤掉
      if (triggeredEventIds.has(event.id)) {
        return false;
      }
      
      // 对于选择事件，检查是否至少有一个选项可用
      if (event.eventType === 'choice' && event.choices) {
        const availableChoices = event.choices.filter(choice => {
          if (!choice.condition) return true;
          try {
            return this.conditionEvaluator.evaluate(choice.condition, this.gameState);
          } catch (error) {
            console.warn(`[GameEngine] 评估条件失败：${choice.id}`, error);
            return false;
          }
        });
        // 如果没有可用选项，过滤掉这个事件
        if (availableChoices.length === 0) {
          console.log(`[GameEngine] 事件 ${event.id} 没有可用选项，过滤掉`);
          return false;
        }
        return true;
      }
      
      return true;
    });
    
    if (untriggeredEvents.length === 0) {
      return null;
    }
    
    // 如果只有一个事件，直接返回
    if (untriggeredEvents.length === 1) {
      return untriggeredEvents[0];
    }
    
    // 加权随机选择
    const totalWeight = untriggeredEvents.reduce((sum, event) => {
      return sum + eventLoader.getWeightForAge(event, currentAge);
    }, 0);
    
    let random = Math.random() * totalWeight;
    
    for (const event of untriggeredEvents) {
      random -= eventLoader.getWeightForAge(event, currentAge);
      if (random <= 0) {
        return event;
      }
    }
    
    // 兜底：返回最后一个
    return untriggeredEvents[untriggeredEvents.length - 1];
  }
  
  /**
   * 检查今年是否还能触发事件
   */
  private canTriggerEventThisYear(currentAge: number): boolean {
    // 如果年份变化，重置计数器
    if (currentAge !== this.lastYear) {
      this.lastYear = currentAge;
      this.eventsThisYear = 0;
    }
    
    // 检查是否达到年度事件上限
    return this.eventsThisYear < this.maxEventsPerYear;
  }
  
  /**
   * 记录事件触发（用于年度事件限制）
   */
  private recordEventTrigger(): void {
    const currentAge = this.gameState.player?.age || 0;
    
    // 如果年份变化，重置计数器
    if (currentAge !== this.lastYear) {
      this.lastYear = currentAge;
      this.eventsThisYear = 0;
    }
    
    this.eventsThisYear++;
    console.log(`[GameEngine] 年龄 ${currentAge} 岁本年度已触发 ${this.eventsThisYear}/${this.maxEventsPerYear} 个事件`);
  }
  
  /**
   * 执行自动事件
   */
  public async executeAutoEvent(event: EventDefinition): Promise<GameState> {
    if (!event.autoEffects || event.autoEffects.length === 0) {
      return this.gameState;
    }
    
    // 记录事件前的年龄
    const ageBeforeEvent = this.gameState.player?.age || 0;
    
    // 执行效果
    const updatedState = await this.eventExecutor.executeEffects(
      event.autoEffects,
      this.gameState
    );
    this.applyGameState(updatedState);
    
    // 记录事件触发（用于年度事件限制）
    this.recordEventTrigger();
    
    // 记录事件到玩家历史（使用事件前的年龄）
    if (this.gameState.player) {
      this.gameState.player.events.push({
        eventId: event.id,
        triggeredAt: this.gameState.currentTime.year,
        age: ageBeforeEvent
      });
      console.log(`[GameEngine] 事件已记录：${event.id} at age ${ageBeforeEvent}, total events: ${this.gameState.player.events.length}`);
    }
    
    return this.gameState;
  }
  
  /**
   * 执行选择事件的效果
   */
  public async executeChoiceEffects(effects: Effect[], eventId?: string): Promise<GameState> {
    // 记录事件前的年龄
    const ageBeforeEvent = this.gameState.player?.age || 0;
    
    const updatedState = await this.eventExecutor.executeEffects(effects, this.gameState);
    this.applyGameState(updatedState);
    
    // 记录事件触发（用于年度事件限制）
    if (eventId) {
      this.recordEventTrigger();
    }
    
    // 记录事件到玩家历史（使用事件前的年龄）
    if (eventId && this.gameState.player) {
      this.gameState.player.events.push({
        eventId,
        triggeredAt: this.gameState.currentTime.year,
        age: ageBeforeEvent
      });
      console.log(`[GameEngine] 选择事件已记录：${eventId} at age ${ageBeforeEvent}, total events: ${this.gameState.player.events.length}`);
    }
    
    return this.gameState;
  }
  
  /**
   * 检查选择是否可用
   */
  public isChoiceAvailable(condition: Condition | undefined): boolean {
    if (!condition) {
      return true;
    }
    
    return this.conditionEvaluator.evaluate(condition, this.gameState);
  }
  
  /**
   * 开始新游戏
   */
  public startNewGame(name: string, gender: 'male' | 'female'): void {
    const nextState = this.createInitialState();
    this.applyGameState(nextState);
    
    if (this.gameState.player) {
      this.gameState.player.name = name;
      this.gameState.player.gender = gender;
    }
    
    console.log(`[GameEngine] 新游戏开始：${name} (${gender})`);
  }
  
  /**
   * 重置游戏引擎
   */
  public reset(): void {
    this.applyGameState(this.createInitialState());
    console.log(`[GameEngine] 游戏引擎已重置`);
  }
  
  /**
   * 重置游戏
   */
  public resetGame(): void {
    this.applyGameState(this.createInitialState());
    console.log('[GameEngine] 游戏已重置');
  }
  
  /**
   * 推进时间
   */
  public advanceTime(value: number = 1, unit: 'year' | 'month' | 'day' = 'year'): void {
    if (!this.gameState.player) return;

    const currentTime = this.gameState.currentTime || { year: 1, month: 1, day: 1 };
    let year = currentTime.year;
    let month = currentTime.month;
    let day = currentTime.day;
    let age = this.gameState.player.age;

    if (unit === 'year') {
      year += value;
      age += value;
    } else if (unit === 'month') {
      month += value;
      while (month > 12) {
        month -= 12;
        year += 1;
        age += 1;
      }
    } else {
      day += value;
      while (day > 30) {
        day -= 30;
        month += 1;
        if (month > 12) {
          month = 1;
          year += 1;
          age += 1;
        }
      }
    }

    this.gameState.player.age = age;
    this.gameState.currentTime = { year, month, day };
    
    const unitLabel = unit === 'year' ? '年' : unit === 'month' ? '月' : '天';
    console.log(`[GameEngine] 时间推进 ${value} ${unitLabel}`);
  }
}

// 导出单例
export const gameEngine = new GameEngineIntegration();
