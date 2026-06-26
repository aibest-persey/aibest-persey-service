import { EventEmitter } from "events";
import type { DomainEventType, DomainEventPayloadMap } from "./event-types.js";

export interface DomainEvent<T extends DomainEventType> {
  type: T;
  payload: DomainEventPayloadMap[T];
  occurredAt: Date;
}

// Swappable interface — replace InProcessEventBus with a Redis/SQS/BullMQ
// implementation without touching the rest of the codebase.
export interface IEventBus {
  publish<T extends DomainEventType>(type: T, payload: DomainEventPayloadMap[T]): void;
  subscribe<T extends DomainEventType>(
    type: T,
    handler: (event: DomainEvent<T>) => void | Promise<void>
  ): void;
}

class InProcessEventBus implements IEventBus {
  private emitter = new EventEmitter();

  publish<T extends DomainEventType>(type: T, payload: DomainEventPayloadMap[T]): void {
    const event: DomainEvent<T> = { type, payload, occurredAt: new Date() };
    // setImmediate defers handlers to the next iteration — keeps request path non-blocking
    setImmediate(() => this.emitter.emit(type, event));
  }

  subscribe<T extends DomainEventType>(
    type: T,
    handler: (event: DomainEvent<T>) => void | Promise<void>
  ): void {
    this.emitter.on(type, (event: DomainEvent<T>) => {
      Promise.resolve(handler(event)).catch((err) =>
        console.error(`[EventBus] Unhandled error in handler for "${type}":`, err)
      );
    });
  }
}

// Singleton — import this wherever you need to publish or subscribe
const eventBus: IEventBus = new InProcessEventBus();
export default eventBus;
