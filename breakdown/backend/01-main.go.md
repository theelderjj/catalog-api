# 01-main.go — Entry Point and Server Initialization

Overview
- This document explains the Go backend's main entry point located at `backend/main.go`.
- It wires the in-memory data store, HTTP handlers, router, middleware, and server startup.
- You will learn how data enters the system, how middleware transforms or augments requests, and how routing connects to handler logic.

Codebase anchors mentioned here
- Data store: `store.NewMemoryStore()`
- Handler: `handlers.NewItemHandler(s)`
- Router: `chi.NewRouter()` with middleware and routes
- Environment variables: `PORT`, `FRONTEND_URL`
- Routes: `/health`, `/api/items`, `/api/stats`, `/api/reset`

Imports and high-level responsibilities
```go
import (
  "log"
  "net/http"
  "os"

  "github.com/go-chi/chi/v5"
  chimiddleware "github.com/go-chi/chi/v5/middleware"
  "github.com/go-chi/cors"
  "github.com/your-org/catalog-api/internal/handlers"
  "github.com/your-org/catalog-api/internal/store"
)
```

What happens in main()
1. Create a new in-memory store: `store.NewMemoryStore()`
2. Create the item handler with access to the store: `handlers.NewItemHandler(s)`
3. Instantiate a new Chi router: `r := chi.NewRouter()`
4. Attach common middleware: logger, recoverer, and real IP extraction
5. Resolve frontend URL for CORS, defaulting to http://localhost:5173
6. Wire CORS policy with allowed origins, methods, and headers
7. Attach educational middleware to count requests: `r.Use(h.CountRequests)`
8. Register routes: health endpoint and API routes under `/api`
9. Read port from `PORT` env var, default to 8080
10. Start HTTP server with `http.ListenAndServe`

Concrete flow (step-by-step)
- The process begins by initializing the server components in memory (no external DB).
- The router is configured with a middleware stack and a set of routes to exercise CRUD operations.
- Each incoming request traverses middleware before reaching its corresponding handler which then interacts with the MemoryStore.
- Responses are marshaled as JSON using helper functions.

Data flow illustration
```
HTTP Client -> (Request) -> [Logger] -> [Recoverer] -> [RealIP] -> [CORS] -> [CountRequests] -> /health or /api/*
                                                                                                   |
                                                                                                   v
                                                ItemHandler method (ListItems, GetItem, CreateItem, ...)
                                                                                                   |
                                                                                                   v
                                                    MemoryStore operations (List, Get, Create, Update, Delete)
```

Detailed route wiring
```go
r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
  w.Header().Set("Content-Type", "application/json")
  w.Write([]byte(`{"status":"ok"}`))
})

r.Route("/api", func(r chi.Router) {
  r.Get("/items", h.ListItems)
  r.Post("/items", h.CreateItem)
  r.Get("/items/{id}", h.GetItem)
  r.Put("/items/{id}", h.UpdateItem)
  r.Delete("/items/{id}", h.DeleteItem)
  r.Get("/stats", h.GetStats)
  r.Post("/reset", h.ResetStore)
})
```

Environment and runtime notes
- `PORT` defaults to `8080` if not set.
- `FRONTEND_URL` defaults to `http://localhost:5173` when configuring CORS.
- The server prints a startup log: `catalog-api listening on :<port>`.

Key data types involved (references)
- `store.MemoryStore` holds the in-memory catalog and a request counter.
- `Item` and related DTOs live under `internal/models`.
- The router passes a request to a handler, which in turn interacts with the store and returns JSON.

ASCII diagram: Backend request lifecycle
```
Client Request
      |
      v
+-------------------------+
| chi Router + Middleware |
|  Logger | Recoverer | RealIP | CORS |
+-------------------------+
      |
      v
+-------------------------+
|  /health or /api/...     |
+-------------------------+
      |
      v
+-------------------------+
|     ItemHandler          |
|  (ListItems, CreateItem,  |
|   GetItem, UpdateItem,     |
|   DeleteItem, GetStats)     |
+-------------------------+
      |
      v
+-------------------------+
|     MemoryStore           |
|  (List, Get, Create, Update, |
|   Delete, Stats, Increment) |
+-------------------------+
```

Notes on extensibility and tradeoffs
- The memory store is used intentionally to keep the example self-contained and deterministic for learning.
- In production, swap the memory store for a persistent DB and repository abstraction.

Concluding data map
- Incoming HTTP request data (path params, query params, body) flows into Go structs (DTOs) and is stored or read from MemoryStore.
- Responses are serialized as JSON and returned to the client.
