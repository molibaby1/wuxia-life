import { open, lstat, mkdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  handoffItemOrThrow,
  parseModificationWorkResult,
  parseModificationWorkResultV2,
  validateModificationWorkReferences,
  validateModificationWorkReferencesV2,
  type ModificationWorkResult,
  type ModificationWorkResultV2,
} from '../../src/evolution/modificationWorkContract';
import {
  projectInvestigationHandoff,
  type InvestigationHandoff,
} from '../../src/evolution/investigationHandoff';
import {
  DEEPSEEK_MODIFICATION_WORK_MODEL,
  buildModificationWorkV2ParticipantInstructions,
  invokeDeepSeekModificationWork,
  type DeepSeekModificationWorkFailure,
  type DeepSeekModificationWorkSuccess,
} from './modificationWork/deepseekModificationWork';
import {
  buildModificationWorkParticipantInput,
  buildModificationWorkParticipantInputV2,
  loadModificationWorkSource,
  type ModificationWorkSource,
} from './modificationWork/loadModificationWorkSource';
import {
  canonicalJson,
  resolvePhase0RunPath,
  validatePhase0RunRef,
} from './phase0/provenance';

const DEFAULT_INVESTIGATION_SOURCE_ROOT = 'artifacts/reports/evolution/hypothesis-investigation';
const DEFAULT_OUT_ROOT = 'artifacts/reports/evolution/modification-work';
const INVOCATION_SCHEMA_VERSION_V1 = 'modification-work-invocation-v1' as const;
const INVOCATION_SCHEMA_VERSION_V2 = 'modification-work-invocation-v2' as const;
const HYPOTHESIS_ID_PATTERN = /^hypothesis-\d{6}$/;
const INVOCATION_REF_PATTERN = /^[a-z0-9][a-z0-9-]{0,127}$/;
const DOTENV_PATH = resolve(process.cwd(), '.env');

export type ModificationWorkContractVersion = 'v1' | 'v2';

/** ponytail: tiny KEY=VALUE loader; no multiline/escape support — upgrade to dotenv if needed */
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

export interface RunModificationWorkOptions {
  runRef: string;
  hypothesisId: string;
  investigationSourceRoot?: string;
  outRoot?: string;
  invocationRef?: string;
  apiKey: string;
  /** Default v1 preserves historical Modification Work semantics. */
  contractVersion?: ModificationWorkContractVersion;
}

export interface RunModificationWorkTestHooks {
  invoke?: typeof invokeDeepSeekModificationWork;
}

export interface RunModificationWorkResult {
  runRef: string;
  hypothesisId: string;
  feedbackInvocationRef: string;
  hypothesisInvocationRef: string;
  investigationInvocationRef: string;
  modificationWorkInvocationRef: string;
  modificationWorkDir: string;
  humanReportPath: string;
  experimentRootHash: string;
  observablePayloadHash: string;
  evidencePackHash: string;
  investigationHash: string;
  selectedHypothesisHash: string;
  status: 'completed' | 'failed';
  resultKind?: 'proposal' | 'no_proposal';
  contractVersion: ModificationWorkContractVersion;
}

interface ModificationWorkParticipant {
  kind: 'llm';
  provider: 'deepseek';
  modelRequested: typeof DEEPSEEK_MODIFICATION_WORK_MODEL;
  modelReturned?: string;
  providerResponseId?: string;
}

interface ModificationWorkInvocationRecordV1 {
  schemaVersion: typeof INVOCATION_SCHEMA_VERSION_V1;
  runRef: string;
  hypothesisId: string;
  feedbackInvocationRef: string;
  hypothesisInvocationRef: string;
  investigationInvocationRef: string;
  modificationWorkInvocationRef: string;
  experimentRootHash: string;
  observablePayloadHash: string;
  evidencePackHash: string;
  investigationHash: string;
  selectedHypothesisHash: string;
  participant: ModificationWorkParticipant;
  status: 'completed' | 'failed';
  resultKind?: 'proposal' | 'no_proposal';
  errorKind?: 'provider' | 'parse' | 'invalid_reference';
}

interface ModificationWorkInvocationRecordV2 {
  schemaVersion: typeof INVOCATION_SCHEMA_VERSION_V2;
  contractVersion: 'v2';
  runRef: string;
  hypothesisId: string;
  feedbackInvocationRef: string;
  hypothesisInvocationRef: string;
  investigationInvocationRef: string;
  modificationWorkInvocationRef: string;
  experimentRootHash: string;
  observablePayloadHash: string;
  evidencePackHash: string;
  investigationHash: string;
  selectedHypothesisHash: string;
  participant: ModificationWorkParticipant;
  status: 'completed' | 'failed';
  resultKind?: 'proposal' | 'no_proposal';
  errorKind?: 'provider' | 'parse' | 'invalid_reference';
}

async function exists(path: string): Promise<boolean> {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

async function assertTargetAbsent(path: string, label: string): Promise<void> {
  if (await exists(path)) {
    throw new Error(`${label} already exists: ${path}`);
  }
}

async function writeCreateOnly(path: string, bytes: string | Uint8Array): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const handle = await open(path, 'wx');
  try {
    await handle.writeFile(bytes);
  } finally {
    await handle.close();
  }
}

function requireApiKey(apiKey: string): string {
  if (!apiKey.trim()) throw new Error('apiKey must not be empty');
  return apiKey;
}

function validateHypothesisId(hypothesisId: string): string {
  if (!HYPOTHESIS_ID_PATTERN.test(hypothesisId)) {
    throw new Error(`invalid hypothesisId: ${hypothesisId}`);
  }
  return hypothesisId;
}

function validateInvocationRef(invocationRef: string): string {
  if (!INVOCATION_REF_PATTERN.test(invocationRef)) {
    throw new Error(`invalid invocationRef: ${invocationRef}`);
  }
  return invocationRef;
}

function buildParticipant(
  invokeResult?: DeepSeekModificationWorkSuccess,
): ModificationWorkParticipant {
  return {
    kind: 'llm',
    provider: 'deepseek',
    modelRequested: DEEPSEEK_MODIFICATION_WORK_MODEL,
    ...(invokeResult
      ? {
        modelReturned: invokeResult.model,
        providerResponseId: invokeResult.responseId,
      }
      : {}),
  };
}

function renderHumanReview(input: {
  runRef: string;
  hypothesisId: string;
  feedbackInvocationRef: string;
  hypothesisInvocationRef: string;
  investigationInvocationRef: string;
  modificationWorkInvocationRef: string;
  experimentRootHash: string;
  observablePayloadHash: string;
  evidencePackHash: string;
  investigationHash: string;
  selectedHypothesisHash: string;
  status: 'completed' | 'failed';
  resultKind?: 'proposal' | 'no_proposal';
  errorKind?: string;
  participant: ModificationWorkParticipant;
  source: ModificationWorkSource;
  rawParticipantResponse?: string;
  result?: ModificationWorkResult;
}): string {
  const selected = input.source.selectedHypothesis;
  const sections = [
    '# Human Review — Modification Work',
    '',
    `- runRef: ${input.runRef}`,
    `- selected hypothesis: ${input.hypothesisId}`,
    `- feedbackInvocationRef: ${input.feedbackInvocationRef}`,
    `- hypothesisInvocationRef: ${input.hypothesisInvocationRef}`,
    `- investigationInvocationRef: ${input.investigationInvocationRef}`,
    `- modificationWorkInvocationRef: ${input.modificationWorkInvocationRef}`,
    `- experimentRootHash: ${input.experimentRootHash}`,
    `- observablePayloadHash: ${input.observablePayloadHash}`,
    `- evidencePackHash: ${input.evidencePackHash}`,
    `- investigationHash: ${input.investigationHash}`,
    `- selectedHypothesisHash: ${input.selectedHypothesisHash}`,
    `- provider: ${input.participant.provider}`,
    `- modelRequested: ${input.participant.modelRequested}`,
    ...(input.participant.modelReturned
      ? [`- modelReturned: ${input.participant.modelReturned}`]
      : []),
    `- status: ${input.status}`,
    ...(input.resultKind ? [`- resultKind: ${input.resultKind}`] : []),
    ...(input.errorKind ? [`- errorKind: ${input.errorKind}`] : []),
    '- realCallCount: 1',
    '- retry: none',
    '',
    'Modification Work Proposal',
    '≠ product truth',
    '≠ accepted product change',
    '≠ executable PRD',
    '≠ authorization to modify Wuxia-Life',
    '',
    'participant proposal 不是产品真理。',
    'participant proposal 不是自动修改命令。',
    'no_proposal 是合法 completed invocation，但不能证明 Skeleton 005 success。',
    '本阶段 STOP。',
    '',
    '## Selected hypothesis',
    '',
    selected.hypothesis,
    '',
    '### Observed basis',
    selected.observedBasis,
    '',
    '## Structured investigation summary',
    '',
    `- confirmedFacts: ${input.source.investigation.confirmedFacts.length}`,
    `- relevantMechanisms: ${input.source.investigation.relevantMechanisms.length}`,
    `- limitingEvidence: ${input.source.investigation.limitingEvidence.length}`,
    `- unresolvedQuestions: ${input.source.investigation.unresolvedQuestions.length}`,
    `- evidenceGaps: ${input.source.investigation.evidenceGaps.length}`,
    '',
  ];

  if (input.rawParticipantResponse !== undefined) {
    sections.push(
      '## 原始 participant response',
      '',
      '```',
      input.rawParticipantResponse,
      '```',
      '',
    );
  } else {
    sections.push('## 原始 participant response', '', '（无）', '');
  }

  if (input.status === 'completed' && input.result?.kind === 'proposal') {
    sections.push(
      '## Proposal',
      '',
      '### proposedChange',
      input.result.proposedChange,
      '',
      '### scopeRefs',
      ...input.result.scopeRefs.map(ref => `- ${ref}`),
      '',
      '### evidenceRefs',
      ...input.result.evidenceRefs.map(ref => `- ${ref}`),
      '',
      '### expectedPlayerObservableDifference / 玩家可见差异',
      input.result.expectedPlayerObservableDifference,
      '',
      '### unknowns / 未知',
      ...(input.result.unknowns.length === 0
        ? ['（无）']
        : input.result.unknowns.map(item => `- ${item}`)),
      '',
      '### risks / 风险',
      ...(input.result.risks.length === 0
        ? ['（无）']
        : input.result.risks.map(item => `- ${item}`)),
      '',
      '### nonGoals / 非目标',
      ...(input.result.nonGoals.length === 0
        ? ['（无）']
        : input.result.nonGoals.map(item => `- ${item}`)),
      '',
    );
  } else if (input.status === 'completed' && input.result?.kind === 'no_proposal') {
    sections.push(
      '## no_proposal',
      '',
      input.result.reason,
      '',
      '这是合法 completed invocation，但不能证明 Skeleton 005 success。',
      '',
    );
  }

  sections.push(
    '## Human decision',
    '',
    'Human Review 的问题是：这个结果是否证明系统能够根据 bounded Investigation 形成一项 Human 可以有意义地接受或拒绝的 Modification Work？',
    '',
    '不是：这个具体游戏设计是否一定正确？',
    '',
    '- 接受进入后续 Human 修改工作（仍不是自动执行）',
    '- 拒绝',
    '- 需要更多 investigation / evidence',
    '',
    '以上选项都不是自动修改授权，也不构成 executable PRD / Candidate / Phase 0 授权。',
    '',
    '## STOP boundary',
    '',
    '无论本文件里的 proposal 看起来多合理：',
    '',
    '- 不生成 executable PRD',
    '- 不改 Wuxia-Life',
    '- 不生成 Candidate',
    '- 不运行 Phase 0',
    '- 不进入下一 Skeleton',
    '',
    'STOP',
    '',
  );

  return sections.join('\n');
}

function renderHumanReviewV2(input: {
  runRef: string;
  hypothesisId: string;
  feedbackInvocationRef: string;
  hypothesisInvocationRef: string;
  investigationInvocationRef: string;
  modificationWorkInvocationRef: string;
  experimentRootHash: string;
  observablePayloadHash: string;
  evidencePackHash: string;
  investigationHash: string;
  selectedHypothesisHash: string;
  status: 'completed' | 'failed';
  resultKind?: 'proposal' | 'no_proposal';
  errorKind?: string;
  participant: ModificationWorkParticipant;
  source: ModificationWorkSource;
  handoff: InvestigationHandoff;
  rawParticipantResponse?: string;
  result?: ModificationWorkResultV2;
}): string {
  const selected = input.source.selectedHypothesis;
  const unresolvedItems = input.handoff.items.filter(
    item => item.kind === 'unresolved_question' || item.kind === 'evidence_gap',
  );
  const sections = [
    '# Human Review — Modification Work Uncertainty Preservation (v2)',
    '',
    `- contractVersion: v2`,
    `- runRef: ${input.runRef}`,
    `- selected hypothesis: ${input.hypothesisId}`,
    `- feedbackInvocationRef: ${input.feedbackInvocationRef}`,
    `- hypothesisInvocationRef: ${input.hypothesisInvocationRef}`,
    `- investigationInvocationRef: ${input.investigationInvocationRef}`,
    `- modificationWorkInvocationRef: ${input.modificationWorkInvocationRef}`,
    `- experimentRootHash: ${input.experimentRootHash}`,
    `- observablePayloadHash: ${input.observablePayloadHash}`,
    `- evidencePackHash: ${input.evidencePackHash}`,
    `- investigationHash: ${input.investigationHash}`,
    `- selectedHypothesisHash: ${input.selectedHypothesisHash}`,
    `- provider: ${input.participant.provider}`,
    `- modelRequested: ${input.participant.modelRequested}`,
    ...(input.participant.modelReturned
      ? [`- modelReturned: ${input.participant.modelReturned}`]
      : []),
    `- status: ${input.status}`,
    ...(input.resultKind ? [`- resultKind: ${input.resultKind}`] : []),
    ...(input.errorKind ? [`- errorKind: ${input.errorKind}`] : []),
    '- realCallCount: 1',
    '- retry: none',
    '',
    'This experiment does NOT authorize Candidate generation.',
    '',
    'Modification Work Proposal',
    '≠ product truth',
    '≠ accepted product change',
    '≠ executable PRD',
    '≠ authorization to modify Wuxia-Life',
    '',
    '## Selected hypothesis',
    '',
    selected.hypothesis,
    '',
    '### Observed basis',
    selected.observedBasis,
    '',
    '## Investigation handoff summary',
    '',
    ...input.handoff.items.map(
      item => `- ${item.ref} [${item.kind}] ${item.statement}`,
    ),
    '',
  ];

  if (input.rawParticipantResponse !== undefined) {
    sections.push(
      '## 原始 participant response',
      '',
      '```',
      input.rawParticipantResponse,
      '```',
      '',
    );
  } else {
    sections.push('## 原始 participant response', '', '（无）', '');
  }

  if (input.status === 'completed' && input.result?.kind === 'proposal') {
    const basisLines = input.result.investigationBasisRefs.map(ref => {
      const item = handoffItemOrThrow(input.handoff, ref);
      return `- ${ref} [${item.kind}] ${item.statement}`;
    });
    const unresolvedDepLines = input.result.unresolvedDependencyRefs.length === 0
      ? ['（无）']
      : input.result.unresolvedDependencyRefs.map(ref => {
        const item = handoffItemOrThrow(input.handoff, ref);
        return `- ${ref} [${item.kind}] ${item.statement}`;
      });
    const assumptionLines = input.result.assumptions.length === 0
      ? ['（无）']
      : input.result.assumptions.map(a =>
        `- ${a.statement}`
        + (a.relatedInvestigationRefs.length > 0
          ? ` (related: ${a.relatedInvestigationRefs.join(', ')})`
          : ''),
      );

    sections.push(
      '## Proposal',
      '',
      '### proposedChange',
      input.result.proposedChange,
      '',
      '### investigationBasisRefs + statements',
      ...basisLines,
      '',
      '### unresolvedDependencyRefs + statements',
      ...unresolvedDepLines,
      '',
      '### assumptions',
      ...assumptionLines,
      '',
      '### scopeRefs',
      ...input.result.scopeRefs.map(ref => `- ${ref}`),
      '',
      '### evidenceRefs',
      ...input.result.evidenceRefs.map(ref => `- ${ref}`),
      '',
      '### expectedPlayerObservableDifference',
      input.result.expectedPlayerObservableDifference,
      '',
      '### risks',
      ...(input.result.risks.length === 0
        ? ['（无）']
        : input.result.risks.map(item => `- ${item}`)),
      '',
      '### nonGoals',
      ...(input.result.nonGoals.length === 0
        ? ['（无）']
        : input.result.nonGoals.map(item => `- ${item}`)),
      '',
    );
  } else if (input.status === 'completed' && input.result?.kind === 'no_proposal') {
    sections.push(
      '## no_proposal',
      '',
      input.result.reason,
      '',
      'no_proposal 是合法结果。',
      '',
      '### Supplied unresolved questions / evidence gaps',
      ...(unresolvedItems.length === 0
        ? ['（无）']
        : unresolvedItems.map(item => `- ${item.ref} [${item.kind}] ${item.statement}`)),
      '',
    );
  }

  sections.push(
    '## Human experimental review',
    '',
    'Human Review 的唯一问题是：uncertainty 是否被诚实保留？',
    '',
    '不是：这个具体游戏设计是否正确？',
    '不是：是否应该实现这项 gameplay change？',
    '',
    'Choose exactly one:',
    '',
    '- UNCERTAINTY_PRESERVED',
    '- UNCERTAINTY_NOT_PRESERVED',
    '',
    'Do not treat this as a product-change acceptance decision.',
    '',
    'This experiment does NOT authorize Candidate generation.',
    '',
    '## STOP boundary',
    '',
    '- 不生成 Candidate',
    '- 不改 Wuxia-Life gameplay',
    '- 不进入 Runtime A / executable PRD / promotion',
    '',
    'STOP FOR HUMAN UNCERTAINTY-PRESERVATION REVIEW',
    '',
  );

  return sections.join('\n');
}

async function saveRawResponses(
  modificationWorkDir: string,
  invokeResult: DeepSeekModificationWorkSuccess | DeepSeekModificationWorkFailure,
): Promise<void> {
  if (invokeResult.rawProviderResponse !== undefined) {
    await writeCreateOnly(
      join(modificationWorkDir, 'raw-provider-response.txt'),
      invokeResult.rawProviderResponse,
    );
  }
  if (invokeResult.ok) {
    await writeCreateOnly(
      join(modificationWorkDir, 'raw-participant-response.txt'),
      invokeResult.rawParticipantResponse,
    );
  }
}

async function persistFailure(input: {
  modificationWorkDir: string;
  record: ModificationWorkInvocationRecordV1 | ModificationWorkInvocationRecordV2;
  source: ModificationWorkSource;
  handoff?: InvestigationHandoff;
  contractVersion: ModificationWorkContractVersion;
  rawParticipantResponse?: string;
}): Promise<string> {
  const humanReportPath = join(input.modificationWorkDir, 'human-review.md');
  await writeCreateOnly(join(input.modificationWorkDir, 'invocation.json'), canonicalJson(input.record));
  const review = input.contractVersion === 'v2'
    ? renderHumanReviewV2({
      runRef: input.record.runRef,
      hypothesisId: input.record.hypothesisId,
      feedbackInvocationRef: input.record.feedbackInvocationRef,
      hypothesisInvocationRef: input.record.hypothesisInvocationRef,
      investigationInvocationRef: input.record.investigationInvocationRef,
      modificationWorkInvocationRef: input.record.modificationWorkInvocationRef,
      experimentRootHash: input.record.experimentRootHash,
      observablePayloadHash: input.record.observablePayloadHash,
      evidencePackHash: input.record.evidencePackHash,
      investigationHash: input.record.investigationHash,
      selectedHypothesisHash: input.record.selectedHypothesisHash,
      status: 'failed',
      errorKind: input.record.errorKind,
      participant: input.record.participant,
      source: input.source,
      handoff: input.handoff ?? projectInvestigationHandoff(input.source.investigation),
      rawParticipantResponse: input.rawParticipantResponse,
    })
    : renderHumanReview({
      runRef: input.record.runRef,
      hypothesisId: input.record.hypothesisId,
      feedbackInvocationRef: input.record.feedbackInvocationRef,
      hypothesisInvocationRef: input.record.hypothesisInvocationRef,
      investigationInvocationRef: input.record.investigationInvocationRef,
      modificationWorkInvocationRef: input.record.modificationWorkInvocationRef,
      experimentRootHash: input.record.experimentRootHash,
      observablePayloadHash: input.record.observablePayloadHash,
      evidencePackHash: input.record.evidencePackHash,
      investigationHash: input.record.investigationHash,
      selectedHypothesisHash: input.record.selectedHypothesisHash,
      status: 'failed',
      errorKind: input.record.errorKind,
      participant: input.record.participant,
      source: input.source,
      rawParticipantResponse: input.rawParticipantResponse,
    });
  await writeCreateOnly(humanReportPath, review);
  return humanReportPath;
}

export async function runModificationWork(
  options: RunModificationWorkOptions,
  testHooks: RunModificationWorkTestHooks = {},
): Promise<RunModificationWorkResult> {
  const apiKey = requireApiKey(options.apiKey);
  const runRef = validatePhase0RunRef(options.runRef);
  const hypothesisId = validateHypothesisId(options.hypothesisId);
  const contractVersion: ModificationWorkContractVersion = options.contractVersion ?? 'v1';
  if (contractVersion !== 'v1' && contractVersion !== 'v2') {
    throw new Error(`unsupported contractVersion: ${String(contractVersion)}`);
  }

  const source = await loadModificationWorkSource({
    investigationSourceRoot: resolve(
      options.investigationSourceRoot ?? DEFAULT_INVESTIGATION_SOURCE_ROOT,
    ),
    runRef,
    hypothesisId,
  });

  const handoff = projectInvestigationHandoff(source.investigation);
  const participantInputBytes = contractVersion === 'v2'
    ? buildModificationWorkParticipantInputV2(source, handoff)
    : buildModificationWorkParticipantInput(source);
  const modificationWorkInvocationRef = validateInvocationRef(
    options.invocationRef
      ?? (contractVersion === 'v2'
        ? `${runRef}-${hypothesisId}-deepseek-modification-work-uncertainty-001`
        : `${runRef}-${hypothesisId}-deepseek-modification-work-001`),
  );
  const outRoot = resolve(options.outRoot ?? DEFAULT_OUT_ROOT);
  const runsRoot = join(outRoot, 'modification-work-runs');
  const runDir = resolvePhase0RunPath(runsRoot, runRef);
  const modificationWorkDir = resolvePhase0RunPath(runDir, hypothesisId);

  await assertTargetAbsent(modificationWorkDir, 'modification work run target');
  await mkdir(runsRoot, { recursive: true });
  await mkdir(runDir, { recursive: true });
  await mkdir(modificationWorkDir, { recursive: false });

  await writeCreateOnly(
    join(modificationWorkDir, 'source-investigation.json'),
    source.sourceInvestigationBytes,
  );
  await writeCreateOnly(
    join(modificationWorkDir, 'source-investigation-invocation.json'),
    source.sourceInvestigationInvocationBytes,
  );
  await writeCreateOnly(
    join(modificationWorkDir, 'source-investigation-evidence.json'),
    source.sourceEvidencePackBytes,
  );
  await writeCreateOnly(
    join(modificationWorkDir, 'modification-work-input.json'),
    participantInputBytes,
  );

  const invoke = testHooks.invoke ?? invokeDeepSeekModificationWork;
  const invokeResult = await invoke({
    apiKey,
    invocationRef: modificationWorkInvocationRef,
    runRef: source.runRef,
    hypothesisId: source.hypothesisId,
    investigationInvocationRef: source.investigationInvocationRef,
    experimentRootHash: source.experimentRootHash,
    evidencePackHash: source.evidencePackHash,
    investigationHash: source.investigationHash,
    participantInputBytes,
    ...(contractVersion === 'v2'
      ? { instructions: buildModificationWorkV2ParticipantInstructions() }
      : {}),
  });

  await saveRawResponses(modificationWorkDir, invokeResult);

  const baseFields = {
    runRef,
    hypothesisId,
    feedbackInvocationRef: source.feedbackInvocationRef,
    hypothesisInvocationRef: source.hypothesisInvocationRef,
    investigationInvocationRef: source.investigationInvocationRef,
    modificationWorkInvocationRef,
    experimentRootHash: source.experimentRootHash,
    observablePayloadHash: source.observablePayloadHash,
    evidencePackHash: source.evidencePackHash,
    investigationHash: source.investigationHash,
    selectedHypothesisHash: source.selectedHypothesisHash,
  } as const;

  const buildFailedRecord = (
    participant: ModificationWorkParticipant,
    errorKind: 'provider' | 'parse' | 'invalid_reference',
  ): ModificationWorkInvocationRecordV1 | ModificationWorkInvocationRecordV2 => {
    if (contractVersion === 'v2') {
      return {
        schemaVersion: INVOCATION_SCHEMA_VERSION_V2,
        contractVersion: 'v2',
        ...baseFields,
        participant,
        status: 'failed',
        errorKind,
      };
    }
    return {
      schemaVersion: INVOCATION_SCHEMA_VERSION_V1,
      ...baseFields,
      participant,
      status: 'failed',
      errorKind,
    };
  };

  if (!invokeResult.ok) {
    await persistFailure({
      modificationWorkDir,
      record: buildFailedRecord(buildParticipant(), 'provider'),
      source,
      handoff,
      contractVersion,
    });
    throw new Error(`modification work participant invocation failed: ${invokeResult.errorKind}`);
  }

  const participant = buildParticipant(invokeResult);

  if (contractVersion === 'v2') {
    let parsedV2: ModificationWorkResultV2;
    try {
      parsedV2 = parseModificationWorkResultV2(invokeResult.rawParticipantResponse);
    } catch (error) {
      await persistFailure({
        modificationWorkDir,
        record: buildFailedRecord(participant, 'parse'),
        source,
        handoff,
        contractVersion,
        rawParticipantResponse: invokeResult.rawParticipantResponse,
      });
      throw error;
    }

    try {
      validateModificationWorkReferencesV2(
        parsedV2,
        source.allowedEvidenceRefs,
        source.allowedScopeRefs,
        handoff,
      );
    } catch (error) {
      await persistFailure({
        modificationWorkDir,
        record: buildFailedRecord(participant, 'invalid_reference'),
        source,
        handoff,
        contractVersion,
        rawParticipantResponse: invokeResult.rawParticipantResponse,
      });
      throw error;
    }

    await writeCreateOnly(join(modificationWorkDir, 'modification-work.json'), canonicalJson(parsedV2));
    await writeCreateOnly(
      join(modificationWorkDir, 'invocation.json'),
      canonicalJson({
        schemaVersion: INVOCATION_SCHEMA_VERSION_V2,
        contractVersion: 'v2',
        ...baseFields,
        participant,
        status: 'completed',
        resultKind: parsedV2.kind,
      } satisfies ModificationWorkInvocationRecordV2),
    );

    const humanReportPath = join(modificationWorkDir, 'human-review.md');
    await writeCreateOnly(
      humanReportPath,
      renderHumanReviewV2({
        ...baseFields,
        status: 'completed',
        resultKind: parsedV2.kind,
        participant,
        source,
        handoff,
        rawParticipantResponse: invokeResult.rawParticipantResponse,
        result: parsedV2,
      }),
    );

    return {
      ...baseFields,
      modificationWorkDir,
      humanReportPath,
      status: 'completed',
      resultKind: parsedV2.kind,
      contractVersion,
    };
  }

  let parsed: ModificationWorkResult;
  try {
    parsed = parseModificationWorkResult(invokeResult.rawParticipantResponse);
  } catch (error) {
    await persistFailure({
      modificationWorkDir,
      record: buildFailedRecord(participant, 'parse'),
      source,
      contractVersion,
      rawParticipantResponse: invokeResult.rawParticipantResponse,
    });
    throw error;
  }

  try {
    validateModificationWorkReferences(
      parsed,
      source.allowedEvidenceRefs,
      source.allowedScopeRefs,
    );
  } catch (error) {
    await persistFailure({
      modificationWorkDir,
      record: buildFailedRecord(participant, 'invalid_reference'),
      source,
      contractVersion,
      rawParticipantResponse: invokeResult.rawParticipantResponse,
    });
    throw error;
  }

  await writeCreateOnly(join(modificationWorkDir, 'modification-work.json'), canonicalJson(parsed));
  await writeCreateOnly(
    join(modificationWorkDir, 'invocation.json'),
    canonicalJson({
      schemaVersion: INVOCATION_SCHEMA_VERSION_V1,
      ...baseFields,
      participant,
      status: 'completed',
      resultKind: parsed.kind,
    } satisfies ModificationWorkInvocationRecordV1),
  );

  const humanReportPath = join(modificationWorkDir, 'human-review.md');
  await writeCreateOnly(
    humanReportPath,
    renderHumanReview({
      ...baseFields,
      status: 'completed',
      resultKind: parsed.kind,
      participant,
      source,
      rawParticipantResponse: invokeResult.rawParticipantResponse,
      result: parsed,
    }),
  );

  return {
    ...baseFields,
    modificationWorkDir,
    humanReportPath,
    status: 'completed',
    resultKind: parsed.kind,
    contractVersion,
  };
}

interface CliArgs {
  runRef: string;
  hypothesisId: string;
  investigationSourceRoot?: string;
  outRoot?: string;
  invocationRef?: string;
  contractVersion?: ModificationWorkContractVersion;
}

function requireValue(argv: string[], index: number, flag: string): string {
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`missing value for ${flag}`);
  return value;
}

function parseCliArgs(argv: string[]): CliArgs {
  const values = new Map<string, string>();
  const allowed = new Set([
    '--run-ref',
    '--hypothesis-id',
    '--investigation-source-root',
    '--out-root',
    '--invocation-ref',
    '--contract-version',
  ]);

  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    if (!allowed.has(flag)) throw new Error(`unknown argument: ${flag}`);
    if (values.has(flag)) throw new Error(`duplicate argument: ${flag}`);
    values.set(flag, requireValue(argv, index, flag));
  }

  if (!values.has('--run-ref')) throw new Error('missing required argument: --run-ref');
  if (!values.has('--hypothesis-id')) {
    throw new Error('missing required argument: --hypothesis-id');
  }

  const contractVersionRaw = values.get('--contract-version');
  let contractVersion: ModificationWorkContractVersion | undefined;
  if (contractVersionRaw !== undefined) {
    if (contractVersionRaw !== 'v1' && contractVersionRaw !== 'v2') {
      throw new Error(`--contract-version must be v1 or v2, got ${contractVersionRaw}`);
    }
    contractVersion = contractVersionRaw;
  }

  return {
    runRef: values.get('--run-ref')!,
    hypothesisId: values.get('--hypothesis-id')!,
    ...(values.has('--investigation-source-root')
      ? { investigationSourceRoot: values.get('--investigation-source-root')! }
      : {}),
    ...(values.has('--out-root') ? { outRoot: values.get('--out-root')! } : {}),
    ...(values.has('--invocation-ref')
      ? { invocationRef: values.get('--invocation-ref')! }
      : {}),
    ...(contractVersion !== undefined ? { contractVersion } : {}),
  };
}

async function main(argv: string[]): Promise<void> {
  await loadDotEnvIfPresent();
  const args = parseCliArgs(argv);
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY is required');
  const result = await runModificationWork({
    runRef: args.runRef,
    hypothesisId: args.hypothesisId,
    apiKey,
    ...(args.investigationSourceRoot !== undefined
      ? { investigationSourceRoot: args.investigationSourceRoot }
      : {}),
    ...(args.outRoot !== undefined ? { outRoot: args.outRoot } : {}),
    ...(args.invocationRef !== undefined ? { invocationRef: args.invocationRef } : {}),
    ...(args.contractVersion !== undefined ? { contractVersion: args.contractVersion } : {}),
  });
  process.stdout.write(`${canonicalJson(result)}\n`);
}

const executedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === executedPath) {
  main(process.argv.slice(2)).catch(error => {
    console.error(error);
    process.exit(1);
  });
}
