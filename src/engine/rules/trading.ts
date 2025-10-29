import {
  GameState,
  ValidationResult,
  ResourceType,
} from '../../core/types';
import { hasResources } from '../../core/player';
import { getCurrentPlayer, getPlayerById } from '../../core/state';

export function canTradeWithBank(
  state: GameState,
  playerId: string,
  give: Partial<Record<ResourceType, number>>,
  get: Partial<Record<ResourceType, number>>
): ValidationResult {
  const player = getPlayerById(state, playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  if (state.turn.phase === 'setup') {
    return { valid: false, error: 'Cannot trade during setup' };
  }

  if (getCurrentPlayer(state).id !== playerId) {
    return { valid: false, error: 'Not your turn' };
  }

  if (!state.turn.hasRolled) {
    return { valid: false, error: 'Must roll dice first' };
  }

  if (!hasResources(player.resources, give)) {
    return { valid: false, error: 'Insufficient resources to trade' };
  }

  const giveEntries = Object.entries(give).filter(([_, count]) => count && count > 0);
  const getEntries = Object.entries(get).filter(([_, count]) => count && count > 0);

  if (giveEntries.length !== 1 || getEntries.length !== 1) {
    return { valid: false, error: 'Bank trades must be single resource type for single type' };
  }

  const [giveResource, giveCount] = giveEntries[0] as [ResourceType, number];
  const [, getCount] = getEntries[0];

  if (getCount !== 1) {
    return { valid: false, error: 'Bank trades give you exactly 1 resource' };
  }

  const playerVertices = [...player.settlements, ...player.cities];
  let bestRatio = 4;

  for (const vertexId of playerVertices) {
    const vertex = state.board.vertices.get(vertexId);
    if (vertex?.port) {
      if (vertex.port.type === 'generic') {
        bestRatio = Math.min(bestRatio, 3);
      } else if (vertex.port.type === giveResource) {
        bestRatio = Math.min(bestRatio, 2);
      }
    }
  }

  if (giveCount !== bestRatio) {
    return { valid: false, error: `Invalid trade ratio. You need ${bestRatio}:1 for this resource` };
  }

  return { valid: true };
}

export function canOfferTrade(state: GameState, playerId: string): ValidationResult {
  const player = getPlayerById(state, playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  if (state.turn.phase === 'setup') {
    return { valid: false, error: 'Cannot trade during setup' };
  }

  if (getCurrentPlayer(state).id !== playerId) {
    return { valid: false, error: 'Not your turn' };
  }

  if (!state.turn.hasRolled) {
    return { valid: false, error: 'Must roll dice first' };
  }

  return { valid: true };
}

