/**
 * Canonical browser persistence boundary.
 *
 * Browser and headless saves persist the canonical current Snapshot shape.
 * Legacy raw GameState/P2 saves and non-current snapshot versions are rejected;
 * no migration or compatibility read is provided.
 */

import type { GameStateSnapshot } from '../contracts/gameStateSnapshot';
import { GAME_STATE_SNAPSHOT_SCHEMA_VERSION } from '../contracts/gameStateSnapshot';
import type { GameState } from '../types/eventTypes';
import { defaultSnapshotConverter } from '../headless/snapshot/SnapshotConverter';
import { assertCanonicalSaveData, assertCanonicalSaveExport, CanonicalValidationError } from '../contracts/validation/canonicalGameStateValidation';

const isBrowser = typeof window !== 'undefined' && !!window.localStorage;

class MemoryStorage {
  private readonly map = new Map<string, string>();
  getItem(key: string): string | null { return this.map.get(key) ?? null; }
  setItem(key: string, value: string): void { this.map.set(key, value); }
  removeItem(key: string): void { this.map.delete(key); }
}

const memoryStorage = new MemoryStorage();

export interface SaveData {
  id: string;
  name: string;
  timestamp: number;
  snapshot: GameStateSnapshot;
  metadata: SaveMetadata;
}

export interface SaveMetadata {
  playerAge: number;
  playerName: string;
  eventCount: number;
  playTime: number;
}

function storage(): Storage | MemoryStorage {
  return isBrowser ? localStorage : memoryStorage;
}

function sourcePlatform(): 'web-browser' | 'node-headless' {
  return isBrowser ? 'web-browser' : 'node-headless';
}

function createSaveData(gameState: GameState, id: string, name: string): SaveData {
  const snapshot = defaultSnapshotConverter.toSnapshot(gameState, {
    eventCatalogVersion: '1.0.0',
    sourcePlatform: sourcePlatform(),
    time: { now: () => Date.now() },
  });
  return {
    id,
    name,
    timestamp: Date.now(),
    snapshot,
    metadata: {
      playerAge: snapshot.state.player.age,
      playerName: snapshot.state.player.name,
      eventCount: snapshot.state.eventHistory.length,
      playTime: snapshot.state.eventHistory.length * 30,
    },
  };
}

function parseSaveData(value: unknown): SaveData | null {
  try {
    assertCanonicalSaveData(value);
    defaultSnapshotConverter.fromSnapshot(value.snapshot);
    return value as SaveData;
  } catch (error) {
    if (!(error instanceof CanonicalValidationError)) return null;
    return null;
  }
}

export class SaveManager {
  private static instance: SaveManager;
  private readonly STORAGE_KEY = 'wuxia_life_saves';
  private readonly AUTO_SAVE_KEY = 'wuxia_life_auto_save';
  private readonly MAX_SAVES = 10;

  private constructor() {}

  public static getInstance(): SaveManager {
    if (!SaveManager.instance) SaveManager.instance = new SaveManager();
    return SaveManager.instance;
  }

  public saveGame(gameState: GameState, name = '自动存档'): string {
    const saveData = createSaveData(gameState, this.generateSaveId(), name);
    const saves = this.getAllSaves();
    saves.unshift(saveData);
    storage().setItem(this.STORAGE_KEY, JSON.stringify(saves.slice(0, this.MAX_SAVES)));
    return saveData.id;
  }

  public loadGame(saveId: string): SaveData | null {
    const save = this.getAllSaves().find(item => item.id === saveId);
    if (!save) return null;
    return parseSaveData(save);
  }

  public getAllSaves(): SaveData[] {
    try {
      const raw = storage().getItem(this.STORAGE_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map(parseSaveData).filter((save): save is SaveData => save !== null).sort((a, b) => b.timestamp - a.timestamp);
    } catch {
      return [];
    }
  }

  public deleteSave(saveId: string): boolean {
    const saves = this.getAllSaves();
    const filtered = saves.filter(save => save.id !== saveId);
    if (filtered.length === saves.length) return false;
    storage().setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    return true;
  }

  public autoSave(gameState: GameState): void {
    const saveData = createSaveData(gameState, this.generateSaveId(), '自动存档');
    storage().setItem(this.AUTO_SAVE_KEY, JSON.stringify(saveData));
  }

  public loadAutoSave(): SaveData | null {
    try {
      const raw = storage().getItem(this.AUTO_SAVE_KEY);
      return raw ? parseSaveData(JSON.parse(raw)) : null;
    } catch {
      return null;
    }
  }

  public clearAutoSave(): void { storage().removeItem(this.AUTO_SAVE_KEY); }

  public exportSave(saveId: string): string | null {
    const save = this.loadGame(saveId);
    if (!save) return null;
    return JSON.stringify({ version: GAME_STATE_SNAPSHOT_SCHEMA_VERSION, exportTime: Date.now(), save }, null, 2);
  }

  public importSave(exportDataStr: string): boolean {
    try {
      const exported: unknown = JSON.parse(exportDataStr);
      assertCanonicalSaveExport(exported);
      const parsed = parseSaveData(exported.save);
      if (!parsed) return false;
      const save = { ...parsed, id: this.generateSaveId(), timestamp: Date.now() };
      const saves = this.getAllSaves();
      saves.unshift(save);
      storage().setItem(this.STORAGE_KEY, JSON.stringify(saves.slice(0, this.MAX_SAVES)));
      return true;
    } catch {
      return false;
    }
  }

  public clearAllSaves(): void {
    storage().removeItem(this.STORAGE_KEY);
    storage().removeItem(this.AUTO_SAVE_KEY);
  }

  public formatPlayTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}小时${minutes % 60}分钟`;
    if (minutes > 0) return `${minutes}分钟`;
    return `${seconds}秒`;
  }

  private generateSaveId(): string {
    return `save_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

export const saveManager = SaveManager.getInstance();
