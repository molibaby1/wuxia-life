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
  selectedHypothesisPath?: string;
  activeCandidate?: ImprovementHypothesis;
  activeCandidateRef?: string;
  activeCandidateSourceIndex?: number;
  runRef: string;
  observablePayloadRef: string;
  externalFeedbackRef: string;
  improvementHypothesisRef: string;
  diagnosticEvidenceRefs: string[];
  authorityRefs: string[];
  productSourceFingerprintSha256: string;
  destinationPath: string;
}

type BuildProblemPackageCandidateInput = BuildProblemPackageInput & {
  selectedHypothesisPath?: undefined;
  activeCandidate: ImprovementHypothesis;
  activeCandidateRef: string;
  activeCandidateSourceIndex: number;
};

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
  const parsed = parseImprovementHypothesisSet(JSON.stringify({
    schemaVersion: 'improvement-hypothesis-set-v2',
    hypotheses: [draft],
    noProblemAssessment: null,
  }));
  const hypothesis = parsed.hypotheses[0];
  if (!hypothesis || hypothesis.hypothesisId !== value.selectedHypothesisId) {
    throw new Error('selected hypothesis artifact does not contain a valid hypothesis');
  }
  return hypothesis;
}

function activeCandidateFromInput(input: BuildProblemPackageCandidateInput): ImprovementHypothesis {
  assertNoReservedKeys(input.activeCandidate);
  if (input.activeCandidateRef.length === 0) throw new Error('activeCandidateRef must be a non-empty string');
  if (!Number.isInteger(input.activeCandidateSourceIndex) || input.activeCandidateSourceIndex < 0) {
    throw new Error('activeCandidateSourceIndex must be a non-negative integer');
  }
  assertObject(input.activeCandidate, 'active candidate');
  const candidateId = input.activeCandidate.hypothesisId;
  if (typeof candidateId !== 'string' || candidateId.length === 0) throw new Error('active candidate hypothesisId must be a non-empty string');
  const { hypothesisId: _ignored, ...draft } = input.activeCandidate;
  const parsed = parseImprovementHypothesisSet(JSON.stringify({
    schemaVersion: 'improvement-hypothesis-set-v2',
    hypotheses: [draft],
    noProblemAssessment: null,
  }));
  const parsedHypothesis = parsed.hypotheses[0];
  if (!parsedHypothesis) throw new Error('active candidate does not contain a valid hypothesis');
  return { ...parsedHypothesis, hypothesisId: candidateId };
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
  const candidateMode = input.activeCandidate !== undefined
    || input.activeCandidateRef !== undefined
    || input.activeCandidateSourceIndex !== undefined;
  if (candidateMode) {
    if (input.selectedHypothesisPath !== undefined
      || input.activeCandidate === undefined
      || input.activeCandidateRef === undefined
      || input.activeCandidateSourceIndex === undefined) {
      throw new Error('buildProblemPackage requires exactly one complete candidate or legacy Selection input');
    }
  } else if (input.selectedHypothesisPath === undefined) {
    throw new Error('buildProblemPackage requires exactly one complete candidate or legacy Selection input');
  }
  const hypothesis = candidateMode
    ? activeCandidateFromInput(input as BuildProblemPackageCandidateInput)
    : selectedHypothesisFromArtifact(JSON.parse(await readFile(input.selectedHypothesisPath!, 'utf8')) as unknown);
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
