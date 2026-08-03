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

assert(!source.includes('story-text-clamped'), 'event body must not use the fixed three-line clamp');
assert(
  source.includes('v-if="periodSummaryDisplay"'),
  'period summary must remain conditionally visible',
);
assert(
  source.includes('v-if="activeActionSummaryDisplay"'),
  'active action summary must remain conditionally visible',
);
assert(
  source.includes('v-if="disturbanceNarrativeDisplay"'),
  'disturbance narrative must remain conditionally visible',
);
assert(!source.includes('false && periodSummaryDisplay'), 'period summary must not be hard-disabled');
assert(!source.includes('false && activeActionSummaryDisplay'), 'active action summary must not be hard-disabled');
assert(!source.includes('false && disturbanceNarrativeDisplay'), 'disturbance narrative must not be hard-disabled');
assert(!source.includes('setTimeout(() => {\n    progressionTimer'), 'progression must not use the old auto-continue timer');
assert(!source.includes('progressionFeedbackToast'), 'progression result must not be duplicated in a toast');
assert(source.includes('@click="continueToNext"'), 'progression must have an explicit continue action');
assert(
  source.includes('const showContinueButton = computed') &&
    source.includes('return props.apiNeedsProgressionAck === true;'),
  'continue button visibility must be driven by the existing progression phase state',
);
assert(
  source.includes('v-if="!hasCanonicalProgressionCard"') &&
    source.includes('let continueClickLocked = false') &&
    source.includes('if (continueClickLocked || props.isAutoPlaying) return;'),
  'local continuation must suppress duplicate clicks and duplicate base result text',
);
const ackHandlerStart = apiEngineSource.indexOf('async function handleProgressionAck');
const ackHandler = apiEngineSource.slice(ackHandlerStart);
assert(
  ackHandler.includes('|| isProcessing.value) return;') &&
    ackHandler.includes('apiClient.acknowledgeProgression'),
  'API progression acknowledgement must remain guarded by the existing processing lock',
);
assert(
  source.includes('activeActionSummaryDisplay.appliedDeltaSummary') &&
    source.includes('activeActionLongTermImpacts') &&
    source.includes('activeActionSummaryDisplay.nextStepHint'),
  'active action summary must expose applied changes, long-term impact, and next step',
);
assert(
  source.includes('disturbanceNarrativeDisplay.sourceActionName') &&
    source.includes('disturbanceNarrativeDisplay.impactSummary'),
  'disturbance narrative must expose source action and impact summary',
);
assert(
  source.includes('periodSummaryDisplay.statDeltaSummary') &&
    source.includes('本期已落幕，点击继续见证下一季成长。'),
  'period summary must expose stat delta and continue hint',
);

console.log('gameScreenPresentationTests: ok');
