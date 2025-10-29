import type { ResourceType, DevCardType, ResourceCount } from './types';

export type GameEventType =
  | 'gameStarted'
  | 'turnStarted'
  | 'turnEnded'
  | 'diceRolled'
  | 'resourcesGained'
  | 'resourcesLost'
  | 'resourcesDiscarded'
  | 'settlementBuilt'
  | 'cityBuilt'
  | 'roadBuilt'
  | 'devCardBought'
  | 'devCardPlayed'
  | 'robberMoved'
  | 'playerStole'
  | 'tradeWithBank'
  | 'tradeWithPlayer'
  | 'victoryPointsChanged'
  | 'longestRoadChanged'
  | 'largestArmyChanged'
  | 'gameEnded';

export interface BaseEvent {
  id: string;
  timestamp: number;
  turnNumber: number;
  type: GameEventType;
}

export interface GameStartedEvent extends BaseEvent {
  type: 'gameStarted';
  playerIds: string[];
  seed?: number;
}

export interface TurnStartedEvent extends BaseEvent {
  type: 'turnStarted';
  playerId: string;
}

export interface TurnEndedEvent extends BaseEvent {
  type: 'turnEnded';
  playerId: string;
}

export interface DiceRolledEvent extends BaseEvent {
  type: 'diceRolled';
  playerId: string;
  dice1: number;
  dice2: number;
  total: number;
}

export interface ResourcesGainedEvent extends BaseEvent {
  type: 'resourcesGained';
  playerId: string;
  resources: Partial<ResourceCount>;
  reason: 'diceRoll' | 'initialPlacement' | 'trade' | 'devCard' | 'stolen';
}

export interface ResourcesLostEvent extends BaseEvent {
  type: 'resourcesLost';
  playerId: string;
  resources: Partial<ResourceCount>;
  reason: 'building' | 'trade' | 'robber' | 'devCard';
}

export interface ResourcesDiscardedEvent extends BaseEvent {
  type: 'resourcesDiscarded';
  playerId: string;
  resources: Partial<ResourceCount>;
}

export interface SettlementBuiltEvent extends BaseEvent {
  type: 'settlementBuilt';
  playerId: string;
  vertexId: string;
  isSetup: boolean;
}

export interface CityBuiltEvent extends BaseEvent {
  type: 'cityBuilt';
  playerId: string;
  vertexId: string;
}

export interface RoadBuiltEvent extends BaseEvent {
  type: 'roadBuilt';
  playerId: string;
  edgeId: string;
  isSetup: boolean;
}

export interface DevCardBoughtEvent extends BaseEvent {
  type: 'devCardBought';
  playerId: string;
  cardType: DevCardType;
}

export interface DevCardPlayedEvent extends BaseEvent {
  type: 'devCardPlayed';
  playerId: string;
  cardType: DevCardType;
}

export interface RobberMovedEvent extends BaseEvent {
  type: 'robberMoved';
  playerId: string;
  fromTileId?: string;
  toTileId: string;
}

export interface PlayerStoleEvent extends BaseEvent {
  type: 'playerStole';
  stealerId: string;
  victimId: string;
  resource?: ResourceType;
}

export interface TradeWithBankEvent extends BaseEvent {
  type: 'tradeWithBank';
  playerId: string;
  gave: Partial<ResourceCount>;
  received: Partial<ResourceCount>;
}

export interface TradeWithPlayerEvent extends BaseEvent {
  type: 'tradeWithPlayer';
  initiatorId: string;
  partnerId: string;
  initiatorGave: Partial<ResourceCount>;
  partnerGave: Partial<ResourceCount>;
}

export interface VictoryPointsChangedEvent extends BaseEvent {
  type: 'victoryPointsChanged';
  playerId: string;
  oldPoints: number;
  newPoints: number;
  reason: string;
}

export interface LongestRoadChangedEvent extends BaseEvent {
  type: 'longestRoadChanged';
  playerId: string | null;
  roadLength: number;
}

export interface LargestArmyChangedEvent extends BaseEvent {
  type: 'largestArmyChanged';
  playerId: string | null;
  armySize: number;
}

export interface GameEndedEvent extends BaseEvent {
  type: 'gameEnded';
  winnerId: string;
  finalScores: Array<{ playerId: string; points: number }>;
}

export type GameEvent =
  | GameStartedEvent
  | TurnStartedEvent
  | TurnEndedEvent
  | DiceRolledEvent
  | ResourcesGainedEvent
  | ResourcesLostEvent
  | ResourcesDiscardedEvent
  | SettlementBuiltEvent
  | CityBuiltEvent
  | RoadBuiltEvent
  | DevCardBoughtEvent
  | DevCardPlayedEvent
  | RobberMovedEvent
  | PlayerStoleEvent
  | TradeWithBankEvent
  | TradeWithPlayerEvent
  | VictoryPointsChangedEvent
  | LongestRoadChangedEvent
  | LargestArmyChangedEvent
  | GameEndedEvent;

export type EventSubscriber = (event: GameEvent) => void;

