import { describe, it, expect } from 'vitest';
import { generateBoard, coordToId, idToCoord, getAdjacentHexes, isValidHex } from '../src/generators/board-generator';
import { GAME_CONSTANTS } from '../src/core/types';

describe('Board Generator', () => {
  it('should generate a board with 19 hexes', () => {
    const board = generateBoard(12345);
    expect(board.tiles.size).toBe(19);
  });

  it('should generate correct resource distribution', () => {
    const board = generateBoard(12345);

    const resourceCounts: Record<string, number> = {};

    board.tiles.forEach((tile) => {
      resourceCounts[tile.type] = (resourceCounts[tile.type] || 0) + 1;
    });

    expect(resourceCounts.wood).toBe(GAME_CONSTANTS.TILES_PER_RESOURCE.wood);
    expect(resourceCounts.brick).toBe(GAME_CONSTANTS.TILES_PER_RESOURCE.brick);
    expect(resourceCounts.sheep).toBe(GAME_CONSTANTS.TILES_PER_RESOURCE.sheep);
    expect(resourceCounts.wheat).toBe(GAME_CONSTANTS.TILES_PER_RESOURCE.wheat);
    expect(resourceCounts.ore).toBe(GAME_CONSTANTS.TILES_PER_RESOURCE.ore);
    expect(resourceCounts.desert).toBe(GAME_CONSTANTS.TILES_PER_RESOURCE.desert);
  });

  it('should place robber on desert', () => {
    const board = generateBoard(12345);

    let desertCount = 0;
    let robberCount = 0;

    board.tiles.forEach((tile) => {
      if (tile.type === 'desert') {
        desertCount++;
        if (tile.hasRobber) robberCount++;
      }
    });

    expect(desertCount).toBe(1);
    expect(robberCount).toBe(1);
  });

  it('should generate 9 ports', () => {
    const board = generateBoard(12345);
    expect(board.ports.length).toBe(9);
  });

  it('should generate correct port distribution', () => {
    const board = generateBoard(12345);

    const portTypes: Record<string, number> = {};

    board.ports.forEach((port) => {
      portTypes[port.type] = (portTypes[port.type] || 0) + 1;
    });

    const genericPorts = portTypes.generic || 0;
    const specificPorts = Object.keys(portTypes).filter((t) => t !== 'generic').length;

    expect(genericPorts).toBe(4);
    expect(specificPorts).toBe(5);
  });

  it('should generate 18 number tokens (desert has none)', () => {
    const board = generateBoard(12345);

    let numberTokenCount = 0;

    board.tiles.forEach((tile) => {
      if (tile.numberToken !== null) {
        numberTokenCount++;
      }
    });

    expect(numberTokenCount).toBe(18);
  });

  it('should use same board with same seed', () => {
    const board1 = generateBoard(99999);
    const board2 = generateBoard(99999);

    const tiles1 = Array.from(board1.tiles.values()).map((t) => ({
      id: t.id,
      type: t.type,
      number: t.numberToken,
    }));

    const tiles2 = Array.from(board2.tiles.values()).map((t) => ({
      id: t.id,
      type: t.type,
      number: t.numberToken,
    }));

    expect(tiles1).toEqual(tiles2);
  });

  it('should convert coordinates correctly', () => {
    const coord = { q: 1, r: -1 };
    const id = coordToId(coord);
    expect(id).toBe('1_-1');

    const convertedBack = idToCoord(id);
    expect(convertedBack).toEqual(coord);
  });

  it('should get 6 adjacent hexes', () => {
    const coord = { q: 0, r: 0 };
    const adjacent = getAdjacentHexes(coord);
    expect(adjacent.length).toBe(6);
  });

  it('should validate hex coordinates', () => {
    expect(isValidHex({ q: 0, r: 0 })).toBe(true);
    expect(isValidHex({ q: 10, r: 10 })).toBe(false);
  });
});

