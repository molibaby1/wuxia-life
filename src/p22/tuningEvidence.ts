import { getWorldProfile } from '../narrative/worldProfile';
import { getP22ExpansionEventById } from './p22ContentCatalog';

export function getLiveOpsTuningEvidence(): {
  wealthPathAffinity: number;
  hermitClosureSpacing: number;
  wealthBaseWeight: number;
} {
  const profile = getWorldProfile();
  const wealthRoute = getP22ExpansionEventById('p22_early_wealth_route_fork');
  const routeSample = profile.liveOpsTuningSampleConfigs?.find(s => s.id === 'p22_tune_route_wealth_distribution');
  const closureSample = profile.liveOpsTuningSampleConfigs?.find(s => s.id === 'p22_tune_hermit_closure_density');
  const archetypeSample = profile.liveOpsTuningSampleConfigs?.find(s => s.id === 'p22_tune_wealth_archetype_coverage');

  return {
    wealthPathAffinity: wealthRoute?.metadata?.pathAffinity?.wealth ?? routeSample?.tunedValue ?? 1,
    hermitClosureSpacing: closureSample?.tunedValue ?? 1.15,
    wealthBaseWeight: archetypeSample?.tunedValue ?? 1.12,
  };
}

export function detectOffTargetLiveOpsTuning(sampleId: string, actualValue: number): boolean {
  const samples = getWorldProfile().liveOpsTuningSampleConfigs ?? [];
  const sample = samples.find(s => s.id === sampleId);
  if (!sample) return true;
  if (sample.expectedDelta === 'increase') return actualValue < sample.baselineValue;
  if (sample.expectedDelta === 'tighten_spacing') return actualValue > sample.baselineValue;
  return false;
}
