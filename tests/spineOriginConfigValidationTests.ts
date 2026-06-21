import { validateSpineOriginConfig } from '../src/p16/spineOriginConfigValidation';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function main(): void {
  const findings = validateSpineOriginConfig();
  const failures = findings.filter(
    f =>
      f.kind === 'deprecated_flag' ||
      f.kind === 'unknown_flag' ||
      f.kind === 'poor_or_cross_origin' ||
      f.kind === 'street_or_cross_origin' ||
      f.kind === 'trait_line_ambiguous',
  );
  if (failures.length > 0) {
    throw new Error(`spine origin config validation failed: ${JSON.stringify(failures)}`);
  }
  assert(findings.length === 0, `unexpected findings: ${JSON.stringify(findings)}`);
  console.log('✔ spineOriginConfigValidationTests passed');
}

main();
