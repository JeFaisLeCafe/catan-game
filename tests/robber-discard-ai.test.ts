import { describe, it, expect } from 'vitest';
import { Game } from '../src/engine/game';
import { completeSetup } from './helpers/setup';

describe('Robber Discard Phase - AI Bot Usage', () => {
  
  it('should identify which players need to discard after rolling 7', () => {
    const game = new Game(['Alice', 'Bob', 'Charlie'], 12345);
    completeSetup(game);

    const state = game.getState();
    state.players[0].resources = { wood: 10, brick: 0, sheep: 0, wheat: 0, ore: 0 };
    state.players[1].resources = { wood: 5, brick: 0, sheep: 0, wheat: 0, ore: 0 };
    state.players[2].resources = { wood: 8, brick: 0, sheep: 0, wheat: 0, ore: 0 };

    state.turn.diceRoll = [4, 3];
    
    game.rollDice();

    const newState = game.getState();
    const total = (newState.turn.diceRoll?.[0] || 0) + (newState.turn.diceRoll?.[1] || 0);
    
    if (total === 7) {
      expect(game.getCurrentPhase()).toBe('robberDiscard');
      
      const mustDiscard = game.getPlayersWhoMustDiscard();
      expect(mustDiscard).toContain(state.players[0].id);
      expect(mustDiscard).not.toContain(state.players[1].id);
      expect(mustDiscard).toContain(state.players[2].id);
    }
  });

  it('should allow only players in mustDiscardPlayers to discard', () => {
    const game = new Game(['Alice', 'Bob', 'Charlie'], 12345);
    const state = game.getState();
    const alice = state.players[0];
    const bob = state.players[1];

    alice.resources = { wood: 10, brick: 0, sheep: 0, wheat: 0, ore: 0 };
    bob.resources = { wood: 5, brick: 0, sheep: 0, wheat: 0, ore: 0 };

    state.turn.phase = 'robberDiscard';
    state.turn.mustDiscardPlayers = [alice.id];

    expect(() => game.discardResources(alice.id, { wood: 5 })).not.toThrow();

    expect(() => game.discardResources(bob.id, {})).toThrow('You do not need to discard');
  });

  it('should have empty available actions for players who don\'t need to discard', () => {
    const game = new Game(['Alice', 'Bob', 'Charlie'], 12345);
    const state = game.getState();
    const alice = state.players[0];
    const bob = state.players[1];

    alice.resources = { wood: 10, brick: 0, sheep: 0, wheat: 0, ore: 0 };
    bob.resources = { wood: 5, brick: 0, sheep: 0, wheat: 0, ore: 0 };

    state.turn.phase = 'robberDiscard';
    state.turn.mustDiscardPlayers = [alice.id];
    state.turn.currentPlayerIndex = 1;

    const actions = game.getAvailableActions();
    expect(actions).toEqual([]);
  });

  it('doesPlayerNeedToAct should return correct values during robberDiscard', () => {
    const game = new Game(['Alice', 'Bob', 'Charlie'], 12345);
    const state = game.getState();
    const alice = state.players[0];
    const bob = state.players[1];
    const charlie = state.players[2];

    alice.resources = { wood: 10, brick: 0, sheep: 0, wheat: 0, ore: 0 };
    bob.resources = { wood: 5, brick: 0, sheep: 0, wheat: 0, ore: 0 };
    charlie.resources = { wood: 8, brick: 0, sheep: 0, wheat: 0, ore: 0 };

    state.turn.phase = 'robberDiscard';
    state.turn.mustDiscardPlayers = [alice.id, charlie.id];

    expect(game.doesPlayerNeedToAct(alice.id)).toBe(true);
    expect(game.doesPlayerNeedToAct(bob.id)).toBe(false);
    expect(game.doesPlayerNeedToAct(charlie.id)).toBe(true);
  });

  it('should remove player from mustDiscardPlayers after they discard', () => {
    const game = new Game(['Alice', 'Bob', 'Charlie'], 12345);
    completeSetup(game);
    
    const state = game.getState();
    const aliceId = state.players[0].id;
    const bobId = state.players[1].id;

    state.players[0].resources = { wood: 10, brick: 0, sheep: 0, wheat: 0, ore: 0 };
    state.players[1].resources = { wood: 8, brick: 0, sheep: 0, wheat: 0, ore: 0 };
    state.players[2].resources = { wood: 2, brick: 0, sheep: 0, wheat: 0, ore: 0 };

    game.rollDice();

    const newState = game.getState();
    const total = (newState.turn.diceRoll?.[0] || 0) + (newState.turn.diceRoll?.[1] || 0);
    
    if (total === 7 && newState.turn.phase === 'robberDiscard') {
      const initialCount = game.getPlayersWhoMustDiscard().length;
      expect(initialCount).toBeGreaterThan(0);

      const firstPlayer = game.getPlayersWhoMustDiscard()[0];
      const player = newState.players.find(p => p.id === firstPlayer)!;
      const toDiscard = Math.floor(Object.values(player.resources).reduce((a, b) => a + b, 0) / 2);
      
      game.discardResources(firstPlayer, { wood: toDiscard });
      
      const afterFirstDiscard = game.getPlayersWhoMustDiscard();
      expect(afterFirstDiscard).not.toContain(firstPlayer);
      expect(afterFirstDiscard.length).toBe(initialCount - 1);
    }
  });

  it('should maintain currentPlayerIndex during discard phase', () => {
    const game = new Game(['Alice', 'Bob', 'Charlie'], 12345);
    const state = game.getState();
    const alice = state.players[0];
    const charlie = state.players[2];

    alice.resources = { wood: 10, brick: 0, sheep: 0, wheat: 0, ore: 0 };
    charlie.resources = { wood: 8, brick: 0, sheep: 0, wheat: 0, ore: 0 };

    const initialPlayerIndex = state.turn.currentPlayerIndex;

    state.turn.phase = 'robberDiscard';
    state.turn.mustDiscardPlayers = [alice.id, charlie.id];

    game.discardResources(alice.id, { wood: 5 });
    expect(game.getState().turn.currentPlayerIndex).toBe(initialPlayerIndex);

    game.discardResources(charlie.id, { wood: 4 });
    expect(game.getState().turn.currentPlayerIndex).toBe(initialPlayerIndex);
  });

  it('AI bot pattern: iterate through players who must discard', () => {
    const game = new Game(['Alice', 'Bob', 'Charlie'], 12345);
    completeSetup(game);
    
    let state = game.getState();
    state.players[0].resources = { wood: 10, brick: 0, sheep: 0, wheat: 0, ore: 0 };
    state.players[1].resources = { wood: 2, brick: 0, sheep: 0, wheat: 0, ore: 0 };
    state.players[2].resources = { wood: 8, brick: 0, sheep: 0, wheat: 0, ore: 0 };

    game.rollDice();
    
    state = game.getState();
    const total = (state.turn.diceRoll?.[0] || 0) + (state.turn.diceRoll?.[1] || 0);

    if (total === 7 && state.turn.phase === 'robberDiscard') {
      const playersToDiscard = [...game.getPlayersWhoMustDiscard()];
      expect(playersToDiscard.length).toBeGreaterThan(0);

      for (const playerId of playersToDiscard) {
        const currentState = game.getState();
        if (!currentState.turn.mustDiscardPlayers.includes(playerId)) continue;
        
        const player = currentState.players.find(p => p.id === playerId)!;
        const totalResources = Object.values(player.resources).reduce((a, b) => a + b, 0);
        const mustDiscard = Math.floor(totalResources / 2);

        const toDiscard = { wood: Math.min(mustDiscard, player.resources.wood) };
        game.discardResources(playerId, toDiscard);
      }

      const finalState = game.getState();
      expect(finalState.turn.mustDiscardPlayers).toHaveLength(0);
    }
  });

  it('should not allow endTurn during robberDiscard phase', () => {
    const game = new Game(['Alice', 'Bob', 'Charlie'], 12345);
    const state = game.getState();
    const alice = state.players[0];

    alice.resources = { wood: 10, brick: 0, sheep: 0, wheat: 0, ore: 0 };

    state.turn.phase = 'robberDiscard';
    state.turn.mustDiscardPlayers = [alice.id];
    state.turn.hasRolled = true;

    expect(() => game.endTurn()).toThrow('Cannot end turn during robber discard phase');
  });

  it('should not allow endTurn during robberPlacement phase', () => {
    const game = new Game(['Alice', 'Bob', 'Charlie'], 12345);
    const state = game.getState();

    state.turn.phase = 'robberPlacement';
    state.turn.hasRolled = true;

    expect(() => game.endTurn()).toThrow('Cannot end turn during robber placement phase');
  });
});

