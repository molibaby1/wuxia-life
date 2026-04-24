import { reactive, computed } from 'vue';
import type { PlayerState, StoryNode, DeathEnding } from '../types';
import { advanceTime } from '../utils/timeSystem';

function createInitialState(name: string, gender: 'male' | 'female'): PlayerState {
  return {
    age: 0,
    gender,
    name,
    sect: null,
    
    martialPower: 0,
    externalSkill: 0,
    internalSkill: 0,
    qinggong: 0,
    
    chivalry: 0,
    constitution: 0,
    comprehension: 0,
    reputation: 0,
    knowledge: 0,
    charisma: 0,
    businessAcumen: 0,
    influence: 0,
    martialHeritage: 0,
    scholarlyHeritage: 0,
    merchantNetwork: 0,
    connections: 0,
    money: 0,
    
    flags: {},
    events: [],
    wealth: 0,
    children: 0,
    spouse: null,
    
    alive: true,
    deathReason: undefined,
    title: null,
    
    timeUnit: 'year',
    monthProgress: 0,
    dayProgress: 1,
  };
}

const state = reactive<{
  player: PlayerState | null;
  gameStarted: boolean;
  history: string[];
}>({
  player: null,
  gameStarted: false,
  history: [],
});

export function useGameStore() {
  const startGame = (name: string, gender: 'male' | 'female') => {
    state.player = createInitialState(name, gender);
    state.gameStarted = true;
    state.history = [];
  };

  const updatePlayer = (updates: Partial<PlayerState> & { timeSpan?: { value: number; unit: 'year' | 'month' | 'day' } }) => {
    if (!state.player) return;
    
    if (!state.player.alive) {
      return;
    }
    
    const { alive, deathReason, title, flags, events, timeSpan, ...safeUpdates } = updates;
    
    // 处理时间跨度
    if (timeSpan) {
      const timeUpdates = advanceTime(state.player, timeSpan.value, timeSpan.unit);
      Object.assign(state.player, timeUpdates);
    }
    
    Object.assign(state.player, safeUpdates);
    
    if (alive !== undefined) {
      state.player.alive = alive;
    }
    if (deathReason !== undefined) {
      state.player.deathReason = deathReason;
    }
    if (title !== undefined) {
      state.player.title = title;
    }
    
    if (flags !== undefined) {
      state.player.flags = {
        ...(state.player.flags || {}),
        ...(flags as Record<string, any>),
      };
    }
    if (events !== undefined) {
      state.player.events = [...(state.player.events || []), ...(events as any[])];
    }
  };

  const addHistory = (text: string) => {
    state.history.push(text);
  };

  const endGame = (reason: string, epitaph: string) => {
    if (!state.player) return;
    state.player.alive = false;
    state.player.deathReason = reason;
    state.player.title = epitaph;
  };

  const resetGame = () => {
    state.player = null;
    state.gameStarted = false;
    state.history = [];
  };

  return {
    state,
    startGame,
    updatePlayer,
    addHistory,
    endGame,
    resetGame,
  };
}
