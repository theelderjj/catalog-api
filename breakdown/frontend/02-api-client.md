# 02-api-client.md — Axios Client, Interceptors, and Request Logging

Overview
- This document explains the Axios-based API client in `frontend/src/api/client.ts`.
- It demonstrates a middleware-like pattern on the client side where every API call is captured by interceptors and published to a simple in-browser log store used by the RequestLogPanel and ConceptPanel.

Core concepts
- Axios instance `api` configured with a base URL and default JSON headers.
- Request interceptor: attaches a `startTime` timestamp for duration calculation.
- Response interceptor: constructs a `RequestLog` object and emits it to subscribers; includes method semantics metadata (safe, idempotent, stateful).
- Error handling: if a request fails with a response, a log entry is still emitted to reflect the failed call.
- Pub/Sub: `subscribeToLogs` registers listeners; `emit` pushes logs to all listeners.
- API surface: `itemsApi` and `utilsApi` offer CRUD-like interactions to the backend.

Key data shapes
- `RequestLog` (frontend/types) contains:
  - id, timestamp, method, url, requestBody, requestHeaders, responseStatus, responseBody
  - durationMs, isStateful, isIdempotent, isSafe
- `METHOD_META` maps HTTP methods to safety/idempotency/statefulness metadata.

Flow of a typical API call
1) The code calls an API method (e.g., `itemsApi.list()`).
2) Axios sends the request with the configured base URL.
3) Request interceptor stores the start time.
4) Response interceptor computes duration, collects metadata, and emits a `RequestLog`.
5) Log subscribers (RequestLogPanel, ConceptPanel) update their UI accordingly.

Code excerpts (snippets)
```ts
// Request interceptor: record start time
api.interceptors.request.use(config => {
  (config as any)._startTime = performance.now()
  return config
})

// Response interceptor: build and emit a RequestLog entry
api.interceptors.response.use(
  response => {
    const method = (response.config.method ?? 'GET').toUpperCase()
    const duration = Math.round(performance.now() - (response.config as any)._startTime)
    const meta = METHOD_META[method] ?? METHOD_META['GET']
    emit({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      method: method as RequestLog['method'],
      url: response.config.url ?? '',
      requestBody: response.config.data ? JSON.parse(response.config.data) : undefined,
      requestHeaders: { 'Content-Type': 'application/json' },
      responseStatus: response.status,
      responseBody: response.data,
      durationMs: duration,
      ...meta,
    })
    return response
  },
  error => {
    if (error.response) {
      const method = (error.config?.method ?? 'GET').toUpperCase()
      const duration = Math.round(performance.now() - (error.config as any)?._startTime ?? 0)
      const meta = METHOD_META[method] ?? METHOD_META['GET']
      emit({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        method: method as RequestLog['method'],
        url: error.config?.url ?? '',
        requestBody: error.config?.data ? JSON.parse(error.config.data) : undefined,
        requestHeaders: { 'Content-Type': 'application/json' },
        responseStatus: error.response.status,
        responseBody: error.response.data,
        durationMs: duration,
        ...meta,
      })
    }
    return Promise.reject(error)
  }
)
```

Data flow and mapping to UI
- The emitted `RequestLog` events drive the RequestLogPanel and ConceptPanel (via `subscribeToLogs`).
- UI components read the data via the shared types in `frontend/src/types` and render status, duration, and safety/idempotency indicators.

Diagrams
- ASCII event flow (simplified):
```
UI Event -> Axios call -> Request Interceptor (startTime) -> HTTP Request -> Response -> Proxied to emit log
 -> RequestLogPanel/ConceptPanel consume log and re-render
```
