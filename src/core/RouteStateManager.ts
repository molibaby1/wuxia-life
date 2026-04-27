import type { GameState } from '../types/eventTypes';
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

const ROUTE_FLAG_TO_ROUTE_ID: Record<string, string> = {
  merchant_path: 'merchant',
  hero_path: 'hero',
  official_path: 'official',
  hermit_path: 'hermit',
  demon_path: 'demonic',
  martial_path: 'sect',
  wanderer_path: 'wanderer',
};

const FACTION_TO_ROUTE_ID: Record<string, string> = {
  orthodox: 'sect',
  unconventional: 'demonic',
  neutral: 'wanderer',
  none: 'wanderer',
};

export class RouteStateManager {
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

  static syncFromFlagSet(state: GameState, flagName: string, flagValue: unknown, eventId?: string): GameState {
    const routeFromFlag = RouteStateManager.resolveRouteFromFlag(flagName, flagValue);
    if (!routeFromFlag) {
      return state;
    }
    if (flagName.startsWith('route_') && flagName.endsWith('_locked')) {
      return RouteStateManager.lockRoute(state, routeFromFlag, eventId, 'sync_flag_locked');
    }
    if (flagName.startsWith('route_') && flagName.endsWith('_completed')) {
      return RouteStateManager.completeRoute(state, routeFromFlag, eventId, 'sync_flag_completed');
    }
    if (flagName.startsWith('route_') && flagName.endsWith('_failed')) {
      return RouteStateManager.failRoute(state, routeFromFlag, eventId, 'sync_flag_failed');
    }
    return RouteStateManager.writeRouteState(state, {
      routeId: routeFromFlag,
      lifecycle: 'active',
      category: 'main',
      eventId,
      reason: `sync_flag:${flagName}`,
    });
  }

  private static resolveRouteFromFlag(flagName: string, flagValue: unknown): string | null {
    if (!flagValue) {
      return null;
    }
    if (flagName === 'sect_faction' && typeof flagValue === 'string') {
      return FACTION_TO_ROUTE_ID[flagValue] || null;
    }
    if (ROUTE_FLAG_TO_ROUTE_ID[flagName]) {
      return ROUTE_FLAG_TO_ROUTE_ID[flagName];
    }
    if (flagName.startsWith('route_')) {
      const routeId = flagName.replace(/^route_/, '').replace(/_(locked|completed|failed)$/, '');
      return routeId || null;
    }
    return null;
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

export function isCoreRouteIdentity(routeId: string): routeId is RouteIdentity {
  return ['merchant', 'hero', 'sect', 'demonic', 'official', 'hermit', 'wanderer'].includes(routeId);
}
