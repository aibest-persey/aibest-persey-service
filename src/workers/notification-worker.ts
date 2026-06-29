import eventBus from "../events/event-bus.js";
import NotificationJob from "../models/NotificationJob.model.js";
import type { DomainEventType, DomainEventPayloadMap } from "../events/event-types.js";

async function enqueue<T extends DomainEventType>(
  type: T,
  payload: DomainEventPayloadMap[T],
): Promise<void> {
  try {
    await NotificationJob.create({ type, payload });
    console.log(`[NotificationQueue] Enqueued outbox job: ${type}`);
  } catch (err) {
    console.error(`[NotificationQueue] Failed to enqueue outbox job for "${type}":`, err);
  }
}

eventBus.subscribe("registration.confirmed", async ({ payload }) => { await enqueue("registration.confirmed", payload); });
eventBus.subscribe("registration.waitlisted", async ({ payload }) => { await enqueue("registration.waitlisted", payload); });
eventBus.subscribe("registration.promoted", async ({ payload }) => { await enqueue("registration.promoted", payload); });
eventBus.subscribe("registration.cancelled", async ({ payload }) => { await enqueue("registration.cancelled", payload); });
eventBus.subscribe("event.cancelled", async ({ payload }) => { await enqueue("event.cancelled", payload); });

console.log("[NotificationWorker] Subscribed to application infrastructure event lines.");
