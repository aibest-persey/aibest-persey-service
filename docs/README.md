# Bellboard — Technical Documentation

Bellboard is a campus events, clubs, and organisations platform, built by **Team Persey** for AIBEST. It spans two repositories: `aibest-persey-client` (React frontend) and `aibest-persey-service` (Node/TypeScript API + background worker), documented here.

## Contents

| Doc | Covers |
|---|---|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System topology, request lifecycle, auth model, background job pipeline, frontend architecture, known gaps |
| [API-REFERENCE.md](./API-REFERENCE.md) | Every HTTP endpoint, grouped by domain, with roles and notes |
| [DATA-MODEL.md](./DATA-MODEL.md) | All Sequelize models, fields, and relationships |
| [SETUP.md](./SETUP.md) | Environment variables, local setup, running both repos, tests |
| [user-journeys.md](./user-journeys.md) | Narrative, step-by-step flows for event creation, publication, registration/waitlisting, cancellation, and notifications, with request/response examples |

## Where to start

- New to the project? Read `ARCHITECTURE.md` first, then `user-journeys.md` for the flows that matter most (registration + waitlist promotion is the most interesting one).
- Building against the API? Go straight to `API-REFERENCE.md`.
- Setting up locally? Go straight to `SETUP.md`.
