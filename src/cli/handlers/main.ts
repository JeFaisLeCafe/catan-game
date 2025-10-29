import inquirer from 'inquirer';
import chalk from 'chalk';
import { Game } from '../../engine/game';
import { pause, logResourceDistribution } from '../utils';
import { handleBuildSettlement, handleBuildCity, handleBuildRoad } from './building';
import { handlePlayDevCard } from './dev-cards';
import { handleBankTrade } from './trading';

export async function handleMainPhase(game: Game) {
  const state = game.getState();

  if (!state.turn.hasRolled) {
    const { action } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'action',
        message: '🎲 Roll dice?',
        default: true,
      },
    ]);

    if (action) {
      const oldState = game.getState();
      game.rollDice();
      const newState = game.getState();
      const dice1 = newState.turn.diceRoll?.[0] || 0;
      const dice2 = newState.turn.diceRoll?.[1] || 0;
      const total = dice1 + dice2;
      
      console.log(`\n🎲 Rolled: ${dice1} + ${dice2} = ${total}\n`);
      
      if (total === 7) {
        console.log(chalk.red('⚠️  ROBBER! Players with >7 cards must discard.\n'));
      } else {
        logResourceDistribution(oldState, newState, total);
      }
      
      await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter...' }]);
    }
    return;
  }

  const currentPlayer = game.getCurrentPlayer();
  const choices: string[] = [];
  
  const hasSettlementResources = currentPlayer.resources.wood >= 1 && 
                                  currentPlayer.resources.brick >= 1 && 
                                  currentPlayer.resources.sheep >= 1 && 
                                  currentPlayer.resources.wheat >= 1;
  if (hasSettlementResources && currentPlayer.settlements.length < 5) {
    choices.push('Build Settlement');
  }
  
  const hasCityResources = currentPlayer.resources.wheat >= 2 && 
                           currentPlayer.resources.ore >= 3;
  if (hasCityResources && currentPlayer.settlements.length > 0 && currentPlayer.cities.length < 4) {
    choices.push('Build City');
  }
  
  const hasRoadResources = currentPlayer.resources.wood >= 1 && 
                           currentPlayer.resources.brick >= 1;
  if (hasRoadResources && currentPlayer.roads.length < 15) {
    choices.push('Build Road');
  }
  
  if (game.canPerformAction('buyDevCard').valid) {
    choices.push('Buy Development Card');
  }
  
  if (currentPlayer.devCards.length > 0) {
    choices.push('Play Development Card');
  }
  
  choices.push('View Game State');
  choices.push('End Turn');

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices,
    },
  ]);

  switch (action) {
    case 'Build Settlement':
      await handleBuildSettlement(game);
      break;
    case 'Build City':
      await handleBuildCity(game);
      break;
    case 'Build Road':
      await handleBuildRoad(game);
      break;
    case 'Buy Development Card': {
      const player = game.getCurrentPlayer();
      game.buyDevCard();
      const newCard = game.getCurrentPlayer().devCards[game.getCurrentPlayer().devCards.length - 1];
      console.log(chalk.green(`✅ ${player.name} bought a development card!`));
      if (newCard.type === 'victoryPoint') {
        console.log(chalk.yellow('  (It\'s a Victory Point card!)'));
      }
      await pause();
      break;
    }
    case 'Trade with Bank':
      await handleBankTrade(game);
      break;
    case 'Play Development Card':
      await handlePlayDevCard(game);
      break;
    case 'View Game State':
      console.log('\nCurrent State:', JSON.stringify(game.getState(), null, 2));
      await pause();
      break;
    case 'End Turn':
      game.endTurn();
      break;
  }
}

