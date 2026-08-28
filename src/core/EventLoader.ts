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
import type { EffectDefinition, EventCondition, EventDefinition } from '../types/eventTypes';
import eventsIndexJson from '../data/events.json';
import generalEventsJson from '../data/lines/general.json';
import originEventsJson from '../data/lines/origin.json';
import officialEventsJson from '../data/lines/official.json';
import loveEventsJson from '../data/lines/love.json';
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
// 身份专属事件
import heroEventsJson from '../data/lines/identity-hero.json';
import merchantEventsJson from '../data/lines/identity-merchant.json';
import demonEventsJson from '../data/lines/identity-demon.json';

// 身份年度剧情模块
import identityYearEventsJson from '../data/lines/identity-year-events.json';

// 阵营相关事件
import factionEventsJson from '../data/lines/faction-revelation.json';

// 难度系统 - 挫折事件
import setbackEventsJson from '../data/lines/setback-events.json';
import p9RemediationEventsJson from '../data/lines/p9-remediation.json';
import p11ValidationEventsJson from '../data/lines/p11-validation.json';
import p21ContentSamplesJson from '../data/lines/p21-content-samples.json';
import p22ContentExpansionsJson from '../data/lines/p22-content-expansions.json';
import medicalEventsJson from '../data/lines/medical.json';
import relationshipEventsJson from '../data/lines/relationship.json';
import merchantLineEventsJson from '../data/lines/merchant.json';
import sampleLinesSpineEventsJson from '../data/lines/sample-lines-spine.json';

// import pathExamplesJson from '../data/lines/path-examples.json';

const generalEvents = generalEventsJson as EventDefinition[];
const loveEvents = loveEventsJson as EventDefinition[];
const officialEvents = officialEventsJson as EventDefinition[];
const originEvents = originEventsJson as EventDefinition[];
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
// 身份专属事件
const heroEvents = heroEventsJson as EventDefinition[];
const merchantEvents = merchantEventsJson as EventDefinition[];
const demonEvents = demonEventsJson as EventDefinition[];

// 身份年度剧情模块
const identityYearEvents = identityYearEventsJson as EventDefinition[];

// 阵营相关事件
const factionEvents = factionEventsJson as EventDefinition[];

// 难度系统 - 挫折事件
const setbackEvents = setbackEventsJson as EventDefinition[];
const p9RemediationEvents = p9RemediationEventsJson as EventDefinition[];
const p11ValidationEvents = p11ValidationEventsJson as EventDefinition[];
const p21ContentSamples = p21ContentSamplesJson as EventDefinition[];
const p22ContentExpansions = p22ContentExpansionsJson as EventDefinition[];
const medicalEvents = medicalEventsJson as EventDefinition[];
const relationshipEvents = relationshipEventsJson as EventDefinition[];
const merchantLineEvents = merchantLineEventsJson as EventDefinition[];
const sampleLinesSpineEvents = sampleLinesSpineEventsJson as EventDefinition[];

const eventsIndex = eventsIndexJson as {
  version: string;
  imports: string[];
  notes?: string;
};

export function collectChoiceIdValidationErrors(events: EventDefinition[]): string[] {
  const errors: string[] = [];

  for (const event of events) {
    if (event.eventType !== 'choice' || !Array.isArray(event.choices)) {
      continue;
    }

    const firstChoiceIndexById = new Map<string, number>();
    event.choices.forEach((choice, index) => {
      if (typeof choice.id !== 'string' || choice.id.trim().length === 0) {
        errors.push(`事件 ${event.id} 的第 ${index} 个选择缺少有效 ID`);
        return;
      }

      const firstChoiceIndex = firstChoiceIndexById.get(choice.id);
      if (firstChoiceIndex !== undefined) {
        errors.push(
          `choice.id "${choice.id}" 重复：事件 ${event.id} 的第 ${firstChoiceIndex} 个选择与第 ${index} 个选择重复`,
        );
        return;
      }

      firstChoiceIndexById.set(choice.id, index);
    });
  }

  return errors;
}

const MONEY_EXPRESSION_PATTERN = /(?:player\s*\.\s*money|\bmoney\b)/i;

function describeWalletAuthoringLocation(eventId: string, path: string): string {
  return path ? `事件 ${eventId} @ ${path}` : `事件 ${eventId}`;
}

function collectMoneyExpressionHits(expression: string, eventId: string, path: string, errors: string[]): void {
  if (!MONEY_EXPRESSION_PATTERN.test(expression)) {
    return;
  }
  errors.push(
    `${describeWalletAuthoringLocation(eventId, path)}: formal wallet expression/condition authoring is retired (${expression})`,
  );
}

function collectWalletEffectErrors(
  effect: EffectDefinition,
  eventId: string,
  path: string,
  errors: string[],
): void {
  const effectType = String(effect.type ?? '');
  if (effectType === 'money_modify' || effectType === 'MONEY_MODIFY') {
    errors.push(
      `${describeWalletAuthoringLocation(eventId, path)}: money_modify effect authoring is retired`,
    );
  }

  const target = effect.target ?? (effect as { stat?: string }).stat;
  if (effectType === 'stat_modify' && target === 'money') {
    errors.push(
      `${describeWalletAuthoringLocation(eventId, path)}: stat_modify targeting money is retired`,
    );
  }

  for (const [index, nested] of (effect.effects ?? []).entries()) {
    collectWalletEffectErrors(nested, eventId, `${path}.effects[${index}]`, errors);
  }
}

function collectWalletConditionErrors(
  condition: EventCondition | EventCondition[] | null | undefined,
  eventId: string,
  path: string,
  errors: string[],
): void {
  if (!condition) {
    return;
  }
  if (Array.isArray(condition)) {
    condition.forEach((entry, index) => {
      collectWalletConditionErrors(entry, eventId, `${path}[${index}]`, errors);
    });
    return;
  }
  if (condition.type === 'expression' && typeof condition.expression === 'string') {
    collectMoneyExpressionHits(condition.expression, eventId, path, errors);
  }
}

/**
 * Formal EventLoader wallet authoring guard.
 * Rejects money stat_modify / money_modify / exact-money expression conditions
 * in the formal loaded catalog only (events.json → EventLoader), not deferred line files.
 */
export function collectFormalWalletAuthoringErrors(events: EventDefinition[]): string[] {
  const errors: string[] = [];

  for (const event of events) {
    collectWalletConditionErrors(event.conditions ?? null, event.id, 'conditions', errors);
    collectWalletConditionErrors(
      (event as { triggerConditions?: EventCondition[] | null }).triggerConditions ?? null,
      event.id,
      'triggerConditions',
      errors,
    );

    for (const [index, effect] of (event.autoEffects ?? []).entries()) {
      collectWalletEffectErrors(effect, event.id, `autoEffects[${index}]`, errors);
    }

    for (const [choiceIndex, choice] of (event.choices ?? []).entries()) {
      const choicePath = `choices[${choiceIndex}]`;
      collectWalletConditionErrors(choice.condition, event.id, `${choicePath}.condition`, errors);
      for (const [effectIndex, effect] of (choice.effects ?? []).entries()) {
        collectWalletEffectErrors(effect, event.id, `${choicePath}.effects[${effectIndex}]`, errors);
      }
      for (const [outcomeIndex, outcome] of (choice.outcomes ?? []).entries()) {
        const outcomePath = `${choicePath}.outcomes[${outcomeIndex}]`;
        collectWalletConditionErrors(
          (outcome as { condition?: EventCondition }).condition,
          event.id,
          `${outcomePath}.condition`,
          errors,
        );
        for (const [effectIndex, effect] of (outcome.effects ?? []).entries()) {
          collectWalletEffectErrors(effect, event.id, `${outcomePath}.effects[${effectIndex}]`, errors);
        }
      }
    }
  }

  return errors;
}

/**
 * 事件加载器类
 */
export class EventLoader {
  private static instance: EventLoader;
  private allEvents: EventDefinition[] = [];
  private eventsById: Map<string, EventDefinition> = new Map();
  private loadedImportPaths = new Set<string>();
  
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
      // 身份专属事件
      './lines/identity-hero.json': heroEvents,
      './lines/identity-merchant.json': merchantEvents,
      './lines/identity-demon.json': demonEvents,
      // 身份年度剧情模块
      './lines/identity-year-events.json': identityYearEvents,
      // 阵营相关事件
      './lines/faction-revelation.json': factionEvents,
      // 难度系统 - 挫折事件
      './lines/setback-events.json': setbackEvents,
      './lines/p9-remediation.json': p9RemediationEvents,
      './lines/p11-validation.json': p11ValidationEvents,
      './lines/p21-content-samples.json': p21ContentSamples,
      './lines/p22-content-expansions.json': p22ContentExpansions,
      './lines/medical.json': medicalEvents,
      './lines/relationship.json': relationshipEvents,
      './lines/merchant.json': merchantLineEvents,
      './lines/sample-lines-spine.json': sampleLinesSpineEvents,
    };
    
    const orderedLines = (eventsIndex.imports || [])
      .map(path => lineMap[path])
      .filter(Boolean);
    
    // 合并所有事件（按入口文件顺序组织）
    this.allEvents = orderedLines.flat();
    
    
    this.loadedImportPaths = new Set(Object.keys(lineMap));

    const missingImports = (eventsIndex.imports || []).filter(path => !lineMap[path]);
    if (missingImports.length > 0) {
      console.warn(
        `[EventLoader] events.json declares imports not loaded: ${missingImports.join(', ')}`
      );
    }

    // 建立索引
    this.buildIndexes();
  }

  /** 声明导入但未进入 lineMap 的路径（应为空） */
  public getUndeclaredImportPaths(): string[] {
    return (eventsIndex.imports || []).filter(path => !this.loadedImportPaths.has(path));
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
    errors.push(...collectChoiceIdValidationErrors(this.allEvents));
    
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
      const hasAutoEffects = event.autoEffects || event.content?.autoEffects;
      if (event.eventType === 'auto' && !hasAutoEffects) {
        errors.push(`自动事件 ${event.id} 缺少 autoEffects`);
      }
      
      // 验证选择事件
      if (event.eventType === 'choice') {
        if (!event.choices || event.choices.length === 0) {
          errors.push(`选择事件 ${event.id} 缺少 choices`);
        } else {
          event.choices.forEach((choice, index) => {
            if (!choice.text) {
              errors.push(`事件 ${event.id} 的第 ${index} 个选择缺少文本`);
            }
            const hasDirectEffects = Array.isArray(choice.effects) && choice.effects.length > 0;
            const hasOutcomeEffects = Array.isArray(choice.outcomes)
              && choice.outcomes.some(
                outcome => Array.isArray(outcome.effects) && outcome.effects.length > 0,
              );
            if (!hasDirectEffects && !hasOutcomeEffects) {
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
    
    
    // 按类型统计
    const autoEvents = this.allEvents.filter(e => e.eventType === 'auto').length;
    const choiceEvents = this.allEvents.filter(e => e.eventType === 'choice').length;
    const endingEvents = this.allEvents.filter(e => e.eventType === 'ending').length;
    
    
    // 按分类统计
    const mainStoryCount = this.getEventsByCategory(EventCategory.MAIN_STORY).length;
    const sideQuestCount = this.getEventsByCategory(EventCategory.SIDE_QUEST).length;
    const specialEventCount = this.getEventsByCategory(EventCategory.SPECIAL_EVENT).length;
    
    
    // 验证结果
    const validation = this.validateEvents();
    if (!validation.valid) {
    }
    
  }
}

// 创建并导出单例
export const eventLoader = EventLoader.getInstance();

// 打印统计信息
eventLoader.printStatistics();
