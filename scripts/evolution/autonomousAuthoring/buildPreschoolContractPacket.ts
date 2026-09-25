import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  PRESCHOOL_SHARED_NEUTRAL_CONTRACT_AUTHORITY_SHA256,
  PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID,
  PRESCHOOL_SHARED_NEUTRAL_CONTRACT_VERSION,
  PRESCHOOL_SHARED_NEUTRAL_MAX_NEW_ENTRIES,
  PRESCHOOL_SHARED_NEUTRAL_PRODUCTION_PATH,
  PRESCHOOL_SHARED_NEUTRAL_TEST_PATHS,
} from '../../../src/evolution/preschoolSharedNeutralAuthoringContract';
import { sha256Hex } from '../phase0/provenance';

const AUTHORITY_IDENTIFIER = 'contract-constrained-autonomous-authoring-v1-20260924' as const;
const AUTHORITY_SOURCE_REF =
  'docs/superpowers/specs/2026-09-24-contract-constrained-autonomous-authoring-v1-design.md' as const;

export interface PreschoolAutonomousAuthoringContractPacketV1 {
  schemaVersion: 'preschool-autonomous-authoring-contract-packet-v1';
  authorityIdentifier: typeof AUTHORITY_IDENTIFIER;
  authoritySourceRef: typeof AUTHORITY_SOURCE_REF;
  authoritySourceSha256: string;
  contractId: typeof PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID;
  contractVersion: typeof PRESCHOOL_SHARED_NEUTRAL_CONTRACT_VERSION;
  maxNewEntries: typeof PRESCHOOL_SHARED_NEUTRAL_MAX_NEW_ENTRIES;
  productionPath: typeof PRESCHOOL_SHARED_NEUTRAL_PRODUCTION_PATH;
  testPaths: typeof PRESCHOOL_SHARED_NEUTRAL_TEST_PATHS;
  allowedOriginTags: readonly ['neutral'];
  allowedAgeMin: readonly [4, 5, 6, 7];
  ageMax: 7;
  forbiddenFields: readonly ['statDeltas', 'flags'];
  forbiddenCapabilities: readonly string[];
  applicabilityRules: readonly string[];
  cardRules: readonly string[];
}

export async function buildPreschoolAutonomousAuthoringContractPacket(input: {
  repositoryRoot: string;
}): Promise<PreschoolAutonomousAuthoringContractPacketV1> {
  const authoritySourceSha256 = sha256Hex(
    await readFile(join(input.repositoryRoot, AUTHORITY_SOURCE_REF)),
  );
  if (authoritySourceSha256 !== PRESCHOOL_SHARED_NEUTRAL_CONTRACT_AUTHORITY_SHA256) {
    throw new Error('The accepted preschool Contract authority bytes do not match the immutable v1 identity.');
  }
  return {
    schemaVersion: 'preschool-autonomous-authoring-contract-packet-v1',
    authorityIdentifier: AUTHORITY_IDENTIFIER,
    authoritySourceRef: AUTHORITY_SOURCE_REF,
    authoritySourceSha256,
    contractId: PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID,
    contractVersion: PRESCHOOL_SHARED_NEUTRAL_CONTRACT_VERSION,
    maxNewEntries: PRESCHOOL_SHARED_NEUTRAL_MAX_NEW_ENTRIES,
    productionPath: PRESCHOOL_SHARED_NEUTRAL_PRODUCTION_PATH,
    testPaths: PRESCHOOL_SHARED_NEUTRAL_TEST_PATHS,
    allowedOriginTags: ['neutral'],
    allowedAgeMin: [4, 5, 6, 7],
    ageMax: 7,
    forbiddenFields: ['statDeltas', 'flags'],
    forbiddenCapabilities: [
      'person_or_relationship',
      'meaningful player decision',
      'new prerequisite',
      'milestone semantics',
      'selector or scheduler changes',
      'schema or GameState changes',
      'runtime abstractions',
      'new durable state',
    ],
    applicabilityRules: [
      'Decide applicability before authoring.',
      'Only APPLICABLE may contain responsibilities and Cards.',
      'The Contract covers only existing shared-neutral preschool passive entries from ages four through seven.',
      'Confirm a capacity gap using permitted evidence and the current shared-neutral catalog semantic inventory.',
      'Identify distinct missing childhood life functions, remove functions already adequately represented, and merge semantic duplicates.',
      'Derive the Minimum Sufficient Responsibility Set from permitted evidence and current catalog semantics.',
      'Do not use a target count; max 8 is only an execution ceiling.',
      'If a responsibility requires origin-specific context, the Contract is NOT_APPLICABLE to it.',
      'If evidence is insufficient, preserve INSUFFICIENT_EVIDENCE rather than guessing.',
      'If a reasonable solution requires new semantics/mechanics, use CONTRACT_CHANGE_REQUIRED.',
      'Do not author new content before applicability is established.',
    ],
    cardRules: [
      'One primary responsibility maps to exactly one Card.',
      'Every Card must justify its developmental age with why not earlier, why from that age, and why it remains appropriate through age seven.',
      'Each Card must identify the closest existing entries and explain a meaningful life-function distinction; wording, prop, location, weather, or actor-label changes alone are insufficient.',
      'The scene must be plausible across current canonical birth origins and must not depend on an exclusive origin circumstance.',
      'Other actors may be transient roles only; persistent identity or relationship semantics require CONTRACT_CHANGE_REQUIRED.',
      'Use no past evidence, meaningful player decision, new prerequisite, milestone, future hook, or new durable state; the durable result is an existing event-history authored ID only.',
      'Each entry must carry an evidence-derived responsibility, a concrete childhood experience, an age-appropriate experiential change, a distinct life function, and no invented mechanics.',
      'Author the semantic ID, concise player-facing memory title, and compact second-person child-scale vignette.',
      'Keep production changes catalog-only and use only the Contract production and focused-test paths.',
    ],
  };
}
