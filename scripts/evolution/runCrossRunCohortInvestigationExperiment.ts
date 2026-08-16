import { open, lstat, mkdir, readFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  buildCohortEvidenceBundle,
  cohortEvidenceItems,
  loadCohortRunArtifacts,
} from './crossRunCohortInvestigation/cohortEvidence';
import {
  assertSignalLinesPresentInText,
  writeCohortPlanCreateOnly,
} from './crossRunCohortInvestigation/cohortPlan';
import { prepareCohortRuntimeWorkspace } from './crossRunCohortInvestigation/prepareRuntimeWorkspace';
import { runCohortPhase0Batch } from './crossRunCohortInvestigation/runCohortPhase0';
import { runHypothesisInvestigation } from './runHypothesisInvestigation';
import { canonicalJson, sha256Hex, validatePhase0RunSeal } from './phase0/provenance';
import { serializeObservablePayload } from '../../src/evolution/playerObservableTranscript';

const EXPERIMENT_ROOT = '.tmp/evolution/cross-run-cohort-investigation-evidence';
const SEALED_ANCHOR_OBSERVABLE =
  '.tmp/evolution/fresh-problem-candidate-transfer/real-external-feedback/game-runs/ae-fresh-problem-transfer-001/reviewer-input/observable-payload.json';
const MEF_SOURCE_ROOT =
  '.tmp/evolution/fresh-problem-candidate-transfer/real-external-feedback';
const HYPOTHESIS_SOURCE_ROOT =
  '.tmp/evolution/fresh-problem-candidate-transfer/real-improvement-hypothesis';
const SEALED_LONGITUDINAL_EVIDENCE =
  '.tmp/evolution/longitudinal-investigation-evidence/real-investigation/investigation-runs/ae-fresh-problem-transfer-001/hypothesis-000001/investigation-evidence.json';
const SEALED_LONGITUDINAL_HASH =
  'eef9feac4b9df40d1d490b9db9c275d42cc2cff2b5392a4beee8301d5bc376d6';
const FIXED_RUN_REF = 'ae-fresh-problem-transfer-001';
const FIXED_HYPOTHESIS_ID = 'hypothesis-000001';
const DOTENV_PATH = resolve(process.cwd(), '.env');

async function assertAbsent(path: string, label: string): Promise<void> {
  try {
    await lstat(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
    throw error;
  }
  throw new Error(`${label} already exists: ${path}`);
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

/** ponytail: tiny KEY=VALUE loader; no multiline/escape — same as investigation CLI */
async function loadDotEnvIfPresent(path = DOTENV_PATH): Promise<void> {
  try {
    const text = await readFile(path, 'utf8');
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"'))
        || (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}

export async function prepareCohortExperimentMaterials(repositoryRoot = process.cwd()): Promise<{
  planPath: string;
  compositionPath: string;
  mappingPath: string;
  phase0OutRoot: string;
}> {
  const root = resolve(repositoryRoot);
  const evidenceRoot = join(root, EXPERIMENT_ROOT, 'evidence');
  const planPath = join(evidenceRoot, 'cohort-plan.json');
  const compositionPath = join(evidenceRoot, 'cohort-runtime-composition.json');
  const mappingPath = join(evidenceRoot, 'cohort-run-mapping.json');
  const phase0OutRoot = join(root, EXPERIMENT_ROOT, 'phase0');
  const phase0AnchorRoot = join(root, EXPERIMENT_ROOT, 'phase0-anchors');
  const runtimeWorkspace = join(root, EXPERIMENT_ROOT, 'runtime-workspace');

  await mkdir(evidenceRoot, { recursive: true });

  const anchorText = await readFile(join(root, SEALED_ANCHOR_OBSERVABLE), 'utf8');
  assertSignalLinesPresentInText(anchorText);

  await writeCohortPlanCreateOnly(planPath);
  await prepareCohortRuntimeWorkspace({
    repositoryRoot: root,
    destinationWorkspace: runtimeWorkspace,
    compositionEvidencePath: compositionPath,
  });

  const batch = await runCohortPhase0Batch({
    runtimeWorkspace,
    outRoot: phase0OutRoot,
    anchorRoot: phase0AnchorRoot,
    mappingPath,
  });

  if (batch.runs.length !== 8) {
    throw new Error(`expected exactly 8 cohort Phase0 runs, got ${batch.runs.length}`);
  }

  return { planPath, compositionPath, mappingPath, phase0OutRoot };
}

function assertChildPathUnderRoot(root: string, candidate: string, label: string): string {
  const resolvedRoot = resolve(root);
  const resolvedCandidate = resolve(candidate);
  const rel = relative(resolvedRoot, resolvedCandidate);
  if (!rel || rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    throw new Error(`${label} escapes required root: ${candidate}`);
  }
  return resolvedCandidate;
}

export async function assembleCohortEvidenceForInvestigation(input: {
  repositoryRoot?: string;
  mappingPath: string;
  phase0OutRoot?: string;
}): Promise<{
  items: ReturnType<typeof cohortEvidenceItems>;
  bundleHash: string;
  sealedLongitudinalHash: string;
}> {
  const root = resolve(input.repositoryRoot ?? process.cwd());
  const phase0OutRoot = resolve(
    input.phase0OutRoot ?? join(root, EXPERIMENT_ROOT, 'phase0'),
  );
  const mapping = JSON.parse(await readFile(input.mappingPath, 'utf8')) as {
    plan: Parameters<typeof buildCohortEvidenceBundle>[0]['plan'];
    runs: Array<{
      cohortRunId: string;
      outDir: string;
      experimentRootHash?: string;
      observablePayloadHash?: string;
    }>;
  };
  if (mapping.runs.length !== 8) {
    throw new Error('cohort run mapping must contain exactly 8 runs');
  }

  const runs = [];
  for (const run of mapping.runs) {
    if (typeof run.experimentRootHash !== 'string' || run.experimentRootHash.length === 0) {
      throw new Error(`cohort run ${run.cohortRunId} is missing experimentRootHash`);
    }
    const outDir = assertChildPathUnderRoot(
      phase0OutRoot,
      run.outDir,
      `cohort run ${run.cohortRunId} outDir`,
    );
    await validatePhase0RunSeal(outDir, run.experimentRootHash);
    const artifacts = await loadCohortRunArtifacts({ gameRunPath: outDir });
    if (typeof run.observablePayloadHash === 'string' && run.observablePayloadHash.length > 0) {
      const serializedHash = sha256Hex(
        Buffer.from(serializeObservablePayload(artifacts.payload), 'utf8'),
      );
      if (serializedHash !== run.observablePayloadHash) {
        throw new Error(
          `cohort run ${run.cohortRunId} observablePayloadHash mismatch: expected ${run.observablePayloadHash}, got ${serializedHash}`,
        );
      }
    }
    runs.push({
      cohortRunId: run.cohortRunId,
      payload: artifacts.payload,
      surface: artifacts.surface,
    });
  }
  const bundle = buildCohortEvidenceBundle({ plan: mapping.plan, runs });
  const items = cohortEvidenceItems(bundle);

  const sealedBytes = await readFile(join(root, SEALED_LONGITUDINAL_EVIDENCE), 'utf8');
  const sealedCanonicalHash = sha256Hex(canonicalJson(JSON.parse(sealedBytes)));
  if (sealedCanonicalHash !== SEALED_LONGITUDINAL_HASH) {
    throw new Error(
      `sealed longitudinal evidence hash mismatch: expected ${SEALED_LONGITUDINAL_HASH}, got ${sealedCanonicalHash}`,
    );
  }

  return {
    items,
    bundleHash: sha256Hex(canonicalJson(bundle)),
    sealedLongitudinalHash: sealedCanonicalHash,
  };
}

function renderHumanReviewPackage(input: {
  investigationDir: string;
  evidencePackHash: string;
  investigationInvocationRef: string;
  cohortSummary: unknown;
  providerResponseId?: string;
  modelReturned?: string;
}): string {
  return [
    '# Cross-Run Cohort Investigation Evidence — Human Review Ready',
    '',
    '## 结论',
    '',
    '本固定实验已完成唯一一次真实 Investigation，当前仅提交 Human review，不预判三项 Human 结论。',
    '',
    `- runRef: \`${FIXED_RUN_REF}\``,
    `- hypothesisId: \`${FIXED_HYPOTHESIS_ID}\``,
    '- evidence mode: `cohort-v1`',
    `- investigationInvocationRef: \`${input.investigationInvocationRef}\``,
    `- evidencePackHash: \`${input.evidencePackHash}\``,
    `- providerResponseId: \`${input.providerResponseId ?? 'n/a'}\``,
    `- modelReturned: \`${input.modelReturned ?? 'n/a'}\``,
    '- Modification Work: `NOT RUN`',
    '- Candidate: `NOT GENERATED`',
    '- gameplay: `unchanged`',
    '',
    '## Authority',
    '',
    '- Longitudinal Investigation Evidence Experiment: `CLOSED / Human accepted`',
    '- Cross-Run Cohort Investigation Evidence Experiment: `ACTIVE / implementation authorized`',
    '- real Investigation: completed',
    '- real calls: exactly `1`',
    '- retry: `0`',
    '- STOP: Human final review pending',
    '',
    '## Human must decide',
    '',
    '1. `COHORT_RETRIEVAL_ADEQUATE` / `COHORT_RETRIEVAL_NOT_ADEQUATE`',
    '2. `INVESTIGATION_USED_COHORT` / `INVESTIGATION_DID_NOT_USE_COHORT`',
    '3. `UNCERTAINTY_PRESERVED` / `UNCERTAINTY_NOT_PRESERVED`',
    '',
    '即使描述性结果是 8/8，也不能自动升级为 population prevalence。',
    '本阶段只能证明 pre-registered P8 cohort descriptive evidence，不是所有玩家总体。',
    '',
    '## Cohort descriptive summary (raw)',
    '',
    '```json',
    JSON.stringify(input.cohortSummary, null, 2),
    '```',
    '',
    '## Artifacts',
    '',
    `- investigation dir: \`${input.investigationDir}\``,
    `- experiment root: \`${EXPERIMENT_ROOT}\``,
    '',
  ].join('\n');
}

export async function runCrossRunCohortInvestigationExperiment(input: {
  repositoryRoot?: string;
  skipMaterials?: boolean;
  mappingPath?: string;
}): Promise<void> {
  await loadDotEnvIfPresent();
  const root = resolve(input.repositoryRoot ?? process.cwd());
  const evidenceRoot = join(root, EXPERIMENT_ROOT, 'evidence');
  const reviewPath = join(evidenceRoot, 'human-review-package.md');
  await assertAbsent(reviewPath, 'human review package');

  let mappingPath = input.mappingPath;
  if (!input.skipMaterials) {
    const materials = await prepareCohortExperimentMaterials(root);
    mappingPath = materials.mappingPath;
  }
  if (!mappingPath) {
    throw new Error('mappingPath is required when skipMaterials is true');
  }

  const assembled = await assembleCohortEvidenceForInvestigation({
    repositoryRoot: root,
    mappingPath,
    phase0OutRoot: join(root, EXPERIMENT_ROOT, 'phase0'),
  });

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY is required');

  const result = await runHypothesisInvestigation({
    runRef: FIXED_RUN_REF,
    hypothesisId: FIXED_HYPOTHESIS_ID,
    mefSourceRoot: join(root, MEF_SOURCE_ROOT),
    hypothesisSourceRoot: join(root, HYPOTHESIS_SOURCE_ROOT),
    outRoot: join(root, EXPERIMENT_ROOT, 'real-investigation'),
    evidenceMode: 'cohort-v1',
    cohortEvidence: { items: assembled.items },
    sealedLongitudinalEvidenceHash: SEALED_LONGITUDINAL_HASH,
    apiKey,
  });

  const invocation = JSON.parse(
    await readFile(join(result.investigationDir, 'invocation.json'), 'utf8'),
  ) as {
    investigationInvocationRef: string;
    participant?: { providerResponseId?: string; modelReturned?: string };
  };
  const evidencePack = JSON.parse(
    await readFile(join(result.investigationDir, 'investigation-evidence.json'), 'utf8'),
  ) as { items: Array<{ evidenceId: string; payload: unknown }> };
  const cohortSummaryItem = evidencePack.items.find(item => item.evidenceId === 'cohort:summary');

  await writeCreateOnly(
    reviewPath,
    renderHumanReviewPackage({
      investigationDir: result.investigationDir,
      evidencePackHash: result.evidencePackHash,
      investigationInvocationRef: invocation.investigationInvocationRef,
      cohortSummary: cohortSummaryItem?.payload ?? null,
      providerResponseId: invocation.participant?.providerResponseId,
      modelReturned: invocation.participant?.modelReturned,
    }),
  );
}

const executedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === executedPath) {
  const mode = process.argv[2] ?? 'full';
  if (mode === 'materials-only') {
    prepareCohortExperimentMaterials()
      .then(result => {
        process.stdout.write(`${canonicalJson(result)}\n`);
      })
      .catch(error => {
        console.error(error);
        process.exit(1);
      });
  } else if (mode === 'investigation-only') {
    const mappingPath = resolve(
      process.cwd(),
      EXPERIMENT_ROOT,
      'evidence/cohort-run-mapping.json',
    );
    runCrossRunCohortInvestigationExperiment({
      skipMaterials: true,
      mappingPath,
    })
      .then(() => {
        process.stdout.write('cross-run-cohort-investigation-evidence: human review pending\n');
      })
      .catch(error => {
        console.error(error);
        process.exit(1);
      });
  } else {
    runCrossRunCohortInvestigationExperiment({})
      .then(() => {
        process.stdout.write('cross-run-cohort-investigation-evidence: human review pending\n');
      })
      .catch(error => {
        console.error(error);
        process.exit(1);
      });
  }
}
