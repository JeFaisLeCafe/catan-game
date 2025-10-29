import { PlayerState, ResourceCount, PLAYER_COLORS, PlayerColor } from './types';

export function createPlayer(id: string, name: string, color: PlayerColor): PlayerState {
  return {
    id,
    name,
    color,
    resources: createEmptyResourceCount(),
    settlements: [],
    cities: [],
    roads: [],
    devCards: [],
    devCardsPlayedThisTurn: 0,
    knightsPlayed: 0,
    victoryPoints: 0,
    hasLongestRoad: false,
    hasLargestArmy: false,
  };
}

export function createEmptyResourceCount(): ResourceCount {
  return {
    wood: 0,
    brick: 0,
    sheep: 0,
    wheat: 0,
    ore: 0,
  };
}

export function addResources(
  current: ResourceCount,
  toAdd: Partial<ResourceCount>
): ResourceCount {
  return {
    wood: current.wood + (toAdd.wood || 0),
    brick: current.brick + (toAdd.brick || 0),
    sheep: current.sheep + (toAdd.sheep || 0),
    wheat: current.wheat + (toAdd.wheat || 0),
    ore: current.ore + (toAdd.ore || 0),
  };
}

export function removeResources(
  current: ResourceCount,
  toRemove: Partial<ResourceCount>
): ResourceCount {
  return {
    wood: current.wood - (toRemove.wood || 0),
    brick: current.brick - (toRemove.brick || 0),
    sheep: current.sheep - (toRemove.sheep || 0),
    wheat: current.wheat - (toRemove.wheat || 0),
    ore: current.ore - (toRemove.ore || 0),
  };
}

export function hasResources(
  current: ResourceCount,
  required: Partial<ResourceCount>
): boolean {
  return (
    current.wood >= (required.wood || 0) &&
    current.brick >= (required.brick || 0) &&
    current.sheep >= (required.sheep || 0) &&
    current.wheat >= (required.wheat || 0) &&
    current.ore >= (required.ore || 0)
  );
}

export function countResources(resources: ResourceCount): number {
  return resources.wood + resources.brick + resources.sheep + resources.wheat + resources.ore;
}

export function getPlayerColor(index: number): PlayerColor {
  return PLAYER_COLORS[index % PLAYER_COLORS.length];
}

export function clonePlayer(player: PlayerState): PlayerState {
  return {
    ...player,
    resources: { ...player.resources },
    settlements: [...player.settlements],
    cities: [...player.cities],
    roads: [...player.roads],
    devCards: player.devCards.map((card) => ({ ...card })),
  };
}

