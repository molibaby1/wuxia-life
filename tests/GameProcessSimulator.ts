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
import { saveManager } from '../src/core/SaveManager';
import { EndingSystem } from '../src/core/EndingSystem';
import { traitSystem } from '../src/core/TraitSystem';
import type { GameState, EventDefinition, EventChoice } from '../src/types/eventTypes';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const REPORTS_DIR = path.join(process.cwd(), 'public/reports');

export interface GameProcessConfig {
  playerName: string;
  gender: 'male' | 'female';
  simulateYears: number;  // 模拟多少年
  maxEvents: number; // 最大事件数，避免月/日推进导致无限循环
  enableAutoSave: boolean;  // 启用自动保存
  enableManualSave: boolean;  // 启用手动保存
  saveInterval: number;  // 保存间隔（年）
  verbose: boolean;  // 详细日志
}

export interface GameProcessRecord {
  age: number;
  eventId: string;
  eventTitle: string;
  eventText?: string;
  eventType: 'auto' | 'choice' | 'ending';
  selectedChoice?: EventChoice;
  availableChoices?: EventChoice[];
  outcomeText?: string;
  gameState: GameState;
  timestamp: string;
  currentTime?: { year: number; month: number; day: number };
}

export interface GameProcessReport {
  id: string;
  timestamp: string;
  config: GameProcessConfig;
  totalYears: number;
  finalAge: number;
  isAlive: boolean;
  deathReason: string | null;
  totalEvents: number;
  totalChoices: number;
  totalSaves: number;
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
}

/**
 * 游戏过程模拟器
 */
export class GameProcessSimulator {
  private config: GameProcessConfig;
  private records: GameProcessRecord[] = [];
  private saveCount: number = 0;
  private gameState: GameState | null = null;
  private ended: boolean = false;

  constructor(config: Partial<GameProcessConfig> = {}) {
    this.config = {
      playerName: '测试玩家',
      gender: 'male',
      simulateYears: 80,
      maxEvents: 300,
      enableAutoSave: true,
      enableManualSave: true,
      saveInterval: 5,
      verbose: true,
      ...config
    };
  }

  /**
   * 运行完整游戏过程模拟
   */
  async simulate(): Promise<GameProcessReport> {
    this.log('🎮 开始游戏过程模拟测试...\n');
    this.ended = false;
    
    // 0. 重置游戏引擎（确保状态干净）
    this.log('📝 步骤 0: 重置游戏引擎');
    gameEngine.reset();
    
    // 1. 创建角色
    this.log('📝 步骤 1: 创建角色');
    gameEngine.startNewGame(this.config.playerName, this.config.gender);
    this.gameState = gameEngine.getGameState();
    this.log(`   ✅ 玩家：${this.gameState.player?.name}`);
    this.log(`   ✅ 年龄：${this.gameState.player?.age}岁`);
    this.log(`   ✅ 性别：${this.gameState.player?.gender}\n`);

    // 2. 模拟人生历程
    this.log('📝 步骤 2: 模拟人生历程');
    const startAge = this.gameState.player?.age || 0;
    const endAge = Math.min(startAge + this.config.simulateYears, 120);
    let steps = 0;
    
    while (this.gameState?.player?.alive && !this.ended && this.gameState.player.age < endAge && steps < this.config.maxEvents) {
      // 在每次循环开始时，从游戏引擎获取最新状态
      this.gameState = gameEngine.getGameState();
      
      await this.simulateYear();
      steps += 1;
      
      // 定期保存
      const currentAge = this.gameState.player?.age || 0;
      if (this.config.enableAutoSave && currentAge % this.config.saveInterval === 0) {
        this.autoSave();
      }
    }

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
    if (this.hasGameEnded(currentState)) {
      this.ended = true;
      this.gameState = currentState;
      return;
    }
    const ageBeforeEvent = currentState.player?.age || 0;
    
    this.log(`\n━━━ ${ageBeforeEvent}岁 ━━━ (引擎内部年龄：${gameEngine.getGameState().player?.age})`);

    // 1. 选择一个事件（加权随机，每年只触发一个事件，不传年龄参数，让引擎自己获取）
    const event = gameEngine.selectEvent();  // 不传参数，使用引擎内部年龄
    
    if (!event) {
      this.log(`   ⚠️  无可用事件`);
      
      // 即使没有事件，也要记录这一年
      const record: GameProcessRecord = {
        age: ageBeforeEvent,
        eventId: 'no_event',
        eventTitle: '平淡的一年',
        eventText: '这一年并无大事发生，岁月静好。',
        eventType: 'auto',
        gameState: JSON.parse(JSON.stringify(currentState)),
        currentTime: currentState.currentTime,
        timestamp: new Date().toISOString()
      };
      this.records.push(record);
      
      // 推进时间
      gameEngine.advanceTime(1);
      this.gameState = gameEngine.getGameState();
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
        gameEngine.advanceTime(1);
        this.gameState = gameEngine.getGameState();
        return;
      }
      // 选择事件：选择一个选项
      const record: GameProcessRecord = {
        age: ageBeforeEvent,
        eventId: event.id,
        eventTitle: title,
        eventText: text,
        eventType: eventType as 'auto' | 'choice' | 'ending',
        availableChoices,
        selectedChoice: this.selectChoice(availableChoices),
        gameState: JSON.parse(JSON.stringify(currentState)),
        currentTime: currentState.currentTime,
        timestamp: new Date().toISOString()
      };
      
      this.log(`   可用选项 (${availableChoices.length}个):`);
      availableChoices.forEach((choice, i) => {
        this.log(`     ${i + 1}. ${choice.text || choice.id}`);
      });
      this.log(`   ✅ 选择：${record.selectedChoice.text || record.selectedChoice.id}`);

      // 确定要执行的效果和结果文本
      let effectsToExecute = record.selectedChoice.effects || [];
      let outcomeText: string | null = null;

      // 如果有多结果分支，根据条件判定
      if (record.selectedChoice.outcomes && record.selectedChoice.outcomes.length > 0) {
        for (const outcome of record.selectedChoice.outcomes) {
          if (outcome.condition && !this.evaluateCondition(outcome.condition)) {
            continue;
          }
          effectsToExecute = outcome.effects || [];
          outcomeText = outcome.text || null;
          break;
        }
      }

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
        if (!stateAfterChoice.player?.alive || this.hasGameEnded(stateAfterChoice)) {
          if (this.hasGameEnded(stateAfterChoice)) {
            this.ended = true;
          }
          record.gameState = JSON.parse(JSON.stringify(stateAfterChoice));
          this.records.push(record);
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
          this.records.push(immediateRecord);
        }
        
        // 效果中已包含时间推进，不再调用 advanceTime
      } else {
        // 如果没有效果，手动推进时间
        gameEngine.advanceTime(1);
      }
      
      // 更新状态并记录
      this.gameState = gameEngine.getGameState();
      record.gameState = JSON.parse(JSON.stringify(this.gameState));
      this.records.push(record);
    } else {
      // 自动事件：执行自动效果
      this.log(`   ✅ 自动触发`);
      if (event.autoEffects && event.autoEffects.length > 0) {
        await gameEngine.executeAutoEvent(event);
        const eventOutcomeNote = gameEngine.consumeLastEventOutcomeNote();
        const baseOutcomeText = this.generateOutcomeText(event, event.autoEffects);
        const mergedOutcomeText = eventOutcomeNote
          ? `${baseOutcomeText} ${eventOutcomeNote}`.trim()
          : baseOutcomeText;

        // 检查是否死亡，如果死亡则停止处理
        const stateAfterAuto = gameEngine.getGameState();
        if (!stateAfterAuto.player?.alive || this.hasGameEnded(stateAfterAuto)) {
          if (this.hasGameEnded(stateAfterAuto)) {
            this.ended = true;
          }
          const record: GameProcessRecord = {
            age: ageBeforeEvent,
            eventId: event.id,
            eventTitle: title,
            eventText: text,
            eventType: eventType as 'auto' | 'choice' | 'ending',
            outcomeText: mergedOutcomeText || undefined,
            gameState: JSON.parse(JSON.stringify(stateAfterAuto)),
            currentTime: stateAfterAuto.currentTime,
            timestamp: new Date().toISOString()
          };
          this.records.push(record);
          this.log(`\n   💀 死亡原因：${stateAfterAuto.player?.deathReason || '未知'}`);
          return; // 直接返回，不继续处理
        }
        // 效果中已包含时间推进，不再调用 advanceTime
      } else {
        // 如果没有效果，手动推进时间
        gameEngine.advanceTime(1);
      }
      
      // 更新状态并记录
      this.gameState = gameEngine.getGameState();
      const record: GameProcessRecord = {
        age: ageBeforeEvent,
        eventId: event.id,
        eventTitle: title,
        eventText: text,
        eventType: eventType as 'auto' | 'choice' | 'ending',
        outcomeText: (() => {
          const eventOutcomeNote = gameEngine.consumeLastEventOutcomeNote();
          const baseOutcomeText = event.autoEffects?.length
            ? this.generateOutcomeText(event, event.autoEffects)
            : null;
          if (baseOutcomeText && eventOutcomeNote) {
            return `${baseOutcomeText} ${eventOutcomeNote}`;
          }
          return eventOutcomeNote || baseOutcomeText || undefined;
        })(),
        gameState: JSON.parse(JSON.stringify(this.gameState)),
        currentTime: this.gameState.currentTime,
        timestamp: new Date().toISOString()
      };
      this.records.push(record);
    }

    if (eventType === 'ending' || this.hasGameEnded(this.gameState)) {
      this.log('   🏁 触发结局事件，模拟结束');
      this.ended = true;
    }

    // 检查是否死亡
    if (!this.gameState.player?.alive) {
      this.log(`\n   💀 死亡原因：${this.gameState.player?.deathReason}`);
    }
  }

  /**
   * 选择事件选项（模拟玩家决策）
   */
  private selectChoice(choices: EventChoice[]): EventChoice {
    // 智能选择策略：
    // 1. 优先选择增加属性的选项
    // 2. 其次选择有趣/有意义的选项
    // 3. 最后随机选择

    let bestChoice = choices[0];
    let bestScore = -Infinity;

    for (const choice of choices) {
      let score = 0;

      // 如果有多结果分支，评估最佳结果
      if (choice.outcomes && choice.outcomes.length > 0) {
        let bestOutcomeScore = -Infinity;
        for (const outcome of choice.outcomes) {
          // 检查条件是否满足
          if (outcome.condition && !this.evaluateCondition(outcome.condition)) {
            continue; // 条件不满足，跳过
          }

          let outcomeScore = 0;
          if (outcome.effects) {
            for (const effect of outcome.effects) {
              if (effect.type !== 'stat_modify' || effect.operator !== 'add' || !effect.target) continue;
              const value = typeof effect.value === 'number' ? effect.value : 0;
              if (['martialPower', 'internalSkill', 'externalSkill', 'qinggong', 'chivalry', 'comprehension', 'constitution'].includes(effect.target)) {
                outcomeScore += value * 2;
              } else {
                outcomeScore += value;
              }
            }
          }
          if (outcomeScore > bestOutcomeScore) {
            bestOutcomeScore = outcomeScore;
          }
        }
        score = bestOutcomeScore;
      } else if (choice.effects) {
        // 无多结果分支，评估原有效果
        for (const effect of choice.effects) {
          if (effect.type !== 'stat_modify' || effect.operator !== 'add' || !effect.target) continue;
          const value = typeof effect.value === 'number' ? effect.value : 0;
          if (['martialPower', 'internalSkill', 'externalSkill', 'qinggong', 'chivalry', 'comprehension', 'constitution'].includes(effect.target)) {
            score += value * 2;
          } else {
            score += value;
          }
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestChoice = choice;
      }
    }

    if (bestScore > -Infinity) {
      return bestChoice;
    }

    const randomIndex = Math.floor(Math.random() * choices.length);
    return choices[randomIndex];
  }

  /**
   * 评估条件表达式
   */
  private evaluateCondition(condition: any): boolean {
    if (!condition) return true;
    if (condition.type !== 'expression') return true;

    const expr = condition.expression;
    if (!expr || typeof expr !== 'string') return true;

    const state = this.gameState;
    if (!state || !state.player) return false;

    try {
      // 简单的表达式解析
      const player = state.player as any;

      // 替换玩家属性
      let evalExpr = expr
        .replace(/martialPower/g, 'player.martialPower')
        .replace(/internalSkill/g, 'player.internalSkill')
        .replace(/externalSkill/g, 'player.externalSkill')
        .replace(/qinggong/g, 'player.qinggong')
        .replace(/chivalry/g, 'player.chivalry')
        .replace(/charisma/g, 'player.charisma')
        .replace(/constitution/g, 'player.constitution')
        .replace(/comprehension/g, 'player.comprehension')
        .replace(/reputation/g, 'player.reputation')
        .replace(/health/g, 'player.health')
        .replace(/connections/g, 'player.connections')
        .replace(/influence/g, 'player.influence')
        .replace(/knowledge/g, 'player.knowledge')
        .replace(/businessAcumen/g, 'player.businessAcumen')
        .replace(/money/g, 'player.money');

      // 处理 flags 引用
      evalExpr = evalExpr.replace(/flags\.has\("([^"]+)"\)/g, '((player.flags && player.flags["$1"]) === true)');
      evalExpr = evalExpr.replace(/flags\.(\w+)/g, '(player.flags ? player.flags.$1 : false)');

      // 安全评估（只允许比较运算）
      if (!/^[\w\s<>=!&|().'":\-[\]]+$/.test(evalExpr)) {
        console.warn('[Simulator] 条件表达式包含不支持的字符:', evalExpr);
        return true;
      }

      const result = new Function('player', `return ${evalExpr}`)(player);
      return result === true;
    } catch (error) {
      console.warn('[Simulator] 条件评估失败:', condition.expression, error);
      return true;
    }
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
   * 自动保存
   */
  private autoSave(): void {
    if (!this.gameState) return;
    
    const saveName = `自动存档-${this.gameState.player?.age}岁`;
    const saveId = saveManager.saveGame(this.gameState, saveName);
    this.saveCount++;
    this.log(`   💾 自动保存：${saveName} (ID: ${saveId})`);
  }

  /**
   * 生成测试报告
   */
  private generateReport(): GameProcessReport {
    const finalState = this.gameState;
    const forcedLateLifeEnding = finalState ? EndingSystem.getForcedLateLifeEnding(finalState) : null;
    const gameEnded = this.hasGameEnded(finalState) || Boolean(forcedLateLifeEnding);
    const endingName = this.getEndingDisplayName(finalState, gameEnded, forcedLateLifeEnding?.name);
    
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

    return {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      config: this.config,
      totalYears: this.records.length,
      finalAge: finalState?.player?.age || 0,
      isAlive: gameEnded ? false : (finalState?.player?.alive || false),
      deathReason: finalState?.player?.deathReason || (gameEnded ? endingName : null),
      totalEvents: this.records.length,
      totalChoices: choiceEvents,
      totalSaves: this.saveCount,
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
      }
    };
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

    if (state.ending && typeof state.ending.name === 'string' && state.ending.name.trim()) {
      return state.ending.name;
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
}
