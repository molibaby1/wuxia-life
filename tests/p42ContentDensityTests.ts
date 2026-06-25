import { EventLoader } from '../src/core/EventLoader';

const P42_EVENT_IDS = [
  'p42_training_habit_youth_sparring',
  'p42_training_habit_later_guardian',
  'p42_study_habit_childhood_copybook',
  'p42_study_habit_later_chronicle',
  'p42_business_habit_youth_stall',
  'p42_business_habit_midlife_syndicate',
  'p42_social_momentum_youth_introduction',
  'p42_social_momentum_later_testimonial',
  'p42_family_bond_festival_reunion',
  'p42_family_bond_estate_trust',
  'p42_training_habit_martial_clan_echo',
  'p42_training_habit_scholar_body_echo',
  'p42_study_habit_scholar_academy_echo',
  'p42_study_habit_merchant_ledger_echo',
] as const;

const AXES = ['trainingHabit', 'studyHabit', 'businessHabit', 'socialMomentum', 'familyBond'] as const;

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function ageBand(min: number, max: number): string[] {
  const bands = ['childhood', 'youth', 'early_adult', 'midlife', 'later_life'];
  const ranges: [number, number][] = [[0, 12], [13, 19], [20, 34], [35, 49], [50, 999]];
  return bands.filter((_, i) => min <= ranges[i][1] && max >= ranges[i][0]);
}

function testP42EventsExistAndGateAxes(): void {
  const loader = EventLoader.getInstance();
  for (const id of P42_EVENT_IDS) {
    const event = loader.getEventById(id);
    assert(event != null, `missing P42 event ${id}`);
    const raw = JSON.stringify(event?.conditions ?? []);
    assert(AXES.some((axis) => raw.includes(axis)), `${id} should gate on a habit/semi-personality axis`);
  }
}

function testP42MultiBandCoverage(): void {
  const loader = EventLoader.getInstance();
  const bandHits = new Map<string, Set<string>>();
  for (const axis of AXES) bandHits.set(axis, new Set());

  for (const id of P42_EVENT_IDS) {
    const event = loader.getEventById(id)!;
    const raw = JSON.stringify(event.conditions ?? []);
    const axis = AXES.find((a) => raw.includes(a));
    if (!axis) continue;
    for (const band of ageBand(event.ageRange?.min ?? 0, event.ageRange?.max ?? 100)) {
      bandHits.get(axis)!.add(band);
    }
  }

  assert(bandHits.get('trainingHabit')!.size >= 2, 'trainingHabit P42 samples should span 2+ bands');
  assert(bandHits.get('studyHabit')!.size >= 2, 'studyHabit P42 samples should span 2+ bands');
  assert(bandHits.get('businessHabit')!.size >= 2, 'businessHabit P42 samples should span 2+ bands');
  assert(bandHits.get('socialMomentum')!.size >= 2, 'socialMomentum P42 samples should span 2+ bands');
  assert(bandHits.get('familyBond')!.size >= 1, 'familyBond P42 samples should cover at least 1 band');
  assert(P42_EVENT_IDS.length >= 14, 'expected 14 P42 densification events');
}

function main(): void {
  testP42EventsExistAndGateAxes();
  testP42MultiBandCoverage();
  console.log('p42ContentDensityTests: all passed');
}

main();
