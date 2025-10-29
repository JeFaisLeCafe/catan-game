import seedrandom from 'seedrandom';

/**
 * Seeded random number generator for reproducible board generation
 */
export class SeededRandom {
  private rng: seedrandom.PRNG;

  constructor(seed?: string | number) {
    this.rng = seedrandom(seed?.toString() || Date.now().toString());
  }

  /**
   * Get a random number between 0 (inclusive) and 1 (exclusive)
   */
  random(): number {
    return this.rng();
  }

  /**
   * Get a random integer between min (inclusive) and max (exclusive)
   */
  randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min)) + min;
  }

  /**
   * Roll dice - returns array of two dice values
   */
  rollDice(): [number, number] {
    return [this.randomInt(1, 7), this.randomInt(1, 7)];
  }

  /**
   * Shuffle an array in place using Fisher-Yates algorithm
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.randomInt(0, i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * Pick a random element from an array
   */
  choice<T>(array: T[]): T {
    return array[this.randomInt(0, array.length)];
  }
}

/**
 * Create a seeded random number generator
 */
export function createRandom(seed?: string | number): SeededRandom {
  return new SeededRandom(seed);
}

