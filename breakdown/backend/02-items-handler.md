# 02-items-handler.md — HTTP Handler Layer (ItemHandler)

Overview
- This document breaks down the ItemHandler in `backend/internal/handlers/items.go`.
- It demonstrates how a RESTful controller translates HTTP requests into in-memory store operations, and how responses are shaped for clients.
- It also covers the data types involved (DTOs), the lifecycle of requests, and how statelessness vs stateful behavior is demonstrated via responses and the in-memory store.

Context and responsibilities
- ItemHandler owns a reference to the shared memory store: `store *store.MemoryStore`.
- It exposes CRUD endpoints and two educational endpoints (`/api/stats` and `/api/reset`).
- All state mutations occur in MemoryStore; the handler is stateless with respect to client identity.

Important data types referenced
- DTOs from `internal/models`:
  - `CreateItemRequest`
  - `UpdateItemRequest`
  - `Item`
  - `StatsResponse`
- Helper constructors:
  - `respond(w, status, body)`
  - `respondError(w, status, msg, detail)`

Code-path walk-through (highlights with inline references)
- ListItems (GET /api/items)
  - Reads optional query param `category` from `r.URL.Query().Get("category")`.
  - Calls `h.store.List()` to fetch all items.
  - Applies category filter if provided (case-insensitive comparison).
  - Returns 200 with JSON array of items.
- GetItem (GET /api/items/{id})
  - Extracts `id` from URL via `chi.URLParam(r, "id")`.
  - Calls `h.store.Get(id)`; on error returns 404 with an error payload.
- CreateItem (POST /api/items)
  - Decodes the request body into `models.CreateItemRequest`.
  - Calls `h.store.Create(req)`; on error returns 422 with error payload.
  - Sets `Location` header to `/api/items/{item.ID}` and returns 201 with the new item.
- UpdateItem (PUT /api/items/{id})
  - Reads `id` from URL; decodes body into `models.UpdateItemRequest` (supports partial updates via pointers).
  - Calls `h.store.Update(id, req)`; on error returns 404.
  - Returns 200 with the updated item.
- DeleteItem (DELETE /api/items/{id})
  - Calls `h.store.Delete(id)`; on error returns 404.
  - Returns 204 No Content on success.
- GetStats (GET /api/stats)
  - Returns the server's in-memory state as `StatsResponse` via `h.store.Stats()`.
- ResetStore (POST /api/reset)
  - Calls `h.store.Reset()` to restore demo data; returns a success message.

Concurrency and safety notes
- The handler uses a pointer to a shared `MemoryStore` instance. The store exposes concurrency-safe methods (`RWMutex`).
- The handler itself does not introduce additional synchronization primitives.

ASCII diagram: HTTP path through handler to store
```
HTTP Client -> Router -> ItemHandler.ListItems / GetItem / CreateItem / UpdateItem / DeleteItem / GetStats / ResetStore
        ↓
MemoryStore (List / Get / Create / Update / Delete / Stats / Reset)
```

Key excerpts (snippets for reference)
```go
// ListItems handles GET /api/items
func (h *ItemHandler) ListItems(w http.ResponseWriter, r *http.Request) {
  category := r.URL.Query().Get("category")
  items := h.store.List()
  if category != "" {
    filtered := []models.Item{}
    for _, item := range items {
      if strings.EqualFold(string(item.Category), category) {
        filtered = append(filtered, item)
      }
    }
    items = filtered
  }
  if items == nil {
    items = []models.Item{}
  }
  respond(w, http.StatusOK, items)
}
```

Why this design matters
- The ItemHandler is thin and delegates all state mutations to MemoryStore, making it easy to swap out persistence later.
- The code comments embedded in the source (EDUCATIONAL NOTES) guide learners about state, safety, and idempotency.
