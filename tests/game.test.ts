import { describe, it, expect } from 'vitest';
import { Game } from '../src/engine/game';

describe('Game Integration', () => {
  it('should create a game with 3 players', () => {
    const game = new Game(['Alice', 'Bob', 'Charlie'], 12345);
    const state = game.getState();

    expect(state.players.length).toBe(3);
    expect(state.board.tiles.size).toBe(19);
    expect(state.turn.phase).toBe('setup');
  });

  it('should create a game with 4 players', () => {
    const game = new Game(['Alice', 'Bob', 'Charlie', 'David'], 12345);
    const state = game.getState();

    expect(state.players.length).toBe(4);
  });

  it('should start in setup phase', () => {
    const game = new Game(['Alice', 'Bob', 'Charlie'], 12345);

    expect(game.getCurrentPhase()).toBe('setup');
    expect(game.isGameOver()).toBe(false);
  });

  it('should track current player', () => {
    const game = new Game(['Alice', 'Bob', 'Charlie'], 12345);
    const currentPlayer = game.getCurrentPlayer();

    expect(currentPlayer.name).toBe('Alice');
  });

  it('should have reproducible board with seed', () => {
    const game1 = new Game(['Alice', 'Bob', 'Charlie'], 99999);
    const game2 = new Game(['Alice', 'Bob', 'Charlie'], 99999);

    const tiles1 = Array.from(game1.getState().board.tiles.values()).map((t) => ({
      type: t.type,
      number: t.numberToken,
    }));

    const tiles2 = Array.from(game2.getState().board.tiles.values()).map((t) => ({
      type: t.type,
      number: t.numberToken,
    }));

    expect(tiles1).toEqual(tiles2);
  });

  it('should build adjacency graph', () => {
    const game = new Game(['Alice', 'Bob', 'Charlie'], 12345);
    const state = game.getState();

    expect(state.board.vertices.size).toBeGreaterThan(0);
    expect(state.board.edges.size).toBeGreaterThan(0);
  });

  it('should throw error for invalid player count', () => {
    expect(() => new Game(['Alice'], 12345)).toThrow();
    expect(() => new Game(['Alice', 'Bob'], 12345)).toThrow();
  });

  it('should provide game summary', () => {
    const game = new Game(['Alice', 'Bob', 'Charlie'], 12345);
    const summary = game.getSummary();

    expect(summary).toContain('CATAN GAME');
    expect(summary).toContain('Alice');
    expect(summary).toContain('Bob');
    expect(summary).toContain('Charlie');
  });

  it('should list available actions in setup', () => {
    const game = new Game(['Alice', 'Bob', 'Charlie'], 12345);
    const actions = game.getAvailableActions();

    expect(actions).toContain('placeSettlement');
  });
});

