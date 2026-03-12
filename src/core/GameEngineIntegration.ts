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

import { EventDefinition, GameState, Effect, EventPriority } from '../types/eventTypes';
import { eventLoader } from './EventLoader';
import { EventExecutor } from './EventExecutor';
import { ConditionEvaluator, type Condition } from './ConditionEvaluator';

/**
 * 游戏引擎集成器类
 */
export class GameEngineIntegration {
  private eventExecutor: EventExecutor;
  private conditionEvaluator: ConditionEvaluator;
  private gameState: GameState;
  
  constructor() {
    this.eventExecutor = new EventExecutor();
    this.conditionEvaluator = new ConditionEvaluator();
    this.gameState = this.createInitialState();
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
        money: 100,
        health: 100,
        energy: 100,
        alive: true,
        items: [],
        flags: {},
        events: [],
      },
      currentTime: {
        year: 1,
        month: 1,
        day: 1,
      },
      flags: {},
      events: [],
    };
  }
  
  /**
   * 获取当前游戏状态
   */
  public getGameState(): GameState {
    // 返回深拷贝，避免状态污染
    return JSON.parse(JSON.stringify(this.gameState));
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
      return sum + (event.weight || 1);
    }, 0);
    
    let random = Math.random() * totalWeight;
    
    for (const event of untriggeredEvents) {
      random -= (event.weight || 1);
      if (random <= 0) {
        return event;
      }
    }
    
    // 兜底：返回最后一个
    return untriggeredEvents[untriggeredEvents.length - 1];
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
    this.gameState = await this.eventExecutor.executeEffects(
      event.autoEffects,
      this.gameState
    );
    
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
    
    this.gameState = await this.eventExecutor.executeEffects(effects, this.gameState);
    
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
    this.gameState = this.createInitialState();
    
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
    this.gameState = this.createInitialState();
    console.log(`[GameEngine] 游戏引擎已重置`);
  }
  
  /**
   * 重置游戏
   */
  public resetGame(): void {
    this.gameState = this.createInitialState();
    console.log('[GameEngine] 游戏已重置');
  }
  
  /**
   * 推进时间
   */
  public advanceTime(years: number = 1): void {
    if (this.gameState.player) {
      this.gameState.player.age += years;
    }
    
    if (this.gameState.currentTime) {
      this.gameState.currentTime.year += years;
    }
    
    console.log(`[GameEngine] 时间推进 ${years} 年`);
  }
}

// 导出单例
export const gameEngine = new GameEngineIntegration();
