import { EventEmitter } from "events";
class InProcessEventBus {
    emitter = new EventEmitter();
    publish(type, payload) {
        const event = { type, payload, occurredAt: new Date() };
        // setImmediate defers handlers to the next iteration — keeps request path non-blocking
        setImmediate(() => this.emitter.emit(type, event));
    }
    subscribe(type, handler) {
        this.emitter.on(type, (event) => {
            Promise.resolve(handler(event)).catch((err) => console.error(`[EventBus] Unhandled error in handler for "${type}":`, err));
        });
    }
}
// Singleton — import this wherever you need to publish or subscribe
const eventBus = new InProcessEventBus();
export default eventBus;
//# sourceMappingURL=event-bus.js.map