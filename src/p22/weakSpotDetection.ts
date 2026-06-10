import type { WeakSpotFinding } from '../narrative/profile/types';
import { getWorldProfile } from '../narrative/worldProfile';
import { evaluatePoolCoverage } from './coverageEvaluation';
import { getBaselinePools } from './poolInventory';

export function detectWeakSpots(): WeakSpotFinding[] {
  const profile = getWorldProfile();
  const findings: WeakSpotFinding[] = [];

  for (const pool of getBaselinePools()) {
    const snapshot = evaluatePoolCoverage(pool);
    const expectation = profile.libraryCoverageExpectations?.find(e => e.poolId === pool.id);

    if (snapshot.thinCoverage) {
      findings.push({
        poolId: pool.id,
        findingKind: 'thin_coverage',
        severity: snapshot.eventCount < (expectation?.minimumEventCount ?? 5) * 0.6 ? 'high' : 'medium',
        metric: 'eventCount',
        value: snapshot.eventCount,
        threshold: expectation?.minimumEventCount ?? pool.minimumEventCount,
        detail: `Pool ${pool.label} below minimum event coverage`,
      });
    }

    if (snapshot.repetitiveRisk) {
      findings.push({
        poolId: pool.id,
        findingKind: 'duplicate_risk',
        severity: 'medium',
        metric: 'titleOverlap',
        value: 1,
        threshold: expectation?.repetitiveOverlapThreshold ?? 0.7,
        detail: `Pool ${pool.label} shows repetitive title clustering`,
      });
    }

    if (snapshot.distinctRouteSignals < (expectation?.minimumDistinctRouteSignals ?? 2)) {
      findings.push({
        poolId: pool.id,
        findingKind: 'over_concentration',
        severity: 'medium',
        metric: 'routeSignals',
        value: snapshot.distinctRouteSignals,
        threshold: expectation?.minimumDistinctRouteSignals ?? 2,
        detail: `Pool ${pool.label} route signals over-concentrated`,
      });
    }

    for (const thinArea of pool.knownThinAreas) {
      const p22EventIds = profile.liveOpsWaveConfigs?.flatMap(w => w.eventIds) ?? [];
      const normalized = thinArea.toLowerCase().replace(/[^a-z0-9_]+/g, '_');
      const addressed = p22EventIds.some(id => {
        const eventKey = id.toLowerCase();
        return normalized.split('_').filter(Boolean).some(token => token.length > 3 && eventKey.includes(token));
      });
      if (!addressed) {
        findings.push({
          poolId: pool.id,
          findingKind: 'thin_coverage',
          severity: snapshot.healthClass === 'strong' ? 'low' : 'medium',
          metric: 'knownThinArea',
          value: 0,
          threshold: 1,
          detail: `Known thin area for future waves: ${thinArea}`,
        });
      }
    }
  }

  return findings;
}

export function distinguishThinFromRepetitive(poolId: string): {
  thinCoverage: boolean;
  repetitiveCoverage: boolean;
} | undefined {
  const pool = getBaselinePools().find(p => p.id === poolId);
  if (!pool) return undefined;
  const snapshot = evaluatePoolCoverage(pool);
  return {
    thinCoverage: snapshot.thinCoverage,
    repetitiveCoverage: snapshot.repetitiveRisk,
  };
}
