# backend-architecture.md — Go Backend Architecture and Diagrams

Overview
- This document describes the high-level architecture of the Go backend used in the catalog-api project.
- It covers the layering (router, middleware, handlers, store, models), data flow, and the responsibilities of each component.

Architecture overview (layers)
- Router and middleware (chi):
  - Defines routes, applies cross-cutting concerns (logging, panic recovery, IP handling, CORS, request counter).
- Handlers (internal/handlers):
  - Act as the controller layer. They translate HTTP requests into store actions and marshal responses.
- Store (internal/store/memory.go):
  - In-memory persistence with a thread-safe map and a simple mutation protocol.
- Models (internal/models):
  - Data structures shared across layers (Item, DTOs, Stats).

Data flow (HTTP request lifecycle, ASCII)
```
HTTP Client -> chi Router -> Middleware (Logger, Recoverer, RealIP, CORS, CountRequests) -> /health or /api/*
    -> ItemHandler methods (ListItems, GetItem, CreateItem, UpdateItem, DeleteItem, GetStats, ResetStore) ->
       MemoryStore (List, Get, Create, Update, Delete, Stats, seed on startup) -> Response (JSON)
```

Key design decisions and trade-offs
- In-memory storage makes the system deterministic for learning but not durable; good for education and tests.
- A separate repository abstraction could be introduced to easily swap persistence without touching handler logic.
- The API is intentionally straightforward to illustrate HTTP semantics and CRUD patterns.

Notes on concurrency and safety
- `MemoryStore` uses `sync.RWMutex` to balance read/write throughput while avoiding data races.
- All state mutations occur under a write lock; reads are allowed concurrently.

Diagram: Component hierarchy (ASCII)
```
Go Tooling
- main.go
- internal/
  - models/
  - store/
  - handlers/
```
