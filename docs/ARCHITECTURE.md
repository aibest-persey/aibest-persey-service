# Architecture

Bellboard (project codename **aibest-persey**) is a two-repository system:

| Repo | Role | Stack |
|---|---|---|
| `aibest-persey-client` | Single-page frontend | React 19, Vite, React Router 7, Context API |
| `aibest-persey-service` | REST API + background worker | Node.js, TypeScript, Express 5, Sequelize/PostgreSQL, Upstash Redis |

This document describes how the pieces fit together, the request lifecycle, and the design decisions worth understanding before extending the system. It intentionally distinguishes **what is implemented** from **what is scaffolded but not wired up**, so nothing here overstates the current state.

---

## 1. High-level topology

```
                         ┌─────────────────────────┐
   Browser  ───HTTP───▶  │   Express API (TS)       │
  (React SPA)            │   src/routes → controllers│
                         └─────────────┬─────────────┘
                                       │
                 ┌─────────────────────┼───────────────────────┐
                 ▼                     ▼                       ▼
         ┌───────────────┐   ┌──────────────────┐   ┌───────────────────────┐
         │  PostgreSQL    │   │  Upstash Redis    │   │  In-process EventBus   │
         │  (Sequelize)   │   │  (profile cache)  │   │  → notification_jobs   │
         │  system of     │   │  1h TTL, read-    │   │  table → processor     │
         │  record        │   │  through only     │   │  (poll every 5s)       │
         └───────────────┘   └──────────────────┘   └───────────────────────┘
```

**Development**: the client runs on Vite's dev server and proxies `/api/*` requests to the Express server (`aibest-persey-client/vite.config.js`) running on a separate port — two processes, two origins.

**Production**: a single Express process serves both the JSON API (`/api/*`) and the built client as static files via a catch-all route (`server.ts`). The two repos are expected to be deployed together, with the client's production build placed under the service's directory tree — not served from separate origins.

---

## 2. Request lifecycle

1. Client calls an endpoint under `/api/*`, attaching `Authorization: Bearer <jwt>` when authenticated (token read from `localStorage`/`sessionStorage`, see `aibest-persey-client/src/utils/tokenStorage.js`).
2. Express routes (`src/routes/*.ts`) chain middleware: `verifyToken` (JWT verification) and a role guard (`requireStudent` / `requireOrganiser` / `requireAdmin` / combinations) before reaching the controller.
3. Controllers (`src/controllers/*.ts`) validate input, run one or more Sequelize queries/transactions, and respond.
4. For actions with side effects beyond the primary write (registration, cancellation, event cancellation), the controller publishes a **domain event** on the in-process event bus *after* the HTTP response is sent — notification latency never blocks the client.
5. The notification worker/processor pipeline (see §5) picks up the event asynchronously.

---

## 3. Authentication & authorization

- **Password auth only.** Registration and login use `bcrypt` (cost factor 10) against `users.password`. There is no session store — auth state is a signed JWT (`jsonwebtoken`, `{ id, username, role }`, 24h expiry) verified per-request by `verifyToken` middleware.
- **Roles**: `student` (default at sign-up), `organiser` (granted by an admin, or via an approved role-change request), `admin` (a Postgres ENUM value added at server boot through a raw `ALTER TYPE ... ADD VALUE` guard in `server.ts`, since Sequelize's `sync({ alter: true })` cannot append enum values itself).
- **Authorization** is enforced with small composable guards in `src/middleware/auth-middleware.ts` (`requireStudent`, `requireOrganiser`, `requireAdmin`, `requireOrganiserOrAdmin`, `requireStudentOrAdmin`), chained per-route.
- **Rate limiting**: `express-rate-limit` caps `/api/auth/*` mutation endpoints at 10 requests / 15 minutes per IP (disabled when `NODE_ENV=test`).
- **Password reset**: `forgot-password` always returns a generic success message regardless of whether the email exists (anti-enumeration). Reset tokens are `crypto.randomBytes(32)`, stored only as a SHA-256 hash with a 1-hour expiry, and emailed via `nodemailer` to a `FRONTEND_URL`-based reset link.
- **Client-side JWT decoding**: the frontend base64url-decodes the JWT locally to read the `role` claim for UI gating (`AuthContext.jsx`). This is a UX convenience only — it does **not** verify the signature, and every protected write is still authorized server-side.

### Known gaps (by design, not yet built)

These exist as UI/scaffolding but are not functionally wired up. Flagged here for transparency rather than discovered by a reviewer:

| Feature | State |
|---|---|
| Google / OAuth sign-in | UI button exists (`OAuthButtons.jsx`); clicking it shows a "coming soon" toast. No OAuth route, strategy, or dependency exists server-side. |
| Email verification | `register()` sets `emailVerified: true` unconditionally; the verification email is never sent, though the `/api/auth/verify-email` endpoint and its validation logic exist and work if driven manually. |
| Notification delivery | See §5 — the queue and retry logic are fully real, but every handler is a stub with no actual email/push send. |

---

## 4. Data layer

PostgreSQL via Sequelize, all primary keys UUIDv4, all models timestamped. Full field-level reference: [`DATA-MODEL.md`](./DATA-MODEL.md).

Notable patterns:

- **Row-level locking for capacity-safe registration.** Registering for an event acquires `SELECT ... FOR UPDATE` on the event row before counting seats, so two concurrent registrations can't both slip past a full capacity check.
- **Atomic waitlist promotion.** When a registered student cancels, the promotion of the next waitlisted student (lowest `waitlistPosition`) happens in the *same transaction* as the cancellation — either both succeed or neither does.
- **Two-tier visibility.** Events and organisations have a status/visibility model (`draft`/`published`/`cancelled`, `pending`/`verified`) plus organisation-scoped visibility; `listEvents`/`getEvent` apply an additional application-level filter pass after the SQL query to enforce "hidden unless you're a member."

Full request/response flows for the event lifecycle, registration, cancellation, and notifications are documented separately in [`user-journeys.md`](./user-journeys.md).

---

## 5. Background processing: the notification pipeline

This is the most infrastructure-heavy part of the system, built entirely on Postgres with no external queue service:

1. **Event bus** (`src/events/event-bus.ts`) — `InProcessEventBus` wraps Node's `EventEmitter`. `publish()` defers dispatch via `setImmediate` so publishing never blocks the HTTP response path; every subscriber is wrapped so a thrown error can't crash the emitter. The `IEventBus` interface is deliberately narrow so it could be swapped for a distributed bus (Redis pub/sub, SQS, BullMQ) later without touching any caller.
2. **Domain events** (`src/events/event-types.ts`): `registration.confirmed`, `registration.waitlisted`, `registration.promoted`, `registration.cancelled`, `event.cancelled`.
3. **Enqueue** (`notification-worker.ts`) — subscribes to all five events and writes a row into `notification_jobs` (`status: 'pending'`). Enqueue failures are logged, never thrown — a broken queue can't break the request that triggered it.
4. **Process** (`notification-processor.ts`) — a self-rescheduling loop (`setTimeout`, started once at boot) polling every 5 seconds:
   - Recovers stale jobs stuck in `processing` for >5 minutes (crash recovery).
   - Claims pending jobs via `SELECT ... FOR UPDATE SKIP LOCKED` inside a transaction, so **multiple server instances can run the processor concurrently without double-processing a job** — a real horizontally-scalable queue, hand-built on Postgres.
   - Dispatches via a `switch` over the event type with a TypeScript exhaustiveness check (`const unhandled: never = type`) — adding a new domain event without a handler is a compile error, not a silent runtime gap.
   - Failure handling: exponential backoff (`30s × 2^(attempts-1)`), permanent `failed` status after 5 attempts.

**Current limitation:** every handler in the processor is a `console.log` + `// TODO: send email` stub. The infrastructure (bus → durable queue → concurrent-safe processor → retry/backoff) is fully real and testable; the last mile (actually emailing or pushing to the student) is not yet implemented. This is a good example of "engineering ahead of the visible feature" worth explaining directly if a reviewer asks why notifications don't show up anywhere in the UI — the `Notifications.jsx` page is also currently a static stub, not wired to any backend endpoint.

---

## 6. Redis usage

`@upstash/redis` (REST-based client) is used exclusively as a **read-through cache for user profile lookups** — `/api/auth/me`, and the response of register/login — keyed by `user:<authString>` / `userId:<id>` with a 1-hour TTL. It is **not** used for sessions, rate limiting, or pub/sub. Cache failures are caught and logged, never surfaced to the client, so a Redis outage degrades to a plain DB read rather than breaking auth.

---

## 7. Frontend architecture

- **Routing** (`src/App.jsx`, React Router 7): a single route tree guarded by three wrapper components — `ProtectedRoute` (auth + optional `allowedRoles`), `OrgMemberRoute` (gates `/clubs` behind organisation membership), `PublicRoute` (keeps authenticated users off `/sign-in`/`/sign-up`). `AppShell` wraps authenticated routes in a desktop nav shell (`DesktopShell`) or renders bare on mobile widths, via a `useIsDesktop` media-query hook.
- **State management**: plain **React Context** (`src/store/AuthContext.jsx`) — no Redux/Zustand/MobX. Session persistence uses `localStorage`/`sessionStorage` depending on a "remember me" flag. A secondary profile cache (`persey_user_profile` key) is read directly from `localStorage` by several pages and kept in sync via a custom `profileUpdated` window event.
- **Hooks** (`src/hooks/`): `useAuth`, `useIsDesktop`, `useHasOrganisation` (drives the Clubs nav/route gate).
- **Design language**: most pages are wrapped in a `PhoneFrame` component for a mobile-mockup presentation, with a `DesktopShell` nav rail appearing at wider viewports.

---

## 8. Deployment notes

- Single Express process (`server.ts`) serves the API and, in production, the built client via a catch-all static route — see [`SETUP.md`](./SETUP.md) for exact steps and required environment variables.
- `server.ts` pins DNS resolvers (`dns.setServers(["1.1.1.1", "8.8.8.8"])`) — a workaround for unreliable local/CI DNS during development; worth revisiting for a real production deploy.
- Local dev targets PostgreSQL 16 (see `setup-db.bat`, Windows-specific) and an Upstash Redis instance (cloud, no local setup needed).
