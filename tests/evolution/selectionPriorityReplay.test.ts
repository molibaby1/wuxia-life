import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildSelectionPriorityReplayCase,
  buildSelectionPriorityReplayPresentation,
  prepareSelectionPriorityReplayCorpus,
  parseSelectionPriorityReplayResult,
  type SelectionPriorityReplayPresentation,
} from '../../scripts/evolution/selectionPriorityReplay/selectionPriorityReplay';

function hypothesis(id: string, label: string) {
  return {
    hypothesisId: id,
    hypothesis: `问题 ${label}`,
    observedBasis: `依据 ${label}`,
    feedbackRefs: [`observations[${label}]`],
    evidenceRefs: [`entry-${label}`],
    unknowns: [`未知 ${label}`],
    productSignificance: `意义 ${label}`,
  };
}

async function writeJson(root: string, name: string, value: unknown): Promise<string> {
  const path = join(root, name);
  await writeFile(path, JSON.stringify(value));
  return path;
}

function reportFor(
  sessionId: string,
  hypotheses: unknown[],
  options: { status?: string; selectedHypothesisId?: string; multiRoundRunRef?: string } = {},
) {
  return {
    sessionExecution: { multiRoundRunRef: options.multiRoundRunRef ?? sessionId },
    workflows: [{
      sourceRunRef: sessionId,
      decisionAudit: {
        improvementHypothesis: {
          status: options.status ?? 'completed',
          artifactRef: 'hypotheses.json',
          hypothesisCount: hypotheses.length,
          hypotheses,
          noProblemAssessment: null,
        },
        selection: { selectedHypothesisId: options.selectedHypothesisId ?? 'hypothesis-000001' },
      },
    }],
  };
}

function validResult(presentation: SelectionPriorityReplayPresentation) {
  const candidate = presentation.candidates[0];
  return {
    schemaVersion: 'ae-selection-replay-result-v1',
    caseId: presentation.caseId,
    presentationId: presentation.presentationId,
    sourceHypothesesSha256: presentation.sourceHypothesesSha256,
    presentationSha256: presentation.presentationSha256,
    selected: {
      sourceIndex: candidate.sourceIndex,
      sourceHypothesisId: candidate.sourceHypothesisId,
      sourceHypothesisSha256: candidate.sourceHypothesisSha256,
    },
    rationale: {
      productMateriality: '实质影响。',
      evidenceReadiness: '已有足够观察依据。',
      investigationLeverage: '一次 bounded investigation 能减少不确定性。',
      problemSpecificity: '可形成一个集中 investigation job。',
      overallReason: '该候选最值得投入本轮调查预算。',
    },
    createdAt: '2026-09-11T00:00:00.000Z',
  };
}

export async function runSelectionPriorityReplayTests(): Promise<void> {
  // Presentations preserve source identity and semantic content while changing only order.
  {
    const root = await mkdtemp(join(tmpdir(), 'selection-priority-replay-'));
    const hypotheses = [hypothesis('hypothesis-000001', 'A'), hypothesis('hypothesis-000002', 'B')];
    const source = await writeJson(root, 'hypotheses.json', {
      schemaVersion: 'improvement-hypothesis-set-v2',
      hypotheses,
      noProblemAssessment: null,
    });
    const sessionId = 'ordinary-run-test-000001';
    const report = await writeJson(root, 'report.json', reportFor(sessionId, hypotheses));
    const result = await buildSelectionPriorityReplayCase({
      caseId: 'case-000001',
      sessionId,
      sourcePath: source,
      sourceHistoricalRef: 'historical/hypotheses.json',
      reportPath: report,
      sourceReportRef: 'historical/report.json',
      outputRoot: join(root, 'output'),
    });

    assert.equal(result.caseManifest.hypothesisCount, 2);
    assert.equal(result.caseManifest.historicalSelectedHypothesisId, 'hypothesis-000001');
    assert.equal(result.caseManifest.sourceRef, 'source/hypotheses.json');
    assert.equal(result.caseManifest.sourceHistoricalRef, 'historical/hypotheses.json');
    assert.equal(result.caseManifest.sourceReportRef, 'historical/report.json');
    assert.equal(result.caseManifest.sourceReportJsonPointer, '/workflows/0/decisionAudit/improvementHypothesis');
    assert.deepEqual(
      result.original.candidates.map(candidate => candidate.sourceIndex),
      [0, 1],
    );
    assert.deepEqual(
      result.reversed.candidates.map(candidate => candidate.sourceIndex),
      [1, 0],
    );
    assert.deepEqual(
      result.original.candidates.map(({ presentationIndex: _index, ...candidate }) => candidate),
      result.reversed.candidates
        .map(({ presentationIndex: _index, ...candidate }) => candidate)
        .reverse(),
    );
    assert.equal(await readFile(join(result.outputPath, 'source', 'hypotheses.json'), 'utf8'), await readFile(source, 'utf8'));
    assert.notEqual(result.original.presentationSha256, result.reversed.presentationSha256);
  }

  // Projection uses report hypotheses, records report provenance, and compares equal dual sources.
  {
    const root = await mkdtemp(join(tmpdir(), 'selection-priority-replay-'));
    const hypotheses = [hypothesis('hypothesis-000001', 'A'), hypothesis('hypothesis-000002', 'B')];
    const source = await writeJson(root, 'hypotheses.json', { hypotheses });
    const sessionId = 'ordinary-run-test-000002';
    const report = await writeJson(root, 'report.json', reportFor(sessionId, hypotheses));
    const result = await buildSelectionPriorityReplayCase({
      caseId: 'case-000002',
      sessionId,
      sourcePath: source,
      reportPath: report,
      sourceHistoricalRef: 'historical/hypotheses.json',
      sourceReportRef: 'historical/report.json',
      outputRoot: join(root, 'output'),
    });
    assert.equal(result.caseManifest.sourceKind, 'retained_hypothesis_artifact');
    assert.equal(result.caseManifest.sourceReportRef, 'historical/report.json');

    const fallback = await buildSelectionPriorityReplayCase({
      caseId: 'case-000003',
      sessionId: 'ordinary-run-test-000003',
      reportPath: await writeJson(root, 'projection-report.json', reportFor('ordinary-run-test-000003', hypotheses)),
      sourceReportRef: 'historical/report.json',
      outputRoot: join(root, 'fallback-output'),
    });
    assert.equal(fallback.caseManifest.sourceKind, 'operational_report_projection');
    assert.equal(fallback.caseManifest.sourceRef, 'source/hypotheses.json');
    assert.equal(fallback.caseManifest.sourceHistoricalRef, null);
    assert.equal(fallback.caseManifest.sourceReportJsonPointer, '/workflows/0/decisionAudit/improvementHypothesis');
    assert.notEqual(fallback.caseManifest.sourceSha256, result.caseManifest.sourceSha256);
    assert.equal(fallback.original.candidates.length, 2);
    const projected = JSON.parse(await readFile(join(fallback.outputPath, 'source', 'hypotheses.json'), 'utf8'));
    assert.equal(projected.schemaVersion, 'improvement-hypothesis-set-v2');
    assert.equal(projected.noProblemAssessment, null);
  }

  // A mismatching dual source is rejected before any experimental case is written.
  {
    const root = await mkdtemp(join(tmpdir(), 'selection-priority-replay-'));
    const source = await writeJson(root, 'hypotheses.json', { hypotheses: [hypothesis('hypothesis-000001', 'A')] });
    const report = await writeJson(
      root,
      'report.json',
      reportFor('ordinary-run-test-000004', [hypothesis('hypothesis-000001', 'DIFFERENT')]),
    );
    await assert.rejects(
      () => buildSelectionPriorityReplayCase({
        caseId: 'case-000004', sessionId: 'ordinary-run-test-000004', sourcePath: source, reportPath: report,
        sourceHistoricalRef: 'historical/hypotheses.json', sourceReportRef: 'historical/report.json',
        outputRoot: join(root, 'output'),
      }),
      /projection.*match|source.*match|semantic/i,
    );
  }

  // A fixed case must have a report; historical selection never falls back to H1.
  {
    const root = await mkdtemp(join(tmpdir(), 'selection-priority-replay-'));
    const hypotheses = [hypothesis('hypothesis-000001', 'A')];
    const source = await writeJson(root, 'hypotheses.json', { hypotheses });
    await assert.rejects(
      () => buildSelectionPriorityReplayCase({
        caseId: 'case-000008', sessionId: 'ordinary-run-test-000008', sourcePath: source,
        outputRoot: join(root, 'output'),
      }),
      /reportPath is required/i,
    );
  }

  // Report identity, completion status, and historical selection are mandatory provenance.
  {
    const root = await mkdtemp(join(tmpdir(), 'selection-priority-replay-'));
    const hypotheses = [hypothesis('hypothesis-000001', 'A')];
    const source = await writeJson(root, 'hypotheses.json', { hypotheses });
    const cases = [
      {
        name: 'wrong workflow session',
        report: reportFor('ordinary-run-other', hypotheses),
        error: /sourceRunRef.*ordinary-run-test-000009/i,
      },
      {
        name: 'wrong multi-round session',
        report: reportFor('ordinary-run-test-000009', hypotheses, { multiRoundRunRef: 'ordinary-run-other' }),
        error: /multiRoundRunRef/i,
      },
      {
        name: 'non-completed hypothesis status',
        report: reportFor('ordinary-run-test-000009', hypotheses, { status: 'failed' }),
        error: /status.*completed/i,
      },
      {
        name: 'unknown historical selection',
        report: reportFor('ordinary-run-test-000009', hypotheses, { selectedHypothesisId: 'hypothesis-000999' }),
        error: /unknown hypothesis/i,
      },
    ];
    for (const item of cases) {
      const report = await writeJson(root, `${item.name}.json`, item.report);
      await assert.rejects(
        () => buildSelectionPriorityReplayCase({
          caseId: 'case-000009', sessionId: 'ordinary-run-test-000009', sourcePath: source,
          reportPath: report, sourceReportRef: 'historical/report.json', outputRoot: join(root, item.name),
        }),
        item.error,
      );
    }

    const missingSelection = reportFor('ordinary-run-test-000010', hypotheses);
    delete (missingSelection.workflows[0].decisionAudit as Record<string, unknown>).selection;
    const missingSelectionReport = await writeJson(root, 'missing-selection.json', missingSelection);
    await assert.rejects(
      () => buildSelectionPriorityReplayCase({
        caseId: 'case-000010', sessionId: 'ordinary-run-test-000010', sourcePath: source,
        reportPath: missingSelectionReport, sourceReportRef: 'historical/report.json', outputRoot: join(root, 'missing-selection-output'),
      }),
      /selection.*audit|selectedHypothesisId/i,
    );
  }

  // Result validation is strict, source-anchored, and contains no scoring semantics.
  {
    const root = await mkdtemp(join(tmpdir(), 'selection-priority-replay-'));
    const hypotheses = [hypothesis('hypothesis-000001', 'A')];
    const source = await writeJson(root, 'hypotheses.json', { hypotheses });
    const report = await writeJson(root, 'report.json', reportFor('ordinary-run-test-000005', hypotheses));
    const built = await buildSelectionPriorityReplayCase({
      caseId: 'case-000005', sessionId: 'ordinary-run-test-000005', sourcePath: source,
      sourceHistoricalRef: 'historical/hypotheses.json', reportPath: report, sourceReportRef: 'historical/report.json',
      outputRoot: join(root, 'output'),
    });
    const presentation = {
      ...built.original,
      presentationSha256: built.original.presentationSha256,
    };
    const parsed = parseSelectionPriorityReplayResult(JSON.stringify(validResult(presentation)), presentation);
    assert.equal(parsed.selected.sourceHypothesisId, 'hypothesis-000001');
    assert.throws(
      () => parseSelectionPriorityReplayResult(
        JSON.stringify(validResult(presentation)),
        { ...presentation, candidates: [{ ...presentation.candidates[0], hypothesis: 'tampered' }] },
      ),
      /presentation.*hash/i,
    );

    for (const forbidden of ['score', 'ranking', 'severity', 'priority']) {
      assert.throws(
        () => parseSelectionPriorityReplayResult(JSON.stringify({ ...validResult(presentation), [forbidden]: 1 }), presentation),
        /unknown field/i,
      );
    }
    assert.throws(
      () => parseSelectionPriorityReplayResult(JSON.stringify({
        ...validResult(presentation),
        selected: { ...validResult(presentation).selected, sourceHypothesisId: 'hypothesis-999999' },
      }), presentation),
      /candidate|hypothesis/i,
    );
    assert.throws(
      () => parseSelectionPriorityReplayResult(JSON.stringify({
        ...validResult(presentation),
        rationale: { ...validResult(presentation).rationale, productMateriality: '' },
      }), presentation),
      /rationale/i,
    );
  }

  // Every output is create-only and cannot overwrite a previous experimental case.
  {
    const root = await mkdtemp(join(tmpdir(), 'selection-priority-replay-'));
    const hypotheses = [hypothesis('hypothesis-000001', 'A')];
    const source = await writeJson(root, 'hypotheses.json', { hypotheses });
    const report = await writeJson(root, 'report.json', reportFor('ordinary-run-test-000006', hypotheses));
    const input = {
      caseId: 'case-000006', sessionId: 'ordinary-run-test-000006', sourcePath: source,
      sourceHistoricalRef: 'historical/hypotheses.json', reportPath: report, sourceReportRef: 'historical/report.json',
      outputRoot: join(root, 'output'),
    } as const;
    await buildSelectionPriorityReplayCase(input);
    await assert.rejects(() => buildSelectionPriorityReplayCase(input), /already exists/i);
  }

  // The pure presentation builder keeps the caller-provided source hash and order explicit.
  {
    const candidates = [
      { presentationIndex: 0, sourceIndex: 0, sourceHypothesisId: 'hypothesis-000001', sourceHypothesisSha256: 'a'.repeat(64), hypothesis: 'A', observedBasis: 'A', feedbackRefs: ['f'], evidenceRefs: [], unknowns: ['u'], productSignificance: 'p' },
      { presentationIndex: 1, sourceIndex: 1, sourceHypothesisId: 'hypothesis-000002', sourceHypothesisSha256: 'b'.repeat(64), hypothesis: 'B', observedBasis: 'B', feedbackRefs: ['f'], evidenceRefs: [], unknowns: ['u'], productSignificance: 'p' },
    ];
    const presentation = buildSelectionPriorityReplayPresentation({
      caseId: 'case-000007', presentationId: 'case-000007-reversed', order: 'reversed',
      sourceHypothesesSha256: 'c'.repeat(64), candidates: [...candidates].reverse(),
    });
    assert.deepEqual(presentation.candidates.map(candidate => candidate.presentationIndex), [0, 1]);
    assert.deepEqual(presentation.candidates.map(candidate => candidate.sourceIndex), [1, 0]);
  }

  // The fixed corpus resolves five retained sources and three report projections without Participants.
  {
    const root = await mkdtemp(join(tmpdir(), 'selection-priority-replay-corpus-'));
    const cases = await prepareSelectionPriorityReplayCorpus({
      repoRoot: process.cwd(),
      outputRoot: join(root, 'output'),
    });
    assert.equal(cases.length, 8);
    assert.equal(cases.filter(item => item.caseManifest.sourceKind === 'retained_hypothesis_artifact').length, 5);
    assert.equal(cases.filter(item => item.caseManifest.sourceKind === 'operational_report_projection').length, 3);
    for (const item of cases) {
      assert.equal(item.original.candidates.length, item.reversed.candidates.length);
      assert.equal(item.original.sourceHypothesesSha256, item.reversed.sourceHypothesesSha256);
      assert.equal(item.caseManifest.sourceRef, 'source/hypotheses.json');
      assert.match(item.caseManifest.sourceReportRef!, /^artifacts\/evolution\/run-reports\//);
      assert.equal(item.caseManifest.sourceReportJsonPointer, '/workflows/0/decisionAudit/improvementHypothesis');
      assert.match(item.caseManifest.historicalSelectedHypothesisId, /^hypothesis-\d{6}$/);
      assert.deepEqual(
        item.original.candidates.map(candidate => candidate.sourceHypothesisId).sort(),
        item.reversed.candidates.map(candidate => candidate.sourceHypothesisId).sort(),
      );
    }
    const corpus = JSON.parse(await readFile(join(root, 'output', 'corpus.json'), 'utf8'));
    assert.equal(corpus.schemaVersion, 'ae-selection-priority-replay-corpus-v1');
    assert.equal(typeof corpus.repositoryBranch, 'string');
    assert.ok(corpus.repositoryBranch.length > 0);
    assert.match(corpus.repositoryHead, /^[a-f0-9]{40}$/);
    assert.equal(corpus.caseCount, 8);
    assert.equal(corpus.cases.length, 8);
    assert.equal(corpus.ordinarySessionsExecuted, false);
    assert.equal(corpus.participantInvocationsExecuted, false);
    assert.equal(corpus.productionSelectionModified, false);
    assert.ok(corpus.cases.every((item: { caseId: string; caseRef: string }) => item.caseRef === `${item.caseId}/case.json`));
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSelectionPriorityReplayTests()
    .then(() => console.log('selectionPriorityReplay.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
