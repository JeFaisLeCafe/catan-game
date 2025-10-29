import { GameState, GameConfig, TurnState, DevCardType, GAME_CONSTANTS } from './types';
import { createPlayer, getPlayerColor } from './player';

/**
 * Create initial game state
 */
export function createInitialState(playerNames: string[], seed?: number): GameState {
  if (playerNames.length < 3 || playerNames.length > 4) {
    throw new Error('Game requires 3 or 4 players');
  }

  const config: GameConfig = {
    playerCount: playerNames.length,
    victoryPointsToWin: GAME_CONSTANTS.VICTORY_POINTS_TO_WIN,
    randomSeed: seed,
  };

  const players = playerNames.map((name, index) =>
    createPlayer(`player_${index}`, name, getPlayerColor(index))
  );

  const turn: TurnState = {
    currentPlayerIndex: 0,
    round: 1,
    phase: 'setup',
    setupPhase: 'firstSettlement',
    setupRound: 1,
    hasRolled: false,
    mustDiscardPlayers: [],
    canPlayDevCard: true,
  };

  // Create development card deck
  const devCardDeck = createDevCardDeck();

  return {
    config,
    board: {
      tiles: new Map(),
      vertices: new Map(),
      edges: new Map(),
      ports: [],
    }, // Will be populated by board generator
    players,
    turn,
    devCardDeck,
    longestRoadPlayer: null,
    largestArmyPlayer: null,
    winner: null,
  };
}

/**
 * Create the development card deck
 */
function createDevCardDeck(): DevCardType[] {
  const deck: DevCardType[] = [];

  for (let i = 0; i < GAME_CONSTANTS.DEV_CARDS.knight; i++) {
    deck.push('knight');
  }
  for (let i = 0; i < GAME_CONSTANTS.DEV_CARDS.victoryPoint; i++) {
    deck.push('victoryPoint');
  }
  for (let i = 0; i < GAME_CONSTANTS.DEV_CARDS.roadBuilding; i++) {
    deck.push('roadBuilding');
  }
  for (let i = 0; i < GAME_CONSTANTS.DEV_CARDS.yearOfPlenty; i++) {
    deck.push('yearOfPlenty');
  }
  for (let i = 0; i < GAME_CONSTANTS.DEV_CARDS.monopoly; i++) {
    deck.push('monopoly');
  }

  return deck;
}

/**
 * Deep clone game state (for immutability)
 */
export function cloneGameState(state: GameState): GameState {
  return {
    ...state,
    config: { ...state.config },
    board: {
      tiles: new Map(state.board.tiles),
      vertices: new Map(state.board.vertices),
      edges: new Map(state.board.edges),
      ports: [...state.board.ports],
    },
    players: state.players.map((p) => ({
      ...p,
      resources: { ...p.resources },
      settlements: [...p.settlements],
      cities: [...p.cities],
      roads: [...p.roads],
      devCards: p.devCards.map((card) => ({ ...card })),
    })),
    turn: { ...state.turn, mustDiscardPlayers: [...state.turn.mustDiscardPlayers] },
    devCardDeck: [...state.devCardDeck],
  };
}

/**
 * Get the current player
 */
export function getCurrentPlayer(state: GameState) {
  return state.players[state.turn.currentPlayerIndex];
}

/**
 * Get a player by ID
 */
export function getPlayerById(state: GameState, playerId: string) {
  return state.players.find((p) => p.id === playerId);
}

/**
 * Advance to the next player (handles setup phase reverse order)
 */
export function getNextPlayerIndex(state: GameState): number {
  const { currentPlayerIndex } = state.turn;
  const playerCount = state.players.length;

  // In setup round 2, go in reverse order
  if (state.turn.setupRound === 2) {
    const nextIndex = currentPlayerIndex - 1;
    return nextIndex < 0 ? playerCount - 1 : nextIndex;
  }

  // Normal order
  return (currentPlayerIndex + 1) % playerCount;
}

/**
 * Check if setup phase is complete
 */
export function isSetupComplete(state: GameState): boolean {
  if (state.turn.phase !== 'setup') return true;

  // Setup is complete when we've done both rounds and all players have placed
  return (
    state.turn.setupRound === 2 &&
    state.turn.setupPhase === 'secondRoad' &&
    state.turn.currentPlayerIndex === 0 &&
    state.players[0].settlements.length === 2
  );
}

