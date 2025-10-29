import { describe, it, expect } from 'vitest';
import { createInitialState } from '../src/core/state';
import { generateBoard } from '../src/generators/board-generator';
import { buildAdjacencyGraph } from '../src/generators/adjacency';
import {
  canPlaceSettlement,
  canPlaceCity,
  canPlaceRoad,
  canBuyDevCard,
  canEndTurn,
} from '../src/engine/rules';

describe('Rules Engine', () => {
  it('should allow settlement placement during setup', () => {
    const state = createInitialState(['Alice', 'Bob', 'Charlie'], 12345);
    state.board = buildAdjacencyGraph(generateBoard(12345));

    const player = state.players[0];
    const vertexId = Array.from(state.board.vertices.keys())[0];

    const result = canPlaceSettlement(state, player.id, vertexId);
    expect(result.valid).toBe(true);
  });

  it('should not allow settlement on occupied vertex', () => {
    const state = createInitialState(['Alice', 'Bob', 'Charlie'], 12345);
    state.board = buildAdjacencyGraph(generateBoard(12345));

    const vertexId = Array.from(state.board.vertices.keys())[0];
    const vertex = state.board.vertices.get(vertexId)!;

    // Place a settlement
    vertex.structure = { playerId: 'player_0', type: 'settlement' };

    const result = canPlaceSettlement(state, 'player_1', vertexId);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('occupied');
  });

  it('should enforce distance rule for settlements', () => {
    const state = createInitialState(['Alice', 'Bob', 'Charlie'], 12345);
    state.board = buildAdjacencyGraph(generateBoard(12345));

    const vertices = Array.from(state.board.vertices.values());
    const vertex1 = vertices[0];
    const adjacentVertexId = vertex1.adjacentVertices[0];

    // Place settlement on first vertex
    vertex1.structure = { playerId: 'player_0', type: 'settlement' };

    // Try to place on adjacent vertex
    const result = canPlaceSettlement(state, 'player_1', adjacentVertexId);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('distance');
  });

  it('should require resources for settlement in main game', () => {
    const state = createInitialState(['Alice', 'Bob', 'Charlie'], 12345);
    state.board = buildAdjacencyGraph(generateBoard(12345));
    state.turn.phase = 'main';

    const player = state.players[0];
    const vertex = Array.from(state.board.vertices.values())[0];
    const vertexId = vertex.id;

    // Place a road to satisfy connectivity requirement
    const edgeId = vertex.adjacentEdges[0];
    const edge = state.board.edges.get(edgeId)!;
    edge.road = { playerId: player.id };
    player.roads.push(edgeId);

    // No resources
    const result = canPlaceSettlement(state, player.id, vertexId);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('resources');
  });

  it('should require settlement for city upgrade', () => {
    const state = createInitialState(['Alice', 'Bob', 'Charlie'], 12345);
    state.board = buildAdjacencyGraph(generateBoard(12345));
    state.turn.phase = 'main';

    const vertexId = Array.from(state.board.vertices.keys())[0];

    const result = canPlaceCity(state, 'player_0', vertexId);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('settlement');
  });

  it('should not allow cities during setup', () => {
    const state = createInitialState(['Alice', 'Bob', 'Charlie'], 12345);
    state.board = buildAdjacencyGraph(generateBoard(12345));

    const vertexId = Array.from(state.board.vertices.keys())[0];

    const result = canPlaceCity(state, 'player_0', vertexId);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('setup');
  });

  it('should allow road placement connecting to settlement in setup', () => {
    const state = createInitialState(['Alice', 'Bob', 'Charlie'], 12345);
    state.board = buildAdjacencyGraph(generateBoard(12345));

    const player = state.players[0];
    const vertex = Array.from(state.board.vertices.values())[0];

    // Place settlement
    vertex.structure = { playerId: player.id, type: 'settlement' };
    player.settlements.push(vertex.id);

    // Try to place road on adjacent edge
    const edgeId = vertex.adjacentEdges[0];

    const result = canPlaceRoad(state, player.id, edgeId);
    expect(result.valid).toBe(true);
  });

  it('should not allow buying dev card during setup', () => {
    const state = createInitialState(['Alice', 'Bob', 'Charlie'], 12345);

    const result = canBuyDevCard(state, 'player_0');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('setup');
  });

  it('should require rolling dice before ending turn', () => {
    const state = createInitialState(['Alice', 'Bob', 'Charlie'], 12345);
    state.turn.phase = 'main';

    const result = canEndTurn(state, 'player_0');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('roll');
  });
});

