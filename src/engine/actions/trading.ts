import {
  GameState,
  ResourceCount,
} from '../../core/types';
import { cloneGameState, getPlayerById } from '../../core/state';
import { removeResources, addResources } from '../../core/player';
import * as Rules from '../rules';

export function tradeWithBank(
  state: GameState,
  playerId: string,
  give: Partial<ResourceCount>,
  get: Partial<ResourceCount>
): GameState {
  const validation = Rules.canTradeWithBank(state, playerId, give, get);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const newState = cloneGameState(state);
  const player = getPlayerById(newState, playerId)!;

  player.resources = removeResources(player.resources, give);
  player.resources = addResources(player.resources, get);

  return newState;
}

