#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import {
  formatInfantPassiveChainVerificationMarkdown,
  runInfantPassiveChainVerification,
  type InfantPassiveChainVerificationReport,
} from '../src/p16/infantPassiveChainVerification';

function formatStage3OriginChainsReport(report: InfantPassiveChainVerificationReport): string {
  const status = (pass: boolean) => (pass ? 'PASS' : 'FAIL');
  const pairwiseTable = report.acX3.pairwise
    .map(
      pair =>
        `| ${pair.originA} × ${pair.originB} | ${pair.overlapCount} | ${pair.unionCount} | ${(pair.overlapRatio * 100).toFixed(1)}% | ${status(pair.pass)} |`,
    )
    .join('\n');

  const scholarFrontier = report.acX3.pairwise.find(
    p =>
      (p.originA === '书香门第' && p.originB === '边疆异族') ||
      (p.originA === '边疆异族' && p.originB === '书香门第'),
  );

  return `# Stage-3 Four-Origin Infant Quest Chains — Divergence Report (US-015)

**PRD:** \`docs/PRD/early-childhood-origin-infant-quest-chains.md\`  
**Date:** ${report.generatedAt}  
**Decision:** **${report.decision.toUpperCase()}**  
**Stage-2 baseline:** 书香×边疆 70.6% overlap (full narrative to age 7)  
**Stage-3 target:** C(4,2) chain-node overlap <50% at age 2

## Repro

\`\`\`bash
npm run report:infant-passive-verification
npm exec tsx tests/infantPassiveChainVerificationTests.ts
npm run gate:p16
\`\`\`

## Pairwise chain-node overlap at age 2 (C(4,2)=6)

| 对比 | 交集 | 并集 | 重合度 | 结果 |
| --- | --- | --- | --- | --- |
${pairwiseTable}

**书香×边疆 Stage-3:** ${scholarFrontier ? `${(scholarFrontier.overlapRatio * 100).toFixed(1)}% (${status(scholarFrontier.pass)})` : '—'} — down from Stage-2 70.6%

## Agency & stat guards (0～2 岁)

| 出身 | 被动期 | 规划违规 | 占位句 | 链完成 |
| --- | --- | --- | --- | --- |
${report.acX2.traces
  .map((t, i) => {
    const chainDone = report.selectorTraces[i]?.chainComplete ? '是' : '否';
    return `| ${t.origin} | ${t.passivePeriods} | ${t.planningViolations} | ${t.placeholderHits} | ${chainDone} |`;
  })
  .join('\n')}

## Chain node sequences (selector simulation)

${report.selectorTraces
  .map(
    trace =>
      `- **${trace.label}:** ${trace.chainNodeIds.join(' → ') || '—'}`,
  )
  .join('\n')}

Full AC-X detail: \`artifacts/reports/infant-passive-chain-verification.md\`
`;
}

const REPORTS_DIR = path.join(process.cwd(), 'artifacts/reports');

function main(): void {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  runInfantPassiveChainVerification()
    .then(report => {
      const jsonPath = path.join(REPORTS_DIR, 'infant-passive-chain-verification.json');
      const mdPath = path.join(REPORTS_DIR, 'infant-passive-chain-verification.md');
      const stage3Path = path.join(REPORTS_DIR, 'early-childhood-origin-chains-stage3.md');

      fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
      fs.writeFileSync(mdPath, formatInfantPassiveChainVerificationMarkdown(report), 'utf8');
      fs.writeFileSync(stage3Path, formatStage3OriginChainsReport(report), 'utf8');

      console.log(`Infant passive chain verification: ${report.decision}`);
      console.log('Wrote artifacts/reports/infant-passive-chain-verification.{json,md}');
      console.log('Wrote artifacts/reports/early-childhood-origin-chains-stage3.md');

      if (report.decision === 'fail') {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

main();
