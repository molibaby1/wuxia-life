import { open, mkdir, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import {
  parseImprovementHypothesisSet,
  type ImprovementHypothesis,
} from '../../../src/evolution/improvementHypothesisContract';
import {
  validateProblemPackage,
  type ProblemPackage,
} from '../../../src/evolution/problemPackageContract';
import { canonicalJson } from '../phase0/provenance';

const RESERVED_ORCHESTRATOR_KEYS = new Set([
  'problemType',
  'domain',
  'resourceStat',
  'mechanismType',
  'investigationMode',
  'allowedMechanismRefs',
]);

export interface BuildProblemPackageInput {
  selectedHypothesisPath: string;
  runRef: string;
  observablePayloadRef: string;
  externalFeedbackRef: string;
  improvementHypothesisRef: string;
  diagnosticEvidenceRefs: string[];
  authorityRefs: string[];
  productSourceFingerprintSha256: string;
  destinationPath: string;
}

function assertNoReservedKeys(value: unknown, path = '$'): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoReservedKeys(item, `${path}[${index}]`));
    return;
  }
  if (typeof value !== 'object' || value === null) return;
  for (const [key, child] of Object.entries(value)) {
    if (RESERVED_ORCHESTRATOR_KEYS.has(key)) {
      throw new Error(`reserved Orchestrator field is not allowed: ${path}.${key}`);
    }
    assertNoReservedKeys(child, `${path}.${key}`);
  }
}

function assertObject(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(`${label} must be an object`);
}

function selectedHypothesisFromArtifact(value: unknown): ImprovementHypothesis {
  assertObject(value, 'selected hypothesis artifact');
  assertNoReservedKeys(value);
  const selected = value.selectedHypothesis;
  assertObject(selected, 'selected hypothesis artifact.selectedHypothesis');
  if (typeof value.selectedHypothesisId !== 'string' || value.selectedHypothesisId.length === 0) {
    throw new Error('selected hypothesis artifact.selectedHypothesisId must be a non-empty string');
  }
  if (selected.hypothesisId !== value.selectedHypothesisId) {
    throw new Error('selected hypothesis id does not match artifact metadata');
  }
  const { hypothesisId: _hypothesisId, ...draft } = selected;
  const parsed = parseImprovementHypothesisSet(JSON.stringify({ hypotheses: [draft] }));
  const hypothesis = parsed.hypotheses[0];
  if (!hypothesis || hypothesis.hypothesisId !== value.selectedHypothesisId) {
    throw new Error('selected hypothesis artifact does not contain a valid hypothesis');
  }
  return hypothesis;
}

async function writeCreateOnly(path: string, bytes: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const handle = await open(path, 'wx');
  try {
    await handle.writeFile(bytes);
  } finally {
    await handle.close();
  }
}

export async function buildProblemPackage(
  input: BuildProblemPackageInput,
): Promise<ProblemPackage> {
  const selectedArtifact = JSON.parse(await readFile(input.selectedHypothesisPath, 'utf8')) as unknown;
  const hypothesis = selectedHypothesisFromArtifact(selectedArtifact);
  const packageValue = validateProblemPackage({
    schemaVersion: 'problem-package-v2',
    problemId: `problem-${hypothesis.hypothesisId}`,
    source: {
      runRef: input.runRef,
      observablePayloadRef: input.observablePayloadRef,
      externalFeedbackRef: input.externalFeedbackRef,
      improvementHypothesisRef: input.improvementHypothesisRef,
      diagnosticEvidenceRefs: input.diagnosticEvidenceRefs,
    },
    problem: {
      hypothesisId: hypothesis.hypothesisId,
      statement: hypothesis.hypothesis,
      observedBasis: hypothesis.observedBasis,
      feedbackRefs: hypothesis.feedbackRefs,
      evidenceRefs: hypothesis.evidenceRefs,
      unknowns: hypothesis.unknowns,
      productSignificance: hypothesis.productSignificance,
    },
    authorityRefs: input.authorityRefs,
    productSourceFingerprintSha256: input.productSourceFingerprintSha256,
    permissions: {
      authoritativeProductWrite: false,
      sandboxWrite: true,
      productExecution: false,
      codeExecution: false,
    },
  });
  await writeCreateOnly(input.destinationPath, `${canonicalJson(packageValue)}\n`);
  return packageValue;
}
