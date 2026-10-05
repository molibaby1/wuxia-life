import { PRESCHOOL_SHARED_NEUTRAL_TEST_PATHS } from '../../../src/evolution/preschoolSharedNeutralAuthoringContract';

export const PRESCHOOL_SHADOW_MISSING_ENTRY_MARKER = 'AUTONOMOUS_AUTHORING_MISSING_ENTRY' as const;

export function expectedPreschoolShadowMissingEntryMessage(acceptedId: string): string {
  return `${PRESCHOOL_SHADOW_MISSING_ENTRY_MARKER}: ${acceptedId}`;
}

export function expectedPreschoolShadowMissingEntryErrorLine(acceptedId: string): string {
  return `Error: ${expectedPreschoolShadowMissingEntryMessage(acceptedId)}`;
}

export function hasPreschoolShadowDirectExecutionGuard(appendedBlock: string, testPath: string): boolean {
  const filename = testPath.split('/').at(-1)!;
  return (appendedBlock.includes('import.meta.url')
    && appendedBlock.includes('process.argv[1]')
    && appendedBlock.includes('==='))
    || appendedBlock.includes(`endsWith('${filename}')`)
    || appendedBlock.includes(`endsWith("${filename}")`);
}

export function assertPreschoolShadowAppendedRegressionBlock(input: {
  appendedBlock: string;
  testPath: string;
  acceptedIds: readonly string[];
}): void {
  if (!hasPreschoolShadowDirectExecutionGuard(input.appendedBlock, input.testPath)) {
    throw new Error(`${input.testPath} appended regression block lacks a direct-execution guard.`);
  }
  if (!input.appendedBlock.includes(PRESCHOOL_SHADOW_MISSING_ENTRY_MARKER)
    || !input.appendedBlock.includes('throw new Error')) {
    throw new Error(`${input.testPath} appended regression block must throw ${PRESCHOOL_SHADOW_MISSING_ENTRY_MARKER} for a missing accepted ID.`);
  }
  for (const acceptedId of input.acceptedIds) {
    if (!input.appendedBlock.includes(acceptedId)) {
      throw new Error(`${input.testPath} appended regression block does not assert accepted ID ${acceptedId}.`);
    }
  }
}

export function buildPreschoolShadowRegressionParticipantInstructions(acceptedIds: readonly string[]): string[] {
  return [
    'Keep each focused test file byte-for-byte unchanged as an exact prefix; append only.',
    ...PRESCHOOL_SHARED_NEUTRAL_TEST_PATHS.map(path => `Append a self-contained regression block at EOF of ${path} and assert all ${acceptedIds.length} accepted IDs exactly as listed in Accepted Cards.`),
    'Guard each appended block for direct execution with import.meta.url + process.argv[1] + ===, or process.argv[1]?.endsWith(<matching test filename>).',
    'If an accepted ID is missing, throw new Error(`AUTONOMOUS_AUTHORING_MISSING_ENTRY: ${acceptedId}`) using that exact ID from Accepted Cards.',
    'Each focused RED command must emit exactly one Error line of the form: Error: AUTONOMOUS_AUTHORING_MISSING_ENTRY: <accepted ID copied exactly from Accepted Cards>.',
    'GREEN must pass with the Shadow catalog.',
  ];
}
