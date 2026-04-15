# Catalog API — Playwright Test Suite

End-to-end tests covering both the REST API layer and the React frontend UI.

---

## Quick start

```bash
# 1. One-time setup (installs Playwright + Chromium + Firefox + frontend deps)
cd C:\Users\johnj\Documents\catalog-api
npm run setup

# 2. Start both services (see full instructions below)

# 3. Run all tests
npm test
```

---

## Step 1 — Start the backend

Open a terminal and run:

```bash
cd C:\Users\johnj\Documents\catalog-api\backend
go run main.go
```

You should see:

```
Catalog API listening on :8080
```

Leave this terminal open. The backend runs on `http://localhost:8080`. If you see a port conflict, stop whatever is using port 8080 first.

---

## Step 2 — Start the frontend

Open a **second** terminal and run:

```bash
cd C:\Users\johnj\Documents\catalog-api\frontend
npm install     # only needed the first time
npm run dev
```

You should see:

```
  VITE v5.x.x  ready in Xms

  ➜  Local:   http://localhost:5173/
```

Leave this terminal open too. Open `http://localhost:5173` in your browser to confirm the app loads with 5 catalog items.

---

## Step 3 — Run the tests

Open a **third** terminal from the project root:

```bash
cd C:\Users\johnj\Documents\catalog-api
```

### Run all tests

```bash
npm test
```

Runs every API test then every UI test in sequence. Results print to the terminal and a full HTML report is saved to `playwright-report/`.

---

## Running specific subsets

### API tests only (no browser — fast)

Tests the Go REST endpoints directly using HTTP requests. No browser window opens.

```bash
npm run test:api
```

### UI tests only (Chrome)

Tests the React frontend in a headless Chrome browser.

```bash
npm run test:ui
```

### A single spec file

```bash
npx playwright test tests/api/items.spec.ts
npx playwright test tests/ui/catalog.spec.ts
```

### A single test by name

```bash
npx playwright test -g "returns 201 Created"
npx playwright test -g "category filter"
```

---

## Headed mode (watch the browser)

Runs UI tests with the browser window visible so you can watch every click and form interaction happen in real time.

```bash
npm run test:headed
```

To run a single spec file in headed mode:

```bash
npx playwright test tests/ui/catalog.spec.ts --headed
```

---

## Debug mode (step through tests)

Pauses execution at each Playwright action and opens the Playwright Inspector. You can step forward, inspect the DOM, and see exactly what the test is doing.

```bash
npm run test:debug
```

To debug a single test:

```bash
npx playwright test tests/ui/catalog.spec.ts --debug
```

Inside the Inspector:
- **Step over** (`F10`) — run the next action
- **Resume** (`F8`) — run until the next `page.pause()` or end
- **Pick locator** — click an element on the page to generate its Playwright selector

---

## View the HTML report

After any test run, open the full visual report showing pass/fail results, screenshots on failure, and video recordings:

```bash
npm run test:report
```

This opens `playwright-report/index.html` in your browser. Screenshots and videos from failed tests are attached to their test entries.

---

## CI mode

Runs tests with `CI=true`, which disables server reuse (always starts fresh services) and enables 2 retries on failure:

```bash
npm run test:ci
```

---

## Skipping the auto-start

By default, `npm test` automatically starts the backend and frontend before running tests and stops them afterwards. If you already have both services running and want to skip the auto-start:

```bash
SKIP_SERVERS=true npm test
```

---

## Environment variables

Override these to point at a deployed environment instead of localhost:

| Variable       | Default                 | Purpose                             |
|----------------|-------------------------|-------------------------------------|
| `API_URL`      | `http://localhost:8080` | Backend base URL for API tests      |
| `BASE_URL`     | `http://localhost:5173` | Frontend base URL for UI tests      |
| `SKIP_SERVERS` | _(unset)_               | Set to `true` to skip auto-start    |
| `CI`           | _(unset)_               | Set to `true` for CI behaviour      |

Example — run against a deployed environment:

```bash
API_URL=https://api.example.com BASE_URL=https://app.example.com SKIP_SERVERS=true npm test
```

---

## Test structure

```
tests/
├── api/
│   ├── health.spec.ts    — GET /health (status, content-type, idempotency)
│   ├── items.spec.ts     — Full CRUD: list, category filter, get, create,
│   │                       update, delete — happy paths + error paths
│   ├── stats.spec.ts     — GET /api/stats accuracy and request counter
│   └── reset.spec.ts     — POST /api/reset idempotency and seed data
├── ui/
│   └── catalog.spec.ts   — Browser tests: page load, filter, create/edit/
│                           delete forms, stats panel, tab navigation, full
│                           CRUD workflow
└── helpers/
    └── api.ts            — Shared HTTP wrappers, types, and test fixtures
```

---

## Design notes

**Workers set to 1.** The backend uses an in-memory store with no per-test isolation. Running tests in parallel would cause race conditions — one test's `POST /api/reset` wipes state another test is actively using. All tests run sequentially to guarantee clean, predictable state.

**Every test resets.** Each test calls `POST /api/reset` in `beforeEach`, which restores the 5 seed items (MacBook Pro, Sony WH-1000XM5, Standing Desk, The Pragmatic Programmer, Nike Air Max 270). This means every test starts from the exact same baseline.

**API tests have no browser.** They use Playwright's `request` fixture to make raw HTTP calls — much faster than browser tests and ideal for verifying status codes, headers, and JSON response shapes.

**UI form selectors.** `ItemForm` renders labels without `for`/`htmlFor` attributes and inputs without `id` attributes, so `getByLabel()` cannot associate them. Tests use specific input attributes instead (`input[required]` for Name, `input[step="0.01"]` for Value, etc.).

**Idempotency tests** deliberately send the same PUT request twice with `Promise.all` and assert both return the same result — verifying the server correctly implements the HTTP idempotency contract.
