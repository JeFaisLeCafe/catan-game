import chalk from 'chalk';
import { GameState, PlayerState, Tile, ResourceType } from '../core/types';
import { getCurrentPlayer } from '../core/state';
import { getVictoryPointBreakdown } from '../utils/victory';

/**
 * Display the game board in ASCII
 */
export function displayBoard(state: GameState): void {
  console.log(chalk.bold.cyan('\n╔═══════════════════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║                   CATAN BOARD                         ║'));
  console.log(chalk.bold.cyan('╚═══════════════════════════════════════════════════════╝\n'));

  // Group tiles by row
  const rows: Map<number, Tile[]> = new Map();
  state.board.tiles.forEach((tile) => {
    const r = tile.coordinate.r;
    if (!rows.has(r)) {
      rows.set(r, []);
    }
    rows.get(r)!.push(tile);
  });

  // Sort rows
  const sortedRows = Array.from(rows.entries()).sort((a, b) => a[0] - b[0]);

  sortedRows.forEach(([r, tiles]) => {
    // Sort tiles by q coordinate
    tiles.sort((a, b) => a.coordinate.q - b.coordinate.q);

    // Indent based on row
    const indent = ' '.repeat(Math.abs(r) * 3);

    // Display tiles - show ID on first line, resource+number on second
    const tileIds = tiles.map((tile) => {
      const id = chalk.dim(`(${tile.id})`.padEnd(10));
      return id;
    });
    
    const tileStrs = tiles.map((tile) => {
      const resource = getTileSymbol(tile.type);
      const number = tile.numberToken ? tile.numberToken.toString().padStart(2, ' ') : '  ';
      const robber = tile.hasRobber ? '🛡️ ' : '  ';

      const structures = getStructuresOnTile(state, tile.id);

      let color = chalk.white;
      if (tile.numberToken === 6 || tile.numberToken === 8) color = chalk.bold.red;
      else if (tile.numberToken === 5 || tile.numberToken === 9) color = chalk.bold.yellow;
      else if (tile.type === 'wood') color = chalk.green;
      else if (tile.type === 'brick') color = chalk.red;
      else if (tile.type === 'sheep') color = chalk.white;
      else if (tile.type === 'wheat') color = chalk.yellow;
      else if (tile.type === 'ore') color = chalk.gray;
      else if (tile.type === 'desert') color = chalk.bgYellow.black;

      return color(`[${resource}${number}${robber}${structures}]`.padEnd(12));
    });

    console.log(indent + tileIds.join(' '));
    console.log(indent + tileStrs.join(' '));
    console.log(); // Extra spacing between rows
  });

  console.log(chalk.dim('💡 Numbers in red (6,8) are best! Yellow (5,9) are also good.\n'));
}

/**
 * Get symbol for tile type
 */
function getTileSymbol(type: string): string {
  const symbols: Record<string, string> = {
    wood: '🌲',
    brick: '🧱',
    sheep: '🐑',
    wheat: '🌾',
    ore: '⛰️ ',
    desert: '🏜️ ',
  };
  return symbols[type] || '?';
}

function getStructuresOnTile(state: GameState, tileId: string): string {
  const structures: string[] = [];
  
  state.board.vertices.forEach((vertex) => {
    if (vertex.adjacentTiles.includes(tileId) && vertex.structure) {
      const playerColor = state.players.find(p => p.id === vertex.structure!.playerId)?.color || 'white';
      const symbol = vertex.structure.type === 'city' ? '🏛' : '🏠';
      const colorFn = getPlayerColor(playerColor);
      structures.push(colorFn(symbol));
    }
  });
  
  return structures.slice(0, 2).join('');
}

/**
 * Display player information
 */
export function displayPlayers(state: GameState): void {
  console.log(chalk.bold.cyan('\n╔═══════════════════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║                   PLAYERS                             ║'));
  console.log(chalk.bold.cyan('╚═══════════════════════════════════════════════════════╝\n'));

  const currentPlayer = getCurrentPlayer(state);

  state.players.forEach((player) => {
    const isCurrent = player.id === currentPlayer.id;
    const nameColor = getPlayerColor(player.color);
    const prefix = isCurrent ? '▶ ' : '  ';

    console.log(
      prefix +
        nameColor.bold(player.name) +
        ` - ${chalk.yellow(player.victoryPoints + ' VP')}`
    );

    // Resources
    const resourceStr = formatResources(player.resources);
    console.log(`    Resources: ${resourceStr}`);

    // Structures
    console.log(
      `    Structures: ${chalk.green(player.settlements.length + ' settlements')}, ` +
        `${chalk.blue(player.cities.length + ' cities')}, ` +
        `${chalk.gray(player.roads.length + ' roads')}`
    );

    // Dev cards
    console.log(`    Dev Cards: ${player.devCards.length} (Knights played: ${player.knightsPlayed})`);

    // Special achievements
    if (player.hasLongestRoad) {
      console.log(chalk.magenta('    🏆 Longest Road (+2 VP)'));
    }
    if (player.hasLargestArmy) {
      console.log(chalk.magenta('    ⚔️  Largest Army (+2 VP)'));
    }

    console.log();
  });
}

/**
 * Display current turn information
 */
export function displayTurnInfo(state: GameState): void {
  const currentPlayer = getCurrentPlayer(state);
  const nameColor = getPlayerColor(currentPlayer.color);

  console.log(chalk.bold.cyan('\n╔═══════════════════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║                   TURN INFO                           ║'));
  console.log(chalk.bold.cyan('╚═══════════════════════════════════════════════════════╝\n'));

  console.log(`Current Player: ${nameColor.bold(currentPlayer.name)}`);
  console.log(`Phase: ${chalk.yellow(state.turn.phase)}`);
  console.log(`Round: ${state.turn.round}`);

  if (state.turn.diceRoll) {
    console.log(
      `Last Roll: ${chalk.red('🎲 ' + state.turn.diceRoll[0])} ${chalk.red('🎲 ' + state.turn.diceRoll[1])} = ${chalk.bold(state.turn.diceRoll[0] + state.turn.diceRoll[1])}`
    );
  }

  if (state.turn.phase === 'setup') {
    console.log(`Setup Phase: ${state.turn.setupPhase} (Round ${state.turn.setupRound})`);
  }

  console.log();
}

/**
 * Format resources for display
 */
function formatResources(resources: Record<ResourceType, number>): string {
  const parts: string[] = [];

  if (resources.wood > 0) parts.push(chalk.green(`🌲 ${resources.wood}`));
  if (resources.brick > 0) parts.push(chalk.red(`🧱 ${resources.brick}`));
  if (resources.sheep > 0) parts.push(chalk.white(`🐑 ${resources.sheep}`));
  if (resources.wheat > 0) parts.push(chalk.yellow(`🌾 ${resources.wheat}`));
  if (resources.ore > 0) parts.push(chalk.gray(`⛰️  ${resources.ore}`));

  return parts.length > 0 ? parts.join(', ') : chalk.dim('none');
}

/**
 * Get chalk color for player
 */
function getPlayerColor(color: string) {
  switch (color) {
    case 'red':
      return chalk.red;
    case 'blue':
      return chalk.blue;
    case 'white':
      return chalk.white;
    case 'orange':
      return chalk.hex('#FFA500');
    default:
      return chalk.white;
  }
}

/**
 * Display victory point breakdown
 */
export function displayVictoryBreakdown(player: PlayerState, state: GameState): void {
  console.log(chalk.bold.yellow(`\n${player.name}'s Victory Points:`));

  const breakdown = getVictoryPointBreakdown(player, state);

  Object.entries(breakdown).forEach(([source, points]) => {
    if (points > 0) {
      console.log(`  ${source}: ${points}`);
    }
  });

  console.log(chalk.bold.yellow(`  Total: ${player.victoryPoints}`));
}

/**
 * Display available actions
 */
export function displayAvailableActions(actions: string[]): void {
  console.log(chalk.bold.green('\nAvailable Actions:'));
  actions.forEach((action, index) => {
    console.log(`  ${index + 1}. ${action}`);
  });
  console.log();
}

/**
 * Display game over screen
 */
export function displayGameOver(state: GameState): void {
  console.log(chalk.bold.green('\n\n╔═══════════════════════════════════════════════════════╗'));
  console.log(chalk.bold.green('║                   GAME OVER!                          ║'));
  console.log(chalk.bold.green('╚═══════════════════════════════════════════════════════╝\n'));

  const winner = state.players.find((p) => p.id === state.winner);

  if (winner) {
    const nameColor = getPlayerColor(winner.color);
    console.log(chalk.bold.yellow(`🎉 ${nameColor(winner.name)} WINS! 🎉`));
    console.log(chalk.yellow(`Final Score: ${winner.victoryPoints} Victory Points\n`));

    displayVictoryBreakdown(winner, state);
  }

  console.log(chalk.cyan('\nFinal Standings:'));
  const sortedPlayers = [...state.players].sort((a, b) => b.victoryPoints - a.victoryPoints);

  sortedPlayers.forEach((player, index) => {
    const nameColor = getPlayerColor(player.color);
    console.log(`  ${index + 1}. ${nameColor(player.name)}: ${player.victoryPoints} VP`);
  });

  console.log();
}

/**
 * Clear screen
 */
export function clearScreen(): void {
  console.clear();
}

/**
 * Display header
 */
export function displayHeader(): void {
  console.log(chalk.bold.cyan('\n╔═══════════════════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║           SETTLERS OF CATAN - Game Engine            ║'));
  console.log(chalk.bold.cyan('╚═══════════════════════════════════════════════════════╝\n'));
}

