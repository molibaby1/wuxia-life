import { join } from 'node:path';
import {
  DEFAULT_EVIDENCE_ROOT,
  ensureEvidenceRoot,
  writeMatrixEvidence,
  type ConformanceBindingLabel,
  type ConformanceMatrixEvidenceV1,
  type ConformanceTrialEvidenceV1,
  type MatrixVerdict,
} from './contractConformanceExperiment';
import { runContractConformanceTrial } from './runContractConformanceTrial';

function usage(): never {
  console.error(`Usage:
  tsx scripts/evolution/contractConformance/cli.ts preflight --evidence-root <path>
  tsx scripts/evolution/contractConformance/cli.ts trial --binding <codex-current|cursor-auto> --trial-id <id> [--evidence-root <path>] [--timeout-ms <n>]
  tsx scripts/evolution/contractConformance/cli.ts matrix-init --evidence-root <path>
  tsx scripts/evolution/contractConformance/cli.ts matrix-verdict --evidence-root <path> --verdict <VERDICT> --rationale <text>
`);
  process.exit(2);
}

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const value = argv[i + 1];
    if (value === undefined || value.startsWith('--')) {
      out[key] = 'true';
      continue;
    }
    out[key] = value;
    i += 1;
  }
  return out;
}

function bindingFromFlag(value: string): ConformanceBindingLabel {
  if (value === 'codex-current') return 'Codex current binding';
  if (value === 'cursor-auto') return 'Cursor Auto';
  throw new Error(`unknown binding: ${value}`);
}

async function readExistingTrials(evidenceRoot: string): Promise<ConformanceTrialEvidenceV1[]> {
  const { readdir, readFile } = await import('node:fs/promises');
  const trialsRoot = join(evidenceRoot, 'trials');
  let entries: string[] = [];
  try {
    entries = await readdir(trialsRoot);
  } catch {
    return [];
  }
  const trials: ConformanceTrialEvidenceV1[] = [];
  for (const entry of entries.sort()) {
    try {
      const raw = await readFile(join(trialsRoot, entry, 'trial.json'), 'utf8');
      trials.push(JSON.parse(raw) as ConformanceTrialEvidenceV1);
    } catch {
      // skip incomplete trial directories
    }
  }
  return trials;
}

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);
  if (command === undefined) usage();
  const args = parseArgs(rest);
  const evidenceRoot = args['evidence-root'] ?? DEFAULT_EVIDENCE_ROOT;

  if (command === 'preflight') {
    await ensureEvidenceRoot(evidenceRoot);
    const marker = {
      schemaVersion: 'contract-conformance-preflight-v1',
      evidenceRoot,
      createdAt: new Date().toISOString(),
      status: 'READY',
      notes: [
        'Experiment evidence root prepared.',
        'No live Participant call performed by preflight.',
      ],
    };
    const { writeJsonCreateOnly } = await import('./contractConformanceExperiment');
    await writeJsonCreateOnly(join(evidenceRoot, 'preflight.json'), marker);
    console.log(JSON.stringify(marker, null, 2));
    return;
  }

  if (command === 'matrix-init') {
    await ensureEvidenceRoot(evidenceRoot);
    const matrix: ConformanceMatrixEvidenceV1 = {
      schemaVersion: 'contract-conformance-matrix-v1',
      createdAt: new Date().toISOString(),
      evidenceRoot,
      trials: await readExistingTrials(evidenceRoot),
      contractReliabilitySeparatedFromReasoningQuality: true,
      cursorModelBindingUncertainty: 'CURSOR_MODEL_BINDING_NOT_OBSERVABLE',
      fullP3RemainsDeferred: true,
    };
    const path = await writeMatrixEvidence(evidenceRoot, matrix);
    console.log(path);
    return;
  }

  if (command === 'trial') {
    if (args.binding === undefined || args['trial-id'] === undefined) usage();
    const timeoutMs = args['timeout-ms'] === undefined
      ? undefined
      : Number(args['timeout-ms']);
    if (timeoutMs !== undefined && !Number.isFinite(timeoutMs)) {
      throw new Error(`invalid --timeout-ms: ${args['timeout-ms']}`);
    }
    const evidence = await runContractConformanceTrial({
      evidenceRoot,
      trialId: args['trial-id'],
      bindingLabel: bindingFromFlag(args.binding),
      timeoutMs,
    });
    console.log(JSON.stringify(evidence, null, 2));
    return;
  }

  if (command === 'matrix-verdict') {
    if (args.verdict === undefined || args.rationale === undefined) usage();
    const verdict = args.verdict as MatrixVerdict;
    const trials = await readExistingTrials(evidenceRoot);
    const matrix: ConformanceMatrixEvidenceV1 = {
      schemaVersion: 'contract-conformance-matrix-v1',
      createdAt: new Date().toISOString(),
      evidenceRoot,
      trials,
      verdict,
      verdictRationale: args.rationale,
      contractReliabilitySeparatedFromReasoningQuality: true,
      cursorModelBindingUncertainty: 'CURSOR_MODEL_BINDING_NOT_OBSERVABLE',
      fullP3RemainsDeferred: true,
    };
    const path = await writeMatrixEvidence(evidenceRoot, matrix);
    console.log(path);
    console.log(JSON.stringify(matrix, null, 2));
    return;
  }

  usage();
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
