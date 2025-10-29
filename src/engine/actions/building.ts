import {
  GameState,
  ResourceType,
  GAME_CONSTANTS,
} from '../../core/types';
import { cloneGameState, getPlayerById } from '../../core/state';
import { removeResources } from '../../core/player';
import * as Rules from '../rules';

export function placeSettlement(state: GameState, playerId: string, vertexId: string): GameState {
  const validation = Rules.canPlaceSettlement(state, playerId, vertexId);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const newState = cloneGameState(state);
  const player = getPlayerById(newState, playerId)!;
  const vertex = newState.board.vertices.get(vertexId)!;

  vertex.structure = { playerId, type: 'settlement' };
  player.settlements.push(vertexId);

  if (newState.turn.phase !== 'setup') {
    player.resources = removeResources(player.resources, GAME_CONSTANTS.COSTS.settlement);
  }

  if (newState.turn.phase === 'setup' && newState.turn.setupRound === 2) {
    vertex.adjacentTiles.forEach((tileId) => {
      const tile = newState.board.tiles.get(tileId);
      if (tile && tile.type !== 'desert') {
        player.resources[tile.type as ResourceType] += 1;
      }
    });
  }

  if (newState.turn.phase === 'setup') {
    if (newState.turn.setupPhase === 'firstSettlement') {
      newState.turn.setupPhase = 'firstRoad';
    } else if (newState.turn.setupPhase === 'secondSettlement') {
      newState.turn.setupPhase = 'secondRoad';
    }
  }

  return newState;
}

export function placeCity(state: GameState, playerId: string, vertexId: string): GameState {
  const validation = Rules.canPlaceCity(state, playerId, vertexId);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const newState = cloneGameState(state);
  const player = getPlayerById(newState, playerId)!;
  const vertex = newState.board.vertices.get(vertexId)!;

  vertex.structure = { playerId, type: 'city' };

  player.settlements = player.settlements.filter((id) => id !== vertexId);
  player.cities.push(vertexId);

  player.resources = removeResources(player.resources, GAME_CONSTANTS.COSTS.city);

  return newState;
}

export function placeRoad(state: GameState, playerId: string, edgeId: string): GameState {
  const validation = Rules.canPlaceRoad(state, playerId, edgeId);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const newState = cloneGameState(state);
  const player = getPlayerById(newState, playerId)!;
  const edge = newState.board.edges.get(edgeId)!;

  edge.road = { playerId };
  player.roads.push(edgeId);

  if (newState.turn.phase !== 'setup') {
    player.resources = removeResources(player.resources, GAME_CONSTANTS.COSTS.road);
  }

  if (newState.turn.phase === 'setup') {
    if (newState.turn.setupPhase === 'firstRoad') {
      const isLastPlayer = newState.turn.currentPlayerIndex === newState.players.length - 1;
      if (isLastPlayer) {
        newState.turn.setupRound = 2;
        newState.turn.setupPhase = 'secondSettlement';
      } else {
        newState.turn.currentPlayerIndex++;
        newState.turn.setupPhase = 'firstSettlement';
      }
    } else if (newState.turn.setupPhase === 'secondRoad') {
      if (newState.turn.currentPlayerIndex === 0) {
        newState.turn.phase = 'main';
        newState.turn.setupPhase = undefined;
        newState.turn.setupRound = undefined;
        newState.turn.currentPlayerIndex = 0;
      } else {
        newState.turn.currentPlayerIndex--;
        newState.turn.setupPhase = 'secondSettlement';
      }
    }
  }

  return newState;
}

