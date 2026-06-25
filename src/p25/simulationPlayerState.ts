import { createDefaultPlayerLifeStates } from '../data/life/lifeStates';
import type { OriginId, PlayerLifeStates, PlayerState } from '../types/eventTypes';

interface SimulationPlayerStateOptions {
  name: string;
  age: number;
  origin: OriginId;
  martialPower: number;
  reputation: number;
  connections: number;
  money: number;
  alive: boolean;
  lifeStates?: Partial<PlayerLifeStates>;
}

export function createSimulationPlayerState({
  name,
  age,
  origin,
  martialPower,
  reputation,
  connections,
  money,
  alive,
  lifeStates = {},
}: SimulationPlayerStateOptions): PlayerState {
  return {
    age,
    gender: 'male',
    name,
    martialPower,
    externalSkill: 0,
    internalSkill: 0,
    qinggong: 0,
    chivalry: 0,
    constitution: 0,
    comprehension: 0,
    sect: null,
    title: null,
    reputation,
    money,
    knowledge: 0,
    charisma: 0,
    businessAcumen: 0,
    influence: 0,
    connections,
    martialHeritage: 0,
    scholarlyHeritage: 0,
    merchantNetwork: 0,
    flags: {},
    events: [],
    children: 0,
    spouse: null,
    alive,
    talents: [],
    traitProfile: { origin },
    lifeStates: createDefaultPlayerLifeStates(lifeStates),
  };
}
