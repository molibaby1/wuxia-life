import type { EventDefinition } from '../types/eventTypes';
import type { RouteSignalPoint } from '../narrative/config/routeDefinitions';
import {
  eventCoversMissingStageSignal,
  eventCoversRoutePoint,
} from './signalDetection';
import type { NarrativeSchedulingContext } from './types';

const STAGE_BIAS_MULTIPLIER = 2.2;
const ROUTE_REINFORCEMENT_MULTIPLIER = 2.5;
const ROUTE_DIVERGENCE_MULTIPLIER = 2.8;

export function getStageSchedulingMultiplier(
  event: EventDefinition,
  context: NarrativeSchedulingContext,
): number {
  if (context.missingStageSignals.length === 0) {
    return 1;
  }
  if (!eventCoversMissingStageSignal(event, context.missingStageSignals)) {
    return 1;
  }
  const affinity = event.metadata?.pathAffinity;
  if (affinity && Object.keys(affinity).length > 0) {
    const matchesRoute = context.activeRouteIds.some(routeId =>
      Object.keys(affinity).some(key => routeId.includes(key)),
    );
    if (!matchesRoute) {
      return 1;
    }
  }
  return STAGE_BIAS_MULTIPLIER;
}

export function getRouteReinforcementMultiplier(
  event: EventDefinition,
  context: NarrativeSchedulingContext,
  activeRouteId: string,
): number {
  if (context.relevantReinforcementPoints.length === 0) {
    return 1;
  }
  for (const point of context.relevantReinforcementPoints) {
    if (eventCoversRoutePoint(event, point, activeRouteId)) {
      return ROUTE_REINFORCEMENT_MULTIPLIER;
    }
  }
  return 1;
}

export function getRouteDivergenceMultiplier(
  event: EventDefinition,
  context: NarrativeSchedulingContext,
  activeRouteId: string,
): number {
  if (context.relevantDivergencePoints.length === 0) {
    return 1;
  }
  for (const point of context.relevantDivergencePoints) {
    if (eventCoversRoutePoint(event, point, activeRouteId)) {
      return ROUTE_DIVERGENCE_MULTIPLIER;
    }
  }
  return 1;
}

export function getNarrativeSchedulingMultiplier(
  event: EventDefinition,
  context: NarrativeSchedulingContext,
): number {
  const stageMultiplier = getStageSchedulingMultiplier(event, context);
  const reinforcementMultiplier = context.activeRouteIds.reduce((max, routeId) => {
    return Math.max(max, getRouteReinforcementMultiplier(event, context, routeId));
  }, 1);
  const divergenceMultiplier = context.activeRouteIds.reduce((max, routeId) => {
    return Math.max(max, getRouteDivergenceMultiplier(event, context, routeId));
  }, 1);
  return stageMultiplier * reinforcementMultiplier * divergenceMultiplier;
}

export function describeSchedulingBias(
  event: EventDefinition,
  context: NarrativeSchedulingContext,
): string[] {
  const reasons: string[] = [];
  if (eventCoversMissingStageSignal(event, context.missingStageSignals)) {
    reasons.push(`stage-missing:${context.missingStageSignals.join(',')}`);
  }
  for (const routeId of context.activeRouteIds) {
    for (const point of context.relevantReinforcementPoints) {
      if (eventCoversRoutePoint(event, point, routeId)) {
        reasons.push(`route-reinforcement:${routeId}:${point.description}`);
      }
    }
    for (const point of context.relevantDivergencePoints) {
      if (eventCoversRoutePoint(event, point, routeId)) {
        reasons.push(`route-divergence:${routeId}:${point.description}`);
      }
    }
  }
  return reasons;
}

export function findBestRoutePointMatch(
  event: EventDefinition,
  points: RouteSignalPoint[],
  routeId: string,
): RouteSignalPoint | null {
  for (const point of points) {
    if (eventCoversRoutePoint(event, point, routeId)) {
      return point;
    }
  }
  return null;
}

export {
  STAGE_BIAS_MULTIPLIER,
  ROUTE_REINFORCEMENT_MULTIPLIER,
  ROUTE_DIVERGENCE_MULTIPLIER,
};
