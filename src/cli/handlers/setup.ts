import inquirer from 'inquirer';
import { Game } from '../../engine/game';
import { formatVertexId, formatEdgeId, getVertexByDisplayId, getVertexDisplayInfo, getEdgeDisplayInfo } from '../../utils/display';
import { pause } from '../utils';

export async function handleSetupPhase(game: Game) {
  const state = game.getState();
  const currentPlayer = game.getCurrentPlayer();

  const isSettlementPhase = state.turn.setupPhase === 'firstSettlement' || 
                            state.turn.setupPhase === 'secondSettlement';

  if (isSettlementPhase) {
    console.log(
      `\n🏗️  ${currentPlayer.name}, place your SETTLEMENT (${state.turn.setupPhase})\n`
    );
    
    const availableVertices: Array<{ id: string; hex: string }> = [];
    state.board.vertices.forEach((vertex) => {
      if (!vertex.structure) {
        let tooClose = false;
        for (const adjId of vertex.adjacentVertices) {
          const adjVertex = state.board.vertices.get(adjId);
          if (adjVertex?.structure) {
            tooClose = true;
            break;
          }
        }
        if (!tooClose) {
          const hexId = vertex.adjacentTiles[0] || 'unknown';
          availableVertices.push({ id: vertex.id, hex: hexId });
        }
      }
    });

    console.log(`Available locations: ${availableVertices.length} vertices`);
    console.log('💡 Tip: Choose a vertex on a hex with a good number (6, 8, 5, 9 are best)\n');

    const choices = availableVertices.slice(0, 15).map((v) => {
      const vertex = state.board.vertices.get(v.id)!;
      return {
        name: getVertexDisplayInfo(vertex, state.board),
        value: v.id,
      };
    });

    choices.push({ name: 'More options...', value: 'more' });

    const { vertexId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'vertexId',
        message: 'Choose where to place your settlement:',
        choices,
        pageSize: 15,
      },
    ]);

    if (vertexId === 'more') {
      console.log('\nAll available vertices:');
      availableVertices.slice(0, 50).forEach((v) => {
        const vertex = state.board.vertices.get(v.id)!;
        console.log(`  ${getVertexDisplayInfo(vertex, state.board)}`);
      });
      
      console.log('\nEnter the vertex number (e.g., V12):');
      const { manualVertexId } = await inquirer.prompt([
        {
          type: 'input',
          name: 'manualVertexId',
          message: 'Vertex:',
        },
      ]);
      
      const vertex = getVertexByDisplayId(manualVertexId, state.board);
      if (vertex) {
        game.placeSettlement(vertex.id);
      } else {
        console.log('❌ Invalid vertex ID!');
        await pause();
        return;
      }
    } else {
      game.placeSettlement(vertexId);
    }
  } else {
    console.log(
      `\n🛤️  ${currentPlayer.name}, place your ROAD (${state.turn.setupPhase})\n`
    );

    const lastSettlement = currentPlayer.settlements[currentPlayer.settlements.length - 1];
    const vertex = state.board.vertices.get(lastSettlement);

    if (!vertex) {
      console.log('❌ Error finding your settlement!');
      await pause();
      return;
    }

    console.log(`Your settlement is at: ${formatVertexId(lastSettlement, state.board)}`);
    console.log('Available roads connecting to it:\n');

    const availableEdges = vertex.adjacentEdges
      .filter((edgeId) => {
        const edge = state.board.edges.get(edgeId);
        return edge && !edge.road;
      })
      .slice(0, 6);

    const choices = availableEdges.map((edgeId) => {
      const edge = state.board.edges.get(edgeId)!;
      return {
        name: getEdgeDisplayInfo(edge, state.board),
        value: edgeId,
      };
    });

    if (choices.length === 0) {
      console.log('❌ No available edges! This should not happen.');
      await pause();
      return;
    }

    const { edgeId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'edgeId',
        message: 'Choose where to place your road:',
        choices,
      },
    ]);

    game.placeRoad(edgeId);
  }
}

