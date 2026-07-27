import { EventLoader } from '../src/core/EventLoader';

const P42_HABIT_EVENT_IDS = [
  'p42_training_habit_youth_sparring',
  'p42_training_habit_later_guardian',
  'p42_study_habit_childhood_copybook',
  'p42_study_habit_later_chronicle',
  'p42_business_habit_youth_stall',
  'p42_business_habit_midlife_syndicate',
  'p42_training_habit_martial_clan_echo',
  'p42_training_habit_scholar_body_echo',
  'p42_study_habit_scholar_academy_echo',
  'p42_study_habit_merchant_ledger_echo',
] as const;

const P42_SOCIAL_EVENT_IDS = [
  'p42_social_momentum_youth_introduction',
  'p42_social_momentum_later_testimonial',
] as const;

const HABIT_AXES = ['trainingHabit', 'studyHabit', 'businessHabit'] as const;

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function ageBand(min: number, max: number): string[] {
  const bands = ['childhood', 'youth', 'early_adult', 'midlife', 'later_life'];
  const ranges: [number, number][] = [[0, 12], [13, 19], [20, 34], [35, 49], [50, 999]];
  return bands.filter((_, i) => min <= ranges[i][1] && max >= ranges[i][0]);
}

function testP42HabitEventsExistAndGateAxes(): void {
  const loader = EventLoader.getInstance();
  for (const id of P42_HABIT_EVENT_IDS) {
    const event = loader.getEventById(id);
    assert(event != null, `missing P42 event ${id}`);
    const raw = JSON.stringify(event?.conditions ?? []);
    assert(HABIT_AXES.some((axis) => raw.includes(axis)), `${id} should gate on a habit axis`);
  }
}

function testP42HabitAxisCoverage(): void {
  const loader = EventLoader.getInstance();
  const bandHits = new Map<string, Set<string>>();
  for (const axis of HABIT_AXES) bandHits.set(axis, new Set());

  for (const id of P42_HABIT_EVENT_IDS) {
    const event = loader.getEventById(id)!;
    const raw = JSON.stringify(event.conditions ?? []);
    const axis = HABIT_AXES.find((a) => raw.includes(a));
    if (!axis) continue;
    for (const band of ageBand(event.ageRange?.min ?? 0, event.ageRange?.max ?? 100)) {
      bandHits.get(axis)!.add(band);
    }
  }

  assert(bandHits.get('trainingHabit')!.size >= 2, 'trainingHabit P42 samples should span 2+ bands');
  assert(bandHits.get('studyHabit')!.size >= 2, 'studyHabit P42 samples should span 2+ bands');
  assert(bandHits.get('businessHabit')!.size >= 2, 'businessHabit P42 samples should span 2+ bands');
  assert(P42_HABIT_EVENT_IDS.length === 10, 'expected 10 habit-focused P42 samples');
}

function testP42SocialEventsUseConcretePrerequisites(): void {
  const loader = EventLoader.getInstance();
  const youthIntroduction = loader.getEventById(P42_SOCIAL_EVENT_IDS[0]);
  assert(youthIntroduction != null, 'missing p42_social_momentum_youth_introduction');
  assert(
    youthIntroduction?.conditions?.[0]?.type === 'expression'
      && youthIntroduction.conditions[0].expression === 'connections >= 5 || reputation >= 10',
    'p42_social_momentum_youth_introduction must use the concrete social prerequisite',
  );

  const laterTestimonial = loader.getEventById(P42_SOCIAL_EVENT_IDS[1]);
  assert(laterTestimonial != null, 'missing p42_social_momentum_later_testimonial');
  assert(
    laterTestimonial?.conditions?.[0]?.type === 'expression'
      && laterTestimonial.conditions[0].expression ===
        'reputation >= 20 && (flags.p28_social_reputation_reinforced == true || flags.p29_social_patron_obligation_taken == true)',
    'p42_social_momentum_later_testimonial must use the concrete late-life prerequisite',
  );
}

function main(): void {
  testP42HabitEventsExistAndGateAxes();
  testP42HabitAxisCoverage();
  testP42SocialEventsUseConcretePrerequisites();
  console.log('p42ContentDensityTests: all passed');
}

main();
