import {
  GameState,
  ResourceType,
  ResourceCount,
} from '../../core/types';
import { cloneGameState, getPlayerById } from '../../core/state';
import { removeResources } from '../../core/player';
import { SeededRandom } from '../../utils/random';
import * as Rules from '../rules';

export function discardResources(
  state: GameState,
  playerId: string,
  resources: Partial<ResourceCount>
): GameState {
  const validation = Rules.canDiscardResources(state, playerId, resources);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const newState = cloneGameState(state);
  const player = getPlayerById(newState, playerId)!;

  player.resources = removeResources(player.resources, resources);

  newState.turn.mustDiscardPlayers = newState.turn.mustDiscardPlayers.filter(
    (id) => id !== playerId
  );

  if (newState.turn.mustDiscardPlayers.length === 0) {
    newState.turn.phase = 'robberPlacement';
  }

  return newState;
}

export function moveRobber(
  state: GameState,
  playerId: string,
  hexId: string,
  targetPlayerId?: string
): GameState {
  const newState = cloneGameState(state);

  newState.board.tiles.forEach((tile) => {
    tile.hasRobber = tile.id === hexId;
  });

  if (targetPlayerId) {
    const targetPlayer = getPlayerById(newState, targetPlayerId);
    const player = getPlayerById(newState, playerId);

    if (targetPlayer && player) {
      const availableResources: ResourceType[] = [];
      Object.entries(targetPlayer.resources).forEach(([resource, count]) => {
        for (let i = 0; i < count; i++) {
          availableResources.push(resource as ResourceType);
        }
      });

      if (availableResources.length > 0) {
        const random = new SeededRandom(Date.now());
        const stolenResource = random.choice(availableResources);
        targetPlayer.resources[stolenResource]--;
        player.resources[stolenResource]++;
      }
    }
  }

  if (newState.turn.phase === 'robberPlacement') {
    newState.turn.phase = 'main';
  }

  return newState;
}

