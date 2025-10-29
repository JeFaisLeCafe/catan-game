import {
  Board,
  Vertex,
  Edge,
  HexCoordinate,
  Port,
} from '../core/types';
// Board generator utilities (not currently used but kept for future features)
// import { coordToId, idToCoord, getAdjacentHexes, isValidHex } from './board-generator';

/**
 * Build the complete adjacency graph for vertices and edges
 */
export function buildAdjacencyGraph(board: Board): Board {
  const vertices = new Map<string, Vertex>();
  const edges = new Map<string, Edge>();

  // First pass: Create all vertices
  board.tiles.forEach((tile) => {
    const hexVertices = getHexVertexCoordinates(tile.coordinate);
    hexVertices.forEach((vertexCoord) => {
      const vertexId = getCanonicalVertexId(vertexCoord);

      if (!vertices.has(vertexId)) {
        vertices.set(vertexId, {
          id: vertexId,
          adjacentTiles: [],
          adjacentVertices: [],
          adjacentEdges: [],
          structure: null,
          port: null,
        });
      }

      // Add this tile to the vertex's adjacent tiles
      const vertex = vertices.get(vertexId)!;
      if (!vertex.adjacentTiles.includes(tile.id)) {
        vertex.adjacentTiles.push(tile.id);
      }
    });
  });

  // Second pass: Create all edges and link vertices
  board.tiles.forEach((tile) => {
    const hexVertices = getHexVertexCoordinates(tile.coordinate);

    for (let i = 0; i < 6; i++) {
      const v1 = getCanonicalVertexId(hexVertices[i]);
      const v2 = getCanonicalVertexId(hexVertices[(i + 1) % 6]);
      const edgeId = getCanonicalEdgeId(v1, v2);

      if (!edges.has(edgeId)) {
        edges.set(edgeId, {
          id: edgeId,
          vertices: [v1, v2],
          adjacentTiles: [],
          adjacentEdges: [],
          road: null,
        });
      }

      // Add this tile to the edge's adjacent tiles
      const edge = edges.get(edgeId)!;
      if (!edge.adjacentTiles.includes(tile.id)) {
        edge.adjacentTiles.push(tile.id);
      }

      // Link vertices to this edge
      const vertex1 = vertices.get(v1)!;
      const vertex2 = vertices.get(v2)!;

      if (!vertex1.adjacentEdges.includes(edgeId)) {
        vertex1.adjacentEdges.push(edgeId);
      }
      if (!vertex2.adjacentEdges.includes(edgeId)) {
        vertex2.adjacentEdges.push(edgeId);
      }

      // Link vertices to each other
      if (!vertex1.adjacentVertices.includes(v2)) {
        vertex1.adjacentVertices.push(v2);
      }
      if (!vertex2.adjacentVertices.includes(v1)) {
        vertex2.adjacentVertices.push(v1);
      }
    }
  });

  // Third pass: Link edges to adjacent edges
  edges.forEach((edge) => {
    const [v1, v2] = edge.vertices;
    const vertex1 = vertices.get(v1)!;
    const vertex2 = vertices.get(v2)!;

    // Adjacent edges are those connected to either vertex
    const adjacentEdges = new Set<string>();

    vertex1.adjacentEdges.forEach((edgeId) => {
      if (edgeId !== edge.id) {
        adjacentEdges.add(edgeId);
      }
    });

    vertex2.adjacentEdges.forEach((edgeId) => {
      if (edgeId !== edge.id) {
        adjacentEdges.add(edgeId);
      }
    });

    edge.adjacentEdges = Array.from(adjacentEdges);
  });

  // Assign ports to vertices
  board.ports.forEach((portObj) => {
    portObj.vertices.forEach((vertexId) => {
      // Map old vertex ID format to canonical format if needed
      const vertex = findVertexForPort(vertices, portObj, vertexId);
      if (vertex) {
        vertex.port = portObj;
      }
    });
  });

  return {
    ...board,
    vertices,
    edges,
  };
}

/**
 * Get vertex coordinates for a hex in axial coordinate system
 * Returns 6 vertices in clockwise order starting from top
 */
function getHexVertexCoordinates(hex: HexCoordinate): VertexCoordinate[] {
  const { q, r } = hex;

  // Vertices in clockwise order starting from top
  const s = -q - r; // Cube coordinate
  return [
    { q, r, s, direction: 'N' },  // North (top)
    { q, r, s, direction: 'NE' }, // Northeast
    { q, r, s, direction: 'SE' }, // Southeast
    { q, r, s, direction: 'S' },  // South (bottom)
    { q, r, s, direction: 'SW' }, // Southwest
    { q, r, s, direction: 'NW' }, // Northwest
  ];
}

/**
 * Vertex coordinate with direction
 */
interface VertexCoordinate {
  q: number;
  r: number;
  s: number;
  direction: 'N' | 'NE' | 'SE' | 'S' | 'SW' | 'NW';
}

/**
 * Get canonical vertex ID from vertex coordinate
 * Multiple hexes share the same vertex, so we need a canonical representation
 */
function getCanonicalVertexId(vertex: VertexCoordinate): string {
  const { q, r, direction } = vertex;
  
  // Convert to pixel coordinates to get unique position
  // For pointy-top hexes: x = size * (√3 * q + √3/2 * r), y = size * (3/2 * r)
  // We'll use size = 1000 to avoid floating point issues
  const hexCenterX = 1732 * q + 866 * r;  // 1732 ≈ 1000√3, 866 ≈ 500√3
  const hexCenterY = 1500 * r;
  
  // Vertex offsets for pointy-top hex (angles: N=90°, NE=30°, SE=-30°, S=-90°, SW=-150°, NW=150°)
  // Vertex is at distance 1000 from center
  let vx = hexCenterX;
  let vy = hexCenterY;
  
  switch (direction) {
    case 'N':    // 90°
      vy -= 1000;
      break;
    case 'NE':   // 30°
      vx += 866;  // cos(30°) * 1000 ≈ 866
      vy -= 500;  // sin(30°) * 1000 = 500
      break;
    case 'SE':   // -30° (330°)
      vx += 866;
      vy += 500;
      break;
    case 'S':    // -90° (270°)
      vy += 1000;
      break;
    case 'SW':   // -150° (210°)
      vx -= 866;
      vy += 500;
      break;
    case 'NW':   // 150°
      vx -= 866;
      vy -= 500;
      break;
  }
  
  // Round to avoid floating point issues
  vx = Math.round(vx);
  vy = Math.round(vy);
  
  return `v_${vx}_${vy}`;
}

/**
 * Get canonical edge ID from two vertex IDs
 * Edges are bidirectional, so we need canonical ordering
 */
function getCanonicalEdgeId(v1: string, v2: string): string {
  // Sort alphabetically to ensure consistent ID regardless of order
  return v1 < v2 ? `e_${v1}_${v2}` : `e_${v2}_${v1}`;
}

/**
 * Find vertex for a port (helper for legacy port vertex IDs)
 */
function findVertexForPort(
  vertices: Map<string, Vertex>,
  _port: Port,
  legacyVertexId: string
): Vertex | null {
  // If legacy ID contains hex reference, try to map it
  // For now, try to find by matching ports on board edges
  // This is a simplified approach - in production you'd want more robust mapping

  // Extract hex coordinates and direction from legacy format
  const match = legacyVertexId.match(/(-?\d+)_(-?\d+)_v(\d+)/);
  if (match) {
    const [, q, r, dir] = match;
    const direction = parseInt(dir);

    // Map direction number to our direction system
    const directionMap = ['N', 'NE', 'SE', 'S', 'SW', 'NW'];
    const directionName = directionMap[direction];

    const canonicalId = `v_${q}_${r}_${directionName}`;
    return vertices.get(canonicalId) || null;
  }

  return null;
}

/**
 * Get all vertices for a given hex ID
 */
export function getVerticesForHex(board: Board, hexId: string): Vertex[] {
  const vertices: Vertex[] = [];

  board.vertices.forEach((vertex) => {
    if (vertex.adjacentTiles.includes(hexId)) {
      vertices.push(vertex);
    }
  });

  return vertices;
}

/**
 * Get all edges for a given hex ID
 */
export function getEdgesForHex(board: Board, hexId: string): Edge[] {
  const edges: Edge[] = [];

  board.edges.forEach((edge) => {
    if (edge.adjacentTiles.includes(hexId)) {
      edges.push(edge);
    }
  });

  return edges;
}

/**
 * Check if two vertices are adjacent
 */
export function areVerticesAdjacent(board: Board, v1Id: string, v2Id: string): boolean {
  const vertex = board.vertices.get(v1Id);
  return vertex ? vertex.adjacentVertices.includes(v2Id) : false;
}

/**
 * Check if two edges are adjacent
 */
export function areEdgesAdjacent(board: Board, e1Id: string, e2Id: string): boolean {
  const edge = board.edges.get(e1Id);
  return edge ? edge.adjacentEdges.includes(e2Id) : false;
}

/**
 * Get all vertices within distance N of a given vertex
 */
export function getVerticesWithinDistance(
  board: Board,
  startVertexId: string,
  distance: number
): Set<string> {
  const visited = new Set<string>();
  const queue: Array<{ id: string; dist: number }> = [{ id: startVertexId, dist: 0 }];

  while (queue.length > 0) {
    const { id, dist } = queue.shift()!;

    if (visited.has(id) || dist > distance) continue;
    visited.add(id);

    const vertex = board.vertices.get(id);
    if (vertex) {
      vertex.adjacentVertices.forEach((adjId) => {
        if (!visited.has(adjId)) {
          queue.push({ id: adjId, dist: dist + 1 });
        }
      });
    }
  }

  return visited;
}

/**
 * Find longest road for a player using DFS
 */
export function findLongestRoadForPlayer(board: Board, playerId: string): number {
  // Get all edges with this player's roads
  const playerRoads: string[] = [];
  board.edges.forEach((edge) => {
    if (edge.road?.playerId === playerId) {
      playerRoads.push(edge.id);
    }
  });

  if (playerRoads.length === 0) return 0;

  let maxLength = 0;

  // Try starting from each road segment
  playerRoads.forEach((startEdgeId) => {
    const length = dfsLongestPath(board, playerId, startEdgeId, new Set());
    maxLength = Math.max(maxLength, length);
  });

  return maxLength;
}

/**
 * DFS helper for finding longest road
 */
function dfsLongestPath(
  board: Board,
  playerId: string,
  currentEdgeId: string,
  visited: Set<string>
): number {
  visited.add(currentEdgeId);

  const edge = board.edges.get(currentEdgeId);
  if (!edge) return 1;

  let maxLength = 1;

  // Check both vertices of this edge
  edge.vertices.forEach((vertexId) => {
    const vertex = board.vertices.get(vertexId);
    if (!vertex) return;

    // If there's an opponent's settlement/city, we can't continue past it
    if (vertex.structure && vertex.structure.playerId !== playerId) {
      return;
    }

    // Explore adjacent edges
    vertex.adjacentEdges.forEach((adjEdgeId) => {
      if (visited.has(adjEdgeId)) return;

      const adjEdge = board.edges.get(adjEdgeId);
      if (adjEdge?.road?.playerId === playerId) {
        const length = 1 + dfsLongestPath(board, playerId, adjEdgeId, new Set(visited));
        maxLength = Math.max(maxLength, length);
      }
    });
  });

  return maxLength;
}

