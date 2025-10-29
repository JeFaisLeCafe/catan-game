
export type ResourceType = 'wood' | 'brick' | 'sheep' | 'wheat' | 'ore';

export type TileType = ResourceType | 'desert';

export const RESOURCE_TYPES: ResourceType[] = ['wood', 'brick', 'sheep', 'wheat', 'ore'];

export const TILE_TYPES: TileType[] = [...RESOURCE_TYPES, 'desert'];


export type DevCardType = 'knight' | 'victoryPoint' | 'roadBuilding' | 'yearOfPlenty' | 'monopoly';

export interface DevCard {
  type: DevCardType;
  playedThisTurn?: boolean;
}


export type StructureType = 'settlement' | 'city' | 'road';

export interface Structure {
  playerId: string;
  type: StructureType;
}

export interface HexCoordinate {
  q: number; // column
  r: number; // row
}

export type PortType = ResourceType | 'generic';

export interface Port {
  type: PortType;
  ratio: number; // 2 for specific resource, 3 for generic
  vertices: string[]; // The two vertices where this port is accessible
}

export interface Tile {
  id: string;
  coordinate: HexCoordinate;
  type: TileType;
  numberToken: number | null;
  hasRobber: boolean;
}

export interface Vertex {
  id: string;
  adjacentTiles: string[];
  adjacentVertices: string[];
  adjacentEdges: string[];
  structure: Structure | null;
  port: Port | null;
}

export interface Edge {
  id: string;
  vertices: [string, string];
  adjacentTiles: string[];
  adjacentEdges: string[];
  road: { playerId: string } | null;
}

export interface Board {
  tiles: Map<string, Tile>;
  vertices: Map<string, Vertex>;
  edges: Map<string, Edge>;
  ports: Port[];
}


export type ResourceCount = Record<ResourceType, number>;

export interface TradeOffer {
  give: Partial<ResourceCount>;
  get: Partial<ResourceCount>;
}

export interface Trade {
  from: string; // player ID
  to: string; // player ID or 'bank'
  offer: TradeOffer;
}


export interface PlayerState {
  id: string;
  name: string;
  color: string;
  resources: ResourceCount;
  settlements: string[]; // Vertex IDs
  cities: string[]; // Vertex IDs
  roads: string[]; // Edge IDs
  devCards: DevCard[];
  devCardsPlayedThisTurn: number;
  knightsPlayed: number;
  victoryPoints: number;
  hasLongestRoad: boolean;
  hasLargestArmy: boolean;
}


export type GamePhase =
  | 'setup'
  | 'main'
  | 'robberDiscard'
  | 'robberPlacement'
  | 'gameOver';

export type SetupPhase = 'firstSettlement' | 'firstRoad' | 'secondSettlement' | 'secondRoad';

export interface TurnState {
  currentPlayerIndex: number;
  round: number;
  phase: GamePhase;
  setupPhase?: SetupPhase;
  setupRound?: 1 | 2; // Round 1 goes in order, round 2 in reverse
  diceRoll?: [number, number];
  hasRolled: boolean;
  mustDiscardPlayers: string[]; // Players who must discard due to robber
  canPlayDevCard: boolean;
}

export interface GameConfig {
  playerCount: number;
  victoryPointsToWin: number;
  randomSeed?: number;
}

export interface GameState {
  config: GameConfig;
  board: Board;
  players: PlayerState[];
  turn: TurnState;
  devCardDeck: DevCardType[];
  longestRoadPlayer: string | null;
  largestArmyPlayer: string | null;
  winner: string | null;
}


export type GameAction =
  | { type: 'ROLL_DICE' }
  | { type: 'PLACE_SETTLEMENT'; vertexId: string }
  | { type: 'PLACE_CITY'; vertexId: string }
  | { type: 'PLACE_ROAD'; edgeId: string }
  | { type: 'BUY_DEV_CARD' }
  | { type: 'PLAY_KNIGHT'; hexId: string; targetPlayerId?: string }
  | { type: 'PLAY_ROAD_BUILDING'; edge1Id: string; edge2Id: string }
  | { type: 'PLAY_YEAR_OF_PLENTY'; resource1: ResourceType; resource2: ResourceType }
  | { type: 'PLAY_MONOPOLY'; resource: ResourceType }
  | { type: 'PLAY_VICTORY_POINT' }
  | { type: 'DISCARD_RESOURCES'; resources: Partial<ResourceCount> }
  | { type: 'TRADE_WITH_BANK'; give: Partial<ResourceCount>; get: Partial<ResourceCount> }
  | { type: 'TRADE_WITH_PLAYER'; targetPlayerId: string; offer: TradeOffer }
  | { type: 'ACCEPT_TRADE'; tradeId: string }
  | { type: 'END_TURN' };


export interface ValidationResult {
  valid: boolean;
  error?: string;
}


export const GAME_CONSTANTS = {
  TILES_PER_RESOURCE: {
    wood: 4,
    brick: 3,
    sheep: 4,
    wheat: 4,
    ore: 3,
    desert: 1,
  },
  
  NUMBER_TOKENS: [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12],
  
  MAX_SETTLEMENTS: 5,
  MAX_CITIES: 4,
  MAX_ROADS: 15,
  
  DEV_CARDS: {
    knight: 14,
    victoryPoint: 5,
    roadBuilding: 2,
    yearOfPlenty: 2,
    monopoly: 2,
  },
  
  COSTS: {
    settlement: { wood: 1, brick: 1, sheep: 1, wheat: 1, ore: 0 } as ResourceCount,
    city: { wood: 0, brick: 0, sheep: 0, wheat: 2, ore: 3 } as ResourceCount,
    road: { wood: 1, brick: 1, sheep: 0, wheat: 0, ore: 0 } as ResourceCount,
    devCard: { wood: 0, brick: 0, sheep: 1, wheat: 1, ore: 1 } as ResourceCount,
  },
  
  VICTORY_POINTS_TO_WIN: 10,
  LONGEST_ROAD_MIN_LENGTH: 5,
  LARGEST_ARMY_MIN_KNIGHTS: 3,
  
  ROBBER_DISCARD_THRESHOLD: 7,
  ROBBER_NUMBER: 7,
  
  PORT_RATIOS: {
    generic: 3,
    specific: 2,
  },
} as const;

export const PLAYER_COLORS = ['red', 'blue', 'white', 'orange'] as const;

export type PlayerColor = typeof PLAYER_COLORS[number];

