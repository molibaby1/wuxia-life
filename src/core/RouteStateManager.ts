import type { GameState, RoadCommitmentRecord } from '../types/eventTypes';
import { isLifeRoadId, isLifeRoadStage, type LifeRoadId, type LifeRoadStage } from '../types/lifeRoad';
import type { RouteIdentity } from './RouteCompatibilityRules';

export type RouteLifecycleState =
  | 'inactive'
  | 'temporary'
  | 'active'
  | 'locked_in'
  | 'turned'
  | 'completed'
  | 'failed';

export type RouteCategory = 'main' | 'secondary';

export interface RouteStateRecord {
  routeId: string;
  lifecycle: RouteLifecycleState;
  category: RouteCategory;
  lockedIn: boolean;
  lastChangedAtAge?: number;
  sourceEventId?: string;
  reason?: string;
}

export interface RouteHistoryRecord {
  routeId: string;
  from: RouteLifecycleState;
  to: RouteLifecycleState;
  category: RouteCategory;
  lockedIn: boolean;
  age?: number;
  eventId?: string;
  reason?: string;
  timestamp: number;
}

type WriteRouteStateInput = {
  routeId: string;
  lifecycle: RouteLifecycleState;
  category?: RouteCategory;
  lockedIn?: boolean;
  eventId?: string;
  reason?: string;
};

const LEGACY_ROUTE_TO_LIFE_ROAD: Record<string, LifeRoadId> = {
  merchant: 'statecraft',
  official: 'official',
  hermit: 'hermit',
};

export class RouteStateManager {
  static commitRoad(
    state: GameState,
    roadId: LifeRoadId,
    input: { choiceId?: string; eventId?: string } = {},
  ): GameState {
    const current = state.roadCommitments?.[roadId];
    if (!current && Object.keys(state.roadCommitments ?? {}).length >= 2) {
      return state;
    }
    const position = current?.position
      ?? (Object.keys(state.roadCommitments ?? {}).length === 0 ? 'primary' : 'secondary');
    const commitment: RoadCommitmentRecord = current || {
      roadId,
      position,
      committedAtAge: state.player?.age ?? 0,
      sourceChoiceId: input.choiceId,
      sourceEventId: input.eventId,
      proofCount: 0,
      lifecycle: 'active',
    };
    return {
      ...RouteStateManager.writeRouteState(state, {
        routeId: roadId,
        lifecycle: commitment.lifecycle,
        category: 'main',
        lockedIn: commitment.lifecycle === 'locked_in' || commitment.lifecycle === 'completed',
        eventId: input.eventId,
        reason: 'road_commitment',
      }),
      roadCommitments: {
        ...(state.roadCommitments || {}),
        [roadId]: commitment,
      },
    };
  }

  static recordRoadActivity(state: GameState, roadId: LifeRoadId, eventId?: string): GameState {
    const commitment = state.roadCommitments?.[roadId];
    if (commitment || RouteStateManager.readRouteState(state, roadId).lifecycle !== 'inactive') {
      return state;
    }
    return RouteStateManager.writeRouteState(state, {
      routeId: roadId,
      lifecycle: 'temporary',
      category: 'main',
      eventId,
      reason: 'road_activity_without_commitment',
    });
  }

  static recordRoadProof(state: GameState, roadId: LifeRoadId, eventId?: string): GameState {
    const commitment = state.roadCommitments?.[roadId];
    if (!commitment || commitment.lifecycle !== 'active') {
      return state;
    }
    const nextCommitment: RoadCommitmentRecord = {
      ...commitment,
      proofCount: commitment.proofCount + 1,
      latestProofEventId: eventId,
      lifecycle: 'locked_in',
    };
    return {
      ...RouteStateManager.writeRouteState(state, {
        routeId: roadId,
        lifecycle: 'locked_in',
        category: 'main',
        lockedIn: true,
        eventId,
        reason: 'road_proof',
      }),
      roadCommitments: {
        ...(state.roadCommitments || {}),
        [roadId]: nextCommitment,
      },
    };
  }

  static migrateLegacyRoutes(state: GameState): GameState {
    let nextState = state;
    for (const [legacyRouteId, legacyState] of Object.entries(state.routeStates || {})) {
      const roadId = LEGACY_ROUTE_TO_LIFE_ROAD[legacyRouteId];
      if (!roadId || nextState.roadCommitments?.[roadId]) {
        continue;
      }
      if (legacyState.lifecycle === 'temporary') {
        nextState = RouteStateManager.recordRoadActivity(nextState, roadId, legacyState.sourceEventId);
        continue;
      }
      if (!['active', 'locked_in', 'completed'].includes(legacyState.lifecycle)) {
        continue;
      }
      const lifecycle = toLifeRoadStage(legacyState.lifecycle);
      if (!lifecycle || lifecycle === 'inactive' || lifecycle === 'temporary') {
        continue;
      }
      const commitment: RoadCommitmentRecord = {
        roadId,
        committedAtAge: legacyState.lastChangedAtAge ?? state.player?.age ?? 0,
        sourceEventId: legacyState.sourceEventId,
        proofCount: lifecycle === 'active' ? 0 : 1,
        lifecycle,
      };
      nextState = {
        ...nextState,
        roadCommitments: {
          ...(nextState.roadCommitments || {}),
          [roadId]: commitment,
        },
        routeStates: {
          ...(nextState.routeStates || {}),
          [roadId]: {
            ...legacyState,
            routeId: roadId,
            lifecycle,
            lockedIn: lifecycle === 'locked_in' || lifecycle === 'completed',
            reason: 'legacy_route_migration',
          },
        },
      };
    }
    return RouteStateManager.normalizeRoadCommitments(nextState);
  }

  static readRoadStage(state: GameState, roadId: LifeRoadId): LifeRoadStage {
    const commitmentStage = state.roadCommitments?.[roadId]?.lifecycle;
    if (commitmentStage && isLifeRoadStage(commitmentStage)) {
      return commitmentStage;
    }
    const routeStage = RouteStateManager.readRouteState(state, roadId).lifecycle;
    return isLifeRoadStage(routeStage) ? routeStage : 'inactive';
  }

  static completeRoad(state: GameState, roadId: LifeRoadId, eventId?: string): GameState {
    const commitment = state.roadCommitments?.[roadId];
    if (!commitment || commitment.lifecycle !== 'locked_in') {
      return state;
    }
    return {
      ...RouteStateManager.writeRouteState(state, {
        routeId: roadId,
        lifecycle: 'completed',
        category: commitment.position === 'secondary' ? 'secondary' : 'main',
        lockedIn: true,
        eventId,
        reason: 'road_ending_completed',
      }),
      roadCommitments: {
        ...(state.roadCommitments || {}),
        [roadId]: { ...commitment, lifecycle: 'completed' },
      },
    };
  }

  static normalizeRoadCommitments(state: GameState): GameState {
    const entries = Object.entries(state.roadCommitments ?? {})
      .filter(([roadId, commitment]) => isLifeRoadId(roadId) && Boolean(commitment))
      .slice(0, 2);
    if (entries.length === 0) {
      return { ...state, roadCommitments: {} };
    }
    const usedPositions = new Set(entries
      .map(([, commitment]) => commitment.position)
      .filter((position): position is 'primary' | 'secondary' =>
        position === 'primary' || position === 'secondary'));
    const missingPositions: Array<'primary' | 'secondary'> = ['primary', 'secondary']
      .filter(position => !usedPositions.has(position));
    const roadCommitments = Object.fromEntries(entries.map(([roadId, commitment]) => {
      const position = commitment.position ?? missingPositions.shift();
      return [roadId, { ...commitment, position }];
    }));
    return { ...state, roadCommitments };
  }

  static readRouteState(state: GameState, routeId: string): RouteStateRecord {
    const existing = state.routeStates?.[routeId];
    if (existing) {
      return existing;
    }
    return {
      routeId,
      lifecycle: 'inactive',
      category: 'secondary',
      lockedIn: false,
    };
  }

  static writeRouteState(state: GameState, input: WriteRouteStateInput): GameState {
    const current = RouteStateManager.readRouteState(state, input.routeId);
    const next: RouteStateRecord = {
      ...current,
      routeId: input.routeId,
      lifecycle: input.lifecycle,
      category: input.category ?? current.category,
      lockedIn: input.lockedIn ?? current.lockedIn,
      sourceEventId: input.eventId ?? current.sourceEventId,
      reason: input.reason ?? current.reason,
      lastChangedAtAge: state.player?.age,
    };
    const routeStates = {
      ...(state.routeStates || {}),
      [input.routeId]: next,
    };
    const withHistory = RouteStateManager.appendHistory(state, current, next, input.eventId, input.reason);
    return {
      ...withHistory,
      routeStates,
    };
  }

  static lockRoute(state: GameState, routeId: string, eventId?: string, reason?: string): GameState {
    const current = RouteStateManager.readRouteState(state, routeId);
    return RouteStateManager.writeRouteState(state, {
      routeId,
      lifecycle: current.lifecycle === 'inactive' ? 'locked_in' : current.lifecycle,
      category: current.category,
      lockedIn: true,
      eventId,
      reason: reason || 'lock_route',
    });
  }

  static completeRoute(state: GameState, routeId: string, eventId?: string, reason?: string): GameState {
    return RouteStateManager.writeRouteState(state, {
      routeId,
      lifecycle: 'completed',
      lockedIn: true,
      eventId,
      reason: reason || 'complete_route',
    });
  }

  static failRoute(state: GameState, routeId: string, eventId?: string, reason?: string): GameState {
    return RouteStateManager.writeRouteState(state, {
      routeId,
      lifecycle: 'failed',
      eventId,
      reason: reason || 'fail_route',
    });
  }

  static turnRoute(state: GameState, routeId: string, eventId?: string, reason?: string): GameState {
    return RouteStateManager.writeRouteState(state, {
      routeId,
      lifecycle: 'turned',
      lockedIn: false,
      eventId,
      reason: reason || 'route_turn',
    });
  }

  static deactivateRoute(state: GameState, routeId: string, eventId?: string, reason?: string): GameState {
    return RouteStateManager.writeRouteState(state, {
      routeId,
      lifecycle: 'inactive',
      lockedIn: false,
      eventId,
      reason: reason || 'deactivate_route',
    });
  }

  private static appendHistory(
    state: GameState,
    from: RouteStateRecord,
    to: RouteStateRecord,
    eventId?: string,
    reason?: string,
  ): GameState {
    const changed =
      from.lifecycle !== to.lifecycle ||
      from.lockedIn !== to.lockedIn ||
      from.category !== to.category;
    if (!changed) {
      return state;
    }
    const historyRecord: RouteHistoryRecord = {
      routeId: to.routeId,
      from: from.lifecycle,
      to: to.lifecycle,
      category: to.category,
      lockedIn: to.lockedIn,
      age: state.player?.age,
      eventId,
      reason,
      timestamp: Date.now(),
    };
    return {
      ...state,
      routeHistory: [...(state.routeHistory || []), historyRecord],
      eventHistory: [
        ...(state.eventHistory || []),
        {
          eventId: `route_state:${to.routeId}:${to.lifecycle}`,
          age: state.player?.age,
          triggeredAt: state.currentTime?.year ?? state.player?.age ?? 0,
        },
      ],
    };
  }
}

function toLifeRoadStage(lifecycle: RouteLifecycleState): LifeRoadStage | null {
  switch (lifecycle) {
    case 'active':
    case 'locked_in':
    case 'completed':
      return lifecycle;
    default:
      return null;
  }
}

export function isCoreRouteIdentity(routeId: string): routeId is RouteIdentity {
  return ['merchant', 'hero', 'sect', 'demonic', 'official', 'hermit', 'wanderer'].includes(routeId);
}
