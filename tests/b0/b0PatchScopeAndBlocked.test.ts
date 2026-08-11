import assert from 'node:assert/strict';
import { validateProposedPaths } from '../../scripts/b0/patchScopeValidator';
import { auditRedTeam } from '../../scripts/b0/roles/redTeamAuditor';
import { applyHumanDecision, evaluateAutomaticTerminal } from '../../scripts/b0/humanDecision';
import { transition } from '../../scripts/b0/stateMachine';
import type { EvidenceIndex, FixtureRegistry, MechanicalAuditResult } from '../../scripts/b0/types';

function main(): void {
  assert.equal(validateProposedPaths(['scripts/b0/fixtures/known-bad/x.json']).ok, true);
  assert.equal(validateProposedPaths(['src/data/events.json']).ok, false);
  assert.equal(validateProposedPaths(['src/p8/metricDefinitions.ts']).ok, false);
  assert.equal(validateProposedPaths(['docs/contracts/game-state-snapshot-contract.md']).ok, false);
  assert.equal(validateProposedPaths(['docs/test-reports/p8-playability-gate-latest.md']).ok, false);

  const red = auditRedTeam({
    proposedPathsBySample: {
      a: ['src/data/events.json'],
      b: ['src/p8/metricDefinitions.ts'],
    },
    visibleTraces: [
      {
        schemaVersion: 'b0-player-visible-trace-v1',
        sampleId: 'leak',
        arm: 'candidate',
        seed: 1,
        personaId: 'p8-balanced-wei',
        steps: [{ directEffects: [{ x: 1 }] }],
      },
    ],
    seedsExposedToBlind: [804],
    holdoutSeeds: [804, 807],
    foreignReviewPayloads: [{ mechanicalVerdict: { hardKill: true } }],
    projectionFailures: [],
  });
  assert.equal(red.veto, true);
  const codes = new Set(red.findings.map(f => f.code));
  assert.ok(codes.has('out_of_scope_files'));
  assert.ok(codes.has('mutate_gate_threshold'));
  assert.ok(codes.has('hidden_in_visible_trace'));
  assert.ok(codes.has('holdout_leak'));
  assert.ok(codes.has('cross_reviewer_contamination'));

  // Human cannot accept a failed automatic suggestion
  const evidence: EvidenceIndex = {
    sourceFingerprintHash: 'x',
    manifestHash: 'x',
    fixtureHash: 'x',
    seedBundleHash: 'x',
    rawTraceHashes: {},
    visibleTraceHashes: {},
    mechanicalAuditHash: 'x',
    blindReviewHash: 'x',
    redTeamHash: 'x',
    chainOk: true,
    breakReasons: [],
  };
  const registry: FixtureRegistry = { schemaVersion: 'b0-fixture-registry-v1', samples: [] };
  const mechanical: MechanicalAuditResult[] = [];
  const autoFail = evaluateAutomaticTerminal({
    labels: {},
    mechanical,
    redTeam: { findings: [], veto: false },
    evidence,
    controlHardKilled: true,
    knownBadMissed: [],
    registry,
  });
  assert.equal(autoFail.suggested, 'failed');
  const refused = applyHumanDecision('accept', autoFail, 'try accept');
  assert.equal(refused.decision, 'reject');
  assert.equal(refused.terminalVerdict, 'failed');

  const broken = evaluateAutomaticTerminal({
    labels: {},
    mechanical,
    redTeam: { findings: [], veto: false },
    evidence: { ...evidence, chainOk: false, breakReasons: ['hash break'] },
    controlHardKilled: false,
    knownBadMissed: [],
    registry,
  });
  assert.equal(broken.suggested, 'blocked');

  assert.equal(transition('draft', 'sealed'), 'sealed');
  assert.throws(() => transition('draft', 'passed'));

  console.log('b0PatchScopeAndBlocked: PASS');
}

main();
