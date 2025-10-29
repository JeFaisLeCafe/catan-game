export { Game } from './engine/game';
export { GameLogger } from './engine/logger';

export type {
  GameState,
  PlayerState,
  Board,
  Tile,
  Vertex,
  Edge,
  ResourceType,
  TileType,
  DevCardType,
  StructureType,
  GamePhase,
  ResourceCount,
  ValidationResult,
  HexCoordinate,
  Port,
  PortType,
} from './core/types';

export type {
  GameEvent,
  GameEventType,
  EventSubscriber,
  DiceRolledEvent,
  ResourcesGainedEvent,
  ResourcesLostEvent,
  SettlementBuiltEvent,
  CityBuiltEvent,
  RoadBuiltEvent,
  DevCardBoughtEvent,
  DevCardPlayedEvent,
  RobberMovedEvent,
  PlayerStoleEvent,
  GameEndedEvent,
} from './core/events';

export { generateBoard } from './generators/board-generator';
export { buildAdjacencyGraph } from './generators/adjacency';

export { createRandom } from './utils/random';
export {
  calculateVictoryPoints,
  updateLongestRoad,
  updateLargestArmy,
  checkVictory,
  getStandings,
} from './utils/victory';
export {
  formatVertexId,
  formatEdgeId,
  getVertexByDisplayId,
  getEdgeByDisplayId,
  getVertexDisplayInfo,
  getEdgeDisplayInfo,
} from './utils/display';
export {
  calculateStatistics,
  getPlayerRanking,
  formatDuration,
  type GameStatistics,
  type PlayerStatistics,
} from './utils/statistics';

export { GAME_CONSTANTS } from './core/types';

