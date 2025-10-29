import inquirer from 'inquirer';
import chalk from 'chalk';
import { Game } from '../../engine/game';
import { formatVertexId, formatEdgeId, getVertexDisplayInfo, getEdgeDisplayInfo } from '../../utils/display';
import { pause } from '../utils';

export async function handleBuildSettlement(game: Game) {
  const currentPlayer = game.getCurrentPlayer();
  const state = game.getState();
  
  const validVertices: string[] = [];
  state.board.vertices.forEach((vertex) => {
    const validation = game.canPerformAction('placeSettlement', vertex.id);
    if (validation.valid) {
      validVertices.push(vertex.id);
    }
  });
  
  if (validVertices.length === 0) {
    console.log(chalk.red('❌ No valid locations to place settlement!'));
    await pause();
    return;
  }
  
  console.log(`\n${validVertices.length} valid locations available.\n`);
  
  const choices = validVertices.slice(0, 15).map((id) => {
    const vertex = state.board.vertices.get(id)!;
    return {
      name: getVertexDisplayInfo(vertex, state.board),
      value: id
    };
  });
  
  choices.push({ name: 'Cancel', value: 'cancel' });
  
  const { vertexId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'vertexId',
      message: 'Choose where to place settlement:',
      choices,
      pageSize: 15,
    },
  ]);
  
  if (vertexId === 'cancel') return;

  game.placeSettlement(vertexId);
  console.log(chalk.green(`✅ ${currentPlayer.name} built a settlement at ${formatVertexId(vertexId, state.board)}!`));
  await pause();
}

export async function handleBuildCity(game: Game) {
  const currentPlayer = game.getCurrentPlayer();
  const state = game.getState();

  if (currentPlayer.settlements.length === 0) {
    console.log('❌ You have no settlements to upgrade!');
    await pause();
    return;
  }

  const choices = currentPlayer.settlements.map((vertexId) => {
    const vertex = state.board.vertices.get(vertexId)!;
    return {
      name: getVertexDisplayInfo(vertex, state.board),
      value: vertexId
    };
  });

  choices.push({ name: 'Cancel', value: 'cancel' });

  const { vertexId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'vertexId',
      message: 'Choose which settlement to upgrade to city:',
      choices,
    },
  ]);

  if (vertexId === 'cancel') return;

  game.placeCity(vertexId);
  console.log(chalk.green(`✅ ${currentPlayer.name} upgraded to a city at ${formatVertexId(vertexId, state.board)}!`));
  await pause();
}

export async function handleBuildRoad(game: Game) {
  const currentPlayer = game.getCurrentPlayer();
  const state = game.getState();
  
  const validEdges: string[] = [];
  state.board.edges.forEach((edge) => {
    const validation = game.canPerformAction('placeRoad', edge.id);
    if (validation.valid) {
      validEdges.push(edge.id);
    }
  });
  
  if (validEdges.length === 0) {
    console.log(chalk.red('❌ No valid locations to place road!'));
    await pause();
    return;
  }
  
  console.log(`\n${validEdges.length} valid locations available.\n`);
  
  const choices = validEdges.slice(0, 15).map((id) => {
    const edge = state.board.edges.get(id)!;
    return {
      name: getEdgeDisplayInfo(edge, state.board),
      value: id
    };
  });
  
  choices.push({ name: 'Cancel', value: 'cancel' });
  
  const { edgeId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'edgeId',
      message: 'Choose where to place road:',
      choices,
      pageSize: 15,
    },
  ]);
  
  if (edgeId === 'cancel') return;

  game.placeRoad(edgeId);
  console.log(chalk.green(`✅ ${currentPlayer.name} built a road at ${formatEdgeId(edgeId, state.board)}!`));
  await pause();
}

