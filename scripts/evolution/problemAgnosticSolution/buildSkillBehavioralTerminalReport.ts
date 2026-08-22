import { mkdir, open } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { canonicalJson } from '../phase0/provenance';
import type { WorkspaceAgentParticipantOptions } from './agentParticipant';
import type { SkillBehavioralOutcome } from './sealSkillBehavioralOutcomes';
import type { SkillBehavioralValidationResult } from './runSkillBehavioralValidation';

export interface BuildSkillBehavioralTerminalReportInput {
  destinationRoot: string;
  validation: SkillBehavioralValidationResult;
  participant: WorkspaceAgentParticipantOptions;
  blindedPackageSha256: string;
  unblindedReportSha256: string;
  behavioralOutcomes: {
    solution: SkillBehavioralOutcome;
    reviewer: SkillBehavioralOutcome;
  };
}

export interface BuildSkillBehavioralTerminalReportResult {
  reportPath: string;
}

async function writeCreateOnly(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const handle = await open(path, 'wx');
  try {
    await handle.writeFile(`${canonicalJson(value)}\n`);
  } finally {
    await handle.close();
  }
}

function assertBudget(validation: SkillBehavioralValidationResult): void {
  if (validation.actualParticipantJobs > validation.maxParticipantJobs) {
    throw new Error('actual Participant jobs exceed the fixed maximum');
  }
  if (validation.retryCount !== 0) throw new Error('retry count must remain zero');
  if (validation.configGameplayExecutionCount !== 0) throw new Error('configuration/gameplay execution count must remain zero');
}

function assertBehavioralOutcomeBoundary(input: BuildSkillBehavioralTerminalReportInput): void {
  if (input.validation.status !== 'PROTOCOL_STOPPED') return;
  if (input.behavioralOutcomes.solution !== 'INCONCLUSIVE' || input.behavioralOutcomes.reviewer !== 'INCONCLUSIVE') {
    throw new Error('PROTOCOL_STOPPED requires INCONCLUSIVE behavioral outcomes');
  }
}

export async function buildSkillBehavioralTerminalReport(
  input: BuildSkillBehavioralTerminalReportInput,
): Promise<BuildSkillBehavioralTerminalReportResult> {
  assertBudget(input.validation);
  assertBehavioralOutcomeBoundary(input);
  const reportPath = join(input.destinationRoot, 'terminal-report.json');
  await writeCreateOnly(reportPath, {
    schemaVersion: 'skill-behavioral-terminal-report-v1',
    protocolOutcome: input.validation.status,
    behavioralOutcomes: input.behavioralOutcomes,
    source: {
      runRef: input.validation.sourceRunRef,
      hashes: {
        experimentRoot: input.validation.sourceExperimentRootHash,
        sourceFingerprint: input.validation.sourceFingerprintSha256,
        problemPackage: input.validation.problemPackageSha256,
        blindedPackage: input.blindedPackageSha256,
        unblindedReport: input.unblindedReportSha256,
      },
    },
    runtime: {
      executable: input.participant.executable,
      model: input.participant.model ?? null,
      reasoningEffort: input.participant.reasoningEffort ?? null,
      timeoutMs: input.participant.timeoutMs ?? 120_000,
      outputContracts: ['SolutionWorkV1', 'SolutionReviewV1'],
    },
    budget: {
      actualParticipantJobs: input.validation.actualParticipantJobs,
      maxParticipantJobs: input.validation.maxParticipantJobs,
      retryCount: input.validation.retryCount,
      alternateParticipantFallbacks: 0,
      configurationExecutionCount: 0,
      gameplayExecutionCount: 0,
      authoritativeCodeExecutionCount: 0,
      productionActionCount: 0,
    },
    evidence: {
      solution: input.validation.solution,
      reviewer: input.validation.reviewer,
      stopReason: input.validation.stopReason ?? null,
    },
    blindReviewSealed: input.validation.status === 'PROTOCOL_VALID',
    humanFinalReviewTerminalGate: true,
    automaticAdvancement: false,
    nextPrdStarted: false,
    secondSkillStarted: false,
    skillRevisionStarted: false,
    registryStarted: false,
    autonomousLoopStarted: false,
    claimBoundary: 'Conclusions are limited to this one fixed fresh-problem comparison.',
  });
  return { reportPath };
}
