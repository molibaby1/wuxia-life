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
import type { EventDefinition, GameState, Effect, PlayerIdentity, PlayerLifeStates } from '../types/eventTypes';
import { eventLoader } from './EventLoader';
import { EventExecutor } from './EventExecutor';
import { ConditionEvaluator, type Condition } from './ConditionEvaluator';
import { CriticalChoiceSystem } from './CriticalChoiceSystem';
import { LifePathManager } from './LifePathSystem';
import { difficultyManager } from './DifficultyManager';
import { difficultyMonitor } from './DifficultyMonitor';
import { checkReputationGate } from './ReputationGateSystem';
import { calculateFailureProbabilityForEvent, rollForFailure } from './ChallengeSystem';
import { checkSetbackEvents, applySetbackEffects, clearExpiredSetbacks } from './SetbackEventSystem';
import { traitSystem } from './TraitSystem';
import { dailyEventSystem } from './DailyEventSystem';
import { buildNarrativeSchedulingContextFromState } from '../p11/schedulingContext';
import type { NarrativeSchedulingContext } from '../p11/types';
import { getNarrativeSchedulingMultiplier } from '../p11/schedulingPolicy';
import { isCoreRouteIdentity, RouteStateManager } from './RouteStateManager';
import { resolveRouteConflict, type RouteIdentity } from './RouteCompatibilityRules';
import { appendFormalEventHistory } from './EventHistory';
import {
  buildActiveActionChoices,
  executeActiveActionOnState,
  hasPendingForcedEvent as checkPendingForcedEvent,
} from './activePlanning/ActivePlanningService';
import { explainChoiceRequirement } from './activePlanning/ChoiceRequirementExplanation';
import type { ActiveActionExecutionResult } from './activePlanning/ActivePlanningService';
import { getLaterLifeConsequenceMultiplier } from '../p17/laterLifeSelection';
import { getLaterLifeLegacyMultiplier } from '../p18/laterLifeLegacySelection';
import { getLaterLifeEndgameRecoveryMultiplier } from '../p19/laterLifeEndgameSelection';
import { getArchetypeSchedulingMultiplier } from '../p20/archetypeCoverage';
import { getProfileRepetitionPressureMultiplier } from '../p20/repetitionPressure';
import { getWholeLifePacingMultiplier } from '../p20/wholeLifePacing';
import { applyYouthTransitionSeeds, resolveChildhoodActionPalette } from '../p16/childhoodAgency';
import { getOriginChildhoodEventMultiplier } from '../p16/originSurfaces';
import { resolvePrimaryOriginFamilyFlag } from '../p16/primaryOriginFlag';
import { isSpineOriginEligible } from '../p16/spineOriginIsolation';
import { isTraitLineSpineEligible } from '../p16/traitLineSpineEligibility';
import {
  applyRareLineFlags,
  rollRareEventLines,
} from '../p16/rareEventLines';
import {
  applyChildhoodShapingFromEvent,
  createEmptyTendencyAccumulator,
} from '../p16/tendencyShaping';

/** 每年进入正式候选池的事件数量上限（节奏治理：避免 Top-3 垄断） */
const FORMAL_CANDIDATE_POOL_CAP = 12;

function engineDiagnosticsEnabled(): boolean {
  const quiet = typeof process !== 'undefined' && process.env ? process.env.WUXIA_ENGINE_QUIET : undefined;
  return quiet !== '1';
}

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
  private suppressLethalSetbacks = false;

  constructor() {
    this.eventExecutor = new EventExecutor();
    this.conditionEvaluator = new ConditionEvaluator();
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
        investments: {
          martial: 0,
          statecraft: 0,
          official: 0,
          hermit: 0,
        },
        money: 100,
        reputation: 0,
        connections: 0,
        children: 0,
        spouse: null,
        alive: true,
        items: [],
        flags: {},
        events: [],
        relationships: [],
        traits: [],
        healthStatus: 'healthy',
        statuses: [],
        lifeStates: traitSystem.createInitialLifeStates(),
      },
      currentTime: {
        year: 1,
        month: 1,
        day: 1,
      },
      facts: {},
      flags: {},
      events: [],
      eventHistory: [],
      actionHistory: [],
      actionFocusStreak: { category: null, count: 0 },
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
        player.investments = { ...nextState.player.investments };
        player.money = nextState.player.money;
        player.reputation = nextState.player.reputation;
        player.connections = nextState.player.connections;
        player.sect = nextState.player.sect;
        player.title = nextState.player.title;
        player.children = nextState.player.children;
        player.spouse = nextState.player.spouse;
        player.alive = nextState.player.alive;
        player.items = [...(nextState.player.items || [])];
        player.events = [...(nextState.player.events || [])];
        player.flags = { ...(nextState.player.flags || {}) };
        player.relationships = [...(nextState.player.relationships || [])];
        player.traits = [...nextState.player.traits];
        if (nextState.player.healthStatus !== undefined) {
          player.healthStatus = nextState.player.healthStatus;
        }
        if (Array.isArray(nextState.player.statuses)) {
          player.statuses = [...nextState.player.statuses];
        }
        player.lifeStates = nextState.player.lifeStates ? { ...nextState.player.lifeStates } : traitSystem.createInitialLifeStates();
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
    this.gameState.eventHistory = [...(nextState.eventHistory || [])];
    this.gameState.actionHistory = [...(nextState.actionHistory || [])];
    this.gameState.actionFocusStreak = nextState.actionFocusStreak
      ? { ...nextState.actionFocusStreak }
      : { category: null, count: 0 };
    this.gameState.triggeredEvents = [...(nextState.triggeredEvents || [])];
    this.gameState.relations = { ...(nextState.relations || {}) };
    this.gameState.inventory = [...(nextState.inventory || [])];
    this.gameState.statistics = nextState.statistics ? { ...nextState.statistics } : undefined;
    this.gameState.identity = nextState.identity
      ? {
          ...nextState.identity,
          identities: [...(nextState.identity.identities || [])],
          achievements: [...(nextState.identity.achievements || [])],
        }
      : undefined;
    this.gameState.lifePath = nextState.lifePath
      ? {
          ...nextState.lifePath,
          achievements: [...(nextState.lifePath.achievements || [])],
          relationships: {
            allies: [...(nextState.lifePath.relationships?.allies || [])],
            enemies: [...(nextState.lifePath.relationships?.enemies || [])],
            mentors: [...(nextState.lifePath.relationships?.mentors || [])],
            disciples: [...(nextState.lifePath.relationships?.disciples || [])],
          },
          commitments: {
            cannotJoin: [...(nextState.lifePath.commitments?.cannotJoin || [])],
            mustProtect: [...(nextState.lifePath.commitments?.mustProtect || [])],
            swornEnemies: [...(nextState.lifePath.commitments?.swornEnemies || [])],
          },
          focus: {
            ...(nextState.lifePath.focus || {
              martial: 0,
              business: 0,
              academic: 0,
              leadership: 0,
            }),
          },
        }
      : undefined;
    this.gameState.karma = nextState.karma
      ? {
          ...nextState.karma,
          history: [...(nextState.karma.history || [])],
        }
      : undefined;
    this.gameState.criticalChoices = nextState.criticalChoices
      ? { ...nextState.criticalChoices }
      : undefined;
    this.gameState.achievements = [...(nextState.achievements || [])];
    this.gameState.routeStates = nextState.routeStates
      ? Object.fromEntries(
          Object.entries(nextState.routeStates).map(([routeId, routeState]) => [
            routeId,
            { ...routeState },
          ]),
        )
      : {};
    this.gameState.routeHistory = [...(nextState.routeHistory || [])];
    this.gameState.roadCommitments = nextState.roadCommitments
      ? Object.fromEntries(
          Object.entries(nextState.roadCommitments).map(([roadId, commitment]) => [
            roadId,
            { ...commitment },
          ]),
        )
      : {};
    this.gameState.ending = nextState.ending;
    this.gameState.saveVersion = nextState.saveVersion;
    this.gameState.lastSavedAt = nextState.lastSavedAt;
    this.gameState.gameTimestamp = nextState.gameTimestamp;
    
    // 记录更新后的属性值，确认数据确实在变化
    const newMartialPower = this.gameState.player?.martialPower;
    const newMoney = this.gameState.player?.money;
    
    if (oldMartialPower !== newMartialPower || oldMoney !== newMoney) {
      if (engineDiagnosticsEnabled()) {
        console.log(`[GameEngine] 属性更新：功力 ${oldMartialPower}→${newMartialPower}, 银两 ${oldMoney}→${newMoney}`);
      }
    }
  }

  public loadGameState(savedState: GameState): void {
    this.applyGameState(RouteStateManager.normalizeRoadCommitments(
      RouteStateManager.migrateLegacyRoutes(savedState),
    ));
    const currentAge = this.gameState.player?.age || 0;
    const currentYearEvents = (this.gameState.eventHistory || []).filter(
      record => (record.age ?? currentAge) === currentAge,
    );
    this.eventsThisYear = currentYearEvents.length;
    this.lastYear = currentAge;
    this.annualEventPressure = currentYearEvents.reduce((sum, record) => {
      const event = this.getEventDefinition(record.eventId);
      if (!event) {
        return sum;
      }
      return sum + this.getEventIntensity(event);
    }, 0);
    difficultyMonitor.reset();
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
      if (!this.isLiveOpsExpansionSelectable(event)) {
        return false;
      }

      // 1. 统一运行时门禁：conditions + thresholds + legacy triggerConditions
      if (!this.passesRuntimeEventGuards(event, this.gameState)) {
        return false;
      }

      const primaryOrigin = resolvePrimaryOriginFamilyFlag(this.gameState);
      if (!isSpineOriginEligible(event, primaryOrigin, age)) {
        return false;
      }
      if (!isTraitLineSpineEligible(event, this.gameState)) {
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
      

      
      return true;
    });
    
    // 按优先级排序
    availableEvents.sort((a, b) => {
      return (b.priority ?? EventPriority.NORMAL) - (a.priority ?? EventPriority.NORMAL);
    });
    
    let limitedEvents = availableEvents.slice(0, FORMAL_CANDIDATE_POOL_CAP);
    limitedEvents = this.injectActiveRouteCandidates(availableEvents, limitedEvents);
    limitedEvents = this.injectMandatoryCandidates(availableEvents, limitedEvents);

    return limitedEvents;
  }

  /** ponytail: scheduling-critical events must survive FORMAL_CANDIDATE_POOL_CAP trimming. */
  private isSchedulingValidationEvent(event: EventDefinition): boolean {
    const tags = (event.metadata?.tags ?? []).map(tag => tag.toLowerCase());
    return (
      tags.includes('p9') ||
      tags.includes('p11') ||
      tags.includes('hvg') ||
      tags.includes('causality_echo') ||
      (tags.includes('mandatory') && tags.includes('mainline'))
    );
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
  
  private getActivePlayerRouteKeys(): string[] {
    const keys = new Set<string>();

    for (const [routeId, routeState] of Object.entries(this.gameState.routeStates || {})) {
      if (routeState.lifecycle === 'active' || routeState.lifecycle === 'locked_in' || routeState.lifecycle === 'temporary') {
        keys.add(routeId);
      }
    }

    const flags = this.gameState.player?.flags || {};
    for (const [flagName, flagValue] of Object.entries(flags)) {
      if (!flagValue || !flagName.startsWith('route_')) {
        continue;
      }
      if (flagName.endsWith('_completed') || flagName.endsWith('_failed') || flagName.endsWith('_locked')) {
        continue;
      }
      const routeKey = flagName.replace(/^route_/, '');
      if (routeKey) {
        keys.add(routeKey);
      }
    }

    return [...keys];
  }

  private eventBelongsToActiveRoute(event: EventDefinition, activeRouteKeys: string[]): boolean {
    if (activeRouteKeys.length === 0) {
      return false;
    }

    const routeTargets = event.metadata?.routeTargets || [];
    for (const routeKey of activeRouteKeys) {
      if (routeTargets.includes(routeKey)) {
        return true;
      }
    }

    const coreCandidates = this.getEventRouteCandidates(event);
    for (const routeKey of activeRouteKeys) {
      if (coreCandidates.includes(routeKey as RouteIdentity)) {
        return true;
      }
    }

    const serialized = JSON.stringify({
      conditions: event.conditions,
      autoEffects: event.autoEffects,
      choices: event.choices,
    });
    for (const routeKey of activeRouteKeys) {
      if (
        serialized.includes(`"route_${routeKey}"`) ||
        serialized.includes(`flags.has("route_${routeKey}")`) ||
        serialized.includes(`flags.has('route_${routeKey}')`)
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * 方案乙：活跃路线在候选池中至少保留 1 个相关事件（可略超 cap）
   */
  private injectActiveRouteCandidates(
    availableEvents: EventDefinition[],
    limitedEvents: EventDefinition[]
  ): EventDefinition[] {
    const activeRouteKeys = this.getActivePlayerRouteKeys();
    if (activeRouteKeys.length === 0) {
      return limitedEvents;
    }

    const result = [...limitedEvents];
    const selectedIds = new Set(result.map(event => event.id));

    for (const routeKey of activeRouteKeys) {
      const alreadyRepresented = result.some(event => this.eventBelongsToActiveRoute(event, [routeKey]));
      if (alreadyRepresented) {
        continue;
      }

      const reserved = availableEvents.find(
        event => !selectedIds.has(event.id) && this.eventBelongsToActiveRoute(event, [routeKey])
      );
      if (reserved) {
        result.push(reserved);
        selectedIds.add(reserved.id);
      }
    }

    return result;
  }

  /** Ensure scheduling-validation and exact-age mandatory events survive FORMAL_CANDIDATE_POOL_CAP. */
  private injectMandatoryCandidates(
    availableEvents: EventDefinition[],
    limitedEvents: EventDefinition[],
  ): EventDefinition[] {
    const result = [...limitedEvents];
    const selectedIds = new Set(result.map(event => event.id));
    const currentAge = this.gameState.player?.age ?? 0;

    for (const event of availableEvents) {
      if (selectedIds.has(event.id) || !this.isSchedulingValidationEvent(event)) {
        continue;
      }
      result.push(event);
      selectedIds.add(event.id);
    }

    for (const event of availableEvents) {
      if (selectedIds.has(event.id) || !this.isMandatoryEvent(event)) {
        continue;
      }
      const min = event.ageRange?.min;
      const max = event.ageRange?.max;
      if (min !== currentAge || max !== currentAge) {
        continue;
      }
      result.push(event);
      selectedIds.add(event.id);
    }

    return result;
  }

  private getExactAgeMandatoryEvents(
    events: EventDefinition[],
    currentAge: number,
  ): EventDefinition[] {
    return events
      .filter(event => {
        if (!this.isMandatoryEvent(event)) {
          return false;
        }
        const min = event.ageRange?.min;
        const max = event.ageRange?.max;
        return min === currentAge && max === currentAge;
      })
      .sort((a, b) => (b.priority ?? EventPriority.NORMAL) - (a.priority ?? EventPriority.NORMAL));
  }

  private getRouteSchedulingMultiplier(
    event: EventDefinition,
    narrativeContext?: NarrativeSchedulingContext,
  ): number {
    const romanceFamilyMultiplier = this.getRomanceFamilySchedulingMultiplier(event);
    const wandererMidlifeMultiplier = this.getWandererMidlifeSchedulingMultiplier(event);
    const activeRouteKeys = this.getActivePlayerRouteKeys();
    const routeMultiplier =
      activeRouteKeys.length === 0
        ? 1
        : this.eventBelongsToActiveRoute(event, activeRouteKeys)
          ? 1.35
          : 1;
    const context = narrativeContext ?? buildNarrativeSchedulingContextFromState(this.gameState);
    const narrativeMultiplier = getNarrativeSchedulingMultiplier(event, context);
    const { multiplier: laterLifeConsequenceMultiplier } = getLaterLifeConsequenceMultiplier(
      this.gameState,
      event,
    );
    const { multiplier: laterLifeLegacyMultiplier } = getLaterLifeLegacyMultiplier(
      this.gameState,
      event,
    );
    const { multiplier: laterLifeEndgameRecoveryMultiplier } = getLaterLifeEndgameRecoveryMultiplier(
      this.gameState,
      event,
    );
    const archetypeMultiplier = getArchetypeSchedulingMultiplier(this.gameState, event);
    const pacingMultiplier = getWholeLifePacingMultiplier(this.gameState, event);
    return (
      routeMultiplier *
      romanceFamilyMultiplier *
      wandererMidlifeMultiplier *
      narrativeMultiplier *
      laterLifeConsequenceMultiplier *
      laterLifeLegacyMultiplier *
      laterLifeEndgameRecoveryMultiplier *
      archetypeMultiplier *
      pacingMultiplier
    );
  }

  /** US-021: boost wandering hero midlife arc events for route_wanderer players ages 31–50. */
  private getWandererMidlifeSchedulingMultiplier(event: EventDefinition): number {
    const player = this.gameState.player;
    if (!player) {
      return 1;
    }

    const age = player.age ?? 0;
    const flags = player.flags ?? {};
    const wandererMidlifeIds = [
      'hero_old_case_returns',
      'hero_reputation_backlash',
      'hero_ally_pays_price',
      'hero_gray_judgment',
      'hero_freedom_settlement',
    ];

    if (
      !wandererMidlifeIds.includes(event.id) ||
      !flags.route_wanderer ||
      flags.route_demonic ||
      age < 31 ||
      age > 50
    ) {
      return 1;
    }

    if (event.id === 'hero_freedom_settlement' && age >= 48) {
      return 6;
    }
    if (flags.hero_rep_mantle && event.id === 'hero_ally_pays_price') {
      return 5;
    }
    return 4;
  }

  /** US-009: guarantee family_marriage / family_child_born fire inside their age windows when love line is active. */
  private getRomanceFamilySchedulingMultiplier(event: EventDefinition): number {
    const player = this.gameState.player;
    if (!player) {
      return 1;
    }

    const age = player.age ?? 0;
    const flags = player.flags ?? {};

    if (event.id === 'family_marriage' && !flags.married && flags.love_started && age >= 20 && age <= 30) {
      if (age >= 28) {
        return 8;
      }
      if (age >= 25) {
        return 5;
      }
      return 3.5;
    }

    if (
      event.id === 'family_child_born' &&
      flags.married &&
      !flags.has_child &&
      age >= 25 &&
      age <= 40
    ) {
      return 3;
    }

    return 1;
  }

  private isRomanceFamilyCriticalEvent(event: EventDefinition): boolean {
    if (event.id !== 'family_marriage') {
      return false;
    }
    const age = this.gameState.player?.age ?? 0;
    const flags = this.gameState.player?.flags ?? {};
    return age >= 26 && age <= 30 && !flags.married && Boolean(flags.love_started);
  }

  /**
   * 获取玩家当前主导路径（优先 routeStates / route_* 标记，再回退启发式）
   */
  private getDominantPaths(): string[] {
    const paths = new Set<string>(this.getActivePlayerRouteKeys());

    const flags = this.gameState.player?.flags || {};

    if (flags.scholar_path || flags.origin_scholar_family ||
        (this.gameState.player?.comprehension || 0) >= 50) {
      paths.add('scholar');
    }

    if (flags.merchant_path || flags.origin_merchant_family ||
        (this.gameState.player?.money || 0) >= 500) {
      paths.add('merchant');
    }

    if (flags.martial_path || flags.origin_wuxia_family ||
        (this.gameState.player?.martialPower || 0) >= 50) {
      paths.add('martial_artist');
    }

    if (flags.demon_path || flags.sect_faction === 'unconventional' ||
        flags.unconventional_member || flags.route_demonic) {
      paths.add('demonic');
    }

    if (flags.official_path || flags.civil_service_passed ||
        flags.route_official || (this.gameState.player?.reputation || 0) >= 100) {
      paths.add('official');
    }

    if (flags.hermit_path || (this.gameState.player?.chivalry || 0) >= 80) {
      paths.add('hermit');
    }

    if (flags.route_beggars) {
      paths.add('beggars');
    }

    return [...paths];
  }

  private getLockedCoreRoutes(): RouteIdentity[] {
    const routeStates = this.gameState.routeStates || {};
    return Object.values(routeStates)
      .filter(routeState => {
        if (!routeState.lockedIn) {
          return false;
        }
        if (routeState.lifecycle === 'failed') {
          return false;
        }
        return isCoreRouteIdentity(routeState.routeId);
      })
      .map(routeState => routeState.routeId as RouteIdentity);
  }

  private getActiveCoreRoutes(): Array<{ routeId: RouteIdentity; lockedIn: boolean }> {
    const routeStates = this.gameState.routeStates || {};
    return Object.values(routeStates)
      .filter(routeState => {
        if (!isCoreRouteIdentity(routeState.routeId)) {
          return false;
        }
        if (routeState.lifecycle === 'failed' || routeState.lifecycle === 'turned') {
          return false;
        }
        return ['active', 'locked_in', 'temporary'].includes(routeState.lifecycle);
      })
      .map(routeState => ({
        routeId: routeState.routeId as RouteIdentity,
        lockedIn: routeState.lockedIn,
      }));
  }

  private extractRouteCandidatesFromEffects(effects: Effect[] | undefined): RouteIdentity[] {
    if (!effects || effects.length === 0) {
      return [];
    }
    const candidates = new Set<RouteIdentity>();
    const factionToRoute: Record<string, RouteIdentity> = {
      orthodox: 'sect',
      unconventional: 'demonic',
      neutral: 'wanderer',
      none: 'wanderer',
    };

    for (const effect of effects) {
      if (effect.type !== 'flag_set') {
        continue;
      }
      const flagName = effect.flag || effect.target;
      if (!flagName || typeof flagName !== 'string') {
        continue;
      }

      if (flagName === 'sect_faction' && typeof effect.value === 'string') {
        const mappedRoute = factionToRoute[effect.value];
        if (mappedRoute) {
          candidates.add(mappedRoute);
        }
        continue;
      }

      if (!flagName.startsWith('route_')) {
        continue;
      }

      const rawRouteId = flagName.replace(/^route_/, '').replace(/_(locked|completed|failed)$/, '');
      const normalizedRoute = rawRouteId === 'demon' ? 'demonic' : rawRouteId;
      if (isCoreRouteIdentity(normalizedRoute)) {
        candidates.add(normalizedRoute);
      }
    }

    return Array.from(candidates);
  }

  private getEventRouteCandidates(event: EventDefinition): RouteIdentity[] {
    const metadataTargets = event.metadata?.routeTargets || [];
    const candidates = new Set<RouteIdentity>();

    for (const route of metadataTargets) {
      if (typeof route === 'string' && route.length > 0) {
        if (isCoreRouteIdentity(route)) {
          candidates.add(route);
        }
      }
    }

    for (const route of this.extractRouteCandidatesFromEffects(event.autoEffects)) {
      candidates.add(route);
    }

    for (const choice of event.choices || []) {
      for (const route of this.extractRouteCandidatesFromEffects(choice.effects)) {
        candidates.add(route);
      }
      for (const outcome of choice.outcomes || []) {
        for (const route of this.extractRouteCandidatesFromEffects(outcome.effects)) {
          candidates.add(route);
        }
      }
    }

    return Array.from(candidates);
  }

  private isExplicitRouteTransitionEvent(event: EventDefinition): boolean {
    const transition = event.metadata?.routeTransition;
    if (
      transition === 'turn' ||
      transition === 'betrayal' ||
      transition === 'corruption' ||
      transition === 'redemption' ||
      transition === 'exile'
    ) {
      return true;
    }
    return event.metadata?.tags?.includes('route_turn') === true;
  }

  private passesRouteConflictChecks(event: EventDefinition): boolean {
    const activeRoutes = this.getActiveCoreRoutes();
    if (activeRoutes.length === 0) {
      return true;
    }

    const candidateRoutes = this.getEventRouteCandidates(event);
    if (candidateRoutes.length === 0) {
      return true;
    }

    const allowsTransition = this.isExplicitRouteTransitionEvent(event);

    for (const candidateRoute of candidateRoutes) {
      for (const { routeId: existingRoute, lockedIn } of activeRoutes) {
        if (existingRoute === candidateRoute) {
          continue;
        }
        const conflict = resolveRouteConflict({
          currentMainRoute: existingRoute,
          candidateRoute,
          lockedIn,
        });
        if (conflict.level === 'strong_exclusion' && conflict.action === 'block_candidate') {
          if (!allowsTransition) {
            return false;
          }
        }
        if (conflict.action === 'require_turn_event' && !allowsTransition) {
          return false;
        }
      }
    }

    return true;
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
      tags.includes('critical') ||
      tags.includes('mandatory') ||
      tags.includes('mainline')
    );
  }

  private isCriticalLayerEvent(event: EventDefinition): boolean {
    return this.isMandatoryEvent(event) || this.isRomanceFamilyCriticalEvent(event);
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
      const combinedMultiplier =
        this.getFormalRepetitionSuppressionMultiplier(events[0]) *
        this.getProfileRepetitionPressureMultiplier(events[0]) *
        this.getAdjacentClassSuppressionMultiplier(events[0]);
      return combinedMultiplier <= 0.2 ? null : events[0];
    }

    const narrativeContext = buildNarrativeSchedulingContextFromState(this.gameState);

    const totalWeight = events.reduce((sum, event) => {
      const baseWeight = eventLoader.getWeightForAge(event, currentAge);
      const pathAdjusted = this.adjustWeightByPath(event, baseWeight, dominantPaths);
      const traitAdjusted = pathAdjusted * traitSystem.getEventWeightMultiplier(this.gameState, event);
      const originAdjusted =
        traitAdjusted *
        getOriginChildhoodEventMultiplier(
          this.gameState,
          traitSystem.getEventBiasTags(event),
        );
      const stateAdjusted = originAdjusted * this.getFormalEventStateMultiplier(event);
      const specializationAdjusted = stateAdjusted * this.getSpecializationMultiplier(event);
      const repetitionAdjusted = specializationAdjusted * this.getFormalRepetitionSuppressionMultiplier(event);
      const profileRepetitionAdjusted =
        repetitionAdjusted * this.getProfileRepetitionPressureMultiplier(event);
      const adjacentAdjusted = profileRepetitionAdjusted * this.getAdjacentClassSuppressionMultiplier(event);
      const routeAdjusted = adjacentAdjusted * this.getRouteSchedulingMultiplier(event, narrativeContext);
      return sum + this.adjustWeightByAnnualPressure(event, routeAdjusted);
    }, 0);

    if (totalWeight <= 0) {
      return events[events.length - 1];
    }

    let random = Math.random() * totalWeight;

    for (const event of events) {
      const pathAdjusted = this.adjustWeightByPath(event, eventLoader.getWeightForAge(event, currentAge), dominantPaths);
      const traitAdjusted = pathAdjusted * traitSystem.getEventWeightMultiplier(this.gameState, event);
      const originAdjusted =
        traitAdjusted *
        getOriginChildhoodEventMultiplier(
          this.gameState,
          traitSystem.getEventBiasTags(event),
        );
      const stateAdjusted = originAdjusted * this.getFormalEventStateMultiplier(event);
      const specializationAdjusted = stateAdjusted * this.getSpecializationMultiplier(event);
      const repetitionAdjusted = specializationAdjusted * this.getFormalRepetitionSuppressionMultiplier(event);
      const profileRepetitionAdjusted =
        repetitionAdjusted * this.getProfileRepetitionPressureMultiplier(event);
      const adjacentAdjusted = profileRepetitionAdjusted * this.getAdjacentClassSuppressionMultiplier(event);
      const routeAdjusted = adjacentAdjusted * this.getRouteSchedulingMultiplier(event, narrativeContext);
      random -= this.adjustWeightByAnnualPressure(event, routeAdjusted);
      if (random <= 0) {
        return event;
      }
    }

    return events[events.length - 1];
  }

  /** P22 live-ops expansion events stay in catalog until explicitly activated. */
  private isLiveOpsExpansionSelectable(event: EventDefinition): boolean {
    const tags = event.metadata?.tags ?? [];
    if (!tags.includes('live_ops_expansion')) {
      return true;
    }
    const flags = this.gameState.flags ?? this.gameState.player?.flags ?? {};
    return Boolean(flags.p22_live_ops_active);
  }

  private getHistoryRecordSuppressionClass(eventId: string): 'injury' | 'illness' | 'economy' | null {
    const historicalEvent = eventLoader.getEventById(eventId);
    if (historicalEvent) {
      return this.detectSuppressionClass(historicalEvent);
    }
    if (!eventId.startsWith('daily_')) {
      return null;
    }
    const id = eventId.toLowerCase();
    if (/trade|merchant|business|economy|money/.test(id)) {
      return 'economy';
    }
    if (/injury|hurt|wound/.test(id)) {
      return 'injury';
    }
    if (/illness|sick|disease/.test(id)) {
      return 'illness';
    }
    return null;
  }

  private getAdjacentClassSuppressionMultiplier(event: EventDefinition): number {
    if (this.isDailyEvent(event) || this.isMandatoryEvent(event)) {
      return 1;
    }

    const suppressionClass = this.detectSuppressionClass(event);
    if (!suppressionClass) {
      return 1;
    }

    const currentAge = this.gameState.player?.age || 0;
    const eventHistory = this.gameState.eventHistory || [];
    for (let index = eventHistory.length - 1; index >= 0; index -= 1) {
      const record = eventHistory[index];
      const ageGap = currentAge - (record.age ?? currentAge);
      if (ageGap > 1) {
        break;
      }
      if (ageGap < 1) {
        continue;
      }
      if (this.getHistoryRecordSuppressionClass(record.eventId) === suppressionClass) {
        return 0.12;
      }
    }
    return 1;
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
    if (tags.includes('economy') || this.hasEconomySuppressionSignal(textBlob)) {
      return 'economy';
    }
    return null;
  }

  private hasEconomySuppressionSignal(textBlob: string): boolean {
    const stripped = textBlob.replace(/本钱/g, '');
    return /economy|merchant|business|trade|money|经济|商|银两|破产|财产损失|财富|财产|缺钱|破财|损财/.test(
      stripped
    );
  }

  private isHighNegativeEvent(event: EventDefinition): boolean {
    if (event.isSetbackEvent) {
      return true;
    }
    const tags = (event.metadata?.tags || []).map(tag => tag.toLowerCase());
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
    const isSetback = event.isSetbackEvent === true;
    if (!isSetback && (!suppressionClass || !this.isHighNegativeEvent(event))) {
      return 1;
    }
    if (!this.isHighNegativeEvent(event)) {
      return 1;
    }

    const currentAge = this.gameState.player?.age || 0;
    const eventHistory = this.gameState.eventHistory || [];
    if (eventHistory.length === 0) {
      return 1;
    }

    let recentSameClass = 0;
    let recentSameEvent = 0;
    let recentAnySetback = 0;

    for (const record of eventHistory) {
      const ageGap = currentAge - (record.age ?? currentAge);
      if (ageGap < 0 || ageGap > 3) {
        continue;
      }

      const historicalEvent = eventLoader.getEventById(record.eventId);
      const recordClass = historicalEvent
        ? this.isDailyEvent(historicalEvent)
          ? this.getHistoryRecordSuppressionClass(record.eventId)
          : this.detectSuppressionClass(historicalEvent)
        : this.getHistoryRecordSuppressionClass(record.eventId);

      if (!historicalEvent || this.isDailyEvent(historicalEvent)) {
        if (suppressionClass && recordClass === suppressionClass) {
          recentSameClass += 1;
        }
        continue;
      }

      if (record.eventId === event.id) {
        recentSameEvent += 1;
      }

      if (suppressionClass && recordClass === suppressionClass) {
        recentSameClass += 1;
      }

      if (historicalEvent.isSetbackEvent) {
        recentAnySetback += 1;
      }
    }

    if (recentSameClass === 0 && recentSameEvent === 0 && (!isSetback || recentAnySetback === 0)) {
      return 1;
    }

    let multiplier = 1;
    if (suppressionClass) {
      multiplier *= Math.pow(0.55, recentSameClass);
      multiplier *= Math.pow(0.45, recentSameEvent);
    }
    if (isSetback && recentAnySetback > 0) {
      multiplier *= Math.pow(0.5, recentAnySetback);
    }
    return this.clampWeight(multiplier, 0.2, 1);
  }

  /** P20: profile-first repetition pressure layered on formal event selection. */
  private getProfileRepetitionPressureMultiplier(event: EventDefinition): number {
    if (this.isDailyEvent(event) || this.isMandatoryEvent(event)) {
      return 1;
    }
    return getProfileRepetitionPressureMultiplier(this.gameState, event);
  }

  /**
   * 跨年龄节奏：近期连续 formal 且窗口内无 daily 时，regular formal 让位给 daily。
   * 不影响 critical / storyline lane。
   */
  private static readonly REGULAR_FORMAL_DAILY_CADENCE_WINDOW = 6;

  private isDailyHistoryRecord(eventId: string): boolean {
    const historicalEvent = eventLoader.getEventById(eventId);
    if (historicalEvent) {
      return this.isDailyEvent(historicalEvent);
    }
    // DailyEventSystem 动态生成的事件不在 loader 中，用 id 前缀识别。
    return eventId.startsWith('daily_');
  }

  private shouldYieldRegularFormalToDailyCadence(): boolean {
    const eventHistory = this.gameState.eventHistory || [];
    const windowSize = GameEngineIntegration.REGULAR_FORMAL_DAILY_CADENCE_WINDOW;
    if (eventHistory.length < windowSize) {
      return false;
    }

    const recent = eventHistory.slice(-windowSize);
    for (const record of recent) {
      if (this.isDailyHistoryRecord(record.eventId)) {
        return false;
      }
    }

    return true;
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
    
    const routeConflictCheckedEvents = untriggeredEvents.filter(event => this.passesRouteConflictChecks(event));

    if (routeConflictCheckedEvents.length === 0) {
      return dailyEventSystem.selectEvent(this.gameState);
    }

    // 获取玩家当前主导路径
    const dominantPaths = this.getDominantPaths();
    
    // 过滤掉与主导路径强烈冲突的事件
    const compatibleEvents = routeConflictCheckedEvents.filter(event => {
      if (this.isPathConflicting(event, dominantPaths)) {
        return false; // 过滤冲突事件
      }
      return true;
    });
    
    // 如果没有兼容事件，回退到所有未触发事件
    const finalEvents = compatibleEvents.length > 0 ? compatibleEvents : routeConflictCheckedEvents;

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

    const exactAgeMandatory = this.getExactAgeMandatoryEvents(criticalEvents, currentAge);
    if (exactAgeMandatory.length > 0) {
      return exactAgeMandatory[0];
    }

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

    // Layer 3: regular formal lane can yield to cross-age daily cadence or rhythm pause.
    if (regularFormalEvents.length === 0) {
      return dailyEventSystem.selectEvent(this.gameState);
    }

    if (this.shouldYieldRegularFormalToDailyCadence()) {
      const cadenceDaily = dailyEventSystem.selectEvent(this.gameState);
      if (cadenceDaily) {
        const dailyClass = this.getHistoryRecordSuppressionClass(cadenceDaily.id);
        const eventHistory = this.gameState.eventHistory || [];
        const lastRecord = eventHistory[eventHistory.length - 1];
        const lastClass = lastRecord
          ? this.getHistoryRecordSuppressionClass(lastRecord.eventId)
          : null;
        if (!dailyClass || dailyClass !== lastClass) {
          return cadenceDaily;
        }
      }
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
    const ageBeforeEvent = this.gameState.player?.age || 0;

    if (!event.autoEffects || event.autoEffects.length === 0) {
      this.recordEventTrigger(event, ageBeforeEvent);
      appendFormalEventHistory(this.gameState, event.id, ageBeforeEvent);
      this.applyP16PostEventHooks(event);
      return { gameState: this.gameState, event };
    }
    
    const previousState = this.snapshotState(this.gameState);
    
    // 执行效果
    const updatedState = await this.eventExecutor.executeEffects(
      event.autoEffects,
      this.gameState
    );
    let adjustedState = this.applyFormalEventConsequences(previousState, updatedState, event);
    adjustedState = this.applyDailyEventLongTermHooks(previousState, adjustedState, event);
    this.applyGameState(adjustedState);
    
    // 记录事件触发（用于年度事件限制）
    this.recordEventTrigger(event, ageBeforeEvent);
    appendFormalEventHistory(this.gameState, event.id, ageBeforeEvent);

    // 难度系统：每次事件执行时都检查是否触发挫折事件
    const setbackResults = checkSetbackEvents(this.gameState, {
      suppressLethalSetbacks: this.suppressLethalSetbacks,
    });
    if (setbackResults.triggeredEvents.length > 0) {
      for (const result of setbackResults.triggeredEvents) {
        this.gameState = applySetbackEffects(this.gameState, result.event.id);
        appendFormalEventHistory(this.gameState, result.event.id, ageBeforeEvent);
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

    this.applyP16PostEventHooks(event);

    return { gameState: this.gameState, event };
  }

  private applyP16PostEventHooks(event: EventDefinition): void {
    const accumulator = this.gameState.p16TendencyShaping ?? createEmptyTendencyAccumulator();
    this.gameState.p16TendencyShaping = applyChildhoodShapingFromEvent(
      accumulator,
      event,
      this.gameState,
    );
  }

  private applyP16RareLineCheckpoints(previousAge: number, newAge: number): void {
    const checkpoints = [10, 15, 20];
    for (const checkpoint of checkpoints) {
      if (previousAge >= checkpoint || newAge < checkpoint) continue;
      const rollFlag = `p16_rare_rolled_${checkpoint}`;
      if (this.gameState.flags[rollFlag]) continue;
      const results = rollRareEventLines(this.gameState.player, this.gameState.flags);
      this.gameState.flags = applyRareLineFlags(this.gameState.flags, results);
      this.gameState.flags[rollFlag] = true;
      const triggered = results.filter(result => result.triggered).map(result => result.lineId);
      if (triggered.length > 0) {
        this.gameState.p16RareLineLog = [...(this.gameState.p16RareLineLog ?? []), ...triggered];
      }
    }
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
    
    if (eventId) {
      appendFormalEventHistory(this.gameState, eventId, ageBeforeEvent);
      const choiceEvent = this.getEventDefinition(eventId);
      if (choiceEvent) {
        this.applyP16PostEventHooks(choiceEvent);
      }
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
        CriticalChoiceSystem.recordChoice(this.gameState, eventId, choiceValue, true);
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
  public startNewGame(
    name: string,
    gender: 'male' | 'female',
    options?: { enableLiveOpsActivation?: boolean },
  ): void {
    const nextState = this.createInitialState();
    const traits = traitSystem.generateTraits();
    nextState.player = traitSystem.applyTraits(
      {
        ...nextState.player,
        name,
        gender,
      },
      traits,
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
    this.suppressLethalSetbacks = false;
    this.conditionEvaluator.clearCache();
    difficultyMonitor.reset();
  }

  /** P3 deterministic 0–50: disable ENG-01 random early death (WR-ENG-02). */
  public setSuppressLethalSetbacks(value: boolean): void {
    this.suppressLethalSetbacks = value;
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

    const previousAge = this.gameState.player.age;
    this.gameState.player.age = age;
    this.gameState.currentTime = { year, month, day };
    applyYouthTransitionSeeds(this.gameState, previousAge, age);
    this.applyP16RareLineCheckpoints(previousAge, age);
    this.applyLifeStateRecovery(value, unit);
    
    const unitLabel = unit === 'year' ? '年' : unit === 'month' ? '月' : '天';
    if (engineDiagnosticsEnabled()) {
      console.log(`[GameEngine] 时间推进 ${value} ${unitLabel}`);
    }
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
    const {
      trainingHabit = 0,
      studyHabit = 0,
      familyBond = 0,
      socialMomentum = 0,
    } = this.gameState.player.lifeStates;
    let multiplier = 1;

    if (tags.has('training') || tags.has('comprehension')) {
      const practiceHabit = Math.max(
        tags.has('training') ? trainingHabit : 0,
        tags.has('comprehension') ? studyHabit : 0,
      );
      multiplier *= this.clampWeight(1 + practiceHabit * 0.06, 1, 1.22);
    }

    if (tags.has('business') || tags.has('social') || tags.has('reputation')) {
      multiplier *= this.clampWeight(1 + socialMomentum * 0.08, 0.7, 1.2);
    }

    if (tags.has('family') || tags.has('romance')) {
      multiplier *= this.clampWeight(1 + familyBond * 0.06, 0.72, 1.18);
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
    this.pendingEventOutcomeNote = null;
    if (event.category === 'daily_event' || !previousState.player || !nextState.player) {
      return nextState;
    }

    const tags = traitSystem.getEventBiasTags(event);
    const lifeStates = {
      ...(nextState.player.lifeStates || traitSystem.createInitialLifeStates()),
    };

    const statDelta = (key: keyof typeof nextState.player) =>
      Number((nextState.player as any)[key] || 0) - Number((previousState.player as any)[key] || 0);

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

    if ((tags.has('training') || tags.has('risk')) && martialGain >= 8) {
      lifeStates.trainingHabit = traitSystem.clampLifeState('trainingHabit', (lifeStates.trainingHabit || 0) + 1);
    }

    if (tags.has('comprehension') && academicGain >= 3) {
      lifeStates.studyHabit = traitSystem.clampLifeState('studyHabit', (lifeStates.studyHabit || 0) + 1);
    }

    if (tags.has('business') && (moneyGain >= 25 || businessGain >= 1)) {
      lifeStates.businessHabit = traitSystem.clampLifeState('businessHabit', (lifeStates.businessHabit || 0) + 1);
      if (moneyGain >= 150 && lifeStates.familyBond > 0) {
        lifeStates.familyBond = traitSystem.clampLifeState('familyBond', lifeStates.familyBond - 1);
      }
    }

    if ((tags.has('social') || tags.has('reputation')) && socialGain >= 3) {
      lifeStates.socialMomentum = traitSystem.clampLifeState('socialMomentum', lifeStates.socialMomentum + 1);
    }

    if ((tags.has('family') || tags.has('romance')) && familyGain >= 2) {
      lifeStates.familyBond = traitSystem.clampLifeState('familyBond', lifeStates.familyBond + 1);
    }

    const projected = this.projectHabitCompatibilityFlags(
      lifeStates,
      nextState.player.flags || {},
      nextState.flags || {},
    );

    return {
      ...nextState,
      player: {
        ...nextState.player,
        lifeStates: projected.lifeStates,
        flags: projected.playerFlags,
      },
      flags: projected.gameFlags,
    };
  }

  private applyDailyEventLongTermHooks(
    previousState: GameState,
    nextState: GameState,
    event: EventDefinition,
  ): GameState {
    if (event.category !== 'daily_event' || !nextState.player) {
      return nextState;
    }

    const config = dailyEventSystem.getConfigByVariantId(event.id);
    if (!config?.longTermHooks) {
      return nextState;
    }

    const lifeStates = {
      ...(nextState.player.lifeStates || traitSystem.createInitialLifeStates()),
    };

    for (const tendency of config.longTermHooks.addTendency || []) {
      const habitState = this.mapLegacyHabitFlagToLifeState(tendency);
      if (!habitState) {
        continue;
      }
      lifeStates[habitState] = traitSystem.clampLifeState(habitState, (lifeStates[habitState] || 0) + 1);
    }

    for (const repeatRule of config.longTermHooks.addStateOnRepeat || []) {
      const previousValue = previousState.player?.lifeStates?.[repeatRule.state] || 0;
      const currentValue = nextState.player.lifeStates?.[repeatRule.state] || 0;
      const alreadyReached = previousValue >= repeatRule.repeatThreshold;
      const reachedNow = currentValue >= repeatRule.repeatThreshold;
      if (!alreadyReached && reachedNow) {
        lifeStates[repeatRule.state] = traitSystem.clampLifeState(
          repeatRule.state,
          (lifeStates[repeatRule.state] || 0) + repeatRule.increment,
        );
      }
    }

    const projected = this.projectHabitCompatibilityFlags(
      lifeStates,
      nextState.player.flags || {},
      nextState.flags || {},
    );

    return {
      ...nextState,
      player: {
        ...nextState.player,
        lifeStates: projected.lifeStates,
        flags: projected.playerFlags,
      },
      flags: projected.gameFlags,
    };
  }

  private mapLegacyHabitFlagToLifeState(flag: string): 'trainingHabit' | 'studyHabit' | 'businessHabit' | null {
    switch (flag) {
      case 'training_habit':
        return 'trainingHabit';
      case 'study_habit':
        return 'studyHabit';
      case 'business_habit':
        return 'businessHabit';
      default:
        return null;
    }
  }

  private projectHabitCompatibilityFlags(
    lifeStates: PlayerLifeStates,
    playerFlags: Record<string, unknown>,
    gameFlags: Record<string, unknown>,
  ): {
    lifeStates: PlayerLifeStates;
    playerFlags: Record<string, unknown>;
    gameFlags: Record<string, unknown>;
  } {
    const nextPlayerFlags = { ...playerFlags };
    const nextGameFlags = { ...gameFlags };
    const projections: Array<['training_habit' | 'study_habit' | 'business_habit', number]> = [
      ['training_habit', lifeStates?.trainingHabit || 0],
      ['study_habit', lifeStates?.studyHabit || 0],
      ['business_habit', lifeStates?.businessHabit || 0],
    ];

    for (const [flagKey, value] of projections) {
      if (value >= 1) {
        nextPlayerFlags[flagKey] = true;
        nextGameFlags[flagKey] = true;
      }
    }

    return {
      lifeStates,
      playerFlags: nextPlayerFlags,
      gameFlags: nextGameFlags,
    };
  }

  public consumeLastEventOutcomeNote(): string | null {
    const note = this.pendingEventOutcomeNote;
    this.pendingEventOutcomeNote = null;
    return note;
  }

  /** P7: whether a critical/mandatory event is pending at current age */
  public hasPendingForcedEvent(): boolean {
    const age = this.gameState.player?.age ?? 0;
    return checkPendingForcedEvent(age => this.getAvailableEvents(age), age);
  }

  /** P7: minimum active actions when no story event was selected */
  public getAvailableActiveActions() {
    const age = this.gameState.player?.age ?? 0;
    const actions = resolveChildhoodActionPalette({
      age,
      player: this.gameState.player,
      flags: this.gameState.flags,
    });
    return buildActiveActionChoices(actions);
  }

  /** P7: execute one active action (resolver + time + history) */
  public executeActiveAction(actionId: string, options?: { random?: () => number }): ActiveActionExecutionResult | null {
    this.conditionEvaluator.clearCache();
    const result = executeActiveActionOnState(this.gameState, actionId, {
      random: options?.random,
      includeDisturbance: true,
    });
    if (result) {
      this.pendingEventOutcomeNote = result.feedbackText;
    }
    return result;
  }

  /** P7: explain choice lock state for UI */
  public explainChoice(choiceId: string, condition: Condition | undefined) {
    return explainChoiceRequirement(choiceId, condition as import('../types/eventTypes').EventCondition | undefined, this.gameState, this.conditionEvaluator);
  }

  public setPlayerFeedbackMessage(message: string | null): void {
    this.gameState.playerFeedbackMessage = message ?? undefined;
  }

  public consumePlayerFeedbackMessage(): string | null {
    const msg = this.gameState.playerFeedbackMessage ?? null;
    this.gameState.playerFeedbackMessage = undefined;
    return msg;
  }
}

// 导出单例
export const gameEngine = new GameEngineIntegration();
