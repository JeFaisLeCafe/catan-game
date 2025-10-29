import type { GameEvent, EventSubscriber } from '../core/events';

export class GameLogger {
  private events: GameEvent[] = [];
  private subscribers: EventSubscriber[] = [];
  private eventIdCounter = 0;

  log(event: Omit<GameEvent, 'id' | 'timestamp'>): GameEvent {
    const fullEvent = {
      ...event,
      id: `evt_${this.eventIdCounter++}`,
      timestamp: Date.now(),
    } as GameEvent;

    this.events.push(fullEvent);
    this.notifySubscribers(fullEvent);
    
    return fullEvent;
  }

  subscribe(callback: EventSubscriber): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  getEvents(): ReadonlyArray<GameEvent> {
    return [...this.events];
  }

  getEventsByType<T extends GameEvent['type']>(
    type: T
  ): ReadonlyArray<Extract<GameEvent, { type: T }>> {
    return this.events.filter(e => e.type === type) as Extract<GameEvent, { type: T }>[];
  }

  getEventsByPlayer(playerId: string): ReadonlyArray<GameEvent> {
    return this.events.filter(e => 'playerId' in e && e.playerId === playerId);
  }

  getEventsByTurn(turnNumber: number): ReadonlyArray<GameEvent> {
    return this.events.filter(e => e.turnNumber === turnNumber);
  }

  clear(): void {
    this.events = [];
    this.eventIdCounter = 0;
  }

  private notifySubscribers(event: GameEvent): void {
    for (const subscriber of this.subscribers) {
      try {
        subscriber(event);
      } catch (error) {
        console.error('Error in event subscriber:', error);
      }
    }
  }

  export(): string {
    return JSON.stringify({
      events: this.events,
      totalEvents: this.events.length,
      exportedAt: Date.now(),
    }, null, 2);
  }

  import(json: string): void {
    try {
      const data = JSON.parse(json);
      if (data.events && Array.isArray(data.events)) {
        this.events = data.events;
        this.eventIdCounter = this.events.length;
      }
    } catch (error) {
      throw new Error('Invalid event log format');
    }
  }
}

