import { describe, it, expect } from 'vitest';
import { Game } from '../src/engine/game';
import { calculateStatistics, getPlayerRanking, formatDuration } from '../src/utils/statistics';
import { completeSetup, handleRobber } from './helpers/setup';

const SEED = 12345;

describe('Statistics', () => {
  it('should calculate basic game statistics', () => {
    const game = new Game(['Alice', 'Bob', 'Charlie'], SEED);
    completeSetup(game);
    
    const stats = game.getStatistics();
    
    expect(stats.playerStats).toBeDefined();
    expect(Object.keys(stats.playerStats)).toHaveLength(3);
    expect(stats.totalEvents).toBeGreaterThan(0);
    expect(stats.gameDuration).toBeGreaterThan(0);
  });

  it('should track player building stats', () => {
    const game = new Game(['Alice', 'Bob', 'Charlie'], SEED);
    completeSetup(game);
    
    const stats = game.getStatistics();
    
    for (const playerStat of Object.values(stats.playerStats)) {
      expect(playerStat.settlementsBuilt).toBe(2);
      expect(playerStat.roadsBuilt).toBe(2);
      expect(playerStat.citiesBuilt).toBe(0);
    }
  });

  it('should track dice roll statistics', () => {
    const game = new Game(['Alice', 'Bob', 'Charlie'], SEED);
    completeSetup(game);
    
    for (let i = 0; i < 6; i++) {
      game.rollDice();
      handleRobber(game);
      game.endTurn();
    }
    
    const stats = game.getStatistics();
    
    for (const playerStat of Object.values(stats.playerStats)) {
      if (playerStat.timesRolled > 0) {
        expect(playerStat.averageDiceRoll).toBeGreaterThanOrEqual(2);
        expect(playerStat.averageDiceRoll).toBeLessThanOrEqual(12);
        expect(playerStat.totalDiceValue).toBe(playerStat.timesRolled * playerStat.averageDiceRoll);
      }
    }
  });

  it('should track dev card statistics', () => {
    const game = new Game(['Alice', 'Bob', 'Charlie'], SEED);
    completeSetup(game);
    
    game.rollDice();
    handleRobber(game);
    
    const alice = game.getCurrentPlayer();
    alice.resources = { wood: 0, brick: 0, sheep: 1, wheat: 1, ore: 1 };
    game.buyDevCard();
    
    const stats = game.getStatistics();
    const aliceStats = stats.playerStats[alice.id];
    
    expect(aliceStats.devCardsBought).toBe(1);
    expect(Object.values(aliceStats.devCardsByType).reduce((a, b) => a + b, 0)).toBe(1);
  });

  it('should calculate player ranking', () => {
    const game = new Game(['Alice', 'Bob', 'Charlie'], SEED);
    completeSetup(game);
    
    const stats = game.getStatistics();
    const ranking = getPlayerRanking(stats);
    
    expect(ranking).toHaveLength(3);
    expect(ranking[0].points).toBeGreaterThanOrEqual(ranking[1].points);
    expect(ranking[1].points).toBeGreaterThanOrEqual(ranking[2].points);
  });

  it('should format duration correctly', () => {
    expect(formatDuration(5000)).toBe('5s');
    expect(formatDuration(65000)).toBe('1m 5s');
    expect(formatDuration(3665000)).toBe('1h 1m');
  });

  it('should track turn count', () => {
    const game = new Game(['Alice', 'Bob', 'Charlie'], SEED);
    completeSetup(game);
    
    for (let i = 0; i < 12; i++) {
      game.rollDice();
      handleRobber(game);
      game.endTurn();
    }
    
    const stats = game.getStatistics();
    expect(stats.totalTurns).toBeGreaterThan(0);
    
    const totalPlayerTurns = Object.values(stats.playerStats)
      .reduce((sum, p) => sum + p.turnsPlayed, 0);
    expect(totalPlayerTurns).toBeGreaterThanOrEqual(12);
  });
});

