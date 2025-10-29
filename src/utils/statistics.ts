import type { GameEvent } from '../core/events';
import type { ResourceType, DevCardType } from '../core/types';

export interface PlayerStatistics {
  playerId: string;
  totalResourcesGained: number;
  totalResourcesLost: number;
  resourcesGainedByType: Record<ResourceType, number>;
  resourcesLostByType: Record<ResourceType, number>;
  settlementsBuilt: number;
  citiesBuilt: number;
  roadsBuilt: number;
  devCardsBought: number;
  devCardsPlayed: number;
  devCardsByType: Record<DevCardType, number>;
  timesRolled: number;
  totalDiceValue: number;
  averageDiceRoll: number;
  timesStolen: number;
  timesStoleFromOthers: number;
  resourcesStolen: number;
  resourcesLostToRobber: number;
  banksTradesCompleted: number;
  turnsPlayed: number;
  finalVictoryPoints: number;
}

export interface GameStatistics {
  totalTurns: number;
  winner: string | null;
  playerStats: Record<string, PlayerStatistics>;
  longestRoadHolder: string | null;
  largestArmyHolder: string | null;
  totalEvents: number;
  gameDuration: number;
}

function createEmptyPlayerStats(playerId: string): PlayerStatistics {
  return {
    playerId,
    totalResourcesGained: 0,
    totalResourcesLost: 0,
    resourcesGainedByType: { wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 },
    resourcesLostByType: { wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 },
    settlementsBuilt: 0,
    citiesBuilt: 0,
    roadsBuilt: 0,
    devCardsBought: 0,
    devCardsPlayed: 0,
    devCardsByType: { knight: 0, roadBuilding: 0, yearOfPlenty: 0, monopoly: 0, victoryPoint: 0 },
    timesRolled: 0,
    totalDiceValue: 0,
    averageDiceRoll: 0,
    timesStolen: 0,
    timesStoleFromOthers: 0,
    resourcesStolen: 0,
    resourcesLostToRobber: 0,
    banksTradesCompleted: 0,
    turnsPlayed: 0,
    finalVictoryPoints: 0,
  };
}

export function calculateStatistics(events: ReadonlyArray<GameEvent>): GameStatistics {
  const gameStartEvent = events.find(e => e.type === 'gameStarted');
  const gameEndEvent = events.find(e => e.type === 'gameEnded');
  
  if (!gameStartEvent || gameStartEvent.type !== 'gameStarted') {
    throw new Error('No game started event found');
  }

  const playerStats: Record<string, PlayerStatistics> = {};
  for (const playerId of gameStartEvent.playerIds) {
    playerStats[playerId] = createEmptyPlayerStats(playerId);
  }

  let maxTurn = 0;
  let longestRoadHolder: string | null = null;
  let largestArmyHolder: string | null = null;

  for (const event of events) {
    maxTurn = Math.max(maxTurn, event.turnNumber);

    switch (event.type) {
      case 'turnStarted':
        playerStats[event.playerId].turnsPlayed++;
        break;

      case 'diceRolled':
        playerStats[event.playerId].timesRolled++;
        playerStats[event.playerId].totalDiceValue += event.total;
        playerStats[event.playerId].averageDiceRoll = 
          playerStats[event.playerId].totalDiceValue / playerStats[event.playerId].timesRolled;
        break;

      case 'resourcesGained':
        for (const [resource, amount] of Object.entries(event.resources)) {
          const count = amount || 0;
          playerStats[event.playerId].totalResourcesGained += count;
          playerStats[event.playerId].resourcesGainedByType[resource as ResourceType] += count;
          if (event.reason === 'stolen') {
            playerStats[event.playerId].resourcesStolen += count;
          }
        }
        break;

      case 'resourcesLost':
        for (const [resource, amount] of Object.entries(event.resources)) {
          const count = amount || 0;
          playerStats[event.playerId].totalResourcesLost += count;
          playerStats[event.playerId].resourcesLostByType[resource as ResourceType] += count;
          if (event.reason === 'robber') {
            playerStats[event.playerId].resourcesLostToRobber += count;
          }
        }
        break;

      case 'settlementBuilt':
        playerStats[event.playerId].settlementsBuilt++;
        break;

      case 'cityBuilt':
        playerStats[event.playerId].citiesBuilt++;
        break;

      case 'roadBuilt':
        playerStats[event.playerId].roadsBuilt++;
        break;

      case 'devCardBought':
        playerStats[event.playerId].devCardsBought++;
        playerStats[event.playerId].devCardsByType[event.cardType]++;
        break;

      case 'devCardPlayed':
        playerStats[event.playerId].devCardsPlayed++;
        break;

      case 'playerStole':
        playerStats[event.stealerId].timesStoleFromOthers++;
        playerStats[event.victimId].timesStolen++;
        break;

      case 'tradeWithBank':
        playerStats[event.playerId].banksTradesCompleted++;
        break;

      case 'longestRoadChanged':
        longestRoadHolder = event.playerId;
        break;

      case 'largestArmyChanged':
        largestArmyHolder = event.playerId;
        break;

      case 'gameEnded':
        for (const { playerId, points } of event.finalScores) {
          playerStats[playerId].finalVictoryPoints = points;
        }
        break;
    }
  }

  const gameDuration = gameEndEvent && gameEndEvent.type === 'gameEnded'
    ? gameEndEvent.timestamp - gameStartEvent.timestamp
    : Date.now() - gameStartEvent.timestamp;

  return {
    totalTurns: maxTurn,
    winner: gameEndEvent && gameEndEvent.type === 'gameEnded' ? gameEndEvent.winnerId : null,
    playerStats,
    longestRoadHolder,
    largestArmyHolder,
    totalEvents: events.length,
    gameDuration,
  };
}

export function getPlayerRanking(stats: GameStatistics): Array<{ playerId: string; points: number }> {
  return Object.values(stats.playerStats)
    .map(p => ({ playerId: p.playerId, points: p.finalVictoryPoints }))
    .sort((a, b) => b.points - a.points);
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

