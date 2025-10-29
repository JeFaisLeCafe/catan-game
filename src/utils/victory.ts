import { GameState, PlayerState, GAME_CONSTANTS } from '../core/types';
import { findLongestRoadForPlayer } from '../generators/adjacency';

/**
 * Calculate total victory points for a player
 */
export function calculateVictoryPoints(player: PlayerState, state: GameState): number {
  let points = 0;

  // Settlements: 1 point each
  points += player.settlements.length * 1;

  // Cities: 2 points each
  points += player.cities.length * 2;

  // Development cards with victory points
  const vpCards = player.devCards.filter((card) => card.type === 'victoryPoint');
  points += vpCards.length;

  // Longest road: 2 points
  if (player.hasLongestRoad || state.longestRoadPlayer === player.id) {
    points += 2;
  }

  // Largest army: 2 points
  if (player.hasLargestArmy || state.largestArmyPlayer === player.id) {
    points += 2;
  }

  return points;
}

/**
 * Update all players' victory points
 */
export function updateAllVictoryPoints(state: GameState): GameState {
  const newState = { ...state };

  newState.players.forEach((player) => {
    player.victoryPoints = calculateVictoryPoints(player, newState);
  });

  return newState;
}

/**
 * Update longest road holder
 * Returns the player ID who has the longest road, or null if no one qualifies
 */
export function updateLongestRoad(state: GameState): GameState {
  const newState = { ...state };

  interface RoadInfo {
    playerId: string;
    length: number;
  }

  const roadLengths: RoadInfo[] = [];

  // Calculate longest road for each player
  newState.players.forEach((player) => {
    const length = findLongestRoadForPlayer(newState.board, player.id);
    if (length >= GAME_CONSTANTS.LONGEST_ROAD_MIN_LENGTH) {
      roadLengths.push({ playerId: player.id, length });
    }
  });

  if (roadLengths.length === 0) {
    // No one qualifies
    newState.longestRoadPlayer = null;
    newState.players.forEach((p) => {
      p.hasLongestRoad = false;
    });
    return newState;
  }

  // Sort by length (descending)
  roadLengths.sort((a, b) => b.length - a.length);

  // Check for ties at the top
  const maxLength = roadLengths[0].length;
  const leaders = roadLengths.filter((r) => r.length === maxLength);

  if (leaders.length === 1) {
    // Clear winner
    const winnerId = leaders[0].playerId;

    // If there's a current holder, they need to be beaten
    if (newState.longestRoadPlayer && newState.longestRoadPlayer !== winnerId) {
      const currentHolderLength =
        roadLengths.find((r) => r.playerId === newState.longestRoadPlayer)?.length || 0;

      // New player must have strictly longer road to take it
      if (maxLength > currentHolderLength) {
        newState.longestRoadPlayer = winnerId;
      }
    } else if (!newState.longestRoadPlayer) {
      // No current holder, assign to leader
      newState.longestRoadPlayer = winnerId;
    } else {
      // Current holder maintains it if tied
      // (already set to winnerId if they're the same)
    }
  } else {
    // Tie at the top
    // If current holder is in the tie, they keep it
    const currentHolderInTie = leaders.some((l) => l.playerId === newState.longestRoadPlayer);
    if (!currentHolderInTie) {
      // Current holder lost, but there's a tie, so no one gets it until tie is broken
      // Actually, in Catan, if there's a tie and no current holder, no one gets it
      // If there's a tie and current holder is not in tie, they lose it
      newState.longestRoadPlayer = null;
    }
    // Otherwise current holder keeps it
  }

  // Update player flags
  newState.players.forEach((p) => {
    p.hasLongestRoad = p.id === newState.longestRoadPlayer;
  });

  return newState;
}

/**
 * Update largest army holder
 * Returns the player ID who has the largest army, or null if no one qualifies
 */
export function updateLargestArmy(state: GameState): GameState {
  const newState = { ...state };

  interface ArmyInfo {
    playerId: string;
    knights: number;
  }

  const armySizes: ArmyInfo[] = [];

  // Get knight counts for each player
  newState.players.forEach((player) => {
    if (player.knightsPlayed >= GAME_CONSTANTS.LARGEST_ARMY_MIN_KNIGHTS) {
      armySizes.push({ playerId: player.id, knights: player.knightsPlayed });
    }
  });

  if (armySizes.length === 0) {
    // No one qualifies
    newState.largestArmyPlayer = null;
    newState.players.forEach((p) => {
      p.hasLargestArmy = false;
    });
    return newState;
  }

  // Sort by knights (descending)
  armySizes.sort((a, b) => b.knights - a.knights);

  // Check for ties at the top
  const maxKnights = armySizes[0].knights;
  const leaders = armySizes.filter((a) => a.knights === maxKnights);

  if (leaders.length === 1) {
    // Clear winner
    const winnerId = leaders[0].playerId;

    // If there's a current holder, they need to be beaten
    if (newState.largestArmyPlayer && newState.largestArmyPlayer !== winnerId) {
      const currentHolderKnights =
        armySizes.find((a) => a.playerId === newState.largestArmyPlayer)?.knights || 0;

      // New player must have strictly more knights to take it
      if (maxKnights > currentHolderKnights) {
        newState.largestArmyPlayer = winnerId;
      }
    } else if (!newState.largestArmyPlayer) {
      // No current holder, assign to leader
      newState.largestArmyPlayer = winnerId;
    }
  } else {
    // Tie at the top
    const currentHolderInTie = leaders.some((l) => l.playerId === newState.largestArmyPlayer);
    if (!currentHolderInTie) {
      newState.largestArmyPlayer = null;
    }
  }

  // Update player flags
  newState.players.forEach((p) => {
    p.hasLargestArmy = p.id === newState.largestArmyPlayer;
  });

  return newState;
}

/**
 * Check if any player has won
 */
export function checkVictory(state: GameState): GameState {
  const newState = updateAllVictoryPoints(state);

  const winner = newState.players.find(
    (p) => p.victoryPoints >= newState.config.victoryPointsToWin
  );

  if (winner) {
    newState.winner = winner.id;
    newState.turn.phase = 'gameOver';
  }

  return newState;
}

/**
 * Get victory point breakdown for a player (for display)
 */
export function getVictoryPointBreakdown(
  player: PlayerState,
  state: GameState
): Record<string, number> {
  const breakdown: Record<string, number> = {
    settlements: player.settlements.length * 1,
    cities: player.cities.length * 2,
    devCards: player.devCards.filter((c) => c.type === 'victoryPoint').length,
    longestRoad: player.hasLongestRoad || state.longestRoadPlayer === player.id ? 2 : 0,
    largestArmy: player.hasLargestArmy || state.largestArmyPlayer === player.id ? 2 : 0,
  };

  return breakdown;
}

/**
 * Get current standings (sorted by victory points)
 */
export function getStandings(state: GameState): Array<{ player: PlayerState; points: number }> {
  const standings = state.players.map((player) => ({
    player,
    points: calculateVictoryPoints(player, state),
  }));

  standings.sort((a, b) => b.points - a.points);

  return standings;
}

