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
assert(
  source.includes('v-if="marketStallObjective"') &&
    source.includes(
      'v-if="apiSessionPhase === \'active_planning\' && (marketStallObjective.canAttempt || marketStallObjective.canAbandon)"',
    ) &&
    source.includes('v-if="marketStallObjective.canAttempt"') &&
    source.includes('v-if="marketStallObjective.canAbandon"'),
  'accepted objective stays visible across phases while eligible actions require active planning',
);
const marketActionHandlerStart = apiEngineSource.indexOf('async function handleMarketStallAction');
const marketActionHandlerEnd = apiEngineSource.indexOf(
  'async function requestProgressionAck',
  marketActionHandlerStart,
);
const marketActionHandler = apiEngineSource.slice(marketActionHandlerStart, marketActionHandlerEnd);
const marketActionPhaseGuard = marketActionHandler.indexOf(
  "if (engineState.sessionPhase !== 'active_planning') return;",
);
const marketActionRequest = marketActionHandler.indexOf('apiClient.executeMarketStallAction');
assert(
  marketActionPhaseGuard >= 0 && marketActionPhaseGuard < marketActionRequest,
  'market stall handler must reject non-planning phases before sending its API mutation',
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
  !apiRestoreHandler.includes('requestProgressionAck('),
  'restoring a pending summary must preserve it until the player confirms',
);
const apiActionStart = apiEngineSource.indexOf('async function handleActiveAction');
const apiActionEnd = apiEngineSource.indexOf('async function handleProgressionAck');
const apiActionHandler = apiEngineSource.slice(apiActionStart, apiActionEnd);
assert(
  !apiActionHandler.includes("requestProgressionAck('action_summary')"),
  'API active action must leave its result pending for a separate player confirmation',
);
const progressionAckHandlerStart = apiEngineSource.indexOf('async function handleProgressionAck');
const progressionAckHandlerEnd = apiEngineSource.indexOf('async function saveCurrentGame');
const progressionAckHandler = apiEngineSource.slice(progressionAckHandlerStart, progressionAckHandlerEnd);
assert(
  progressionAckHandler.includes("requestProgressionAck('passive_continue')") &&
    !progressionAckHandler.includes("requestProgressionAck('period_summary')") &&
    progressionAckHandler.includes('engineState.progressionOverlay = { cards: resultCards }'),
  'passive progression may produce a pending period result but must not acknowledge it in the same click',
);
assert(
  appSource.includes("apiEngineState.sessionPhase === 'action_summary'") &&
    apiRestoreHandler.includes('buildActiveActionOverlayCard') &&
    source.includes('return props.apiNeedsProgressionAck === true;'),
  'action summary remains visible with the existing player continue control',
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
    !ackHandler.includes("requestProgressionAck('period_summary')"),
  'API passive progression must leave a generated period result pending for another click',
);
assert(
  source.includes('重试进入下一阶段'),
  'failed API auto-advance must offer retry instead of restoring the ordinary continue step',
);

assert(
  source.includes('v-if="scholarOfficialPursuit"') &&
    source.includes("projection?.status === 'none'") &&
    source.includes('scholarOfficialPursuit.status'),
  'a declined or absent invitation must not render as an accepted pursuit',
);
assert(
  source.includes('scholarOfficialPursuit.latestExam') &&
    source.includes('scholarOfficialPursuit.examAttempts') &&
    source.includes('scholarOfficialPursuit.nextExamEligibleAt'),
  'the pursuit card must show authoritative exam history and eligibility dates',
);
assert(
  source.includes("'waiting_for_exam_age'") &&
    source.includes("'waiting_for_knowledge'") &&
    source.includes("'exam_cooldown'") &&
    source.includes("'ready_to_take_exam'") &&
    source.includes("'qualified_waiting_appointment'") &&
    source.includes("'death_unfinished'") &&
    source.includes("'terminal_unfinished'") &&
    source.includes("'abandoned'") &&
    source.includes("'completed'") &&
    source.includes("'invalid'"),
  'every authoritative pursuit state must have an explicit player-facing explanation',
);
assert(
  source.includes('scholarOfficialPursuit.canTakeExam') &&
    source.includes('scholarOfficialPursuit.canAbandon') &&
    source.includes("apiSessionPhase === 'active_planning'") &&
    source.includes("emit('scholar-official-pursuit-action', 'take_exam')") &&
    source.includes("emit('scholar-official-pursuit-action', 'abandon')"),
  'exam and abandon buttons must use server permissions and the existing planning phase',
);
assert(
  source.includes('ScholarOfficialPursuitSessionView') &&
    !source.includes('p138_scholar_official_pursuit_ledger'),
  'the client must use the official read-only DTO without referring to the authoritative ledger',
);
assert(
  appSource.includes(':scholar-official-pursuit="activeSession?.scholarOfficialPursuit ?? null"') &&
    appSource.includes('@scholar-official-pursuit-action="apiHandleScholarOfficialPursuitAction"'),
  'App must pass the server projection and bind the API operation handler',
);
const scholarHandlerStart = apiEngineSource.indexOf('async function handleScholarOfficialPursuitAction');
const scholarHandlerEnd = apiEngineSource.indexOf('async function requestProgressionAck', scholarHandlerStart);
const scholarHandler = apiEngineSource.slice(scholarHandlerStart, scholarHandlerEnd);
assert(
  scholarHandler.includes("engineState.sessionPhase !== 'active_planning'") &&
    scholarHandler.includes('canTakeExam') &&
    scholarHandler.includes('canAbandon') &&
    scholarHandler.includes('apiClient.executeScholarOfficialPursuitAction') &&
    scholarHandler.includes('applyProgressionResponse(result)'),
  'the API handler must guard phase and server projection, then refresh from the returned progression',
);
assert(
  scholarHandler.includes('result.activeActionSummary?.actionName') &&
    scholarHandler.includes('buildScholarExamResultOverlayCard') &&
    !scholarHandler.includes('requestProgressionAck('),
  'exam feedback must use the safe server action name and official projection without auto-confirming it',
);
const scholarResultCardStart = apiEngineSource.indexOf('function buildScholarExamResultOverlayCard');
const scholarResultCardEnd = apiEngineSource.indexOf('function applyProgressionToEngine', scholarResultCardStart);
const scholarResultCard = apiEngineSource.slice(scholarResultCardStart, scholarResultCardEnd);
assert(
  scholarResultCard.includes('pursuit.latestExam') &&
    scholarResultCard.includes('pursuit.nextExamEligibleAt') &&
    !scholarResultCard.includes('resultExplanation?.trim()'),
  'exam feedback must be rebuilt from authoritative exam facts instead of leaking internal action-summary details',
);
assert(
  /<p\s+v-if="scholarOfficialPursuit\.status === 'invalid'"\s+class="event-kicker"\s*>\s*求仕记录异常\s*<\/p>\s*<p\s+v-else\s+class="event-kicker">我接受的追求<\/p>/.test(source),
  'an invalid pursuit projection must use neutral wording instead of claiming the player accepted the pursuit',
);
assert(
  /<ul\s+v-if="scholarOfficialPursuit\.status !== 'invalid'"\s+class="accepted-objective-facts"\s*>[\s\S]*?接受日期：/.test(source),
  'acceptance date and pursuit facts must only appear when the official projection confirms a valid pursuit',
);
assert(
  source.includes("v-if=\"apiSessionPhase === 'active_planning' && scholarOfficialPursuit.status === 'active'") &&
    source.includes("v-if=\"scholarOfficialPursuit.status === 'invalid'\""),
  'an invalid pursuit projection must remain non-actionable',
);
assert(
  apiEngineSource.includes("response.activeActionSummary.actionName === '赴考应试'") &&
    apiEngineSource.includes('scholar-exam-restored-'),
  'restored exam results must retain the safe presentation through explicit confirmation',
);
const scholarProjectionBinding = ':scholar-official-pursuit="activeSession?.scholarOfficialPursuit ?? null"';
assert(
  appSource.split(scholarProjectionBinding).length - 1 >= 2,
  'the same authoritative projection must remain available to the terminal view',
);
const endingSource = readFileSync(resolve(process.cwd(), 'src/components/EndingScreen.vue'), 'utf8');
assert(
  endingSource.includes('scholarOfficialPursuit') &&
    endingSource.includes("pursuit.status !== 'none'") &&
    endingSource.includes("case 'completed'") &&
    endingSource.includes("case 'abandoned'") &&
    !endingSource.includes('canTakeExam') &&
    !endingSource.includes('take_exam'),
  'terminal review must preserve scholar pursuit history without exposing actions',
);

console.log('gameScreenPresentationTests: ok');
