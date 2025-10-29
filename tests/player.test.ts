import { describe, it, expect } from 'vitest';
import {
  createPlayer,
  createEmptyResourceCount,
  addResources,
  removeResources,
  hasResources,
  countResources,
} from '../src/core/player';

describe('Player Utilities', () => {
  it('should create a player with initial state', () => {
    const player = createPlayer('p1', 'Alice', 'red');

    expect(player.id).toBe('p1');
    expect(player.name).toBe('Alice');
    expect(player.color).toBe('red');
    expect(player.settlements).toEqual([]);
    expect(player.cities).toEqual([]);
    expect(player.roads).toEqual([]);
    expect(player.victoryPoints).toBe(0);
  });

  it('should create empty resource count', () => {
    const resources = createEmptyResourceCount();

    expect(resources.wood).toBe(0);
    expect(resources.brick).toBe(0);
    expect(resources.sheep).toBe(0);
    expect(resources.wheat).toBe(0);
    expect(resources.ore).toBe(0);
  });

  it('should add resources correctly', () => {
    const current = createEmptyResourceCount();
    const result = addResources(current, { wood: 2, brick: 1 });

    expect(result.wood).toBe(2);
    expect(result.brick).toBe(1);
    expect(result.sheep).toBe(0);
  });

  it('should remove resources correctly', () => {
    const current = { wood: 5, brick: 3, sheep: 2, wheat: 1, ore: 4 };
    const result = removeResources(current, { wood: 2, brick: 1 });

    expect(result.wood).toBe(3);
    expect(result.brick).toBe(2);
    expect(result.sheep).toBe(2);
  });

  it('should check if player has resources', () => {
    const resources = { wood: 5, brick: 3, sheep: 2, wheat: 1, ore: 4 };

    expect(hasResources(resources, { wood: 2, brick: 1 })).toBe(true);
    expect(hasResources(resources, { wood: 10 })).toBe(false);
    expect(hasResources(resources, { ore: 4 })).toBe(true);
    expect(hasResources(resources, { ore: 5 })).toBe(false);
  });

  it('should count total resources', () => {
    const resources = { wood: 5, brick: 3, sheep: 2, wheat: 1, ore: 4 };
    expect(countResources(resources)).toBe(15);

    const empty = createEmptyResourceCount();
    expect(countResources(empty)).toBe(0);
  });
});

