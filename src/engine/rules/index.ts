import { GameState, ValidationResult } from '../../core/types';
import { getCurrentPlayer, getPlayerById } from '../../core/state';

export * from './building';
export * from './dev-cards';
export * from './trading';
export * from './robber';

export function canEndTurn(state: GameState, playerId: string): ValidationResult {
  const player = getPlayerById(state, playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  if (getCurrentPlayer(state).id !== playerId) {
    return { valid: false, error: 'Not your turn' };
  }

  if (state.turn.phase === 'setup') {
    return { valid: false, error: 'Cannot manually end turn during setup' };
  }

  if (!state.turn.hasRolled) {
    return { valid: false, error: 'Must roll dice before ending turn' };
  }

  return { valid: true };
}

