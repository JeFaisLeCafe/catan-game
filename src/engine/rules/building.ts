import {
  GameState,
  ValidationResult,
  GAME_CONSTANTS,
} from '../../core/types';
import { hasResources } from '../../core/player';
import { getPlayerById } from '../../core/state';

export function canPlaceSettlement(
  state: GameState,
  playerId: string,
  vertexId: string
): ValidationResult {
  const player = getPlayerById(state, playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  const vertex = state.board.vertices.get(vertexId);
  if (!vertex) {
    return { valid: false, error: 'Invalid vertex' };
  }

  if (vertex.structure) {
    return { valid: false, error: 'Vertex is already occupied' };
  }

  for (const adjVertexId of vertex.adjacentVertices) {
    const adjVertex = state.board.vertices.get(adjVertexId);
    if (adjVertex?.structure) {
      return { valid: false, error: 'Too close to another settlement (distance rule)' };
    }
  }

  if (state.turn.phase === 'setup') {
    const expectedSettlements = state.turn.setupRound || 0;
    if (player.settlements.length >= expectedSettlements) {
      return { valid: false, error: 'Already placed settlement for this setup round' };
    }
    return { valid: true };
  }

  let hasConnectingRoad = false;
  for (const edgeId of vertex.adjacentEdges) {
    const edge = state.board.edges.get(edgeId);
    if (edge?.road?.playerId === playerId) {
      hasConnectingRoad = true;
      break;
    }
  }

  if (!hasConnectingRoad) {
    return { valid: false, error: 'No connecting road to this vertex' };
  }

  if (!hasResources(player.resources, GAME_CONSTANTS.COSTS.settlement)) {
    return { valid: false, error: 'Insufficient resources for settlement' };
  }

  if (player.settlements.length >= GAME_CONSTANTS.MAX_SETTLEMENTS) {
    return { valid: false, error: 'Maximum settlements reached' };
  }

  return { valid: true };
}

export function canPlaceCity(
  state: GameState,
  playerId: string,
  vertexId: string
): ValidationResult {
  const player = getPlayerById(state, playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  if (state.turn.phase === 'setup') {
    return { valid: false, error: 'Cannot build cities during setup' };
  }

  const vertex = state.board.vertices.get(vertexId);
  if (!vertex) {
    return { valid: false, error: 'Invalid vertex' };
  }

  if (!vertex.structure || vertex.structure.type !== 'settlement') {
    return { valid: false, error: 'No settlement at this vertex' };
  }

  if (vertex.structure.playerId !== playerId) {
    return { valid: false, error: 'Settlement belongs to another player' };
  }

  if (!player.settlements.includes(vertexId)) {
    return { valid: false, error: 'Settlement already upgraded or not owned' };
  }

  if (!hasResources(player.resources, GAME_CONSTANTS.COSTS.city)) {
    return { valid: false, error: 'Insufficient resources for city' };
  }

  if (player.cities.length >= GAME_CONSTANTS.MAX_CITIES) {
    return { valid: false, error: 'Maximum cities reached' };
  }

  return { valid: true };
}

export function canPlaceRoad(
  state: GameState,
  playerId: string,
  edgeId: string
): ValidationResult {
  const player = getPlayerById(state, playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  const edge = state.board.edges.get(edgeId);
  if (!edge) {
    return { valid: false, error: 'Invalid edge' };
  }

  if (edge.road) {
    return { valid: false, error: 'Edge already has a road' };
  }

  if (state.turn.phase === 'setup') {
    const expectedRoads = state.turn.setupRound || 0;
    if (player.roads.length >= expectedRoads) {
      return { valid: false, error: 'Already placed road for this setup round' };
    }

    const lastSettlement = player.settlements[player.settlements.length - 1];
    if (!edge.vertices.includes(lastSettlement)) {
      return { valid: false, error: 'Road must connect to your settlement' };
    }

    return { valid: true };
  }

  let hasConnection = false;

  for (const vertexId of edge.vertices) {
    const vertex = state.board.vertices.get(vertexId);
    if (!vertex) continue;

    if (vertex.structure?.playerId === playerId) {
      hasConnection = true;
      break;
    }

    const hasOpponentStructure = vertex.structure && vertex.structure.playerId !== playerId;
    if (!hasOpponentStructure) {
      for (const adjEdgeId of vertex.adjacentEdges) {
        if (adjEdgeId === edgeId) continue;
        const adjEdge = state.board.edges.get(adjEdgeId);
        if (adjEdge?.road?.playerId === playerId) {
          hasConnection = true;
          break;
        }
      }
    }

    if (hasConnection) break;
  }

  if (!hasConnection) {
    return { valid: false, error: 'Road must connect to your network' };
  }

  if (!hasResources(player.resources, GAME_CONSTANTS.COSTS.road)) {
    return { valid: false, error: 'Insufficient resources for road' };
  }

  if (player.roads.length >= GAME_CONSTANTS.MAX_ROADS) {
    return { valid: false, error: 'Maximum roads reached' };
  }

  return { valid: true };
}

