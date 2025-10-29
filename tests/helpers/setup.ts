import { Game } from '../../src/engine/game';

export function completeSetup(game: Game): void {
  const numPlayers = game.getState().players.length;
  
  for (let round = 0; round < 2; round++) {
    const order = round === 0 
      ? Array.from({ length: numPlayers }, (_, i) => i)
      : Array.from({ length: numPlayers }, (_, i) => numPlayers - 1 - i);
    
    for (let i = 0; i < order.length; i++) {
      const vertices = Array.from(game.getState().board.vertices.entries());
      const validVertex = vertices.find(([_, v]) => 
        !v.structure && v.adjacentVertices.every(adj => 
          !game.getState().board.vertices.get(adj)?.structure
        )
      );
      
      if (!validVertex) throw new Error('No valid vertex for setup');
      
      game.placeSettlement(validVertex[0]);
      
      const edges = validVertex[1].adjacentEdges.filter(e => 
        !game.getState().board.edges.get(e)?.road
      );
      
      game.placeRoad(edges[0]);
    }
  }
}

export function handleRobber(game: Game): void {
  const state = game.getState();
  
  if (state.turn.phase === 'robberDiscard') {
    state.turn.mustDiscardPlayers.forEach(playerId => {
      const player = state.players.find(p => p.id === playerId);
      if (!player) return;
      
      const total = Object.values(player.resources).reduce((a, b) => a + b, 0);
      const toDiscard = Math.floor(total / 2);
      
      if (toDiscard > 0 && player.resources.wood >= toDiscard) {
        game.discardResources(playerId, { wood: toDiscard });
      }
    });
  }
  
  if (game.getState().turn.phase === 'robberPlacement') {
    const tiles = Array.from(game.getState().board.tiles.values()).filter(t => !t.hasRobber);
    if (tiles.length > 0) {
      game.moveRobber(tiles[0].id);
    }
  }
}

