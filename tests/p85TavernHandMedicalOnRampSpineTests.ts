import { EventLoader } from '../src/core/EventLoader';
import {
  deriveSampleLineCurrentGoal,
} from '../src/p50/sampleLineExpression';
import {
  deriveOrdinaryOriginCurrentGoal,
  deriveOrdinaryOriginLifeMemory,
  deriveOrdinaryOriginSummary,
} from '../src/p56/ordinaryOriginExpression';

const MEDICAL_ON_RAMP_EVENT_IDS = [
  'medical_on_ramp_compassionate',
  'medical_on_ramp_pragmatic',
] as const;

const MEDICAL_ON_RAMP_FLAGS = [
  'medical_on_ramp_done',
  'tavern_medical_on_ramp_compassionate',
  'tavern_medical_on_ramp_pragmatic',
] as const;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function testMedicalOnRampEventsLoaded(): void {
  const loader = EventLoader.getInstance();
  for (const eventId of MEDICAL_ON_RAMP_EVENT_IDS) {
    const event = loader.getEventById(eventId);
    assert(Boolean(event), `missing medical on-ramp event: ${eventId}`);
    assert(event?.eventType === 'auto', `${eventId} should be auto event`);
    assert(
      event?.autoEffects?.some((e: any) => e.type === 'flag_set' && e.target === 'medical_on_ramp_done'),
      `${eventId} should set medical_on_ramp_done`,
    );
  }
}

function testMedicalOnRampEventConditions(): void {
  const loader = EventLoader.getInstance();

  const compEvent = loader.getEventById('medical_on_ramp_compassionate');
  assert(Boolean(compEvent), 'compassionate event exists');
  const compCond = compEvent?.conditions?.[0]?.expression || '';
  assert(compCond.includes('tavern_medical_bridge_crossed'), 'compassionate requires bridge');
  assert(compCond.includes('tavern_embrace_compassionate_healer'), 'compassionate requires embrace marker');
  assert(compCond.includes('!flags.has(\'medical_on_ramp_done\')'), 'compassionate checks done flag');
  assert(compCond.includes('!flags.has(\'orthodox_childhood_seed_done\')'), 'compassionate excludes orthodox seed');
  assert(compCond.includes('!flags.has(\'demonic_childhood_seed_done\')'), 'compassionate excludes demonic seed');

  const pragEvent = loader.getEventById('medical_on_ramp_pragmatic');
  assert(Boolean(pragEvent), 'pragmatic event exists');
  const pragCond = pragEvent?.conditions?.[0]?.expression || '';
  assert(pragCond.includes('tavern_medical_bridge_crossed'), 'pragmatic requires bridge');
  assert(pragCond.includes('tavern_embrace_pragmatic_healer'), 'pragmatic requires embrace marker');
  assert(pragCond.includes('!flags.has(\'medical_on_ramp_done\')'), 'pragmatic checks done flag');
}

function testMedicalOnRampEventEffects(): void {
  const loader = EventLoader.getInstance();

  const compEvent = loader.getEventById('medical_on_ramp_compassionate');
  const compEffects = compEvent?.autoEffects || [];
  assert(
    compEffects.some((e: any) => e.type === 'flag_set' && e.target === 'tavern_medical_on_ramp_compassionate'),
    'compassionate sets variant marker',
  );
  assert(
    compEffects.some((e: any) => e.type === 'event_record' && e.target === 'medical_on_ramp'),
    'compassionate records medical_on_ramp',
  );
  assert(
    compEffects.some((e: any) => e.type === 'stat_modify' && e.target === 'reputation' && e.value === 6),
    'compassionate gives +6 reputation',
  );
  assert(
    compEffects.some((e: any) => e.type === 'stat_modify' && e.target === 'chivalry' && e.value === 5),
    'compassionate gives +5 chivalry',
  );
  assert(
    compEffects.some((e: any) => e.type === 'stat_modify' && e.target === 'constitution' && e.value === -2),
    'compassionate gives -2 constitution',
  );

  const pragEvent = loader.getEventById('medical_on_ramp_pragmatic');
  const pragEffects = pragEvent?.autoEffects || [];
  assert(
    pragEffects.some((e: any) => e.type === 'flag_set' && e.target === 'tavern_medical_on_ramp_pragmatic'),
    'pragmatic sets variant marker',
  );
  assert(
    pragEffects.some((e: any) => e.type === 'event_record' && e.target === 'medical_on_ramp'),
    'pragmatic records medical_on_ramp',
  );
  assert(
    pragEffects.some((e: any) => e.type === 'stat_modify' && e.target === 'reputation' && e.value === 4),
    'pragmatic gives +4 reputation',
  );
  assert(
    !pragEffects.some((e: any) => e.type === 'stat_modify' && e.target === 'money'),
    'pragmatic on-ramp must not write money',
  );
  assert(
    pragEffects.some((e: any) => e.type === 'stat_modify' && e.target === 'connections' && e.value === 4),
    'pragmatic gives +4 connections',
  );
  assert(
    pragEffects.some((e: any) => e.type === 'stat_modify' && e.target === 'charisma' && e.value === 3),
    'pragmatic gives +3 charisma',
  );
}

function testSampleLineCurrentGoalBranches(): void {
  const compGoal = deriveSampleLineCurrentGoal({
    flags: {
      tavern_medical_bridge_crossed: true,
      tavern_embrace_compassionate_healer: true,
      tavern_medical_on_ramp_compassionate: true,
    },
    age: 32,
  } as any);
  assert(compGoal.includes('周边村子'), `compassionate on-ramp goal should mention 周边村子, got: ${compGoal}`);

  const pragGoal = deriveSampleLineCurrentGoal({
    flags: {
      tavern_medical_bridge_crossed: true,
      tavern_embrace_pragmatic_healer: true,
      tavern_medical_on_ramp_pragmatic: true,
    },
    age: 32,
  } as any);
  assert(pragGoal.includes('大户'), `pragmatic on-ramp goal should mention 大户, got: ${pragGoal}`);

  const bridgeCompGoal = deriveSampleLineCurrentGoal({
    flags: {
      tavern_medical_bridge_crossed: true,
      tavern_embrace_compassionate_healer: true,
    },
    age: 28,
  } as any);
  assert(
    bridgeCompGoal.includes('小药庐') && !bridgeCompGoal.includes('周边村子'),
    `bridge-level compassionate goal should not include on-ramp content, got: ${bridgeCompGoal}`,
  );
}

function testOrdinaryOriginCurrentGoalBranches(): void {
  const compGoal = deriveOrdinaryOriginCurrentGoal({
    flags: {
      origin_tavern_hand: true,
      tavern_medical_bridge_crossed: true,
      tavern_embrace_compassionate_healer: true,
      tavern_medical_on_ramp_compassionate: true,
    },
    player: { age: 32 },
  } as any);
  assert(Boolean(compGoal), 'compassionate on-ramp current goal exists');
  assert(compGoal!.includes('周边村子'), `compassionate on-ramp goal should mention 周边村子, got: ${compGoal}`);

  const pragGoal = deriveOrdinaryOriginCurrentGoal({
    flags: {
      origin_tavern_hand: true,
      tavern_medical_bridge_crossed: true,
      tavern_embrace_pragmatic_healer: true,
      tavern_medical_on_ramp_pragmatic: true,
    },
    player: { age: 32 },
  } as any);
  assert(Boolean(pragGoal), 'pragmatic on-ramp current goal exists');
  assert(pragGoal!.includes('大户'), `pragmatic on-ramp goal should mention 大户, got: ${pragGoal}`);
}

function testOrdinaryOriginLifeMemoryBranches(): void {
  const compMem = deriveOrdinaryOriginLifeMemory({
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_compassionate_healer: true,
    tavern_medical_on_ramp_compassionate: true,
  } as any);
  assert(Boolean(compMem), 'compassionate on-ramp life memory exists');
  assert(compMem!.includes('周边村子'), `compassionate memory should mention 周边村子, got: ${compMem}`);
  assert(compMem!.includes('老掌柜'), `compassionate memory should mention 老掌柜, got: ${compMem}`);

  const pragMem = deriveOrdinaryOriginLifeMemory({
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_pragmatic_healer: true,
    tavern_medical_on_ramp_pragmatic: true,
  } as any);
  assert(Boolean(pragMem), 'pragmatic on-ramp life memory exists');
  assert(pragMem!.includes('大户'), `pragmatic memory should mention 大户, got: ${pragMem}`);
  assert(pragMem!.includes('引荐'), `pragmatic memory should mention 引荐, got: ${pragMem}`);
}

function testOrdinaryOriginSummaryBranches(): void {
  const compSum = deriveOrdinaryOriginSummary({
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_compassionate_healer: true,
    tavern_medical_on_ramp_compassionate: true,
  } as any);
  assert(Boolean(compSum), 'compassionate on-ramp summary exists');
  assert(compSum!.includes('仁心医者'), `compassionate summary should say 仁心医者, got: ${compSum}`);
  assert(compSum!.includes('周边村子'), `compassionate summary should mention 周边村子, got: ${compSum}`);

  const pragSum = deriveOrdinaryOriginSummary({
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_pragmatic_healer: true,
    tavern_medical_on_ramp_pragmatic: true,
  } as any);
  assert(Boolean(pragSum), 'pragmatic on-ramp summary exists');
  assert(pragSum!.includes('世故人医'), `pragmatic summary should say 世故人医, got: ${pragSum}`);
  assert(pragSum!.includes('大户'), `pragmatic summary should mention 大户, got: ${pragSum}`);
}

function testFlagNamingConsistency(): void {
  const loader = EventLoader.getInstance();
  const renownEvent = loader.getEventById('renown_on_ramp');
  const compEvent = loader.getEventById('medical_on_ramp_compassionate');

  const renownFlags = renownEvent?.autoEffects
    ?.filter((e: any) => e.type === 'flag_set')
    .map((e: any) => e.target) || [];
  const compFlags = compEvent?.autoEffects
    ?.filter((e: any) => e.type === 'flag_set')
    .map((e: any) => e.target) || [];

  assert(
    renownFlags.some((f: string) => f === 'renown_on_ramp_done'),
    'renown has route_on_ramp_done checkpoint',
  );
  assert(
    compFlags.some((f: string) => f === 'medical_on_ramp_done'),
    'medical has route_on_ramp_done checkpoint',
  );

  assert(
    renownFlags.some((f: string) => f.startsWith('tavern_renown_on_ramp')),
    'renown has tavern_route_on_ramp variant marker',
  );
  assert(
    compFlags.some((f: string) => f.startsWith('tavern_medical_on_ramp')),
    'medical has tavern_route_on_ramp variant marker',
  );
}

console.log('=== P85: Medical On-Ramp Narrow Regression Tests ===\n');

testMedicalOnRampEventsLoaded();
console.log('✓ medical on-ramp events loaded');

testMedicalOnRampEventConditions();
console.log('✓ medical on-ramp event conditions correct');

testMedicalOnRampEventEffects();
console.log('✓ medical on-ramp event effects correct');

testSampleLineCurrentGoalBranches();
console.log('✓ sample line current goal branches correct');

testOrdinaryOriginCurrentGoalBranches();
console.log('✓ ordinary origin current goal branches correct');

testOrdinaryOriginLifeMemoryBranches();
console.log('✓ ordinary origin life memory branches correct');

testOrdinaryOriginSummaryBranches();
console.log('✓ ordinary origin summary branches correct');

testFlagNamingConsistency();
console.log('✓ flag naming consistent with renown pattern');

console.log('\n✅ All P85 medical on-ramp regression tests passed');
