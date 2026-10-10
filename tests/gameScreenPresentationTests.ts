import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const gameScreenPath = resolve(process.cwd(), 'src/components/GameScreen.vue');
const source = readFileSync(gameScreenPath, 'utf8');
const apiEngineSource = readFileSync(
  resolve(process.cwd(), 'src/composables/useApiGameEngine.ts'),
  'utf8',
);
const appSource = readFileSync(resolve(process.cwd(), 'src/App.vue'), 'utf8');
const apiRestoreStart = apiEngineSource.indexOf('async function continueSlot');
const apiRestoreEnd = apiEngineSource.indexOf('async function handleChoice');
const apiRestoreHandler = apiEngineSource.slice(apiRestoreStart, apiRestoreEnd);

assert(!source.includes('story-text-clamped'), 'event body must not use the fixed three-line clamp');
assert(
  source.includes('v-if="disturbanceNarrativeDisplay"'),
  'disturbance narrative must remain conditionally visible',
);
assert(!source.includes('false && disturbanceNarrativeDisplay'), 'disturbance narrative must not be hard-disabled');
assert(!source.includes('setTimeout(() => {\n    progressionTimer'), 'progression must not use the old auto-continue timer');
assert(!source.includes('progressionFeedbackToast'), 'progression result must not be duplicated in a toast');
assert(
  apiEngineSource.includes("engineState.currentEvent?.isAutomatic === true") &&
    appSource.includes('apiNeedsProgressionAck'),
  'a genuine automatic API story must remain as the visible stage until the player continues',
);
assert(source.includes('@click="continueToNext"'), 'progression must have an explicit continue action');
assert(
  source.includes('const showContinueButton = computed') &&
    source.includes('return props.apiNeedsProgressionAck === true;'),
  'continue button visibility must be driven by the existing progression phase state',
);
assert(
  source.includes('v-if="!hasCanonicalProgressionCard"') &&
    source.includes('let continueClickLocked = false;') &&
    source.includes('if (continueClickLocked || props.isAutoPlaying) return;'),
  'API continuation must suppress duplicate clicks and duplicate base result text',
);
const ackHandlerStart = apiEngineSource.indexOf('async function handleProgressionAck');
const ackHandler = apiEngineSource.slice(ackHandlerStart);
assert(
  ackHandler.includes('|| isProcessing.value) return;') &&
    ackHandler.includes('requestProgressionAck'),
  'API progression acknowledgement must remain guarded by the existing processing lock',
);
const echoIndex = source.indexOf('class="progression-echo card"');
const storyIndex = source.indexOf('class="story-card card"');
assert(echoIndex >= 0 && echoIndex < storyIndex, 'mobile DOM order must place the latest echo above the next stage');
assert(source.includes('aria-live="polite"'), 'progression echo must announce updates without stealing focus');
assert(source.includes('上一阶段结果'), 'the result panel must use plain player-facing language');
assert(!source.includes('上一阶段回响'), 'the result panel must not use unexplained echo terminology');
assert(source.includes('@media (min-width: 768px)'), 'desktop layout must have an explicit split breakpoint');
assert(source.includes('grid-template-columns: minmax(0, 1fr) minmax(260px, 0.42fr)'), 'desktop must split current decision and latest echo');
assert(source.includes('max-height: 110px'), 'mobile echo content must remain compact');
assert(
  source.includes('disturbanceNarrativeDisplay.sourceActionName') &&
    source.includes('disturbanceNarrativeDisplay.impactSummary'),
  'disturbance narrative must expose source action and impact summary',
);
assert(!source.includes('v-if="periodSummaryDisplay"'), 'period summary must not become a second player-operated screen');
assert(source.includes('collectNewLifeMemoryFeedback'), 'GameScreen must diff Life Memory feedback');
assert(source.includes('buildLifeMemoryFeedbackOverlayCards'), 'Life Memory unlocks must join the progression echo');
assert(!source.includes('life-memory-feedback-backdrop'), 'Life Memory unlocks must not block the next stage with a modal');
assert(!source.includes('aria-modal="true"'), 'Life Memory unlocks must not be modal');
assert(!source.includes('知道了'), 'Life Memory unlocks must not require confirmation');
assert(
  !appSource.includes("id: 'action_or_choice_result'"),
  'ordinary choice/action results must not route to a standalone result node',
);
assert(
  !appSource.includes("id: 'period_summary'"),
  'single-path settlement must not route to a standalone result node',
);
assert(
  apiRestoreHandler.includes("requestProgressionAck('period_summary')") &&
    apiRestoreHandler.includes("requestProgressionAck('action_summary')"),
  'restoring an internal summary state must consume it inside the load action',
);
const apiActionStart = apiEngineSource.indexOf('async function handleActiveAction');
const apiActionEnd = apiEngineSource.indexOf('async function handleProgressionAck');
const apiActionHandler = apiEngineSource.slice(apiActionStart, apiActionEnd);
assert(
  apiActionHandler.includes("requestProgressionAck('action_summary')"),
  'API active action must acknowledge its summary inside the original click',
);
assert(
  appSource.includes("from './composables/useApiGameEngine'") &&
    !appSource.includes('useNewGameEngine') &&
    !appSource.includes('isApiModeEnabled') &&
    !appSource.includes('apiMode') &&
    !appSource.includes("from './components/StartScreen.vue'"),
  'the production player entry must have one API path and no Local mode selector',
);
assert(
  source.includes("from '../composables/useApiGameEngine'") === false &&
    !source.includes('useNewGameEngine') &&
    !source.includes('GameEngineIntegration') &&
    !source.includes('loadLatestSave'),
  'GameScreen must remain a presentation component without a browser Local runtime or save path',
);
assert(
  apiEngineSource.includes("flowState.value = 'configuration_error'") &&
    apiEngineSource.includes('VITE_P6B_API_URL'),
  'missing API configuration must produce an explicit failure state',
);
assert(
  apiEngineSource.includes('async function bootstrap()') &&
    apiEngineSource.includes('catch (error) {\n      mapApiError(error);\n    }'),
  'API bootstrap failures must be surfaced instead of leaving the UI loading or falling back',
);
assert(
  appSource.includes('role="alert"') && appSource.includes('flowMessage'),
  'API failures during active play must be visible to the player',
);
assert(
  apiEngineSource.includes('automaticAdvanceError'),
  'failed API auto-advance must expose an explicit retry state',
);
assert(
  ackHandler.includes("requestProgressionAck('passive_continue')") &&
    ackHandler.includes("requestProgressionAck('period_summary')"),
  'API single-path progression must consume its internal result state inside the same click',
);
assert(
  source.includes('重试进入下一阶段'),
  'failed API auto-advance must offer retry instead of restoring the ordinary continue step',
);

console.log('gameScreenPresentationTests: ok');
