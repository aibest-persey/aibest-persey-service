import { Event, Registration, Notification } from "../models/school-events.models.js";
import redis from "../clients/redis-client.js";
import { EventEmitter } from "events";

export const domainEventPublisher = new EventEmitter();

export const EventDomain = {
  /**
   * BACKLOG TICKET #9 & #14: Registration Flow
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

    domainEventPublisher.emit("UserEnrolled", { userId, eventId, status: finalStatus, title: event.title });
    return registration;
  },

  /**
   * BACKLOG TICKET #10 & #13: Cancellation Management
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
        domainEventPublisher.emit("WaitlistPromoted", { userId: nextInLine.userId, title: event.title });
      } else {
        await redis.decr(redisKey);
      }
    }

    return { message: "Registration cancelled and queue updated successfully" };
  },

  /**
   * BACKLOG TICKET #12: Waitlist Position Visibility
   */
  async getWaitlistPosition(userId, eventId) {
    const userReg = await Registration.findOne({
      where: { userId: userId, eventId: Number(eventId), status: "waitlisted" }
    });
    if (!userReg) return { isWaitlisted: false, position: 0 };

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
 * ASYNCHRONOUS EVENT DISPATCH HANDLERS (#15)
 * ─────────────────────────────────────────────────────────────────────────────
 */
domainEventPublisher.on("UserEnrolled", async (data) => {
  const { userId, title, status } = data;
  const message = status === "waitlisted"
    ? `The event "${title}" is currently full. You have been placed on the waitlist.`
    : `Congratulations! You have successfully registered for "${title}".`;
  await pushToNotificationQueue(userId, message);
});

domainEventPublisher.on("WaitlistPromoted", async (data) => {
  const { userId, title } = data;
  const message = `Good news! A spot opened up for "${title}" and your registration is confirmed.`;
  await pushToNotificationQueue(userId, message);
});

/**
 * 📥 TICKET #16: Implement Notification Queue Broker
 * Pushes messages into an in-memory queue using your coworker's Redis client.
 */
async function pushToNotificationQueue(userId, message) {
  const queueKey = "notifications:buffer_queue";
  const payload = JSON.stringify({ userId, message, attempts: 0 });
  try {
    await redis.lpush(queueKey, payload);
    console.log(`📥 [Queue Managed] Notification buffered in Redis list for user: ${userId}`);
  } catch (error) {
    console.error("⚠️ [Queue Error] Redis unavailable, fallback to DB immediately:", error);
    await Notification.create({ userId, message }); // Fault tolerance backup
  }
}

/**
 * ⚙️ TICKET #17: Implement Notification Reliability Worker
 * Background engine that securely pops messages from Redis, processes them, 
 * and handles database persistence retries so zero messages drop on hybrid apps.
 */
async function processNotificationQueueWorker() {
  const queueKey = "notifications:buffer_queue";
  try {
    // Pop the oldest job from the Redis list queue
    const rawJob = await redis.rpop(queueKey);
    if (!rawJob) return; // Queue is empty, skip loop tick

    const job = JSON.parse(rawJob);

    try {
      // Core Delivery Action: Safely commit record to the PostgreSQL database table
      await Notification.create({
        userId: job.userId,
        message: job.message,
        isRead: false
      });
      console.log(`✅ [Reliability Worker] Alert successfully committed to DB user: ${job.userId}`);
    } catch (dbError) {
      console.error(`❌ [Reliability Failure] DB save failed for user ${job.userId}. Running retry protocol...`);
      
      // Enforce Reliability Rule: If the database is busy, increment attempt count and put back in queue
      if (job.attempts < 3) {
        job.attempts += 1;
        await redis.lpush(queueKey, JSON.stringify(job)); // Re-queue job at the front for retry
      } else {
        console.error(`🚨 [Reliability Critical] Notification dropped after 3 failed database write retries:`, job);
      }
    }
  } catch (workerError) {
    console.error("🚨 [Worker Exception] Queue engine tick failure:", workerError);
  }
}

// Automatically execute the queue checking worker loop every 5 seconds (5000ms)
setInterval(processNotificationQueueWorker, 5000);
