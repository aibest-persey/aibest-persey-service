import eventBus from "../events/event-bus.js";

// Each handler represents one notification job.
// Swap console.log for an email client, push service, or SMS gateway here.

eventBus.subscribe("registration.confirmed", async ({ payload, occurredAt }) => {
  console.log(
    `[Notification] registration.confirmed | ${occurredAt.toISOString()}`,
    `| student=${payload.studentEmail} event="${payload.eventTitle}"`
  );
  // TODO: send confirmation email to payload.studentEmail
});

eventBus.subscribe("registration.waitlisted", async ({ payload, occurredAt }) => {
  console.log(
    `[Notification] registration.waitlisted | ${occurredAt.toISOString()}`,
    `| student=${payload.studentEmail} event="${payload.eventTitle}" position=${payload.waitlistPosition}`
  );
  // TODO: send waitlist confirmation email with position info
});

eventBus.subscribe("registration.promoted", async ({ payload, occurredAt }) => {
  console.log(
    `[Notification] registration.promoted | ${occurredAt.toISOString()}`,
    `| student=${payload.studentEmail} event="${payload.eventTitle}"`
  );
  // TODO: send "you've been moved off the waitlist" email
});

eventBus.subscribe("registration.cancelled", async ({ payload, occurredAt }) => {
  console.log(
    `[Notification] registration.cancelled | ${occurredAt.toISOString()}`,
    `| studentId=${payload.studentId} event="${payload.eventTitle}"`
  );
  // TODO: send cancellation confirmation email
});

console.log("[NotificationWorker] Subscribed to registration events.");
