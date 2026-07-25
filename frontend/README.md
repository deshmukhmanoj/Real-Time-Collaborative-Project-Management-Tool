# Boardline — Frontend

Real-time collaborative task board UI. React 18 + TypeScript + Redux Toolkit (RTK Query) + Tailwind + Socket.io client.

## Design

A "drafting table / engineering blueprint" identity: index-card style task tabs with a
perforated-tab list header, a blueprint-blue + amber palette, Space Grotesk for headings,
Manrope for UI text, and IBM Plex Mono for task IDs/timestamps.

## Setup

```bash
npm install
cp .env.example .env   # defaults work with the dev proxy, no editing needed
npm run dev
```

Requires the backend running on `http://localhost:5000` (see `vite.config.ts` — `/api` and
`/socket.io` are proxied there automatically in dev).

## Build

```bash
npm run build
npm run preview
```

For a production build talking to a deployed backend, set `VITE_API_BASE_URL` and
`VITE_SOCKET_URL` in `.env` before building.

## Structure

```
src/
  api/            RTK Query slices (one per resource) — auth, workspace, board, list, task,
                  comment, activity, user. baseApi.ts handles auth headers + silent
                  refresh-token retry on 401.
  app/            Redux store + typed hooks
  components/
    ui/           Button, Input, Modal, Avatar, Badge, Spinner, ConfirmDialog
    layout/       Sidebar + AppShell
    workspace/    Workspace/board cards, create modals, members/invite modal
    board/        BoardColumn, TaskCard, TaskModal, comments, activity feed, DnD helpers
  features/auth/  authSlice (user + tokens, persisted to localStorage)
  pages/          Login, Register, Dashboard, Workspace, Board, 404
  routes/         ProtectedRoute (redirects to /login if not authenticated)
  sockets/        SocketProvider (connects with access token) + useBoardSocket
                  (joins a board room, patches RTK Query cache on live events)
  types/          Shared TS interfaces mirroring the backend API contract
```

## Notable implementation details

- **Optimistic UI.** Dragging a task, toggling complete, and deleting all patch the
  RTK Query cache immediately (`onQueryStarted`) and roll back automatically if the
  request fails — the board never waits on a round-trip to feel responsive.
- **Real-time sync.** `useBoardSocket` listens for `task:created/updated/moved/completed/deleted`,
  `list:created`, and `comment:added` events and patches the same cache idempotently, so
  multiple people editing the same board converge without conflicting.
- **Auth.** Access token in memory/localStorage; on a 401 the base query automatically
  attempts a silent refresh (deduped via a small mutex so simultaneous 401s don't fire
  multiple refreshes) and retries the original request once.
