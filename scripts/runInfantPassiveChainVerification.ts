#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import {
  formatInfantPassiveChainVerificationMarkdown,
  runInfantPassiveChainVerification,
} from '../src/p16/infantPassiveChainVerification';

const REPORTS_DIR = path.join(process.cwd(), 'docs/test-reports');

function main(): void {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  runInfantPassiveChainVerification()
    .then(report => {
      const jsonPath = path.join(REPORTS_DIR, 'infant-passive-chain-verification.json');
      const mdPath = path.join(REPORTS_DIR, 'infant-passive-chain-verification.md');

      fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
      fs.writeFileSync(mdPath, formatInfantPassiveChainVerificationMarkdown(report), 'utf8');

      console.log(`Infant passive chain verification: ${report.decision}`);
      console.log('Wrote docs/test-reports/infant-passive-chain-verification.{json,md}');

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
