import { GameState } from '../../core/types';
import { cloneGameState, getCurrentPlayer } from '../../core/state';
import * as Rules from '../rules';

export * from './dice';
export * from './building';
export * from './dev-cards';
export * from './robber';
export * from './trading';

export function endTurn(state: GameState, playerId: string): GameState {
  const validation = Rules.canEndTurn(state, playerId);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const newState = cloneGameState(state);

  newState.turn.hasRolled = false;
  newState.turn.diceRoll = undefined;
  newState.turn.canPlayDevCard = true;

  const currentPlayer = getCurrentPlayer(newState);
  currentPlayer.devCardsPlayedThisTurn = 0;

  newState.turn.currentPlayerIndex = (newState.turn.currentPlayerIndex + 1) % newState.players.length;
  newState.turn.round = Math.floor(newState.turn.round + 1 / newState.players.length);

  return newState;
}

