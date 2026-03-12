/**
 * 游戏整体测试框架
 * 
 * 设计原则：
 * - 全面覆盖：核心功能、用户交互、性能、兼容性
 * - 自动化执行：一键运行所有测试
 * - 报告生成：自动生成详细的测试报告
 * - 质量门禁：测试不通过立即停止开发
 * 
 * @version 1.0.0
 * @since 2026-03-12
 */

import { EventExecutor } from '../src/core/EventExecutor';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { EventDefinition, EventCategory, EventPriority, EffectType, GameState, PlayerState } from '../src/types/eventTypes';
import { eventExamples } from '../src/data/eventExamples';

// ========== 测试结果类型 ==========

export interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  message?: string;
  error?: Error;
}

export interface TestSuiteResult {
  suiteName: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  totalDuration: number;
  results: TestResult[];
}

export interface OverallTestReport {
  timestamp: string;
  totalSuites: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  totalDuration: number;
  passRate: number;
  suites: TestSuiteResult[];
  criticalIssues: CriticalIssue[];
  performanceMetrics: PerformanceMetrics;
}

export interface CriticalIssue {
  severity: 'critical' | 'major' | 'minor';
  description: string;
  impact: string;
  suggestedFix: string;
}

export interface PerformanceMetrics {
  avgEventExecutionTime: number;
  avgConditionEvaluationTime: number;
  memoryUsage: number;
  fps: number;
}

// ========== 测试框架核心 ==========

export class GameTestFramework {
  private eventExecutor: EventExecutor;
  private conditionEvaluator: ConditionEvaluator;
  private testSuites: Map<string, TestSuite>;
  
  constructor() {
    this.eventExecutor = new EventExecutor();
    this.conditionEvaluator = new ConditionEvaluator();
    this.testSuites = new Map();
  }
  
  /**
   * 注册测试套件
   */
  registerSuite(suiteName: string, suite: TestSuite) {
    this.testSuites.set(suiteName, suite);
  }
  
  /**
   * 运行所有测试
   */
  async runAllTests(): Promise<OverallTestReport> {
    const startTime = Date.now();
    const suites: TestSuiteResult[] = [];
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;
    const criticalIssues: CriticalIssue[] = [];
    
    console.log('🧪 开始运行游戏整体测试...\n');
    
    // 运行所有测试套件
    for (const [suiteName, suite] of this.testSuites) {
      console.log(`📋 运行测试套件：${suiteName}`);
      
      const suiteResult = await this.runSuite(suiteName, suite);
      suites.push(suiteResult);
      
      totalTests += suiteResult.totalTests;
      passedTests += suiteResult.passedTests;
      failedTests += suiteResult.failedTests;
      skippedTests += suiteResult.skippedTests;
      
      // 检查是否有严重问题
      if (suiteResult.failedTests > 0) {
        criticalIssues.push({
          severity: 'critical',
          description: `测试套件 "${suiteName}" 有 ${suiteResult.failedTests} 个测试失败`,
          impact: '可能导致游戏功能异常',
          suggestedFix: '查看测试详情，修复失败的测试用例',
        });
      }
      
      const status = suiteResult.failedTests === 0 ? '✅ 通过' : '❌ 失败';
      console.log(`${status} - ${suiteResult.passedTests}/${suiteResult.totalTests} 通过 (${suiteResult.totalDuration}ms)\n`);
    }
    
    const totalDuration = Date.now() - startTime;
    const passRate = (passedTests / totalTests) * 100;
    
    // 生成性能指标
    const performanceMetrics = await this.measurePerformance();
    
    // 生成报告
    const report: OverallTestReport = {
      timestamp: new Date().toISOString(),
      totalSuites: suites.length,
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      totalDuration,
      passRate,
      suites,
      criticalIssues,
      performanceMetrics,
    };
    
    // 输出总结
    this.printSummary(report);
    
    return report;
  }
  
  /**
   * 运行测试套件
   */
  private async runSuite(suiteName: string, suite: TestSuite): Promise<TestSuiteResult> {
    const results: TestResult[] = [];
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;
    const startTime = Date.now();
    
    for (const testCase of suite.testCases) {
      if (testCase.skip) {
        skippedTests++;
        results.push({
          name: testCase.name,
          passed: false,
          duration: 0,
          message: '已跳过',
        });
        continue;
      }
      
      const testStart = Date.now();
      try {
        await testCase.test();
        const duration = Date.now() - testStart;
        
        passedTests++;
        results.push({
          name: testCase.name,
          passed: true,
          duration,
        });
      } catch (error) {
        const duration = Date.now() - testStart;
        failedTests++;
        const errorMsg = (error as Error).message;
        results.push({
          name: testCase.name,
          passed: false,
          duration,
          error: error as Error,
          message: errorMsg,
        });
        // 输出失败详情
        console.error(`  ❌ 失败：${testCase.name}`);
        console.error(`     错误：${errorMsg}`);
        if (testCase.description) {
          console.error(`     描述：${testCase.description}`);
        }
      }
    }
    
    return {
      suiteName,
      totalTests: suite.testCases.length,
      passedTests,
      failedTests,
      skippedTests,
      totalDuration: Date.now() - startTime,
      results,
    };
  }
  
  /**
   * 性能测试
   */
  private async measurePerformance(): Promise<PerformanceMetrics> {
    const testState = this.createTestState();
    
    // 测试事件执行性能
    const eventExecStart = Date.now();
    const testEvent: EventDefinition = {
      id: 'perf_test',
      version: '1.0.0',
      category: EventCategory.DAILY_EVENT,
      priority: EventPriority.NORMAL,
      weight: 30,
      ageRange: { min: 18, max: 25 },
      triggers: [],
      content: { text: '性能测试' },
      eventType: 'auto',
      autoEffects: [
        { type: EffectType.STAT_MODIFY, target: 'martialPower', value: 5, operator: 'add' },
      ],
      metadata: { createdAt: Date.now(), updatedAt: Date.now(), enabled: true },
    };
    
    for (let i = 0; i < 100; i++) {
      await this.eventExecutor.executeEffects(testEvent.autoEffects!, testState);
    }
    const eventExecTime = (Date.now() - eventExecStart) / 100;
    
    // 测试条件评估性能
    const condEvalStart = Date.now();
    for (let i = 0; i < 100; i++) {
      this.conditionEvaluator.evaluate(
        { type: 'expression', expression: 'player.martialPower >= 20 AND player.age >= 18' },
        testState
      );
    }
    const condEvalTime = (Date.now() - condEvalStart) / 100;
    
    // 内存使用（估算）
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
    
    return {
      avgEventExecutionTime: eventExecTime,
      avgConditionEvaluationTime: condEvalTime,
      memoryUsage,
      fps: 60, // 估算值
    };
  }
  
  /**
   * 打印测试总结
   */
  private printSummary(report: OverallTestReport) {
    console.log('='.repeat(80));
    console.log('📊 测试总结报告');
    console.log('='.repeat(80));
    console.log(`测试时间：${report.timestamp}`);
    console.log(`测试套件：${report.totalSuites} 个`);
    console.log(`总测试数：${report.totalTests} 个`);
    console.log(`通过：${report.passedTests} ✅`);
    console.log(`失败：${report.failedTests} ❌`);
    console.log(`跳过：${report.skippedTests} ⏭️`);
    console.log(`通过率：${report.passRate.toFixed(2)}%`);
    console.log(`总耗时：${report.totalDuration}ms`);
    console.log('');
    console.log('性能指标:');
    console.log(`  - 平均事件执行时间：${report.performanceMetrics.avgEventExecutionTime.toFixed(2)}ms`);
    console.log(`  - 平均条件评估时间：${report.performanceMetrics.avgConditionEvaluationTime.toFixed(2)}ms`);
    console.log(`  - 内存使用：${report.performanceMetrics.memoryUsage.toFixed(2)}MB`);
    console.log('');
    
    if (report.criticalIssues.length > 0) {
      console.log('⚠️  严重问题:');
      report.criticalIssues.forEach((issue, index) => {
        console.log(`  ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.description}`);
        console.log(`     影响：${issue.impact}`);
        console.log(`     建议：${issue.suggestedFix}`);
      });
      console.log('');
    }
    
    console.log('='.repeat(80));
    
    if (report.passRate === 100) {
      console.log('🎉 所有测试通过！可以继续开发。');
    } else {
      console.log('🚨 测试未通过！请立即修复失败的测试用例。');
      console.log('根据开发流程要求，测试不通过时应停止后续开发工作。');
    }
    console.log('='.repeat(80));
  }
  
  /**
   * 创建测试状态
   */
  private createTestState(): GameState {
    return {
      saveVersion: '1.0.0',
      lastSavedAt: Date.now(),
      gameTimestamp: Date.now(),
      player: {
        age: 18,
        gender: 'male',
        name: '测试玩家',
        martialPower: 20,
        externalSkill: 15,
        internalSkill: 10,
        qinggong: 12,
        chivalry: 25,
        sect: '武当派',
        title: null,
        reputation: 50,
        money: 100,
        children: 0,
        spouse: null,
        alive: true,
      },
      triggeredEvents: [],
      eventHistory: [],
      flags: {},
      relations: {},
      inventory: [],
      statistics: {
        totalEvents: 0,
        totalChoices: 0,
        playTime: 0,
      },
    };
  }
}

// ========== 测试套件定义 ==========

export interface TestSuite {
  testCases: TestCase[];
}

export interface TestCase {
  name: string;
  test: () => Promise<void> | void;
  skip?: boolean;
  description?: string;
}

// ========== 测试工具函数 ==========

/**
 * 断言函数
 */
export function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`断言失败：${message}`);
  }
}

/**
 * 相等断言
 */
export function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`期望 ${expected}, 实际 ${actual}: ${message}`);
  }
}

/**
 * 深度相等断言
 */
export function assertDeepEqual<T>(actual: T, expected: T, message: string) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(`深度不相等：${message}`);
  }
}
