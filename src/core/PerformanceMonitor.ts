/**
 * 性能监控工具
 * 
 * 功能：
 * - 性能指标收集
 * - 执行时间统计
 * - 内存使用监控
 * - 性能报告生成
 */

export interface PerformanceMetrics {
  eventExecutionTime: number[];
  conditionEvaluationTime: number[];
  componentRenderTime: number[];
  memoryUsage: MemoryUsage;
  timestamp: number;
}

export interface MemoryUsage {
  usedHeapSize: number;
  totalHeapSize: number;
  heapSizeLimit: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics;
  private readonly MAX_SAMPLES = 100; // 最多保留 100 个样本
  
  private constructor() {
    this.metrics = {
      eventExecutionTime: [],
      conditionEvaluationTime: [],
      componentRenderTime: [],
      memoryUsage: {
        usedHeapSize: 0,
        totalHeapSize: 0,
        heapSizeLimit: 0,
      },
      timestamp: Date.now(),
    };
  }
  
  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  /**
   * 记录事件执行时间
   */
  public recordEventExecution(timeMs: number): void {
    this.metrics.eventExecutionTime.push(timeMs);
    this.trimMetrics();
  }
  
  /**
   * 记录条件评估时间
   */
  public recordConditionEvaluation(timeMs: number): void {
    this.metrics.conditionEvaluationTime.push(timeMs);
    this.trimMetrics();
  }
  
  /**
   * 记录组件渲染时间
   */
  public recordComponentRender(timeMs: number): void {
    this.metrics.componentRenderTime.push(timeMs);
    this.trimMetrics();
  }
  
  /**
   * 更新内存使用信息
   */
  public updateMemoryUsage(): void {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = {
        usedHeapSize: memory.usedJSHeapSize,
        totalHeapSize: memory.totalJSHeapSize,
        heapSizeLimit: memory.jsHeapSizeLimit,
      };
    } else if (typeof process !== 'undefined' && process.memoryUsage) {
      // Node.js 环境
      const memory = process.memoryUsage();
      this.metrics.memoryUsage = {
        usedHeapSize: memory.heapUsed,
        totalHeapSize: memory.heapTotal,
        heapSizeLimit: memory.rss || 0,
      };
    }
  }
  
  /**
   * 获取平均执行时间
   */
  public getAverageExecutionTime(): number {
    const times = this.metrics.eventExecutionTime;
    if (times.length === 0) return 0;
    return times.reduce((a, b) => a + b, 0) / times.length;
  }
  
  /**
   * 获取平均条件评估时间
   */
  public getAverageConditionEvaluationTime(): number {
    const times = this.metrics.conditionEvaluationTime;
    if (times.length === 0) return 0;
    return times.reduce((a, b) => a + b, 0) / times.length;
  }
  
  /**
   * 获取平均渲染时间
   */
  public getAverageRenderTime(): number {
    const times = this.metrics.componentRenderTime;
    if (times.length === 0) return 0;
    return times.reduce((a, b) => a + b, 0) / times.length;
  }
  
  /**
   * 获取性能报告
   */
  public getPerformanceReport(): PerformanceReport {
    return {
      eventExecution: {
        count: this.metrics.eventExecutionTime.length,
        average: this.getAverageExecutionTime(),
        min: Math.min(...this.metrics.eventExecutionTime, 0),
        max: Math.max(...this.metrics.eventExecutionTime, 0),
      },
      conditionEvaluation: {
        count: this.metrics.conditionEvaluationTime.length,
        average: this.getAverageConditionEvaluationTime(),
        min: Math.min(...this.metrics.conditionEvaluationTime, 0),
        max: Math.max(...this.metrics.conditionEvaluationTime, 0),
      },
      componentRender: {
        count: this.metrics.componentRenderTime.length,
        average: this.getAverageRenderTime(),
        min: Math.min(...this.metrics.componentRenderTime, 0),
        max: Math.max(...this.metrics.componentRenderTime, 0),
      },
      memory: this.metrics.memoryUsage,
      timestamp: this.metrics.timestamp,
    };
  }
  
  /**
   * 打印性能报告
   */
  public printPerformanceReport(): void {
    const report = this.getPerformanceReport();
    
    
    
    
  }
  
  /**
   * 重置性能数据
   */
  public reset(): void {
    this.metrics = {
      eventExecutionTime: [],
      conditionEvaluationTime: [],
      componentRenderTime: [],
      memoryUsage: {
        usedHeapSize: 0,
        totalHeapSize: 0,
        heapSizeLimit: 0,
      },
      timestamp: Date.now(),
    };
  }
  
  /**
   * 裁剪指标数组
   */
  private trimMetrics(): void {
    if (this.metrics.eventExecutionTime.length > this.MAX_SAMPLES) {
      this.metrics.eventExecutionTime.shift();
    }
    if (this.metrics.conditionEvaluationTime.length > this.MAX_SAMPLES) {
      this.metrics.conditionEvaluationTime.shift();
    }
    if (this.metrics.componentRenderTime.length > this.MAX_SAMPLES) {
      this.metrics.componentRenderTime.shift();
    }
  }
}

export interface PerformanceReport {
  eventExecution: PerformanceStats;
  conditionEvaluation: PerformanceStats;
  componentRender: PerformanceStats;
  memory: MemoryUsage;
  timestamp: number;
}

export interface PerformanceStats {
  count: number;
  average: number;
  min: number;
  max: number;
}

// 导出单例
export const performanceMonitor = PerformanceMonitor.getInstance();
