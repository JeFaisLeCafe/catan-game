import inquirer from 'inquirer';
import chalk from 'chalk';
import { Game } from '../../engine/game';
import { ResourceType } from '../../core/types';
import { pause, getPlayersOnHex } from '../utils';

export async function handlePlayDevCard(game: Game) {
  const currentPlayer = game.getCurrentPlayer();

  if (currentPlayer.devCards.length === 0) {
    console.log('❌ You have no development cards!');
    await pause();
    return;
  }

  const cardTypes = [...new Set(currentPlayer.devCards.map((c) => c.type))];

  const { cardType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'cardType',
      message: 'Which card do you want to play?',
      choices: cardTypes,
    },
  ]);

  if (cardType === 'knight') {
    await handlePlayKnight(game);
  } else if (cardType === 'roadBuilding') {
    await handlePlayRoadBuilding(game);
  } else if (cardType === 'yearOfPlenty') {
    await handlePlayYearOfPlenty(game);
  } else if (cardType === 'monopoly') {
    await handlePlayMonopoly(game);
  }
}

export async function handlePlayKnight(game: Game) {
  const { hexId } = await inquirer.prompt([
    {
      type: 'input',
      name: 'hexId',
      message: 'Enter hex ID to move robber:',
    },
  ]);

  const playersToStealFrom = getPlayersOnHex(game, hexId);
  const state = game.getState();

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

  const currentPlayer = game.getCurrentPlayer();
  game.playKnight(hexId, targetPlayerId);
  console.log(chalk.yellow(`⚔️  ${currentPlayer.name} played a Knight card!`));
  console.log(chalk.yellow(`   Robber moved to ${hexId}`));
  if (targetPlayerId) {
    const target = game.getState().players.find(p => p.id === targetPlayerId);
    console.log(chalk.yellow(`   Stole a resource from ${target?.name}!`));
  }
  await pause();
}

export async function handlePlayRoadBuilding(game: Game) {
  const { edge1Id, edge2Id } = await inquirer.prompt([
    {
      type: 'input',
      name: 'edge1Id',
      message: 'Enter first edge ID for road:',
    },
    {
      type: 'input',
      name: 'edge2Id',
      message: 'Enter second edge ID for road (optional):',
    },
  ]);

  const currentPlayer = game.getCurrentPlayer();
  game.playRoadBuilding(edge1Id, edge2Id || undefined);
  console.log(chalk.green(`🛤️  ${currentPlayer.name} played Road Building!`));
  console.log(chalk.green(`   Built roads at ${edge1Id}${edge2Id ? ` and ${edge2Id}` : ''}!`));
  await pause();
}

export async function handlePlayYearOfPlenty(game: Game) {
  const { resource1, resource2 } = await inquirer.prompt([
    {
      type: 'list',
      name: 'resource1',
      message: 'Choose first resource:',
      choices: ['wood', 'brick', 'sheep', 'wheat', 'ore'],
    },
    {
      type: 'list',
      name: 'resource2',
      message: 'Choose second resource:',
      choices: ['wood', 'brick', 'sheep', 'wheat', 'ore'],
    },
  ]);

  const currentPlayer = game.getCurrentPlayer();
  game.playYearOfPlenty(resource1, resource2);
  console.log(chalk.green(`🌾 ${currentPlayer.name} played Year of Plenty!`));
  console.log(chalk.green(`   Received 1 ${resource1} and 1 ${resource2}!`));
  await pause();
}

export async function handlePlayMonopoly(game: Game) {
  const { resource } = await inquirer.prompt<{ resource: ResourceType }>([
    {
      type: 'list',
      name: 'resource',
      message: 'Choose resource to monopolize:',
      choices: ['wood', 'brick', 'sheep', 'wheat', 'ore'],
    },
  ]);

  const currentPlayer = game.getCurrentPlayer();
  const oldState = game.getState();
  game.playMonopoly(resource);
  
  const stolenCount = oldState.players.reduce((sum, p) => {
    if (p.id !== currentPlayer.id) {
      return sum + (p.resources[resource] || 0);
    }
    return sum;
  }, 0);
  
  console.log(chalk.green(`💰 ${currentPlayer.name} played Monopoly on ${resource}!`));
  console.log(chalk.green(`   Collected ${stolenCount} ${resource} from other players!`));
  await pause();
}

