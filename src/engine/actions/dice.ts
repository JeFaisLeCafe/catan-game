import {
  GameState,
  ResourceType,
  GAME_CONSTANTS,
} from '../../core/types';
import { cloneGameState } from '../../core/state';
import { SeededRandom } from '../../utils/random';

export function rollDice(state: GameState): GameState {
  if (state.turn.phase !== 'main') {
    throw new Error('Can only roll dice during main phase');
  }

  if (state.turn.hasRolled) {
    throw new Error('Dice already rolled this turn');
  }

  const newState = cloneGameState(state);
  const random = new SeededRandom(Date.now());
  const dice = random.rollDice();
  const total = dice[0] + dice[1];

  newState.turn.diceRoll = dice;
  newState.turn.hasRolled = true;

  if (total === GAME_CONSTANTS.ROBBER_NUMBER) {
    const mustDiscard: string[] = [];
    newState.players.forEach((player) => {
      const totalResources =
        player.resources.wood +
        player.resources.brick +
        player.resources.sheep +
        player.resources.wheat +
        player.resources.ore;

      if (totalResources > GAME_CONSTANTS.ROBBER_DISCARD_THRESHOLD) {
        mustDiscard.push(player.id);
      }
    });

    if (mustDiscard.length > 0) {
      newState.turn.phase = 'robberDiscard';
      newState.turn.mustDiscardPlayers = mustDiscard;
    } else {
      newState.turn.phase = 'robberPlacement';
    }

    return newState;
  }

  newState.board.tiles.forEach((tile) => {
    if (tile.numberToken === total && !tile.hasRobber && tile.type !== 'desert') {
      const resource = tile.type as ResourceType;

      newState.board.vertices.forEach((vertex) => {
        if (!vertex.adjacentTiles.includes(tile.id)) return;
        if (!vertex.structure) return;

        const player = newState.players.find((p) => p.id === vertex.structure!.playerId);
        if (!player) return;

        if (vertex.structure.type === 'settlement') {
          player.resources[resource] += 1;
        } else if (vertex.structure.type === 'city') {
          player.resources[resource] += 2;
        }
      });
    }
  });

  return newState;
}

