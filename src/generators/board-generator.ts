import {
  Board,
  Tile,
  TileType,
  HexCoordinate,
  Port,
  PortType,
  GAME_CONSTANTS,
} from '../core/types';
import { SeededRandom } from '../utils/random';

/**
 * Standard Catan board layout - 19 hexes in a hexagonal pattern
 * Using axial coordinates (q, r)
 */
const STANDARD_HEX_LAYOUT: HexCoordinate[] = [
  // Top row (r = -2)
  { q: 0, r: -2 },
  { q: 1, r: -2 },
  { q: 2, r: -2 },
  // Second row (r = -1)
  { q: -1, r: -1 },
  { q: 0, r: -1 },
  { q: 1, r: -1 },
  { q: 2, r: -1 },
  // Middle row (r = 0)
  { q: -2, r: 0 },
  { q: -1, r: 0 },
  { q: 0, r: 0 },
  { q: 1, r: 0 },
  { q: 2, r: 0 },
  // Fourth row (r = 1)
  { q: -2, r: 1 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
  { q: 1, r: 1 },
  // Bottom row (r = 2)
  { q: -2, r: 2 },
  { q: -1, r: 2 },
  { q: 0, r: 2 },
];

/**
 * Port locations - defined by the two vertex directions from hex coordinates
 * Ports are on the edges of the board
 */
interface PortLocation {
  hex: HexCoordinate;
  directions: [number, number]; // Two vertex directions (0-5)
}

const PORT_LOCATIONS: PortLocation[] = [
  { hex: { q: 0, r: -2 }, directions: [4, 5] },
  { hex: { q: 2, r: -2 }, directions: [0, 1] },
  { hex: { q: 2, r: -1 }, directions: [1, 2] },
  { hex: { q: 2, r: 0 }, directions: [1, 2] },
  { hex: { q: 1, r: 1 }, directions: [2, 3] },
  { hex: { q: -1, r: 2 }, directions: [3, 4] },
  { hex: { q: -2, r: 2 }, directions: [3, 4] },
  { hex: { q: -2, r: 1 }, directions: [4, 5] },
  { hex: { q: -2, r: 0 }, directions: [4, 5] },
];

/**
 * Generate a complete Catan board
 */
export function generateBoard(seed?: number): Board {
  const random = new SeededRandom(seed);

  // Generate tile types
  const tileTypes = generateTileTypes(random);

  // Generate number tokens
  const numberTokens = generateNumberTokens(random, tileTypes);

  // Create tiles
  const tiles = new Map<string, Tile>();
  STANDARD_HEX_LAYOUT.forEach((coord, index) => {
    const id = coordToId(coord);
    const type = tileTypes[index];
    const numberToken = numberTokens[index];

    tiles.set(id, {
      id,
      coordinate: coord,
      type,
      numberToken,
      hasRobber: type === 'desert', // Robber starts on desert
    });
  });

  // Generate ports
  const ports = generatePorts(random);

  return {
    tiles,
    vertices: new Map(),
    edges: new Map(),
    ports,
  };
}

/**
 * Generate randomized tile types
 */
function generateTileTypes(random: SeededRandom): TileType[] {
  const types: TileType[] = [];

  // Add each resource type according to distribution
  Object.entries(GAME_CONSTANTS.TILES_PER_RESOURCE).forEach(([type, count]) => {
    for (let i = 0; i < count; i++) {
      types.push(type as TileType);
    }
  });

  // Shuffle the tiles
  return random.shuffle(types);
}

/**
 * Generate number tokens, avoiding 6/8 adjacency when possible
 */
function generateNumberTokens(random: SeededRandom, tileTypes: TileType[]): (number | null)[] {
  const tokens = [...GAME_CONSTANTS.NUMBER_TOKENS];
  const shuffled = random.shuffle(tokens);

  const result: (number | null)[] = [];
  let tokenIndex = 0;

  // Assign tokens to non-desert tiles
  for (let i = 0; i < tileTypes.length; i++) {
    if (tileTypes[i] === 'desert') {
      result.push(null);
    } else {
      result.push(shuffled[tokenIndex++]);
    }
  }

  // Note: In a production version, you might want to implement
  // a more sophisticated algorithm to avoid 6/8 adjacency
  // This would require checking adjacency and potentially re-shuffling

  return result;
}

/**
 * Generate ports with randomized types
 */
function generatePorts(random: SeededRandom): Port[] {
  // Port types: 1 of each resource (2:1) + 4 generic (3:1)
  const portTypes: PortType[] = [
    'wood',
    'brick',
    'sheep',
    'wheat',
    'ore',
    'generic',
    'generic',
    'generic',
    'generic',
  ];

  const shuffledTypes = random.shuffle(portTypes);

  return PORT_LOCATIONS.map((location, index) => {
    const type = shuffledTypes[index];
    const ratio = type === 'generic' ? 3 : 2;

    // Convert port location to vertex IDs
    const hexId = coordToId(location.hex);
    const vertices = location.directions.map((dir) => `${hexId}_v${dir}`);

    return {
      type,
      ratio,
      vertices,
    };
  });
}

/**
 * Convert hex coordinate to string ID
 */
export function coordToId(coord: HexCoordinate): string {
  return `${coord.q}_${coord.r}`;
}

/**
 * Convert string ID to hex coordinate
 */
export function idToCoord(id: string): HexCoordinate {
  const [q, r] = id.split('_').map(Number);
  return { q, r };
}

/**
 * Get adjacent hex coordinates (6 neighbors)
 */
export function getAdjacentHexes(coord: HexCoordinate): HexCoordinate[] {
  return [
    { q: coord.q + 1, r: coord.r },
    { q: coord.q + 1, r: coord.r - 1 },
    { q: coord.q, r: coord.r - 1 },
    { q: coord.q - 1, r: coord.r },
    { q: coord.q - 1, r: coord.r + 1 },
    { q: coord.q, r: coord.r + 1 },
  ];
}

/**
 * Check if a hex coordinate is in the standard board
 */
export function isValidHex(coord: HexCoordinate): boolean {
  return STANDARD_HEX_LAYOUT.some((c) => c.q === coord.q && c.r === coord.r);
}

/**
 * Get vertex ID for a hex and direction
 * Vertices are numbered 0-5 starting from top going clockwise
 */
export function getVertexId(hexId: string, direction: number): string {
  return `${hexId}_v${direction}`;
}

/**
 * Get edge ID for a hex and direction
 * Edges are numbered 0-5 starting from top-right going clockwise
 */
export function getEdgeId(hexId: string, direction: number): string {
  return `${hexId}_e${direction}`;
}

/**
 * Get the three vertices of a hex
 */
export function getHexVertices(hexId: string): string[] {
  const vertices: string[] = [];
  for (let i = 0; i < 6; i++) {
    vertices.push(getVertexId(hexId, i));
  }
  return vertices;
}

/**
 * Get the six edges of a hex
 */
export function getHexEdges(hexId: string): string[] {
  const edges: string[] = [];
  for (let i = 0; i < 6; i++) {
    edges.push(getEdgeId(hexId, i));
  }
  return edges;
}

/**
 * Get resource distribution probability for a tile
 * Based on number token (dots on the token)
 */
export function getTokenProbability(numberToken: number | null): number {
  if (!numberToken) return 0;

  const dots: Record<number, number> = {
    2: 1,
    3: 2,
    4: 3,
    5: 4,
    6: 5,
    8: 5,
    9: 4,
    10: 3,
    11: 2,
    12: 1,
  };

  return dots[numberToken] || 0;
}

