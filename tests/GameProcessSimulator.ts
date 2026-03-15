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

      // 执行选择的效果（传递事件 ID 用于记录）
      if (record.selectedChoice.effects && record.selectedChoice.effects.length > 0) {
        await gameEngine.executeChoiceEffects(record.selectedChoice.effects, event.id);
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
        gameState: JSON.parse(JSON.stringify(this.gameState)),
        currentTime: this.gameState.currentTime,
        timestamp: new Date().toISOString()
      };
      this.records.push(record);
    }

    if (eventType === 'ending') {
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
      if (choice.effects) {
        for (const effect of choice.effects) {
          if (effect.operator !== 'add') continue;
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

    return {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      config: this.config,
      totalYears: this.records.length,
      finalAge: finalState?.player?.age || 0,
      isAlive: finalState?.player?.alive || false,
      deathReason: finalState?.player?.deathReason,
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
        flags: Object.fromEntries(
          Object.entries(flags).filter(([_, v]) => typeof v === 'boolean' && v)
        ),
      }
    };
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
