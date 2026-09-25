import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { buildPreschoolAutonomousAuthoringContractPacket } from '../../scripts/evolution/autonomousAuthoring/buildPreschoolContractPacket';
import {
  validateAutonomousAuthoringProposal,
  validateAutonomousAuthoringReviewAssessment,
} from '../../src/evolution/autonomousAuthoringContract';
import {
  PRESCHOOL_SHARED_NEUTRAL_ALLOWED_WRITE_PATHS,
  PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID,
  PRESCHOOL_SHARED_NEUTRAL_CONTRACT_VERSION,
  PRESCHOOL_SHARED_NEUTRAL_MAX_NEW_ENTRIES,
  PRESCHOOL_SHARED_NEUTRAL_PRODUCTION_PATH,
  PRESCHOOL_SHARED_NEUTRAL_TEST_PATHS,
  validatePreschoolSharedNeutralPayload,
} from '../../src/evolution/preschoolSharedNeutralAuthoringContract';

const responsibility = {
  responsibilityId: 'responsibility-000001',
  primaryLifeFunction: 'learn to repair a small shared obligation',
  playerVisibleNeed: 'The current evidence lacks this childhood responsibility.',
  evidenceRefs: ['source/observable-payload.json'],
};

const card = {
  responsibilityId: responsibility.responsibilityId,
  primaryLifeFunction: responsibility.primaryLifeFunction,
  playerVisibleNeed: responsibility.playerVisibleNeed,
  developmentalAgeJustification: {
    ageMin: 5,
    whyNotEarlier: 'The scene requires sustained responsibility beyond an immediate impulse.',
    whyFromThisAge: 'The child can plausibly understand and carry a small entrusted obligation.',
    whyThroughAgeSeven: 'The same responsibility remains age-appropriate through age seven.',
  },
  concreteSceneConcept: 'The child keeps a small shared task from being abandoned when play becomes distracting.',
  existingContentDistinction: {
    closestEntryIds: ['preschool_neutral_peer_repair'],
    sharedSemanticArea: 'peer-scale responsibility',
    specificDistinction: 'This entry is about maintaining an entrusted obligation rather than repairing a disagreement.',
  },
  actorClass: 'TRANSIENT_ROLE_ONLY',
  pastEvidenceConsumed: 'NONE',
  meaningfulPlayerDecision: 'NONE',
  durableResult: 'EVENT_HISTORY_ID_ONLY',
  futureHook: 'NONE',
  originPortability: 'The scene uses only generic children and a familiar adult, so it fits every canonical origin.',
  scopeCheck: 'CONTRACT_PRESERVING',
  proposedEntry: {
    id: 'preschool_neutral_shared_task_care',
    title: '守住小事',
    text: '大人把一件小事交给你照看，旁边的孩子喊你去玩。你几次回头，还是先把手里的事做完，才跑过去跟上他们。',
    originTags: ['neutral'],
    ageMin: 5,
    ageMax: 7,
  },
};

const proposal = {
  schemaVersion: 'autonomous-authoring-proposal-v1',
  contractId: 'preschool-shared-neutral-passive-capacity-v1',
  contractVersion: 1,
  gapClassification: 'CONTENT_GAP',
  gapSubtype: 'CONTENT_CAPACITY_GAP',
  applicabilityClaim: 'APPLICABLE',
  authorityRefs: ['docs/governance/product-decisions.md'],
  sourceEvidenceRefs: ['source/observable-payload.json'],
  responsibilities: [responsibility],
  contractPayload: {
    schemaVersion: 'preschool-shared-neutral-passive-authoring-payload-v1',
    cards: [card],
  },
};
export const AUTONOMOUS_AUTHORING_PROPOSAL_FIXTURE = proposal;

const reviewAssessment = {
  schemaVersion: 'autonomous-authoring-review-assessment-v1',
  contractId: PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID,
  contractVersion: PRESCHOOL_SHARED_NEUTRAL_CONTRACT_VERSION,
  applicabilityAssessment: 'APPLICABLE',
  conformance: 'CONFORMING',
  executionEnvelope: 'WITHIN_ENVELOPE',
  assessment: 'The proposed entry is inside the approved contract.',
  blockers: [],
};

export async function runAutonomousAuthoringContractTests(): Promise<void> {
  assert.equal(PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID, 'preschool-shared-neutral-passive-capacity-v1');
  assert.equal(PRESCHOOL_SHARED_NEUTRAL_CONTRACT_VERSION, 1);
  assert.equal(PRESCHOOL_SHARED_NEUTRAL_MAX_NEW_ENTRIES, 8);
  assert.equal(PRESCHOOL_SHARED_NEUTRAL_PRODUCTION_PATH, 'src/data/lines/preschool-passive-spine.json');
  assert.deepEqual(PRESCHOOL_SHARED_NEUTRAL_TEST_PATHS, [
    'tests/preschoolPassiveSpineTests.ts',
    'tests/annualPassiveMemoryTests.ts',
  ]);
  assert.deepEqual(PRESCHOOL_SHARED_NEUTRAL_ALLOWED_WRITE_PATHS, [
    PRESCHOOL_SHARED_NEUTRAL_PRODUCTION_PATH,
    ...PRESCHOOL_SHARED_NEUTRAL_TEST_PATHS,
  ]);

  assert.deepEqual(validateAutonomousAuthoringProposal(proposal), proposal);
  assert.deepEqual(validatePreschoolSharedNeutralPayload(proposal.contractPayload, proposal.responsibilities), proposal.contractPayload);
  assert.deepEqual(validateAutonomousAuthoringReviewAssessment(reviewAssessment), reviewAssessment);

  assert.throws(
    () => validateAutonomousAuthoringProposal({ ...proposal, contractId: 'unknown-contract-v1' }),
    /unknown.*contract|unsupported.*contract/i,
    'unknown contractId',
  );

  const outOfOrder = {
    ...proposal,
    responsibilities: [{ ...responsibility, responsibilityId: 'responsibility-000002' }],
    contractPayload: {
      ...proposal.contractPayload,
      cards: [{ ...card, responsibilityId: 'responsibility-000002' }],
    },
  };
  assert.throws(
    () => validateAutonomousAuthoringProposal(outOfOrder),
    /responsibility.*participant order|responsibility-000001/i,
    'responsibility ids out of participant order',
  );

  assert.throws(
    () => validateAutonomousAuthoringProposal({ ...proposal, responsibilities: [], contractPayload: null }),
    /APPLICABLE.*responsibilit|at least one/i,
    'APPLICABLE with zero responsibilities',
  );
  assert.throws(
    () => validateAutonomousAuthoringProposal({
      ...proposal,
      applicabilityClaim: 'NOT_APPLICABLE',
    }),
    /NOT_APPLICABLE.*empty|responsibilit.*empty|non-APPLICABLE/i,
    'non-APPLICABLE with non-empty responsibilities',
  );
  assert.throws(
    () => validateAutonomousAuthoringProposal({ ...proposal, contractVersion: 2 }),
    /contractVersion.*1|unsupported.*version/i,
    'contractVersion other than 1 for the preschool contract',
  );

  assert.throws(
    () => validateAutonomousAuthoringProposal({ ...proposal, unexpected: true }),
    /unknown field.*unexpected/i,
  );
  assert.throws(
    () => validateAutonomousAuthoringProposal({
      ...proposal,
      authorityRefs: [''],
    }),
    /authorityRefs\[0\].*non-empty/i,
  );
  assert.throws(
    () => validatePreschoolSharedNeutralPayload({
      ...proposal.contractPayload,
      cards: [{ ...card, proposedEntry: { ...card.proposedEntry, originTags: ['neutral', 'home'] } }],
    }, proposal.responsibilities),
    /originTags/i,
  );
  assert.throws(
    () => validatePreschoolSharedNeutralPayload({
      ...proposal.contractPayload,
      cards: [{ ...card, proposedEntry: { ...card.proposedEntry, id: 'preschool_neutral_capacity_7' } }],
    }, proposal.responsibilities),
    /id/i,
  );
  assert.throws(
    () => validateAutonomousAuthoringReviewAssessment({ ...reviewAssessment, extra: true }),
    /unknown field.*extra/i,
  );

  const repositoryRoot = process.cwd();
  const authoritySourceRef =
    'docs/superpowers/specs/2026-09-24-contract-constrained-autonomous-authoring-v1-design.md';
  const expectedAuthoritySha = createHash('sha256')
    .update(await readFile(join(repositoryRoot, authoritySourceRef)))
    .digest('hex');
  const packet = await buildPreschoolAutonomousAuthoringContractPacket({ repositoryRoot });
  assert.equal(packet.schemaVersion, 'preschool-autonomous-authoring-contract-packet-v1');
  assert.equal(packet.authorityIdentifier, 'contract-constrained-autonomous-authoring-v1-20260924');
  assert.equal(packet.authoritySourceRef, authoritySourceRef);
  assert.equal(packet.authoritySourceSha256, expectedAuthoritySha);
  assert.equal(packet.contractId, 'preschool-shared-neutral-passive-capacity-v1');
  assert.equal(packet.contractVersion, 1);
  assert.equal(packet.maxNewEntries, 8);
  assert.equal(packet.productionPath, 'src/data/lines/preschool-passive-spine.json');
  assert.deepEqual(packet.testPaths, [
    'tests/preschoolPassiveSpineTests.ts',
    'tests/annualPassiveMemoryTests.ts',
  ]);
  assert.deepEqual(packet.allowedOriginTags, ['neutral']);
  assert.deepEqual(packet.allowedAgeMin, [4, 5, 6, 7]);
  assert.equal(packet.ageMax, 7);
  assert.deepEqual(packet.forbiddenFields, ['statDeltas', 'flags']);
  assert.equal(packet.forbiddenCapabilities.includes('person_or_relationship'), true);
  assert.equal(packet.applicabilityRules.includes('Decide applicability before authoring.'), true);
  assert.equal(packet.cardRules.includes('One primary responsibility maps to exactly one Card.'), true);
  const serializedPacket = JSON.stringify(packet);
  for (const forbidden of [
    'preschool_neutral_fair_play',
    'preschool_neutral_self_made_project',
    'preschool_neutral_stand_for_peer',
    'preschool_neutral_first_farewell',
    'preschool_neutral_neighborhood_help',
    'fairness',
    'self-directed persistence',
    'moral courage',
    'farewell',
    'neighborhood participation',
  ]) {
    assert.equal(serializedPacket.includes(forbidden), false, `packet must not expose ${forbidden}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runAutonomousAuthoringContractTests()
    .then(() => console.log('autonomousAuthoringContracts.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
