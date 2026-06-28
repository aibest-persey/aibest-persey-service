# User Journeys

## Roles

| Role | Description |
|---|---|
| **Organiser** | Creates and manages events. Must be manually promoted in the database (`role = 'organiser'`). |
| **Student** | Browses and registers for events. Default role on sign-up. |
| **Admin** | Platform-level access. Can list and manage all users. |

---

## 1. Event Creation Journey

**Actor:** Organiser  
**Goal:** Create a new draft event ready for review before publishing.

### Steps

1. Organiser logs in → receives JWT token.
2. Organiser sends `POST /api/events` with event details.
3. Server verifies token (`verifyToken`) and enforces organiser role (`requireOrganiser`).
4. Server validates `title` and `date` are present.
5. Server creates the event record with `status = 'draft'` and `organiserId` set to the caller.
6. Server responds `201` with the created event object.
7. The event is **not visible** to students until published.

### Request

```
POST /api/events
Authorization: Bearer <organiser_token>
Content-Type: application/json

{
  "title": "National Science Olympiad",
  "description": "Annual science competition for high-school students.",
  "location": "Sofia, Bulgaria",
  "date": "2026-10-15T09:00:00Z",
  "maxCapacity": 120
}
```

### Response `201`

```json
{
  "id": "b3f1c2d4-...",
  "title": "National Science Olympiad",
  "status": "draft",
  "organiserId": "a1b2c3d4-...",
  ...
}
```

### Failure Cases

| Condition | Response |
|---|---|
| No token | `401 Access Denied` |
| Token belongs to a student | `403 Forbidden: organiser access only` |
| Missing `title` or `date` | `400 title and date are required` |
| Invalid date format | `400 Invalid date format` |

---

## 2. Event Publication Journey

**Actor:** Organiser  
**Goal:** Make the event visible to students so they can register.

### Steps

1. Organiser creates an event (see journey 1) — event is in `draft` state.
2. Organiser reviews and optionally edits the event via `PUT /api/events/:id`.
3. Organiser sends `PATCH /api/events/:id/publish`.
4. Server verifies the organiser owns the event.
5. Server rejects the request if the event is already `cancelled` (no re-publishing cancelled events).
6. Server sets `status = 'published'`.
7. Server responds `200` with the updated event.
8. Students can now see the event in `GET /api/events` and register.

### State Machine

```
draft ──publish──▶ published ──unpublish──▶ draft
                       │
                    cancel
                       │
                       ▼
                   cancelled  (terminal — cannot be re-published)
```

### Endpoints

| Action | Method | Path |
|---|---|---|
| Publish | `PATCH` | `/api/events/:id/publish` |
| Unpublish (back to draft) | `PATCH` | `/api/events/:id/unpublish` |
| Cancel | `PATCH` | `/api/events/:id/cancel` |

### Failure Cases

| Condition | Response |
|---|---|
| Event not owned by caller | `403 Forbidden` |
| Attempting to publish a `cancelled` event | `400 Cannot publish a cancelled event` |
| Event not found | `404 Event not found` |

---

## 3. Registration Journey

**Actor:** Student  
**Goal:** Register for a published event, or join the waitlist when the event is full.

### Steps — Direct Registration (capacity available)

1. Student logs in → receives JWT token.
2. Student browses events via `GET /api/events` and views details via `GET /api/events/:id`.
3. Student sends `POST /api/events/:id/register`.
4. Server verifies token and enforces student role.
5. Server acquires a `SELECT FOR UPDATE` lock on the event row (prevents race conditions).
6. Server checks the student is not already registered or waitlisted.
7. Server counts current registered seats.
8. If `registeredCount < maxCapacity` (or no capacity limit): creates a `Registration` with `status = 'registered'`.
9. Server responds `201` with the registration record.
10. Domain event `registration.confirmed` is published → notification job enqueued.

### Steps — Waitlist Enrollment (event is full)

4–7. Same as above.
8. If `registeredCount >= maxCapacity`: creates a `Registration` with `status = 'waitlisted'` and assigns the next `waitlistPosition`.
9. Server responds `201` with `{ status: "waitlisted", waitlistPosition: N }`.
10. Domain event `registration.waitlisted` is published → notification job enqueued.

### Request

```
POST /api/events/b3f1c2d4-.../register
Authorization: Bearer <student_token>
```

### Response `201`

```json
{ "status": "registered", "eventId": "b3f1c2d4-...", "studentId": "...", ... }
```

or if waitlisted:

```json
{ "status": "waitlisted", "waitlistPosition": 3, "eventId": "...", ... }
```

### Event Detail Fields (GET /api/events/:id)

```json
{
  "registrationCount": 80,
  "waitlistCount": 5,
  "isRegistered": true,
  "isWaitlisted": false,
  "waitlistPosition": null
}
```

### Failure Cases

| Condition | Response |
|---|---|
| No token | `401 Access Denied` |
| Token belongs to an organiser | `403 Forbidden: student access only` |
| Event not found or not published | `404 Event not found` |
| Already registered or waitlisted | `409 Already registered for this event` |

---

## 4. Cancellation Journey

### 4a. Student Cancels Their Registration

**Actor:** Student  
**Goal:** Cancel a confirmed or waitlist registration.

#### Steps

1. Student sends `DELETE /api/events/:id/register` with their token.
2. Server verifies token and student role.
3. Server opens a database transaction and acquires `SELECT FOR UPDATE` on the event row.
4. Server finds the student's active registration (`registered` or `waitlisted`).
5. Server sets `registration.status = 'cancelled'`.
6. **If the cancelled registration was `registered`** and the event is published with a capacity limit:
   - Server finds the next waitlisted student (lowest `waitlistPosition`).
   - Server promotes them: `status = 'registered'`, `waitlistPosition = null`.
   - All in the same transaction — promotion is atomic with the cancellation.
7. Transaction commits. Server responds `200 Registration cancelled successfully`.
8. Post-commit, domain events are published:
   - `registration.cancelled` for the cancelling student.
   - `registration.promoted` for the promoted student (if any).
   - Both trigger notification jobs.

#### Failure Cases

| Condition | Response |
|---|---|
| No active registration found | `404 Registration not found` |
| Event not found | `404 Registration not found` |

---

### 4b. Organiser Cancels an Event

**Actor:** Organiser  
**Goal:** Cancel an entire event, removing it from student view and clearing all pending registrations.

#### Steps

1. Organiser sends `PATCH /api/events/:id/cancel` with their token.
2. Server verifies the organiser owns the event.
3. Server opens a database transaction:
   - Sets `event.status = 'cancelled'`.
   - Bulk-clears all `waitlisted` registrations for the event (`status = 'cancelled'`).
4. Transaction commits. Server responds `200 Event cancelled`.
5. Post-commit, domain event `event.cancelled` is published → notification jobs enqueued for affected students.

#### Failure Cases

| Condition | Response |
|---|---|
| Event not found | `404 Event not found` |
| Caller does not own the event | `403 Forbidden` |

---

## 5. Notification Journey

**Actor:** System (background worker)  
**Goal:** Deliver async notifications triggered by domain events.

### Domain Events and Their Triggers

| Domain Event | Trigger |
|---|---|
| `registration.confirmed` | Student successfully registered |
| `registration.waitlisted` | Student placed on waitlist |
| `registration.promoted` | Student promoted from waitlist after a cancellation |
| `registration.cancelled` | Student cancelled their registration |
| `event.cancelled` | Organiser cancelled the event |

### Flow

1. A controller action publishes a domain event via `eventBus.publish(type, payload)` (fire-and-forget, via `setImmediate`).
2. The notification worker subscribes to all five events and calls `enqueue(type, payload)`.
3. `enqueue` inserts a row into the `notification_jobs` table (`status = 'pending'`).
4. The notification processor polls every 5 seconds:
   - Claims one pending job using `SELECT FOR UPDATE SKIP LOCKED` (safe for multi-instance deployments).
   - Sets `status = 'processing'`.
   - Dispatches the job to the appropriate handler (email, push, etc.).
   - On success: sets `status = 'done'`.
   - On failure: increments `attempts`, sets `processAfter` with exponential backoff (`30s × 2^attempts`). After 5 attempts, sets `status = 'failed'`.
5. A stale-job recovery sweep runs on each processor tick: jobs stuck in `processing` for over 5 minutes are reset to `pending`.
