import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DEFAULT_WORKSPACE_AGENT_TIMEOUT_MS } from '../../scripts/evolution/problemAgnosticSolution/agentParticipant';
import { ENVELOPE_RETRANSMISSION_TIMEOUT_MS } from '../../scripts/evolution/problemAgnosticSolution/envelopeRetransmission';

export async function runRealRunObserveBatchPreflightTests(): Promise<void> {
  assert.equal(DEFAULT_WORKSPACE_AGENT_TIMEOUT_MS, 1_800_000);
  assert.equal(ENVELOPE_RETRANSMISSION_TIMEOUT_MS, 60_000);

  const stage = await readFile('docs/governance/current-product-stage.md', 'utf8');
  assert.match(stage, /1800000ms/);
  assert.match(stage, /PD-099/);
  assert.match(stage, /PROMISING_WITH_CAVEATS/);
  assert.match(stage, /FULL CONSOLIDATION: DEFERRED/);

  const preflight = JSON.parse(
    await readFile('.tmp/evolution/real-run-observe-batch-20260829/preflight.json', 'utf8'),
  ) as {
    verdict: string;
    entryGate: { hardTimeoutAuthorityMs: number; stale240000AsCurrentAuthority: boolean };
    slots: Array<{ slot: number; desiredOutcome: null; status: string }>;
    protectedSourceChangePreplanned: boolean;
    workflowEntry: { p2Handoff: { condition: string } };
  };

  assert.equal(preflight.verdict, 'PREFLIGHT_READY');
  assert.equal(preflight.entryGate.hardTimeoutAuthorityMs, 1_800_000);
  assert.equal(preflight.entryGate.stale240000AsCurrentAuthority, false);
  assert.equal(preflight.protectedSourceChangePreplanned, false);
  assert.equal(preflight.slots.length, 3);
  for (const slot of preflight.slots) {
    assert.equal(slot.desiredOutcome, null);
    assert.equal(slot.status, 'DEFINED');
  }
  assert.match(preflight.workflowEntry.p2Handoff.condition, /READY_FOR_CONFIG_EXECUTION/);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runRealRunObserveBatchPreflightTests()
    .then(() => console.log('realRunObserveBatchPreflight.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
