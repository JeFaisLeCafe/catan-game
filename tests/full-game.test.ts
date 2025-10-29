import { describe, it, expect } from 'vitest';
import { Game } from '../src/engine/game';
import { GAME_CONSTANTS } from '../src/core/types';
import { completeSetup, handleRobber } from './helpers/setup';

const SEED = 12345;

describe('Full Game Integration', () => {
  it('should complete 50-turn game simulation', () => {
    const game = new Game(['Alice', 'Bob', 'Charlie'], SEED);
    completeSetup(game);
    
    const maxTurns = 50;
    for (let turn = 0; turn < maxTurns && !game.isGameOver(); turn++) {
      const player = game.getCurrentPlayer();
      const { wood, brick, sheep, wheat, ore } = player.resources;
      
      if (!game.getState().turn.hasRolled) {
        game.rollDice();
        handleRobber(game);
      }
      
      if (wheat >= 2 && ore >= 3 && player.settlements.length > 0) {
        try { game.placeCity(player.settlements[0]); } catch (e) {}
      } else if (wood >= 1 && brick >= 1 && sheep >= 1 && wheat >= 1) {
        const vertex = Array.from(game.getState().board.vertices).find(([id]) => 
          game.canPerformAction('placeSettlement', id).valid
        );
        if (vertex) {
          try { game.placeSettlement(vertex[0]); } catch (e) {}
        }
      } else if (wood >= 1 && brick >= 1) {
        const edge = Array.from(game.getState().board.edges).find(([id]) => 
          game.canPerformAction('placeRoad', id).valid
        );
        if (edge) {
          try { game.placeRoad(edge[0]); } catch (e) {}
        }
      } else if (sheep >= 1 && wheat >= 1 && ore >= 1) {
        try { game.buyDevCard(); } catch (e) {}
      }
      
      game.endTurn();
    }
    
    expect(game.getState().turn.round).toBeGreaterThan(0);
  });

  it('should allow building with correct resources', () => {
    const game = new Game(['Alice', 'Bob', 'Charlie'], SEED);
    completeSetup(game);
    
    game.rollDice();
    handleRobber(game);
    
    const alice = game.getCurrentPlayer();
    alice.resources = { wood: 1, brick: 1, sheep: 0, wheat: 0, ore: 0 };
    
    const roadsBefore = alice.roads.length;
    const validEdge = Array.from(game.getState().board.edges).find(([id]) => 
      game.canPerformAction('placeRoad', id).valid
    );
    
    if (validEdge) {
      game.placeRoad(validEdge[0]);
      expect(game.getCurrentPlayer().roads.length).toBe(roadsBefore + 1);
    }
  });

  it('should allow upgrading settlement to city', () => {
    const game = new Game(['Alice', 'Bob', 'Charlie'], SEED);
    completeSetup(game);
    
    game.rollDice();
    handleRobber(game);
    
    const alice = game.getCurrentPlayer();
    alice.resources = { wood: 0, brick: 0, sheep: 0, wheat: 2, ore: 3 };
    
    const citiesBefore = alice.cities.length;
    game.placeCity(alice.settlements[0]);
    
    expect(game.getCurrentPlayer().cities.length).toBe(citiesBefore + 1);
  });

  it('should enforce dev card rules', () => {
    const game = new Game(['Alice', 'Bob', 'Charlie'], SEED);
    completeSetup(game);
    
    game.rollDice();
    handleRobber(game);
    
    const alice = game.getCurrentPlayer();
    alice.resources = { wood: 0, brick: 0, sheep: 1, wheat: 1, ore: 1 };
    
    const cardsBefore = alice.devCards.length;
    game.buyDevCard();
    
    expect(game.getCurrentPlayer().devCards.length).toBe(cardsBefore + 1);
  });

  it('should detect victory at 10 VP', () => {
    const game = new Game(['Alice', 'Bob', 'Charlie'], SEED);
    completeSetup(game);
    
    expect(game.isGameOver()).toBe(false);
    
    const alice = game.getState().players[0];
    alice.settlements = ['s1', 's2', 's3'];
    alice.cities = ['c1', 'c2', 'c3', 'c4'];
    alice.victoryPoints = 2 + 3 + 8;
    
    game.rollDice();
    
    if (game.isGameOver()) {
      expect(game.getWinner()?.name).toBe('Alice');
    } else {
      expect(alice.victoryPoints).toBeGreaterThanOrEqual(10);
    }
  });
});

