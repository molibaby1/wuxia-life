# P11 Route-Aware Scheduler Wiring Verification

Generated: 2026-06-07

## Positive example A: social reinforcement

**Setup**
- Player age: 23, flag `p9_early_social_focus` set
- Active route: `route_social`
- Configured reinforcement point: `p11_social_reinforcement_gathering` @ `20-30`

**Priority change**
- `getRouteReinforcementMultiplier` for `p11_social_reinforcement_gathering`: **2.5**

## Positive example B: wealth reinforcement

**Setup**
- Player age: 23, flag `p9_early_business_focus` set
- Active route: `route_wealth`
- Configured reinforcement point: `p11_wealth_reinforcement_first_deal` @ `20-30`

**Runtime observation (p8-wealth-shen simulation)**
- Event `p11_wealth_reinforcement_first_deal` fires at age 22
- Flag `p11_wealth_reinforcement_seen` set

**Root cause fixed:** legacy `merchant_first_trade` requires `merchant` identity (never fires for P8 wealth persona). Initial P11 wealth event was evicted by `FORMAL_CANDIDATE_POOL_CAP=12` at age 22 due to higher-priority outlaw candidates; priority raised to enter pool while retaining `mandatory` critical-lane tags.

## Positive example C: wanderer reinforcement

**Setup**
- Player age: 23, flag `p9_early_travel_focus` set
- Active route: `route_wanderer`
- Configured reinforcement point: `p11_wanderer_reinforcement_connections` @ `20-30`

**Runtime observation (p8-explorer-lu simulation)**
- Event `p11_wanderer_reinforcement_connections` fires at age 22
- Flag `p11_wanderer_reinforcement_seen` set

## Positive example D: wealth vs wanderer divergence

**Setup**
- Player age: 30, flag `p9_early_business_focus` set
- Active route: `route_wealth`
- Configured divergence point @ `28-32` from `routeDefinitions`

**Priority change**
- `getRouteDivergenceMultiplier` for `p11_wealth_wanderer_divergence_fork`: **2.8**

**Diagnostic reason string**
- `route-divergence:route_wealth:商路中段分化`

## Conclusion

Route reinforcement and divergence biases are driven by `routeDefinitions` points plus content `narrativeScheduling.routePoints`, not hardcoded persona ids. Wealth and wanderer reinforcement gaps were config/content mismatches, resolved by P11 validation events that actually schedule and set observable flags in persona simulation.
