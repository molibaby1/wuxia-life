import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { stableJsonHash } from './hash';
import { validateB1EvidenceChain } from './evidenceChain';
import type { B1ArtifactManifest } from './manifest';

export type B1HumanDecision = {
  schemaVersion: 'b1-human-decision-v1';
  decision: 'accepted' | 'rejected' | 'blocked';
  runId: string;
  sourceFingerprintHash: string;
  baseCatalogHash: string;
  overlayHash: string;
  engineVersion: string;
  reason: string;
  decidedAt: string;
  decisionHash: string;
};

export function createB1HumanDecision(input: {
  decision: B1HumanDecision['decision'];
  manifest: B1ArtifactManifest;
  sourceFingerprintHash: string;
  reason: string;
  decidedAt?: string;
}): B1HumanDecision {
  if (!input.reason.trim()) throw new Error('B1 human decision requires a reason');
  const unsigned = {
    schemaVersion: 'b1-human-decision-v1' as const,
    decision: input.decision,
    runId: input.manifest.runId,
    sourceFingerprintHash: input.sourceFingerprintHash,
    baseCatalogHash: input.manifest.baseCatalogHash,
    overlayHash: input.manifest.overlayHash,
    engineVersion: input.manifest.engineVersion,
    reason: input.reason,
    decidedAt: input.decidedAt ?? new Date().toISOString(),
  };
  return { ...unsigned, decisionHash: stableJsonHash(unsigned) };
}

/** Seals one existing B1 artifact without rerunning or overwriting its evidence. */
export function sealB1HumanDecision(input: {
  outDir: string;
  decision: B1HumanDecision['decision'];
  reason: string;
  decidedAt?: string;
}): B1HumanDecision {
  const manifest = JSON.parse(readFileSync(join(input.outDir, 'manifest.json'), 'utf8')) as B1ArtifactManifest;
  const decision = createB1HumanDecision({
    decision: input.decision,
    manifest,
    sourceFingerprintHash: stableJsonHash(manifest.sourceFingerprint),
    reason: input.reason,
    decidedAt: input.decidedAt,
  });
  writeFileSync(join(input.outDir, 'human-decision.json'), `${JSON.stringify(decision, null, 2)}\n`, 'utf8');

  const evidence = validateB1EvidenceChain({ outDir: input.outDir, manifest });
  writeFileSync(join(input.outDir, 'evidence-index.json'), `${JSON.stringify(evidence)}\n`, 'utf8');

  const summaryPath = join(input.outDir, 'run-summary.json');
  const summary = JSON.parse(readFileSync(summaryPath, 'utf8')) as Record<string, unknown>;
  summary.terminalVerdict = input.decision === 'accepted' ? 'accepted' : input.decision;
  summary.state = input.decision;
  summary.humanDecision = decision;
  writeFileSync(join(input.outDir, 'run-summary.json'), `${JSON.stringify(summary)}\n`, 'utf8');
  return decision;
}
