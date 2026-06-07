import * as fs from 'fs';
import * as path from 'path';
import type { P8PlayabilityReport } from '../p8/types';

const DEFAULT_BASELINE = path.join(process.cwd(), 'docs/test-reports/p8-playability-gate-latest.json');

export function loadP8BaselineReport(baselinePath = DEFAULT_BASELINE): P8PlayabilityReport {
  const resolved = path.isAbsolute(baselinePath) ? baselinePath : path.join(process.cwd(), baselinePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`P8 baseline report not found: ${resolved}. Run npm run gate:playability first.`);
  }
  return JSON.parse(fs.readFileSync(resolved, 'utf8')) as P8PlayabilityReport;
}

export function getP8BaselinePath(): string {
  return DEFAULT_BASELINE;
}
