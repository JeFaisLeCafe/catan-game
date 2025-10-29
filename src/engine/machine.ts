import { setup, assign, fromPromise } from 'xstate';
import { GameState, GameAction } from '../core/types';
import * as Actions from './actions';
import { updateLongestRoad, updateLargestArmy, checkVictory } from '../utils/victory';

/**
 * Game machine context
 */
interface GameContext {
  gameState: GameState;
  pendingAction?: GameAction;
  error?: string;
}

/**
 * Game machine events
 */
type GameEvent =
  | { type: 'ROLL_DICE' }
  | { type: 'PLACE_SETTLEMENT'; vertexId: string }
  | { type: 'PLACE_CITY'; vertexId: string }
  | { type: 'PLACE_ROAD'; edgeId: string }
  | { type: 'BUY_DEV_CARD' }
  | { type: 'PLAY_KNIGHT'; hexId: string; targetPlayerId?: string }
  | { type: 'PLAY_ROAD_BUILDING'; edge1Id: string; edge2Id?: string }
  | { type: 'PLAY_YEAR_OF_PLENTY'; resource1: string; resource2: string }
  | { type: 'PLAY_MONOPOLY'; resource: string }
  | { type: 'DISCARD_RESOURCES'; playerId: string; resources: Record<string, number> }
  | { type: 'MOVE_ROBBER'; hexId: string; targetPlayerId?: string }
  | { type: 'TRADE_WITH_BANK'; give: Record<string, number>; get: Record<string, number> }
  | { type: 'END_TURN' };

/**
 * Create the game state machine
 */
export const createGameMachine = (initialState: GameState) => {
  return setup({
    types: {
      context: {} as GameContext,
      events: {} as GameEvent,
    },
    actions: {
      // Settlement placement
      placeSettlement: assign({
        gameState: ({ context, event }) => {
          if (event.type !== 'PLACE_SETTLEMENT') return context.gameState;
          const currentPlayer = context.gameState.players[context.gameState.turn.currentPlayerIndex];
          return Actions.placeSettlement(context.gameState, currentPlayer.id, event.vertexId);
        },
      }),

      // City placement
      placeCity: assign({
        gameState: ({ context, event }) => {
          if (event.type !== 'PLACE_CITY') return context.gameState;
          const currentPlayer = context.gameState.players[context.gameState.turn.currentPlayerIndex];
          return Actions.placeCity(context.gameState, currentPlayer.id, event.vertexId);
        },
      }),

      // Road placement
      placeRoad: assign({
        gameState: ({ context, event }) => {
          if (event.type !== 'PLACE_ROAD') return context.gameState;
          const currentPlayer = context.gameState.players[context.gameState.turn.currentPlayerIndex];
          let newState = Actions.placeRoad(context.gameState, currentPlayer.id, event.edgeId);

          // Update longest road
          newState = updateLongestRoad(newState);
          newState = checkVictory(newState);

          return newState;
        },
      }),

      // Roll dice
      rollDice: assign({
        gameState: ({ context }) => {
          return Actions.rollDice(context.gameState);
        },
      }),

      // Buy dev card
      buyDevCard: assign({
        gameState: ({ context }) => {
          const currentPlayer = context.gameState.players[context.gameState.turn.currentPlayerIndex];
          return Actions.buyDevCard(context.gameState, currentPlayer.id);
        },
      }),

      // Play knight
      playKnight: assign({
        gameState: ({ context, event }) => {
          if (event.type !== 'PLAY_KNIGHT') return context.gameState;
          const currentPlayer = context.gameState.players[context.gameState.turn.currentPlayerIndex];
          let newState = Actions.playKnight(
            context.gameState,
            currentPlayer.id,
            event.hexId,
            event.targetPlayerId
          );

          // Update largest army
          newState = updateLargestArmy(newState);
          newState = checkVictory(newState);

          return newState;
        },
      }),

      // Play road building
      playRoadBuilding: assign({
        gameState: ({ context, event }) => {
          if (event.type !== 'PLAY_ROAD_BUILDING') return context.gameState;
          const currentPlayer = context.gameState.players[context.gameState.turn.currentPlayerIndex];
          let newState = Actions.playRoadBuilding(
            context.gameState,
            currentPlayer.id,
            event.edge1Id,
            event.edge2Id
          );

          // Update longest road
          newState = updateLongestRoad(newState);
          newState = checkVictory(newState);

          return newState;
        },
      }),

      // Play year of plenty
      playYearOfPlenty: assign({
        gameState: ({ context, event }) => {
          if (event.type !== 'PLAY_YEAR_OF_PLENTY') return context.gameState;
          const currentPlayer = context.gameState.players[context.gameState.turn.currentPlayerIndex];
          return Actions.playYearOfPlenty(
            context.gameState,
            currentPlayer.id,
            event.resource1 as any,
            event.resource2 as any
          );
        },
      }),

      // Play monopoly
      playMonopoly: assign({
        gameState: ({ context, event }) => {
          if (event.type !== 'PLAY_MONOPOLY') return context.gameState;
          const currentPlayer = context.gameState.players[context.gameState.turn.currentPlayerIndex];
          return Actions.playMonopoly(context.gameState, currentPlayer.id, event.resource as any);
        },
      }),

      // Discard resources
      discardResources: assign({
        gameState: ({ context, event }) => {
          if (event.type !== 'DISCARD_RESOURCES') return context.gameState;
          return Actions.discardResources(
            context.gameState,
            event.playerId,
            event.resources as any
          );
        },
      }),

      // Move robber
      moveRobber: assign({
        gameState: ({ context, event }) => {
          if (event.type !== 'MOVE_ROBBER') return context.gameState;
          const currentPlayer = context.gameState.players[context.gameState.turn.currentPlayerIndex];
          return Actions.moveRobber(
            context.gameState,
            currentPlayer.id,
            event.hexId,
            event.targetPlayerId
          );
        },
      }),

      // Trade with bank
      tradeWithBank: assign({
        gameState: ({ context, event }) => {
          if (event.type !== 'TRADE_WITH_BANK') return context.gameState;
          const currentPlayer = context.gameState.players[context.gameState.turn.currentPlayerIndex];
          return Actions.tradeWithBank(
            context.gameState,
            currentPlayer.id,
            event.give as any,
            event.get as any
          );
        },
      }),

      // End turn
      endTurn: assign({
        gameState: ({ context }) => {
          const currentPlayer = context.gameState.players[context.gameState.turn.currentPlayerIndex];
          return Actions.endTurn(context.gameState, currentPlayer.id);
        },
      }),
    },
    guards: {
      isSetupComplete: ({ context }) => {
        return context.gameState.turn.phase !== 'setup';
      },
      isRobberDiscardComplete: ({ context }) => {
        return context.gameState.turn.mustDiscardPlayers.length === 0;
      },
      isGameOver: ({ context }) => {
        return context.gameState.turn.phase === 'gameOver';
      },
      hasRolled: ({ context }) => {
        return context.gameState.turn.hasRolled;
      },
    },
  }).createMachine({
    id: 'catanGame',
    initial: 'setup',
    context: {
      gameState: initialState,
    },
    states: {
      // Setup phase - initial placement
      setup: {
        on: {
          PLACE_SETTLEMENT: {
            actions: 'placeSettlement',
          },
          PLACE_ROAD: {
            actions: 'placeRoad',
            target: 'checkSetupComplete',
          },
        },
      },

      // Check if setup is complete
      checkSetupComplete: {
        always: [
          {
            guard: 'isSetupComplete',
            target: 'mainGame',
          },
          {
            target: 'setup',
          },
        ],
      },

      // Main game phase
      mainGame: {
        initial: 'waitingForRoll',
        states: {
          // Waiting for dice roll
          waitingForRoll: {
            on: {
              ROLL_DICE: {
                actions: 'rollDice',
                target: 'checkRollResult',
              },
            },
          },

          // Check what happened with the roll
          checkRollResult: {
            always: [
              {
                guard: ({ context }) => context.gameState.turn.phase === 'robberDiscard',
                target: 'robberDiscard',
              },
              {
                guard: ({ context }) => context.gameState.turn.phase === 'robberPlacement',
                target: 'robberPlacement',
              },
              {
                target: 'playing',
              },
            ],
          },

          // Robber discard phase (when 7 rolled and players have >7 cards)
          robberDiscard: {
            on: {
              DISCARD_RESOURCES: {
                actions: 'discardResources',
              },
            },
            always: {
              guard: 'isRobberDiscardComplete',
              target: 'robberPlacement',
            },
          },

          // Robber placement phase
          robberPlacement: {
            on: {
              MOVE_ROBBER: {
                actions: 'moveRobber',
                target: 'playing',
              },
            },
          },

          // Main playing phase - building, trading, etc.
          playing: {
            on: {
              PLACE_SETTLEMENT: {
                actions: 'placeSettlement',
              },
              PLACE_CITY: {
                actions: 'placeCity',
              },
              PLACE_ROAD: {
                actions: 'placeRoad',
              },
              BUY_DEV_CARD: {
                actions: 'buyDevCard',
              },
              PLAY_KNIGHT: {
                actions: 'playKnight',
              },
              PLAY_ROAD_BUILDING: {
                actions: 'playRoadBuilding',
              },
              PLAY_YEAR_OF_PLENTY: {
                actions: 'playYearOfPlenty',
              },
              PLAY_MONOPOLY: {
                actions: 'playMonopoly',
              },
              TRADE_WITH_BANK: {
                actions: 'tradeWithBank',
              },
              END_TURN: {
                actions: 'endTurn',
                target: '#catanGame.checkGameOver',
              },
            },
          },
        },
      },

      // Check if game is over
      checkGameOver: {
        always: [
          {
            guard: 'isGameOver',
            target: 'gameOver',
          },
          {
            target: 'mainGame.waitingForRoll',
          },
        ],
      },

      // Game over
      gameOver: {
        type: 'final',
      },
    },
  });
};

/**
 * Type for the created machine
 */
export type GameMachine = ReturnType<typeof createGameMachine>;

