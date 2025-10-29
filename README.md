# Catan Game Engine

A complete TypeScript implementation of Settlers of Catan game logic for 3–4 players. This package provides a clean programmatic API for building Catan games, AI bots, or custom interfaces.

## Features

- ✅ **Complete Game Rules**: Full Catan implementation including setup, building, trading, robber, and development cards
- 🎲 **Deterministic Gameplay**: Seeded random number generation for reproducible games
- 📊 **Event Logging**: Comprehensive event system for AI training and game analysis
- 📈 **Statistics**: Built-in player statistics and game analytics
- 🔄 **Immutable State**: Clean functional approach with immutable game state
- 🎯 **Type-Safe**: Full TypeScript support with strict typing
- 🧪 **Well-Tested**: 52 passing tests with >90% coverage
- 🎮 **CLI Interface**: Interactive terminal game included

## Installation

```bash
npm install catan-game-engine
```

## Quick Start

```typescript
import { Game } from 'catan-game-engine';

// Create a new game
const game = new Game(['Alice', 'Bob', 'Charlie'], 12345);

// Subscribe to game events
const unsubscribe = game.subscribe(event => {
  console.log(`Event: ${event.type}`, event);
});

// Play the game
game.rollDice();
game.placeSettlement('v_0_0_N');
game.placeRoad('e_0_0_NE');
game.endTurn();

// Get game statistics
const stats = game.getStatistics();
console.log(stats.playerStats);
```

## Event System for AI

The engine includes a comprehensive event logging system perfect for AI training and decision-making:

```typescript
import { Game, GameEvent } from 'catan-game-engine';

const game = new Game(['AI Bot', 'Player 2', 'Player 3']);

// Real-time event subscription
game.subscribe((event: GameEvent) => {
  switch (event.type) {
    case 'diceRolled':
      console.log(`Rolled ${event.dice1} + ${event.dice2} = ${event.total}`);
      break;
    case 'resourcesGained':
      console.log(`${event.playerId} gained resources:`, event.resources);
      break;
    case 'settlementBuilt':
      console.log(`Settlement built at ${event.vertexId}`);
      break;
  }
});

// Get full game history
const history = game.getHistory();
console.log(`Total events: ${history.length}`);

// Export game for replay/analysis
const gameData = game.exportGame();
```

## Available Events

- `gameStarted` - Game initialization
- `turnStarted` / `turnEnded` - Turn boundaries
- `diceRolled` - Dice rolls with results
- `resourcesGained` / `resourcesLost` - Resource changes
- `settlementBuilt` / `cityBuilt` / `roadBuilt` - Building actions
- `devCardBought` / `devCardPlayed` - Development cards
- `robberMoved` / `playerStole` - Robber actions
- `tradeWithBank` / `tradeWithPlayer` - Trading
- `gameEnded` - Game over with winner

## Statistics & Analytics

```typescript
const stats = game.getStatistics();

console.log('Game Duration:', formatDuration(stats.gameDuration));
console.log('Winner:', stats.winner);
console.log('Total Turns:', stats.totalTurns);

// Per-player statistics
for (const player of Object.values(stats.playerStats)) {
  console.log(`${player.playerId}:
    VP: ${player.finalVictoryPoints}
    Buildings: ${player.settlementsBuilt} settlements, ${player.citiesBuilt} cities
    Resources: ${player.totalResourcesGained} gained, ${player.totalResourcesLost} lost
    Avg Dice Roll: ${player.averageDiceRoll.toFixed(2)}
    Dev Cards: ${player.devCardsBought} bought, ${player.devCardsPlayed} played
  `);
}

// Get player ranking
const ranking = getPlayerRanking(stats);
```

## Game State Access

```typescript
// Read-only game state
const state = game.getState();
console.log(state.turn.round);
console.log(state.players[0].resources);
console.log(state.board.tiles);

// Check available actions
const canBuild = game.canPerformAction('placeSettlement', 'v_0_0_N');
console.log(canBuild.valid); // true/false
console.log(canBuild.error); // Error message if invalid
```

## CLI Interface

Play Catan in your terminal:

```bash
npm run cli
```

Features:
- Interactive setup phase
- Smart action menus (only show valid options)
- Visual board representation
- Detailed event logging
- Resource distribution tracking

## API Reference

### Game Class

#### Constructor
```typescript
new Game(playerNames: string[], seed?: number)
```

#### State Queries
- `getState(): GameState` - Get current game state
- `getCurrentPlayer(): PlayerState` - Get active player
- `getCurrentPhase(): GamePhase` - Get current phase
- `isGameOver(): boolean` - Check if game ended
- `getWinner(): PlayerState | null` - Get winner if game over

#### Actions
- `rollDice(): void`
- `placeSettlement(vertexId: string): void`
- `placeCity(vertexId: string): void`
- `placeRoad(edgeId: string): void`
- `buyDevCard(): void`
- `playKnight(hexId: string, targetPlayerId?: string): void`
- `playRoadBuilding(edge1Id: string, edge2Id?: string): void`
- `playYearOfPlenty(resource1: ResourceType, resource2: ResourceType): void`
- `playMonopoly(resource: ResourceType): void`
- `discardResources(playerId: string, resources: Partial<ResourceCount>): void`
- `moveRobber(hexId: string, targetPlayerId?: string): void`
- `tradeWithBank(give: Partial<ResourceCount>, get: Partial<ResourceCount>): void`
- `endTurn(): void`

#### Validation
- `canPerformAction(action: string, ...args: unknown[]): ValidationResult`

#### Event System
- `subscribe(callback: EventSubscriber): () => void` - Subscribe to events, returns unsubscribe function
- `getHistory(): ReadonlyArray<GameEvent>` - Get all events
- `getStatistics(): GameStatistics` - Get aggregated statistics
- `exportGame(): string` - Export game as JSON

## Architecture

- **Core Layer**: Game types, state, and player management
- **Engine Layer**: State machine, game logic, rules validation
- **Generators**: Board and adjacency graph generation
- **Utils**: Random number generation, statistics, display helpers

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build package
npm run build

# Run CLI
npm run cli

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Testing

52 comprehensive tests covering:
- Core game mechanics
- Board generation
- Rules validation
- Full game simulation
- Event logging
- Statistics calculation

```bash
npm test -- --run
```

## License

MIT

## Perfect for AI Development

This engine is designed for building AI bots:

1. **Deterministic**: Use seeds for reproducible games
2. **Observable**: Event stream provides full game visibility
3. **Queryable**: Rich state inspection and validation methods
4. **Analyzable**: Built-in statistics for performance tracking
5. **Exportable**: JSON export for training data
