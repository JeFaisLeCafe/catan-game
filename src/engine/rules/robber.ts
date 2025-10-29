import {
  GameState,
  ValidationResult,
  ResourceType,
} from '../../core/types';
import { hasResources, countResources } from '../../core/player';
import { getPlayerById } from '../../core/state';

export function canDiscardResources(
  state: GameState,
  playerId: string,
  resources: Partial<Record<ResourceType, number>>
): ValidationResult {
  const player = getPlayerById(state, playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  if (state.turn.phase !== 'robberDiscard') {
    return { valid: false, error: 'Not in discard phase' };
  }

  if (!state.turn.mustDiscardPlayers.includes(playerId)) {
    return { valid: false, error: 'You do not need to discard' };
  }

  const totalResources = countResources(player.resources);
  const discardCount = Object.values(resources).reduce((sum, count) => sum + (count || 0), 0);

  const requiredDiscard = Math.floor(totalResources / 2);
  if (discardCount !== requiredDiscard) {
    return { valid: false, error: `Must discard exactly ${requiredDiscard} resources` };
  }

  if (!hasResources(player.resources, resources)) {
    return { valid: false, error: 'Trying to discard resources you don\'t have' };
  }

  return { valid: true };
}

