export type RouteIdentity =
  | 'merchant'
  | 'hero'
  | 'sect'
  | 'demonic'
  | 'official'
  | 'hermit'
  | 'wanderer';

export type CompatibilityLevel = 'strong_exclusion' | 'soft_exclusion' | 'coexist';

export type ConflictResolutionAction =
  | 'block_candidate'
  | 'require_turn_event'
  | 'allow_coexist';

export interface RouteCompatibilityRule {
  routeA: RouteIdentity;
  routeB: RouteIdentity;
  level: CompatibilityLevel;
  resolution: ConflictResolutionAction;
  rationale: string;
}

export interface ResolveRouteConflictInput {
  currentMainRoute?: RouteIdentity | null;
  currentSecondaryRoutes?: RouteIdentity[];
  candidateRoute: RouteIdentity;
  lockedIn?: boolean;
}

export interface ResolveRouteConflictResult {
  level: CompatibilityLevel;
  action: ConflictResolutionAction;
  conflictWith: RouteIdentity[];
}

// Testable matrix for US-009: each row is a deterministic route-pair rule.
export const ROUTE_COMPATIBILITY_TABLE: RouteCompatibilityRule[] = [
  {
    routeA: 'hero',
    routeB: 'demonic',
    level: 'strong_exclusion',
    resolution: 'block_candidate',
    rationale: '正邪主身份互斥，不允许同局并存为主路线。',
  },
  {
    routeA: 'official',
    routeB: 'demonic',
    level: 'strong_exclusion',
    resolution: 'block_candidate',
    rationale: '官府与魔道存在制度级冲突，不能直接共存。',
  },
  {
    routeA: 'sect',
    routeB: 'demonic',
    level: 'strong_exclusion',
    resolution: 'block_candidate',
    rationale: '门派正统路线与魔道路线在核心承诺上矛盾。',
  },
  {
    routeA: 'merchant',
    routeB: 'hero',
    level: 'soft_exclusion',
    resolution: 'require_turn_event',
    rationale: '商道逐利与侠义优先级冲突，可通过转向事件重塑主线。',
  },
  {
    routeA: 'official',
    routeB: 'hermit',
    level: 'soft_exclusion',
    resolution: 'require_turn_event',
    rationale: '入世仕途与避世隐居价值冲突，但允许剧情转向。',
  },
  {
    routeA: 'sect',
    routeB: 'wanderer',
    level: 'soft_exclusion',
    resolution: 'require_turn_event',
    rationale: '宗门归属与游侠无门派承诺冲突，需显式脱离流程。',
  },
  {
    routeA: 'merchant',
    routeB: 'official',
    level: 'coexist',
    resolution: 'allow_coexist',
    rationale: '商贾与官途可形成互利关系，允许并行发展。',
  },
  {
    routeA: 'hero',
    routeB: 'wanderer',
    level: 'coexist',
    resolution: 'allow_coexist',
    rationale: '行侠与游历可并行存在，不构成身份矛盾。',
  },
  {
    routeA: 'hermit',
    routeB: 'wanderer',
    level: 'coexist',
    resolution: 'allow_coexist',
    rationale: '隐修与游历是生活方式互补，不是身份冲突。',
  },
];

function makePairKey(a: RouteIdentity, b: RouteIdentity): string {
  return [a, b].sort().join('::');
}

const ROUTE_RULE_MAP = new Map<string, RouteCompatibilityRule>(
  ROUTE_COMPATIBILITY_TABLE.map(rule => [makePairKey(rule.routeA, rule.routeB), rule]),
);

export function getRouteCompatibilityRule(
  routeA: RouteIdentity,
  routeB: RouteIdentity,
): RouteCompatibilityRule {
  if (routeA === routeB) {
    return {
      routeA,
      routeB,
      level: 'coexist',
      resolution: 'allow_coexist',
      rationale: '同一路线重复选择视为共存（由上层状态管理去重）。',
    };
  }

  const key = makePairKey(routeA, routeB);
  const rule = ROUTE_RULE_MAP.get(key);
  if (!rule) {
    return {
      routeA,
      routeB,
      level: 'coexist',
      resolution: 'allow_coexist',
      rationale: '未声明组合默认共存，后续可按设计增量收紧。',
    };
  }
  return rule;
}

export function resolveRouteConflict(
  input: ResolveRouteConflictInput,
): ResolveRouteConflictResult {
  const compareTargets: RouteIdentity[] = [];
  if (input.currentMainRoute) {
    compareTargets.push(input.currentMainRoute);
  }
  compareTargets.push(...(input.currentSecondaryRoutes || []));

  let level: CompatibilityLevel = 'coexist';
  let action: ConflictResolutionAction = 'allow_coexist';
  const conflictWith: RouteIdentity[] = [];

  for (const existingRoute of compareTargets) {
    const rule = getRouteCompatibilityRule(existingRoute, input.candidateRoute);
    if (rule.level === 'coexist') {
      continue;
    }

    conflictWith.push(existingRoute);

    if (rule.level === 'strong_exclusion') {
      level = 'strong_exclusion';
      action = 'block_candidate';
      continue;
    }

    if (level !== 'strong_exclusion') {
      level = 'soft_exclusion';
      action = input.lockedIn ? 'require_turn_event' : 'allow_coexist';
    }
  }

  return {
    level,
    action,
    conflictWith,
  };
}
