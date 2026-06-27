import eventBus from "../events/event-bus.js";

// Each handler represents one notification responsibility.
// Swap console.log for an email client, push service, or SMS gateway here.

eventBus.subscribe("registration.confirmed", async ({ payload, occurredAt }) => {
  console.log(
    `[Notification] registration.confirmed | ${occurredAt.toISOString()}`,
    `| student=${payload.studentEmail} event="${payload.eventTitle}"`,
  );
  // TODO: send confirmation email to payload.studentEmail
});

eventBus.subscribe("registration.waitlisted", async ({ payload, occurredAt }) => {
  console.log(
    `[Notification] registration.waitlisted | ${occurredAt.toISOString()}`,
    `| student=${payload.studentEmail} event="${payload.eventTitle}" position=${payload.waitlistPosition}`,
  );
  // TODO: send waitlist confirmation email with position info
});

eventBus.subscribe("registration.promoted", async ({ payload, occurredAt }) => {
  console.log(
    `[Notification] registration.promoted | ${occurredAt.toISOString()}`,
    `| student=${payload.studentEmail} event="${payload.eventTitle}"`,
  );
  // TODO: send "you've been moved off the waitlist" email
});

eventBus.subscribe("registration.cancelled", async ({ payload, occurredAt }) => {
  console.log(
    `[Notification] registration.cancelled | ${occurredAt.toISOString()}`,
    `| student=${payload.studentEmail} event="${payload.eventTitle}"`,
  );
  // TODO: send cancellation confirmation email to payload.studentEmail
});

// Fired when an organiser cancels an event.
// The consumer is responsible for querying registrations by eventId to find affected attendees.
eventBus.subscribe("event.cancelled", async ({ payload, occurredAt }) => {
  console.log(
    `[Notification] event.cancelled | ${occurredAt.toISOString()}`,
    `| event="${payload.eventTitle}" (${payload.eventId})`,
  );
  // TODO: query Registration where eventId = payload.eventId and status = 'registered',
  //       then send cancellation notice to each attendee's email
});

console.log("[NotificationWorker] Subscribed to registration events.");
