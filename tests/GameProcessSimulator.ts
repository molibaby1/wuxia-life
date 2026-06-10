/**
 * 游戏过程模拟测试器
 * 
 * 功能：完全模拟真实用户的游戏体验流程
 * - 创建角色
 * - 选择事件选项
 * - 推进时间
 * - 使用存档功能
 * - 查看历史记录
 * - 完整的人生模拟（0 岁 → 死亡）
 * 
 * 输出：详细的游戏过程测试报告（HTML + JSON）
 */

import { gameEngine } from '../src/core/GameEngineIntegration';
import { RouteStateManager } from '../src/core/RouteStateManager';
import { saveManager } from '../src/core/SaveManager';
import { EndingSystem } from '../src/core/EndingSystem';
import { traitSystem } from '../src/core/TraitSystem';
import { resolveChoiceEffects } from '../src/core/ChoiceOutcomeResolver';
import type { GameState, EventDefinition, EventChoice, EventCondition } from '../src/types/eventTypes';
import type { GameProcessRecord } from '../src/types/simulationRecordTypes';
export type { GameProcessRecord } from '../src/types/simulationRecordTypes';
import { buildDeathRiskTelemetry, type DeathRiskTelemetry } from '../scripts/deathRiskTelemetry';
import {
  applyRouteTrackFixtureBootstrap,
  applyRouteTrackPreparation,
  enforceRouteTrackIsolation,
  hasGameEnded as sharedHasGameEnded,
} from '../src/headless/parity/routeTrackFixtures';
import {
  ACTIVE_ACTION_REPLAY_RANDOM,
  toActiveActionReplayEventId,
} from '../src/core/activePlanning/activeActionReplay';
import { getActionById } from '../src/data/activeActionCatalog';
import { getP8PersonaById } from '../src/p8/personas';
import type { P8Persona } from '../src/p8/types';
import { selectPersonaActiveAction } from '../src/p8/personaActionStrategy';
import {
  applyPersonaChoiceBias,
  rankChoiceScores,
} from '../src/p8/personaChoiceBias';
import type { ChoiceScoreDiagnostic } from '../src/p8/types';
import {
  buildRomanceFamilyArcReport,
  GOLDEN_ROMANCE_FAMILY_SAMPLE_ID,
  type RomanceFamilyArcReport,
} from '../scripts/romanceFamilyArcTelemetry';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const REPORTS_DIR = path.join(process.cwd(), 'public/reports');

export interface GameProcessConfig {
  playerName: string;
  gender: 'male' | 'female';
  simulateYears: number;  // 模拟多少年
  runUntilDeath: boolean; // 是否运行到死亡/结局（完整人生）
  ageRange?: {
    startAge: number;
    endAge: number;
  };
  seed?: number; // 固定随机种子
  maxEvents: number; // 最大事件数，避免月/日推进导致无限循环
  enableAutoSave: boolean;  // 启用自动保存
  enableManualSave: boolean;  // 启用手动保存
  autoSaveMode: 'age' | 'event';
  saveAgeInterval: number;  // 按年龄自动保存间隔（年）
  saveEventInterval: number;  // 按事件自动保存间隔（事件数）
  enableSaveRestore: boolean;  // 启用自动读档恢复验证
  maxRestoreCount: number;  // 最多自动读档恢复次数
  verbose: boolean;  // 详细日志
  choiceTendency: 'balanced' | 'martial' | 'wealth' | 'relationship' | 'risk_averse';
  /** P8: fixed persona id for strategy-driven simulation */
  p8PersonaId?: string;
  /** 路线专项样本：偏向入线/完成对应路线 */
  routeTrack?: 'official' | 'beggars' | 'demonic' | 'sect' | 'wanderer';
  /** P3-EVAL sample id for death-risk telemetry cohort resolution. */
  sampleId?: string;
}

export interface GameProcessReport {
  id: string;
  timestamp: string;
  config: GameProcessConfig;
  randomSeed: number | null;
  runMode: 'complete_life' | 'age_range';
  ageRange: {
    startAge: number;
    endAge: number;
  } | null;
  totalYears: number;
  finalAge: number;
  isAlive: boolean;
  deathReason: string | null;
  /** P3 US-005: populated when simulation ends with death or forced ending. */
  deathRiskTelemetry?: DeathRiskTelemetry | null;
  /** P3 US-010: romance/family arc regression snapshot when sampleId is set. */
  romanceFamilyArcReport?: RomanceFamilyArcReport | null;
  totalEvents: number;
  totalChoices: number;
  totalSaves: number;
  totalLoads: number;
  persistenceConsistency: {
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    results: {
      saveId: string;
      age: number;
      passed: boolean;
      mismatchedFields: string[];
    }[];
  };
  records: GameProcessRecord[];
  statistics: {
    childhoodEvents: number;
    youthEvents: number;
    adultEvents: number;
    elderlyEvents: number;
    autoEvents: number;
    choiceEvents: number;
    martialPowerGrowth: number;
    moneyGrowth: number;
    sectJoined: string | null;
    sectStatus?: string;  // 门派地位
    spouse?: string;      // 配偶
    children?: number;    // 子女数量
    origin?: string;
    coreTalent?: string;
    weakness?: string;
    temperament?: string;
    lifeStates?: Record<string, number>;
    dailyEventCount?: number;
    growthBiasSummary?: string[];
    endingSummary?: string;
    flags?: Record<string, any>;  // 其他重要标志
  };
  /** P8: aggregated choice diagnostics for reports */
  p8ChoiceDiagnostics?: ChoiceScoreDiagnostic[];
  p8ActiveActionReasons?: Array<{ age: number; actionId: string; reason: string }>;
}

/**
 * 游戏过程模拟器
 */
export class GameProcessSimulator {
  private config: GameProcessConfig;
  private records: GameProcessRecord[] = [];
  private saveCount: number = 0;
  private loadCount: number = 0;
  private autoSaveIds: string[] = [];
  private consistencyChecks: {
    saveId: string;
    age: number;
    passed: boolean;
    mismatchedFields: string[];
  }[] = [];
  private lastAutoSaveAge: number | null = null;
  private gameState: GameState | null = null;
  private ended: boolean = false;
  private p8ChoiceDiagnostics: ChoiceScoreDiagnostic[] = [];
  private p8ActiveActionReasons: Array<{ age: number; actionId: string; reason: string }> = [];

  constructor(config: Partial<GameProcessConfig> = {}) {
    this.config = {
      playerName: '测试玩家',
      gender: 'male',
      simulateYears: 80,
      runUntilDeath: true,
      maxEvents: 300,
      enableAutoSave: true,
      enableManualSave: true,
      autoSaveMode: 'age',
      saveAgeInterval: 5,
      saveEventInterval: 10,
      enableSaveRestore: true,
      maxRestoreCount: 1,
      verbose: true,
      choiceTendency: 'balanced',
      ...config
    };
  }

  /**
   * 运行完整游戏过程模拟
   */
  async simulate(): Promise<GameProcessReport> {
    this.log('🎮 开始游戏过程模拟测试...\n');
    this.ended = false;
    this.records = [];
    this.saveCount = 0;
    this.loadCount = 0;
    this.autoSaveIds = [];
    this.consistencyChecks = [];
    this.lastAutoSaveAge = null;
    this.p8ChoiceDiagnostics = [];
    this.p8ActiveActionReasons = [];
    
    // 0. 重置游戏引擎（确保状态干净）
    this.log('📝 步骤 0: 重置游戏引擎');
    gameEngine.reset();
    gameEngine.setSuppressLethalSetbacks(this.shouldSuppressLethalSetbacks());

    await this.withSeededRandom(this.config.seed, async () => {
      // 1. 创建角色
      this.log('📝 步骤 1: 创建角色');
      gameEngine.startNewGame(this.config.playerName, this.config.gender, {
        enableLiveOpsActivation: false,
      });
      this.gameState = gameEngine.getGameState();
      const p8Persona = this.resolveP8Persona();
      if (p8Persona) {
        if (!this.gameState.flags) {
          this.gameState.flags = {};
        }
        this.gameState.flags[`p8_route_${p8Persona.routePreference}`] = true;
        this.gameState.flags.p8_persona_id = p8Persona.id;
      }
      this.log(`   ✅ 玩家：${this.gameState.player?.name}`);
      this.log(`   ✅ 年龄：${this.gameState.player?.age}岁`);
      this.log(`   ✅ 性别：${this.gameState.player?.gender}\n`);

      if (this.config.routeTrack) {
        this.log(`   🛤️  路线专项：${this.config.routeTrack}`);
      }

      // 2. 模拟人生历程
      this.log('📝 步骤 2: 模拟人生历程');
      const ageGate = this.resolveRunAgeGate(this.gameState.player?.age || 0);
      let steps = 0;

      while (this.gameState?.player?.alive && !this.ended && this.gameState.player.age < ageGate.endAge && steps < this.config.maxEvents) {
        // 在每次循环开始时，从游戏引擎获取最新状态
        this.gameState = gameEngine.getGameState();
        
        await this.simulateYear();
        steps += 1;

        if (this.config.enableAutoSave) {
          this.maybeAutoSaveAndRestore(steps);
        }
      }
    });

    // 3. 最终统计
    this.log('\n📝 步骤 3: 生成测试报告');
    const report = this.generateReport();
    
    // 4. 保存报告
    this.saveReport(report);
    this.updateManifest(report);
    
    this.log('\n✅ 游戏过程模拟测试完成！\n');
    
    return report;
  }

  /**
   * 模拟一年的游戏过程
   */
  private async simulateYear(): Promise<void> {
    if (!this.gameState) return;

    // 从游戏引擎获取真实年龄（执行事件前）
    const currentState = gameEngine.getGameState();
    if (sharedHasGameEnded(currentState)) {
      this.ended = true;
      this.gameState = currentState;
      return;
    }
    const ageBeforeEvent = currentState.player?.age || 0;

    this.applyRouteTrackPreparation(ageBeforeEvent);
    this.applyRouteTrackFixtureBootstrap(ageBeforeEvent);
    this.applyP16PersonaYouthRouteSeeds(ageBeforeEvent);
    const stateForRecord = JSON.parse(JSON.stringify(gameEngine.getGameState())) as GameState;

    this.log(`\n━━━ ${ageBeforeEvent}岁 ━━━ (引擎内部年龄：${gameEngine.getGameState().player?.age})`);

    // 1. 选择一个事件（加权随机，每年只触发一个事件，不传年龄参数，让引擎自己获取）
    const event = gameEngine.selectEvent();  // 不传参数，使用引擎内部年龄
    
    if (!event) {
      const persona = this.resolveP8Persona();
      let actionId: string;
      let selectionReason: string | undefined;

      if (persona) {
        const available = gameEngine.getAvailableActiveActions();
        const stateNow = gameEngine.getGameState();
        const selection = selectPersonaActiveAction({
          persona,
          availableActions: available.map(a => ({
            actionId: a.actionId,
            category: getActionById(a.actionId)?.category ?? 'training',
            name: a.text,
          })),
          age: ageBeforeEvent,
          focusStreakCategory: stateNow.actionFocusStreak?.category ?? null,
          focusStreakCount: stateNow.actionFocusStreak?.count ?? 0,
        });
        actionId = selection.actionId;
        selectionReason = selection.reason;
        this.p8ActiveActionReasons.push({
          age: ageBeforeEvent,
          actionId,
          reason: selection.reason,
        });
      } else {
        actionId = 'action_training_basic';
        selectionReason = undefined;
      }

      const actionDef = getActionById(actionId);
      this.log(`   ⚠️  无可用事件 — 执行主动行动（${actionDef?.name ?? actionId}）`);
      if (selectionReason) {
        this.log(`   📋 选择原因：${selectionReason}`);
      }

      const execution = gameEngine.executeActiveAction(actionId, { random: ACTIVE_ACTION_REPLAY_RANDOM });
      const stateAfterAction = gameEngine.getGameState();
      const feedbackText = execution?.feedbackText ?? gameEngine.consumeLastEventOutcomeNote() ?? `本期安排${actionDef?.name ?? '主动行动'}`;
      const record: GameProcessRecord = {
        age: ageBeforeEvent,
        eventId: toActiveActionReplayEventId(actionId),
        eventTitle: actionDef?.name ? `主动${actionDef.name}` : '主动行动',
        eventText: feedbackText,
        outcomeText: feedbackText,
        eventType: 'auto',
        progressionKind: 'active_action',
        activeActionId: actionId,
        activeActionSelectionReason: selectionReason,
        gameState: stateForRecord,
        currentTime: stateAfterAction.currentTime,
        timestamp: new Date().toISOString(),
      };
      this.pushRecord(record);
      this.ensureProgressionCatchUp(ageBeforeEvent);
      return;
    }

    // 2. 执行选中的事件
    if (!currentState?.player?.alive) return;

    const title = event.content?.title || '未知事件';
    const description = event.content?.description || '';
    const text = event.content?.text || '';
    const eventType = event.eventType || 'auto';

    this.log(`\n   事件：${title}`);
    this.log(`   类型：${eventType}`);
    this.log(`   描述：${description.substring(0, 50)}...`);

    // 3. 执行事件效果并推进时间
    if (eventType === 'choice' && event.choices && event.choices.length > 0) {
      const availableChoices = this.getAvailableChoices(event);
      if (availableChoices.length === 0) {
        this.log('   ⚠️  无可用选项，跳过本次事件');
        this.ensureProgressionCatchUp(ageBeforeEvent);
        return;
      }
      // 选择事件：选择一个选项
      const selectedChoice = this.selectChoice(availableChoices, event.id);
      const lastDiagnostic = this.p8ChoiceDiagnostics[this.p8ChoiceDiagnostics.length - 1];
      const record: GameProcessRecord = {
        age: ageBeforeEvent,
        eventId: event.id,
        eventTitle: title,
        eventText: text,
        eventType: eventType as 'auto' | 'choice' | 'ending',
        availableChoices,
        selectedChoice,
        choiceScoreDiagnostic:
          lastDiagnostic && lastDiagnostic.eventId === event.id
            ? {
                selectedScore: lastDiagnostic.selectedScore,
                runnerUpScore: lastDiagnostic.runnerUpScore,
                runnerUpChoiceId: lastDiagnostic.runnerUpChoiceId,
              }
            : undefined,
        gameState: stateForRecord,
        currentTime: stateForRecord.currentTime,
        timestamp: new Date().toISOString()
      };
      
      this.log(`   可用选项 (${availableChoices.length}个):`);
      availableChoices.forEach((choice, i) => {
        this.log(`     ${i + 1}. ${choice.text || choice.id}`);
      });
      this.log(`   ✅ 选择：${record.selectedChoice.text || record.selectedChoice.id}`);

      const resolved = resolveChoiceEffects(
        currentState,
        event,
        record.selectedChoice,
        condition => gameEngine.isChoiceAvailable(condition as EventCondition | undefined)
      );
      const effectsToExecute = resolved?.effects ?? record.selectedChoice.effects ?? [];
      let outcomeText: string | null = resolved?.outcomeText ?? null;

      // 如果没有 outcome text，生成叙事性描述
      if (!outcomeText) {
        outcomeText = this.generateOutcomeText(event, effectsToExecute);
      }

      // 添加结果文本到记录
      record.outcomeText = outcomeText;
      this.log(`   📜 结果：${outcomeText}`);

      // 执行选择的效果（传递事件 ID 和选择 ID 用于记录）
      if (effectsToExecute.length > 0) {
        const result = await gameEngine.executeChoiceEffects(effectsToExecute, event.id, record.selectedChoice.id);
          const eventOutcomeNote = gameEngine.consumeLastEventOutcomeNote();
          if (eventOutcomeNote) {
            record.outcomeText = record.outcomeText
              ? `${record.outcomeText} ${eventOutcomeNote}`
            : eventOutcomeNote;
        }

        // 检查是否死亡，如果死亡则停止处理
        const stateAfterChoice = gameEngine.getGameState();
        if (!stateAfterChoice.player?.alive || sharedHasGameEnded(stateAfterChoice)) {
          if (sharedHasGameEnded(stateAfterChoice)) {
            this.ended = true;
          }
          record.gameState = JSON.parse(JSON.stringify(stateAfterChoice));
          this.pushRecord(record);
          this.log(`\n   💀 死亡原因：${stateAfterChoice.player?.deathReason || '未知'}`);
          return; // 直接返回，不继续处理
        }

        // 处理即时触发的事件（如爱情线的"心动"）
        if (result.triggeredEvent) {
          this.log(`\n   [即时触发] ${result.triggeredEvent.content?.title || result.triggeredEvent.id}`);
          this.log(`   描述：${result.triggeredEvent.content?.description || '...'}`);
          
          // 记录即时触发的事件 - 使用执行后的实际年龄（不是事件发生前的年龄）
          const ageAfterImmediateEvent = result.gameState.player?.age || ageBeforeEvent;
          const immediateRecord: GameProcessRecord = {
            age: ageAfterImmediateEvent,
            eventId: result.triggeredEvent.id,
            eventTitle: result.triggeredEvent.content?.title || result.triggeredEvent.id,
            eventText: result.triggeredEvent.content?.text || '',
            eventType: result.triggeredEvent.eventType as 'auto' | 'choice' | 'ending',
            gameState: JSON.parse(JSON.stringify(result.gameState)),
            currentTime: result.gameState.currentTime,
            timestamp: new Date().toISOString()
          };
          this.pushRecord(immediateRecord);
        }
      }
      
      // 更新状态并记录
      this.gameState = gameEngine.getGameState();
      record.gameState = JSON.parse(JSON.stringify(this.gameState));
      this.pushRecord(record);
    } else {
      // 自动事件：与选择事件一致，记录执行前快照以便 headless 重放
      this.log(`   ✅ 自动触发`);
      const record: GameProcessRecord = {
        age: ageBeforeEvent,
        eventId: event.id,
        eventTitle: title,
        eventText: text,
        eventType: eventType as 'auto' | 'choice' | 'ending',
        gameState: stateForRecord,
        currentTime: stateForRecord.currentTime,
        timestamp: new Date().toISOString(),
      };

      if (event.autoEffects && event.autoEffects.length > 0) {
        await gameEngine.executeAutoEvent(event);
        const eventOutcomeNote = gameEngine.consumeLastEventOutcomeNote();
        const baseOutcomeText = this.generateOutcomeText(event, event.autoEffects);
        const mergedOutcomeText = eventOutcomeNote
          ? `${baseOutcomeText} ${eventOutcomeNote}`.trim()
          : baseOutcomeText;
        record.outcomeText = mergedOutcomeText || undefined;

        const stateAfterAuto = gameEngine.getGameState();
        if (!stateAfterAuto.player?.alive || sharedHasGameEnded(stateAfterAuto)) {
          if (sharedHasGameEnded(stateAfterAuto)) {
            this.ended = true;
          }
          record.gameState = JSON.parse(JSON.stringify(stateAfterAuto));
          this.pushRecord(record);
          this.log(`\n   💀 死亡原因：${stateAfterAuto.player?.deathReason || '未知'}`);
          return;
        }
      }

      this.gameState = gameEngine.getGameState();
      if (!record.outcomeText) {
        const eventOutcomeNote = gameEngine.consumeLastEventOutcomeNote();
        const baseOutcomeText = event.autoEffects?.length
          ? this.generateOutcomeText(event, event.autoEffects)
          : null;
        if (baseOutcomeText && eventOutcomeNote) {
          record.outcomeText = `${baseOutcomeText} ${eventOutcomeNote}`;
        } else {
          record.outcomeText = eventOutcomeNote || baseOutcomeText || undefined;
        }
      }
      this.pushRecord(record);
    }

    this.enforceRouteTrackIsolation();
    this.ensureProgressionCatchUp(ageBeforeEvent);

    if (eventType === 'ending' || sharedHasGameEnded(this.gameState)) {
      this.log('   🏁 触发结局事件，模拟结束');
      this.ended = true;
    }

    // 检查是否死亡
    if (!this.gameState.player?.alive) {
      this.log(`\n   💀 死亡原因：${this.gameState.player?.deathReason}`);
    }
  }

  /**
   * Simulator loop pacing: ensure at least one calendar year per iteration when age unchanged.
   * Active actions may advance months first; this catch-up preserves gate rhythm expectations.
   */
  private ensureProgressionCatchUp(ageBeforeEvent: number): void {
    const state = gameEngine.getGameState();
    if (!state.player?.alive || this.ended || sharedHasGameEnded(state)) {
      this.gameState = state;
      return;
    }
    const ageAfter = state.player?.age ?? 0;
    if (ageAfter <= ageBeforeEvent) {
      gameEngine.advanceTime(1, 'year');
    }
    this.gameState = gameEngine.getGameState();
  }

  /** @deprecated use ensureProgressionCatchUp */
  private ensureYearAdvanced(ageBeforeEvent: number): void {
    this.ensureProgressionCatchUp(ageBeforeEvent);
  }

  private applyRouteTrackPreparation(age: number): void {
    applyRouteTrackPreparation(gameEngine.getGameState(), this.config.routeTrack, age);
  }

  private enforceRouteTrackIsolation(): void {
    enforceRouteTrackIsolation(gameEngine.getGameState(), this.config.routeTrack);
    this.gameState = gameEngine.getGameState();
  }

  private applyRouteTrackFixtureBootstrap(age: number): void {
    applyRouteTrackFixtureBootstrap(gameEngine.getGameState(), this.config.routeTrack, age);
  }

  /** P16: persona simulations seed youth route intent without infant commerce/travel actions. */
  private applyP16PersonaYouthRouteSeeds(age: number): void {
    const persona = this.resolveP8Persona();
    if (!persona || age !== 13) {
      return;
    }
    const state = gameEngine.getGameState();
    const strategySeeds: Record<string, Record<string, boolean>> = {
      business: {
        p9_early_business_focus: true,
        p9_echo_business_hook: true,
        p16_deferred_business_upbringing: true,
      },
      travel: {
        p9_early_travel_focus: true,
        p16_deferred_travel_upbringing: true,
      },
      socializing: {
        p9_early_social_focus: true,
        p9_echo_social_hook: true,
        p16_deferred_social_upbringing: true,
      },
      study: {
        p9_echo_study_hook: true,
        p16_deferred_study_upbringing: true,
      },
      training: {
        p9_early_training_focus: true,
        p9_echo_training_hook: true,
      },
      balanced: {
        p9_echo_study_hook: true,
        p9_echo_social_hook: true,
        p9_early_social_focus: true,
        p16_deferred_study_upbringing: true,
      },
    };
    const seeds = strategySeeds[persona.strategy];
    if (seeds) {
      Object.assign(state.flags, seeds);
    }
  }

  private collectChoiceEffects(choice: EventChoice): any[] {
    const effects: any[] = [...(choice.effects || [])];
    for (const outcome of choice.outcomes || []) {
      if (outcome.effects) {
        effects.push(...outcome.effects);
      }
    }
    return effects;
  }

  private scoreRouteTrackChoice(choice: EventChoice): number {
    const track = this.config.routeTrack;
    if (!track) {
      return 0;
    }

    let score = 0;
    const choiceId = (choice.id || '').toLowerCase();
    const effects = this.collectChoiceEffects(choice);

    for (const effect of effects) {
      if (effect.type !== 'flag_set') {
        continue;
      }
      const flagName = (effect.flag || effect.target || '') as string;

      if (track === 'official') {
        if (flagName === 'route_official' || flagName === 'origin_scholar_family') score += 1200;
        if (flagName === 'route_official_completed') score += 4000;
        if (flagName === 'official_first_post' || flagName === 'official_love_obstacle') score += 400;
      }

      if (track === 'beggars') {
        if (flagName === 'route_beggars') score += 1200;
        if (flagName === 'route_beggars_completed') score += 4000;
        if (flagName === 'beggars_rumor_network' || flagName === 'beggars_strife_done') score += 800;
        if (flagName === 'beggars_ending') score += 2000;
      }

      if (track === 'demonic') {
        if (flagName === 'route_demonic') score += 1200;
        if (flagName === 'route_demonic_completed') score += 4000;
        if (flagName === 'demonic_leader' || flagName === 'demonic_trial_active') score += 900;
        if (flagName.startsWith('demonic_trial_') && flagName.endsWith('_done')) score += 500;
      }

      if (track === 'sect') {
        if (flagName === 'route_orthodox' || flagName === 'orthodox_trial_active') score += 900;
        if (flagName === 'orthodox_trial_completed' || flagName === 'sect_trial_completed') score += 400;
        if (flagName.startsWith('sect_midlife_')) score += 1200;
      }

      if (track === 'wanderer') {
        if (flagName === 'route_wanderer' || flagName === 'hero_first_case') score += 900;
        if (flagName.startsWith('hero_midlife_') || flagName.startsWith('hero_old_case_') || flagName.startsWith('hero_rep_') || flagName.startsWith('hero_ally_') || flagName.startsWith('hero_gray_')) score += 700;
      }
    }

    if (track === 'official') {
      if (choiceId === 'origin_scholar_family') score += 2000;
      if (choiceId.startsWith('origin_') && choiceId !== 'origin_scholar_family') score -= 1800;
      if (choiceId.includes('official_accept') || choiceId === 'official_stay') score += 900;
      if (choiceId.includes('scholar')) score += 700;
      if (choiceId.includes('demonic') || choiceId.includes('beggars')) score -= 2500;
      if (choiceId.includes('decline') || choiceId.includes('leave')) score -= 1200;
    }

    if (track === 'beggars') {
      if (choiceId.includes('beggars_join')) score += 900;
      if (choiceId.includes('beggars')) score += 400;
      if (choiceId.includes('demonic') || choiceId.includes('official')) score -= 2000;
      if (choiceId.includes('decline')) score -= 1200;
    }

    if (track === 'demonic') {
      if (choiceId.includes('accept_demonic')) score += 900;
      if (choiceId.includes('demonic')) score += 400;
      if (choiceId === 'join_orthodox' || choiceId.includes('beggars_join') || choiceId.includes('official_accept')) score -= 2000;
      if (choiceId.includes('decline')) score -= 1200;
    }

    if (track === 'sect') {
      if (choiceId === 'join_orthodox') score += 1200;
      if (choiceId.includes('orthodox')) score += 400;
      if (choiceId.startsWith('faction_support') || choiceId.startsWith('faction_remain')) score += 900;
      if (choiceId.startsWith('gray_execute') || choiceId.startsWith('gray_leak')) score += 850;
      if (choiceId.startsWith('gray_refuse')) score += 700;
      if (choiceId.startsWith('judgment_')) score += 800;
      if (choiceId.startsWith('ledger_')) score += 750;
      if (choiceId === 'orthodox_stay') score += 600;
      if (choiceId === 'orthodox_leave') score -= 3000;
      if (choiceId.includes('accept_demonic') || choiceId === 'stay_wanderer') score -= 2000;
      if (choiceId.includes('beggars')) score -= 1500;
    }

    if (track === 'wanderer') {
      if (choiceId === 'stay_wanderer') score += 1200;
      if (choiceId.includes('wanderer') || choiceId.includes('hero')) score += 400;
      if (choiceId.startsWith('old_case_') || choiceId.startsWith('rep_') || choiceId.startsWith('ally_') || choiceId.startsWith('gray_') || choiceId.startsWith('settlement_')) score += 800;
      if (choiceId === 'join_orthodox' || choiceId.includes('accept_demonic')) score -= 2000;
      if (choiceId.includes('beggars')) score -= 1200;
    }

    return score;
  }

  private isRomanceFamilyArcSample(): boolean {
    return this.config.sampleId === GOLDEN_ROMANCE_FAMILY_SAMPLE_ID;
  }

  /** US-009/010: P3-RF arc — KC-1/2/3 choice bias for arc_rf_mingyue. */
  private scoreRomanceArcChoice(choice: EventChoice, eventId?: string): number {
    if (!this.isRomanceFamilyArcSample() || !eventId) {
      return 0;
    }

    const choiceId = (choice.id || '').toLowerCase();
    let score = 0;

    if (eventId === 'love_first_meet') {
      if (choiceId === 'love_greet' || choiceId === 'love_charm') {
        score += 1200;
      }
      if (choiceId === 'love_pass') {
        score -= 2000;
      }
    }

    if (eventId === 'love_family_obstacle') {
      if (choiceId === 'love_prove') {
        score += 1200;
      }
      if (choiceId === 'love_avoid') {
        score -= 1000;
      }
    }

    return score;
  }

  /** US-009: prefer 迎娶明月 when love line is active at family_marriage. */
  private scoreRomanceFamilyChoice(choice: EventChoice, eventId?: string): number {
    if (eventId !== 'family_marriage') {
      return 0;
    }

    const flags = gameEngine.getGameState()?.player?.flags ?? {};
    if (!flags.love_started && !this.isRomanceFamilyArcSample()) {
      return 0;
    }

    let score = 0;
    const effects = this.collectChoiceEffects(choice);
    for (const effect of effects) {
      if (effect.type !== 'flag_set') {
        continue;
      }
      const flagName = (effect.flag || effect.target || '') as string;
      if (flagName === 'spouse_mingyue' || flagName === 'marriage_type_love') {
        score += 1500;
      }
      if (flagName === 'spouse_arranged' || flagName === 'mingyue_married_other') {
        score -= 1200;
      }
    }

    const choiceId = (choice.id || '').toLowerCase();
    if (choiceId === 'marry_mingyue') {
      score += 500;
    }

    return score;
  }

  /** US-023: golden-demonic midlife arc deterministic choice bias (31–50). */
  private scoreDemonicMidlifeChoice(choice: EventChoice, eventId?: string): number {
    if (this.config.routeTrack !== 'demonic' || !eventId) {
      return 0;
    }

    const age = gameEngine.getGameState()?.player?.age ?? 0;
    if (age < 31 || age > 50) {
      return 0;
    }

    const choiceId = choice.id || '';
    let score = 0;

    if (eventId.startsWith('demonic_midlife')) {
      score += 2000;
    }

    if (eventId === 'demonic_midlife_expansion' || eventId === 'demonic_midlife_expansion_survivor') {
      if (choiceId === 'demonic_expand_territory') score += 900;
      if (choiceId === 'demonic_expand_consolidate') score += 300;
      if (choiceId === 'demonic_expand_secret_art') score += 100;
    }

    if (eventId === 'demonic_midlife_betrayal' || eventId === 'demonic_midlife_temptation') {
      if (choiceId === 'demonic_betrayal_coopt') score += 900;
      if (choiceId === 'demonic_betrayal_wait') score += 400;
      if (choiceId === 'demonic_betrayal_purge') score += 100;
    }

    if (eventId === 'demonic_midlife_fork') {
      if (choiceId === 'demonic_fork_balance') score += 900;
      if (choiceId === 'demonic_fork_redemption') score += 500;
      if (choiceId === 'demonic_fork_escalate') score += 100;
    }

    if (eventId === 'demonic_midlife_consequence') {
      if (choiceId === 'demonic_consequence_rule') score += 900;
      if (choiceId === 'demonic_consequence_withdraw') score += 500;
      if (choiceId === 'demonic_consequence_exile') score += 400;
    }

    return score;
  }

  private resolveP8Persona(): P8Persona | null {
    if (!this.config.p8PersonaId) {
      return null;
    }
    return getP8PersonaById(this.config.p8PersonaId) ?? null;
  }

  /**
   * 选择事件选项（模拟玩家决策）
   */
  private selectChoice(choices: EventChoice[], eventId?: string): EventChoice {
    // 多倾向策略：
    // - balanced: 综合成长
    // - martial: 武学成长优先
    // - wealth: 经济收益优先
    // - relationship: 关系与情感优先
    // - risk_averse: 保守规避高代价

    let bestChoice = choices[0];
    let bestScore = -Infinity;
    const persona = this.resolveP8Persona();
    const scoreBoard: Array<{ choiceId: string; score: number }> = [];

    for (const choice of choices) {
      let score = 0;

      // 如果有多结果分支，评估最佳结果
      if (choice.outcomes && choice.outcomes.length > 0) {
        let bestOutcomeScore = -Infinity;
        for (const outcome of choice.outcomes) {
          // 检查条件是否满足
          if (outcome.condition && !gameEngine.isChoiceAvailable(outcome.condition)) {
            continue; // 条件不满足，跳过
          }

          let outcomeScore = 0;
          if (outcome.effects) {
            outcomeScore = this.scoreEffectsByTendency(outcome.effects);
          }
          if (outcomeScore > bestOutcomeScore) {
            bestOutcomeScore = outcomeScore;
          }
        }
        score = bestOutcomeScore;
      } else if (choice.effects) {
        score = this.scoreEffectsByTendency(choice.effects);
      }

      score += this.scoreRouteTrackChoice(choice);
      score += this.scoreRomanceArcChoice(choice, eventId);
      score += this.scoreRomanceFamilyChoice(choice, eventId);
      score += this.scoreDemonicMidlifeChoice(choice, eventId);

      const effects = choice.outcomes?.[0]?.effects ?? choice.effects ?? [];
      if (persona) {
        score = applyPersonaChoiceBias({
          persona,
          baseScore: score,
          choiceId: choice.id ?? '',
          eventId,
          effects,
        });
      }

      scoreBoard.push({ choiceId: choice.id ?? '', score });

      if (score > bestScore) {
        bestScore = score;
        bestChoice = choice;
      }
    }

    if (bestScore > -Infinity && eventId && persona) {
      const ranked = rankChoiceScores(scoreBoard);
      this.p8ChoiceDiagnostics.push({
        eventId,
        selectedChoiceId: ranked.selectedChoiceId,
        selectedScore: ranked.selectedScore,
        runnerUpChoiceId: ranked.runnerUpChoiceId,
        runnerUpScore: ranked.runnerUpScore,
        personaId: persona.id,
      });
    }

    if (bestScore > -Infinity) {
      return bestChoice;
    }

    const randomIndex = Math.floor(Math.random() * choices.length);
    return choices[randomIndex];
  }

  private scoreEffectsByTendency(effects: any[]): number {
    let score = 0;
    const tendency = this.config.choiceTendency;

    for (const effect of effects) {
      if (effect.type === 'stat_modify' && effect.target) {
        const rawValue = typeof effect.value === 'number' ? effect.value : 0;
        const normalizedValue = effect.operator === 'subtract' ? -Math.abs(rawValue) : rawValue;
        const stat = effect.target;

        if (tendency === 'martial') {
          if (['martialPower', 'internalSkill', 'externalSkill', 'qinggong', 'comprehension', 'constitution', 'health'].includes(stat)) {
            score += normalizedValue * 3;
          } else if (stat === 'money') {
            score += normalizedValue * 0.8;
          } else {
            score += normalizedValue;
          }
          continue;
        }

        if (tendency === 'wealth') {
          if (['money', 'businessAcumen', 'reputation', 'connections'].includes(stat)) {
            score += normalizedValue * 3;
          } else if (['health', 'constitution'].includes(stat)) {
            score += normalizedValue * 1.2;
          } else {
            score += normalizedValue * 0.7;
          }
          continue;
        }

        if (tendency === 'risk_averse') {
          if (normalizedValue < 0) {
            score += normalizedValue * 4;
          } else if (['health', 'constitution', 'money', 'reputation'].includes(stat)) {
            score += normalizedValue * 2;
          } else {
            score += normalizedValue * 1.2;
          }
          continue;
        }

        // balanced / relationship 默认策略
        if (['martialPower', 'internalSkill', 'externalSkill', 'qinggong', 'chivalry', 'comprehension', 'constitution', 'health'].includes(stat)) {
          score += normalizedValue * 2;
        } else {
          score += normalizedValue;
        }
      }

      if (effect.type === 'relation_change') {
        const relationDelta = typeof effect.value === 'number' ? effect.value : 1;
        if (tendency === 'relationship') {
          score += relationDelta * 5;
        } else if (tendency === 'risk_averse') {
          score += relationDelta * 2;
        } else {
          score += relationDelta * 1.5;
        }
      }

      if (effect.type === 'flag_set') {
        const flagName = (effect.flag || effect.target || '') as string;
        if (tendency === 'relationship' || tendency === 'balanced') {
          if (flagName === 'spouse_mingyue' || flagName === 'marriage_type_love') {
            score += 600;
          }
          if (flagName === 'love_started') {
            score += 400;
          }
          if (flagName === 'has_child') {
            score += 300;
          }
        }
      }

      if (effect.type === 'special' && effect.target === 'set_spouse') {
        if (tendency === 'relationship' || tendency === 'balanced') {
          score += 500;
        }
      }
    }

    return score;
  }

  /**
   * 根据效果生成叙事性结果描述
   */
  private generateOutcomeText(event: EventDefinition, effects: any[]): string {
    const eventTitle = event.content?.title || event.id;
    const eventSpecificText = this.getEventSpecificOutcomeText(eventTitle, effects);
    if (eventSpecificText) {
      return eventSpecificText;
    }

    const parts: string[] = [];

    for (const effect of effects) {
      if (effect.type === 'stat_modify') {
        const statName = this.getStatName(effect.target || effect.stat);
        const value = typeof effect.value === 'number' ? effect.value : 0;
        const isPositive = (effect.operator === 'add' && value > 0) ||
                         (effect.operator === 'subtract' && value < 0);

        if (statName === '武力' || statName === '外功' || statName === '内功' || statName === '轻功') {
          parts.push(isPositive ? '你的武功有了长进' : '你的武艺似乎有些生疏');
        } else if (statName === '侠义') {
          parts.push(isPositive ? '你的侠义之心更加坚定了' : '你的心中似乎多了一丝动摇');
        } else if (statName === '魅力') {
          parts.push(isPositive ? '你的气质愈发出众' : '你感觉自己有些黯淡');
        } else if (statName === '体质') {
          parts.push(isPositive ? '你的身体更加健壮' : '你似乎更容易感到疲惫');
        } else if (statName === '悟性') {
          parts.push(isPositive ? '你对武学的理解更加深刻' : '有些道理似乎变得难以领悟');
        } else if (statName === '声望') {
          parts.push(isPositive ? '江湖中越来越多的人听说了你的名字' : '关于你的传言似乎不那么美好了');
        } else if (statName === '金钱') {
          parts.push(isPositive ? '你的钱袋鼓了起来' : '你的积蓄少了一些');
        } else if (statName === '健康') {
          parts.push(isPositive ? '你的身体状态好转了' : '你感到有些不适');
        }
      } else if (effect.type === 'flag_set' && effect.value === true) {
        parts.push(`你获得了新的体悟`);
      } else if (effect.type === 'relation_change') {
        parts.push('与某人的关系发生了微妙的变化');
      }
    }

    if (parts.length === 0) {
      return '你的心中泛起涟漪，但一切似乎又归于平静。';
    }

    return parts[0] + '。';
  }

  private getEventSpecificOutcomeText(eventTitle: string, effects: any[]): string | null {
    const positiveMoney = effects.some(effect =>
      effect.type === 'stat_modify' &&
      (effect.target === 'money' || effect.stat === 'money') &&
      typeof effect.value === 'number' &&
      effect.value > 0 &&
      effect.operator === 'add'
    );
    const negativeMoney = effects.some(effect =>
      effect.type === 'stat_modify' &&
      (effect.target === 'money' || effect.stat === 'money') &&
      typeof effect.value === 'number' &&
      effect.value > 0 &&
      effect.operator === 'subtract'
    );
    const positiveMartial = effects.some(effect =>
      effect.type === 'stat_modify' &&
      ['martialPower', 'externalSkill', 'internalSkill', 'qinggong'].includes(effect.target || effect.stat) &&
      typeof effect.value === 'number' &&
      effect.value > 0 &&
      effect.operator === 'add'
    );

    switch (eventTitle) {
      case '童年选择':
        return '你在懵懂里做了第一次像样的选择，这点小小偏向，往后会慢慢长成自己的路。';
      case '武学启蒙':
        return positiveMartial
          ? '你第一次真正摸到了习武的门道，少年人的身手开始有了自己的轮廓。'
          : '你虽踏进了习武的门槛，却还没真正找到顺手的那股劲。';
      case '修炼抉择':
        return positiveMartial
          ? '你选定了眼下最愿意下功夫的方向，功夫因此往前实实在在走了一步。'
          : '你心里虽然有了打算，可真正练起来，仍旧没能立刻见到起色。';
      case '武学创新':
        return '你试着把旧本事拧出一点新意，虽然还不算成熟，却已经看见了不同的路。';
      case '武林大会':
      case '武林大会邀请':
        return '你把自己带到了更大的场面里，不论胜负如何，江湖都开始认真看你一眼。';
      case '武学交流':
        return '这一番切磋让你看见了别人的路数，也让你重新照见了自己手里的功夫。';
      case '隐世高手':
        return '你得了高人几句点拨，眼前像是被拨开了一层薄雾。';
      case '喜得贵子':
        return negativeMoney
          ? '家里添了新丁，欢喜是真的，往后要操的心和要花的银钱也都跟着来了。'
          : '家里添了新丁，往后的日子因此多了更实在的盼头。';
      case '家族危机':
        return negativeMoney
          ? '这场风波逼得你不得不替家里撑住局面，能守住多少，就看你手里还剩多少余力。'
          : '家里的难关终于摆到了眼前，你再也不能把它当成与己无关的事。';
      case '门派壮大':
        return '门下声势一日日大起来，你收获的不只是体面，还有随之而来的忙乱与责任。';
      case '情敌出现':
        return '感情里的局面忽然复杂起来，你既想守住心意，也知道事情不会再像从前那样轻松。';
      case '恩怨情仇':
        return '旧人旧事重新缠了上来，这一次你很难再把情义和得失分得那么干净。';
      case '选择传人':
        return '你开始认真考虑把一身所学交给谁，这不只是挑一个人，也是替往后的人生定下一种去处。';
      case '传授孙儿':
        return '你把本事一点点教给晚辈，像是在把自己这些年的路慢慢讲给下一代听。';
      default:
        return null;
    }
  }

  /**
   * 获取属性中文名
   */
  private getStatName(stat: string): string {
    const statNames: Record<string, string> = {
      martialPower: '武力',
      internalSkill: '内功',
      externalSkill: '外功',
      qinggong: '轻功',
      chivalry: '侠义',
      charisma: '魅力',
      constitution: '体质',
      comprehension: '悟性',
      reputation: '声望',
      influence: '影响力',
      connections: '人脉',
      knowledge: '学识',
      businessAcumen: '商路',
      money: '金钱',
      health: '健康',
    };
    return statNames[stat] || stat;
  }

  /**
   * 获取当前事件可用的选项（考虑条件）
   */
  private getAvailableChoices(event: EventDefinition): EventChoice[] {
    if (!event.choices || event.choices.length === 0) return [];
    return event.choices.filter(choice => gameEngine.isChoiceAvailable(choice.condition));
  }

  /**
   * 按配置执行自动保存与读档恢复验证
   */
  private maybeAutoSaveAndRestore(steps: number): void {
    if (!this.gameState) return;

    const currentAge = this.gameState.player?.age || 0;
    let shouldSave = false;
    if (this.config.autoSaveMode === 'event') {
      shouldSave = this.config.saveEventInterval > 0 && steps % this.config.saveEventInterval === 0;
    } else {
      shouldSave =
        this.config.saveAgeInterval > 0 &&
        currentAge > 0 &&
        currentAge % this.config.saveAgeInterval === 0 &&
        this.lastAutoSaveAge !== currentAge;
    }

    if (!shouldSave) {
      return;
    }

    const saveName = `自动存档-${currentAge}岁`;
    const saveId = saveManager.saveGame(this.gameState, saveName);
    this.saveCount++;
    this.autoSaveIds.push(saveId);
    this.lastAutoSaveAge = currentAge;
    this.log(`   💾 自动保存：${saveName} (ID: ${saveId})`);

    if (this.config.enableSaveRestore && this.loadCount < this.config.maxRestoreCount) {
      this.restoreFromSave(saveId);
    }
  }

  private restoreFromSave(saveId: string): void {
    const saveEntry = saveManager.loadGame(saveId);
    if (!saveEntry || !this.gameState) {
      return;
    }

    const beforeSaveSnapshot = this.buildConsistencySnapshot(this.gameState);
    gameEngine.loadGameState(saveEntry.gameData);
    const restoredState = gameEngine.getGameState();
    this.gameState = restoredState;
    this.loadCount++;
    this.log(`   ♻️ 自动读档恢复：${saveId}`);

    const afterRestoreSnapshot = this.buildConsistencySnapshot(restoredState);
    const mismatchedFields = Object.entries(beforeSaveSnapshot)
      .filter(([key, value]) => afterRestoreSnapshot[key] !== value)
      .map(([key]) => key);

    this.consistencyChecks.push({
      saveId,
      age: restoredState.player?.age || 0,
      passed: mismatchedFields.length === 0,
      mismatchedFields,
    });
  }

  private buildConsistencySnapshot(state: GameState): Record<string, string> {
    return {
      age: String(state.player?.age ?? 0),
      alive: String(Boolean(state.player?.alive)),
      martialPower: String(state.player?.martialPower ?? 0),
      money: String(state.player?.money ?? 0),
      health: String(state.player?.health ?? 0),
      eventHistoryCount: String(state.eventHistory?.length ?? 0),
      routeStateCount: String(Object.keys(state.routeStates || {}).length),
      routeHistoryCount: String(state.routeHistory?.length ?? 0),
      year: String(state.currentTime?.year ?? 0),
      month: String(state.currentTime?.month ?? 0),
      day: String(state.currentTime?.day ?? 0),
    };
  }

  /**
   * 生成测试报告
   */
  private generateReport(): GameProcessReport {
    const finalState = this.gameState;
    const forcedLateLifeEnding = finalState ? EndingSystem.getForcedLateLifeEnding(finalState) : null;
    const gameEnded = this.hasGameEnded(finalState) || Boolean(forcedLateLifeEnding);
    const endingName = this.getEndingDisplayName(finalState, gameEnded, forcedLateLifeEnding?.name);
    const requestedAgeRange = this.getRequestedAgeRange();
    
    // 统计各年龄段事件
    const childhoodEvents = this.records.filter(r => r.age >= 0 && r.age <= 12).length;
    const youthEvents = this.records.filter(r => r.age >= 13 && r.age <= 18).length;
    const adultEvents = this.records.filter(r => r.age >= 19 && r.age <= 54).length;
    const elderlyEvents = this.records.filter(r => r.age >= 55).length;

    // 统计事件类型
    const autoEvents = this.records.filter(r => r.eventType === 'auto').length;
    const choiceEvents = this.records.filter(r => r.eventType === 'choice').length;

    // 计算成长
    const initialState = this.records[0]?.gameState;
    const finalMartialPower = finalState?.player?.martialPower || 0;
    const initialMartialPower = initialState?.player?.martialPower || 0;
    const martialPowerGrowth = finalMartialPower - initialMartialPower;

    const finalMoney = finalState?.player?.money || 0;
    const initialMoney = initialState?.player?.money || 0;
    const moneyGrowth = finalMoney - initialMoney;

    // 提取门派和感情信息
    const flags = finalState?.flags || {};
    
    // 从 flags 中提取门派信息
    const sectJoined = flags.sect_shaolin ? '少林派' :
                       flags.sect_wudang ? '武当派' :
                       flags.sect_emei ? '峨眉派' :
                       finalState?.player?.sect || null;
    
    // 从 flags 中提取更多信息
    const sectStatus = flags.sectLeader ? '掌门' : 
                       flags.sectElder ? '长老' : 
                       flags.sectMember ? '弟子' : 
                       flags.shaolinDisciple || flags.wudangDisciple || flags.emeiDisciple ? '弟子' : undefined;
    
    const spouse = finalState?.player?.spouse || undefined;
    const children = finalState?.player?.children || 0;
    const traitNames = traitSystem.getTraitNames(finalState?.player?.traitProfile);
    const dailyEventCount = this.records.filter(r => r.eventId.startsWith('daily_')).length;
    let endingSummary: string | undefined;
    if (finalState && gameEnded) {
      try {
        endingSummary = EndingSystem.getEndingSummary(
          finalState,
          forcedLateLifeEnding || EndingSystem.determineEnding(finalState)
        );
      } catch {
        endingSummary = undefined;
      }
    }

    const isAlive = gameEnded ? false : (finalState?.player?.alive || false);
    const baseReport: GameProcessReport = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      config: this.config,
      randomSeed: typeof this.config.seed === 'number' ? this.config.seed : null,
      runMode: requestedAgeRange ? 'age_range' : 'complete_life',
      ageRange: requestedAgeRange,
      totalYears: this.records.length,
      finalAge: finalState?.player?.age || 0,
      isAlive,
      deathReason: finalState?.player?.deathReason || (gameEnded ? endingName : null),
      totalEvents: this.records.length,
      totalChoices: choiceEvents,
      totalSaves: this.saveCount,
      totalLoads: this.loadCount,
      persistenceConsistency: {
        totalChecks: this.consistencyChecks.length,
        passedChecks: this.consistencyChecks.filter(check => check.passed).length,
        failedChecks: this.consistencyChecks.filter(check => !check.passed).length,
        results: this.consistencyChecks,
      },
      records: this.records,
      statistics: {
        childhoodEvents,
        youthEvents,
        adultEvents,
        elderlyEvents,
        autoEvents,
        choiceEvents,
        martialPowerGrowth,
        moneyGrowth,
        sectJoined,
        sectStatus,
        spouse,
        children,
        origin: traitNames.origin,
        coreTalent: traitNames.coreTalent,
        weakness: traitNames.weakness,
        temperament: traitNames.temperament,
        lifeStates: { ...(finalState?.player?.lifeStates || {}) },
        dailyEventCount,
        growthBiasSummary: [...(finalState?.player?.growthBiasSummary || [])],
        endingSummary,
        flags: Object.fromEntries(
          Object.entries(flags).filter(([_, v]) => typeof v === 'boolean' && v)
        ),
      },
    };

    baseReport.deathRiskTelemetry = buildDeathRiskTelemetry(baseReport, this.config.sampleId);
    if (this.config.sampleId) {
      const endAge = this.config.ageRange?.endAge ?? this.config.simulateYears;
      baseReport.romanceFamilyArcReport = buildRomanceFamilyArcReport(
        baseReport,
        this.config.sampleId,
        endAge,
      );
    }
    baseReport.p8ChoiceDiagnostics = [...this.p8ChoiceDiagnostics];
    baseReport.p8ActiveActionReasons = [...this.p8ActiveActionReasons];
    return baseReport;
  }

  private hasGameEnded(state: GameState | null | undefined): boolean {
    if (!state) return false;
    return state.flags?.ending_triggered === true || Boolean(state.ending);
  }

  private getEndingDisplayName(state: GameState | null | undefined, gameEnded: boolean, fallbackName?: string): string {
    if (!state || !gameEnded) {
      return '结局达成';
    }

    if (fallbackName && fallbackName.trim()) {
      return fallbackName;
    }

    const ending = state.ending as { name?: string } | null | undefined;
    if (ending && typeof ending.name === 'string' && ending.name.trim()) {
      return ending.name;
    }

    try {
      return EndingSystem.determineEnding(state).name;
    } catch {
      return '结局达成';
    }
  }

  /**
   * 保存报告（HTML + JSON）
   */
  private saveReport(report: GameProcessReport): void {
    // 确保目录存在
    if (!fs.existsSync(REPORTS_DIR)) {
      fs.mkdirSync(REPORTS_DIR, { recursive: true });
    }

    const baseName = `game-process-${report.id}`;
    
    // 保存 JSON 报告
    const jsonPath = path.join(REPORTS_DIR, `${baseName}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf-8');
    this.log(`📄 JSON 报告：${jsonPath}`);

    // 保存 HTML 报告
    const htmlPath = path.join(REPORTS_DIR, `${baseName}.html`);
    const htmlContent = this.generateHtmlReport(report);
    fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
    this.log(`📄 HTML 报告：${htmlPath}`);
  }

  /**
   * 更新报告清单
   */
  private updateManifest(report: GameProcessReport): void {
    const manifestPath = path.join(REPORTS_DIR, 'manifest.json');
    const reportEntry = {
      id: report.id,
      fileName: `game-process-${report.id}.json`,
      name: `游戏过程模拟 ${new Date(report.timestamp).toLocaleDateString('zh-CN')}`,
      type: 'game_process',
      generatedAt: report.timestamp,
      config: {
        startAge: 0,
        endAge: 80,
        randomnessWeight: 0.5,
        simulationYears: report.totalYears
      },
      statistics: {
        totalChoices: report.totalChoices,
        totalStateChanges: report.totalEvents,
        lifespan: report.finalAge,
        sect: report.statistics.sectJoined || '无',
        children: report.statistics.children || 0,
        deathReason: report.deathReason || (report.isAlive ? '在世' : '未知')
      },
      aiEvaluation: null,
      duration: 0
    };

    let manifest = { version: '1.0', generatedAt: report.timestamp, totalReports: 0, reports: [] as any[] };
    if (fs.existsSync(manifestPath)) {
      try {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      } catch {
        // ignore invalid manifest
      }
    }

    const reports = (manifest.reports || []).filter((item: any) => item.id !== report.id);
    reports.unshift(reportEntry);
    manifest.reports = reports;
    manifest.totalReports = reports.length;
    manifest.generatedAt = new Date().toISOString();

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
    this.log(`📄 清单已更新：${manifestPath}`);
  }

  /**
   * 生成 HTML 报告
   */
  private generateHtmlReport(report: GameProcessReport): string {
    const { timestamp, statistics, records, finalAge, deathReason, isAlive } = report;
    const date = new Date(timestamp).toLocaleString('zh-CN');

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>游戏过程模拟报告 - ${date}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 1600px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .header h1 { font-size: 32px; margin-bottom: 10px; }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 20px;
      padding: 40px;
      background: #f8f9fa;
    }
    .summary-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .summary-card h3 {
      color: #6c757d;
      font-size: 14px;
      margin-bottom: 10px;
    }
    .summary-card .number {
      font-size: 32px;
      font-weight: bold;
      color: #667eea;
    }
    .section {
      padding: 40px;
      border-top: 2px solid #e9ecef;
    }
    .section h2 {
      color: #333;
      margin-bottom: 20px;
      font-size: 24px;
    }
    .timeline {
      margin-top: 20px;
    }
    .timeline-item {
      display: flex;
      gap: 15px;
      padding: 15px;
      border-left: 3px solid #667eea;
      margin-left: 20px;
      margin-bottom: 15px;
      background: #f8f9fa;
      border-radius: 0 8px 8px 0;
    }
    .timeline-age {
      min-width: 60px;
      font-weight: bold;
      color: #667eea;
      font-size: 18px;
    }
    .timeline-content {
      flex: 1;
    }
    .timeline-title {
      font-weight: bold;
      color: #333;
      margin-bottom: 5px;
    }
    .timeline-desc {
      font-size: 14px;
      color: #666;
      line-height: 1.6;
    }
    .timeline-type {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      margin-left: 10px;
    }
    .timeline-type.auto {
      background: #e3f2fd;
      color: #1976d2;
    }
    .timeline-type.choice {
      background: #f3e5f5;
      color: #7b1fa2;
    }
    .timeline-choice {
      margin-top: 8px;
      padding: 8px;
      background: white;
      border-radius: 4px;
      font-size: 13px;
      color: #28a745;
    }
    .timeline-outcome {
      margin-top: 8px;
      padding: 10px;
      background: linear-gradient(135deg, rgba(139, 90, 43, 0.08), rgba(34, 139, 34, 0.08));
      border-left: 3px solid #8b5a2b;
      border-radius: 4px;
      font-size: 13px;
      color: #5d4037;
      font-style: italic;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 20px;
    }
    .stat-item {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
    }
    .stat-label {
      font-size: 13px;
      color: #6c757d;
      margin-bottom: 5px;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #667eea;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e9ecef;
    }
    th {
      background: #f8f9fa;
      font-weight: bold;
      color: #495057;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎮 游戏过程模拟报告</h1>
      <p>完整记录真实游戏体验流程</p>
      <p style="margin-top: 10px; font-size: 12px;">${date}</p>
    </div>

    <div class="summary">
      <div class="summary-card">
        <h3>总经历年数</h3>
        <div class="number">${report.totalYears}</div>
      </div>
      <div class="summary-card">
        <h3>最终年龄</h3>
        <div class="number">${finalAge}岁</div>
      </div>
      <div class="summary-card">
        <h3>生存状态</h3>
        <div class="number" style="color: ${isAlive ? '#28a745' : '#dc3545'}">
          ${isAlive ? '✅ 在世' : '💀 已故'}
        </div>
      </div>
      <div class="summary-card">
        <h3>触发事件</h3>
        <div class="number">${report.totalEvents}</div>
      </div>
      <div class="summary-card">
        <h3>做出选择</h3>
        <div class="number">${report.totalChoices}</div>
      </div>
      <div class="summary-card">
        <h3>存档次数</h3>
        <div class="number">${report.totalSaves}</div>
      </div>
      <div class="summary-card">
        <h3>读档次数</h3>
        <div class="number">${report.totalLoads}</div>
      </div>
      <div class="summary-card">
        <h3>一致性检查</h3>
        <div class="number">${report.persistenceConsistency.passedChecks}/${report.persistenceConsistency.totalChecks}</div>
      </div>
    </div>

    ${deathReason ? `
    <div class="section">
      <h2>💀 死亡原因</h2>
      <p style="font-size: 18px; color: #dc3545; padding: 20px; background: #fff5f5; border-radius: 8px;">
        ${deathReason}
      </p>
    </div>
    ` : ''}

    <div class="section">
      <h2>📊 统计信息</h2>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-label">童年事件 (0-12 岁)</div>
          <div class="stat-value">${statistics.childhoodEvents}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">青年事件 (13-18 岁)</div>
          <div class="stat-value">${statistics.youthEvents}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">成年事件 (19-54 岁)</div>
          <div class="stat-value">${statistics.adultEvents}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">老年事件 (55+ 岁)</div>
          <div class="stat-value">${statistics.elderlyEvents}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">自动事件</div>
          <div class="stat-value">${statistics.autoEvents}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">选择事件</div>
          <div class="stat-value">${statistics.choiceEvents}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">武力成长</div>
          <div class="stat-value">+${statistics.martialPowerGrowth}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">金钱成长</div>
          <div class="stat-value">+${statistics.moneyGrowth}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">加入门派</div>
          <div class="stat-value">${statistics.sectJoined || '无'}</div>
        </div>
        ${statistics.sectStatus ? `
        <div class="stat-item">
          <div class="stat-label">门派地位</div>
          <div class="stat-value">${statistics.sectStatus}</div>
        </div>
        ` : ''}
        ${statistics.spouse ? `
        <div class="stat-item">
          <div class="stat-label">配偶</div>
          <div class="stat-value">${statistics.spouse}</div>
        </div>
        ` : ''}
        <div class="stat-item">
          <div class="stat-label">子女数量</div>
          <div class="stat-value">${statistics.children || 0}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>📜 游戏过程时间线</h2>
      <div class="timeline">
        ${records.map(record => {
          const timeLabel = record.currentTime
            ? `${record.currentTime.year}年${record.currentTime.month}月${record.currentTime.day}日`
            : '';
          return `
          <div class="timeline-item">
            <div class="timeline-age">${record.age}岁${timeLabel ? ` · ${timeLabel}` : ''}</div>
            <div class="timeline-content">
              <div class="timeline-title">
                ${record.eventTitle}
                <span class="timeline-type ${record.eventType}">${record.eventType === 'auto' ? '自动' : record.eventType === 'ending' ? '结局' : '选择'}</span>
              </div>
              <div class="timeline-desc">${record.eventText || record.eventTitle}</div>
              ${record.selectedChoice ? `
                <div class="timeline-choice">
                  选择：${record.selectedChoice.text}
                </div>
              ` : ''}
              ${record.outcomeText ? `
                <div class="timeline-outcome">
                  ${record.outcomeText}
                </div>
              ` : ''}
            </div>
          </div>
        `;
        }).join('')}
      </div>
    </div>

    <div class="section">
      <h2>📋 详细数据表</h2>
      <table>
        <thead>
          <tr>
            <th>年龄</th>
            <th>事件 ID</th>
            <th>事件名称</th>
            <th>事件文案</th>
            <th>类型</th>
            <th>武力</th>
            <th>金钱</th>
            <th>时间</th>
          </tr>
        </thead>
        <tbody>
          ${records.map(record => `
            <tr>
              <td>${record.age}</td>
              <td><code>${record.eventId}</code></td>
              <td>${record.eventTitle}</td>
              <td>${record.eventText || ''}</td>
              <td>${record.eventType}</td>
              <td>${record.gameState.player?.martialPower}</td>
              <td>${record.gameState.player?.money}</td>
              <td>${new Date(record.timestamp).toLocaleTimeString('zh-CN')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    return `gp_${timestamp}_${random}`;
  }

  /**
   * 日志输出
   */
  private log(message: string): void {
    if (this.config.verbose) {
      console.log(message);
    }
  }

  private pushRecord(record: GameProcessRecord): void {
    if (this.shouldIncludeAge(record.age)) {
      this.records.push(record);
    }
  }

  private shouldIncludeAge(age: number): boolean {
    const range = this.getRequestedAgeRange();
    if (!range) {
      return true;
    }

    return age >= range.startAge && age <= range.endAge;
  }

  private getRequestedAgeRange(): { startAge: number; endAge: number } | null {
    const range = this.config.ageRange;
    if (!range) {
      return null;
    }

    const startAge = Math.max(0, Math.floor(range.startAge));
    const endAge = Math.min(120, Math.floor(range.endAge));
    if (startAge > endAge) {
      return null;
    }

    return { startAge, endAge };
  }

  private resolveRunAgeGate(initialAge: number): { startAge: number; endAge: number } {
    const requestedRange = this.getRequestedAgeRange();
    if (requestedRange) {
      return requestedRange;
    }

    const startAge = Math.max(0, Math.floor(initialAge));
    const configuredEndAge = Math.floor(startAge + this.config.simulateYears);
    return {
      startAge,
      endAge: this.config.runUntilDeath ? 120 : Math.min(configuredEndAge, 120),
    };
  }

  private shouldSuppressLethalSetbacks(): boolean {
    if (typeof this.config.seed !== 'number' || Number.isNaN(this.config.seed)) {
      return false;
    }
    if (this.config.runUntilDeath) {
      return false;
    }
    const endAge = this.config.ageRange?.endAge
      ?? Math.floor((this.gameState?.player?.age ?? 0) + this.config.simulateYears);
    return endAge <= 50;
  }

  private async withSeededRandom(seed: number | undefined, run: () => void | Promise<void>): Promise<void> {
    if (typeof seed !== 'number' || Number.isNaN(seed)) {
      await run();
      return;
    }

    const originalRandom = Math.random;
    let state = seed >>> 0;
    Math.random = () => {
      state = (state + 0x6D2B79F5) >>> 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    try {
      await run();
    } finally {
      Math.random = originalRandom;
    }
  }
}
