import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadModificationWorkSource } from '../../scripts/evolution/modificationWork/loadModificationWorkSource';
import { canonicalJson, sha256Hex } from '../../scripts/evolution/phase0/provenance';

const RUN_REF = 'mw-src-one';
const HYPOTHESIS_ID = 'hypothesis-000002';

function selectedHypothesis() {
  return {
    hypothesisId: HYPOTHESIS_ID,
    hypothesis: '婚姻选择可能造成持久遗憾感。',
    observedBasis: 'participant 明确提到遗憾。',
    feedbackRefs: ['observations[3]'],
    evidenceRefs: ['entry-000037'],
    unknowns: ['是否多数玩家有同样反应。'],
    productSignificance: '可能影响结局满意度。',
  };
}

function evidencePack(input: {
  runRef: string;
  hypothesisInvocationRef: string;
  experimentRootHash: string;
  observablePayloadHash: string;
}) {
  return {
    schemaVersion: 'hypothesis-investigation-evidence-v1',
    runRef: input.runRef,
    hypothesisId: HYPOTHESIS_ID,
    hypothesisInvocationRef: input.hypothesisInvocationRef,
    experimentRootHash: input.experimentRootHash,
    observablePayloadHash: input.observablePayloadHash,
    selectedHypothesis: selectedHypothesis(),
    storyLines: ['love_story'],
    items: [
      {
        evidenceId: 'current-catalog:family_marriage',
        authority: 'current_product',
        kind: 'catalog_event',
        payload: { id: 'family_marriage' },
      },
      {
        evidenceId: 'source-catalog:family_marriage',
        authority: 'source_run',
        kind: 'catalog_event',
        payload: { id: 'family_marriage' },
      },
      {
        evidenceId: 'feedback:observations[3]',
        authority: 'participant_source',
        kind: 'feedback',
        payload: { feedbackRef: 'observations[3]', text: '婚姻选择留下遗憾。' },
      },
    ],
  };
}

function investigationResult() {
  return {
    confirmedFacts: [{
      statement: '本次 run 选择了 marry_arranged。',
      evidenceRefs: ['source-catalog:family_marriage'],
    }],
    relevantMechanisms: [{
      statement: 'family_marriage 提供迎娶明月与门当户对选项。',
      evidenceRefs: ['current-catalog:family_marriage'],
    }],
    limitingEvidence: [],
    unresolvedQuestions: ['单次 run 不能判断多数玩家。'],
    evidenceGaps: [],
  };
}

export async function writeCompletedInvestigation(input: {
  sourceRoot: string;
  runRef?: string;
  status?: 'completed' | 'failed';
  tamperEvidenceHash?: boolean;
}): Promise<{
  sourceRoot: string;
  runRef: string;
  evidencePackHash: string;
  selectedHypothesisHash: string;
  hypothesesHash: string;
  investigationHash: string;
}> {
  const runRef = input.runRef ?? RUN_REF;
  const dir = join(input.sourceRoot, 'investigation-runs', runRef, HYPOTHESIS_ID);
  await mkdir(dir, { recursive: true });

  const experimentRootHash = 'a'.repeat(64);
  const observablePayloadHash = 'b'.repeat(64);
  const feedbackHash = 'c'.repeat(64);
  const hypothesisInvocationRef = `${runRef}-deepseek-improvement-hypothesis-001`;
  const pack = evidencePack({
    runRef,
    hypothesisInvocationRef,
    experimentRootHash,
    observablePayloadHash,
  });
  const evidenceBytes = canonicalJson(pack);
  const evidencePackHash = sha256Hex(evidenceBytes);
  const selectedHypothesisHash = sha256Hex(canonicalJson(selectedHypothesis()));
  const sourceHypotheses = {
    hypotheses: [
      { ...selectedHypothesis(), hypothesisId: 'hypothesis-000001' },
      selectedHypothesis(),
    ],
  };
  // keep hash over exact file bytes we write
  const sourceHypothesesBytes = canonicalJson(sourceHypotheses);
  const hypothesesHash = sha256Hex(sourceHypothesesBytes);
  const investigationBytes = canonicalJson(investigationResult());
  const investigationHash = sha256Hex(investigationBytes);

  const invocation = {
    schemaVersion: 'hypothesis-investigation-invocation-v1',
    runRef,
    hypothesisId: HYPOTHESIS_ID,
    feedbackInvocationRef: `${runRef}-deepseek-player-feedback-001`,
    hypothesisInvocationRef,
    investigationInvocationRef: `${runRef}-${HYPOTHESIS_ID}-deepseek-hypothesis-investigation-001`,
    experimentRootHash,
    observablePayloadHash,
    feedbackHash,
    hypothesesHash,
    selectedHypothesisHash,
    evidencePackHash: input.tamperEvidenceHash ? 'd'.repeat(64) : evidencePackHash,
    participant: {
      kind: 'llm',
      provider: 'deepseek',
      modelRequested: 'deepseek-v4-flash',
    },
    status: input.status ?? 'completed',
  };

  await writeFile(join(dir, 'investigation-evidence.json'), evidenceBytes);
  await writeFile(join(dir, 'investigation.json'), investigationBytes);
  await writeFile(join(dir, 'invocation.json'), canonicalJson(invocation));
  await writeFile(join(dir, 'source-hypotheses.json'), sourceHypothesesBytes);
  await writeFile(
    join(dir, 'source-hypothesis-invocation.json'),
    canonicalJson({ schemaVersion: 'improvement-hypothesis-invocation-v1' }),
  );

  return {
    sourceRoot: input.sourceRoot,
    runRef,
    evidencePackHash,
    selectedHypothesisHash,
    hypothesesHash,
    investigationHash,
  };
}

export async function runModificationWorkSourceTests(): Promise<void> {
  await testLoadsCompletedInvestigation();
  await testRejectsFailedInvestigation();
  await testRejectsHashMismatch();
  await testRejectsMissingTarget();
}

async function testLoadsCompletedInvestigation(): Promise<void> {
  const sourceRoot = await mkdtemp(join(tmpdir(), 'wuxia-mw-src-ok-'));
  const written = await writeCompletedInvestigation({ sourceRoot });
  const loaded = await loadModificationWorkSource({
    investigationSourceRoot: sourceRoot,
    runRef: RUN_REF,
    hypothesisId: HYPOTHESIS_ID,
  });

  assert.equal(loaded.runRef, RUN_REF);
  assert.equal(loaded.hypothesisId, HYPOTHESIS_ID);
  assert.equal(loaded.status, 'completed');
  assert.equal(loaded.evidencePackHash, written.evidencePackHash);
  assert.equal(loaded.selectedHypothesisHash, written.selectedHypothesisHash);
  assert.equal(loaded.hypothesesHash, written.hypothesesHash);
  assert.equal(loaded.investigationHash, written.investigationHash);
  assert.equal(loaded.selectedHypothesis.hypothesisId, HYPOTHESIS_ID);
  assert.equal(loaded.investigation.confirmedFacts.length, 1);
  assert.ok(loaded.allowedScopeRefs.has('current-catalog:family_marriage'));
  assert.equal(loaded.allowedScopeRefs.has('source-catalog:family_marriage'), false);
  assert.ok(loaded.allowedEvidenceRefs.has('feedback:observations[3]'));
  assert.ok(loaded.allowedEvidenceRefs.has('source-catalog:family_marriage'));
}

async function testRejectsFailedInvestigation(): Promise<void> {
  const sourceRoot = await mkdtemp(join(tmpdir(), 'wuxia-mw-src-fail-'));
  await writeCompletedInvestigation({ sourceRoot, status: 'failed' });
  await assert.rejects(
    () => loadModificationWorkSource({
      investigationSourceRoot: sourceRoot,
      runRef: RUN_REF,
      hypothesisId: HYPOTHESIS_ID,
    }),
    /completed/i,
  );
}

async function testRejectsHashMismatch(): Promise<void> {
  const sourceRoot = await mkdtemp(join(tmpdir(), 'wuxia-mw-src-hash-'));
  await writeCompletedInvestigation({ sourceRoot, tamperEvidenceHash: true });
  await assert.rejects(
    () => loadModificationWorkSource({
      investigationSourceRoot: sourceRoot,
      runRef: RUN_REF,
      hypothesisId: HYPOTHESIS_ID,
    }),
    /evidencePackHash|hash mismatch/i,
  );
}

async function testRejectsMissingTarget(): Promise<void> {
  const sourceRoot = await mkdtemp(join(tmpdir(), 'wuxia-mw-src-missing-'));
  await assert.rejects(
    () => loadModificationWorkSource({
      investigationSourceRoot: sourceRoot,
      runRef: 'does-not-exist',
      hypothesisId: HYPOTHESIS_ID,
    }),
    /ENOENT|not found|missing/i,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runModificationWorkSourceTests()
    .then(() => console.log('modificationWorkSource.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
