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
import { parseModificationWorkResult } from '../../src/evolution/modificationWorkContract';
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
      id: 'chatcmpl_mw_loop_001',
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
      responseId: 'chatcmpl_mw_loop_001',
      model: DEEPSEEK_MODIFICATION_WORK_MODEL,
      httpStatus: 200,
      rawProviderResponse,
      rawParticipantResponse: participantJson,
    };
  };
}

function proposalJson(scopeRef: string, evidenceRef: string): string {
  return JSON.stringify({
    kind: 'proposal',
    proposedChange: '让婚姻选择后仍能看见放弃的情感线索。',
    scopeRefs: [scopeRef],
    evidenceRefs: [evidenceRef],
    expectedPlayerObservableDifference: '后续家庭事件仍出现与明月相关的可见后果。',
    unknowns: ['单次 run 不能证明多数玩家都需要这条补偿。'],
    risks: ['可能把一次主观遗憾做成强制道德说教。'],
    nonGoals: ['不改结局判定'],
  });
}

export async function runModificationWorkLoopTests(): Promise<void> {
  await testCompletedProposal();
  await testNoProposalCompleted();
  await testInvalidEvidenceRefFails();
  await testInvalidScopeRefFails();
  await testProviderFailure();
  await testParseFailure();
  await testNoReplaceBeforeInvoke();
  await testParticipantInputBoundary();
  await testHumanReviewSemantics();
}

async function testCompletedProposal(): Promise<void> {
  const investigationRoot = await mkdtemp(join(tmpdir(), 'wuxia-mw-loop-inv-a-'));
  const outRoot = await mkdtemp(join(tmpdir(), 'wuxia-mw-loop-out-a-'));
  const runRef = 'mw-loop-one';
  await writeCompletedInvestigation({ sourceRoot: investigationRoot, runRef });
  const capture: Capture = { callCount: 0 };

  const result = await runModificationWork(
    {
      runRef,
      hypothesisId: HYPOTHESIS_ID,
      investigationSourceRoot: investigationRoot,
      outRoot,
      apiKey: API_KEY,
    },
    {
      invoke: successInvoke(() => proposalJson(
        'current-catalog:family_marriage',
        'feedback:observations[3]',
      ), capture),
    },
  );

  assert.equal(capture.callCount, 1);
  assert.equal(result.runRef, runRef);
  assert.equal(result.hypothesisId, HYPOTHESIS_ID);
  assert.equal(result.status, 'completed');
  assert.equal(result.resultKind, 'proposal');

  for (const name of [
    'source-investigation.json',
    'source-investigation-invocation.json',
    'source-investigation-evidence.json',
    'modification-work-input.json',
    'raw-provider-response.txt',
    'raw-participant-response.txt',
    'modification-work.json',
    'invocation.json',
    'human-review.md',
  ]) {
    assert.equal(await pathExists(join(result.modificationWorkDir, name)), true, name);
  }

  const parsed = parseModificationWorkResult(
    await readFile(join(result.modificationWorkDir, 'raw-participant-response.txt'), 'utf8'),
  );
  assert.equal(parsed.kind, 'proposal');
  const invocation = JSON.parse(
    await readFile(join(result.modificationWorkDir, 'invocation.json'), 'utf8'),
  ) as { status: string; resultKind?: string };
  assert.equal(invocation.status, 'completed');
  assert.equal(invocation.resultKind, 'proposal');
}

async function testNoProposalCompleted(): Promise<void> {
  const investigationRoot = await mkdtemp(join(tmpdir(), 'wuxia-mw-loop-inv-b-'));
  const outRoot = await mkdtemp(join(tmpdir(), 'wuxia-mw-loop-out-b-'));
  const runRef = 'mw-loop-none';
  await writeCompletedInvestigation({ sourceRoot: investigationRoot, runRef });
  const capture: Capture = { callCount: 0 };

  const result = await runModificationWork(
    {
      runRef,
      hypothesisId: HYPOTHESIS_ID,
      investigationSourceRoot: investigationRoot,
      outRoot,
      apiKey: API_KEY,
    },
    {
      invoke: successInvoke(() => JSON.stringify({
        kind: 'no_proposal',
        reason: '当前 evidence 不足以提出一项 bounded 修改工作。',
      }), capture),
    },
  );

  assert.equal(result.status, 'completed');
  assert.equal(result.resultKind, 'no_proposal');
  const invocation = JSON.parse(
    await readFile(join(result.modificationWorkDir, 'invocation.json'), 'utf8'),
  ) as { status: string; resultKind?: string };
  assert.equal(invocation.status, 'completed');
  assert.equal(invocation.resultKind, 'no_proposal');
  assert.equal(await pathExists(join(result.modificationWorkDir, 'modification-work.json')), true);
}

async function testInvalidEvidenceRefFails(): Promise<void> {
  const investigationRoot = await mkdtemp(join(tmpdir(), 'wuxia-mw-loop-inv-c-'));
  const outRoot = await mkdtemp(join(tmpdir(), 'wuxia-mw-loop-out-c-'));
  const runRef = 'mw-loop-bad-evidence';
  await writeCompletedInvestigation({ sourceRoot: investigationRoot, runRef });
  const capture: Capture = { callCount: 0 };
  const participantJson = proposalJson(
    'current-catalog:family_marriage',
    'source-catalog:not-real',
  );

  await assert.rejects(
    () => runModificationWork(
      {
        runRef,
        hypothesisId: HYPOTHESIS_ID,
        investigationSourceRoot: investigationRoot,
        outRoot,
        apiKey: API_KEY,
      },
      { invoke: successInvoke(() => participantJson, capture) },
    ),
    /source-catalog:not-real|unknown evidence/i,
  );

  const dir = join(outRoot, 'modification-work-runs', runRef, HYPOTHESIS_ID);
  assert.equal(await readFile(join(dir, 'raw-participant-response.txt'), 'utf8'), participantJson);
  assert.equal(await pathExists(join(dir, 'modification-work.json')), false);
  const invocation = JSON.parse(await readFile(join(dir, 'invocation.json'), 'utf8')) as {
    status: string;
    errorKind?: string;
  };
  assert.equal(invocation.status, 'failed');
  assert.equal(invocation.errorKind, 'invalid_reference');
}

async function testInvalidScopeRefFails(): Promise<void> {
  const investigationRoot = await mkdtemp(join(tmpdir(), 'wuxia-mw-loop-inv-d-'));
  const outRoot = await mkdtemp(join(tmpdir(), 'wuxia-mw-loop-out-d-'));
  const runRef = 'mw-loop-bad-scope';
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
      },
      {
        invoke: successInvoke(() => proposalJson(
          'source-catalog:family_marriage',
          'feedback:observations[3]',
        ), capture),
      },
    ),
    /source-catalog:family_marriage|unknown scope|current-product/i,
  );

  const dir = join(outRoot, 'modification-work-runs', runRef, HYPOTHESIS_ID);
  const invocation = JSON.parse(await readFile(join(dir, 'invocation.json'), 'utf8')) as {
    status: string;
    errorKind?: string;
  };
  assert.equal(invocation.status, 'failed');
  assert.equal(invocation.errorKind, 'invalid_reference');
}

async function testProviderFailure(): Promise<void> {
  const investigationRoot = await mkdtemp(join(tmpdir(), 'wuxia-mw-loop-inv-e-'));
  const outRoot = await mkdtemp(join(tmpdir(), 'wuxia-mw-loop-out-e-'));
  const runRef = 'mw-loop-provider-fail';
  await writeCompletedInvestigation({ sourceRoot: investigationRoot, runRef });
  const rawProviderResponse = '{"error":"temporary"}';

  await assert.rejects(
    () => runModificationWork(
      {
        runRef,
        hypothesisId: HYPOTHESIS_ID,
        investigationSourceRoot: investigationRoot,
        outRoot,
        apiKey: API_KEY,
      },
      {
        invoke: async () => ({
          ok: false,
          errorKind: 'http',
          message: 'DeepSeek HTTP 503',
          httpStatus: 503,
          rawProviderResponse,
        }),
      },
    ),
    /provider|http|503/i,
  );

  const dir = join(outRoot, 'modification-work-runs', runRef, HYPOTHESIS_ID);
  assert.equal(await readFile(join(dir, 'raw-provider-response.txt'), 'utf8'), rawProviderResponse);
  assert.equal(await pathExists(join(dir, 'modification-work.json')), false);
  const invocation = JSON.parse(await readFile(join(dir, 'invocation.json'), 'utf8')) as {
    status: string;
    errorKind?: string;
  };
  assert.equal(invocation.status, 'failed');
  assert.equal(invocation.errorKind, 'provider');
}

async function testParseFailure(): Promise<void> {
  const investigationRoot = await mkdtemp(join(tmpdir(), 'wuxia-mw-loop-inv-f-'));
  const outRoot = await mkdtemp(join(tmpdir(), 'wuxia-mw-loop-out-f-'));
  const runRef = 'mw-loop-parse-fail';
  await writeCompletedInvestigation({ sourceRoot: investigationRoot, runRef });
  const capture: Capture = { callCount: 0 };
  const badJson = '{"kind":"proposal"}';

  await assert.rejects(
    () => runModificationWork(
      {
        runRef,
        hypothesisId: HYPOTHESIS_ID,
        investigationSourceRoot: investigationRoot,
        outRoot,
        apiKey: API_KEY,
      },
      { invoke: successInvoke(() => badJson, capture) },
    ),
    /missing required field|unknown field|must/i,
  );

  const dir = join(outRoot, 'modification-work-runs', runRef, HYPOTHESIS_ID);
  assert.equal(await readFile(join(dir, 'raw-participant-response.txt'), 'utf8'), badJson);
  const invocation = JSON.parse(await readFile(join(dir, 'invocation.json'), 'utf8')) as {
    status: string;
    errorKind?: string;
  };
  assert.equal(invocation.status, 'failed');
  assert.equal(invocation.errorKind, 'parse');
}

async function testNoReplaceBeforeInvoke(): Promise<void> {
  const investigationRoot = await mkdtemp(join(tmpdir(), 'wuxia-mw-loop-inv-g-'));
  const outRoot = await mkdtemp(join(tmpdir(), 'wuxia-mw-loop-out-g-'));
  const runRef = 'mw-loop-noreplace';
  await writeCompletedInvestigation({ sourceRoot: investigationRoot, runRef });
  const capture: Capture = { callCount: 0 };
  const options = {
    runRef,
    hypothesisId: HYPOTHESIS_ID,
    investigationSourceRoot: investigationRoot,
    outRoot,
    apiKey: API_KEY,
  };

  await runModificationWork(options, {
    invoke: successInvoke(() => JSON.stringify({
      kind: 'no_proposal',
      reason: '材料不足。',
    }), capture),
  });
  assert.equal(capture.callCount, 1);

  await assert.rejects(
    () => runModificationWork(options, {
      invoke: successInvoke(() => JSON.stringify({
        kind: 'no_proposal',
        reason: '材料不足。',
      }), capture),
    }),
    /already exists/i,
  );
  assert.equal(capture.callCount, 1, 'second run must fail before provider invoke');
}

async function testParticipantInputBoundary(): Promise<void> {
  const investigationRoot = await mkdtemp(join(tmpdir(), 'wuxia-mw-loop-inv-h-'));
  const outRoot = await mkdtemp(join(tmpdir(), 'wuxia-mw-loop-out-h-'));
  const runRef = 'mw-loop-boundary';
  await writeCompletedInvestigation({ sourceRoot: investigationRoot, runRef });
  const capture: Capture = { callCount: 0 };

  await runModificationWork(
    {
      runRef,
      hypothesisId: HYPOTHESIS_ID,
      investigationSourceRoot: investigationRoot,
      outRoot,
      apiKey: API_KEY,
    },
    {
      invoke: successInvoke(() => JSON.stringify({
        kind: 'no_proposal',
        reason: '材料不足。',
      }), capture),
    },
  );

  assert.ok(capture.participantInputBytes);
  const captured = capture.participantInputBytes!;
  assert.equal(captured.includes('hypothesis-000001'), false);
  assert.equal(captured.includes('sourceFingerprint'), false);
  assert.equal(captured.includes('docs/PRD'), false);
  assert.equal(captured.includes('.git'), false);
  assert.equal(captured.includes('src/data'), false);
  assert.equal(captured.includes('AE-SKELETON'), false);
  assert.doesNotMatch(captured, /scripts\/evolution|src\/evolution/);
  assert.ok(captured.includes('hypothesis-000002'));
  assert.ok(captured.includes('current-catalog:family_marriage'));
}

async function testHumanReviewSemantics(): Promise<void> {
  const investigationRoot = await mkdtemp(join(tmpdir(), 'wuxia-mw-loop-inv-i-'));
  const outRoot = await mkdtemp(join(tmpdir(), 'wuxia-mw-loop-out-i-'));
  const runRef = 'mw-loop-review';
  await writeCompletedInvestigation({ sourceRoot: investigationRoot, runRef });
  const capture: Capture = { callCount: 0 };

  const result = await runModificationWork(
    {
      runRef,
      hypothesisId: HYPOTHESIS_ID,
      investigationSourceRoot: investigationRoot,
      outRoot,
      apiKey: API_KEY,
    },
    {
      invoke: successInvoke(() => proposalJson(
        'current-catalog:family_marriage',
        'feedback:observations[3]',
      ), capture),
    },
  );

  const report = await readFile(result.humanReportPath, 'utf8');
  assert.match(report, /hypothesis-000002|selected hypothesis|选定 hypothesis/i);
  assert.match(report, /proposedChange|proposed change|拟议修改/i);
  assert.match(report, /scopeRefs|current-catalog:family_marriage/);
  assert.match(report, /evidenceRefs|feedback:observations\[3\]/);
  assert.match(report, /expectedPlayerObservableDifference|玩家可见/i);
  assert.match(report, /unknowns|未知/);
  assert.match(report, /risks|风险/);
  assert.match(report, /nonGoals|非目标/);
  assert.match(report, /不是产品真理|not product truth|≠ product truth/i);
  assert.match(report, /不是自动修改命令|not.*modification command/i);
  assert.match(report, /≠ accepted product change|accepted product change/i);
  assert.match(report, /≠ executable PRD|executable PRD/i);
  assert.match(report, /≠ authorization to modify Wuxia-Life|authorization to modify/i);
  assert.match(report, /realCallCount: 1/);
  assert.match(report, /根据 bounded Investigation 形成|有意义地接受或拒绝/);
  assert.match(report, /不是：这个具体游戏设计是否一定正确/);
  assert.match(report, /接受进入后续|拒绝|需要更多/);
  assert.match(report, /STOP/);
  assert.match(report, /executable PRD|不生成 executable PRD|不得.*PRD/i);
  assert.match(report, /Candidate|不生成 Candidate/i);
  assert.match(report, /Phase 0|不运行 Phase 0/i);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runModificationWorkLoopTests()
    .then(() => console.log('modificationWorkLoop.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
