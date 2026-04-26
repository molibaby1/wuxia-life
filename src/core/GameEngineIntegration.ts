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
import type { EventDefinition, GameState, Effect, PlayerIdentity } from '../types/eventTypes';
import { eventLoader } from './EventLoader';
import { EventExecutor } from './EventExecutor';
import { ConditionEvaluator, type Condition } from './ConditionEvaluator';
import { talentSystem } from './TalentSystem';
import { statGrowthSystem } from './StatGrowthSystem';
import { CriticalChoiceSystem } from './CriticalChoiceSystem';
import { LifePathManager } from './LifePathSystem';
import { difficultyManager } from './DifficultyManager';
import { difficultyMonitor } from './DifficultyMonitor';
import { checkReputationGate } from './ReputationGateSystem';
import { calculateFailureProbabilityForEvent, rollForFailure } from './ChallengeSystem';
import { checkSetbackEvents, applySetbackEffects, clearExpiredSetbacks } from './SetbackEventSystem';
import { traitSystem } from './TraitSystem';
import { dailyEventSystem } from './DailyEventSystem';

/**
 * 游戏引擎集成器类
 */
export class GameEngineIntegration {
  private eventExecutor: EventExecutor;
  private conditionEvaluator: ConditionEvaluator;
  private gameState: GameState;
  private maxEventsPerYear: number = 100; // 仅作兜底保护，实际节奏由动态权重控制
  private eventsThisYear: number = 0;
  private lastYear: number = -1;
  private annualEventPressure: number = 0;
  private eventCooldown: Map<string, number> = new Map(); // 事件冷却时间记录
  private activeStoryLines: Set<string> = new Set(); // 当前激活的剧情线
  private pendingEventOutcomeNote: string | null = null;
  
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
        charisma: 10,
        constitution: 10,
        comprehension: 10,
        knowledge: 10,
        businessAcumen: 10,
        influence: 0,
        sect: null,
        title: null,
        martialHeritage: 0,
        scholarlyHeritage: 0,
        merchantNetwork: 0,
        money: 100,
        reputation: 0,
        connections: 0,
        children: 0,
        spouse: null,
        health: 100,
        energy: 100,
        alive: true,
        items: [],
        flags: {},
        events: [],
        relationships: [],
        lifeStates: traitSystem.createInitialLifeStates(),
      },
      currentTime: {
        year: 1,
        month: 1,
        day: 1,
      },
      flags: {},
      events: [],
      eventHistory: [],
      relations: {},
      statistics: {
        totalEvents: 0,
        totalChoices: 0,
        totalYears: 0,
      },
      // 新增字段
      identity: {
        identities: [],
        primary: 'none'
      },
      karma: {
        good_karma: 0,
        evil_karma: 0,
        history: [],
      },
      criticalChoices: {},
      achievements: [],
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
   * 添加身份（支持多身份）
   */
  public addIdentity(identity: PlayerIdentity): void {
    if (!this.gameState.identity) {
      this.gameState.identity = {
        identities: [],
        primary: 'none'
      };
    }
    
    if (!this.gameState.identity.identities.includes(identity)) {
      this.gameState.identity.identities.push(identity);
      
      if (this.gameState.identity.primary === 'none') {
        this.gameState.identity.primary = identity;
      }
    }
  }
  
  /**
   * 移除身份
   */
  public removeIdentity(identity: PlayerIdentity): void {
    if (!this.gameState.identity) return;
    
    const index = this.gameState.identity.identities.indexOf(identity);
    if (index > -1) {
      this.gameState.identity.identities.splice(index, 1);
      
      if (this.gameState.identity.primary === identity) {
        this.gameState.identity.primary = this.gameState.identity.identities[0] || 'none';
      }
    }
  }
  
  /**
   * 检查是否拥有指定身份
   */
  public hasIdentity(identity: PlayerIdentity): boolean {
    if (!this.gameState.identity) return false;
    return this.gameState.identity.identities.includes(identity);
  }
  
  /**
   * 获取所有身份
   */
  public getIdentities(): PlayerIdentity[] {
    if (!this.gameState.identity) return [];
    return this.gameState.identity.identities;
  }

  /**
   * 将新状态合并到响应式对象，避免丢失响应性
   */
  private applyGameState(nextState: GameState): void {
    if (!isReactive(this.gameState)) {
      this.gameState = reactive(nextState);
      return;
    }

    // 记录更新前的属性值
    const oldMartialPower = this.gameState.player?.martialPower;
    const oldMoney = this.gameState.player?.money;
    
    // 逐个属性更新，确保触发响应式
    if (nextState.player) {
      if (!this.gameState.player) {
        this.gameState.player = reactive(nextState.player);
      } else {
        // 逐个更新 player 的属性，确保响应式触发
        const player = this.gameState.player;
        player.name = nextState.player.name;
        player.gender = nextState.player.gender;
        player.age = nextState.player.age;
        player.martialPower = nextState.player.martialPower;
        player.externalSkill = nextState.player.externalSkill;
        player.internalSkill = nextState.player.internalSkill;
        player.qinggong = nextState.player.qinggong;
        player.chivalry = nextState.player.chivalry;
        player.charisma = nextState.player.charisma;
        player.constitution = nextState.player.constitution;
        player.comprehension = nextState.player.comprehension;
        player.knowledge = nextState.player.knowledge;
        player.businessAcumen = nextState.player.businessAcumen;
        player.influence = nextState.player.influence;
        player.martialHeritage = nextState.player.martialHeritage;
        player.scholarlyHeritage = nextState.player.scholarlyHeritage;
        player.merchantNetwork = nextState.player.merchantNetwork;
        player.money = nextState.player.money;
        player.reputation = nextState.player.reputation;
        player.connections = nextState.player.connections;
        player.sect = nextState.player.sect;
        player.title = nextState.player.title;
        player.health = nextState.player.health;
        player.energy = nextState.player.energy;
        player.children = nextState.player.children;
        player.spouse = nextState.player.spouse;
        player.alive = nextState.player.alive;
        player.items = [...(nextState.player.items || [])];
        player.events = [...(nextState.player.events || [])];
        player.flags = { ...(nextState.player.flags || {}) };
        player.relationships = [...(nextState.player.relationships || [])];
        player.traitProfile = nextState.player.traitProfile ? { ...nextState.player.traitProfile } : undefined;
        player.lifeStates = nextState.player.lifeStates ? { ...nextState.player.lifeStates } : traitSystem.createInitialLifeStates();
        player.growthBiasSummary = [...(nextState.player.growthBiasSummary || [])];
      }
    }

    if (nextState.currentTime) {
      if (!this.gameState.currentTime) {
        this.gameState.currentTime = reactive(nextState.currentTime);
      } else {
        this.gameState.currentTime.year = nextState.currentTime.year;
        this.gameState.currentTime.month = nextState.currentTime.month;
        this.gameState.currentTime.day = nextState.currentTime.day;
      }
    }

    this.gameState.flags = { ...(nextState.flags || {}) };
    this.gameState.events = [...(nextState.events || [])];
    if (nextState.eventHistory && nextState.eventHistory.length > 0) {
      this.gameState.eventHistory = [...(nextState.eventHistory || [])];
    }
    this.gameState.relations = { ...(nextState.relations || {}) };
    
    // 记录更新后的属性值，确认数据确实在变化
    const newMartialPower = this.gameState.player?.martialPower;
    const newMoney = this.gameState.player?.money;
    
    if (oldMartialPower !== newMartialPower || oldMoney !== newMoney) {
      console.log(`[GameEngine] 属性更新：功力 ${oldMartialPower}→${newMartialPower}, 银两 ${oldMoney}→${newMoney}`);
    }
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
    
    // 初始化人生轨迹
    if (!this.gameState.lifePath) {
      this.gameState = LifePathManager.initialize(this.gameState);
    }
    
    // 更新人生阶段
    this.gameState = LifePathManager.updateLifeStage(this.gameState);
    
    // 过滤满足条件的事件
    const availableEvents = events.filter(event => {
      // 1. 统一运行时门禁：conditions + thresholds + legacy triggerConditions
      if (!this.passesRuntimeEventGuards(event, this.gameState)) {
        return false;
      }
      
      // 2. 检查是否已经发生过（对于只触发一次的事件）
      if (event.metadata?.tags?.includes('once')) {
        const eventHistory = this.gameState.eventHistory || [];
        const hasOccurred = eventHistory.some(e => e.eventId === event.id);
        if (hasOccurred) {
          return false;
        }
      }
      
      // 3. 检查人生轨迹兼容性（新增）
      if (!LifePathManager.canTriggerEvent(this.gameState, event)) {
        return false;
      }
      
      // 4. 检查属性门槛（新增）
      if (event.requirements?.attributes) {
        if (!this.checkAttributeRequirements(event.requirements.attributes, this.gameState.player)) {
          return false;
        }
      }
      
      // 6. 检查事件冷却时间（新增）
      if (!this.checkEventCooldown(event)) {
        return false;
      }
      
      // 6. 检查剧情线密度（新增）
      if (!this.checkStoryLineDensity(event)) {
        return false;
      }
      
      // 7. 检查故事线保底触发（新增）
      if (!this.checkStoryLineGuarantee(event)) {
        return false;
      }
      
      return true;
    });
    
    // 按优先级排序
    availableEvents.sort((a, b) => {
      return (b.priority ?? EventPriority.NORMAL) - (a.priority ?? EventPriority.NORMAL);
    });
    
    // 限制每年触发的事件数量（密度控制）
    const MAX_EVENTS_PER_YEAR = 3;
    const limitedEvents = availableEvents.slice(0, MAX_EVENTS_PER_YEAR);
    
    return limitedEvents;
  }

  /**
   * 运行时事件门禁统一入口
   * - conditions: 受控表达式评估器
   * - thresholds: 结构化门槛（属性/背景/经历/身份）
   * - triggerConditions: 兼容旧数据的触发门槛（交由 EventExecutor 统一校验）
   */
  private passesRuntimeEventGuards(event: EventDefinition, gameState: GameState): boolean {
    try {
      if (event.conditions && event.conditions.length > 0) {
        for (const condition of event.conditions) {
          if (!this.conditionEvaluator.evaluate(condition, gameState)) {
            return false;
          }
        }
      }

      if (!this.checkThresholds(event, gameState)) {
        return false;
      }

      if (!EventExecutor.canTriggerEvent(event, gameState)) {
        return false;
      }

      return true;
    } catch (error) {
      console.warn(`[GameEngine] Runtime condition guard failed for event "${event.id}"`, error);
      return false;
    }
  }
  
  /**
   * 检查属性门槛
   */
  private checkAttributeRequirements(
    requirements: any,
    player: GameState['player']
  ): boolean {
    if (!player) return false;
    
    for (const [attr, value] of Object.entries(requirements)) {
      const playerValue = (player as any)[attr] || 0;
      
      if (typeof value === 'number') {
        // 要求属性 >= 某值
        if (playerValue < value) {
          return false;
        }
      } else if (typeof value === 'object' && value !== null) {
        const range = value as { min?: number; max?: number };
        // 支持范围检查 { min: 20, max: 50 }
        if (range.min !== undefined && playerValue < range.min) {
          return false;
        }
        if (range.max !== undefined && playerValue > range.max) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  /**
   * 检查触发门槛 - 包括背景、经历、身份等
   */
  private checkThresholds(event: EventDefinition, gameState: GameState): boolean {
    const thresholds = event.thresholds;
    if (!thresholds) {
      return true; // 没有门槛设置，直接通过
    }
    
    const player = gameState.player;
    const flags = player?.flags || {};
    const eventHistory = gameState.eventHistory || [];
    const triggeredEvents = new Set(eventHistory.map(e => e.eventId));
    
    // 1. 检查属性门槛
    if (thresholds.attributes) {
      for (const [attr, config] of Object.entries(thresholds.attributes)) {
        const playerValue = (player as any)[attr] || 0;
        if (config.min !== undefined && playerValue < config.min) {
          return false;
        }
        if (config.max !== undefined && playerValue > config.max) {
          return false;
        }
      }
    }
    
    // 2. 检查背景门槛
    if (thresholds.background) {
      const bg = thresholds.background;
      const evaluation = bg.evaluation || 'at_least_one';
      
      // 获取玩家的背景标签（origin_ 开头或 bornIn 开头）
      const playerBackgrounds: string[] = [];
      for (const [key, value] of Object.entries(flags)) {
        if ((key.startsWith('origin_') || key.startsWith('bornIn')) && value === true) {
          playerBackgrounds.push(key);
        }
      }
      
      // 也检查 gameState.player 中的背景字段
      const player = gameState.player;
      if (player) {
        if ((player as any).bornInWuxiaFamily === true) playerBackgrounds.push('bornInWuxiaFamily');
        if ((player as any).bornInScholarFamily === true) playerBackgrounds.push('bornInScholarFamily');
        if ((player as any).bornInMerchantFamily === true) playerBackgrounds.push('bornInMerchantFamily');
        if ((player as any).originBackground === 'wuxia') playerBackgrounds.push('origin_wuxia_family');
        if ((player as any).originBackground === 'scholar') playerBackgrounds.push('origin_scholar_family');
        if ((player as any).originBackground === 'merchant') playerBackgrounds.push('origin_merchant_family');
      }
      
      if (bg.required && bg.required.length > 0) {
        if (evaluation === 'all') {
          // 需要满足所有指定的背景
          for (const required of bg.required) {
            if (!playerBackgrounds.includes(required)) {
              return false;
            }
          }
        } else if (evaluation === 'at_least_one') {
          // 至少满足一个背景
          const hasMatch = bg.required.some(bg => playerBackgrounds.includes(bg));
          if (!hasMatch) {
            return false;
          }
        }
      }
      
      if (bg.forbidden && bg.forbidden.length > 0) {
        // 不能有指定的背景
        const hasForbidden = bg.forbidden.some(bg => playerBackgrounds.includes(bg));
        if (hasForbidden) {
          return false;
        }
      }
    }
    
    // 3. 检查经历门槛
    if (thresholds.experience) {
      const exp = thresholds.experience;
      const evaluation = exp.evaluation || 'at_least_one';
      
      if (exp.required && exp.required.length > 0) {
        if (evaluation === 'all') {
          for (const requiredEvent of exp.required) {
            if (!triggeredEvents.has(requiredEvent)) {
              return false;
            }
          }
        } else if (evaluation === 'at_least_one') {
          const hasExp = exp.required.some(e => triggeredEvents.has(e));
          if (!hasExp) {
            return false;
          }
        }
      }
      
      if (exp.forbidden && exp.forbidden.length > 0) {
        const hasForbidden = exp.forbidden.some(e => triggeredEvents.has(e));
        if (hasForbidden) {
          return false;
        }
      }
    }
    
    // 4. 检查身份门槛
    if (thresholds.identity) {
      const id = thresholds.identity;
      const currentIdentity = gameState.identity?.primary;
      
      if (id.required && id.required.length > 0) {
        if (!currentIdentity || !id.required.includes(currentIdentity)) {
          return false;
        }
      }
      
      if (id.forbidden && id.forbidden.length > 0) {
        if (currentIdentity && id.forbidden.includes(currentIdentity)) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  /**
   * 检查事件冷却时间
   */
  private checkEventCooldown(event: EventDefinition): boolean {
    // 使用 eventHistory 而不是 player.events
    const eventHistory = this.gameState.eventHistory || [];
    const triggerHistory = eventHistory.filter(e => e.eventId === event.id);
    
    const currentAge = this.gameState.player?.age || 0;
    
    // 获取最大触发次数（默认1次，即只触发一次）
    const maxTriggers = event.maxTriggers ?? 1;
    const triggerCount = triggerHistory.length;
    
    // 调试日志
    if (event.id === 'merchant_empire' || event.id === 'hero_become_legend') {
      const eventHistory = this.gameState.eventHistory || [];
    }
    
    // 检查最大触发次数 - 如果已达到上限，直接返回false
    if (triggerCount >= maxTriggers) {
      return false;
    }
    
    if (!triggerHistory.length) {
      return true; // 第一次触发，无冷却
    }
    
    const lastTriggered = triggerHistory[triggerHistory.length - 1];
    const yearsPassed = currentAge - lastTriggered.age;
    
    // 获取冷却时间（默认 2 年）
    const cooldown = event.cooldown ?? 2;
    
    if (yearsPassed < cooldown) {
      return false;
    }
    
    return true;
  }
  
  /**
   * 检查剧情线密度
   * 防止同一条剧情线的事件过于密集
   * 
   * 注意：已移除密度限制，允许剧情线事件连续触发
   */
  private checkStoryLineDensity(event: EventDefinition): boolean {
    // 移除密度限制 - 允许剧情线事件连续触发
    // const storyLine = event.storyLine;
    // if (!storyLine) {
    //   return true;
    // }
    // 
    // const currentAge = this.gameState.player?.age || 0;
    // const recentEvents = this.gameState.player?.events
    //   .filter(e => {
    //     const eventDef = eventLoader.getEventById(e.eventId);
    //     return eventDef?.storyLine === storyLine;
    //   })
    //   .sort((a, b) => b.age - a.age);
    // 
    // if (recentEvents.length === 0) {
    //   return true;
    // }
    // 
    // const lastEventAge = recentEvents[0].age;
    // const yearsPassed = currentAge - lastEventAge;
    // const minInterval = 1;
    // 
    // if (yearsPassed < minInterval) {
    //   console.log(`[StoryLine] ${storyLine} 密度过高：距离上次事件 ${yearsPassed} 年，需要间隔 ${minInterval} 年`);
    //   return false;
    // }
    
    return true;  // 始终返回 true，不限制密度
  }
  
  /**
   * 检查故事线保底触发
   * 如果一条故事线中断太久，强制触发下一个事件
   */
  private checkStoryLineGuarantee(event: EventDefinition): boolean {
    const storyLine = event.storyLine;
    if (!storyLine) {
      return true; // 没有剧情线标签，不检查
    }
    
    const currentAge = this.gameState.player?.age || 0;
    const eventHistory = this.gameState.eventHistory || [];
    
    // 获取这条故事线的所有事件
    const storyLineEvents = eventHistory
      .filter(e => {
        const eventDef = eventLoader.getEventById(e.eventId);
        return eventDef?.storyLine === storyLine;
      })
      .sort((a, b) => a.age - b.age);
    
    if (storyLineEvents.length === 0) {
      return true; // 这条线还没开始
    }
    
    const lastEventAge = storyLineEvents[storyLineEvents.length - 1].age;
    const yearsPassed = currentAge - lastEventAge;
    
    // 如果距离上个事件已经 3 年以上，强制触发这条线的下一个事件
    const guaranteeThreshold = 3;
    
    if (yearsPassed >= guaranteeThreshold) {
      return true; // 允许触发
    }
    
    return true;
  }
  
  /**
   * 获取玩家当前主导路径
   */
  private getDominantPaths(): string[] {
    const flags = this.gameState.player?.flags || {};
    const paths: string[] = [];
    
    // 检查学者路径
    if (flags.scholar_path || flags.origin_scholar_family || 
        (this.gameState.player?.comprehension || 0) >= 50) {
      paths.push('scholar');
    }
    
    // 检查商人路径
    if (flags.merchant_path || flags.origin_merchant_family ||
        (this.gameState.player?.money || 0) >= 500) {
      paths.push('merchant');
    }
    
    // 检查武者路径
    if (flags.martial_path || flags.origin_wuxia_family ||
        (this.gameState.player?.martialPower || 0) >= 50) {
      paths.push('martial_artist');
    }
    
    // 检查魔道路径
    if (flags.demon_path || flags.sect_faction === 'unconventional' ||
        flags.unconventional_member) {
      paths.push('demon');
    }
    
    // 检查官员路径
    if (flags.official_path || flags.civil_service_passed ||
        (this.gameState.player?.reputation || 0) >= 100) {
      paths.push('official');
    }
    
    // 检查隐士路径
    if (flags.hermit_path || (this.gameState.player?.chivalry || 0) >= 80) {
      paths.push('hermit');
    }
    
    return paths;
  }

  /**
   * 检查事件是否与当前主导路径冲突
   */
  private isPathConflicting(event: EventDefinition, dominantPaths: string[]): boolean {
    const eventPath = event.metadata?.pathAffinity;
    const eventConflicts = event.metadata?.pathConflicts;
    
    if (!eventPath && !eventConflicts) {
      return false; // 没有路径信息的事件不冲突
    }
    
    // 检查事件是否与主导路径强烈冲突
    if (eventConflicts) {
      for (const path of dominantPaths) {
        const conflictLevel = eventConflicts[path];
        if (conflictLevel && conflictLevel > 50) {
          // 强烈冲突的事件直接过滤掉
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * 根据路径兼容性调整事件权重
   */
  private adjustWeightByPath(event: EventDefinition, baseWeight: number, dominantPaths: string[]): number {
    const eventPath = event.metadata?.pathAffinity;
    const eventConflicts = event.metadata?.pathConflicts;
    
    if (!eventPath && !eventConflicts) {
      return baseWeight; // 没有路径信息的事件保持原权重
    }
    
    let adjustedWeight = baseWeight;
    
    // 检查与主导路径的亲和性
    if (eventPath) {
      for (const path of dominantPaths) {
        const affinity = eventPath[path];
        if (affinity) {
          adjustedWeight *= (1 + affinity / 100); // 亲和性提升权重
        }
      }
    }
    
    // 检查与主导路径的冲突性
    if (eventConflicts) {
      for (const path of dominantPaths) {
        const conflictLevel = eventConflicts[path];
        if (conflictLevel) {
          if (conflictLevel > 80) {
            adjustedWeight *= 0.05; // 极度冲突
          } else if (conflictLevel > 50) {
            adjustedWeight *= 0.2; // 强烈冲突
          } else if (conflictLevel > 20) {
            adjustedWeight *= 0.5; // 中等冲突
          } else {
            adjustedWeight *= 0.8; // 轻微冲突
          }
        }
      }
    }
    
    return Math.max(adjustedWeight, 1); // 确保最小权重为 1
  }

  /**
   * 根据现有字段推导事件重要程度。
   * 数值越高，表示该事件越容易压低同年后续事件的触发概率。
   */
  private getEventIntensity(event: EventDefinition): number {
    let intensity = 0.35;

    if (event.eventType === 'choice') {
      intensity += 0.15;
    }

    switch (event.priority) {
      case EventPriority.CRITICAL:
        intensity += 0.9;
        break;
      case EventPriority.HIGH:
        intensity += 0.65;
        break;
      case EventPriority.NORMAL:
        intensity += 0.35;
        break;
      case EventPriority.LOW:
      default:
        intensity += 0.15;
        break;
    }

    switch (event.category) {
      case 'main_story':
        intensity += 0.65;
        break;
      case 'special_event':
        intensity += 0.45;
        break;
      case 'side_quest':
        intensity += 0.25;
        break;
      case 'daily_event':
      case 'random_encounter':
        intensity += 0.05;
        break;
      default:
        intensity += 0.15;
        break;
    }

    if (event.storyLine) {
      intensity += 0.15;
    }

    if (event.isSetbackEvent) {
      const setbackBoost: Record<string, number> = {
        minor: 0.15,
        moderate: 0.3,
        severe: 0.45,
        critical: 0.7,
      };
      intensity += setbackBoost[event.setbackSeverity || 'moderate'] || 0.3;
    }

    const tags = event.metadata?.tags || [];
    if (tags.includes('major') || tags.includes('final')) {
      intensity += 0.45;
    }
    if (tags.includes('once')) {
      intensity += 0.1;
    }

    return Math.max(0.25, intensity);
  }

  /**
   * 基于当年已发生事件的累计压力，动态下调候选事件权重。
   * 不是硬性禁止，而是自然抑制同一年连出多个重大事件。
   */
  private adjustWeightByAnnualPressure(event: EventDefinition, baseWeight: number): number {
    if (this.annualEventPressure <= 0) {
      return baseWeight;
    }

    const candidateIntensity = this.getEventIntensity(event);
    const decay = Math.exp(-this.annualEventPressure * candidateIntensity * 0.45);
    const minimumMultiplier = event.priority === EventPriority.CRITICAL ? 0.2 : 0.08;
    const multiplier = Math.max(minimumMultiplier, decay);

    return Math.max(baseWeight * multiplier, 1);
  }

  private isDailyEvent(event: EventDefinition): boolean {
    return event.category === 'daily_event' || event.metadata?.tags?.includes('daily_pool') === true;
  }

  private isMandatoryEvent(event: EventDefinition): boolean {
    const tags = (event.metadata?.tags || []).map(tag => tag.toLowerCase());
    return (
      event.priority === EventPriority.CRITICAL ||
      event.category === 'main_story' ||
      tags.includes('critical') ||
      tags.includes('mandatory') ||
      tags.includes('mainline')
    );
  }

  private isCriticalLayerEvent(event: EventDefinition): boolean {
    return this.isMandatoryEvent(event);
  }

  private isStorylineLayerEvent(event: EventDefinition): boolean {
    return Boolean(event.storyLine) && !this.isCriticalLayerEvent(event);
  }

  private splitEventLayers(events: EventDefinition[]): {
    criticalEvents: EventDefinition[];
    storylineEvents: EventDefinition[];
    regularFormalEvents: EventDefinition[];
  } {
    const criticalEvents = events.filter(event => this.isCriticalLayerEvent(event));
    const storylineEvents = events.filter(event => this.isStorylineLayerEvent(event));
    const regularFormalEvents = events.filter(
      event => !this.isCriticalLayerEvent(event) && !this.isStorylineLayerEvent(event)
    );
    return { criticalEvents, storylineEvents, regularFormalEvents };
  }

  private pickWeightedFormalEvent(
    events: EventDefinition[],
    currentAge: number,
    dominantPaths: string[]
  ): EventDefinition | null {
    if (events.length === 0) {
      return null;
    }

    if (events.length === 1) {
      return events[0];
    }

    const totalWeight = events.reduce((sum, event) => {
      const baseWeight = eventLoader.getWeightForAge(event, currentAge);
      const pathAdjusted = this.adjustWeightByPath(event, baseWeight, dominantPaths);
      const traitAdjusted = pathAdjusted * traitSystem.getEventWeightMultiplier(this.gameState.player, event);
      const stateAdjusted = traitAdjusted * this.getFormalEventStateMultiplier(event);
      const specializationAdjusted = stateAdjusted * this.getSpecializationMultiplier(event);
      const repetitionAdjusted = specializationAdjusted * this.getFormalRepetitionSuppressionMultiplier(event);
      return sum + this.adjustWeightByAnnualPressure(event, repetitionAdjusted);
    }, 0);

    if (totalWeight <= 0) {
      return events[events.length - 1];
    }

    let random = Math.random() * totalWeight;

    for (const event of events) {
      const pathAdjusted = this.adjustWeightByPath(event, eventLoader.getWeightForAge(event, currentAge), dominantPaths);
      const traitAdjusted = pathAdjusted * traitSystem.getEventWeightMultiplier(this.gameState.player, event);
      const stateAdjusted = traitAdjusted * this.getFormalEventStateMultiplier(event);
      const specializationAdjusted = stateAdjusted * this.getSpecializationMultiplier(event);
      const repetitionAdjusted = specializationAdjusted * this.getFormalRepetitionSuppressionMultiplier(event);
      random -= this.adjustWeightByAnnualPressure(event, repetitionAdjusted);
      if (random <= 0) {
        return event;
      }
    }

    return events[events.length - 1];
  }

  private detectSuppressionClass(event: EventDefinition): 'injury' | 'illness' | 'economy' | null {
    const tags = (event.metadata?.tags || []).map(tag => tag.toLowerCase());
    const textBlob = [event.id, event.content?.title, event.content?.description, ...tags]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (tags.includes('injury') || /injury|wound|受伤|创伤|伤势/.test(textBlob)) {
      return 'injury';
    }
    if (tags.includes('illness') || /illness|disease|sick|病|生病|疾病/.test(textBlob)) {
      return 'illness';
    }
    if (tags.includes('economy') || /economy|merchant|business|trade|money|经济|商|银两|钱|财/.test(textBlob)) {
      return 'economy';
    }
    return null;
  }

  private isHighNegativeEvent(event: EventDefinition): boolean {
    const tags = (event.metadata?.tags || []).map(tag => tag.toLowerCase());
    if (event.isSetbackEvent && ['severe', 'critical'].includes(event.setbackSeverity || '')) {
      return true;
    }
    if (tags.some(tag => ['negative', 'setback', 'loss', 'injury', 'illness'].includes(tag))) {
      return true;
    }
    return event.priority === EventPriority.HIGH || event.priority === EventPriority.CRITICAL;
  }

  private getFormalRepetitionSuppressionMultiplier(event: EventDefinition): number {
    if (this.isDailyEvent(event) || this.isMandatoryEvent(event)) {
      return 1;
    }

    const suppressionClass = this.detectSuppressionClass(event);
    if (!suppressionClass || !this.isHighNegativeEvent(event)) {
      return 1;
    }

    const currentAge = this.gameState.player?.age || 0;
    const eventHistory = this.gameState.eventHistory || [];
    if (eventHistory.length === 0) {
      return 1;
    }

    let recentSameClass = 0;
    let recentSameEvent = 0;

    for (const record of eventHistory) {
      const ageGap = currentAge - (record.age ?? currentAge);
      if (ageGap < 0 || ageGap > 3) {
        continue;
      }

      const historicalEvent = eventLoader.getEventById(record.eventId);
      if (!historicalEvent || this.isDailyEvent(historicalEvent)) {
        continue;
      }

      if (record.eventId === event.id) {
        recentSameEvent += 1;
      }

      if (this.detectSuppressionClass(historicalEvent) === suppressionClass) {
        recentSameClass += 1;
      }
    }

    if (recentSameClass === 0 && recentSameEvent === 0) {
      return 1;
    }

    const sameClassPenalty = Math.pow(0.55, recentSameClass);
    const sameEventPenalty = Math.pow(0.45, recentSameEvent);
    return this.clampWeight(sameClassPenalty * sameEventPenalty, 0.2, 1);
  }

  /**
   * 当年事件已经很密集时，动态提高“今年没有更多大事发生”的概率。
   * 这不是硬限制，而是让剧情自然留出空档。
   */
  private shouldPauseEventsThisYear(events: EventDefinition[]): boolean {
    if (this.eventsThisYear === 0 || this.annualEventPressure <= 0) {
      return false;
    }

    const hasCriticalEvent = events.some(event => event.priority === EventPriority.CRITICAL);
    const highPriorityCount = events.filter(event => event.priority <= EventPriority.HIGH).length;

    let pauseChance = 1 - Math.exp(-this.annualEventPressure * 0.22);
    pauseChance += Math.max(0, this.eventsThisYear - 2) * 0.06;

    if (hasCriticalEvent) {
      pauseChance *= 0.35;
    } else if (highPriorityCount > 0) {
      pauseChance *= 0.65;
    }

    pauseChance = Math.min(0.82, Math.max(0, pauseChance));
    return Math.random() < pauseChance;
  }

  /**
   * 选择一个事件（加权随机，带路径互斥检查）
   */
  public selectEvent(age?: number): EventDefinition | null {
    // 如果没有传入年龄参数，使用游戏引擎当前年龄
    const currentAge = age !== undefined ? age : (this.gameState.player?.age || 0);
    
    // 年度数量限制仅作为兜底；主要依赖动态权重抑制同龄事件堆积。
    if (!this.canTriggerEventThisYear(currentAge)) {
      return null;
    }
    
    const availableEvents = this.getAvailableEvents(currentAge);
    
    if (availableEvents.length === 0) {
      return dailyEventSystem.selectEvent(this.gameState);
    }
    
    // 过滤掉已触发的事件（根据maxTriggers决定是否可以再次触发）
    const eventHistory = this.gameState.eventHistory || [];
    const triggeredEventIds = new Set(eventHistory.map(e => e.eventId));
    const untriggeredEvents = availableEvents.filter(event => {
      // 如果事件已经触发过，检查是否允许重复触发
      if (triggeredEventIds.has(event.id)) {
        // 获取最大触发次数（默认1次，即只触发一次）
        const maxTriggers = event.maxTriggers ?? 1;
        const triggerCount = eventHistory.filter(e => e.eventId === event.id).length;
        
        // 调试日志
        if (event.id.includes('merchant') || event.id.includes('hero')) {
        }
        
        if (triggerCount < maxTriggers) {
          return true; // 允许重复触发
        }
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
          return false;
        }
        return true;
      }
      
      return true;
    });
    
    if (untriggeredEvents.length === 0) {
      return dailyEventSystem.selectEvent(this.gameState);
    }
    
    // 获取玩家当前主导路径
    const dominantPaths = this.getDominantPaths();
    
    // 过滤掉与主导路径强烈冲突的事件
    const compatibleEvents = untriggeredEvents.filter(event => {
      if (this.isPathConflicting(event, dominantPaths)) {
        return false; // 过滤冲突事件
      }
      return true;
    });
    
    // 如果没有兼容事件，回退到所有未触发事件
    const finalEvents = compatibleEvents.length > 0 ? compatibleEvents : untriggeredEvents;

    // 声望门槛检查：过滤不满足声望要求的事件
    const playerReputation = this.gameState.player?.reputation || 0;
    const reputationFilteredEvents = finalEvents.filter(event => {
      const gateCheck = checkReputationGate(event, playerReputation);
      if (!gateCheck.canTrigger && difficultyManager.config.eventThresholdCoefficient > 1.0) {
        return false;
      }
      return true;
    });

    const eventsToSelect = reputationFilteredEvents.length > 0 ? reputationFilteredEvents : finalEvents;

    if (eventsToSelect.length === 0) {
      return dailyEventSystem.selectEvent(this.gameState);
    }

    const { criticalEvents, storylineEvents, regularFormalEvents } = this.splitEventLayers(eventsToSelect);

    // Layer 1: critical lane, never paused by rhythm pressure.
    const criticalSelection = this.pickWeightedFormalEvent(criticalEvents, currentAge, dominantPaths);
    if (criticalSelection) {
      return criticalSelection;
    }

    // Layer 2: storyline lane, protected from daily fallback unless empty.
    const storylineSelection = this.pickWeightedFormalEvent(storylineEvents, currentAge, dominantPaths);
    if (storylineSelection) {
      return storylineSelection;
    }

    // Layer 3: regular formal lane can yield to rhythm pause.
    if (regularFormalEvents.length === 0) {
      return dailyEventSystem.selectEvent(this.gameState);
    }

    if (this.shouldPauseEventsThisYear(regularFormalEvents)) {
      return dailyEventSystem.selectEvent(this.gameState);
    }

    const regularSelection = this.pickWeightedFormalEvent(regularFormalEvents, currentAge, dominantPaths);
    if (regularSelection) {
      return regularSelection;
    }

    // Layer 4 + 5: daily fallback then null.
    return dailyEventSystem.selectEvent(this.gameState);
  }
  
  /**
   * 检查今年是否还能触发事件
   */
  private canTriggerEventThisYear(currentAge: number): boolean {
    // 如果年份变化，重置计数器
    if (currentAge !== this.lastYear) {
      this.lastYear = currentAge;
      this.eventsThisYear = 0;
      this.annualEventPressure = 0;
    }
    
    // 检查是否达到年度事件上限
    return this.eventsThisYear < this.maxEventsPerYear;
  }
  
  /**
   * 记录事件触发（用于年度事件限制）
   */
  private recordEventTrigger(event?: EventDefinition, eventAge?: number): void {
    const currentAge = eventAge ?? this.gameState.player?.age ?? 0;
    
    // 如果年份变化，重置计数器
    if (currentAge !== this.lastYear) {
      this.lastYear = currentAge;
      this.eventsThisYear = 0;
      this.annualEventPressure = 0;
    }
    
    this.eventsThisYear++;
    if (event) {
      this.annualEventPressure += this.getEventIntensity(event);
    }
  }
  
  /**
   * 执行自动事件
   */
  public async executeAutoEvent(event: EventDefinition): Promise<{ gameState: GameState, event: EventDefinition }> {
    if (!event.autoEffects || event.autoEffects.length === 0) {
      return { gameState: this.gameState, event };
    }
    
    // 记录事件前的年龄
    const ageBeforeEvent = this.gameState.player?.age || 0;
    const previousState = this.snapshotState(this.gameState);
    
    // 执行效果
    const updatedState = await this.eventExecutor.executeEffects(
      event.autoEffects,
      this.gameState
    );
    const adjustedState = this.applyFormalEventConsequences(previousState, updatedState, event);
    this.applyGameState(adjustedState);
    
    // 记录事件触发（用于年度事件限制）
    this.recordEventTrigger(event, ageBeforeEvent);
    
    // 强制记录事件到历史
    if (!this.gameState.eventHistory) {
      this.gameState.eventHistory = [];
    }
    const alreadyExists = this.gameState.eventHistory.some(
      e => e.eventId === event.id && e.age === ageBeforeEvent
    );
    if (!alreadyExists) {
      this.gameState.eventHistory.push({
        eventId: event.id,
        triggeredAt: this.gameState.currentTime.year,
        age: ageBeforeEvent
      });
    }

    // 难度系统：每次事件执行时都检查是否触发挫折事件
    const setbackResults = checkSetbackEvents(this.gameState);
    if (setbackResults.triggeredEvents.length > 0) {
      for (const result of setbackResults.triggeredEvents) {
        this.gameState = applySetbackEffects(this.gameState, result.event.id);
      }
    }

    // 难度系统：检查挑战场景失败
    if (event.challengeScene?.enableFailureCheck) {
      const failureCheck = calculateFailureProbabilityForEvent(event, this.gameState.player!);
      if (failureCheck && failureCheck.isFailed) {
        difficultyMonitor.recordChoice(true);
      } else {
        difficultyMonitor.recordChoice(false);
      }
    }

    // 难度系统：更新事件触发监控
    difficultyMonitor.recordEventTrigger(event.id, ageBeforeEvent);

    // 难度系统：清除过期的挫折状态
    this.gameState = clearExpiredSetbacks(this.gameState);

    return { gameState: this.gameState, event };
  }
  
  /**
   * 执行选择事件的效果
   * @param effects 效果数组
   * @param eventId 事件 ID
   * @param choiceId 选择 ID（可选）
   */
  public async executeChoiceEffects(effects: Effect[], eventId?: string, choiceId?: string): Promise<{ gameState: GameState, triggeredEvent?: EventDefinition }> {
    // 记录事件前的年龄
    const ageBeforeEvent = this.gameState.player?.age || 0;
    const previousState = this.snapshotState(this.gameState);
    
    const updatedState = await this.eventExecutor.executeEffects(effects, this.gameState);
    const eventDefinition = this.getEventDefinition(eventId);
    const adjustedState = eventDefinition
      ? this.applyFormalEventConsequences(previousState, updatedState, eventDefinition)
      : updatedState;
    
    this.applyGameState(adjustedState);
    
    // 新增：确保 flags 已更新（响应式对象需要特殊处理）
    if (this.gameState.player && updatedState.player) {
      // 强制同步 flags
      const oldFlags = this.gameState.player.flags;
      const newFlags = updatedState.player.flags;
      
      // 复制所有新 flag 到旧 flag（保持响应式）
      for (const [key, value] of Object.entries(newFlags)) {
        oldFlags[key] = value;
      }
    }
    
    // 记录事件触发（用于年度事件限制）
    if (eventId) {
      this.recordEventTrigger(this.getEventDefinition(eventId), ageBeforeEvent);
    }
    
    // 记录事件到历史（使用事件前的年龄）
    if (eventId) {
      if (!this.gameState.eventHistory) {
        this.gameState.eventHistory = [];
      }
      this.gameState.eventHistory.push({
        eventId,
        triggeredAt: this.gameState.currentTime.year,
        age: ageBeforeEvent
      });
    }
    
    // 记录关键选择
    if (eventId && choiceId) {
      const criticalChoiceIds = ['sect_choice', 'life_goal', 'marriage_choice', 'midlife_choice', 'war_choice'];
      if (criticalChoiceIds.includes(eventId)) {
        // 将选择 ID 映射到选项值
        const choiceValueMap: Record<string, string> = {
          'join_shaolin': 'orthodox',
          'join_wudang': 'orthodox',
          'join_emei': 'orthodox',
          'join_beggars': 'demon',
          'join_demonic': 'demon',
          'become_official': 'official',
          'remain_free': 'none',
          // 可以根据需要添加更多映射
        };
        
        const choiceValue = choiceValueMap[choiceId] || choiceId;
        CriticalChoiceSystem.recordChoice(this.gameState, eventId, choiceValue, this.gameState);
      }
    }
    
    // 难度系统：检查挑战场景失败（仅记录，选择失败由前端处理）
    if (eventId) {
      difficultyMonitor.recordChoice(false);
      difficultyMonitor.recordEventTrigger(eventId, ageBeforeEvent);
    }

    // 难度系统：清除过期的挫折状态
    this.gameState = clearExpiredSetbacks(this.gameState);

    // 默认返回（没有即时触发事件）
    return { gameState: this.gameState };
  }
  
  /**
   * 获取由 flag_set 触发的即时反馈事件
   * 用于在玩家选择后立即给予叙事反馈
   */
  private getImmediateFeedbackEvents(): EventDefinition[] {
    const currentAge = this.gameState.player?.age || 0;
    
    // 使用 eventLoader 获取所有事件
    const allEvents: EventDefinition[] = eventLoader.getAllEvents() || [];
    
    // 过滤出由 flag_set 触发的事件，并且满足条件
    const immediateEvents = allEvents.filter(event => {
      // 1. 必须有 flag_set 触发器
      const hasFlagSetTrigger = event.triggers?.some(t => t.type === 'flag_set');
      if (!hasFlagSetTrigger) {
        return false;
      }
      
      // 1.1 检查冷却和最大触发次数
      if (!this.checkEventCooldown(event)) {
        return false;
      }
      
      // 2. 检查是否满足事件条件
      let conditionsPassed = true;
      if (event.conditions && event.conditions.length > 0) {
        for (const condition of event.conditions) {
          const passed = this.conditionEvaluator.evaluate(condition, this.gameState);
          if (!passed) {
            conditionsPassed = false;
            break;
          }
        }
      }
      
      if (!conditionsPassed) {
        return false;
      }
      
      // 3. 不能已经触发过（对于 once 标签的事件）
      if (event.metadata?.tags?.includes('once')) {
        const eventHistory = this.gameState.eventHistory || [];
        const hasTriggered = eventHistory.some(e => e.eventId === event.id);
        if (hasTriggered) {
          return false;
        }
      }
      
      return true;
    });
    
    
    // 按优先级排序，高优先级先触发
    return immediateEvents.sort((a, b) => {
      const priorityA = a.priority ?? 1;
      const priorityB = b.priority ?? 1;
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      // 优先级相同，按权重排序
      return (b.weight ?? 50) - (a.weight ?? 50);
    });
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
    const profile = traitSystem.generateProfile();
    nextState.player = traitSystem.applyProfile(
      {
        ...nextState.player,
        name,
        gender,
      },
      profile
    );
    this.applyGameState(nextState);
  }
  
  /**
   * 重置游戏引擎
   */
  public reset(): void {
    this.applyGameState(this.createInitialState());
    this.eventsThisYear = 0;
    this.lastYear = -1;
    this.annualEventPressure = 0;
    difficultyMonitor.reset();
  }
  
  /**
   * 重置游戏
   */
  public resetGame(): void {
    this.applyGameState(this.createInitialState());
    this.eventsThisYear = 0;
    this.lastYear = -1;
    this.annualEventPressure = 0;
    difficultyMonitor.reset();
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
    this.applyLifeStateRecovery(value, unit);
    
    const unitLabel = unit === 'year' ? '年' : unit === 'month' ? '月' : '天';
    console.log(`[GameEngine] 时间推进 ${value} ${unitLabel}`);
  }

  private applyLifeStateRecovery(value: number, unit: 'year' | 'month' | 'day'): void {
    const lifeStates = this.gameState.player?.lifeStates;
    if (!lifeStates) {
      return;
    }

    const yearlyRecovery =
      unit === 'year' ? value :
      unit === 'month' ? Math.floor(value / 12) :
      Math.floor(value / 360);

    if (yearlyRecovery <= 0) {
      return;
    }

    for (let i = 0; i < yearlyRecovery; i++) {
      lifeStates.fatigue = Math.max(0, lifeStates.fatigue - 1);
      if (lifeStates.anxiety > 1) {
        lifeStates.anxiety -= 1;
      }
      if (lifeStates.socialMomentum > 2) {
        lifeStates.socialMomentum -= 1;
      }
      if (lifeStates.familyBond > 3) {
        lifeStates.familyBond -= 1;
      }
    }
  }

  private getEventDefinition(eventId?: string): EventDefinition | undefined {
    if (!eventId) {
      return undefined;
    }
    return eventLoader.getEventById(eventId);
  }

  private snapshotState(state: GameState): GameState {
    return JSON.parse(JSON.stringify(state));
  }

  private getFormalEventStateMultiplier(event: EventDefinition): number {
    if (event.category === 'daily_event' || !this.gameState.player?.lifeStates) {
      return 1;
    }

    const tags = traitSystem.getEventBiasTags(event);
    const { fatigue = 0, anxiety = 0, discipline = 0, indulgence = 0, familyBond = 0, socialMomentum = 0 } = this.gameState.player.lifeStates;
    let multiplier = 1;

    if (tags.has('training') || tags.has('comprehension')) {
      multiplier *= this.clampWeight(1 + discipline * 0.06 - fatigue * 0.09 - indulgence * 0.08 - anxiety * 0.04, 0.52, 1.22);
    }

    if (tags.has('business') || tags.has('social') || tags.has('reputation')) {
      multiplier *= this.clampWeight(1 + socialMomentum * 0.08 + indulgence * 0.03 - fatigue * 0.04, 0.7, 1.2);
    }

    if (tags.has('family') || tags.has('romance')) {
      multiplier *= this.clampWeight(1 + familyBond * 0.06 + anxiety * 0.02, 0.72, 1.18);
    }

    if (tags.has('risk')) {
      multiplier *= this.clampWeight(1 - anxiety * 0.05 - fatigue * 0.05, 0.62, 1.08);
    }

    if (event.isSetbackEvent) {
      multiplier *= this.clampWeight(1 + anxiety * 0.04 + indulgence * 0.05 - discipline * 0.03, 0.8, 1.25);
    }

    return multiplier;
  }

  private getSpecializationMultiplier(event: EventDefinition): number {
    if (event.category === 'daily_event' || !this.gameState.player) {
      return 1;
    }

    const eventFocus = this.getEventFocus(event);
    if (!eventFocus) {
      return 1;
    }

    const focusScores = this.getFocusScores();
    const ranked = Object.entries(focusScores).sort((a, b) => b[1] - a[1]);
    const [topFocus, topScore] = ranked[0] as [string, number];
    const secondScore = ranked[1]?.[1] ?? topScore;
    const gap = topScore - secondScore;

    if (gap < 12) {
      return 1;
    }

    if (eventFocus === topFocus) {
      return this.clampWeight(1 + gap / 90, 1, 1.18);
    }

    return this.clampWeight(1 - gap / 110, 0.72, 1);
  }

  private getFocusScores(): Record<'martial' | 'business' | 'academic' | 'social', number> {
    const player = this.gameState.player!;
    return {
      martial:
        player.martialPower +
        player.externalSkill +
        player.internalSkill +
        player.qinggong +
        player.constitution,
      business:
        player.businessAcumen * 2 +
        player.money / 40 +
        player.influence,
      academic:
        player.comprehension * 2 +
        player.knowledge * 2 +
        player.internalSkill,
      social:
        player.charisma * 2 +
        player.connections * 2 +
        player.reputation / 10 +
        player.influence,
    };
  }

  private getEventFocus(event: EventDefinition): 'martial' | 'business' | 'academic' | 'social' | null {
    const tags = traitSystem.getEventBiasTags(event);
    if (tags.has('business')) return 'business';
    if (tags.has('comprehension')) return 'academic';
    if (tags.has('training') || tags.has('risk') || tags.has('survival')) return 'martial';
    if (tags.has('social') || tags.has('family') || tags.has('romance') || tags.has('reputation')) return 'social';
    return null;
  }

  private clampWeight(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  private applyFormalEventConsequences(previousState: GameState, nextState: GameState, event: EventDefinition): GameState {
    if (event.category === 'daily_event' || !previousState.player || !nextState.player) {
      this.pendingEventOutcomeNote = null;
      return nextState;
    }

    const tags = traitSystem.getEventBiasTags(event);
    const sourceLifeStates = previousState.player.lifeStates || traitSystem.createInitialLifeStates();
    const lifeStates = {
      ...(nextState.player.lifeStates || traitSystem.createInitialLifeStates()),
    };
    const adjustedPlayer = { ...nextState.player };
    const friction = this.getFormalEventOutcomeFriction(sourceLifeStates, tags);
    let hadReducedOutcome = false;

    if (friction > 0.08) {
      const shrinkFactor = this.clampWeight(1 - friction, 0.58, 0.94);

      if (tags.has('training') || tags.has('risk')) {
        hadReducedOutcome =
          this.shrinkPositiveGain(previousState.player, adjustedPlayer, 'martialPower', shrinkFactor) || hadReducedOutcome;
        hadReducedOutcome =
          this.shrinkPositiveGain(previousState.player, adjustedPlayer, 'externalSkill', shrinkFactor) || hadReducedOutcome;
        hadReducedOutcome =
          this.shrinkPositiveGain(previousState.player, adjustedPlayer, 'internalSkill', shrinkFactor) || hadReducedOutcome;
        hadReducedOutcome =
          this.shrinkPositiveGain(previousState.player, adjustedPlayer, 'qinggong', shrinkFactor) || hadReducedOutcome;
      }

      if (tags.has('comprehension')) {
        hadReducedOutcome =
          this.shrinkPositiveGain(previousState.player, adjustedPlayer, 'comprehension', shrinkFactor) || hadReducedOutcome;
        hadReducedOutcome =
          this.shrinkPositiveGain(previousState.player, adjustedPlayer, 'knowledge', shrinkFactor) || hadReducedOutcome;
        hadReducedOutcome =
          this.shrinkPositiveGain(previousState.player, adjustedPlayer, 'internalSkill', shrinkFactor) || hadReducedOutcome;
      }

      if (tags.has('business')) {
        hadReducedOutcome =
          this.shrinkPositiveGain(previousState.player, adjustedPlayer, 'money', shrinkFactor) || hadReducedOutcome;
        hadReducedOutcome =
          this.shrinkPositiveGain(previousState.player, adjustedPlayer, 'businessAcumen', shrinkFactor) || hadReducedOutcome;
      }

      if (tags.has('social') || tags.has('reputation') || tags.has('romance') || tags.has('family')) {
        hadReducedOutcome =
          this.shrinkPositiveGain(previousState.player, adjustedPlayer, 'charisma', shrinkFactor) || hadReducedOutcome;
        hadReducedOutcome =
          this.shrinkPositiveGain(previousState.player, adjustedPlayer, 'connections', shrinkFactor) || hadReducedOutcome;
        hadReducedOutcome =
          this.shrinkPositiveGain(previousState.player, adjustedPlayer, 'reputation', shrinkFactor) || hadReducedOutcome;
      }
    }

    const statDelta = (key: keyof typeof adjustedPlayer) =>
      Number((adjustedPlayer as any)[key] || 0) - Number((previousState.player as any)[key] || 0);

    const martialGain =
      statDelta('martialPower') +
      statDelta('externalSkill') +
      statDelta('internalSkill') +
      statDelta('qinggong');
    const moneyGain = statDelta('money');
    const businessGain = statDelta('businessAcumen');
    const socialGain =
      statDelta('charisma') + statDelta('connections') + statDelta('reputation') / 5 + statDelta('influence') * 2;
    const academicGain = statDelta('comprehension') + statDelta('knowledge') + statDelta('internalSkill');
    const familyGain = statDelta('chivalry') + statDelta('reputation') / 10;

    if (hadReducedOutcome) {
      this.pendingEventOutcomeNote = this.buildPartialOutcomeNote(event, tags, friction);
      lifeStates.anxiety = traitSystem.clampLifeState('anxiety', lifeStates.anxiety + 1);
      if ((tags.has('training') || tags.has('comprehension')) && sourceLifeStates.indulgence >= 2) {
        lifeStates.discipline = traitSystem.clampLifeState('discipline', lifeStates.discipline - 1);
      }
      if ((tags.has('business') || tags.has('social') || tags.has('reputation')) && lifeStates.socialMomentum > 0) {
        lifeStates.socialMomentum = traitSystem.clampLifeState('socialMomentum', lifeStates.socialMomentum - 1);
      }
    } else {
      this.pendingEventOutcomeNote = null;
    }

    if ((tags.has('training') || tags.has('risk')) && martialGain >= 6) {
      lifeStates.fatigue = traitSystem.clampLifeState('fatigue', lifeStates.fatigue + 1);
      if (martialGain >= 12) {
        lifeStates.anxiety = traitSystem.clampLifeState('anxiety', lifeStates.anxiety + 1);
      }
    }

    if (tags.has('comprehension') && academicGain >= 4) {
      lifeStates.fatigue = traitSystem.clampLifeState('fatigue', lifeStates.fatigue + 1);
    }

    if (tags.has('business') && (moneyGain >= 100 || businessGain >= 2)) {
      lifeStates.anxiety = traitSystem.clampLifeState('anxiety', lifeStates.anxiety + 1);
      if (moneyGain >= 150 && lifeStates.familyBond > 0) {
        lifeStates.familyBond = traitSystem.clampLifeState('familyBond', lifeStates.familyBond - 1);
      }
    }

    if ((tags.has('social') || tags.has('reputation')) && socialGain >= 3) {
      lifeStates.socialMomentum = traitSystem.clampLifeState('socialMomentum', lifeStates.socialMomentum + 1);
      if (socialGain >= 6) {
        lifeStates.anxiety = traitSystem.clampLifeState('anxiety', lifeStates.anxiety + 1);
      }
    }

    if ((tags.has('family') || tags.has('romance')) && familyGain >= 2) {
      lifeStates.familyBond = traitSystem.clampLifeState('familyBond', lifeStates.familyBond + 1);
      if (lifeStates.discipline > 0) {
        lifeStates.discipline = traitSystem.clampLifeState('discipline', lifeStates.discipline - 1);
      }
    }

    if (event.isSetbackEvent) {
      lifeStates.anxiety = traitSystem.clampLifeState('anxiety', lifeStates.anxiety + 1);
      if (lifeStates.discipline > 0) {
        lifeStates.discipline = traitSystem.clampLifeState('discipline', lifeStates.discipline - 1);
      }
    }

    return {
      ...nextState,
      player: {
        ...adjustedPlayer,
        lifeStates,
      },
    };
  }

  private getFormalEventOutcomeFriction(
    lifeStates: ReturnType<typeof traitSystem.createInitialLifeStates>,
    tags: Set<string>
  ): number {
    let friction =
      lifeStates.fatigue * 0.05 +
      lifeStates.anxiety * 0.06 +
      lifeStates.indulgence * 0.05 -
      lifeStates.discipline * 0.04;

    if (tags.has('training') || tags.has('comprehension')) {
      friction += lifeStates.indulgence * 0.05;
    }
    if (tags.has('business')) {
      friction += lifeStates.anxiety * 0.02;
    }
    if (tags.has('social') || tags.has('reputation') || tags.has('family') || tags.has('romance')) {
      friction += lifeStates.anxiety * 0.02;
    }

    return this.clampWeight(friction, 0, 0.42);
  }

  private shrinkPositiveGain(
    previousPlayer: GameState['player'],
    nextPlayer: GameState['player'],
    key: keyof GameState['player'],
    factor: number
  ): boolean {
    const previousValue = Number((previousPlayer as any)[key] || 0);
    const nextValue = Number((nextPlayer as any)[key] || 0);
    const delta = nextValue - previousValue;

    if (delta <= 0) {
      return false;
    }

    const reducedDelta = Math.max(1, Math.ceil(delta * factor));
    (nextPlayer as any)[key] = previousValue + reducedDelta;
    return reducedDelta < delta;
  }

  private buildPartialOutcomeNote(event: EventDefinition, tags: Set<string>, friction: number): string {
    const title = event.content?.title || event.id;

    switch (title) {
      case '喜得贵子':
        return friction > 0.24
          ? '家里确实添了喜气，只是接踵而来的花销与牵挂也比你预想中更重，欢喜里终究掺了几分仓促。'
          : '孩子顺利降生，家中多了盼头，只是往后的担子也实实在在压到了肩上。';
      case '家族危机':
        return friction > 0.24
          ? '这场风波总算没有彻底失控，可你终究没能把局面稳到最好，家底还是被磨去了几分。'
          : '你替家里扛下了最难的那一段，只是危机虽缓，元气也跟着伤了些。';
      case '门派壮大':
        return friction > 0.24
          ? '门下声势是起来了，只是人多事杂，你终究没能把每一处都收束妥帖。'
          : '门派比从前更兴旺了，只是摊子越大，落到你肩上的琐事也越多。';
      case '武林大会':
      case '武林大会邀请':
        return friction > 0.24
          ? '你在大会上仍算露了脸，可真正能一锤定音的那一下，终究还是差了些火候。'
          : '你借着大会让人记住了自己，只是离真正扬名立万，还隔着一层。';
      case '武学创新':
        return friction > 0.24
          ? '新路子确实摸出来了一点，可最关键的那口气没能续上，成果便显得半成半熟。'
          : '你把旧路数往前推了一步，只是这门新意还需要时日打磨。';
      case '武学交流':
        return friction > 0.24
          ? '这一番切磋不是没有所得，只是彼此都留了余地，真正能拿走的精华不算多。'
          : '你从这次交流里学到了东西，只是更多还停留在点到即止的层面。';
      case '隐世高手':
        return friction > 0.24
          ? '高人的指点确有价值，可你当下心境不稳，最终只留下几分若有若无的体会。'
          : '你得了前辈一番点拨，眼界是开了些，只是还没来得及全都化成自己的东西。';
      case '选择传人':
        return friction > 0.24
          ? '你总算挑中了可托付的人，只是心里仍留着迟疑，这份传承还没真正稳住。'
          : '你开始把手里的东西往下交了，只是传承从来不是一朝一夕就能定下的。';
      case '传授孙儿':
        return friction > 0.24
          ? '孩子确实学进去了些，可火候还浅，你想留下的那份本事暂时只传到了外面一层。'
          : '你把一身所学慢慢讲给后辈听，这份心意已经落下，只是功夫还得靠年月去养。';
      case '情敌出现':
        return friction > 0.24
          ? '这场较劲你并非全无招架之力，只是心里越在意，举止便越不够从容。'
          : '你总算没有在这段关系里轻易退开，只是局面也因此变得更难收拾了。';
      case '恩怨情仇':
        return friction > 0.24
          ? '旧事终究还是碰到了心口上，你虽撑住了场面，却没能把这段纠葛真正理顺。'
          : '这段恩怨算是往前推了一步，只是情和仇交缠在一起，终究难有痛快了断。';
      default:
        break;
    }

    if (tags.has('training') || tags.has('risk')) {
      return friction > 0.24
        ? '你本可更进一步，却终究差了一口气，收获没有落到最满。'
        : '事情办成了，只是火候还差一点，没能把机会完全吃透。';
    }

    if (tags.has('comprehension')) {
      return friction > 0.24
        ? '你隐约摸到了门道，却没能真正把它握住，只留下半明半暗的一点所得。'
        : '这一回确实有所领会，只是心神不够稳，终究没能尽兴。';
    }

    if (tags.has('business')) {
      return friction > 0.24
        ? '这笔事并非没有做成，只是中途耗掉了太多，最后到手的比原本能有的少了一截。'
        : '你抓住了机会，但没能把账算到最漂亮，终究还是漏了些本该到手的好处。';
    }

    if (tags.has('social') || tags.has('reputation')) {
      return friction > 0.24
        ? '你把场面撑住了，却没能把人心也一并拿下，结果比预想中浅了一层。'
        : '名声和关系都有推进，只是比起你本来能做到的，终究还是轻了些。';
    }

    if (tags.has('family') || tags.has('romance')) {
      return friction > 0.24
        ? '关系并非没有靠近，只是现实和心事都夹在中间，让这一步走得不够完整。'
        : '你们之间确实向前了一点，只是还留着些没说开的牵扯。';
    }

    return friction > 0.24
      ? '事情有了结果，却没能走到最理想的那一步。'
      : '这次并非没有收获，只是终究差了那么一点。';
  }

  public consumeLastEventOutcomeNote(): string | null {
    const note = this.pendingEventOutcomeNote;
    this.pendingEventOutcomeNote = null;
    return note;
  }
}

// 导出单例
export const gameEngine = new GameEngineIntegration();
