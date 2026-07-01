import type { DomainEventType, DomainEventPayloadMap } from "./event-types.js";
export interface DomainEvent<T extends DomainEventType> {
    type: T;
    payload: DomainEventPayloadMap[T];
    occurredAt: Date;
}
export interface IEventBus {
    publish<T extends DomainEventType>(type: T, payload: DomainEventPayloadMap[T]): void;
    subscribe<T extends DomainEventType>(type: T, handler: (event: DomainEvent<T>) => void | Promise<void>): void;
}
declare const eventBus: IEventBus;
export default eventBus;
//# sourceMappingURL=event-bus.d.ts.map