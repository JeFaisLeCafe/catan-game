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
  let state = game.getState();
  
  if (state.turn.phase === 'robberDiscard') {
    const playersToDiscard = [...game.getPlayersWhoMustDiscard()];
    
    for (const playerId of playersToDiscard) {
      state = game.getState();
      const player = state.players.find(p => p.id === playerId);
      if (!player) continue;
      
      const total = Object.values(player.resources).reduce((a, b) => a + b, 0);
      const toDiscard = Math.floor(total / 2);
      
      if (toDiscard > 0) {
        const resources: Record<string, number> = {};
        let remaining = toDiscard;
        
        for (const resourceType of ['wood', 'brick', 'sheep', 'wheat', 'ore'] as const) {
          const available = player.resources[resourceType];
          if (available > 0 && remaining > 0) {
            const amount = Math.min(available, remaining);
            resources[resourceType] = amount;
            remaining -= amount;
          }
        }
        
        if (Object.keys(resources).length > 0) {
          game.discardResources(playerId, resources);
        }
      }
    }
  }
  
  state = game.getState();
  if (state.turn.phase === 'robberPlacement') {
    const tiles = Array.from(state.board.tiles.values()).filter(t => !t.hasRobber);
    if (tiles.length > 0) {
      game.moveRobber(tiles[0].id);
    }
  }
}

