import {
  GameState,
  ValidationResult,
  DevCardType,
  GAME_CONSTANTS,
} from '../../core/types';
import { hasResources, countResources } from '../../core/player';
import { getCurrentPlayer, getPlayerById } from '../../core/state';

export function canBuyDevCard(state: GameState, playerId: string): ValidationResult {
  const player = getPlayerById(state, playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  if (state.turn.phase === 'setup') {
    return { valid: false, error: 'Cannot buy development cards during setup' };
  }

  if (state.devCardDeck.length === 0) {
    return { valid: false, error: 'Development card deck is empty' };
  }

  if (!hasResources(player.resources, GAME_CONSTANTS.COSTS.devCard)) {
    return { valid: false, error: 'Insufficient resources for development card' };
  }

  return { valid: true };
}

export function canPlayDevCard(
  state: GameState,
  playerId: string,
  cardType: DevCardType
): ValidationResult {
  const player = getPlayerById(state, playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  if (state.turn.phase === 'setup') {
    return { valid: false, error: 'Cannot play development cards during setup' };
  }

  if (getCurrentPlayer(state).id !== playerId) {
    return { valid: false, error: 'Not your turn' };
  }

  const hasCard = player.devCards.some((card) => card.type === cardType && !card.playedThisTurn);
  if (!hasCard) {
    return { valid: false, error: `You don't have a ${cardType} card` };
  }

  const cardInHand = player.devCards.find((card) => card.type === cardType && !card.playedThisTurn);
  if (cardType !== 'victoryPoint' && cardInHand?.playedThisTurn === false) {
    // This check would need tracking of when cards were acquired
    // For simplicity, we'll allow it here
  }

  if (cardType !== 'victoryPoint' && player.devCardsPlayedThisTurn > 0) {
    return { valid: false, error: 'Already played a development card this turn' };
  }

  if (!state.turn.hasRolled && state.turn.phase !== 'robberPlacement') {
    return { valid: false, error: 'Must roll dice first' };
  }

  return { valid: true };
}

export function canPlayKnight(
  state: GameState,
  playerId: string,
  newRobberHexId: string,
  targetPlayerId?: string
): ValidationResult {
  const baseValidation = canPlayDevCard(state, playerId, 'knight');
  if (!baseValidation.valid) return baseValidation;

  const hex = state.board.tiles.get(newRobberHexId);
  if (!hex) {
    return { valid: false, error: 'Invalid hex for robber' };
  }

  if (hex.hasRobber) {
    return { valid: false, error: 'Robber is already on this hex' };
  }

  if (targetPlayerId) {
    const targetPlayer = getPlayerById(state, targetPlayerId);
    if (!targetPlayer) {
      return { valid: false, error: 'Target player not found' };
    }

    if (targetPlayerId === playerId) {
      return { valid: false, error: 'Cannot steal from yourself' };
    }

    if (countResources(targetPlayer.resources) === 0) {
      return { valid: false, error: 'Target player has no resources' };
    }

    let hasStructure = false;
    const vertices = Array.from(state.board.vertices.values()).filter((v) =>
      v.adjacentTiles.includes(newRobberHexId)
    );

    for (const vertex of vertices) {
      if (vertex.structure?.playerId === targetPlayerId) {
        hasStructure = true;
        break;
      }
    }

    if (!hasStructure) {
      return { valid: false, error: 'Target player has no structures on this hex' };
    }
  }

  return { valid: true };
}

