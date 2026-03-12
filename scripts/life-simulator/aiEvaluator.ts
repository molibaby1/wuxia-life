/**
 * AI 逻辑合理性评估系统 - 基于规则和启发式算法的评估引擎
 */

import type {
  AiEvaluationReport,
  ChoiceRecord,
  LogicConflict,
  CriticalDecisionPoint,
  StateSnapshot,
  SimulationConfig,
} from './types';

/**
 * AI 评估器实现
 */
export class AiEvaluator {
  private config: SimulationConfig;

  constructor(config: SimulationConfig) {
    this.config = config;
  }

  /**
   * 评估选择路径连贯性
   */
  private evaluateCoherence(choiceRecords: ChoiceRecord[]): number {
    if (choiceRecords.length < 2) return 100;

    let score = 100;
    let consecutiveRandomChoices = 0;

    for (let i = 1; i < choiceRecords.length; i++) {
      const prev = choiceRecords[i - 1];
      const curr = choiceRecords[i];

      // 检测连续随机选择
      if (curr.selectionReason.includes('随机')) {
        consecutiveRandomChoices++;
        if (consecutiveRandomChoices > 3) {
          score -= 2; // 连续随机选择过多扣分
        }
      } else {
        consecutiveRandomChoices = 0;
      }

      // 检测状态突变（年龄跳跃过大）
      const ageDiff = curr.gameYear - prev.gameYear;
      if (ageDiff > 5) {
        score -= (ageDiff - 3) * 2; // 年龄跳跃过大扣分
      }

      // 检测逻辑不连贯（如刚加入门派就离开）
      if (this.isInconsistentTransition(prev, curr)) {
        score -= 10;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 检测不连贯的状态转换
   */
  private isInconsistentTransition(prev: ChoiceRecord, curr: ChoiceRecord): boolean {
    const prevNode = prev.nodeId.toLowerCase();
    const currNode = curr.nodeId.toLowerCase();

    // 刚加入门派就立即参加其他活动（不合理）
    if (prevNode.includes('accepted') && currNode.includes('tournament')) {
      return true;
    }

    // 刚失败就立即成功（不合理）
    if (prevNode.includes('fail') && currNode.includes('win')) {
      return true;
    }

    // 死亡后还有活动（严重错误）
    if (prev.stateAfter.deathReason && !curr.stateAfter.deathReason) {
      return true;
    }

    return false;
  }

  /**
   * 评估系统反馈关联性
   */
  private evaluateFeedbackRelevance(choiceRecords: ChoiceRecord[]): number {
    if (choiceRecords.length === 0) return 100;

    let score = 100;

    choiceRecords.forEach(record => {
      // 检查系统反馈是否为空
      if (!record.systemFeedback || record.systemFeedback.trim() === '') {
        score -= 5;
      }

      // 检查状态变化是否与选择相关
      const choiceId = record.selectedChoiceId.toLowerCase();
      const stateChanges = record.stateChanges;

      // 战斗选择应该有属性变化
      if (choiceId.includes('fight') || choiceId.includes('battle')) {
        const hasRelevantChange = stateChanges.some(change =>
          ['martialPower', 'internalSkill', 'externalSkill', 'health'].includes(change.field)
        );
        if (!hasRelevantChange && stateChanges.length > 0) {
          score -= 3;
        }
      }

      // 学习选择应该有技能提升
      if (choiceId.includes('learn') || choiceId.includes('practice')) {
        const hasSkillIncrease = stateChanges.some(change =>
          change.newValue > change.oldValue &&
          ['martialPower', 'internalSkill', 'externalSkill', 'qinggong'].includes(change.field)
        );
        if (!hasSkillIncrease && stateChanges.length > 0) {
          score -= 3;
        }
      }
    });

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 评估状态转换逻辑性
   */
  private evaluateStateTransitionLogic(
    choiceRecords: ChoiceRecord[],
    snapshots: StateSnapshot[]
  ): number {
    if (snapshots.length < 2) return 100;

    let score = 100;

    for (let i = 1; i < snapshots.length; i++) {
      const prev = snapshots[i - 1];
      const curr = snapshots[i];

      // 检查年龄增长
      const ageDiff = curr.age - prev.age;
      if (ageDiff < 0) {
        score -= 20; // 年龄倒流，严重错误
      } else if (ageDiff > 10) {
        score -= 10; // 年龄跳跃过大
      }

      // 检查门派状态
      if (prev.state.sect && !curr.state.sect && !prev.state.deathReason) {
        score -= 15; // 门派消失（非死亡情况）
      }

      // 检查生命值（如果有）
      if ((curr.state as any).health !== undefined && (prev.state as any).health !== undefined) {
        const healthDiff = (curr.state as any).health - (prev.state as any).health;
        if (healthDiff < -50) {
          score -= 10; // 生命骤降
        }
      }

      // 检查 flags 的一致性
      const prevFlags = Array.from(prev.state.flags);
      const currFlags = Array.from(curr.state.flags);
      
      // 某些重要 flag 不应该消失
      if (prevFlags.includes('joinedTournament') && !currFlags.includes('joinedTournament')) {
        // 检查是否有后续 flag
        const hasTournamentResult = currFlags.some(f => 
          f.includes('tournamentChampion') || f.includes('tournamentRunnerUp')
        );
        if (!hasTournamentResult) {
          score -= 5;
        }
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 评估决策合理性
   */
  private evaluateDecisionRationality(choiceRecords: ChoiceRecord[]): number {
    if (choiceRecords.length === 0) return 100;

    let score = 100;

    choiceRecords.forEach(record => {
      const { weights, selectedChoiceId } = record;

      if (weights) {
        // 检查是否选择了权重最低的选择（无明显理由）
        const weightValues = Object.values(weights);
        const maxWeight = Math.max(...weightValues);
        const selectedWeight = weights[selectedChoiceId];

        if (selectedWeight < maxWeight * 0.3 && !record.selectionReason.includes('随机')) {
          score -= 5; // 选择了权重很低的选择
        }

        // 检查是否所有权重都是 0（配置错误）
        if (weightValues.every(w => w === 0)) {
          score -= 10;
        }
      }

      // 检查选择与状态的匹配
      const choiceId = selectedChoiceId.toLowerCase();
      const state = record.stateBefore;

      // 武功低却选择激进战斗
      if (choiceId.includes('aggressive') && state.martialPower < 20) {
        score -= 3; // 可能不合理
      }

      // 侠义低却选择帮助他人
      if (choiceId.includes('help') && state.chivalry < 10) {
        score -= 2; // 可能不合理
      }
    });

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 检测逻辑矛盾
   */
  private detectLogicConflicts(choiceRecords: ChoiceRecord[]): LogicConflict[] {
    const conflicts: LogicConflict[] = [];

    // 检测因果错误
    for (let i = 0; i < choiceRecords.length - 1; i++) {
      const curr = choiceRecords[i];
      const next = choiceRecords[i + 1];

      // 死亡后还有活动
      if (curr.stateAfter.deathReason && next.gameYear > curr.gameYear) {
        conflicts.push({
          id: `conflict_${i}`,
          type: 'causality_error',
          severity: 'critical',
          description: `玩家在年龄 ${curr.gameYear} 死亡（${curr.stateAfter.deathReason}），但在年龄 ${next.gameYear} 仍有活动`,
          relatedChoiceIds: [i, i + 1],
          suggestedFix: '检查死亡状态的判断逻辑，确保死亡后不再触发事件',
        });
      }

      // 条件违反（选择了条件不满足的选项）
      if (curr.availableChoices.length > 0) {
        const selectedChoice = curr.availableChoices.find(c => c.id === curr.selectedChoiceId);
        // 这里简化处理，实际需要检查条件
      }
    }

    // 检测状态不一致
    const sectJoins = choiceRecords.filter(r => 
      r.stateAfter.sect && !r.stateBefore.sect
    );
    
    if (sectJoins.length > 1) {
      conflicts.push({
        id: 'conflict_sect',
        type: 'state_inconsistency',
        severity: 'high',
        description: `玩家多次加入门派 (${sectJoins.length} 次)，这可能不合理`,
        relatedChoiceIds: sectJoins.map((r, i) => choiceRecords.indexOf(r)),
        suggestedFix: '检查门派加入条件，确保只能加入一个门派',
      });
    }

    return conflicts;
  }

  /**
   * 识别关键决策点
   */
  private identifyCriticalDecisions(choiceRecords: ChoiceRecord[]): CriticalDecisionPoint[] {
    const decisions: CriticalDecisionPoint[] = [];

    choiceRecords.forEach((record, index) => {
      const nodeId = record.nodeId.toLowerCase();
      const choiceId = record.selectedChoiceId.toLowerCase();

      // 门派选择
      if (nodeId.includes('sect') || nodeId.includes('apply')) {
        decisions.push({
          id: `decision_${index}`,
          type: 'sect_join',
          timestamp: record.timestamp,
          age: record.gameYear,
          decision: record.selectedChoiceText,
          impact: '决定玩家所属门派和武学路线',
          rationalityScore: this.calculateDecisionScore(record),
          aiComment: this.generateDecisionComment(record),
        });
      }

      // 武林大会
      if (nodeId.includes('tournament')) {
        decisions.push({
          id: `decision_${index}`,
          type: 'tournament',
          timestamp: record.timestamp,
          age: record.gameYear,
          decision: record.selectedChoiceText,
          impact: '影响江湖声望和武功提升',
          rationalityScore: this.calculateDecisionScore(record),
          aiComment: this.generateDecisionComment(record),
        });
      }

      // 爱情选择
      if (nodeId.includes('love') || choiceId.includes('marry') || choiceId.includes('propose')) {
        decisions.push({
          id: `decision_${index}`,
          type: 'love',
          timestamp: record.timestamp,
          age: record.gameYear,
          decision: record.selectedChoiceText,
          impact: '影响婚姻状况和子女数量',
          rationalityScore: this.calculateDecisionScore(record),
          aiComment: this.generateDecisionComment(record),
        });
      }

      // 生死抉择
      if (choiceId.includes('fight') && record.stateAfter.deathReason) {
        decisions.push({
          id: `decision_${index}`,
          type: 'life_death',
          timestamp: record.timestamp,
          age: record.gameYear,
          decision: record.selectedChoiceText,
          impact: `导致死亡：${record.stateAfter.deathReason}`,
          rationalityScore: this.calculateDecisionScore(record),
          aiComment: '这是一个致命的选择',
        });
      }
    });

    return decisions;
  }

  /**
   * 计算决策合理性评分
   */
  private calculateDecisionScore(record: ChoiceRecord): number {
    let score = 7; // 基础分

    const { weights, selectedChoiceId, stateBefore } = record;

    // 根据权重评分
    if (weights) {
      const weightValues = Object.values(weights);
      const maxWeight = Math.max(...weightValues);
      const selectedWeight = weights[selectedChoiceId];
      
      if (selectedWeight >= maxWeight * 0.8) {
        score += 2; // 选择了高权重选项
      } else if (selectedWeight < maxWeight * 0.3) {
        score -= 2; // 选择了低权重选项
      }
    }

    // 根据状态匹配评分
    const choiceId = selectedChoiceId.toLowerCase();
    
    if ((choiceId.includes('fight') || choiceId.includes('battle')) && stateBefore.martialPower < 30) {
      score -= 2; // 武功低却选择战斗
    }
    
    if (choiceId.includes('help') && stateBefore.chivalry < 15) {
      score -= 1; // 侠义低却选择帮助
    }

    return Math.max(0, Math.min(10, score));
  }

  /**
   * 生成决策评论
   */
  private generateDecisionComment(record: ChoiceRecord): string {
    const choiceId = record.selectedChoiceId.toLowerCase();
    const state = record.stateBefore;

    if (choiceId.includes('fight') && state.martialPower >= 60) {
      return '武功高强，选择战斗是合理的';
    }
    
    if (choiceId.includes('fight') && state.martialPower < 30) {
      return '武功较低却选择战斗，风险较大';
    }
    
    if (choiceId.includes('help') && state.chivalry >= 20) {
      return '侠义值高，乐于助人符合人设';
    }
    
    if (choiceId.includes('careful') || choiceId.includes('cautious')) {
      return '谨慎的选择，符合江湖生存法则';
    }

    return '常规选择';
  }

  /**
   * 生成 AI 总结
   */
  private generateSummary(
    dimensions: AiEvaluationReport['dimensions'],
    conflicts: LogicConflict[]
  ): string {
    const avgScore = (
      dimensions.coherence +
      dimensions.feedbackRelevance +
      dimensions.stateTransitionLogic +
      dimensions.decisionRationality
    ) / 4;

    let summary = `本次模拟整体表现为${avgScore >= 80 ? '优秀' : avgScore >= 60 ? '良好' : '一般'}。`;

    if (dimensions.coherence >= 80) {
      summary += ' 选择路径连贯性好，决策过程自然流畅。';
    } else if (dimensions.coherence < 60) {
      summary += ' 选择路径连贯性较差，存在决策跳跃。';
    }

    if (conflicts.length === 0) {
      summary += ' 未发现明显的逻辑矛盾。';
    } else {
      summary += ` 发现 ${conflicts.length} 个逻辑矛盾，需要关注。`;
    }

    return summary;
  }

  /**
   * 生成改进建议
   */
  private generateRecommendations(
    dimensions: AiEvaluationReport['dimensions'],
    conflicts: LogicConflict[]
  ): string[] {
    const recommendations: string[] = [];

    if (dimensions.coherence < 70) {
      recommendations.push('优化随机选择算法，增加基于属性的权重影响');
    }

    if (dimensions.feedbackRelevance < 70) {
      recommendations.push('增强选择与系统反馈的关联性，确保反馈准确反映选择结果');
    }

    if (dimensions.stateTransitionLogic < 70) {
      recommendations.push('检查状态转换逻辑，确保状态变化符合游戏规则');
    }

    if (dimensions.decisionRationality < 70) {
      recommendations.push('调整决策引擎，使选择更符合角色属性和当前情境');
    }

    conflicts.forEach(conflict => {
      if (conflict.suggestedFix) {
        recommendations.push(`[矛盾修复] ${conflict.suggestedFix}`);
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('系统运行良好，无需特别改进');
    }

    return recommendations;
  }

  /**
   * 执行完整评估
   */
  evaluate(
    choiceRecords: ChoiceRecord[],
    snapshots: StateSnapshot[]
  ): AiEvaluationReport {
    // 计算各维度评分
    const dimensions = {
      coherence: this.evaluateCoherence(choiceRecords),
      feedbackRelevance: this.evaluateFeedbackRelevance(choiceRecords),
      stateTransitionLogic: this.evaluateStateTransitionLogic(choiceRecords, snapshots),
      decisionRationality: this.evaluateDecisionRationality(choiceRecords),
    };

    // 计算整体评分
    const overallScore = (
      dimensions.coherence +
      dimensions.feedbackRelevance +
      dimensions.stateTransitionLogic +
      dimensions.decisionRationality
    ) / 4;

    // 检测逻辑矛盾
    const conflicts = this.detectLogicConflicts(choiceRecords);

    // 识别关键决策点
    const criticalDecisions = this.identifyCriticalDecisions(choiceRecords);

    // 生成总结和建议
    const summary = this.generateSummary(dimensions, conflicts);
    const recommendations = this.generateRecommendations(dimensions, conflicts);

    return {
      overallScore,
      dimensions,
      conflicts,
      criticalDecisions,
      summary,
      recommendations,
    };
  }
}
