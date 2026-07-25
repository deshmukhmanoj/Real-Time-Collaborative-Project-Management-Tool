# MD Taskboard — Backend

Real-time collaborative task/project management backend.

**Stack:** Node.js + TypeScript + Express + PostgreSQL (all business logic in `md_*` stored procedures/functions, no ORM, no foreign keys) + JWT (access + refresh) + bcrypt + Socket.io.

## Setup

1. Install dependencies
   ```bash
   npm install
   ```

2. Create your `.env` file (copy `.env.example` and fill in real values — especially `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` and your DB password):
   ```bash
   cp .env.example .env
   ```

3. Create the database (once), then apply the schema (tables + stored procedures). This script is idempotent — safe to re-run any time you add/change a procedure:
   ```bash
   # create the DB itself (one-time)
   createdb md_taskboard

   # apply schema.sql (tables, indexes, functions)
   npm run db:migrate
   ```

4. Run in development (auto-restarts on change):
   ```bash
   npm run dev
   ```

5. Build & run in production:
   ```bash
   npm run build
   npm start
   ```

## Project structure

```
src/
  config/       env.ts (typed env vars), db.ts (pg Pool)
  controllers/  one file per resource — calls stored procedures only, no inline SQL logic
  routes/       Express routers, wired together in routes/index.ts
  middlewares/  auth.middleware (JWT check), role.middleware (workspace role check),
                error.middleware (maps DB RAISE EXCEPTION + ApiError -> HTTP status)
  utils/        ApiError, catchAsync, jwt.util (sign/verify access & refresh tokens)
  sockets/      Socket.io setup for real-time board updates
  types/        shared TS interfaces + Express Request augmentation
  db/schema.sql full table + stored procedure definitions (md_ prefix)
  app.ts        Express app (middleware + routes)
  server.ts     entry point — boots HTTP server + Socket.io + DB connectivity check
```

## Design notes

- **No inline SQL in controllers.** Every controller calls a `md_*` stored function via `pool.query('SELECT * FROM md_x($1,$2)', [...])`. All validation and business logic (duplicate checks, role checks, cascading deletes, activity logging) lives in PL/pgSQL.
- **No foreign keys.** Referential integrity and cascading behavior (e.g. deleting a task also deletes its comments/activity rows) is handled explicitly inside the stored procedures. Indexes are added manually on all relationship columns since Postgres won't auto-index them without FKs.
- **Error mapping.** Stored procedures raise plain-text exception codes (e.g. `RAISE EXCEPTION 'EMAIL_ALREADY_EXISTS'`). `error.middleware.ts` maps these codes to the correct HTTP status so the frontend gets consistent `{ success: false, error: 'CODE' }` responses.
- **Auth flow.** Login returns a short-lived access token (15m default) + a longer-lived refresh token (7d default, stored in `md_refresh_tokens` so it can be revoked on logout). `/api/auth/refresh-token` issues a new access token without requiring re-login.
- **Re-runnable schema.** All `CREATE TABLE` / `CREATE INDEX` statements use `IF NOT EXISTS`; all functions use `CREATE OR REPLACE`. You can safely re-run `npm run db:migrate` after adding new procedures.

## API overview

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh-token
POST   /api/auth/logout

POST   /api/workspaces
GET    /api/workspaces
POST   /api/workspaces/:workspaceId/members   (requires admin/owner role)
GET    /api/workspaces/:workspaceId/members

POST   /api/boards
GET    /api/boards/workspace/:workspaceId
GET    /api/boards/:id/full        (nested board -> lists -> tasks JSON)

POST   /api/lists
PATCH  /api/lists/:id/reorder

POST   /api/tasks
PATCH  /api/tasks/:id
PATCH  /api/tasks/:id/move
PATCH  /api/tasks/:id/complete
DELETE /api/tasks/:id

POST   /api/comments
GET    /api/comments/task/:taskId

GET    /api/activity/task/:taskId
GET    /api/activity/board/:boardId
```

All routes except `/api/auth/*` require `Authorization: Bearer <accessToken>`.
