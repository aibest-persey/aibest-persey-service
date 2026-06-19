import { Event, Registration, Notification } from "../models/school-events.models.js";
import redis from "../clients/redis-client.js";

export const EventDomain = {
  /**
   * Business Rule: Register a student for a school event.
   * Leverages her Upstash Redis configurations for safe capacity checks.
   */
  async registerForEvent(userId, eventId) {
    // 1. Find the target event
    const event = await Event.findByPk(Number(eventId));
    if (!event) throw new Error("Event not found");

    // 2. Check live registration counts in her Redis cache setup first
    const redisKey = `event:${eventId}:reg_count`;
    let currentCount = await redis.get(redisKey);

    if (currentCount === null) {
      // Cache Miss: Fall back to database query and populate Redis
      currentCount = await Registration.count({
        where: { eventId: Number(eventId), status: "registered" }
      });
      await redis.set(redisKey, currentCount, { ex: 3600 });
    } else {
      currentCount = Number(currentCount);
    }

    // 3. Evaluate capacity limits
    let finalStatus = "registered";
    if (currentCount >= event.capacity) {
      finalStatus = "waitlisted";
    }

    // 4. Save registration database logs using her user's exact UUID
    const registration = await Registration.create({
      userId: userId, 
      eventId: Number(eventId),
      status: finalStatus
    });

    // 5. If booking succeeded, increment the live Redis tracker
    if (finalStatus === "registered") {
      await redis.incr(redisKey);
    }

    // 6. If waitlisted, dispatch an automated notification alert
    if (finalStatus === "waitlisted") {
      await Notification.create({
        userId: userId,
        message: `The event "${event.title}" is currently full. You have been placed on the waitlist.`
      });
    }

    return registration;
  }
};
