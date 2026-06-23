import { Event, Registration, Notification } from "../models/school-events.models.js";
import redis from "../clients/redis-client.js";

export const EventDomain = {
  /**
   * Business Rule: Register a student for a school event.
   * Leverages Upstash Redis configurations for safe capacity checks.
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

    if (finalStatus === "waitlisted") {
      await Notification.create({
        userId: userId,
        message: `The event "${event.title}" is currently full. You have been placed on the waitlist.`
      });
    }

    return registration;
  },

  /**
   * BACKLOG TICKET #4: Waitlist Management Logic
   * Business Rule: When a user cancels their spot, find the oldest person 
   * on the waitlist, upgrade them to 'registered', and update the Redis counters.
   */
  async cancelRegistration(userId, eventId) {
    // 1. Find the target registration
    const targetReg = await Registration.findOne({
      where: { userId: userId, eventId: Number(eventId) }
    });
    if (!targetReg) throw new Error("Registration records not found");
    
    const originalStatus = targetReg.status;

    // 2. Mark current slot as cancelled
    targetReg.status = "cancelled";
    await targetReg.save();

    const redisKey = `event:${eventId}:reg_count`;

    // 3. If a active 'registered' user just dropped out, manage the waitlist queue
    if (originalStatus === "registered") {
      // Find the next person in line (First In, First Out based on createdAt timestamp)
      const nextInLine = await Registration.findOne({
        where: { eventId: Number(eventId), status: "waitlisted" },
        order: [["createdAt", "ASC"]]
      });

      if (nextInLine) {
        // Upgrade waitlisted student to active attendee
        nextInLine.status = "registered";
        await nextInLine.save();

        // Create alert notification record
        const event = await Event.findByPk(Number(eventId));
        await Notification.create({
          userId: nextInLine.userId,
          message: `Good news! A spot opened up for "${event.title}" and your registration is confirmed.`
        });
      } else {
        // No waitlist queue exists? Simply decrement the live Redis seat tracker down by 1
        await redis.decr(redisKey);
      }
    }

    return { message: "Registration cancelled and queue updated successfully" };
  }
};
