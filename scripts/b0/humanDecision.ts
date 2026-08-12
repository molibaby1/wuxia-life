import type {
  B0TerminalVerdict,
  EvidenceIndex,
  FixtureRegistry,
  HumanDecision,
  MechanicalAuditResult,
  RedTeamResult,
} from './types';

export type DecisionInput = {
  labels: Record<string, {
    kind: string;
    expectedDetections?: string[];
    expectedBlockCodes?: string[];
  }>;
  mechanical: MechanicalAuditResult[];
  redTeam: RedTeamResult;
  evidence: EvidenceIndex;
  controlHardKilled: boolean;
  realControlHardKilled: boolean;
  realControlBlocked: boolean;
  knownBadMissed: string[];
  holdoutMissing: boolean;
  registry: FixtureRegistry;
};

/**
 * B0 calibration verdict:
 * - Adversarial fixtures are expected to trigger red-team veto/findings.
 * - Holdout known-bad must be mechanically caught and must not enter blind review.
 * - Real Control hard-kill fails the main verdict; soft diagnostics do not.
 */
export function evaluateAutomaticTerminal(input: DecisionInput): {
  suggested: B0TerminalVerdict;
  reasons: string[];
} {
  const reasons: string[] = [];

  if (!input.evidence.chainOk || input.evidence.breakReasons.length > 0) {
    reasons.push(...input.evidence.breakReasons.map(r => `evidence: ${r}`));
    return { suggested: 'blocked', reasons };
  }

  if (input.realControlBlocked) {
    reasons.push('real control blocked (projection/leak/missing summary)');
    return { suggested: 'blocked', reasons };
  }

  if (input.holdoutMissing) {
    reasons.push('registry missing frozen layer=holdout samples');
    return { suggested: 'blocked', reasons };
  }

  if (input.controlHardKilled) {
    reasons.push('synthetic control hard-killed by mechanical auditor');
    return { suggested: 'failed', reasons };
  }

  if (input.realControlHardKilled) {
    reasons.push('real Headless control hard-killed');
    return { suggested: 'failed', reasons };
  }

  if (input.knownBadMissed.length > 0) {
    reasons.push(`known-bad/holdout missed: ${input.knownBadMissed.join(',')}`);
    return { suggested: 'failed', reasons };
  }

  const found = new Set(input.redTeam.findings.map(f => f.code));
  for (const sample of input.registry.samples.filter(s => s.kind === 'adversarial')) {
    const expected = sample.expectedBlockCodes ?? [];
    const missing = expected.filter(code => !found.has(code));
    if (missing.length > 0) {
      reasons.push(`adversarial ${sample.id} missed blocks: ${missing.join(',')}`);
      return { suggested: 'failed', reasons };
    }
  }

  const hasAdversarial = input.registry.samples.some(s => s.kind === 'adversarial');
  if (hasAdversarial && !input.redTeam.veto) {
    reasons.push('adversarial fixtures present but red-team did not veto');
    return { suggested: 'failed', reasons };
  }

  reasons.push(
    'calibration matrix covered: known-bad+holdout detected, synthetic+real control alive, adversarial vetoed, evidence chain ok',
  );
  return { suggested: 'passed', reasons };
}

export function applyHumanDecision(
  decision: 'accept' | 'reject',
  automatic: { suggested: B0TerminalVerdict; reasons: string[] },
  reason: string,
): HumanDecision {
  if (decision === 'accept') {
    if (automatic.suggested !== 'passed') {
      return {
        decision: 'reject',
        decidedAt: new Date().toISOString(),
        reason: `accept refused: automatic=${automatic.suggested}; ${automatic.reasons.join('; ')}`,
        terminalVerdict: automatic.suggested,
      };
    }
    return {
      decision: 'accept',
      decidedAt: new Date().toISOString(),
      reason,
      terminalVerdict: 'passed',
    };
  }

  return {
    decision: 'reject',
    decidedAt: new Date().toISOString(),
    reason,
    terminalVerdict: automatic.suggested === 'blocked' ? 'blocked' : 'failed',
  };
}

/** Production-path helper: any red-team veto on a real candidate blocks promotion. */
export function productionVetoBlocks(redTeam: RedTeamResult): boolean {
  return redTeam.veto;
}
