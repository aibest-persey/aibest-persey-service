import { Event, Registration, Notification } from "../models/school-events.models.js";
import redis from "../clients/redis-client.js";

export const EventDomain = {
  /**
   * BACKLOG TICKET #9: Event Registration Endpoint Flow
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
   * BACKLOG TICKET #10 & #13: Registration Cancellation, Promotion, and Consistency Business Rules
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
      // First In, First Out logic to find the next student in line
      const nextInLine = await Registration.findOne({
        where: { eventId: Number(eventId), status: "waitlisted" },
        order: [["createdAt", "ASC"]]
      });

      if (nextInLine) {
        nextInLine.status = "registered";
        await nextInLine.save();

        const event = await Event.findByPk(Number(eventId));
        await Notification.create({
          userId: nextInLine.userId,
          message: `Good news! A spot opened up for "${event.title}" and your registration is confirmed.`
        });
      } else {
        await redis.decr(redisKey);
      }
    }

    return { message: "Registration cancelled and queue updated successfully" };
  },

  /**
   * BACKLOG TICKET #12: Waitlist Ordering and Visibility
   * Calculates the exact line position of a student on a waitlist.
   */
  async getWaitlistPosition(userId, eventId) {
    // 1. Verify the student is actually waitlisted
    const userReg = await Registration.findOne({
      where: { userId: userId, eventId: Number(eventId), status: "waitlisted" }
    });

    if (!userReg) {
      return { isWaitlisted: false, position: 0 };
    }

    // 2. Count how many people joined the waitlist BEFORE this student
    const positionCount = await Registration.count({
      where: {
        eventId: Number(eventId),
        status: "waitlisted",
        createdAt: {
          [Symbol.for("lt")]: userReg.createdAt // Pull entries older than current record
        }
      }
    });

    // Position is the count of people ahead of them + 1
    return {
      isWaitlisted: true,
      position: positionCount + 1
    };
  }
};
