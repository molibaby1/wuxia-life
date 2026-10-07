import { PRESCHOOL_SHARED_NEUTRAL_CONTRACT_AUTHORITY_SHA256 } from '../../../src/evolution/preschoolSharedNeutralAuthoringContract';
import { sha256Hex } from '../phase0/provenance';

const PD_121_HEADING = '### PD-121：Contract-Constrained Autonomous Authoring v1';
const PD_124_HEADING = '### PD-124：Authoring Requirement 解耦与 Bounded Formal Event Authoring Contract v1';
const PRESCHOOL_FAMILY_ID = 'preschool-shared-neutral-passive-capacity-v1@1';
const ACCEPTED_DESIGN_MARKER = '**HUMAN ACCEPTED — 2026-09-24**';

export interface PreschoolAuthorityRecognitionInput {
  productDecisions: string;
  contentWorkflow: string;
  acceptedDesignBytes: Uint8Array;
}

function markdownSection(document: string, heading: string): string | null {
  const start = document.indexOf(heading);
  if (start < 0) return null;
  const nextHeading = document.indexOf('\n### ', start + heading.length);
  return document.slice(start, nextHeading < 0 ? undefined : nextHeading);
}

function hasImmutableAcceptedDesign(bytes: Uint8Array): boolean {
  return sha256Hex(bytes) === PRESCHOOL_SHARED_NEUTRAL_CONTRACT_AUTHORITY_SHA256
    && Buffer.from(bytes).toString('utf8').includes(ACCEPTED_DESIGN_MARKER);
}

function isHistoricalV3Authority(input: PreschoolAuthorityRecognitionInput): boolean {
  return input.contentWorkflow.startsWith('# Content Authoring Workflow Contract v3\n')
    && input.contentWorkflow.includes('PD-121')
    && input.contentWorkflow.includes('shadow authoring')
    && input.contentWorkflow.includes('Human exact-patch promotion');
}

function isCurrentV4Authority(input: PreschoolAuthorityRecognitionInput): boolean {
  const pd124Section = markdownSection(input.productDecisions, PD_124_HEADING);
  const hasExplicitPreschoolPreservation = pd124Section !== null
    && pd124Section.includes('existing preschool family 保持有效')
    && pd124Section.includes('不修改 preschool v1 authority bytes 或历史 proof 语义');
  const hasPreservedFamilyInV4List = input.contentWorkflow
    .split(/\r?\n/)
    .includes(`- \`${PRESCHOOL_FAMILY_ID}\`；`);

  return input.contentWorkflow.startsWith('# Content Authoring Workflow Contract v4\n')
    && input.contentWorkflow.includes('Human accepted：2026-10-07；PD-124')
    && hasExplicitPreschoolPreservation
    && hasPreservedFamilyInV4List;
}

export function recognizesPreschoolAuthorityContext(input: PreschoolAuthorityRecognitionInput): boolean {
  if (!input.productDecisions.includes(PD_121_HEADING) || !hasImmutableAcceptedDesign(input.acceptedDesignBytes)) {
    return false;
  }

  // PD-124 in the decision ledger selects the current v4 context; never fall back to v3 in a mixed state.
  if (input.productDecisions.includes(PD_124_HEADING)) return isCurrentV4Authority(input);
  return isHistoricalV3Authority(input);
}
