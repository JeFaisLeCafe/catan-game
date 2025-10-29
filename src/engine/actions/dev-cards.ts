import {
  GameState,
  ResourceType,
  GAME_CONSTANTS,
} from '../../core/types';
import { cloneGameState, getPlayerById } from '../../core/state';
import { removeResources } from '../../core/player';
import { SeededRandom } from '../../utils/random';
import * as Rules from '../rules';

export function buyDevCard(state: GameState, playerId: string): GameState {
  const validation = Rules.canBuyDevCard(state, playerId);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const newState = cloneGameState(state);
  const player = getPlayerById(newState, playerId)!;

  const cardType = newState.devCardDeck.pop()!;
  player.devCards.push({ type: cardType, playedThisTurn: false });

  player.resources = removeResources(player.resources, GAME_CONSTANTS.COSTS.devCard);

  return newState;
}

export function playKnight(
  state: GameState,
  playerId: string,
  newRobberHexId: string,
  targetPlayerId?: string
): GameState {
  const validation = Rules.canPlayKnight(state, playerId, newRobberHexId, targetPlayerId);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const newState = cloneGameState(state);
  const player = getPlayerById(newState, playerId)!;

  const cardIndex = player.devCards.findIndex((c) => c.type === 'knight' && !c.playedThisTurn);
  if (cardIndex !== -1) {
    player.devCards.splice(cardIndex, 1);
  }

  player.knightsPlayed++;
  player.devCardsPlayedThisTurn++;

  newState.board.tiles.forEach((tile) => {
    tile.hasRobber = tile.id === newRobberHexId;
  });

  if (targetPlayerId) {
    const targetPlayer = getPlayerById(newState, targetPlayerId)!;
    const availableResources: ResourceType[] = [];

    Object.entries(targetPlayer.resources).forEach(([resource, count]) => {
      for (let i = 0; i < count; i++) {
        availableResources.push(resource as ResourceType);
      }
    });

    if (availableResources.length > 0) {
      const random = new SeededRandom(Date.now());
      const stolenResource = random.choice(availableResources);

      targetPlayer.resources[stolenResource]--;
      player.resources[stolenResource]++;
    }
  }

  return newState;
}

export function playRoadBuilding(
  state: GameState,
  playerId: string,
  edge1Id: string,
  edge2Id?: string
): GameState {
  const validation = Rules.canPlayDevCard(state, playerId, 'roadBuilding');
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const newState = cloneGameState(state);
  const player = getPlayerById(newState, playerId)!;

  const cardIndex = player.devCards.findIndex((c) => c.type === 'roadBuilding');
  if (cardIndex !== -1) {
    player.devCards.splice(cardIndex, 1);
  }

  player.devCardsPlayedThisTurn++;

  const edge1 = newState.board.edges.get(edge1Id);
  if (edge1 && !edge1.road && player.roads.length < GAME_CONSTANTS.MAX_ROADS) {
    edge1.road = { playerId };
    player.roads.push(edge1Id);
  }

  if (edge2Id) {
    const edge2 = newState.board.edges.get(edge2Id);
    if (edge2 && !edge2.road && player.roads.length < GAME_CONSTANTS.MAX_ROADS) {
      edge2.road = { playerId };
      player.roads.push(edge2Id);
    }
  }

  return newState;
}

export function playYearOfPlenty(
  state: GameState,
  playerId: string,
  resource1: ResourceType,
  resource2: ResourceType
): GameState {
  const validation = Rules.canPlayDevCard(state, playerId, 'yearOfPlenty');
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const newState = cloneGameState(state);
  const player = getPlayerById(newState, playerId)!;

  const cardIndex = player.devCards.findIndex((c) => c.type === 'yearOfPlenty');
  if (cardIndex !== -1) {
    player.devCards.splice(cardIndex, 1);
  }

  player.devCardsPlayedThisTurn++;

  player.resources[resource1]++;
  player.resources[resource2]++;

  return newState;
}

export function playMonopoly(
  state: GameState,
  playerId: string,
  resource: ResourceType
): GameState {
  const validation = Rules.canPlayDevCard(state, playerId, 'monopoly');
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const newState = cloneGameState(state);
  const player = getPlayerById(newState, playerId)!;

  const cardIndex = player.devCards.findIndex((c) => c.type === 'monopoly');
  if (cardIndex !== -1) {
    player.devCards.splice(cardIndex, 1);
  }

  player.devCardsPlayedThisTurn++;

  let totalStolen = 0;
  newState.players.forEach((p) => {
    if (p.id !== playerId) {
      totalStolen += p.resources[resource];
      p.resources[resource] = 0;
    }
  });

  player.resources[resource] += totalStolen;

  return newState;
}

