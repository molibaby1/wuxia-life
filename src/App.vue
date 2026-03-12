<script setup lang="ts">
import { computed } from 'vue';
import StartScreen from './components/StartScreen.vue';
import GameScreen from './components/GameScreen.vue';
import EndingScreen from './components/EndingScreen.vue';
import { useGameEngine } from './composables/useGameEngine';
import { useGameStore } from './store/gameStore';

const engine = useGameEngine();
const store = useGameStore();

const gamePhase = computed(() => {
  if (!store.state.gameStarted) return 'start';
  if (!store.state.player?.alive) return 'ending';
  return 'playing';
});

const handleStart = (name: string, gender: 'male' | 'female') => {
  engine.startNewGame(name, gender);
};

const handleChoice = (choice: any) => {
  engine.makeChoice(choice);
};

const handleRestart = () => {
  engine.restartGame();
};
</script>

<template>
  <div id="app">
    <StartScreen v-if="gamePhase === 'start'" @start="handleStart" />
    <GameScreen 
      v-else-if="gamePhase === 'playing'"
      :current-node="engine.engineState.currentNode"
      :available-choices="engine.engineState.availableChoices"
      :is-auto-playing="engine.engineState.isAutoPlaying"
      @choice="handleChoice"
    />
    <EndingScreen v-else @restart="handleRestart" />
  </div>
</template>

<style>
html, body, #app {
  margin: 0;
  padding: 0;
  height: 100%;
}
</style>
