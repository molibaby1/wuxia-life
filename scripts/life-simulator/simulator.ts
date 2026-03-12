/**
 * 玩家生命周期自动模拟测试系统 - 主模拟器
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { advanceTime } from '../../src/utils/timeSystem';
import type { PlayerState, StoryNode, StoryChoice } from '../../src/types';
import type {
  SimulationConfig,
  ChoiceRecord,
  StateSnapshot,
  SimulationReport,
} from './types';
import { DecisionEngine } from './decisionEngine';
import { SimulatorLogger } from './logger';
import { AiEvaluator } from './aiEvaluator';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '../..');

/**
 * 默认配置
 */
const DEFAULT_CONFIG: SimulationConfig = {
  simulationYears: 80,
  randomnessWeight: 0.5,
  logLevel: 'normal',
  enableAiEvaluation: true,
  verboseOutput: true,
  startAge: 12,
  endAge: 80,
};

/**
 * 玩家生命周期模拟器
 */
export class LifeSimulator {
  private config: SimulationConfig;
  private decisionEngine: DecisionEngine;
  private logger: SimulatorLogger;
  private aiEvaluator: AiEvaluator;
  private storyNodes: StoryNode[] = [];
  private currentState: PlayerState;
  private isRunning: boolean = false;
  private choiceCount: number = 0;

  constructor(config?: Partial<SimulationConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.decisionEngine = new DecisionEngine();
    this.logger = new SimulatorLogger();
    this.aiEvaluator = new AiEvaluator(this.config);
    this.currentState = this.createInitialState();
  }

  /**
   * 创建初始玩家状态（与游戏本体完全一致）
   */
  private createInitialState(): PlayerState {
    return {
      age: 0,  // ✅ 从 0 岁开始（与游戏本体一致）
      gender: Math.random() > 0.5 ? 'male' : 'female',
      name: '模拟玩家',
      sect: null,
      martialPower: 0,  // ✅ 从 0 开始（与游戏本体一致）
      externalSkill: 0,
      internalSkill: 0,
      qinggong: 0,
      chivalry: 0,
      money: 0,  // ✅ 从 0 开始（与游戏本体一致）
      flags: new Set(),
      events: new Set(),
      children: 0,
      alive: true,
      deathReason: null,
      title: null,
      timeUnit: 'year',
      monthProgress: 0,
      dayProgress: 1,
    };
  }

  /**
   * 加载故事节点（与游戏本体完全一致）
   */
  private loadStoryNodes(): StoryNode[] {
    try {
      // ✅ 同时加载 storyData.ts 和 longEvents.ts（与游戏本体一致）
      const { storyNodes } = require('../../src/data/storyData.ts');
      const { sectJoinEvents, tournamentEvents, loveEvents } = require('../../src/data/longEvents.ts');
      
      const allNodes = [
        ...(storyNodes || []),  // ✅ 包含仙草、奇遇等所有普通事件
        ...(sectJoinEvents || []),
        ...(tournamentEvents || []),
        ...(loveEvents || []),
      ];
      
      console.log(`📚 已加载 ${allNodes.length} 个故事节点`);
      console.log(`   - storyData: ${storyNodes?.length || 0} 个（包含仙草、奇遇等）`);
      console.log(`   - longEvents: ${(sectJoinEvents?.length || 0) + (tournamentEvents?.length || 0) + (loveEvents?.length || 0)} 个（门派、武林大会、爱情线）`);
      console.log('');
      
      return allNodes;
    } catch (error) {
      console.error('❌ 加载故事节点失败:', error);
      console.log('⚠️  将使用空节点列表\n');
      return [];
    }
  }

  /**
   * 获取 mock 故事节点（备用）
   */
  private getMockStoryNodes(): StoryNode[] {
    return [];
  }

  /**
   * 评估条件
   */
  private evaluateCondition(condition: any, state: PlayerState): boolean {
    if (!condition) return true;
    if (typeof condition === 'function') {
      try {
        return condition(state);
      } catch {
        return true;
      }
    }
    
    if (condition.op === 'hasFlag' && condition.field === 'flags') {
      return state.flags.has(condition.value);
    }
    
    if (condition.op === 'hasEvent' && condition.field === 'events') {
      return state.events.has(condition.value);
    }
    
    if (condition.op === 'eq' && condition.field === 'sect') {
      return state.sect === condition.value;
    }
    
    if (['gte', 'gt', 'lte', 'lt', 'eq', 'ne'].includes(condition.op)) {
      const value = (state as any)[condition.field];
      switch (condition.op) {
        case 'gte': return value >= condition.value;
        case 'gt': return value > condition.value;
        case 'lte': return value <= condition.value;
        case 'lt': return value < condition.value;
        case 'eq': return value === condition.value;
        case 'ne': return value !== condition.value;
      }
    }
    
    if (condition.op === 'and' && Array.isArray(condition.conditions)) {
      return condition.conditions.every((c: any) => this.evaluateCondition(c, state));
    }
    
    if (condition.op === 'or' && Array.isArray(condition.conditions)) {
      return condition.conditions.some((c: any) => this.evaluateCondition(c, state));
    }
    
    return true;
  }

  /**
   * 加权随机选择节点（与游戏本体一致）
   */
  private selectNodeByWeight(nodes: StoryNode[]): StoryNode {
    const totalWeight = nodes.reduce((sum, node) => sum + (node.weight || 1), 0);
    let random = Math.random() * totalWeight;
    
    for (const node of nodes) {
      random -= node.weight || 1;
      if (random <= 0) {
        return node;
      }
    }
    
    return nodes[nodes.length - 1];
  }

  /**
   * 获取可用节点（与游戏本体完全一致）
   */
  private getAvailableNodes(state: PlayerState, allNodes: StoryNode[]): StoryNode[] {
    // 1. 优先匹配长事件的下一阶段（检查 flag 条件）
    if (state.flags.size > 0) {
      const longEventNodes = allNodes.filter(
        node => node.minAge !== undefined &&
                node.minAge <= state.age &&
                (node.maxAge === undefined || node.maxAge === null || node.maxAge >= state.age) &&
                (!node.condition || this.evaluateCondition(node.condition, state)) &&
                (
                  node.id.includes('result') || 
                  node.id.includes('_win') || 
                  node.id.includes('_lose') || 
                  node.id.includes('escaped') || 
                  node.id.includes('reported') || 
                  node.id.includes('ignored') ||
                  node.id.includes('tournament_') ||
                  node.id.includes('love_') ||
                  node.id.includes('sect_') ||
                  node.id.includes('physical_test') ||
                  node.id.includes('mental_test') ||
                  node.id.includes('accepted') ||
                  node.id.includes('rejected')
                )
      );
      
      if (longEventNodes.length > 0) {
        return [longEventNodes[0]];  // ✅ 与游戏本体一致：直接返回第一个
      }
    }
    
    // 2. 匹配单年龄节点（精确匹配）
    const exactAgeNodes = allNodes.filter(
      node => node.minAge === state.age && 
              node.maxAge === state.age && 
              (!node.condition || this.evaluateCondition(node.condition, state))
    );
    
    if (exactAgeNodes.length > 0) {
      const selectedNode = this.selectNodeByWeight(exactAgeNodes);  // ✅ 加权随机选择
      return [selectedNode];
    }
    
    // 3. 匹配年龄范围节点
    const rangeNodes = allNodes.filter(
      node => node.minAge !== undefined &&
              node.maxAge !== undefined &&
              node.minAge <= state.age && 
              node.maxAge >= state.age &&
              (!node.condition || this.evaluateCondition(node.condition, state))
    );
    
    if (rangeNodes.length > 0) {
      const selectedNode = this.selectNodeByWeight(rangeNodes);  // ✅ 加权随机选择
      return [selectedNode];
    }
    
    // 4. 匹配开放节点
    const openEndedNodes = allNodes.filter(
      node => node.minAge !== undefined &&
              node.maxAge === undefined &&
              node.minAge <= state.age &&
              (!node.condition || this.evaluateCondition(node.condition, state))
    );
    
    if (openEndedNodes.length > 0) {
      const selectedNode = this.selectNodeByWeight(openEndedNodes);  // ✅ 加权随机选择
      return [selectedNode];
    }
    
    // 5. 安全默认节点
    return [];
  }

  /**
   * 应用选择效果
   */
  private applyChoiceEffect(choice: StoryChoice, state: PlayerState): {
    stateChanges: Array<{ field: string; oldValue: any; newValue: any }>;
  } {
    const stateChanges: Array<{ field: string; oldValue: any; newValue: any }> = [];
    
    if (!choice.effect) {
      return { stateChanges };
    }
    
    const effects = choice.effect(state);
    
    Object.keys(effects).forEach(key => {
      if (key !== 'flags' && key !== 'events') {
        const oldValue = (state as any)[key];
        const newValue = effects[key];
        if (oldValue !== newValue) {
          stateChanges.push({ field: key, oldValue, newValue });
          (state as any)[key] = newValue;
        }
      }
    });
    
    // 累积 flags
    if (effects.flags) {
      const oldFlags = Array.from(state.flags);
      effects.flags.forEach((flag: string) => {
        if (!state.flags.has(flag)) {
          state.flags.add(flag);
          stateChanges.push({ 
            field: 'flags', 
            oldValue: [...oldFlags], 
            newValue: Array.from(state.flags) 
          });
        }
      });
    }
    
    // 累积 events
    if (effects.events) {
      const oldEvents = Array.from(state.events);
      effects.events.forEach((event: string) => {
        if (!state.events.has(event)) {
          state.events.add(event);
          stateChanges.push({ 
            field: 'events', 
            oldValue: [...oldEvents], 
            newValue: Array.from(state.events) 
          });
        }
      });
    }
    
    return { stateChanges };
  }

  /**
   * 记录选择
   */
  private recordChoice(
    nodeId: string,
    nodeText: string,
    availableChoices: StoryChoice[],
    selectedChoice: StoryChoice,
    reason: string,
    weights: Record<string, number> | undefined,
    stateChanges: Array<{ field: string; oldValue: any; newValue: any }>,
    stateBefore: PlayerState,
    stateAfter: PlayerState,
    eventAge?: number  // ✅ 事件发生时的年龄（在 advanceTime 之前）
  ): void {
    const recordAge = eventAge !== undefined ? eventAge : stateBefore.age;
    
    const record: ChoiceRecord = {
      timestamp: new Date().toISOString(),
      gameYear: recordAge,  // ✅ 使用事件发生时的年龄
      nodeId,
      nodeText,
      nodeType: 'choice',
      availableChoices: availableChoices.map(c => ({
        id: c.id,
        text: c.text,
        condition: c.condition,
      })),
      selectedChoiceId: selectedChoice.id,
      selectedChoiceText: selectedChoice.text,
      selectionReason: reason,
      weights,
      systemFeedback: `选择了"${selectedChoice.text}"，${this.generateFeedback(selectedChoice, stateChanges)}`,
      stateBefore: this.snapshotState(stateBefore),
      stateAfter: this.snapshotState(stateAfter),
      stateChanges,
      nodeDescription: this.generateNodeDescription(nodeId, nodeText, 'choice'),
    };
    
    this.logger.logChoice(record);
    
    if (this.config.verboseOutput && this.config.logLevel !== 'minimal') {
      console.log(`  [${recordAge}岁] ${nodeText.substring(0, 60)}...`);
      console.log(`    选择：${selectedChoice.text}`);
      console.log(`    理由：${reason}`);
      if (stateChanges.length > 0) {
        console.log(`    状态变化：${stateChanges.map(c => `${c.field}: ${c.oldValue}→${c.newValue}`).join(', ')}`);
      }
    }
  }

  /**
   * 记录自动节点
   */
  private recordAutoNode(
    nodeId: string,
    nodeText: string,
    reason: string,
    stateChanges: Array<{ field: string; oldValue: any; newValue: any }>,
    stateBefore: PlayerState,
    stateAfter: PlayerState,
    eventAge?: number  // ✅ 事件发生时的年龄
  ): void {
    const recordAge = eventAge !== undefined ? eventAge : stateBefore.age;
    
    const record: ChoiceRecord = {
      timestamp: new Date().toISOString(),
      gameYear: recordAge,  // ✅ 使用事件发生时的年龄
      nodeId,
      nodeText,
      nodeType: 'auto',
      availableChoices: [],
      selectedChoiceId: 'auto_trigger',
      selectedChoiceText: '自动触发',
      selectionReason: reason,
      systemFeedback: `自动触发节点，${this.generateAutoFeedback(stateChanges)}`,
      stateBefore: this.snapshotState(stateBefore),
      stateAfter: this.snapshotState(stateAfter),
      stateChanges,
      nodeDescription: this.generateNodeDescription(nodeId, nodeText, 'auto'),
    };
    
    this.logger.logChoice(record);
  }

  /**
   * 记录年度总结（即使没有事件也记录）
   */
  private recordYearSummary(
    age: number,
    title: string,
    description: string,
    stateBefore: PlayerState,
    stateAfter: PlayerState
  ): void {
    const record: ChoiceRecord = {
      timestamp: new Date().toISOString(),
      gameYear: age,  // ✅ 年龄参数已经是事件发生时的年龄
      nodeId: 'year_summary',
      nodeText: description,
      nodeType: 'auto',
      availableChoices: [],
      selectedChoiceId: 'time_passes',
      selectedChoiceText: '时间流逝',
      selectionReason: '年度总结',
      systemFeedback: description,
      stateBefore: this.snapshotState(stateBefore),
      stateAfter: this.snapshotState(stateAfter),
      stateChanges: [],
      nodeDescription: `[📅 年度总结] ${title}`,
    };
    
    this.logger.logChoice(record);
  }

  /**
   * 生成节点描述
   */
  private generateNodeDescription(nodeId: string, nodeText: string, nodeType: 'choice' | 'auto'): string {
    const typeLabel = nodeType === 'choice' ? '用户选择' : '自动触发';
    
    // 根据节点 ID 生成更详细的描述
    let category = '普通事件';
    if (nodeId.includes('sect') || nodeId.includes('shaolin') || nodeId.includes('wudang') || nodeId.includes('emei')) {
      category = '🏛️ 门派事件';
    } else if (nodeId.includes('tournament')) {
      category = '⚔️ 武林大会';
    } else if (nodeId.includes('love')) {
      category = '💕 爱情事件';
    } else if (nodeId.includes('physical') || nodeId.includes('mental')) {
      category = '📝 测试考核';
    } else if (nodeId.includes('accepted') || nodeId.includes('rejected')) {
      category = '📜 结果通知';
    }
    
    return `[${category} - ${typeLabel}] ${nodeText}`;
  }

  /**
   * 生成自动节点反馈
   */
  private generateAutoFeedback(stateChanges: Array<{ field: string; oldValue: any; newValue: any }>): string {
    if (stateChanges.length === 0) {
      return '状态无变化';
    }
    
    const improvements = stateChanges
      .filter(c => typeof c.newValue === 'number' && c.newValue > c.oldValue)
      .map(c => `${c.field}+${c.newValue - c.oldValue}`);
    
    const decreases = stateChanges
      .filter(c => typeof c.newValue === 'number' && c.newValue < c.oldValue)
      .map(c => `${c.field}-${c.oldValue - c.newValue}`);
    
    const parts = [];
    if (improvements.length > 0) parts.push(`提升：${improvements.join(', ')}`);
    if (decreases.length > 0) parts.push(`降低：${decreases.join(', ')}`);
    
    return parts.join('；') || '状态已更新';
  }

  /**
   * 生成系统反馈
   */
  private generateFeedback(
    choice: StoryChoice,
    stateChanges: Array<{ field: string; oldValue: any; newValue: any }>
  ): string {
    if (stateChanges.length === 0) {
      return '无明显变化';
    }
    
    const significantChanges = stateChanges.filter(c => 
      ['martialPower', 'internalSkill', 'externalSkill', 'qinggong', 'chivalry'].includes(c.field)
    );
    
    if (significantChanges.length > 0) {
      const improvements = significantChanges
        .filter(c => c.newValue > c.oldValue)
        .map(c => `${c.field}+${c.newValue - c.oldValue}`);
      
      if (improvements.length > 0) {
        return `提升了 ${improvements.join(', ')}`;
      }
    }
    
    return '状态已更新';
  }

  /**
   * 创建状态快照
   */
  private snapshotState(state: PlayerState): Partial<PlayerState> {
    return {
      age: state.age,
      sect: state.sect,
      martialPower: state.martialPower,
      externalSkill: state.externalSkill,
      internalSkill: state.internalSkill,
      qinggong: state.qinggong,
      chivalry: state.chivalry,
      money: state.money,
      children: state.children,
      alive: state.alive,
      deathReason: state.deathReason,
      title: state.title,
      flags: new Set(state.flags),
      events: new Set(state.events),
    };
  }

  /**
   * 记录状态快照
   */
  private recordStateSnapshot(): void {
    const snapshot: StateSnapshot = {
      timestamp: new Date().toISOString(),
      age: this.currentState.age,
      state: this.snapshotState(this.currentState) as PlayerState,
      recentEvents: Array.from(this.currentState.events).slice(-10), // 增加记录数量
      recentFlags: Array.from(this.currentState.flags).slice(-10),
    };
    
    this.logger.logSnapshot(snapshot);
  }

  /**
   * 运行单年模拟
   */
  private async simulateYear(): Promise<boolean> {
    if (!this.currentState.alive || this.currentState.age >= this.config.endAge) {
      return false;
    }
    
    const nodes = this.getAvailableNodes(this.currentState, this.storyNodes);
    const stateBefore = { ...this.currentState };
    
    // 记录这一年的开始
    if (this.config.verboseOutput && this.config.logLevel === 'verbose') {
      console.log(`\n[${this.currentState.age}岁] 新的一年开始了...`);
    }
    
    if (nodes.length === 0) {
      // 没有特殊事件，进行基础修炼（与游戏本体一致）
      const stateAfter = { ...this.currentState };
      
      // 基础修炼成长（8 岁开始）
      if (this.currentState.age >= 8) {
        const progress = Math.random();
        if (progress < 0.3) {
          stateAfter.externalSkill = stateAfter.externalSkill + 2;
          stateAfter.internalSkill = stateAfter.internalSkill + 2;
          stateAfter.martialPower = stateAfter.martialPower + 2;
        } else if (progress < 0.6) {
          stateAfter.qinggong = stateAfter.qinggong + 1;
          stateAfter.money = stateAfter.money + Math.floor(Math.random() * 10);
        }
        // else: 无变化
      }
      
      // 应用成长
      Object.assign(this.currentState, stateAfter);
      
      // 记录修炼成果
      const stateChanges: Array<{ field: string; oldValue: any; newValue: any }> = [];
      Object.keys(stateAfter).forEach(key => {
        if ((stateAfter as any)[key] !== stateBefore[key]) {
          stateChanges.push({ 
            field: key, 
            oldValue: stateBefore[key], 
            newValue: (stateAfter as any)[key] 
          });
        }
      });
      
      this.recordYearSummary(
        this.currentState.age,
        stateChanges.length > 0 ? '修炼进步' : '平静的一年',
        stateChanges.length > 0 
          ? `这一年你潜心修炼，${stateChanges.map(c => `${c.field}+${c.newValue - c.oldValue}`).join(', ')}`
          : '这一年没有发生特别的事件，你继续日常的生活和修炼。',
        stateBefore,
        this.currentState
      );
      
      this.currentState.age++;
      return true;
    }
    
    // 选择一个节点（权重最高的）
    const node = nodes[0];
    
    // 检查是否是自动节点
    if (node.autoNext && node.autoEffect) {
      const eventAge = this.currentState.age;  // ✅ 保存事件发生时的年龄
      const stateBefore = { ...this.currentState };
      const effects = node.autoEffect(this.currentState);
      
      // 应用自动效果
      const stateChanges: Array<{ field: string; oldValue: any; newValue: any }> = [];
      Object.keys(effects).forEach(key => {
        if (key !== 'flags' && key !== 'events') {
          const oldValue = (this.currentState as any)[key];
          const newValue = effects[key];
          if (oldValue !== newValue) {
            stateChanges.push({ field: key, oldValue, newValue });
            (this.currentState as any)[key] = newValue;
          }
        }
      });
      if (effects.flags) {
        const oldFlags = Array.from(this.currentState.flags);
        this.currentState.flags = effects.flags;
        stateChanges.push({ field: 'flags', oldValue: oldFlags, newValue: Array.from(effects.flags) });
      }
      if (effects.events) {
        const oldEvents = Array.from(this.currentState.events);
        this.currentState.events = new Set([...this.currentState.events, ...effects.events]);
        stateChanges.push({ field: 'events', oldValue: oldEvents, newValue: Array.from(this.currentState.events) });
      }
      
      // 记录自动节点（传入事件年龄）
      this.recordAutoNode(
        node.id,
        node.text,
        '自动节点',
        stateChanges,
        stateBefore,
        this.currentState,
        eventAge  // ✅ 传入事件发生时的年龄
      );
      
      if (this.config.verboseOutput && this.config.logLevel !== 'minimal') {
        console.log(`  [${eventAge}岁] ${node.text.substring(0, 60)}...`);
        console.log(`    自动触发`);
        if (stateChanges.length > 0) {
          console.log(`    状态变化：${stateChanges.map(c => `${c.field}: ${c.oldValue}→${c.newValue}`).join(', ')}`);
        }
      }
      
      // ✅ 注意：autoEffect 中已经包含 age+1，不需要再调用 advanceTime
      this.recordStateSnapshot();
      
      return true;
    }
    
    if (!node.choices || node.choices.length === 0) {
      // 没有选择的节点，年龄增长
      this.currentState.age++;
      return true;
    }
    
    // 过滤可用选择
    const availableChoices = node.choices.filter(choice => {
      if (!choice.condition) return true;
      try {
        return choice.condition(this.currentState);
      } catch {
        return true;
      }
    });
    
    if (availableChoices.length === 0) {
      this.currentState.age++;
      return true;
    }
    
    // 保存事件发生时的年龄
    const eventAge = this.currentState.age;
    
    // 做出选择
    const { selectedChoice, reason, weights } = await this.decisionEngine.makeChoice(
      node.id,
      availableChoices,
      this.currentState,
      this.config
    );
    
    // 应用效果
    const { stateChanges } = this.applyChoiceEffect(selectedChoice, this.currentState);
    
    // 记录选择（传入事件年龄）
    this.recordChoice(
      node.id,
      node.text,
      availableChoices,
      selectedChoice,
      reason,
      weights,
      stateChanges,
      stateBefore,
      this.currentState,
      eventAge  // ✅ 传入事件发生时的年龄
    );
    
    this.choiceCount++;
    
    // ✅ 注意：choice.effect 中已经包含 age+1，不需要再调用 advanceTime
    this.recordStateSnapshot();
    
    return true;
  }

  /**
   * 运行完整模拟
   */
  async run(): Promise<SimulationReport> {
    console.log('\n🎮 ' + '='.repeat(50));
    console.log('玩家生命周期自动模拟测试系统 v1.0');
    console.log('='.repeat(50) + '\n');
    
    console.log('📋 模拟配置:');
    console.log(`   起始年龄：${this.config.startAge}`);
    console.log(`   结束年龄：${this.config.endAge}`);
    console.log(`   随机性权重：${this.config.randomnessWeight}`);
    console.log(`   日志级别：${this.config.logLevel}`);
    console.log(`   AI 评估：${this.config.enableAiEvaluation ? '启用' : '禁用'}\n`);
    
    // 加载故事节点
    this.storyNodes = this.loadStoryNodes();
    console.log(`📚 已加载 ${this.storyNodes.length} 个故事节点\n`);
    
    // 初始化状态
    this.currentState = this.createInitialState();
    this.choiceCount = 0;
    this.isRunning = true;
    this.logger.reset();
    
    console.log(`👤 初始状态:`);
    console.log(`   性别：${this.currentState.gender}`);
    console.log(`   年龄：${this.currentState.age}`);
    console.log(`   武功：${this.currentState.martialPower}`);
    console.log(`   外功：${this.currentState.externalSkill}`);
    console.log(`   内力：${this.currentState.internalSkill}`);
    console.log(`   轻功：${this.currentState.qinggong}`);
    console.log(`   侠义：${this.currentState.chivalry}\n`);
    
    console.log('🚀 开始模拟...\n');
    
    // 运行模拟
    while (await this.simulateYear()) {
      // 继续模拟
    }
    
    this.isRunning = false;
    
    console.log('\n✅ 模拟完成!\n');
    
    // 生成报告
    console.log('📊 生成报告...');
    const report = await this.logger.generateReport(this.config, this.currentState);
    
    // AI 评估
    if (this.config.enableAiEvaluation) {
      console.log('🤖 执行 AI 评估...');
      const aiEvaluation = this.aiEvaluator.evaluate(
        report.choiceRecords,
        report.stateSnapshots
      );
      report.aiEvaluation = aiEvaluation;
      
      console.log(`\n   整体评分：${aiEvaluation.overallScore.toFixed(1)} / 100`);
      console.log(`   连贯性：${aiEvaluation.dimensions.coherence.toFixed(1)}`);
      console.log(`   反馈关联性：${aiEvaluation.dimensions.feedbackRelevance.toFixed(1)}`);
      console.log(`   状态转换：${aiEvaluation.dimensions.stateTransitionLogic.toFixed(1)}`);
      console.log(`   决策合理性：${aiEvaluation.dimensions.decisionRationality.toFixed(1)}`);
      console.log(`\n   AI 总结：${aiEvaluation.summary}`);
      
      if (aiEvaluation.recommendations.length > 0) {
        console.log('\n   改进建议:');
        aiEvaluation.recommendations.forEach((rec, i) => {
          console.log(`   ${i + 1}. ${rec}`);
        });
      }
    }
    
    // 导出报告
    console.log('\n📄 导出报告...');
    const timestamp = Date.now();
    const jsonPath = join(__dirname, `reports/life-sim-report-${timestamp}.json`);
    const htmlPath = join(__dirname, `reports/life-sim-report-${timestamp}.html`);
    
    // 确保 reports 目录存在
    const reportsDir = join(__dirname, 'reports');
    if (!existsSync(reportsDir)) {
      mkdirSync(reportsDir, { recursive: true });
    }
    
    this.logger.exportToJson(jsonPath, report);
    this.logger.exportToHtml(htmlPath, report);
    
    // 更新报告清单
    console.log('\n🔄 更新报告清单...');
    try {
      const { execSync } = await import('child_process');
      execSync('npx tsx generate-manifest.ts', { 
        cwd: __dirname,
        stdio: 'ignore'
      });
      console.log('✅ 报告清单已更新');
    } catch (error) {
      console.error('⚠️  更新清单失败:', error);
    }
    
    console.log('\n🎉 模拟测试全部完成!\n');
    console.log(`📊 JSON 报告：${jsonPath}`);
    console.log(`📄 HTML 报告：${htmlPath}`);
    console.log(`🌐 报告中心：file://${join(__dirname, 'index.html')}\n`);
    
    return report;
  }
}

/**
 * 主函数
 */
async function main() {
  // 从命令行参数解析配置
  const args = process.argv.slice(2);
  const config: Partial<SimulationConfig> = {};
  
  args.forEach(arg => {
    if (arg.startsWith('--years=')) {
      config.simulationYears = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--randomness=')) {
      config.randomnessWeight = parseFloat(arg.split('=')[1]);
    } else if (arg.startsWith('--log=')) {
      config.logLevel = arg.split('=')[1] as any;
    } else if (arg === '--no-ai') {
      config.enableAiEvaluation = false;
    } else if (arg === '--quiet') {
      config.verboseOutput = false;
    }
  });
  
  const simulator = new LifeSimulator(config);
  await simulator.run();
}

// 运行
main().catch(console.error);
