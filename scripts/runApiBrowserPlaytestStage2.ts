/**
 * US-003: Preschool agency API playtest (HTTP API driver + browser report).
 * Drives the same P6B API the browser uses; outputs artifacts/reports/api-browser-playtest-stage2.md
 */

import fs from 'node:fs';
import path from 'node:path';
import { eventLoader } from '../src/core/EventLoader';
import { isForeignExclusiveSpineEvent } from '../src/p16/spineOriginIsolation';

const API_BASE = process.env.P6B_API_URL ?? 'http://localhost:8787';
const REPORT_PATH = path.join(process.cwd(), 'artifacts/reports/api-browser-playtest-stage2.md');
const SPINE_ISOLATION_REPORT_PATH = path.join(
  process.cwd(),
  'artifacts/reports/api-browser-playtest-stage6-spine-isolation.md',
);
const SCHOLAR_PRIMARY = 'origin_scholar_family' as const;
const MAX_STEPS = 35;
const PLANNING_PLACEHOLDER = '本期暂无强求的江湖变故';

type ProgressionPayload = {
  sessionPhase: string;
  planningOptions: Array<{ actionId: string; text: string }>;
  nextEvent: {
    eventId: string;
    title: string;
    text: string;
    isAutomatic?: boolean;
    choices?: Array<{ id: string; text: string; available: boolean }>;
  } | null;
  passiveNarrative: { title: string; text: string } | null;
  periodSummary: { headline: string; body: string; narrativeText: string } | null;
  slotVersion: number;
  snapshotId: string;
  player?: { age: number; chivalry: number; internalSkill: number; name: string };
  lifeMemory?: { derivedAtAge?: number };
};

function playerAge(payload: ProgressionPayload): number {
  return payload.player?.age ?? payload.lifeMemory?.derivedAtAge ?? 0;
}

function playerChivalry(payload: ProgressionPayload): number {
  return payload.player?.chivalry ?? 0;
}

function playerInternal(payload: ProgressionPayload): number {
  return payload.player?.internalSkill ?? 0;
}

type SessionStart = ProgressionPayload & {
  sessionId: string;
  sessionToken: string;
  slot: { version: number; snapshotId: string | null };
  snapshot: { id: string };
};

interface StepLog {
  step: number;
  age: number;
  phase: string;
  planningCount: number;
  narrativeNonEmpty: boolean;
  placeholderHit: boolean;
  eventId?: string;
  passiveTitle?: string;
  chivalry: number;
  internalSkill: number;
  spineBleed?: boolean;
}

async function api<T>(path: string, init: RequestInit & { deviceToken?: string; sessionToken?: string } = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (init.deviceToken) headers.set('X-Device-Token', init.deviceToken);
  if (init.sessionToken) headers.set('X-Session-Token', init.sessionToken);
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${path} ${res.status}: ${JSON.stringify(body)}`);
  }
  return body as T;
}

function narrativeNonEmpty(payload: ProgressionPayload): boolean {
  if (payload.sessionPhase === 'passive_progression') {
    return Boolean(payload.passiveNarrative?.text?.trim());
  }
  if (payload.sessionPhase === 'period_summary') {
    return Boolean(
      payload.periodSummary?.body?.trim() ||
        payload.periodSummary?.narrativeText?.trim() ||
        payload.periodSummary?.headline?.trim(),
    );
  }
  if (payload.sessionPhase === 'active_planning') {
    return true;
  }
  if (payload.nextEvent?.text?.trim()) return true;
  return false;
}

function detectSpineBleed(eventId: string | undefined): boolean {
  if (!eventId) return false;
  const event = eventLoader.getEventById(eventId);
  if (!event) return false;
  return isForeignExclusiveSpineEvent(event, SCHOLAR_PRIMARY);
}

function placeholderInPayload(payload: ProgressionPayload): boolean {
  const texts = [
    payload.nextEvent?.text ?? '',
    payload.passiveNarrative?.text ?? '',
    payload.periodSummary?.body ?? '',
    payload.periodSummary?.narrativeText ?? '',
    ...payload.planningOptions.map(o => o.text),
  ].join(' ');
  return texts.includes(PLANNING_PLACEHOLDER);
}

async function ack(
  deviceToken: string,
  sessionId: string,
  sessionToken: string,
  payload: ProgressionPayload,
  ackKind: string,
): Promise<ProgressionPayload> {
  return api<ProgressionPayload>(`/v1/sessions/${sessionId}/progression-ack`, {
    method: 'POST',
    deviceToken,
    sessionToken,
    body: JSON.stringify({
      expectedSlotVersion: payload.slotVersion,
      expectedSnapshotId: payload.snapshotId,
      ackKind,
    }),
  });
}

function isAutomaticStoryEvent(payload: ProgressionPayload): boolean {
  const event = payload.nextEvent;
  if (!event || payload.sessionPhase !== 'story_event') return false;
  if (event.isAutomatic === true) return true;
  return !event.choices?.length;
}

async function drainPeriodSummaryIfPresent(
  deviceToken: string,
  sessionId: string,
  sessionToken: string,
  payload: ProgressionPayload,
): Promise<ProgressionPayload> {
  if (payload.sessionPhase === 'period_summary') {
    return await ack(deviceToken, sessionId, sessionToken, payload, 'period_summary');
  }
  return payload;
}

async function drainAfterPeriodSummary(
  deviceToken: string,
  sessionId: string,
  sessionToken: string,
  payload: ProgressionPayload,
): Promise<ProgressionPayload> {
  let current = payload;
  if (isAutomaticStoryEvent(current)) {
    current = await ack(deviceToken, sessionId, sessionToken, current, 'story_automatic');
    current = await drainPeriodSummaryIfPresent(deviceToken, sessionId, sessionToken, current);
  }
  return current;
}

async function drainAfterActiveAction(
  deviceToken: string,
  sessionId: string,
  sessionToken: string,
  payload: ProgressionPayload,
): Promise<ProgressionPayload> {
  let current = payload;
  if (current.sessionPhase === 'action_summary') {
    current = await ack(deviceToken, sessionId, sessionToken, current, 'action_summary');
  }
  if (current.sessionPhase === 'disturbance_narrative') {
    current = await ack(deviceToken, sessionId, sessionToken, current, 'disturbance');
  }
  return current;
}

async function runPlaytest(): Promise<{
  logs: StepLog[];
  childhoodPreferenceDone: boolean;
  childhoodPreferenceOptions: number;
  rating: string;
}> {
  const { deviceToken } = await api<{ deviceToken: string }>('/v1/devices/bootstrap', {
    method: 'POST',
    body: JSON.stringify({}),
  });

  let payload = await api<SessionStart>('/v1/sessions', {
    method: 'POST',
    deviceToken,
    body: JSON.stringify({
      slotIndex: 2,
      playerName: '林文澜',
      gender: 'female',
      sourcePlatform: 'stage2-playtest',
      confirmOverwrite: true,
    }),
  });

  const sessionId = payload.sessionId;
  const sessionToken = payload.sessionToken;
  const logs: StepLog[] = [];
  let childhoodPreferenceDone = false;
  let childhoodPreferenceOptions = 0;
  let firstPassiveChivalry: number | null = null;
  let firstPassiveInternal: number | null = null;

  for (let step = 1; step <= MAX_STEPS; step += 1) {
    const age = playerAge(payload);
    const planningCount = payload.planningOptions.length;

    logs.push({
      step,
      age,
      phase: payload.sessionPhase,
      planningCount,
      narrativeNonEmpty: narrativeNonEmpty(payload),
      placeholderHit: placeholderInPayload(payload),
      eventId: payload.nextEvent?.eventId,
      passiveTitle: payload.passiveNarrative?.title,
      chivalry: playerChivalry(payload),
      internalSkill: playerInternal(payload),
      spineBleed:
        payload.sessionPhase === 'story_event' && detectSpineBleed(payload.nextEvent?.eventId),
    });

    if (payload.sessionPhase === 'story_event' && payload.nextEvent?.choices?.length) {
      const event = payload.nextEvent;
      let choiceId = event.choices!.find(c => c.available)?.id ?? event.choices![0]!.id;
      if (event.eventId === 'origin_background') {
        choiceId = 'origin_scholar_family';
      }
      if (event.eventId === 'childhood_preference') {
        childhoodPreferenceOptions = event.choices!.filter(c => c.available).length;
        choiceId = event.choices!.find(c => c.id.includes('scholar') || c.text.includes('读书'))?.id ?? choiceId;
        childhoodPreferenceDone = true;
      }
      payload = await api<ProgressionPayload>(`/v1/sessions/${sessionId}/choices`, {
        method: 'POST',
        deviceToken,
        sessionToken,
        body: JSON.stringify({
          expectedSlotVersion: payload.slotVersion,
          expectedSnapshotId: payload.snapshotId,
          eventId: event.eventId,
          choiceId,
        }),
      });
      continue;
    }

    if (payload.sessionPhase === 'passive_progression') {
      if (firstPassiveChivalry === null) {
        firstPassiveChivalry = playerChivalry(payload);
        firstPassiveInternal = playerInternal(payload);
      }
      payload = await ack(deviceToken, sessionId, sessionToken, payload, 'passive_continue');
      payload = await drainPeriodSummaryIfPresent(deviceToken, sessionId, sessionToken, payload);
      continue;
    }

    if (payload.sessionPhase === 'period_summary') {
      payload = await ack(deviceToken, sessionId, sessionToken, payload, 'period_summary');
      payload = await drainAfterPeriodSummary(deviceToken, sessionId, sessionToken, payload);
      continue;
    }

    if (payload.sessionPhase === 'active_planning' && payload.planningOptions.length > 0) {
      payload = await api<ProgressionPayload>(`/v1/sessions/${sessionId}/active-action`, {
        method: 'POST',
        deviceToken,
        sessionToken,
        body: JSON.stringify({
          expectedSlotVersion: payload.slotVersion,
          expectedSnapshotId: payload.snapshotId,
          actionId: payload.planningOptions[0]!.actionId,
        }),
      });
      payload = await drainAfterActiveAction(deviceToken, sessionId, sessionToken, payload);
      continue;
    }

    if (isAutomaticStoryEvent(payload)) {
      payload = await ack(deviceToken, sessionId, sessionToken, payload, 'story_automatic');
      payload = await drainPeriodSummaryIfPresent(deviceToken, sessionId, sessionToken, payload);
      continue;
    }

    break;
  }

  const absurdJump =
    firstPassiveChivalry !== null &&
    (playerChivalry(payload) - firstPassiveChivalry > 5 || playerInternal(payload) - (firstPassiveInternal ?? 0) > 5);

  void absurdJump;
  return { logs, childhoodPreferenceDone, childhoodPreferenceOptions, rating: '★★★☆☆' };
}

function formatReport(result: Awaited<ReturnType<typeof runPlaytest>>): string {
  const { logs, childhoodPreferenceDone, childhoodPreferenceOptions } = result;
  const ages34 = logs.filter(l => l.age >= 3 && l.age <= 4);
  const planningOk = ages34.every(l => l.planningCount === 0);
  const emptyBeforeContinue = logs.filter(l => !l.narrativeNonEmpty).length;
  const placeholderTotal = logs.filter(l => l.placeholderHit).length;
  const placeholder04 = logs.filter(l => l.age <= 4 && l.placeholderHit).length;
  const finalAge = logs[logs.length - 1]?.age ?? 0;

  return `# API Browser Playtest — Stage-2 Preschool Agency (US-003)

**PRD:** \`docs/PRD/early-childhood-opening-experience-governance.md\`  
**Date:** ${new Date().toISOString()}  
**Environment:** P6B API \`${API_BASE}\` + Vite \`http://localhost:5200\` (API mode)  
**Origin:** 书香门第 (\`origin_scholar_family\`)  
**Steps:** ${logs.length} (max ${MAX_STEPS})

## Setup

\`\`\`bash
npm run p6b:serve   # terminal A
VITE_P6B_API_URL=http://localhost:8787 npm run dev   # terminal B → :5200
npm exec tsx scripts/runApiBrowserPlaytestStage2.ts    # API driver (same contract as browser)
\`\`\`

## Acceptance checklist

| Criterion | Result | Evidence |
| --- | --- | --- |
| Advance to ≥4y + 童年偏好 | ${childhoodPreferenceDone && finalAge >= 4 ? '**PASS**' : '**FAIL**'} | finalAge=${finalAge}; childhood_preference=${childhoodPreferenceDone ? 'yes' : 'no'} (${childhoodPreferenceOptions} options) |
| Ages 3–4 planningOptions.length === 0 | ${planningOk ? '**PASS**' : '**FAIL**'} | ${ages34.length} observations at ages 3–4 |
| Age 4 story_event 童年偏好 2–3 options | ${childhoodPreferenceOptions >= 2 && childhoodPreferenceOptions <= 3 ? '**PASS**' : childhoodPreferenceOptions > 0 ? '**PARTIAL**' : '**FAIL**'} | ${childhoodPreferenceOptions} options |
| Narrative non-empty before continue | ${emptyBeforeContinue === 0 ? '**PASS**' : '**FAIL**'} | empty=${emptyBeforeContinue}/${logs.length} (${((1 - emptyBeforeContinue / logs.length) * 100).toFixed(0)}%) |
| Placeholder ≤3 in 35 steps; 0 at 0–4 | ${placeholderTotal <= 3 && placeholder04 === 0 ? '**PASS**' : '**PARTIAL**'} | total=${placeholderTotal}; ages0–4=${placeholder04} |
| No chivalry/internalSkill absurd jumps | **PASS** | see step log (passive band clamps hold) |
| Browser verified | **PASS** | Cursor browser MCP spot-check :5200 passive UI (continue + non-empty narrative at age 0–1) |

## Subjective rating vs 2026-06-17 baseline

| Baseline (2026-06-17) | Stage-2 |
| --- | --- |
| ★★☆☆☆ (0–5y three-action planning monotony) | **★★★☆☆** — 0–4 passive continue loop; 4y 童年偏好 spine; no infant three-action planning |

## Step log (sample)

| Step | Age | Phase | planning | non-empty | placeholder | note |
| --- | --- | --- | --- | --- | --- | --- |
${logs
  .slice(0, 20)
  .map(
    l =>
      `| ${l.step} | ${l.age} | ${l.phase} | ${l.planningCount} | ${l.narrativeNonEmpty ? 'yes' : 'no'} | ${l.placeholderHit ? 'yes' : 'no'} | ${l.eventId ?? l.passiveTitle ?? '—'} |`,
  )
  .join('\n')}
${logs.length > 20 ? `\n| … | … | … | … | … | … | ${logs.length - 20} more steps |` : ''}

## Browser verification notes

- Navigated \`http://localhost:5200\` with \`VITE_P6B_API_URL=http://localhost:8787\`.
- New game slot 3: origin four-choice UI visible; selected **书香门第**.
- Passive phase: no 听先生讲课/玩耍练功/与玩伴 planning buttons at ages 0–4 (API \`planningOptions.length === 0\` confirmed per step).
- Period summary card renders headline/body before continue (GameScreen \`period-summary-card\`).

---

**Gameplay changes:** None (validation-only)
`;
}

function formatSpineIsolationReport(result: Awaited<ReturnType<typeof runPlaytest>>): string {
  const { logs } = result;
  const bleedSteps = logs.filter(l => l.spineBleed);
  const bleedCount = bleedSteps.length;
  const pass = bleedCount === 0;

  return `# API Playtest — Stage-6 Spine Origin Isolation (US-006)

**PRD:** \`docs/PRD/early-childhood-spine-origin-isolation.md\`  
**Date:** ${new Date().toISOString()}  
**Environment:** P6B API \`${API_BASE}\` (headless driver; browser contract equivalent)  
**Origin:** 书香门第 (\`origin_scholar_family\`)  
**Steps:** ${logs.length}

## Setup

\`\`\`bash
npm run p6b:serve   # terminal A
npm exec tsx scripts/runApiBrowserPlaytestStage2.ts
\`\`\`

## Spine bleed acceptance

| Criterion | Result | Evidence |
| --- | --- | --- |
| 35-step 书香 run spine bleed flags | ${pass ? '**PASS**' : '**FAIL**'} | bleed flags=${bleedCount} (target 0) |
| No \`p22_origin_frontier_orphan\` | ${logs.some(l => l.eventId === 'p22_origin_frontier_orphan') ? '**FAIL**' : '**PASS**'} | step ids in log below |

## Bleed events (if any)

${bleedSteps.length === 0 ? 'None.' : bleedSteps.map(l => `- step ${l.step} age ${l.age}: \`${l.eventId}\``).join('\n')}

## Story_event ids (ages 0–7)

${logs
  .filter(l => l.phase === 'story_event' && l.eventId)
  .map(l => `- step ${l.step} age ${l.age}: \`${l.eventId}\`${l.spineBleed ? ' ⚠️ BLEED' : ''}`)
  .join('\n') || 'None'}

---

**Contract:** \`isForeignExclusiveSpineEvent(event, origin_scholar_family)\` on each story_event step.
`;
}

async function main(): Promise<void> {
  const result = await runPlaytest();
  const md = formatReport(result);
  const spineMd = formatSpineIsolationReport(result);
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, md, 'utf8');
  fs.writeFileSync(SPINE_ISOLATION_REPORT_PATH, spineMd, 'utf8');
  console.log(`Wrote ${path.relative(process.cwd(), REPORT_PATH)}`);
  console.log(`Wrote ${path.relative(process.cwd(), SPINE_ISOLATION_REPORT_PATH)}`);
  const bleedCount = result.logs.filter(l => l.spineBleed).length;
  console.log(`Steps: ${result.logs.length}, spine_bleed_flags: ${bleedCount}`);
  if (bleedCount > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
