import inquirer from 'inquirer';
import { Game } from '../../engine/game';
import { ResourceType } from '../../core/types';
import { pause, getPlayersOnHex } from '../utils';

export async function handleRobberDiscardPhase(game: Game) {
  const state = game.getState();
  
  for (const playerId of state.turn.mustDiscardPlayers) {
    const player = state.players.find(p => p.id === playerId)!;
    const totalResources = Object.values(player.resources).reduce((a, b) => a + b, 0);
    const mustDiscard = Math.floor(totalResources / 2);

    console.log(`\n⚠️  ${player.name} rolled a 7 and has ${totalResources} resources!`);
    console.log(`${player.name} must discard ${mustDiscard} resources.\n`);

    const resources: Record<string, number> = {};
    let remaining = mustDiscard;

    while (remaining > 0) {
      const availableResources = Object.entries(player.resources)
        .filter(([_, count]) => count > 0)
        .map(([resource]) => resource);

      if (availableResources.length === 0) break;

      const { resource, amount } = await inquirer.prompt([
        {
          type: 'list',
          name: 'resource',
          message: `[${player.name}] Choose resource to discard (${remaining} remaining):`,
          choices: availableResources,
        },
        {
          type: 'number',
          name: 'amount',
          message: 'How many?',
          default: 1,
          validate: (val) => {
            if (!val || val <= 0) return 'Must discard at least 1';
            if (val > remaining) return `Can only discard ${remaining} more`;
            if (val > player.resources[resource as ResourceType]) {
              return `You only have ${player.resources[resource as ResourceType]} ${resource}`;
            }
            return true;
          },
        },
      ]);

      resources[resource] = (resources[resource] || 0) + amount;
      remaining -= amount;
    }

    game.discardResources(playerId, resources as Partial<Record<ResourceType, number>>);
    console.log(`✅ ${player.name} discarded resources!`);
  }

  await pause();
}

export async function handleRobberPlacementPhase(game: Game) {
  const state = game.getState();
  const currentPlayer = game.getCurrentPlayer();
  const currentRobberTile = Array.from(state.board.tiles.values()).find(t => t.hasRobber);

  console.log('\n🛡️  Move the robber!\n');

  const validTiles = Array.from(state.board.tiles.values())
    .filter(t => !t.hasRobber)
    .map(t => {
      const playersOnTile = getPlayersOnHex(game, t.id)
        .filter(pid => pid !== currentPlayer.id);
      
      const playerNames = playersOnTile
        .map(pid => state.players.find(p => p.id === pid)?.name)
        .join(', ');

      return {
        name: `${t.id} - ${t.type === 'desert' ? '🏜️ Desert' : `${getResourceEmoji(t.type)} ${t.numberToken || ''}`}${
          playerNames ? ` (${playerNames})` : ''
        }`,
        value: t.id,
      };
    })
    .sort((a, b) => {
      const aHasOpponents = a.name.includes('(');
      const bHasOpponents = b.name.includes('(');
      if (aHasOpponents && !bHasOpponents) return -1;
      if (!aHasOpponents && bHasOpponents) return 1;
      return a.name.localeCompare(b.name);
    });

  if (currentRobberTile) {
    console.log(`Current robber location: ${currentRobberTile.id}`);
  }

  const { hexId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'hexId',
      message: 'Choose hex to move robber to:',
      choices: validTiles,
      pageSize: 15,
    },
  ]);

  const playersToStealFrom = getPlayersOnHex(game, hexId)
    .filter(pid => pid !== currentPlayer.id);

  let targetPlayerId: string | undefined;

  if (playersToStealFrom.length > 0) {
    const playerChoices = playersToStealFrom.map(playerId => {
      const player = state.players.find(p => p.id === playerId);
      const resourceCount = Object.values(player!.resources).reduce((a, b) => a + b, 0);
      return {
        name: `${player!.name} (${player!.color}, ${resourceCount} resources)`,
        value: playerId,
      };
    });

    playerChoices.push({ name: 'No one (skip stealing)', value: '' });

    const { target } = await inquirer.prompt([
      {
        type: 'list',
        name: 'target',
        message: 'Who would you like to steal from?',
        choices: playerChoices,
      },
    ]);

    targetPlayerId = target || undefined;
  }

  game.moveRobber(hexId, targetPlayerId);
  
  if (targetPlayerId) {
    const targetPlayer = state.players.find(p => p.id === targetPlayerId);
    console.log(`🎴 Stole a random resource from ${targetPlayer!.name}!`);
  }
  
  console.log('✅ Robber moved!');
  await pause();
}

function getResourceEmoji(type: string): string {
  switch (type) {
    case 'forest': return '🌲';
    case 'hills': return '🧱';
    case 'pasture': return '🐑';
    case 'fields': return '🌾';
    case 'mountains': return '⛰️';
    default: return '❓';
  }
}

