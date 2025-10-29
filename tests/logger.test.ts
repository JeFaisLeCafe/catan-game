import { describe, it, expect } from 'vitest';
import { Game } from '../src/engine/game';
import { completeSetup, handleRobber } from './helpers/setup';

const SEED = 12345;

describe('Event Logger', () => {
  it('should log game started event', () => {
    const game = new Game(['Alice', 'Bob', 'Charlie'], SEED);
    const events = game.getHistory();
    
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].type).toBe('gameStarted');
    
    if (events[0].type === 'gameStarted') {
      expect(events[0].playerIds).toHaveLength(3);
      expect(events[0].seed).toBe(SEED);
    }
  });

  it('should log dice rolls', () => {
    const game = new Game(['Alice', 'Bob', 'Charlie'], SEED);
    completeSetup(game);
    
    game.rollDice();
    
    const diceEvents = game.getHistory().filter(e => e.type === 'diceRolled');
    expect(diceEvents.length).toBeGreaterThan(0);
    
    const lastDice = diceEvents[diceEvents.length - 1];
    if (lastDice.type === 'diceRolled') {
      expect(lastDice.dice1).toBeGreaterThanOrEqual(1);
      expect(lastDice.dice1).toBeLessThanOrEqual(6);
      expect(lastDice.dice2).toBeGreaterThanOrEqual(1);
      expect(lastDice.dice2).toBeLessThanOrEqual(6);
      expect(lastDice.total).toBe(lastDice.dice1 + lastDice.dice2);
    }
  });

  it('should log building events', () => {
    const game = new Game(['Alice', 'Bob', 'Charlie'], SEED);
    
    const beforeCount = game.getHistory().length;
    completeSetup(game);
    const afterCount = game.getHistory().length;
    
    const settlements = game.getHistory().filter(e => e.type === 'settlementBuilt');
    const roads = game.getHistory().filter(e => e.type === 'roadBuilt');
    
    expect(settlements.length).toBe(6);
    expect(roads.length).toBe(6);
    expect(afterCount).toBeGreaterThan(beforeCount);
  });

  it('should log dev card purchase', () => {
    const game = new Game(['Alice', 'Bob', 'Charlie'], SEED);
    completeSetup(game);
    
    game.rollDice();
    handleRobber(game);
    
    const alice = game.getCurrentPlayer();
    alice.resources = { wood: 0, brick: 0, sheep: 1, wheat: 1, ore: 1 };
    
    game.buyDevCard();
    
    const devCardEvents = game.getHistory().filter(e => e.type === 'devCardBought');
    expect(devCardEvents.length).toBeGreaterThan(0);
    
    const lastCard = devCardEvents[devCardEvents.length - 1];
    if (lastCard.type === 'devCardBought') {
      expect(lastCard.playerId).toBe(alice.id);
      expect(['knight', 'roadBuilding', 'yearOfPlenty', 'monopoly', 'victoryPoint']).toContain(lastCard.cardType);
    }
  });

  it('should allow subscription to events', () => {
    const game = new Game(['Alice', 'Bob', 'Charlie'], SEED);
    const events: string[] = [];
    
    const unsubscribe = game.subscribe(event => {
      events.push(event.type);
    });
    
    completeSetup(game);
    
    expect(events.length).toBeGreaterThan(0);
    expect(events).toContain('settlementBuilt');
    expect(events).toContain('roadBuilt');
    
    unsubscribe();
    const countBefore = events.length;
    
    game.rollDice();
    expect(events.length).toBe(countBefore);
  });

  it('should export game data', () => {
    const game = new Game(['Alice', 'Bob', 'Charlie'], SEED);
    completeSetup(game);
    
    const exported = game.exportGame();
    const data = JSON.parse(exported);
    
    expect(data.seed).toBe(SEED);
    expect(data.events).toBeDefined();
    expect(data.finalState).toBeDefined();
    expect(Array.isArray(data.events)).toBe(true);
  });
});

