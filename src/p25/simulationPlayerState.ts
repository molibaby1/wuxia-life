import { createDefaultPlayerLifeStates } from '../data/life/lifeStates';
import type {
  CoreTalentId,
  OriginId,
  PlayerLifeStates,
  PlayerState,
  TemperamentId,
  WeaknessId,
} from '../types/eventTypes';

interface SimulationPlayerStateOptions {
  name: string;
  age: number;
  origin: OriginId;
  coreTalent?: CoreTalentId;
  weakness?: WeaknessId;
  temperament?: TemperamentId;
  martialPower: number;
  reputation: number;
  connections: number;
  alive: boolean;
  lifeStates?: Partial<PlayerLifeStates>;
}

export function createSimulationPlayerState({
  name,
  age,
  origin,
  coreTalent = 'keen_mind',
  weakness = 'lazy',
  temperament = 'competitive',
  martialPower,
  reputation,
  connections,
  alive,
  lifeStates = {},
}: SimulationPlayerStateOptions): PlayerState {
  return {
    age,
    gender: 'male',
    name,
    martialPower,
    chivalry: 0,
    constitution: 0,
    affiliation: null,
    title: null,
    reputation,
    wealthCapacity: 'no_surplus',
    knowledge: 0,
    charisma: 0,
    businessAcumen: 0,
    influence: 0,
    connections,
    martialHeritage: 0,
    scholarlyHeritage: 0,
    merchantNetwork: 0,
    investments: { martial: 0, statecraft: 0, official: 0, hermit: 0 },
    flags: { origin_id: origin },
    events: [],
    children: 0,
    spouse: null,
    alive,
    traits: [coreTalent, weakness, temperament],
    healthStatus: 'healthy',
    statuses: [],
    lifeStates: createDefaultPlayerLifeStates(lifeStates),
  };
}
