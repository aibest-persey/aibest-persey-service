# API Reference

Base path: `/api`. All request/response bodies are JSON. Authenticated endpoints require `Authorization: Bearer <jwt>`.

Role legend: **Any** (no auth), **Auth** (any logged-in user), **Student**, **Organiser**, **Admin** — combined guards (e.g. Organiser/Admin) mean either role passes.

For full step-by-step request/response examples and failure-case tables on the event/registration/notification flows, see [`user-journeys.md`](./user-journeys.md). This document is the flat endpoint index across every route group.

---

## Auth — `src/routes/auth-routes.ts`

Rate-limited: 10 requests / 15 min / IP on all endpoints below (disabled when `NODE_ENV=test`).

| Method | Path | Role | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | Any | Creates a `student`. Note: `emailVerified` is currently set `true` immediately; no verification email is sent (see Architecture doc §3). |
| POST | `/api/auth/verify-email` | Any | Validates a SHA-256-hashed verification code. Functional, but unreachable from the current sign-up flow. |
| POST | `/api/auth/login` | Any | Returns a JWT (24h expiry) + public user object. |
| POST | `/api/auth/forgot-password` | Any | Always returns a generic success message (anti user-enumeration). |
| POST | `/api/auth/reset-password` | Any | Consumes a hashed reset token + expiry check. |
| GET | `/api/auth/me` | Auth | Returns the current user; response is Redis-cached (1h TTL). |

---

## Events — `src/routes/event-routes.ts`

| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/api/events` | Any | Role-scoped visibility (drafts only visible to their organiser; org-scoped events only to members). |
| GET | `/api/events/my-registrations` | Student/Admin | The caller's active registrations. |
| GET | `/api/events/:id` | Any | Includes `registrationCount`, `waitlistCount`, `isRegistered`, `isWaitlisted`, `waitlistPosition` for the caller. |
| POST | `/api/events` | Organiser | Creates a `draft` event. Requires `title` and `date`. |
| PUT | `/api/events/:id` | Organiser (owner) | Edits an event; owner-only, typically while still `draft`. |
| PATCH | `/api/events/:id/publish` | Organiser (owner) | `draft → published`. Rejects if `cancelled`. |
| PATCH | `/api/events/:id/unpublish` | Organiser (owner) | `published → draft`. |
| PATCH | `/api/events/:id/cancel` | Organiser (owner) | Terminal state; bulk-clears pending waitlist entries in the same transaction. |
| DELETE | `/api/events/:id` | Organiser (owner) | Hard delete. |
| POST | `/api/events/:id/register` | Student | Registers or waitlists depending on capacity (row-locked, see Architecture doc §4). |
| DELETE | `/api/events/:id/register` | Student | Cancels the caller's registration; auto-promotes the next waitlisted student if applicable. |
| GET | `/api/events/:id/ticket` | Student | Returns the QR ticket payload for a confirmed registration. |
| GET | `/api/events/:id/participants` | Organiser (owner) | Roster for the event. |

**Failure cases** (event routes): `401` no/invalid token · `403` wrong role or non-owner · `404` event not found / not visible · `400` validation (missing `title`/`date`, invalid date, publishing a cancelled event) · `409` already registered/waitlisted.

---

## Clubs — `src/routes/club-routes.ts`

| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/api/clubs` | Any | Directory; clubs may optionally belong to an organisation. |
| POST | `/api/clubs/:id/join` | Student | Self-service join (subject to organisation membership if the club belongs to one). |
| DELETE | `/api/clubs/:id/join` | Student | Leave a club. |

---

## Organisations — `src/routes/organisation-routes.ts`

| Method | Path | Role | Notes |
|---|---|---|---|
| POST | `/api/organisations` | Organiser | Creates an org with `status: 'pending'` until admin-verified. |
| GET | `/api/organisations` | Any | List/visibility scoped similarly to events. |
| GET | `/api/organisations/join-requests/my` | Student | The caller's own pending/reviewed join requests. |
| GET | `/api/organisations/:id` | Any | Org detail. |
| GET | `/api/organisations/:id/members` | Auth | Member roster. |
| POST | `/api/organisations/:id/members` | Owner/Manager | Add a member directly. |
| PATCH | `/api/organisations/:id/members/:memberId` | Owner/Manager | Change a member's role (owner/manager/member). |
| DELETE | `/api/organisations/:id/members/:memberId` | Owner/Manager | Remove a member. |
| POST | `/api/organisations/:id/join-requests` | Student | Request to join. |
| GET | `/api/organisations/:id/join-requests` | Owner/Manager | List pending requests. |
| PATCH | `/api/organisations/:id/join-requests/:reqId/approve` | Owner/Manager | Approves and creates the membership. |
| PATCH | `/api/organisations/:id/join-requests/:reqId/reject` | Owner/Manager | Rejects the request. |

---

## Organisers directory — `src/routes/organiser-routes.ts`

| Method | Path | Role | Notes |
|---|---|---|---|
| PUT | `/api/organisers/me` | Organiser | Update own organiser profile (bio, organization, website, logo). |
| GET | `/api/organisers` | Any | Public organiser directory. |
| GET | `/api/organisers/:id` | Any | Single organiser profile. |

---

## News — `src/routes/news-routes.ts`

| Method | Path | Role | Notes |
|---|---|---|---|
| POST | `/api/news` | Organiser/Admin | `scope` is one of `public`/`org`/`club`; org/club id required accordingly. |
| GET | `/api/news` | Any | Feed filtered by scope + caller's membership. |
| GET | `/api/news/:id` | Any | Single item. |
| PUT | `/api/news/:id` | Creator or org/club owner-manager | Edit. |
| DELETE | `/api/news/:id` | Creator or org/club owner-manager | Delete. |

---

## Messages / Inbox — `src/routes/message-routes.ts`

| Method | Path | Role | Notes |
|---|---|---|---|
| POST | `/api/messages` | Auth | Send a direct message (no threading). |
| GET | `/api/messages/inbox` | Auth | Received messages. |
| GET | `/api/messages/sent` | Auth | Sent messages. |
| PATCH | `/api/messages/:id/read` | Auth (recipient) | Marks a message read. |

---

## Role-change requests — `src/routes/rolechange-routes.ts`

Student → organiser promotion workflow.

| Method | Path | Role | Notes |
|---|---|---|---|
| POST | `/api/role-requests` | Student | Submit a request with a reason. |
| GET | `/api/role-requests/my` | Student | Caller's own requests. |
| GET | `/api/role-requests/pending` | Organiser/Admin | Queue of pending requests. |
| GET | `/api/role-requests` | Organiser/Admin | All requests. |
| PATCH | `/api/role-requests/:id/approve` | Organiser/Admin | Approves and promotes the student's role. |
| PATCH | `/api/role-requests/:id/reject` | Organiser/Admin | Rejects the request. |

---

## Admin — `src/routes/admin-routes.ts`

| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/api/admin/users` | Admin | List all users. |
| PATCH | `/api/admin/users/:id/role` | Admin | Change a user's role directly. |
| GET | `/api/admin/events` | Admin | List all events regardless of status. |
| PATCH | `/api/admin/events/:id/cancel` | Admin | Force-cancel any event. |
| DELETE | `/api/admin/events/:id` | Admin | Force-delete any event. |
| PATCH | `/api/admin/organisations/:id/verify` | Admin | Flips an organisation from `pending` to `verified`. |
| DELETE | `/api/admin/organisations/:id` | Admin | Delete an organisation. |

---

## Notifications

There is intentionally **no** `/api/notifications` endpoint. Notifications are an internal, durable job queue (`notification_jobs` table) written to by domain events and drained by a background worker — see [`ARCHITECTURE.md` §5](./ARCHITECTURE.md#5-background-processing-the-notification-pipeline). The client's `Notifications.jsx` page is currently a static placeholder, not backed by an API.
