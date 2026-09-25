import {
  PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID,
  PRESCHOOL_SHARED_NEUTRAL_CONTRACT_VERSION,
} from '../../../src/evolution/preschoolSharedNeutralAuthoringContract';
import {
  validateAutonomousAuthoringAdmission,
  type AutonomousAuthoringAdmissionV1,
} from '../../../src/evolution/autonomousAuthoringAdmissionContract';
import {
  validateAutonomousAuthoringProposal,
} from '../../../src/evolution/autonomousAuthoringContract';
import { validateSolutionReview, type SolutionReviewV1 } from '../../../src/evolution/solutionReviewContract';
import { validateSolutionWork, type SolutionWorkV1 } from '../../../src/evolution/solutionWorkContract';
import { canonicalJson, sha256Hex } from '../phase0/provenance';
import type { PreschoolShadowAuthoringVerificationResultV1 } from './verifyPreschoolShadowAuthoring';

export interface ShadowAuthoringPromotionPackageV1 {
  schemaVersion: 'shadow-authoring-promotion-package-v1';
  contractId: typeof PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID;
  contractVersion: typeof PRESCHOOL_SHARED_NEUTRAL_CONTRACT_VERSION;
  problemId: string;
  sourceRunRef: string;
  authorityRefs: string[];
  sourceEvidenceIdentity: {
    runRef: string;
    refs: string[];
    capacityEvidence: NonNullable<AutonomousAuthoringAdmissionV1['capacityEvidence']>;
    sha256: string;
  };
  gapSummary: {
    classification: 'CONTENT_GAP';
    subtype: 'CONTENT_CAPACITY_GAP';
    evidenceMode: 'STRUCTURAL_EXHAUSTION' | 'SEMANTIC_VARIETY';
    demandBeats: number;
    authoredBeats: number;
    gapBeats: number;
  };
  applicabilitySummary: {
    proposal: string;
    reviewer: string;
    conformance: string;
    executionEnvelope: string;
  };
  responsibilitySummaries: Array<{
    responsibilityId: string;
    primaryLifeFunction: string;
    playerVisibleNeed: string;
    evidenceRefs: string[];
  }>;
  acceptedCards: NonNullable<NonNullable<ReturnType<typeof validateAutonomousAuthoringProposal>['contractPayload']>['cards']>;
  changedFiles: PreschoolShadowAuthoringVerificationResultV1['changedFiles'];
  exactPatchBase64: string;
  patchSha256: string;
  allowedHumanOutcomes: ['PROMOTE_EXACT_PATCH', 'DEFER', 'REJECT'];
  promotionRequiresExactPatchSha256: true;
  verification: {
    authorityIntegrity: 'PASS';
    mechanicalConformance: 'PASS';
    semanticConformance: 'PASS';
    redGreenRegression: 'PASS';
    adjacentRegression: 'PASS';
    evidenceBoundedCompletion: 'PASS';
    commandResults: PreschoolShadowAuthoringVerificationResultV1['commandResults'];
    authoritativeRepositoryIntegrity: {
      before: string;
      after: string;
      unchanged: true;
    };
  };
  capacityBefore: NonNullable<PreschoolShadowAuthoringVerificationResultV1['capacityBefore']>;
  capacityAfter: NonNullable<PreschoolShadowAuthoringVerificationResultV1['capacityAfter']>;
  authoritativeRepositoryUnchanged: true;
  deviations: [];
  unresolvedUncertainty: string[];
  naturalPverPerformed: false;
}

export function buildPromotionPackage(input: {
  verification: PreschoolShadowAuthoringVerificationResultV1;
  solution: SolutionWorkV1;
  review: SolutionReviewV1;
  admission: AutonomousAuthoringAdmissionV1;
}): { packageJson: ShadowAuthoringPromotionPackageV1; markdown: string } {
  const { verification } = input;
  if (verification.status !== 'SHADOW_AUTHORING_VERIFIED'
    || Object.values(verification.checks).some(check => check !== 'PASS')
    || verification.failures.length > 0
    || verification.promotionPatch === null
    || verification.patchSha256 === null
    || sha256Hex(verification.promotionPatch) !== verification.patchSha256
    || verification.authoritativeFingerprintAfter !== verification.candidateBaselineFingerprintSha256
    || verification.authoritativeFingerprintBefore !== verification.authoritativeFingerprintAfter
    || !verification.capacityBefore
    || !verification.capacityAfter) {
    throw new Error('Promotion Package requires a complete V1-V5 SHADOW_AUTHORING_VERIFIED result.');
  }

  const solution = validateSolutionWork(input.solution);
  const review = validateSolutionReview(input.review);
  const admission = validateAutonomousAuthoringAdmission(input.admission);
  if (review.decision !== 'ACCEPT_OPTION' || !review.acceptedOptionId) {
    throw new Error('Promotion Package requires an accepted Reviewer option.');
  }
  const acceptedOption = solution.options.find(option => option.optionId === review.acceptedOptionId);
  if (!acceptedOption?.autonomousAuthoring || !review.autonomousAuthoringAssessment || !admission.capacityEvidence) {
    throw new Error('Promotion Package requires the accepted authoring proposal, assessment, and capacity evidence.');
  }
  const proposal = validateAutonomousAuthoringProposal(acceptedOption.autonomousAuthoring);
  if (verification.acceptedProposalSha256 !== sha256Hex(canonicalJson(proposal))
    || verification.acceptedReviewSha256 !== sha256Hex(canonicalJson(review))
    || verification.admissionSha256 !== sha256Hex(canonicalJson(admission))
    || admission.proposalSha256 !== sha256Hex(canonicalJson(proposal))
    || admission.reviewSha256 !== sha256Hex(canonicalJson(review))) {
    throw new Error('Promotion Package input does not match the verified proposal, review, and admission.');
  }
  if (proposal.contractId !== PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID
    || proposal.contractVersion !== PRESCHOOL_SHARED_NEUTRAL_CONTRACT_VERSION
    || admission.status !== 'ELIGIBLE') {
    throw new Error('Promotion Package proposal or admission is outside the active preschool contract.');
  }
  if (verification.patchSha256 !== sha256Hex(verification.promotionPatch)) {
    throw new Error('Promotion patch bytes no longer match the verified patch SHA-256.');
  }

  const evidence = admission.capacityEvidence;
  const sourceEvidenceIdentity = {
    runRef: admission.sourceRunRef,
    refs: [...proposal.sourceEvidenceRefs],
    capacityEvidence: evidence,
  };
  const packageJson: ShadowAuthoringPromotionPackageV1 = {
    schemaVersion: 'shadow-authoring-promotion-package-v1',
    contractId: PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID,
    contractVersion: PRESCHOOL_SHARED_NEUTRAL_CONTRACT_VERSION,
    problemId: solution.problemId,
    sourceRunRef: admission.sourceRunRef,
    authorityRefs: [...admission.authorityRefs],
    sourceEvidenceIdentity: {
      ...sourceEvidenceIdentity,
      sha256: sha256Hex(canonicalJson(sourceEvidenceIdentity)),
    },
    gapSummary: {
      classification: proposal.gapClassification,
      subtype: proposal.gapSubtype,
      evidenceMode: evidence.evidenceMode,
      demandBeats: evidence.demandBeats,
      authoredBeats: evidence.authoredBeats,
      gapBeats: evidence.gapBeats,
    },
    applicabilitySummary: {
      proposal: proposal.applicabilityClaim,
      reviewer: review.autonomousAuthoringAssessment.applicabilityAssessment,
      conformance: review.autonomousAuthoringAssessment.conformance,
      executionEnvelope: review.autonomousAuthoringAssessment.executionEnvelope,
    },
    responsibilitySummaries: proposal.responsibilities.map(responsibility => ({
      responsibilityId: responsibility.responsibilityId,
      primaryLifeFunction: responsibility.primaryLifeFunction,
      playerVisibleNeed: responsibility.playerVisibleNeed,
      evidenceRefs: [...responsibility.evidenceRefs],
    })),
    acceptedCards: proposal.contractPayload!.cards,
    changedFiles: verification.changedFiles,
    exactPatchBase64: verification.promotionPatch.toString('base64'),
    patchSha256: verification.patchSha256,
    allowedHumanOutcomes: ['PROMOTE_EXACT_PATCH', 'DEFER', 'REJECT'],
    promotionRequiresExactPatchSha256: true,
    verification: {
      authorityIntegrity: 'PASS',
      mechanicalConformance: 'PASS',
      semanticConformance: 'PASS',
      redGreenRegression: 'PASS',
      adjacentRegression: 'PASS',
      evidenceBoundedCompletion: 'PASS',
      commandResults: verification.commandResults.map(result => ({ ...result })),
      authoritativeRepositoryIntegrity: {
        before: verification.authoritativeFingerprintBefore,
        after: verification.authoritativeFingerprintAfter!,
        unchanged: true,
      },
    },
    capacityBefore: verification.capacityBefore,
    capacityAfter: verification.capacityAfter,
    authoritativeRepositoryUnchanged: true,
    deviations: [],
    unresolvedUncertainty: [...acceptedOption.unknowns],
    naturalPverPerformed: false,
  };

  const markdown = [
    '# Shadow Authoring Promotion Package',
    '',
    `- Status: ${verification.status}`,
    `- Contract: ${packageJson.contractId}@${packageJson.contractVersion}`,
    `- Problem: ${packageJson.problemId}`,
    `- Source run: ${packageJson.sourceRunRef}`,
    `- Exact patch SHA-256: ${packageJson.patchSha256}`,
    `- Authoritative repository unchanged: ${packageJson.authoritativeRepositoryUnchanged}`,
    '',
    '## Verified package facts',
    '',
    '```json',
    canonicalJson(packageJson),
    '```',
    '',
    'Natural Player-visible Experience Review has not been performed.',
    'This package is eligible only for Human exact-patch promotion review.',
    'Allowed Human outcomes: PROMOTE_EXACT_PATCH / DEFER / REJECT.',
    'Any requested content or code edit invalidates this verified patch identity and requires a new shadow result with a new patch SHA-256.',
    '',
  ].join('\n');
  return { packageJson, markdown };
}
