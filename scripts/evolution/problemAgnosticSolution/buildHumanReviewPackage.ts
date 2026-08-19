import { mkdir, open } from 'node:fs/promises';
import { dirname } from 'node:path';
import { canonicalJson, sha256Hex } from '../phase0/provenance';
import type { SolutionDecisionV1 } from '../../../src/evolution/solutionDecisionContract';

export interface HumanReviewPackageInput {
  destinationPath: string;
  sourceRunRef: string;
  sourceRunHash: string;
  feedbackInvocationRef: string;
  hypothesisInvocationRef: string;
  selectedHypothesis: unknown;
  problemPackageSha256: string | null;
  solutionWorkspaceBaselineFingerprintSha256: string | null;
  reviewerWorkspaceBaselineFingerprintSha256: string | null;
  solutionInvocationRef: string | null;
  solutionResult: unknown;
  reviewerInvocationRef: string | null;
  reviewerResult: unknown;
  decision: SolutionDecisionV1;
  actualParticipantJobs: number;
  architectureAudit: {
    newActivePathContainsDomainBranch: false;
    oldHypothesisInvestigationInvoked: false;
    oldModificationWorkInvoked: false;
    authoritativeRepoChangedByAgentJobs: false;
    solutionReviewerBaselineFingerprintsMatch: boolean;
    reviewerDerivedFromSolutionWorkspace: false;
    configGameplayExecutionPerformed: false;
  };
}

function markdownValue(value: unknown): string {
  return `\`\`\`json\n${canonicalJson(value)}\n\`\`\``;
}

export async function buildHumanReviewPackage(input: HumanReviewPackageInput): Promise<string> {
  const audit = input.architectureAudit;
  const report = [
    '# Problem-Agnostic Agent Solution Loop — Human Review Package',
    '',
    '## Provenance and job summary',
    '',
    `- source run: ${input.sourceRunRef}`,
    `- source run hash: ${input.sourceRunHash}`,
    `- External Feedback invocation: ${input.feedbackInvocationRef}`,
    `- Improvement Hypothesis invocation: ${input.hypothesisInvocationRef}`,
    `- selected hypothesis: ${markdownValue(input.selectedHypothesis)}`,
    `- Problem Package SHA-256: ${input.problemPackageSha256 ?? 'not produced'}`,
    `- Solution workspace baseline fingerprint: ${input.solutionWorkspaceBaselineFingerprintSha256 ?? 'not produced'}`,
    `- Reviewer workspace baseline fingerprint: ${input.reviewerWorkspaceBaselineFingerprintSha256 ?? 'not produced'}`,
    `- Solution invocation: ${input.solutionInvocationRef ?? 'not run'}`,
    `- Reviewer invocation: ${input.reviewerInvocationRef ?? 'not run'}`,
    `- Solution Result SHA-256: ${sha256Hex(canonicalJson(input.solutionResult))}`,
    `- Reviewer Result SHA-256: ${sha256Hex(canonicalJson(input.reviewerResult))}`,
    `- Decision SHA-256: ${sha256Hex(canonicalJson(input.decision))}`,
    `- actual participant-job count: ${input.actualParticipantJobs}`,
    '',
    '## Structured Solution Result',
    '',
    markdownValue(input.solutionResult),
    '',
    '## Structured Reviewer Result',
    '',
    markdownValue(input.reviewerResult),
    '',
    '## Decision Router',
    '',
    markdownValue(input.decision),
    '',
    '## Mechanical architecture audit',
    '',
    `- new active path contains domain branch = ${String(audit.newActivePathContainsDomainBranch)}`,
    `- old runHypothesisInvestigation invoked = ${String(audit.oldHypothesisInvestigationInvoked)}`,
    `- old runModificationWork invoked = ${String(audit.oldModificationWorkInvoked)}`,
    `- authoritative repo changed by Agent jobs = ${String(audit.authoritativeRepoChangedByAgentJobs)}`,
    `- solution/reviewer baseline fingerprints match = ${String(audit.solutionReviewerBaselineFingerprintsMatch)}`,
    `- reviewer derived from solution workspace = ${String(audit.reviewerDerivedFromSolutionWorkspace)}`,
    `- config/gameplay execution performed = ${String(audit.configGameplayExecutionPerformed)}`,
    '',
    '## Human decisions (outcomes intentionally blank)',
    '',
    '- [ ] ORCHESTRATION_AGNOSTIC / ORCHESTRATION_NOT_AGNOSTIC',
    '- [ ] AGENT_OWNS_REASONING / AGENT_DOES_NOT_OWN_REASONING',
    '- [ ] INDEPENDENT_REVIEW_AND_BOUNDARY / INDEPENDENT_REVIEW_OR_BOUNDARY_FAILED',
    '',
    'This package records one fixed workflow case only. It does not authorize configuration execution, gameplay modification, Candidate generation, or autonomous evolution.',
    '',
  ].join('\n');
  await mkdir(dirname(input.destinationPath), { recursive: true });
  const handle = await open(input.destinationPath, 'wx');
  try {
    await handle.writeFile(report);
  } finally {
    await handle.close();
  }
  return input.destinationPath;
}
