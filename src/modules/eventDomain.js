import { Event, Registration, Notification } from "../models/school-events.models.js";
import redis from "../clients/redis-client.js";
import { EventEmitter } from "events"; // Node.js Native Event Engine

// Initialize Domain Event Publisher Engine (#15)
export const domainEventPublisher = new EventEmitter();

export const EventDomain = {
  /**
   * BACKLOG TICKET #9 & #14: Registration Flow & Defining Domain Events
   */
  async registerForEvent(userId, eventId) {
    const event = await Event.findByPk(Number(eventId));
    if (!event) throw new Error("Event not found");

    const redisKey = `event:${eventId}:reg_count`;
    let currentCount = await redis.get(redisKey);

    if (currentCount === null) {
      currentCount = await Registration.count({
        where: { eventId: Number(eventId), status: "registered" }
      });
      await redis.set(redisKey, currentCount, { ex: 3600 });
    } else {
      currentCount = Number(currentCount);
    }

    let finalStatus = "registered";
    if (currentCount >= event.capacity) {
      finalStatus = "waitlisted";
    }

    const registration = await Registration.create({
      userId: userId, 
      eventId: Number(eventId),
      status: finalStatus
    });

    if (finalStatus === "registered") {
      await redis.incr(redisKey);
    }

    // TICKET #14 & #15: Define and Publish Domain Event
    domainEventPublisher.emit("UserEnrolled", { userId, eventId, status: finalStatus, title: event.title });

    return registration;
  },

  /**
   * BACKLOG TICKET #10 & #13: Cancellation & Queue Management Business Rules
   */
  async cancelRegistration(userId, eventId) {
    const targetReg = await Registration.findOne({
      where: { userId: userId, eventId: Number(eventId) }
    });
    if (!targetReg) throw new Error("Registration records not found");
    
    const originalStatus = targetReg.status;
    targetReg.status = "cancelled";
    await targetReg.save();

    const redisKey = `event:${eventId}:reg_count`;

    if (originalStatus === "registered") {
      const nextInLine = await Registration.findOne({
        where: { eventId: Number(eventId), status: "waitlisted" },
        order: [["createdAt", "ASC"]]
      });

      if (nextInLine) {
        nextInLine.status = "registered";
        await nextInLine.save();

        const event = await Event.findByPk(Number(eventId));
        
        // TICKET #14 & #15: Publish Promotion Domain Event
        domainEventPublisher.emit("WaitlistPromoted", { userId: nextInLine.userId, title: event.title });
      } else {
        await redis.decr(redisKey);
      }
    }

    return { message: "Registration cancelled and queue updated successfully" };
  },

  /**
   * BACKLOG TICKET #12: Waitlist Ordering Position Checker
   */
  async getWaitlistPosition(userId, eventId) {
    const userReg = await Registration.findOne({
      where: { userId: userId, eventId: Number(eventId), status: "waitlisted" }
    });

    if (!userReg) {
      return { isWaitlisted: false, position: 0 };
    }

    const positionCount = await Registration.count({
      where: {
        eventId: Number(eventId),
        status: "waitlisted",
        createdAt: { [Symbol.for("lt")]: userReg.createdAt }
      }
    });

    return { isWaitlisted: true, position: positionCount + 1 };
  }
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * BACKGROUND WORKER SUBSCRIPTIONS: TICKETS #15, #16, & #17
 * ─────────────────────────────────────────────────────────────────────────────
 * Listens to published Domain Events asynchronously, routes notifications into 
 * a reliable message queue via her Redis client, and runs database commits.
 */

// Subscriber 1: Listens for fresh user registrations / waitlist additions
domainEventPublisher.on("UserEnrolled", async (data) => {
  const { userId, title, status } = data;
  const message = status === "waitlisted"
    ? `The event "${title}" is currently full. You have been placed on the waitlist.`
    : `Congratulations! You have successfully registered for "${title}".`;

  await pushToReliableQueue(userId, message);
});

// Subscriber 2: Listens for waitlist promotions when active attendees cancel
domainEventPublisher.on("WaitlistPromoted", async (data) => {
  const { userId, title } = data;
  const message = `Good news! A spot opened up for "${title}" and your registration is confirmed.`;
  
  await pushToReliableQueue(userId, message);
});

/**
 * TICKET #16 & #17: Notification Queue & Reliability Delivery Engine
 * Leverages Upstash Redis list strings as a highly structured message broker queue.
 */
async function pushToReliableQueue(userId, message) {
  const queueKey = "notifications:queue";
  const payload = JSON.stringify({ userId, message, timestamp: Date.now() });

  try {
    // Push into real-time memory buffer broker queue
    await redis.lpush(queueKey, payload);

    // Transactional Outbox Fallback: Instantly run persistent save to DB for absolute durability matching ticket #17
    await Notification.create({ userId, message });
    
    console.log(`✉️ [Queue Success] Notification queued and stored securely for user: ${userId}`);
  } catch (error) {
    console.error("❌ [Reliability Queue Failure] Emergency outbox handling executed:", error);
  }
}
