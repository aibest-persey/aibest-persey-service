# Data Model

PostgreSQL via Sequelize (`src/models/`). Every model uses a UUIDv4 primary key (`id`) and Sequelize-managed `createdAt`/`updatedAt` timestamps (omitted from the tables below for brevity).

## Entity overview

```
User ──< Event (organiserId)
User ──< Registration (studentId)
User ──< Organisation (createdBy)
User ──< OrganisationMember (userId)
User ──< Club (createdBy)
User ──< ClubMember (userId)
User ──< News (createdBy)
User ──< Message (senderId / receiverId)
User ──< RoleChangeRequest (studentId / reviewedBy)

Event ──< Registration (eventId)
Event >── Organisation (organisationId, optional)

Organisation ──< OrganisationMember
Organisation ──< OrganisationJoinRequest
Organisation ──< Club (organisationId, optional — clubs may be independent)
Organisation ──< News (scope='org')
Organisation ──< Event (scope='org')

Club ──< ClubMember
Club ──< News (scope='club')

NotificationJob  — standalone, no foreign keys (decoupled job queue)
```

## Models

### `User` (`users`)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `username` | string, unique | auto-generated from name at sign-up on the client |
| `email` | string, unique | |
| `password` | string | bcrypt hash, cost 10 |
| `role` | enum: `student`, `organiser`, `admin` | default `student`; `admin` added to the Postgres enum at server boot |
| `authString` | string | `bcrypt(username@hashedPassword)` — used only as a Redis cache key, not for auth |
| `ip_encrypted` | string | bcrypt-hashed IP captured at registration (audit trail; not currently read anywhere) |
| `color` | string | UI avatar color |
| `emailVerified` | boolean | currently always `true` on register (see Architecture doc) |
| `verificationCode`, `verificationCodeExpires` | string, date | scaffolded, unreachable in current sign-up flow |
| `resetPasswordToken`, `resetPasswordExpires` | string (SHA-256 hash), epoch ms | 1-hour expiry |
| `bio`, `organization`, `website`, `logoUrl` | string | organiser profile fields |

### `Event` (`events`)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `title` | string | required |
| `description` | text | |
| `location` | string | |
| `date` | datetime | required |
| `status` | enum: `draft`, `published`, `cancelled` | state machine, see Architecture/user-journeys docs |
| `maxCapacity` | integer, nullable | `null` = unlimited |
| `organiserId` | UUID → `User.id` | owner |
| `organisationId` | UUID → `Organisation.id`, nullable | scopes visibility to org members when set |

### `Registration` (`registrations`)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `eventId` | UUID → `Event.id` | |
| `studentId` | UUID → `User.id` | |
| `status` | enum: `registered`, `waitlisted`, `cancelled` | |
| `waitlistPosition` | integer, nullable | ordering for promotion |
| `ticketCode` | string | encoded into the QR ticket |

### `Organisation` (`organisations`)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `name` | string, unique | |
| `status` | enum: `pending`, `verified` | admin verification gate |
| `createdBy` | UUID → `User.id` | |

### `OrganisationMember` (`organisation_members`)

| Field | Type | Notes |
|---|---|---|
| `organisationId` | UUID → `Organisation.id` | |
| `userId` | UUID → `User.id` | |
| `role` | enum: `owner`, `manager`, `member` | |

### `OrganisationJoinRequest` (`organisation_join_requests`)

| Field | Type | Notes |
|---|---|---|
| `organisationId` | UUID → `Organisation.id` | |
| `studentId` | UUID → `User.id` | |
| `status` | enum: `pending`, `approved`, `rejected` | |
| `reviewedBy` | UUID → `User.id`, nullable | |
| `reviewedAt` | date, nullable | |

### `Club` (`clubs`)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `name` | string, unique | |
| `organisationId` | UUID → `Organisation.id`, nullable | independent clubs allowed |
| `createdBy` | UUID → `User.id` | |

### `ClubMember` (`club_members`)

| Field | Type | Notes |
|---|---|---|
| `clubId` | UUID → `Club.id` | |
| `userId` | UUID → `User.id` | |
| `role` | enum: `owner`, `manager`, `member` | |

### `News` (`news`)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `title`, `content` | string, text | |
| `scope` | enum: `public`, `org`, `club` | |
| `organisationId` | UUID, nullable | required when `scope = 'org'` |
| `clubId` | UUID, nullable | required when `scope = 'club'` |
| `createdBy` | UUID → `User.id` | author |

### `Message` (`messages`)

| Field | Type | Notes |
|---|---|---|
| `senderId`, `receiverId` | UUID → `User.id` | |
| `subject`, `content` | string, text | |
| `isRead` | boolean | |

### `RoleChangeRequest` (`role_change_requests`)

| Field | Type | Notes |
|---|---|---|
| `studentId` | UUID → `User.id` | |
| `requestedRole` | enum | currently only `"organiser"` |
| `reason` | text | |
| `status` | enum: `pending`, `approved`, `rejected` | |
| `reviewedBy` | UUID → `User.id`, nullable | |
| `reviewedAt` | date, nullable | |

### `NotificationJob` (`notification_jobs`)

| Field | Type | Notes |
|---|---|---|
| `type` | string (`DomainEventType`) | e.g. `registration.confirmed` |
| `payload` | JSONB | event-specific data |
| `status` | enum: `pending`, `processing`, `done`, `failed` | |
| `attempts` | integer | |
| `lastError` | text, nullable | |
| `processAfter` | datetime | drives exponential backoff scheduling |

No foreign keys — deliberately decoupled from the domain models it notifies about (see [`ARCHITECTURE.md`](./ARCHITECTURE.md#5-background-processing-the-notification-pipeline)).
