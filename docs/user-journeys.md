# User Journeys

## Roles

| Role | Description |
|---|---|
| **Organiser** | Creates and manages events. Must be manually promoted in the database (`role = 'organiser'`). |
| **Student** | Browses and registers for events. Default role on sign-up. |

---

## 1. Event Creation Journey

**Actor:** Organiser  
**Goal:** Create a new event that students can register for.

### Steps

1. Organiser registers or logs in → receives a JWT token.
2. Organiser sends `POST /api/events` with the token in the `Authorization` header.
3. Server verifies the token (`verifyToken`) and confirms the role is `organiser` (`requireOrganiser`).
4. Server validates that `title` and `date` are present.
5. Server stores the event in the `events` table with `organiserId` set to the organiser's user ID.
6. Server responds `201` with the created event object.

### Request

```
POST /api/events
Authorization: Bearer <organiser_token>
Content-Type: application/json

{
  "title": "National Science Olympiad",
  "description": "Annual science competition for high-school students.",
  "location": "Sofia, Bulgaria",
  "date": "2026-10-15T09:00:00Z"
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
**Goal:** Make the event visible to students by publishing it.

> **Current status:** All created events are immediately visible to authenticated users. A `published` flag (draft → published workflow) is not yet implemented.

### Planned Steps (when implemented)

1. Organiser creates an event (see journey 1) — event is created in `draft` state.
2. Organiser sends `PATCH /api/events/:id/publish` with their token.
3. Server verifies token and organiser role, confirms the organiser owns the event.
4. Server sets `published = true` on the event record.
5. Server responds `200` with the updated event.
6. Event becomes visible in `GET /api/events` for students.

### Current Behaviour

`POST /api/events` creates and immediately publishes the event in one step. Students can list it via `GET /api/events` right away.

---

## 3. Registration Journey

**Actor:** Student  
**Goal:** Sign up for an event.

### Steps

1. Student registers or logs in → receives a JWT token.
2. Student browses events with `GET /api/events` to find one to join.
3. Student sends `POST /api/events/:id/register` with their token.
4. Server verifies the token (`verifyToken`) and confirms the role is `student` (`requireStudent`).
5. Server checks the event exists.
6. Server checks the student has not already registered for this event (unique constraint on `eventId + studentId`).
7. Server stores the registration in the `registrations` table.
8. Server responds `201` with the registration record.

### Request

```
POST /api/events/b3f1c2d4-.../register
Authorization: Bearer <student_token>
```

### Failure Cases

| Condition | Response |
|---|---|
| No token | `401 Access Denied` |
| Token belongs to an organiser | `403 Forbidden: student access only` |
| Event does not exist | `404 Event not found` |
| Already registered | `409 Already registered for this event` |

---

## 4. Cancellation Journey

**Actor:** Student (cancel own registration) or Organiser (cancel an event)  
**Goal:** Remove a registration or cancel an event entirely.

> **Current status:** Cancellation endpoints are not yet implemented.

### Planned Steps — Student Cancels Registration

1. Student sends `DELETE /api/events/:id/register` with their token.
2. Server verifies token and student role.
3. Server finds the registration record matching `eventId + studentId`.
4. Server deletes the registration.
5. Server responds `200 Registration cancelled`.

### Planned Steps — Organiser Cancels Event

1. Organiser sends `DELETE /api/events/:id` with their token.
2. Server verifies token and organiser role, confirms the organiser owns the event.
3. Server deletes all associated registrations (cascade or explicit delete).
4. Server deletes the event record.
5. Server responds `200 Event cancelled`.

### Failure Cases (when implemented)

| Condition | Response |
|---|---|
| No token | `401 Access Denied` |
| Wrong role | `403 Forbidden` |
| Registration / event not found | `404 Not found` |
| Organiser tries to cancel another organiser's event | `403 Forbidden` |
