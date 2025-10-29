import { createActor } from 'xstate';
import { GameState, ResourceType, ValidationResult } from '../core/types';
import { createInitialState, getCurrentPlayer } from '../core/state';
import { generateBoard } from '../generators/board-generator';
import { buildAdjacencyGraph } from '../generators/adjacency';
import { createGameMachine, GameMachine } from './machine';
import { GameLogger } from './logger';
import type { GameEvent, EventSubscriber } from '../core/events';
import { calculateStatistics, type GameStatistics } from '../utils/statistics';
import * as Rules from './rules';

export class Game {
  private machine: GameMachine;
  private actor: ReturnType<typeof createActor<GameMachine>>;
  private _state: GameState;
  private logger: GameLogger;
  private seed?: number;

  constructor(playerNames: string[], seed?: number) {
    this.seed = seed;
    this.logger = new GameLogger();

    const state = createInitialState(playerNames, seed);

    const board = generateBoard(seed);
    const boardWithGraph = buildAdjacencyGraph(board);
    state.board = boardWithGraph;

    this._state = state;

    this.machine = createGameMachine(state);
    this.actor = createActor(this.machine);

    this.actor.subscribe((snapshot) => {
      this._state = snapshot.context.gameState;
    });

    this.actor.start();

    this.logger.log({
      type: 'gameStarted',
      turnNumber: 0,
      playerIds: this._state.players.map(p => p.id),
      seed,
    } as Omit<GameEvent, 'id' | 'timestamp'>);
  }

  getState(): Readonly<GameState> {
    return this._state;
  }

  getCurrentPlayer() {
    return getCurrentPlayer(this._state);
  }

  getCurrentPhase() {
    return this._state.turn.phase;
  }

  isGameOver(): boolean {
    return this._state.turn.phase === 'gameOver';
  }

  getWinner() {
    if (!this.isGameOver()) return null;
    return this._state.players.find((p) => p.id === this._state.winner);
  }

  getHistory(): ReadonlyArray<GameEvent> {
    return this.logger.getEvents();
  }

  getStatistics(): GameStatistics {
    return calculateStatistics(this.logger.getEvents());
  }

  subscribe(callback: EventSubscriber): () => void {
    return this.logger.subscribe(callback);
  }

  exportGame(): string {
    return JSON.stringify({
      seed: this.seed,
      events: this.logger.getEvents(),
      finalState: this._state,
    }, null, 2);
  }

  // ============================================================================
  // Actions
  // ============================================================================

  rollDice(): void {
    if (this._state.turn.hasRolled) {
      throw new Error('Dice already rolled this turn');
    }
    
    const playerId = this.getCurrentPlayer().id;
    this.actor.send({ type: 'ROLL_DICE' });
    
    const diceRoll = this._state.turn.diceRoll;
    if (diceRoll) {
      this.logger.log({
        type: 'diceRolled',
        turnNumber: this._state.turn.round,
        playerId,
        dice1: diceRoll[0],
        dice2: diceRoll[1],
        total: diceRoll[0] + diceRoll[1],
      } as Omit<GameEvent, 'id' | 'timestamp'>);
    }
  }

  placeSettlement(vertexId: string): void {
    const currentPlayer = this.getCurrentPlayer();
    const validation = Rules.canPlaceSettlement(this._state, currentPlayer.id, vertexId);

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const isSetup = this._state.turn.phase === 'setup';
    this.actor.send({ type: 'PLACE_SETTLEMENT', vertexId });
    
    this.logger.log({
      type: 'settlementBuilt',
      turnNumber: this._state.turn.round,
      playerId: currentPlayer.id,
      vertexId,
      isSetup,
    } as Omit<GameEvent, 'id' | 'timestamp'>);
  }

  placeCity(vertexId: string): void {
    const currentPlayer = this.getCurrentPlayer();
    const validation = Rules.canPlaceCity(this._state, currentPlayer.id, vertexId);

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    this.actor.send({ type: 'PLACE_CITY', vertexId });
    
    this.logger.log({
      type: 'cityBuilt',
      turnNumber: this._state.turn.round,
      playerId: currentPlayer.id,
      vertexId,
    } as Omit<GameEvent, 'id' | 'timestamp'>);
  }

  placeRoad(edgeId: string): void {
    const currentPlayer = this.getCurrentPlayer();
    const validation = Rules.canPlaceRoad(this._state, currentPlayer.id, edgeId);

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const isSetup = this._state.turn.phase === 'setup';
    this.actor.send({ type: 'PLACE_ROAD', edgeId });
    
    this.logger.log({
      type: 'roadBuilt',
      turnNumber: this._state.turn.round,
      playerId: currentPlayer.id,
      edgeId,
      isSetup,
    } as Omit<GameEvent, 'id' | 'timestamp'>);
  }

  buyDevCard(): void {
    const currentPlayer = this.getCurrentPlayer();
    const validation = Rules.canBuyDevCard(this._state, currentPlayer.id);

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const playerId = currentPlayer.id;
    this.actor.send({ type: 'BUY_DEV_CARD' });
    
    const updatedPlayer = this._state.players.find(p => p.id === playerId);
    if (updatedPlayer) {
      const newCard = updatedPlayer.devCards[updatedPlayer.devCards.length - 1];
      this.logger.log({
        type: 'devCardBought',
        turnNumber: this._state.turn.round,
        playerId,
        cardType: newCard.type,
      } as Omit<GameEvent, 'id' | 'timestamp'>);
    }
  }

  /**
   * Play a knight card
   */
  playKnight(hexId: string, targetPlayerId?: string): void {
    const currentPlayer = this.getCurrentPlayer();
    const validation = Rules.canPlayKnight(this._state, currentPlayer.id, hexId, targetPlayerId);

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    this.actor.send({ type: 'PLAY_KNIGHT', hexId, targetPlayerId });
  }

  /**
   * Play a road building card
   */
  playRoadBuilding(edge1Id: string, edge2Id?: string): void {
    const currentPlayer = this.getCurrentPlayer();
    const validation = Rules.canPlayDevCard(this._state, currentPlayer.id, 'roadBuilding');

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    this.actor.send({ type: 'PLAY_ROAD_BUILDING', edge1Id, edge2Id });
  }

  /**
   * Play a year of plenty card
   */
  playYearOfPlenty(resource1: ResourceType, resource2: ResourceType): void {
    const currentPlayer = this.getCurrentPlayer();
    const validation = Rules.canPlayDevCard(this._state, currentPlayer.id, 'yearOfPlenty');

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    this.actor.send({ type: 'PLAY_YEAR_OF_PLENTY', resource1, resource2 });
  }

  /**
   * Play a monopoly card
   */
  playMonopoly(resource: ResourceType): void {
    const currentPlayer = this.getCurrentPlayer();
    const validation = Rules.canPlayDevCard(this._state, currentPlayer.id, 'monopoly');

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    this.actor.send({ type: 'PLAY_MONOPOLY', resource });
  }

  /**
   * Discard resources (when 7 is rolled)
   */
  discardResources(playerId: string, resources: Partial<Record<ResourceType, number>>): void {
    const validation = Rules.canDiscardResources(this._state, playerId, resources);

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    this.actor.send({ type: 'DISCARD_RESOURCES', playerId, resources });
  }

  /**
   * Move the robber
   */
  moveRobber(hexId: string, targetPlayerId?: string): void {
    this.actor.send({ type: 'MOVE_ROBBER', hexId, targetPlayerId });
  }

  /**
   * Trade with the bank
   */
  tradeWithBank(give: Partial<Record<ResourceType, number>>, get: Partial<Record<ResourceType, number>>): void {
    const currentPlayer = this.getCurrentPlayer();
    const validation = Rules.canTradeWithBank(this._state, currentPlayer.id, give, get);

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    this.actor.send({ type: 'TRADE_WITH_BANK', give, get });
  }

  endTurn(): void {
    const currentPlayer = this.getCurrentPlayer();
    const validation = Rules.canEndTurn(this._state, currentPlayer.id);

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    this.logger.log({
      type: 'turnEnded',
      turnNumber: this._state.turn.round,
      playerId: currentPlayer.id,
    } as Omit<GameEvent, 'id' | 'timestamp'>);

    this.actor.send({ type: 'END_TURN' });
    
    const nextPlayer = this.getCurrentPlayer();
    this.logger.log({
      type: 'turnStarted',
      turnNumber: this._state.turn.round,
      playerId: nextPlayer.id,
    } as Omit<GameEvent, 'id' | 'timestamp'>);

    if (this.isGameOver()) {
      const winner = this.getWinner()!;
      this.logger.log({
        type: 'gameEnded',
        turnNumber: this._state.turn.round,
        winnerId: winner.id,
        finalScores: this._state.players.map(p => ({
          playerId: p.id,
          points: p.victoryPoints,
        })),
      } as Omit<GameEvent, 'id' | 'timestamp'>);
    }
  }

  // ============================================================================
  // Validation Queries
  // ============================================================================

  /**
   * Check if an action can be performed
   */
  canPerformAction(action: string, ...args: unknown[]): ValidationResult {
    const currentPlayer = this.getCurrentPlayer();

    switch (action) {
      case 'placeSettlement':
        return Rules.canPlaceSettlement(this._state, currentPlayer.id, args[0] as string);
      case 'placeCity':
        return Rules.canPlaceCity(this._state, currentPlayer.id, args[0] as string);
      case 'placeRoad':
        return Rules.canPlaceRoad(this._state, currentPlayer.id, args[0] as string);
      case 'buyDevCard':
        return Rules.canBuyDevCard(this._state, currentPlayer.id);
      case 'playKnight':
        return Rules.canPlayKnight(this._state, currentPlayer.id, args[0] as string, args[1] as string | undefined);
      case 'tradeWithBank':
        return Rules.canTradeWithBank(this._state, currentPlayer.id, args[0] as Partial<Record<ResourceType, number>>, args[1] as Partial<Record<ResourceType, number>>);
      case 'endTurn':
        return Rules.canEndTurn(this._state, currentPlayer.id);
      default:
        return { valid: false, error: 'Unknown action' };
    }
  }

  /**
   * Get all available actions for the current player
   */
  getAvailableActions(): string[] {
    const actions: string[] = [];
    const currentPlayer = this.getCurrentPlayer();
    const phase = this._state.turn.phase;

    if (phase === 'setup') {
      if (
        this._state.turn.setupPhase === 'firstSettlement' ||
        this._state.turn.setupPhase === 'secondSettlement'
      ) {
        actions.push('placeSettlement');
      } else {
        actions.push('placeRoad');
      }
      return actions;
    }

    if (phase === 'main') {
      if (!this._state.turn.hasRolled) {
        actions.push('rollDice');
      } else {
        actions.push('placeSettlement', 'placeCity', 'placeRoad', 'buyDevCard', 'endTurn');

        // Dev cards
        if (currentPlayer.devCards.length > 0) {
          actions.push('playDevCard');
        }

        actions.push('tradeWithBank');
      }
    }

    if (phase === 'robberDiscard') {
      if (this._state.turn.mustDiscardPlayers.includes(currentPlayer.id)) {
        actions.push('discardResources');
      }
    }

    if (phase === 'robberPlacement') {
      actions.push('moveRobber');
    }

    return actions;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Get a summary of the game state for display
   */
  getSummary(): string {
    const state = this._state;
    const currentPlayer = this.getCurrentPlayer();

    let summary = `\n=== CATAN GAME ===\n`;
    summary += `Phase: ${state.turn.phase}\n`;
    summary += `Round: ${state.turn.round}\n`;
    summary += `Current Player: ${currentPlayer.name} (${currentPlayer.color})\n\n`;

    summary += `Players:\n`;
    state.players.forEach((player) => {
      const resources = Object.entries(player.resources)
        .map(([res, count]) => `${res}: ${count}`)
        .join(', ');

      summary += `  ${player.name}: ${player.victoryPoints} VP | ${resources}\n`;
      summary += `    Settlements: ${player.settlements.length}, Cities: ${player.cities.length}, Roads: ${player.roads.length}\n`;
    });

    if (state.longestRoadPlayer) {
      const player = state.players.find((p) => p.id === state.longestRoadPlayer);
      summary += `\nLongest Road: ${player?.name}\n`;
    }

    if (state.largestArmyPlayer) {
      const player = state.players.find((p) => p.id === state.largestArmyPlayer);
      summary += `Largest Army: ${player?.name}\n`;
    }

    if (this.isGameOver()) {
      const winner = this.getWinner();
      summary += `\n🎉 GAME OVER! Winner: ${winner?.name} with ${winner?.victoryPoints} VP\n`;
    }

    return summary;
  }
}

