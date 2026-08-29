import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  EXACT_CONFORMANCE_PAYLOAD,
  TRIAL_CLASSIFICATIONS,
  buildConformancePrompt,
  classifyTerminalPayload,
  validateExactConformancePayload,
} from '../../scripts/evolution/contractConformance/contractConformanceExperiment';
import { interpretCodexCompletedOutput } from '../../scripts/evolution/contractConformance/codexExecParticipant';
import {
  STRUCTURED_FINAL_OUTPUT_CONTRACT_V1,
  renderStructuredFinalOutputContractV1,
} from '../../src/evolution/participantStructuredOutputContract';
import { validateStructuredTerminalEnvelope } from '../../src/evolution/structuredTerminalEnvelope';

export async function runContractConformancePreflightTests(): Promise<void> {
  assert.equal(
    STRUCTURED_FINAL_OUTPUT_CONTRACT_V1,
    'Structured Final Output Contract V1',
  );
  const rendered = renderStructuredFinalOutputContractV1({
    roleSchemaName: 'participant-contract-conformance-v1',
  });
  assert.match(rendered, /bare JSON only/i);
  assert.match(rendered, /participant-contract-conformance-v1/);

  assert.deepEqual(EXACT_CONFORMANCE_PAYLOAD, {
    schemaVersion: 'participant-contract-conformance-v1',
    status: 'OK',
    message: 'contract-confirmed',
  });
  assert.deepEqual([...TRIAL_CLASSIFICATIONS], [
    'PASS',
    'ENVELOPE_FAILURE',
    'ROLE_SCHEMA_FAILURE',
    'RUNTIME_FAILURE',
    'TIMEOUT',
  ]);

  const prompt = buildConformancePrompt();
  assert.match(prompt, /contract-only conformance trial/i);
  assert.match(prompt, /Do not investigate the repository/);
  assert.match(prompt, /Structured Final Output Contract V1/);
  assert.match(prompt, /"message":"contract-confirmed"/);

  assert.equal(
    classifyTerminalPayload(JSON.stringify(EXACT_CONFORMANCE_PAYLOAD)).classification,
    'PASS',
  );
  assert.equal(
    classifyTerminalPayload('```json\n{"schemaVersion":"participant-contract-conformance-v1","status":"OK","message":"contract-confirmed"}\n```').classification,
    'ENVELOPE_FAILURE',
  );
  assert.equal(
    classifyTerminalPayload(JSON.stringify({
      ...EXACT_CONFORMANCE_PAYLOAD,
      status: 'NO',
    })).classification,
    'ROLE_SCHEMA_FAILURE',
  );
  assert.equal(
    classifyTerminalPayload(JSON.stringify({
      ...EXACT_CONFORMANCE_PAYLOAD,
      extra: true,
    })).classification,
    'ROLE_SCHEMA_FAILURE',
  );

  assert.equal(validateExactConformancePayload({ ...EXACT_CONFORMANCE_PAYLOAD }).ok, true);
  assert.equal(validateStructuredTerminalEnvelope('not-json').ok, false);

  const codexStdout = [
    JSON.stringify({ type: 'thread.started', thread_id: 'thread-1' }),
    JSON.stringify({
      type: 'item.completed',
      item: { id: 'item_1', type: 'agent_message', text: JSON.stringify(EXACT_CONFORMANCE_PAYLOAD) },
    }),
    JSON.stringify({ type: 'turn.completed', usage: {} }),
    '',
  ].join('\n');
  const interpreted = interpretCodexCompletedOutput({
    job: {
      invocationRef: 'preflight',
      role: 'solution',
      workspaceRoot: '/tmp',
      prompt: 'x',
    },
    stdout: codexStdout,
  });
  assert.equal(interpreted.ok, true);
  if (interpreted.ok) {
    assert.equal(
      classifyTerminalPayload(interpreted.rawOutput).classification,
      'PASS',
    );
  }

  const evidenceRoot = await mkdtemp(join(tmpdir(), 'conformance-preflight-'));
  try {
    const { ensureEvidenceRoot, writeJsonCreateOnly } = await import(
      '../../scripts/evolution/contractConformance/contractConformanceExperiment'
    );
    await ensureEvidenceRoot(evidenceRoot);
    const markerPath = join(evidenceRoot, 'preflight.json');
    await writeJsonCreateOnly(markerPath, {
      schemaVersion: 'contract-conformance-preflight-v1',
      status: 'READY',
    });
    const raw = await readFile(markerPath, 'utf8');
    assert.match(raw, /READY/);
  } finally {
    await rm(evidenceRoot, { recursive: true, force: true });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runContractConformancePreflightTests()
    .then(() => console.log('contractConformancePreflight.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
