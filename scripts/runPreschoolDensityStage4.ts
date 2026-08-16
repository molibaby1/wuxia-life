/**
 * US-007: 35-step preschool narrative density verification (0→7).
 */
import fs from 'node:fs';
import path from 'node:path';

const API_BASE = process.env.P6B_API_URL ?? 'http://localhost:8787';
const REPORT_PATH = path.join(process.cwd(), 'artifacts/reports/early-childhood-preschool-density-stage4.md');
const MAX_STEPS = 35;
const ADULT_PLACEHOLDER = '本期暂无强求的江湖变故';

type Payload = {
  sessionPhase: string;
  planningOptions: Array<{ actionId: string; text: string }>;
  nextEvent: { eventId: string; title: string; text: string; choices?: Array<{ id: string; available: boolean }> } | null;
  passiveNarrative: { title: string; text: string } | null;
  periodSummary: { headline: string; body: string; narrativeText: string } | null;
  player?: { age: number };
  lifeMemory?: { derivedAtAge?: number };
};

function playerAge(p: Payload): number {
  return p.player?.age ?? p.lifeMemory?.derivedAtAge ?? 0;
}

function isNarrativeBeat(p: Payload): boolean {
  const texts: string[] = [];
  if (p.sessionPhase === 'passive_progression' && p.passiveNarrative?.text?.trim()) {
    texts.push(p.passiveNarrative.text, p.passiveNarrative.title);
  }
  if (p.sessionPhase === 'period_summary') {
    texts.push(p.periodSummary?.body ?? '', p.periodSummary?.headline ?? '', p.periodSummary?.narrativeText ?? '');
  }
  if (p.sessionPhase === 'story_event' && p.nextEvent?.text?.trim()) {
    texts.push(p.nextEvent.text, p.nextEvent.title);
  }
  if (p.sessionPhase === 'active_planning') {
    return false;
  }
  const combined = texts.join(' ');
  if (!combined.trim()) return false;
  if (combined.includes(ADULT_PLACEHOLDER)) return false;
  return true;
}

async function api<T>(path: string, init: RequestInit & { deviceToken?: string; sessionToken?: string } = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (init.deviceToken) headers.set('X-Device-Token', init.deviceToken);
  if (init.sessionToken) headers.set('X-Session-Token', init.sessionToken);
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${path} ${res.status}: ${JSON.stringify(body)}`);
  return body as T;
}

async function ack(
  deviceToken: string,
  sessionId: string,
  sessionToken: string,
  payload: Payload,
  ackKind: string,
): Promise<Payload> {
  return api<Payload>(`/v1/sessions/${sessionId}/progression-ack`, {
    method: 'POST',
    deviceToken,
    sessionToken,
    body: JSON.stringify({
      expectedSlotVersion: (payload as Payload & { slotVersion: number }).slotVersion,
      expectedSnapshotId: (payload as Payload & { snapshotId: string }).snapshotId,
      ackKind,
    }),
  });
}

async function run(): Promise<{ beats: number; finalAge: number; steps: number }> {
  const { deviceToken } = await api<{ deviceToken: string }>('/v1/devices/bootstrap', {
    method: 'POST',
    body: JSON.stringify({}),
  });

  let payload = await api<Payload & { sessionId: string; sessionToken: string; slotVersion: number; snapshotId: string }>(
    '/v1/sessions',
    {
      method: 'POST',
      deviceToken,
      body: JSON.stringify({
        slotIndex: 1,
        playerName: '密度测',
        gender: 'female',
        sourcePlatform: 'stage4-density',
        confirmOverwrite: true,
      }),
    },
  );

  const sessionId = payload.sessionId;
  let sessionToken = payload.sessionToken;
  let beats = 0;

  for (let step = 1; step <= MAX_STEPS; step++) {
    if (isNarrativeBeat(payload)) beats++;

    if (payload.sessionPhase === 'story_event' && payload.nextEvent?.choices?.length) {
      const event = payload.nextEvent;
      let choiceId = event.choices!.find(c => c.available)?.id ?? event.choices![0]!.id;
      if (event.eventId === 'origin_background') choiceId = 'origin_scholar_family';
      payload = await api<typeof payload>(`/v1/sessions/${sessionId}/choices`, {
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
      payload = await ack(deviceToken, sessionId, sessionToken, payload, 'passive_continue');
      if (payload.sessionPhase === 'period_summary') {
        payload = await ack(deviceToken, sessionId, sessionToken, payload, 'period_summary');
      }
      continue;
    }

    if (payload.sessionPhase === 'period_summary') {
      payload = await ack(deviceToken, sessionId, sessionToken, payload, 'period_summary');
      continue;
    }

    if (payload.sessionPhase === 'active_planning' && payload.planningOptions.length > 0) {
      payload = await api<typeof payload>(`/v1/sessions/${sessionId}/active-action`, {
        method: 'POST',
        deviceToken,
        sessionToken,
        body: JSON.stringify({
          expectedSlotVersion: payload.slotVersion,
          expectedSnapshotId: payload.snapshotId,
          actionId: payload.planningOptions[0]!.actionId,
        }),
      });
      if (payload.sessionPhase === 'action_summary') {
        payload = await ack(deviceToken, sessionId, sessionToken, payload, 'action_summary');
      }
      if (payload.sessionPhase === 'disturbance_narrative') {
        payload = await ack(deviceToken, sessionId, sessionToken, payload, 'disturbance');
      }
      continue;
    }

    if (payload.sessionPhase === 'story_event' && payload.nextEvent && !payload.nextEvent.choices?.length) {
      payload = await ack(deviceToken, sessionId, sessionToken, payload, 'story_automatic');
      continue;
    }

    break;
  }

  return { beats, finalAge: playerAge(payload), steps: MAX_STEPS };
}

async function main(): Promise<void> {
  const { beats, finalAge, steps } = await run();
  const pass = beats >= 8 && finalAge >= 7;
  const md = `# Stage-4 US-007: Preschool Narrative Density (35 steps)

**Date:** ${new Date().toISOString().slice(0, 10)}  
**Origin:** 书香门第 (API session)

## Metrics

| Metric | Target | Result |
| --- | --- | --- |
| Non-placeholder narrative beats | ≥8 | **${beats}** |
| Final age | ≥7 | **${finalAge}** |
| Steps | 35 | **${steps}** |
| Overall | PASS | **${pass ? 'PASS' : 'FAIL'}** |

## Command

\`\`\`bash
npm run p6b:serve
npm exec tsx scripts/runPreschoolDensityStage4.ts
\`\`\`

Beat counter excludes \`active_planning\` placeholder phases and adult jianghu filler snippet.
`;
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, md, 'utf8');
  console.log(`Wrote ${REPORT_PATH}`);
  console.log(`beats=${beats} finalAge=${finalAge} pass=${pass}`);
  if (!pass) process.exit(1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
