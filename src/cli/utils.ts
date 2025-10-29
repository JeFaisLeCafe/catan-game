import inquirer from 'inquirer';
import chalk from 'chalk';
import { GameState, ResourceType } from '../core/types';

export async function pause() {
  await inquirer.prompt([
    {
      type: 'input',
      name: 'continue',
      message: 'Press Enter to continue...',
    },
  ]);
}

export function logResourceDistribution(oldState: GameState, newState: GameState, _diceRoll: number) {
  const changes: Array<{ player: string; resource: string; amount: number }> = [];
  
  oldState.players.forEach((oldPlayer, idx) => {
    const newPlayer = newState.players[idx];
    Object.keys(oldPlayer.resources).forEach((resource) => {
      const diff = newPlayer.resources[resource as ResourceType] - oldPlayer.resources[resource as ResourceType];
      if (diff > 0) {
        changes.push({ 
          player: newPlayer.name, 
          resource, 
          amount: diff 
        });
      }
    });
  });
  
  if (changes.length > 0) {
    console.log(chalk.cyan('📦 Resource Distribution:'));
    changes.forEach(({ player, resource, amount }) => {
      console.log(chalk.cyan(`   ${player} received ${amount} ${resource}`));
    });
    console.log();
  } else {
    console.log(chalk.dim('   No resources distributed.\n'));
  }
}

export function getPlayersOnHex(game: any, hexId: string): string[] {
  const state = game.getState();
  const playersOnHex: Set<string> = new Set();
  
  state.board.vertices.forEach((vertex: any) => {
    if (vertex.adjacentTiles.includes(hexId) && vertex.structure) {
      const player = state.players.find((p: any) => p.id === vertex.structure!.playerId);
      if (player && player.id !== game.getCurrentPlayer().id) {
        playersOnHex.add(player.name);
      }
    }
  });
  
  return Array.from(playersOnHex);
}

