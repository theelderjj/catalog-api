# Catalog API — REST Learning Playground

I built this project to get hands-on with REST API design and Go web development. Rather than just reading about HTTP methods and idempotency, I wanted a real working app where I could fire requests, watch the responses, and see the concepts play out live. The frontend logs every request made, shows whether it was safe or idempotent, and lets me inspect the raw response — it's essentially a personal REST reference I can interact with.

## What it does

A simple item catalog with full CRUD over a Go REST API and a React frontend. The backend uses an in-memory store (intentionally — no database means I can focus on the HTTP layer without ORM or migration complexity). The frontend has two views: a catalog for managing items, and a concepts panel that explains what's happening under the hood as you make requests.

Every API call appears in a live request log showing the method, URL, status code, duration, and whether the call was safe, idempotent, or stateful. The stats endpoint demonstrates that the server holds state the client never sends — it counts every request handled since startup.

**API endpoints**

| Method | Endpoint | Behaviour |
|--------|----------|-----------|
| GET | `/health` | Health check |
| GET | `/api/items` | List all items, optional `?category=` filter |
| GET | `/api/items/{id}` | Fetch a single item |
| POST | `/api/items` | Create an item — server generates ID and timestamps |
| PUT | `/api/items/{id}` | Partial update — idempotent |
| DELETE | `/api/items/{id}` | Delete an item — idempotent |
| GET | `/api/stats` | Server-side aggregates (total items, value, request count) |
| POST | `/api/reset` | Wipe and reload the 5 demo seed items |

## What I was learning

**REST design**
Understanding the difference between safe, idempotent, and stateful HTTP methods — not just knowing the definitions but seeing what happens when you send the same PUT twice versus the same POST twice. The request log badges make this concrete.

**Go web development**
Building a layered backend with chi router, middleware chaining, handler structs, and an in-memory store protected by `sync.RWMutex` for safe concurrent access. Writing idiomatic Go error handling and structured JSON responses throughout.

**CORS and middleware**
Configuring CORS so the Vite dev server can talk to the Go backend, and building custom middleware to count requests and attach them to server-side state.

**Playwright E2E testing**
Writing a comprehensive test suite that covers both the REST API layer (using Playwright's request fixture — no browser needed) and the React UI (form interactions, filter behaviour, CRUD workflows across Chrome and mobile). Learning how to handle shared stateful backends in parallel test runs and why `workers: 1` matters when there's no per-test isolation.

**GitHub Actions CI**
Wiring up a CI pipeline that starts both services automatically, runs the full test suite, and blocks PR merges on failure. Understanding branch protection rules and what enforcing them actually means in practice.

**React + TypeScript**
Building a frontend that subscribes to a pub/sub request log, uses Axios interceptors to track timing, and renders live feedback without any external state management library.

## Running locally

**Prerequisites:** Go 1.22+, Node 20+

**Backend**

```bash
cd backend
go run main.go
```

Starts on `http://localhost:8080`. The backend seeds 5 demo items on startup. Hit `POST /api/reset` at any time to wipe and restore them.

**Frontend**

```bash
cd frontend
npm install   # first time only
npm run dev
```

Opens at `http://localhost:5173`. The Vite dev server proxies `/api` and `/health` to the backend so there are no CORS issues during development.

**Environment variables**

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Backend listen port |
| `FRONTEND_URL` | `http://localhost:5173` | CORS allowed origin |

## Running the tests

```bash
# From the repo root — installs Playwright + Chromium + frontend deps
npm run setup

# Run all tests (starts both services automatically)
npm test

# API tests only (no browser)
npm run test:api

# UI tests only
npm run test:ui

# Watch the browser while tests run
npm run test:headed

# Open the HTML report after a run
npm run test:report
```

See [`tests/README.md`](tests/README.md) for the full breakdown of test modes, environment variables, and design decisions.

## Tech stack

- **Backend:** Go 1.22, chi router, sync.RWMutex in-memory store
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Axios
- **Testing:** Playwright (API + E2E), 200~ tests across API and UI
- **CI:** GitHub Actions (runs on every PR, blocks merge on failure)
