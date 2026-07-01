# Setup & Running Locally

Two repos are involved:

- `aibest-persey-service` — the API + background worker (this repo)
- `aibest-persey-client` — the React frontend

## 1. Prerequisites

- Node.js (repo was developed against modern Node LTS; `tsx` is used to run TypeScript directly in dev)
- PostgreSQL 16 running locally (or reachable)
- An [Upstash Redis](https://upstash.com/) database (free tier is enough — it's accessed over REST, no local Redis install needed)
- (Optional, for password-reset emails) SMTP credentials

## 2. Database

`setup-db.bat` (Windows) creates the local database if it doesn't already exist:

```bat
setup-db.bat
```

It shells out to a hardcoded `psql` path (`C:\Program Files\PostgreSQL\16\bin\psql`) and creates a database named `aibest_persey`. On macOS/Linux, run the equivalent manually:

```sh
createdb aibest_persey
```

Sequelize manages schema via `sync({ alter: true })` on boot — no separate migration step is required for local dev. Note: adding the `admin` value to the `role` enum is handled by a one-time raw SQL guard in `server.ts` (`ALTER TYPE ... ADD VALUE`), since Sequelize can't append enum values through `sync()` alone.

## 3. Environment variables (service)

Copy `example.env` to `.env` and fill in:

```env
# Server
PORT=3000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here_change_me

# PostgreSQL
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=aibest_persey
PG_USER=postgres
PG_PASSWORD=postgres

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

# Frontend URL (used to build password-reset links)
FRONTEND_URL=http://localhost:3000
```

Additional variables read by the code but not present in `example.env` — set them if you need the corresponding feature:

| Variable | Purpose |
|---|---|
| `PG_SSL` | enable SSL for the Postgres connection (needed for most managed Postgres hosts) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | required for password-reset emails to actually send; `email-service.ts` silently no-ops if `SMTP_HOST` is unset |

## 4. Install & run

**Service:**

```sh
cd aibest-persey-service
npm install
npm run dev        # tsx watch server.ts — auto-restarts on change
# or: npm start     # tsx server.ts, no watch
```

The API listens on `PORT` (default `3000`) and starts the notification processor loop automatically at boot.

**Client:**

```sh
cd aibest-persey-client
npm install
npm run dev         # Vite dev server, default port 5173
```

The Vite dev server proxies `/api/*` to `http://localhost:3000` (see `vite.config.js`) — so during development the service **must** be running on port 3000 for the client to reach it. This means dev runs as two separate processes/ports.

## 5. Building for production

```sh
cd aibest-persey-client && npm run build   # outputs to aibest-persey-client/dist
cd ../aibest-persey-service && npm run build   # tsc, outputs compiled JS
```

In production, a single Express process serves both the API and the built client as static files via a catch-all route in `server.ts`, which expects the client's build output to be reachable relative to the service (co-locate the two repos, or copy `aibest-persey-client/dist` into place, at deploy time). There is no separate frontend host in production — one process, one origin.

## 6. Tests

```sh
npm test   # node tests/test-auth-endpoints.js
```

This is a standalone script that exercises the **running** server's auth and event endpoints end-to-end over `fetch` — start the service first (`npm run dev` in another terminal). It also connects directly to Postgres to promote a test user to `organiser` (bypassing the normal admin/role-request approval flow), so it needs the same `PG_*` env vars as the service.

## 7. Useful scripts (service `package.json`)

| Script | Command | Purpose |
|---|---|---|
| `dev` | `tsx watch server.ts` | local development with auto-restart |
| `start` | `tsx server.ts` | run without watch |
| `build` | `tsc` | type-check + compile to JS |
| `typecheck` | `tsc --noEmit` | type-check only |
| `test` | `node tests/test-auth-endpoints.js` | end-to-end smoke test against a running server |
