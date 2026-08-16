#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { loadP8BaselineReport, getP8BaselinePath } from '../src/p9/loadP8Baseline';
import { buildWarningTriageReport, renderWarningTriageMarkdown } from '../src/p9/warningTriage';
import { buildPacingAnnotationReport, renderPacingAnnotationMarkdown } from '../src/p9/pacingAnnotation';
import { buildReplayComparisonReport, renderReplayComparisonMarkdown } from '../src/p9/replayComparison';
import { buildCausalityRootCauseReport, renderCausalityRootCauseMarkdown } from '../src/p9/causalityClassification';
import { buildRootCauseRankingReport, renderRootCauseRankingMarkdown } from '../src/p9/rootCauseRanking';
import { runAllPersonaSimulations } from '../src/p9/simulationRunner';

const REPORTS_DIR = path.join(process.cwd(), 'artifacts/reports');

function writeReport(baseName: string, json: unknown, markdown: string): void {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.writeFileSync(path.join(REPORTS_DIR, `${baseName}.json`), JSON.stringify(json, null, 2), 'utf8');
  fs.writeFileSync(path.join(REPORTS_DIR, `${baseName}.md`), markdown, 'utf8');
}

async function main(): Promise<void> {
  const quiet = process.argv.includes('--quiet');
  const skipSim = process.argv.includes('--skip-sim');

  if (!quiet) {
    console.log('P9 Warning Triage Suite — loading P8 baseline…');
  }

  const baselinePath = getP8BaselinePath();
  const p8Report = loadP8BaselineReport(baselinePath);
  const relBaseline = path.relative(process.cwd(), baselinePath);

  const triage = buildWarningTriageReport(p8Report, relBaseline);
  writeReport('p9-warning-triage-baseline', triage, renderWarningTriageMarkdown(triage));

  const replay = buildReplayComparisonReport(p8Report);
  writeReport('p9-replayability-pair-comparison', replay, renderReplayComparisonMarkdown(replay));

  let bundles = p8Report.personaRuns.map(run => ({
    personaId: run.personaId,
    report: { records: [] } as import('../src/types/simulationRecordTypes').GameProcessReport,
    records: [] as import('../src/types/simulationRecordTypes').GameProcessRecord[],
    metrics: run,
  }));

  if (!skipSim) {
    if (!quiet) {
      console.log('Running persona simulations for pacing/causality annotation…');
    }
    bundles = await runAllPersonaSimulations();
  }

  const pacing = buildPacingAnnotationReport(bundles);
  writeReport('p9-pacing-window-annotation', pacing, renderPacingAnnotationMarkdown(pacing));

  const causality = buildCausalityRootCauseReport(bundles);
  writeReport('p9-causality-root-cause', causality, renderCausalityRootCauseMarkdown(causality));

  const ranking = buildRootCauseRankingReport(triage, pacing, replay, causality);
  writeReport('p9-root-cause-ranking', ranking, renderRootCauseRankingMarkdown(ranking));

  if (!quiet) {
    console.log('\nP9 triage reports written to artifacts/reports/');
    console.log(`  warnings: ${triage.totalWarnings}`);
    console.log(`  pacing spans: ${pacing.spans.length}`);
    console.log(`  replay pairs: ${replay.pairs.length}`);
    console.log(`  causality personas: ${causality.personas.length}`);
    console.log(`  root causes: ${ranking.rootCauses.length}`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
