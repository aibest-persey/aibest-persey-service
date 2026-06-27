import { Op } from "sequelize";
import sequelize from "../clients/postgres-client.js";
import NotificationJob from "../models/NotificationJob.model.js";
import type { DomainEventType } from "../events/event-types.js";

const MAX_ATTEMPTS = 5;
const BASE_BACKOFF_MS = 30_000;   // 30s → 60s → 120s → 240s → 480s
const STALE_AFTER_MS = 5 * 60_000; // jobs stuck in 'processing' for >5 min are considered crashed
const POLL_INTERVAL_MS = 5_000;

function backoffMs(attempts: number): number {
  return BASE_BACKOFF_MS * Math.pow(2, attempts - 1);
}

// ---------------------------------------------------------------------------
// Dispatch — one case per domain event type.
// Exhaustiveness is enforced by the `never` default so a new event type added
// to DomainEventType without a handler here causes a compile-time error.
// ---------------------------------------------------------------------------
async function dispatch(
  type: DomainEventType,
  payload: Record<string, unknown>,
): Promise<void> {
  switch (type) {
    case "registration.confirmed":
      console.log(`[Processor] Sending confirmation → ${payload.studentEmail} for "${payload.eventTitle}"`);
      // TODO: send confirmation email to payload.studentEmail
      break;

    case "registration.waitlisted":
      console.log(`[Processor] Sending waitlist notice → ${payload.studentEmail} (position ${payload.waitlistPosition})`);
      // TODO: send waitlist confirmation email with position number
      break;

    case "registration.promoted":
      console.log(`[Processor] Sending promotion notice → ${payload.studentEmail} for "${payload.eventTitle}"`);
      // TODO: send "you've been moved off the waitlist" email
      break;

    case "registration.cancelled":
      console.log(`[Processor] Sending cancellation notice → ${payload.studentEmail}`);
      // TODO: send cancellation confirmation email
      break;

    case "event.cancelled":
      console.log(`[Processor] Notifying attendees of cancelled event ${payload.eventId} ("${payload.eventTitle}")`);
      // TODO: query Registration WHERE eventId = payload.eventId AND status = 'registered',
      //       then send a cancellation notice to each attendee
      break;

    default: {
      // Compile-time exhaustiveness check — if a new DomainEventType is added
      // without a case here, TypeScript will error on this line
      const unhandled: never = type;
      throw new Error(`No handler for notification type: ${unhandled}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Stale job recovery
// Jobs stuck in 'processing' beyond STALE_AFTER_MS indicate a process crash
// mid-job. Reset them to 'pending' so they can be retried.
// ---------------------------------------------------------------------------
async function recoverStaleJobs(): Promise<void> {
  const threshold = new Date(Date.now() - STALE_AFTER_MS);
  const [count] = await NotificationJob.update(
    { status: "pending", processAfter: new Date() },
    { where: { status: "processing", updatedAt: { [Op.lt]: threshold } } },
  );
  if (count > 0) {
    console.warn(`[Processor] Recovered ${count} stale job(s) to pending`);
  }
}

// ---------------------------------------------------------------------------
// Claim — SELECT FOR UPDATE SKIP LOCKED
// Marking the job 'processing' inside the transaction means any concurrent
// processor sees the updated status as soon as the lock is released, and
// SKIP LOCKED ensures they never block waiting for the same row.
// ---------------------------------------------------------------------------
async function claimNextJob(): Promise<NotificationJob | null> {
  return sequelize.transaction(async (t) => {
    const job = await NotificationJob.findOne({
      where: {
        status: "pending",
        processAfter: { [Op.lte]: new Date() },
      },
      order: [["createdAt", "ASC"]],
      lock: t.LOCK.UPDATE,
      skipLocked: true,
      transaction: t,
    });

    if (!job) return null;

    job.status = "processing";
    await job.save({ transaction: t });
    return job;
  });
}

// ---------------------------------------------------------------------------
// Process one job — claim, dispatch, then persist the outcome.
// Returns true if a job was found (regardless of success/failure),
// false if the queue was empty.
// ---------------------------------------------------------------------------
async function processNextJob(): Promise<boolean> {
  const job = await claimNextJob();
  if (!job) return false;

  try {
    await dispatch(job.type, job.payload as Record<string, unknown>);
    job.status = "done";
    job.attempts += 1;
    await job.save();
    console.log(`[Processor] Job ${job.id} (${job.type}) completed`);
  } catch (err: any) {
    job.attempts += 1;
    job.lastError = err?.message ?? String(err);

    if (job.attempts >= MAX_ATTEMPTS) {
      // Permanently failed — leave for manual inspection / alerting
      job.status = "failed";
      console.error(
        `[Processor] Job ${job.id} (${job.type}) permanently failed after ${job.attempts} attempts:`,
        job.lastError,
      );
    } else {
      // Schedule retry with exponential backoff
      job.status = "pending";
      job.processAfter = new Date(Date.now() + backoffMs(job.attempts));
      console.warn(
        `[Processor] Job ${job.id} (${job.type}) failed ` +
        `(attempt ${job.attempts}/${MAX_ATTEMPTS}), ` +
        `retrying in ${backoffMs(job.attempts) / 1000}s`,
      );
    }

    await job.save();
  }

  return true;
}

// ---------------------------------------------------------------------------
// Polling loop — drains all available jobs each tick before sleeping.
// Call startProcessor() once at server startup.
// ---------------------------------------------------------------------------
export async function startProcessor(): Promise<void> {
  console.log(`[Processor] Started — polling every ${POLL_INTERVAL_MS / 1000}s`);

  const tick = async () => {
    try {
      await recoverStaleJobs();
      // Process all pending jobs before sleeping — avoids a 5s lag for bursts
      while (await processNextJob()) {
        // drain
      }
    } catch (err) {
      console.error("[Processor] Unexpected error during tick:", err);
    } finally {
      setTimeout(tick, POLL_INTERVAL_MS);
    }
  };

  setTimeout(tick, POLL_INTERVAL_MS);
}
