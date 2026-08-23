import assert from 'node:assert/strict';
import { validateEventQuality } from '../scripts/validateEventQuality';
import type { EventCondition, EventDefinition } from '../src/types/eventTypes';

function invalidConditionIssues(condition: EventCondition): ReturnType<typeof validateEventQuality>['issues'] {
  const event = {
    id: 'event-quality-condition-contract',
    ageRange: { min: 20, max: 20 },
    content: { title: 'Condition contract', text: 'Condition contract test.' },
    conditions: [condition],
    autoEffects: [{ type: 'time_advance', value: 1 }],
    choices: [],
  } as EventDefinition;

  return validateEventQuality([event]).issues.filter(issue => issue.issueType === 'invalid_condition');
}

assert.equal(
  invalidConditionIssues({ type: 'status_has', status: 'injured' }).length,
  0,
  'valid status_has must not produce invalid_condition',
);
assert.equal(
  invalidConditionIssues({ type: 'wealth_capacity_at_least', minimum: 'comfortable_means' }).length,
  0,
  'valid wealth_capacity_at_least must not produce invalid_condition',
);
assert.equal(
  invalidConditionIssues({ type: 'wealth_capacity_at_least', minimum: 'mythic' as never }).length,
  1,
  'invalid wealth level must produce invalid_condition',
);
assert.equal(
  invalidConditionIssues({ type: 'asset_owned', asset: 'merchant_shop' } as never).length,
  0,
  'valid asset_owned must not produce invalid_condition',
);
assert.equal(
  invalidConditionIssues({ type: 'asset_owned', asset: 'unknown_asset' } as never).length,
  1,
  'unknown AssetId must produce invalid_condition',
);
assert.equal(
  invalidConditionIssues({ type: 'unknown_condition', value: true } as never).length,
  1,
  'unknown condition type must produce invalid_condition',
);

console.log('eventQualityConditionContract.test.ts: ok');
