import assert from 'node:assert/strict';
import { mkdtemp, readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  DEEPSEEK_MODIFICATION_WORK_MODEL,
  type DeepSeekModificationWorkFailure,
  type DeepSeekModificationWorkSuccess,
} from '../../scripts/evolution/modificationWork/deepseekModificationWork';
import { runModificationWork } from '../../scripts/evolution/runModificationWork';
import { projectInvestigationHandoff } from '../../src/evolution/investigationHandoff';
import { parseModificationWorkResultV2 } from '../../src/evolution/modificationWorkContract';
import { writeCompletedInvestigation } from './modificationWorkSource.test';

const API_KEY = 'sk-test-key-not-real';
const HYPOTHESIS_ID = 'hypothesis-000002';

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

type InvokeInput = {
  apiKey: string;
  invocationRef: string;
  runRef: string;
  hypothesisId: string;
  investigationInvocationRef: string;
  experimentRootHash: string;
  evidencePackHash: string;
  investigationHash: string;
  participantInputBytes: string;
  instructions?: string;
};

type Capture = Partial<InvokeInput> & { callCount: number };

function successInvoke(
  buildParticipantJson: (input: InvokeInput) => string,
  capture: Capture,
): (input: InvokeInput) => Promise<
  DeepSeekModificationWorkSuccess | DeepSeekModificationWorkFailure
> {
  return async input => {
    capture.callCount += 1;
    Object.assign(capture, input);
    const participantJson = buildParticipantJson(input);
    const rawProviderResponse = JSON.stringify({
      id: 'chatcmpl_mw_v2_001',
      object: 'chat.completion',
      model: DEEPSEEK_MODIFICATION_WORK_MODEL,
      choices: [{
        index: 0,
        message: { role: 'assistant', content: participantJson },
        finish_reason: 'stop',
      }],
    });
    return {
      ok: true,
      responseId: 'chatcmpl_mw_v2_001',
      model: DEEPSEEK_MODIFICATION_WORK_MODEL,
      httpStatus: 200,
      rawProviderResponse,
      rawParticipantResponse: participantJson,
    };
  };
}

function proposalV2Json(input: {
  scopeRef: string;
  evidenceRef: string;
  basisRefs: string[];
  unresolvedDependencyRefs?: string[];
  assumptions?: Array<{ statement: string; relatedInvestigationRefs: string[] }>;
}): string {
  return JSON.stringify({
    kind: 'proposal',
    proposedChange: '让婚姻选择后仍能看见放弃的情感线索。',
    scopeRefs: [input.scopeRef],
    evidenceRefs: [input.evidenceRef],
    investigationBasisRefs: input.basisRefs,
    unresolvedDependencyRefs: input.unresolvedDependencyRefs ?? [],
    assumptions: input.assumptions ?? [],
    expectedPlayerObservableDifference: '后续家庭事件仍出现与明月相关的可见后果。',
    risks: [],
    nonGoals: ['不改结局判定'],
  });
}

function handoffFromCapture(capture: Capture) {
  const parsed = JSON.parse(capture.participantInputBytes ?? '{}') as {
    investigationHandoff: { items: Array<{ ref: string; kind: string; statement: string }> };
  };
  return parsed.investigationHandoff;
}

export async function runModificationWorkV2LoopTests(): Promise<void> {
  await testV2CompletedProposal();
  await testV2NoProposalCompleted();
  await testV2InvalidBasisFails();
  await testV2InvalidUnresolvedDependencyFails();
  await testV2ProviderFailure();
  await testV2ParseFailure();
  await testV2NoReplaceBeforeInvoke();
  await testV2ParticipantInputBoundary();
  await testV2HumanReviewSemantics();
}

async function testV2CompletedProposal(): Promise<void> {
  const investigationRoot = await mkdtemp(join(tmpdir(), 'wuxia-mw-v2-a-'));
  const outRoot = await mkdtemp(join(tmpdir(), 'wuxia-mw-v2-out-a-'));
  const runRef = 'mw-v2-one';
  await writeCompletedInvestigation({ sourceRoot: investigationRoot, runRef });
  const capture: Capture = { callCount: 0 };

  const result = await runModificationWork(
    {
      runRef,
      hypothesisId: HYPOTHESIS_ID,
      investigationSourceRoot: investigationRoot,
      outRoot,
      apiKey: API_KEY,
      contractVersion: 'v2',
    },
    {
      invoke: successInvoke(input => {
        const handoff = JSON.parse(input.participantInputBytes).investigationHandoff;
        const basis = handoff.items.find((i: { kind: string }) => i.kind === 'confirmed_fact').ref;
        return proposalV2Json({
          scopeRef: 'current-catalog:family_marriage',
          evidenceRef: 'feedback:observations[3]',
          basisRefs: [basis],
        });
      }, capture),
    },
  );

  assert.equal(capture.callCount, 1);
  assert.equal(result.contractVersion, 'v2');
  assert.equal(result.status, 'completed');
  assert.equal(result.resultKind, 'proposal');
  assert.match(result.modificationWorkInvocationRef, /modification-work-uncertainty-001$/);

  const invocation = JSON.parse(
    await readFile(join(result.modificationWorkDir, 'invocation.json'), 'utf8'),
  ) as { schemaVersion: string; contractVersion?: string };
  assert.equal(invocation.schemaVersion, 'modification-work-invocation-v2');
  assert.equal(invocation.contractVersion, 'v2');

  const parsed = parseModificationWorkResultV2(
    await readFile(join(result.modificationWorkDir, 'modification-work.json'), 'utf8'),
  );
  assert.equal(parsed.kind, 'proposal');
}

async function testV2NoProposalCompleted(): Promise<void> {
  const investigationRoot = await mkdtemp(join(tmpdir(), 'wuxia-mw-v2-b-'));
  const outRoot = await mkdtemp(join(tmpdir(), 'wuxia-mw-v2-out-b-'));
  const runRef = 'mw-v2-two';
  await writeCompletedInvestigation({ sourceRoot: investigationRoot, runRef });
  const capture: Capture = { callCount: 0 };

  const result = await runModificationWork(
    {
      runRef,
      hypothesisId: HYPOTHESIS_ID,
      investigationSourceRoot: investigationRoot,
      outRoot,
      apiKey: API_KEY,
      contractVersion: 'v2',
    },
    {
      invoke: successInvoke(
        () => JSON.stringify({ kind: 'no_proposal', reason: '材料不足以提出 bounded proposal。' }),
        capture,
      ),
    },
  );

  assert.equal(capture.callCount, 1);
  assert.equal(result.status, 'completed');
  assert.equal(result.resultKind, 'no_proposal');
}

async function testV2InvalidBasisFails(): Promise<void> {
  const investigationRoot = await mkdtemp(join(tmpdir(), 'wuxia-mw-v2-c-'));
  const outRoot = await mkdtemp(join(tmpdir(), 'wuxia-mw-v2-out-c-'));
  const runRef = 'mw-v2-three';
  await writeCompletedInvestigation({ sourceRoot: investigationRoot, runRef });
  const capture: Capture = { callCount: 0 };

  await assert.rejects(
    () => runModificationWork(
      {
        runRef,
        hypothesisId: HYPOTHESIS_ID,
        investigationSourceRoot: investigationRoot,
        outRoot,
        apiKey: API_KEY,
        contractVersion: 'v2',
      },
      {
        invoke: successInvoke(input => {
          const handoff = handoffFromCapture({ ...capture, participantInputBytes: input.participantInputBytes });
          const unresolved = handoff.items.find(i => i.kind === 'unresolved_question')!.ref;
          return proposalV2Json({
            scopeRef: 'current-catalog:family_marriage',
            evidenceRef: 'feedback:observations[3]',
            basisRefs: [unresolved],
          });
        }, capture),
      },
    ),
    /investigationBasisRefs|unresolved_question/i,
  );
  assert.equal(capture.callCount, 1);
  const invocation = JSON.parse(
    await readFile(
      join(outRoot, 'modification-work-runs', runRef, HYPOTHESIS_ID, 'invocation.json'),
      'utf8',
    ),
  ) as { status: string; errorKind?: string };
  assert.equal(invocation.status, 'failed');
  assert.equal(invocation.errorKind, 'invalid_reference');
}

async function testV2InvalidUnresolvedDependencyFails(): Promise<void> {
  const investigationRoot = await mkdtemp(join(tmpdir(), 'wuxia-mw-v2-d-'));
  const outRoot = await mkdtemp(join(tmpdir(), 'wuxia-mw-v2-out-d-'));
  const runRef = 'mw-v2-four';
  await writeCompletedInvestigation({ sourceRoot: investigationRoot, runRef });
  const capture: Capture = { callCount: 0 };

  await assert.rejects(
    () => runModificationWork(
      {
        runRef,
        hypothesisId: HYPOTHESIS_ID,
        investigationSourceRoot: investigationRoot,
        outRoot,
        apiKey: API_KEY,
        contractVersion: 'v2',
      },
      {
        invoke: successInvoke(input => {
          const handoff = JSON.parse(input.participantInputBytes).investigationHandoff;
          const confirmed = handoff.items.find((i: { kind: string }) => i.kind === 'confirmed_fact').ref;
          const basis = confirmed;
          return proposalV2Json({
            scopeRef: 'current-catalog:family_marriage',
            evidenceRef: 'feedback:observations[3]',
            basisRefs: [basis],
            unresolvedDependencyRefs: [confirmed],
          });
        }, capture),
      },
    ),
    /unresolvedDependencyRefs|confirmed_fact/i,
  );
  assert.equal(capture.callCount, 1);
}

async function testV2ProviderFailure(): Promise<void> {
  const investigationRoot = await mkdtemp(join(tmpdir(), 'wuxia-mw-v2-e-'));
  const outRoot = await mkdtemp(join(tmpdir(), 'wuxia-mw-v2-out-e-'));
  const runRef = 'mw-v2-five';
  await writeCompletedInvestigation({ sourceRoot: investigationRoot, runRef });
  const capture: Capture = { callCount: 0 };

  await assert.rejects(
    () => runModificationWork(
      {
        runRef,
        hypothesisId: HYPOTHESIS_ID,
        investigationSourceRoot: investigationRoot,
        outRoot,
        apiKey: API_KEY,
        contractVersion: 'v2',
      },
      {
        invoke: async input => {
          capture.callCount += 1;
          Object.assign(capture, input);
          return { ok: false, errorKind: 'http', message: 'DeepSeek HTTP 500', httpStatus: 500 };
        },
      },
    ),
    /provider|http/i,
  );
  assert.equal(capture.callCount, 1);
}

async function testV2ParseFailure(): Promise<void> {
  const investigationRoot = await mkdtemp(join(tmpdir(), 'wuxia-mw-v2-f-'));
  const outRoot = await mkdtemp(join(tmpdir(), 'wuxia-mw-v2-out-f-'));
  const runRef = 'mw-v2-six';
  await writeCompletedInvestigation({ sourceRoot: investigationRoot, runRef });
  const capture: Capture = { callCount: 0 };

  await assert.rejects(
    () => runModificationWork(
      {
        runRef,
        hypothesisId: HYPOTHESIS_ID,
        investigationSourceRoot: investigationRoot,
        outRoot,
        apiKey: API_KEY,
        contractVersion: 'v2',
      },
      {
        invoke: successInvoke(() => '{ not-json', capture),
      },
    ),
    /valid JSON|JSON/i,
  );
  assert.equal(capture.callCount, 1);
}

async function testV2NoReplaceBeforeInvoke(): Promise<void> {
  const investigationRoot = await mkdtemp(join(tmpdir(), 'wuxia-mw-v2-g-'));
  const outRoot = await mkdtemp(join(tmpdir(), 'wuxia-mw-v2-out-g-'));
  const runRef = 'mw-v2-seven';
  await writeCompletedInvestigation({ sourceRoot: investigationRoot, runRef });
  const capture: Capture = { callCount: 0 };

  await runModificationWork(
    {
      runRef,
      hypothesisId: HYPOTHESIS_ID,
      investigationSourceRoot: investigationRoot,
      outRoot,
      apiKey: API_KEY,
      contractVersion: 'v2',
    },
    {
      invoke: successInvoke(input => {
        const handoff = JSON.parse(input.participantInputBytes).investigationHandoff;
        const basis = handoff.items.find((i: { kind: string }) => i.kind === 'confirmed_fact').ref;
        return proposalV2Json({
          scopeRef: 'current-catalog:family_marriage',
          evidenceRef: 'feedback:observations[3]',
          basisRefs: [basis],
        });
      }, capture),
    },
  );

  await assert.rejects(
    () => runModificationWork(
      {
        runRef,
        hypothesisId: HYPOTHESIS_ID,
        investigationSourceRoot: investigationRoot,
        outRoot,
        apiKey: API_KEY,
        contractVersion: 'v2',
      },
      {
        invoke: successInvoke(() => {
          throw new Error('provider must not be called twice');
        }, capture),
      },
    ),
    /already exists/i,
  );
  assert.equal(capture.callCount, 1);
}

async function testV2ParticipantInputBoundary(): Promise<void> {
  const investigationRoot = await mkdtemp(join(tmpdir(), 'wuxia-mw-v2-h-'));
  const outRoot = await mkdtemp(join(tmpdir(), 'wuxia-mw-v2-out-h-'));
  const runRef = 'mw-v2-eight';
  const written = await writeCompletedInvestigation({ sourceRoot: investigationRoot, runRef });
  const capture: Capture = { callCount: 0 };

  await runModificationWork(
    {
      runRef,
      hypothesisId: HYPOTHESIS_ID,
      investigationSourceRoot: investigationRoot,
      outRoot,
      apiKey: API_KEY,
      contractVersion: 'v2',
    },
    {
      invoke: successInvoke(input => {
        const handoff = JSON.parse(input.participantInputBytes).investigationHandoff;
        const basis = handoff.items.find((i: { kind: string }) => i.kind === 'confirmed_fact').ref;
        return proposalV2Json({
          scopeRef: 'current-catalog:family_marriage',
          evidenceRef: 'feedback:observations[3]',
          basisRefs: [basis],
        });
      }, capture),
    },
  );

  assert.equal(capture.callCount, 1);
  assert.ok(capture.instructions);
  assert.match(String(capture.instructions), /investigationBasisRefs/);

  const input = JSON.parse(capture.participantInputBytes!) as Record<string, unknown>;
  assert.equal(input.schemaVersion, 'modification-work-input-v2');
  assert.equal(input.runRef, runRef);
  assert.equal(input.hypothesisId, HYPOTHESIS_ID);
  assert.ok(input.selectedHypothesis);
  assert.ok(input.evidencePack);
  assert.ok(input.investigationHandoff);
  assert.equal(input.investigation, undefined);

  const handoff = input.investigationHandoff as ReturnType<typeof projectInvestigationHandoff>;
  assert.ok(handoff.items.some(i => i.ref === 'investigation:confirmed-fact:000001'));
  assert.ok(handoff.items.some(i => i.kind === 'unresolved_question'));

  const serialized = capture.participantInputBytes!;
  const instructions = String(capture.instructions);
  for (const forbidden of [
    'REJECT_PROPOSAL',
    'ACCEPT_PROPOSAL',
    'modification-work.json',
    'human-review.md',
    'raw-participant-response',
    'Candidate generation',
    'docs/superpowers',
    'src/evolution',
    '.git/',
    'warning / confirmation 不值得做',
    '正确结果应该是 no_proposal',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `input leaked ${forbidden}`);
    assert.equal(instructions.includes(forbidden), false, `instructions leaked ${forbidden}`);
  }

  assert.equal(input.investigationHash, written.investigationHash);
  assert.equal(input.evidencePackHash, written.evidencePackHash);
}

async function testV2HumanReviewSemantics(): Promise<void> {
  const investigationRoot = await mkdtemp(join(tmpdir(), 'wuxia-mw-v2-i-'));
  const outRoot = await mkdtemp(join(tmpdir(), 'wuxia-mw-v2-out-i-'));
  const runRef = 'mw-v2-nine';
  await writeCompletedInvestigation({ sourceRoot: investigationRoot, runRef });
  const capture: Capture = { callCount: 0 };

  const result = await runModificationWork(
    {
      runRef,
      hypothesisId: HYPOTHESIS_ID,
      investigationSourceRoot: investigationRoot,
      outRoot,
      apiKey: API_KEY,
      contractVersion: 'v2',
    },
    {
      invoke: successInvoke(input => {
        const handoff = JSON.parse(input.participantInputBytes).investigationHandoff;
        const basis = handoff.items.find((i: { kind: string }) => i.kind === 'confirmed_fact').ref;
        const unresolved = handoff.items.find((i: { kind: string }) => i.kind === 'unresolved_question')?.ref;
        return proposalV2Json({
          scopeRef: 'current-catalog:family_marriage',
          evidenceRef: 'feedback:observations[3]',
          basisRefs: [basis],
          unresolvedDependencyRefs: unresolved ? [unresolved] : [],
          assumptions: [{
            statement: '玩家会把可见后果理解为对选择的反馈。',
            relatedInvestigationRefs: unresolved ? [unresolved] : [],
          }],
        });
      }, capture),
    },
  );

  const review = await readFile(result.humanReportPath, 'utf8');
  assert.match(review, /UNCERTAINTY_PRESERVED/);
  assert.match(review, /UNCERTAINTY_NOT_PRESERVED/);
  assert.match(review, /This experiment does NOT authorize Candidate generation/);
  assert.doesNotMatch(review, /ACCEPT_PROPOSAL/);
  assert.doesNotMatch(review, /REJECT_PROPOSAL/);
  assert.match(review, /investigationBasisRefs/);
  assert.match(review, /unresolvedDependencyRefs/);
  assert.match(review, /assumptions/);
  assert.equal(await pathExists(join(result.modificationWorkDir, 'human-review.md')), true);
}
