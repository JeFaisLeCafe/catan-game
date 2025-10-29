import inquirer from 'inquirer';
import { Game } from '../../engine/game';
import { pause } from '../utils';

export async function handleBankTrade(game: Game) {
  console.log('\n💰 Bank Trade (4:1 default, or 3:1/2:1 with ports)\n');

  const { giveResource, giveAmount, getResource } = await inquirer.prompt([
    {
      type: 'list',
      name: 'giveResource',
      message: 'What resource do you want to give?',
      choices: ['wood', 'brick', 'sheep', 'wheat', 'ore'],
    },
    {
      type: 'number',
      name: 'giveAmount',
      message: 'How many?',
      default: 4,
    },
    {
      type: 'list',
      name: 'getResource',
      message: 'What resource do you want to receive?',
      choices: ['wood', 'brick', 'sheep', 'wheat', 'ore'],
    },
  ]);

  const give = { [giveResource]: giveAmount };
  const get = { [getResource]: 1 };

  game.tradeWithBank(give, get);
  console.log('✅ Trade completed!');
  await pause();
}

