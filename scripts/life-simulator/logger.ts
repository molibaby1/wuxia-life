/**
 * 事件日志记录系统 - 详细记录所有游戏事件
 */

import { writeFileSync } from 'fs';
import type {
  ChoiceRecord,
  StateSnapshot,
  CriticalDecisionPoint,
  LogicConflict,
  SimulationReport,
  SimulationConfig,
  AiEvaluationReport,
} from './types';
import type { PlayerState } from '../../src/types';

/**
 * 日志记录器实现
 */
export class SimulatorLogger implements ILogger {
  private choiceRecords: ChoiceRecord[] = [];
  private stateSnapshots: StateSnapshot[] = [];
  private criticalDecisions: CriticalDecisionPoint[] = [];
  private logicConflicts: LogicConflict[] = [];
  private startTime: string = '';
  private endTime: string = '';

  constructor() {
    this.reset();
  }

  /**
   * 重置日志
   */
  reset(): void {
    this.choiceRecords = [];
    this.stateSnapshots = [];
    this.criticalDecisions = [];
    this.logicConflicts = [];
    this.startTime = new Date().toISOString();
    this.endTime = '';
  }

  /**
   * 记录选择
   */
  logChoice(record: ChoiceRecord): void {
    this.choiceRecords.push(record);
  }

  /**
   * 记录状态快照
   */
  logSnapshot(snapshot: StateSnapshot): void {
    this.stateSnapshots.push(snapshot);
  }

  /**
   * 记录关键决策
   */
  logCriticalDecision(decision: CriticalDecisionPoint): void {
    this.criticalDecisions.push(decision);
  }

  /**
   * 记录逻辑矛盾
   */
  logConflict(conflict: LogicConflict): void {
    this.logicConflicts.push(conflict);
  }

  /**
   * 获取所有选择记录
   */
  getChoiceRecords(): ChoiceRecord[] {
    return this.choiceRecords;
  }

  /**
   * 获取状态快照
   */
  getStateSnapshots(): StateSnapshot[] {
    return this.stateSnapshots;
  }

  /**
   * 获取关键决策
   */
  getCriticalDecisions(): CriticalDecisionPoint[] {
    return this.criticalDecisions;
  }

  /**
   * 获取逻辑矛盾
   */
  getLogicConflicts(): LogicConflict[] {
    return this.logicConflicts;
  }

  /**
   * 计算统计信息
   */
  private calculateStatistics(
    config: SimulationConfig,
    finalState?: PlayerState
  ): SimulationReport['statistics'] {
    const totalStateChanges = this.choiceRecords.reduce(
      (sum, record) => sum + record.stateChanges.length,
      0
    );

    const totalEvents = new Set(
      this.choiceRecords.flatMap(record => 
        Object.keys(record.stateAfter).filter(key => key === 'events')
      )
    ).size;

    return {
      avgChoiceTime: 0, // 由外部计算
      totalStateChanges,
      totalEvents,
      lifespan: finalState?.age || config.endAge - config.startAge,
      sect: finalState?.sect || null,
      title: finalState?.title || null,
      married: finalState ? Array.from(finalState.flags).includes('married') : false,
      children: finalState?.children || 0,
      deathReason: finalState?.deathReason || null,
    };
  }

  /**
   * 生成完整报告
   */
  async generateReport(config: SimulationConfig, finalState?: PlayerState): Promise<SimulationReport> {
    this.endTime = new Date().toISOString();

    const startTime = new Date(this.startTime).getTime();
    const endTime = new Date(this.endTime).getTime();
    const duration = endTime - startTime;

    const avgChoiceTime = this.choiceRecords.length > 0 
      ? duration / this.choiceRecords.length 
      : 0;

    return {
      reportId: `sim_${Date.now()}`,
      generatedAt: this.endTime,
      config,
      startTime: this.startTime,
      endTime: this.endTime,
      duration,
      totalChoices: this.choiceRecords.length,
      criticalDecisions: this.criticalDecisions.length,
      choiceRecords: this.choiceRecords,
      stateSnapshots: this.stateSnapshots,
      aiEvaluation: undefined, // 由 AI 评估器填充
      statistics: {
        ...this.calculateStatistics(config, finalState),
        avgChoiceTime,
      },
    };
  }

  /**
   * 设置 AI 评估报告
   */
  setAiEvaluation(evaluation: AiEvaluationReport): void {
    // 这个方法用于在生成报告后设置 AI 评估
  }

  /**
   * 导出为 JSON
   */
  exportToJson(filePath: string, report: SimulationReport): void {
    writeFileSync(filePath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`📄 JSON 报告已导出：${filePath}`);
  }

  /**
   * 导出为 HTML
   */
  exportToHtml(filePath: string, report: SimulationReport): void {
    const html = this.generateHtmlReport(report);
    writeFileSync(filePath, html, 'utf-8');
    console.log(`📄 HTML 报告已导出：${filePath}`);
  }

  /**
   * 生成 HTML 报告
   */
  private generateHtmlReport(report: SimulationReport): string {
    const { statistics, choiceRecords, aiEvaluation } = report;

    const choiceRows = choiceRecords.slice(0, 100).map((record, index) => {
      const nodeTypeBadge = record.nodeType === 'auto' 
        ? '<span class="badge badge-auto">自动</span>' 
        : '<span class="badge badge-choice">选择</span>';
      
      const description = record.nodeDescription || record.nodeText;
      
      return `
      <tr class="choice-record">
        <td>${index + 1}</td>
        <td>${record.gameYear}</td>
        <td>
          ${nodeTypeBadge}
          <div class="node-desc">${description}</div>
          <div class="node-detail">
            <strong>节点 ID:</strong> <code>${record.nodeId}</code><br>
            <strong>选择:</strong> ${record.selectedChoiceText}<br>
            <strong>理由:</strong> ${record.selectionReason}<br>
            <strong>反馈:</strong> ${record.systemFeedback}
          </div>
        </td>
        <td class="state-changes">${record.stateChanges.length}</td>
      </tr>
    `;
    }).join('');

    const aiScore = aiEvaluation?.overallScore || 0;
    const aiDimensions = aiEvaluation?.dimensions || {
      coherence: 0,
      feedbackRelevance: 0,
      stateTransitionLogic: 0,
      decisionRationality: 0,
    };

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>玩家生命周期模拟报告</title>
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
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
      font-size: 36px;
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
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    .badge-auto {
      background: #e3f2fd;
      color: #1976d2;
    }
    .badge-choice {
      background: #f3e5f5;
      color: #7b1fa2;
    }
    .node-desc {
      font-size: 15px;
      color: #333;
      line-height: 1.6;
      margin-bottom: 8px;
    }
    .node-detail {
      font-size: 13px;
      color: #666;
      background: #f8f9fa;
      padding: 10px;
      border-radius: 4px;
      line-height: 1.8;
    }
    .node-detail strong {
      color: #495057;
    }
    .state-changes {
      text-align: center;
      font-weight: bold;
      color: #667eea;
    }
    code {
      background: #e9ecef;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: #d63384;
    }
    .ai-score {
      font-size: 72px;
      font-weight: bold;
      color: ${aiScore >= 80 ? '#28a745' : aiScore >= 60 ? '#ffc107' : '#dc3545'};
    }
    .dimension {
      display: flex;
      justify-content: space-between;
      padding: 10px;
      margin: 5px 0;
      background: #f8f9fa;
      border-radius: 4px;
    }
    .conflict {
      padding: 15px;
      margin: 10px 0;
      border-left: 4px solid #dc3545;
      background: #fff5f5;
    }
    .conflict.critical { border-color: #dc3545; }
    .conflict.high { border-color: #fd7e14; }
    .conflict.medium { border-color: #ffc107; }
    .conflict.low { border-color: #28a745; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎮 玩家生命周期模拟报告</h1>
      <p>生成时间：${report.generatedAt}</p>
    </div>

    <div class="summary">
      <div class="summary-card">
        <h3>总选择次数</h3>
        <div class="number">${report.totalChoices}</div>
      </div>
      <div class="summary-card">
        <h3>关键决策点</h3>
        <div class="number">${statistics.criticalDecisions}</div>
      </div>
      <div class="summary-card">
        <h3>寿命（年）</h3>
        <div class="number">${statistics.lifespan}</div>
      </div>
      <div class="summary-card">
        <h3>状态变化</h3>
        <div class="number">${statistics.totalStateChanges}</div>
      </div>
      <div class="summary-card">
        <h3>门派</h3>
        <div class="number">${statistics.sect || '无'}</div>
      </div>
      <div class="summary-card">
        <h3>子女数量</h3>
        <div class="number">${statistics.children}</div>
      </div>
    </div>

    ${aiEvaluation ? `
    <div class="section">
      <h2>🤖 AI 评估报告</h2>
      <div style="text-align: center; margin: 30px;">
        <div class="ai-score">${aiScore.toFixed(0)}</div>
        <p>整体合理性评分</p>
      </div>
      
      <h3>各维度评分</h3>
      <div class="dimension">
        <span>选择路径连贯性</span>
        <span>${aiDimensions.coherence.toFixed(1)} / 100</span>
      </div>
      <div class="dimension">
        <span>系统反馈关联性</span>
        <span>${aiDimensions.feedbackRelevance.toFixed(1)} / 100</span>
      </div>
      <div class="dimension">
        <span>状态转换逻辑性</span>
        <span>${aiDimensions.stateTransitionLogic.toFixed(1)} / 100</span>
      </div>
      <div class="dimension">
        <span>决策合理性</span>
        <span>${aiDimensions.decisionRationality.toFixed(1)} / 100</span>
      </div>

      ${aiEvaluation.conflicts.length > 0 ? `
      <h3>逻辑矛盾 (${aiEvaluation.conflicts.length})</h3>
      ${aiEvaluation.conflicts.map(conflict => `
        <div class="conflict ${conflict.severity}">
          <strong>${conflict.type}</strong> - ${conflict.description}
          ${conflict.suggestedFix ? `<br><em>建议：${conflict.suggestedFix}</em>` : ''}
        </div>
      `).join('')}
      ` : '<p style="color: #28a745; margin: 20px 0;">✅ 未发现逻辑矛盾</p>'}

      <h3>AI 总结</h3>
      <p style="margin: 20px 0; line-height: 1.6;">${aiEvaluation.summary}</p>

      ${aiEvaluation.recommendations.length > 0 ? `
      <h3>改进建议</h3>
      <ul style="margin: 20px; line-height: 2;">
        ${aiEvaluation.recommendations.map(rec => `<li>${rec}</li>`).join('')}
      </ul>
      ` : ''}
    </div>
    ` : ''}

    <div class="section">
      <h2>📋 选择记录（前 100 条）</h2>
      <table>
        <thead>
          <tr>
            <th width="50">#</th>
            <th width="80">年龄</th>
            <th>节点详情</th>
            <th width="100">状态变化</th>
          </tr>
        </thead>
        <tbody>
          ${choiceRows}
        </tbody>
      </table>
      ${choiceRecords.length > 100 ? `<p style="text-align: center; color: #6c757d; margin: 20px;">还有 ${choiceRecords.length - 100} 条记录，请查看 JSON 报告获取完整数据</p>` : ''}
    </div>

    <div class="section" style="text-align: center; color: #6c757d; font-size: 12px; border-top: 1px solid #e9ecef;">
      <p>Generated by 玩家生命周期自动模拟测试系统 v1.0</p>
    </div>
  </div>
</body>
</html>`;
  }
}

// 导出类型
export type { ILogger };
