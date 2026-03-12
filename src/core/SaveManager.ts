/**
 * 存档管理器 - 本地存储集成
 * 
 * 功能：
 * - 游戏存档保存
 * - 游戏存档加载
 * - 存档列表管理
 * - 自动保存
 * - 存档导入/导出
 */

import type { GameState } from '../types/eventTypes';
import * as fs from 'fs';
import * as path from 'path';

export interface SaveData {
  id: string;
  name: string;
  timestamp: number;
  gameData: GameState;
  metadata: SaveMetadata;
}

export interface SaveMetadata {
  playerAge: number;
  playerName: string;
  eventCount: number;
  playTime: number; // 游戏时长（秒）
}

// 检测是否在浏览器环境
const isBrowser = typeof window !== 'undefined' && window.localStorage;

// 简单的文件系统存储（用于 Node.js 环境）
class FileStorage {
  private savesDir: string;
  
  constructor() {
    this.savesDir = path.join(process.cwd(), '.wuxia_saves');
    if (!fs.existsSync(this.savesDir)) {
      fs.mkdirSync(this.savesDir, { recursive: true });
    }
  }
  
  getItem(key: string): string | null {
    const filePath = path.join(this.savesDir, `${key}.json`);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
    return null;
  }
  
  setItem(key: string, value: string): void {
    const filePath = path.join(this.savesDir, `${key}.json`);
    fs.writeFileSync(filePath, value, 'utf-8');
  }
  
  removeItem(key: string): void {
    const filePath = path.join(this.savesDir, `${key}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

const fileStorage = new FileStorage();

export class SaveManager {
  private static instance: SaveManager;
  private readonly STORAGE_KEY = 'wuxia_life_saves';
  private readonly AUTO_SAVE_KEY = 'wuxia_life_auto_save';
  private readonly MAX_SAVES = 10; // 最多保存 10 个存档
  
  private constructor() {}
  
  public static getInstance(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager();
    }
    return SaveManager.instance;
  }
  
  /**
   * 保存游戏
   */
  public saveGame(gameState: GameState, name: string = '自动存档'): string {
    const saveData: SaveData = {
      id: this.generateSaveId(),
      name,
      timestamp: Date.now(),
      gameData: gameState,
      metadata: {
        playerAge: gameState.player?.age || 0,
        playerName: gameState.player?.name || '未知',
        eventCount: gameState.player?.events?.length || 0,
        playTime: this.calculatePlayTime(gameState),
      },
    };
    
    // 获取现有存档
    const saves = this.getAllSaves();
    
    // 添加新存档
    saves.unshift(saveData);
    
    // 限制存档数量
    if (saves.length > this.MAX_SAVES) {
      saves.pop();
    }
    
    // 保存到存储
    const storage = isBrowser ? localStorage : fileStorage;
    storage.setItem(this.STORAGE_KEY, JSON.stringify(saves));
    
    console.log(`[SaveManager] 游戏已保存：${name} (ID: ${saveData.id})`);
    
    return saveData.id;
  }
  
  /**
   * 加载游戏
   */
  public loadGame(saveId: string): SaveData | null {
    const saves = this.getAllSaves();
    const save = saves.find(s => s.id === saveId);
    
    if (save) {
      console.log(`[SaveManager] 游戏已加载：${save.name}`);
      return save;
    }
    
    console.warn(`[SaveManager] 未找到存档：${saveId}`);
    return null;
  }
  
  /**
   * 获取所有存档
   */
  public getAllSaves(): SaveData[] {
    try {
      const storage = isBrowser ? localStorage : fileStorage;
      const savesJson = storage.getItem(this.STORAGE_KEY);
      if (!savesJson) return [];
      
      const saves: SaveData[] = JSON.parse(savesJson);
      return saves.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('[SaveManager] 读取存档失败:', error);
      return [];
    }
  }
  
  /**
   * 删除存档
   */
  public deleteSave(saveId: string): boolean {
    const saves = this.getAllSaves();
    const filteredSaves = saves.filter(s => s.id !== saveId);
    
    if (filteredSaves.length !== saves.length) {
      const storage = isBrowser ? localStorage : fileStorage;
      storage.setItem(this.STORAGE_KEY, JSON.stringify(filteredSaves));
      console.log(`[SaveManager] 存档已删除：${saveId}`);
      return true;
    }
    
    return false;
  }
  
  /**
   * 自动保存
   */
  public autoSave(gameState: GameState): void {
    const saveData: SaveData = {
      id: this.generateSaveId(),
      name: '自动存档',
      timestamp: Date.now(),
      gameData: gameState,
      metadata: {
        playerAge: gameState.player?.age || 0,
        playerName: gameState.player?.name || '未知',
        eventCount: gameState.player?.events?.length || 0,
        playTime: this.calculatePlayTime(gameState),
      },
    };
    
    try {
      const storage = isBrowser ? localStorage : fileStorage;
      storage.setItem(this.AUTO_SAVE_KEY, JSON.stringify(saveData));
      console.log('[SaveManager] 自动保存完成');
    } catch (error) {
      console.error('[SaveManager] 自动保存失败:', error);
    }
  }
  
  /**
   * 加载自动存档
   */
  public loadAutoSave(): SaveData | null {
    try {
      const storage = isBrowser ? localStorage : fileStorage;
      const autoSaveJson = storage.getItem(this.AUTO_SAVE_KEY);
      if (!autoSaveJson) return null;
      
      const saveData: SaveData = JSON.parse(autoSaveJson);
      console.log('[SaveManager] 自动存档已加载');
      return saveData;
    } catch (error) {
      console.error('[SaveManager] 加载自动存档失败:', error);
      return null;
    }
  }
  
  /**
   * 清除自动存档
   */
  public clearAutoSave(): void {
    const storage = isBrowser ? localStorage : fileStorage;
    storage.removeItem(this.AUTO_SAVE_KEY);
    console.log('[SaveManager] 自动存档已清除');
  }
  
  /**
   * 导出存档
   */
  public exportSave(saveId: string): string | null {
    const save = this.loadGame(saveId);
    if (!save) return null;
    
    const exportData = {
      version: '1.0',
      exportTime: Date.now(),
      save: save,
    };
    
    return JSON.stringify(exportData, null, 2);
  }
  
  /**
   * 导入存档
   */
  public importSave(exportDataStr: string): boolean {
    try {
      const exportData = JSON.parse(exportDataStr);
      
      if (!exportData.version || !exportData.save) {
        throw new Error('无效的存档格式');
      }
      
      const save: SaveData = exportData.save;
      save.id = this.generateSaveId();
      save.timestamp = Date.now();
      
      const saves = this.getAllSaves();
      saves.unshift(save);
      
      if (saves.length > this.MAX_SAVES) {
        saves.pop();
      }
      
      const storage = isBrowser ? localStorage : fileStorage;
      storage.setItem(this.STORAGE_KEY, JSON.stringify(saves));
      console.log('[SaveManager] 存档已导入');
      
      return true;
    } catch (error) {
      console.error('[SaveManager] 导入存档失败:', error);
      return false;
    }
  }
  
  /**
   * 清空所有存档
   */
  public clearAllSaves(): void {
    const storage = isBrowser ? localStorage : fileStorage;
    storage.removeItem(this.STORAGE_KEY);
    storage.removeItem(this.AUTO_SAVE_KEY);
    console.log('[SaveManager] 所有存档已清空');
  }
  
  /**
   * 计算游戏时长
   */
  private calculatePlayTime(gameState: GameState): number {
    // 简单实现：根据事件数量估算
    // 每个事件约 30 秒
    const eventCount = gameState.player?.events?.length || 0;
    return eventCount * 30;
  }
  
  /**
   * 生成存档 ID
   */
  private generateSaveId(): string {
    return `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * 格式化游戏时长
   */
  public formatPlayTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}小时${minutes % 60}分钟`;
    }
    if (minutes > 0) {
      return `${minutes}分钟`;
    }
    return `${seconds}秒`;
  }
}

// 导出单例
export const saveManager = SaveManager.getInstance();
