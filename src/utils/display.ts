import { Board, Vertex, Edge } from '../core/types';

/**
 * Format a vertex ID for human-readable display
 * Converts pixel-based IDs like "v_-1732_-4000" to "V12" or similar
 */
export function formatVertexId(vertexId: string, board: Board): string {
  const vertices = Array.from(board.vertices.values());
  const index = vertices.findIndex(v => v.id === vertexId);
  return index >= 0 ? `V${index + 1}` : vertexId;
}

/**
 * Format an edge ID for human-readable display
 * Converts complex edge IDs to "E12" or similar
 */
export function formatEdgeId(edgeId: string, board: Board): string {
  const edges = Array.from(board.edges.values());
  const index = edges.findIndex(e => e.id === edgeId);
  return index >= 0 ? `E${index + 1}` : edgeId;
}

/**
 * Get vertex by display ID (e.g., "V12" -> actual vertex ID)
 */
export function getVertexByDisplayId(displayId: string, board: Board): Vertex | null {
  const match = displayId.match(/^V(\d+)$/i);
  if (!match) return null;
  
  const index = parseInt(match[1]) - 1;
  const vertices = Array.from(board.vertices.values());
  return vertices[index] || null;
}

/**
 * Get edge by display ID (e.g., "E12" -> actual edge ID)
 */
export function getEdgeByDisplayId(displayId: string, board: Board): Edge | null {
  const match = displayId.match(/^E(\d+)$/i);
  if (!match) return null;
  
  const index = parseInt(match[1]) - 1;
  const edges = Array.from(board.edges.values());
  return edges[index] || null;
}

/**
 * Create a mapping of vertex IDs to their adjacent tiles for display
 */
export function getVertexDisplayInfo(vertex: Vertex, board: Board): string {
  const tilesArray = Array.from(board.tiles.values());
  const tileIds = vertex.adjacentTiles.map(tileId => {
    const tile = tilesArray.find(t => t.id === tileId);
    return tile ? `${tile.id}` : tileId;
  }).join(', ');
  
  return `${formatVertexId(vertex.id, board)} (tiles: ${tileIds})`;
}

/**
 * Create a mapping of edge IDs to their adjacent tiles for display
 */
export function getEdgeDisplayInfo(edge: Edge, board: Board): string {
  const tilesArray = Array.from(board.tiles.values());
  const tileIds = edge.adjacentTiles.map(tileId => {
    const tile = tilesArray.find(t => t.id === tileId);
    return tile ? `${tile.id}` : tileId;
  }).join(', ');
  
  return `${formatEdgeId(edge.id, board)} (tiles: ${tileIds})`;
}

