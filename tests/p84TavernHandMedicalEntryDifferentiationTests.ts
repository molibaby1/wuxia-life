import { detectSampleLine, deriveSampleLineCostLabel, deriveSampleLineCurrentGoal } from '../src/p50/sampleLineExpression';
import {
  deriveOrdinaryOriginCurrentGoal,
  deriveOrdinaryOriginLifeMemory,
  deriveOrdinaryOriginSummary,
} from '../src/p56/ordinaryOriginExpression';
import { getPlayerRouteSummary } from '../src/utils/playerFacingLabels';
import { createDefaultPlayerLifeStates } from '../src/data/life/lifeStates';
import type { GameState } from '../src/types/eventTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function makeState(age: number, flags: Record<string, unknown>): GameState {
  return {
    player: {
      age,
      name: 'fixture',
      gender: 'male',
      martialPower: 30,
      chivalry: 10,
      constitution: 50,
      comprehension: 30,
      affiliation: null,
      title: null,
      reputation: 10,
      money: 100,
      knowledge: 15,
      charisma: 10,
      businessAcumen: 10,
      influence: 8,
      connections: 5,
      martialHeritage: 0,
      scholarlyHeritage: 0,
      merchantNetwork: 0,
      children: 0,
      spouse: null,
      alive: true,
      flags: {},
      lifeStates: createDefaultPlayerLifeStates(),
    },
    flags,
    relations: {},
    achievements: [],
    eventHistory: [],
  } as GameState;
}

function testMedicalSampleLineDetection(): void {
  const medicalBridge = makeState(29, {
    tavern_medical_bridge_crossed: true,
    tavern_embrace_compassionate_healer: true,
  });
  const line = detectSampleLine(medicalBridge.flags ?? {});
  assert(line === 'medical', `medical bridge should detect as 'medical' sample line: ${line}`);

  const medicalCommitted = makeState(30, {
    route_medical_committed: true,
  });
  const line2 = detectSampleLine(medicalCommitted.flags ?? {});
  assert(line2 === 'medical', `route_medical_committed should detect as 'medical' sample line: ${line2}`);
}

function testMedicalSampleLinePriorityOverRenown(): void {
  const both = makeState(29, {
    tavern_medical_bridge_crossed: true,
    tavern_renown_bridge_crossed: true,
  });
  const line = detectSampleLine(both.flags ?? {});
  assert(line === 'medical', `medical should take priority over renown: ${line}`);
}

function testMedicalCostLabel(): void {
  const base = makeState(29, {
    tavern_medical_bridge_crossed: true,
  });
  const label = deriveSampleLineCostLabel(base);
  assert(label === '行医之重', `medical base cost label should be 行医之重: ${label}`);

  const compassionate = makeState(29, {
    tavern_medical_bridge_crossed: true,
    tavern_embrace_compassionate_healer: true,
  });
  const compLabel = deriveSampleLineCostLabel(compassionate);
  assert(compLabel === '仁心之累', `compassionate medical cost label should be 仁心之累: ${compLabel}`);

  const pragmatic = makeState(29, {
    tavern_medical_bridge_crossed: true,
    tavern_embrace_pragmatic_healer: true,
  });
  const pragLabel = deriveSampleLineCostLabel(pragmatic);
  assert(pragLabel === '世故之秤', `pragmatic medical cost label should be 世故之秤: ${pragLabel}`);
}

function testMedicalCostLabelDistinctFromOtherRoutes(): void {
  const merchant = makeState(29, { tavern_merchant_bridge_crossed: true });
  const renown = makeState(29, { tavern_renown_bridge_crossed: true });
  const medicalComp = makeState(29, {
    tavern_medical_bridge_crossed: true,
    tavern_embrace_compassionate_healer: true,
  });
  const medicalPrag = makeState(29, {
    tavern_medical_bridge_crossed: true,
    tavern_embrace_pragmatic_healer: true,
  });

  const merchantLabel = deriveSampleLineCostLabel(merchant);
  const renownLabel = deriveSampleLineCostLabel(renown);
  const compLabel = deriveSampleLineCostLabel(medicalComp);
  const pragLabel = deriveSampleLineCostLabel(medicalPrag);

  assert(compLabel !== merchantLabel, `medical comp label should differ from merchant: ${compLabel} vs ${merchantLabel}`);
  assert(compLabel !== renownLabel, `medical comp label should differ from renown: ${compLabel} vs ${renownLabel}`);
  assert(pragLabel !== merchantLabel, `medical prag label should differ from merchant: ${pragLabel} vs ${merchantLabel}`);
  assert(pragLabel !== renownLabel, `medical prag label should differ from renown: ${pragLabel} vs ${renownLabel}`);
  assert(compLabel !== pragLabel, `two medical variants should have different cost labels: ${compLabel} vs ${pragLabel}`);
}

function testMedicalCurrentGoalSampleLine(): void {
  const base = makeState(29, {
    tavern_medical_bridge_crossed: true,
  });
  const goal = deriveSampleLineCurrentGoal(base);
  assert(Boolean(goal?.includes('酒肆')), `medical sample-line goal should mention 酒肆: ${goal}`);
  assert(Boolean(goal?.includes('药庐') || goal?.includes('医术')), `medical sample-line goal should mention 药庐/医术: ${goal}`);

  const compassionate = makeState(29, {
    tavern_medical_bridge_crossed: true,
    tavern_embrace_compassionate_healer: true,
  });
  const compGoal = deriveSampleLineCurrentGoal(compassionate);
  assert(Boolean(compGoal?.includes('多救') || compGoal?.includes('挤不下')), `compassionate goal should have compassionate flavor: ${compGoal}`);

  const pragmatic = makeState(29, {
    tavern_medical_bridge_crossed: true,
    tavern_embrace_pragmatic_healer: true,
  });
  const pragGoal = deriveSampleLineCurrentGoal(pragmatic);
  assert(Boolean(pragGoal?.includes('名声') || pragGoal?.includes('银子') || pragGoal?.includes('分寸')), `pragmatic goal should have pragmatic flavor: ${pragGoal}`);
}

function testMedicalCurrentGoalOrdinaryOrigin(): void {
  const base = makeState(29, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
  });
  const goal = deriveOrdinaryOriginCurrentGoal(base) ?? '';
  assert(goal.includes('酒肆'), `medical ordinary goal should mention 酒肆: ${goal}`);
  assert(goal.includes('药庐') || goal.includes('看病'), `medical ordinary goal should mention 药庐/看病: ${goal}`);

  const compassionate = makeState(29, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_compassionate_healer: true,
  });
  const compGoal = deriveOrdinaryOriginCurrentGoal(compassionate) ?? '';
  assert(compGoal.includes('有钱没钱'), `compassionate ordinary goal should have flavor: ${compGoal}`);

  const pragmatic = makeState(29, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_pragmatic_healer: true,
  });
  const pragGoal = deriveOrdinaryOriginCurrentGoal(pragmatic) ?? '';
  assert(pragGoal.includes('人情世故'), `pragmatic ordinary goal should have flavor: ${pragGoal}`);
}

function testMedicalRouteSummary(): void {
  const base = makeState(29, {
    tavern_medical_bridge_crossed: true,
  });
  const summary = getPlayerRouteSummary(base);
  assert(summary.name.includes('医') || summary.name.includes('医者'), `medical route summary name should include 医: ${summary.name}`);

  const compassionate = makeState(29, {
    tavern_medical_bridge_crossed: true,
    tavern_embrace_compassionate_healer: true,
  });
  const compSummary = getPlayerRouteSummary(compassionate);
  assert(compSummary.name === '仁心医者', `compassionate route name should be 仁心医者: ${compSummary.name}`);

  const pragmatic = makeState(29, {
    tavern_medical_bridge_crossed: true,
    tavern_embrace_pragmatic_healer: true,
  });
  const pragSummary = getPlayerRouteSummary(pragmatic);
  assert(pragSummary.name === '世故人医', `pragmatic route name should be 世故人医: ${pragSummary.name}`);
}

function testMedicalRouteSummaryDistinct(): void {
  const merchant = makeState(29, { tavern_merchant_bridge_crossed: true });
  const renown = makeState(29, { tavern_renown_bridge_crossed: true });
  const medicalComp = makeState(29, {
    tavern_medical_bridge_crossed: true,
    tavern_embrace_compassionate_healer: true,
  });
  const medicalPrag = makeState(29, {
    tavern_medical_bridge_crossed: true,
    tavern_embrace_pragmatic_healer: true,
  });

  const merchantName = getPlayerRouteSummary(merchant).name;
  const renownName = getPlayerRouteSummary(renown).name;
  const compName = getPlayerRouteSummary(medicalComp).name;
  const pragName = getPlayerRouteSummary(medicalPrag).name;

  assert(compName !== merchantName, `medical comp name should differ from merchant: ${compName} vs ${merchantName}`);
  assert(compName !== renownName, `medical comp name should differ from renown: ${compName} vs ${renownName}`);
  assert(pragName !== merchantName, `medical prag name should differ from merchant: ${pragName} vs ${merchantName}`);
  assert(pragName !== renownName, `medical prag name should differ from renown: ${pragName} vs ${renownName}`);
  assert(compName !== pragName, `two medical variants should have different route names: ${compName} vs ${pragName}`);
}

function testMedicalSummaryTavernBornFlavor(): void {
  const compassionate = makeState(30, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_compassionate_healer: true,
  });
  const compSummary = deriveOrdinaryOriginSummary(compassionate.flags ?? {}) ?? '';
  assert(compSummary.includes('酒肆出身'), `compassionate summary should say 酒肆出身: ${compSummary}`);
  assert(compSummary.includes('仁心医者'), `compassionate summary should say 仁心医者: ${compSummary}`);

  const pragmatic = makeState(30, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_pragmatic_healer: true,
  });
  const pragSummary = deriveOrdinaryOriginSummary(pragmatic.flags ?? {}) ?? '';
  assert(pragSummary.includes('酒肆出身'), `pragmatic summary should say 酒肆出身: ${pragSummary}`);
  assert(pragSummary.includes('世故人医'), `pragmatic summary should say 世故人医: ${pragSummary}`);
}

function testMedicalLifeMemoryVariantsDistinct(): void {
  const compassionate = makeState(30, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_compassionate_healer: true,
  });
  const pragmatic = makeState(30, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_pragmatic_healer: true,
  });

  const compMemory = deriveOrdinaryOriginLifeMemory(compassionate.flags ?? {}) ?? '';
  const pragMemory = deriveOrdinaryOriginLifeMemory(pragmatic.flags ?? {}) ?? '';

  assert(compMemory !== pragMemory, 'two medical variant lifeMemories should be different');
  assert(compMemory.includes('酒肆'), `compassionate memory should have tavern flavor: ${compMemory}`);
  assert(pragMemory.includes('酒肆'), `pragmatic memory should have tavern flavor: ${pragMemory}`);
}

function testMedicalDoesNotAffectNonTavern(): void {
  const peasant = makeState(30, {
    origin_farm_peasant: true,
    peasant_steadfast_field: true,
  });
  const line = detectSampleLine(peasant.flags ?? {});
  assert(line !== 'medical', `peasant should not be medical: ${line}`);

  const peasantGoal = deriveOrdinaryOriginCurrentGoal(peasant) ?? '';
  assert(!peasantGoal.includes('药庐'), `peasant goal should not have medical: ${peasantGoal}`);

  const apprentice = makeState(30, {
    origin_town_apprentice: true,
    apprentice_craft_committed: true,
  });
  const appLine = detectSampleLine(apprentice.flags ?? {});
  assert(appLine !== 'medical', `apprentice should not be medical: ${appLine}`);
}

function testExistingRenownSampleLineStillWorks(): void {
  const renown = makeState(30, {
    tavern_renown_bridge_crossed: true,
  });
  const line = detectSampleLine(renown.flags ?? {});
  assert(line === 'renown', `renown should still detect as renown: ${line}`);

  const label = deriveSampleLineCostLabel(renown);
  assert(label === '江湖声名之累', `renown cost label should still be 江湖声名之累: ${label}`);
}

function testExistingMerchantSampleLineStillWorks(): void {
  const merchant = makeState(30, {
    tavern_merchant_bridge_crossed: true,
  });
  const line = detectSampleLine(merchant.flags ?? {});
  assert(line === 'merchant', `merchant should still detect as merchant: ${line}`);

  const label = deriveSampleLineCostLabel(merchant);
  assert(label === '商路债务', `merchant cost label should still be 商路债务: ${label}`);
}

function testMedicalSampleLineWithNoVariantStillWorks(): void {
  const justBridge = makeState(29, {
    tavern_medical_bridge_crossed: true,
  });
  const line = detectSampleLine(justBridge.flags ?? {});
  assert(line === 'medical', `medical bridge without variant should still detect: ${line}`);

  const goal = deriveSampleLineCurrentGoal(justBridge);
  assert(Boolean(goal), 'medical bridge without variant should still have a goal');
  assert(Boolean(goal?.includes('酒肆')), `goal should still have tavern flavor: ${goal}`);

  const label = deriveSampleLineCostLabel(justBridge);
  assert(label === '行医之重', `base medical label should be 行医之重: ${label}`);
}

function main(): void {
  testMedicalSampleLineDetection();
  testMedicalSampleLinePriorityOverRenown();
  testMedicalCostLabel();
  testMedicalCostLabelDistinctFromOtherRoutes();
  testMedicalCurrentGoalSampleLine();
  testMedicalCurrentGoalOrdinaryOrigin();
  testMedicalRouteSummary();
  testMedicalRouteSummaryDistinct();
  testMedicalSummaryTavernBornFlavor();
  testMedicalLifeMemoryVariantsDistinct();
  testMedicalDoesNotAffectNonTavern();
  testExistingRenownSampleLineStillWorks();
  testExistingMerchantSampleLineStillWorks();
  testMedicalSampleLineWithNoVariantStillWorks();
  console.log('p84MedicalEntryDifferentiationTests: all passed');
}

main();
