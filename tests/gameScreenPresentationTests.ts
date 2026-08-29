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
const localEngineSource = readFileSync(
  resolve(process.cwd(), 'src/composables/useNewGameEngine.ts'),
  'utf8',
);
const appSource = readFileSync(resolve(process.cwd(), 'src/App.vue'), 'utf8');
const apiRestoreStart = apiEngineSource.indexOf('async function continueSlot');
const apiRestoreEnd = apiEngineSource.indexOf('async function handleChoice');
const apiRestoreHandler = apiEngineSource.slice(apiRestoreStart, apiRestoreEnd);
const localAutoStart = localEngineSource.indexOf('const processAutoEvent = async');
const localAutoEnd = localEngineSource.indexOf('const evaluateOutcomeCondition');
const localAutoHandler = localEngineSource.slice(localAutoStart, localAutoEnd);

assert(!source.includes('story-text-clamped'), 'event body must not use the fixed three-line clamp');
assert(
  source.includes('v-if="disturbanceNarrativeDisplay"'),
  'disturbance narrative must remain conditionally visible',
);
assert(!source.includes('false && disturbanceNarrativeDisplay'), 'disturbance narrative must not be hard-disabled');
assert(!source.includes('setTimeout(() => {\n    progressionTimer'), 'progression must not use the old auto-continue timer');
assert(!source.includes('progressionFeedbackToast'), 'progression result must not be duplicated in a toast');
assert(
  !localAutoHandler.includes('getNextEvent();'),
  'a genuine automatic story must remain as the next visible stage until the player continues',
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
  'local continuation must suppress duplicate clicks and duplicate base result text',
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
assert(source.includes('buildLifeMemoryFeedbackOverlayCard'), 'Life Memory unlocks must join the progression echo');
assert(!source.includes('life-memory-feedback-backdrop'), 'Life Memory unlocks must not block the next stage with a modal');
assert(!source.includes('aria-modal="true"'), 'Life Memory unlocks must not be modal');
assert(!source.includes('知道了'), 'Life Memory unlocks must not require confirmation');
assert(
  localEngineSource.includes('engineState.progressionOverlay') &&
    localEngineSource.includes('buildChoiceFeedbackOverlayCard'),
  'Local settlement must retain its result as a progression echo',
);
const localChoiceStart = localEngineSource.indexOf('const handleChoice = async');
const localChoiceEnd = localEngineSource.indexOf('const handleActiveAction = async');
const localChoiceHandler = localEngineSource.slice(localChoiceStart, localChoiceEnd);
assert(
  localChoiceHandler.includes('getNextEvent();'),
  'Local choice must enter the next stage inside the original click',
);
assert(
  localChoiceHandler.includes("context?.source !== 'autoResolve'"),
  'automatic story resolution must remain a visible stage instead of recursively skipping ahead',
);
const localActionStart = localEngineSource.indexOf('const handleActiveAction = async');
const localActionEnd = localEngineSource.indexOf('const pickAutoChoice');
const localActionHandler = localEngineSource.slice(localActionStart, localActionEnd);
assert(
  localActionHandler.includes('continueProgressionFlow();'),
  'Local active action must skip its standalone summary inside the original click',
);
const localContinueStart = localEngineSource.indexOf('const continueProgressionFlow =');
const localContinueEnd = localEngineSource.indexOf('/**\n   * 开始新游戏');
const localContinueHandler = localEngineSource.slice(localContinueStart, localContinueEnd);
assert(
  localContinueHandler.includes('buildPeriodSummaryOverlayCard') &&
    localContinueHandler.includes('getNextEvent();'),
  'one click on a single-path stage must settle it and enter the next stage atomically',
);
assert(
  source.includes('suppressNextLifeMemoryFeedback'),
  'loading a save must establish a fresh feedback baseline',
);
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
