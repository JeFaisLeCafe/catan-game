#!/usr/bin/env node

import inquirer from 'inquirer';
import { Game } from '../engine/game';
import {
  clearScreen,
  displayHeader,
  displayBoard,
  displayPlayers,
  displayTurnInfo,
  displayGameOver,
} from './display';
import { handleSetupPhase } from './handlers/setup';
import { handleMainPhase } from './handlers/main';
import { handleRobberDiscardPhase, handleRobberPlacementPhase } from './handlers/robber';

async function main() {
  clearScreen();
  displayHeader();

  const { numPlayers } = await inquirer.prompt([
    {
      type: 'list',
      name: 'numPlayers',
      message: 'How many players?',
      choices: ['3', '4'],
      default: '3',
    },
  ]);

  const playerNames: string[] = [];
  for (let i = 0; i < parseInt(numPlayers); i++) {
    const { name } = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: `Player ${i + 1} name:`,
        default: `Player ${i + 1}`,
      },
    ]);
    playerNames.push(name);
  }

  const { useSeed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'useSeed',
      message: 'Use a random seed for reproducible board?',
      default: false,
    },
  ]);

  let seed: number | undefined;
  if (useSeed) {
    const { seedValue } = await inquirer.prompt([
      {
        type: 'number',
        name: 'seedValue',
        message: 'Enter seed (number):',
        default: 12345,
      },
    ]);
    seed = seedValue;
  }

  console.log('\n🎲 Initializing game...');
  const game = new Game(playerNames, seed);

  await gameLoop(game);
}

async function gameLoop(game: Game) {
  while (!game.isGameOver()) {
    clearScreen();
    displayHeader();

    const state = game.getState();

    displayBoard(state);
    displayPlayers(state);
    displayTurnInfo(state);

    const phase = game.getCurrentPhase();

    try {
      if (phase === 'setup') {
        await handleSetupPhase(game);
      } else if (phase === 'main') {
        await handleMainPhase(game);
      } else if (phase === 'robberDiscard') {
        await handleRobberDiscardPhase(game);
      } else if (phase === 'robberPlacement') {
        await handleRobberPlacementPhase(game);
      }
    } catch (error) {
      console.error('❌ Error:', (error as Error).message);
      await inquirer.prompt([
        {
          type: 'input',
          name: 'continue',
          message: 'Press Enter to continue...',
        },
      ]);
    }
  }

  clearScreen();
  displayGameOver(game.getState());
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

