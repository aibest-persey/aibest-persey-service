import eventBus from "../events/event-bus.js";
import NotificationJob from "../models/NotificationJob.model.js";
// Persists a notification job so it survives process restarts and can be retried.
// The processor (not yet implemented) picks up pending jobs and performs the actual send.
async function enqueue(type, payload) {
    try {
        await NotificationJob.create({ type, payload });
        console.log(`[NotificationQueue] Enqueued job: ${type}`);
    }
    catch (err) {
        // Log but never throw — a failed enqueue must not crash the request path
        console.error(`[NotificationQueue] Failed to enqueue job for "${type}":`, err);
    }
}
eventBus.subscribe("registration.confirmed", async ({ payload }) => {
    await enqueue("registration.confirmed", payload);
    // TODO: processor sends confirmation email to payload.studentEmail
});
eventBus.subscribe("registration.waitlisted", async ({ payload }) => {
    await enqueue("registration.waitlisted", payload);
    // TODO: processor sends waitlist email with payload.waitlistPosition
});
eventBus.subscribe("registration.promoted", async ({ payload }) => {
    await enqueue("registration.promoted", payload);
    // TODO: processor sends "you've been moved off the waitlist" email
});
eventBus.subscribe("registration.cancelled", async ({ payload }) => {
    await enqueue("registration.cancelled", payload);
    // TODO: processor sends cancellation confirmation email
});
eventBus.subscribe("event.cancelled", async ({ payload }) => {
    await enqueue("event.cancelled", payload);
    // TODO: processor queries registrations by payload.eventId and notifies all attendees
});
console.log("[NotificationWorker] Subscribed to registration events.");
//# sourceMappingURL=notification-worker.js.map