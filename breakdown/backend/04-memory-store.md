# 04-memory-store.md — In-Memory Persistence and Concurrency

Overview
- This document explains the in-memory storage layer implemented in `backend/internal/store/memory.go`.
- It demonstrates how data is stored, mutated, and read in a thread-safe manner using `sync.RWMutex`.
- It also covers how initial demo data is seeded, how the server tracks a global request counter, and how statistics are computed.

Data structures and state
- MemoryStore:
  - mu: sync.RWMutex — guards access to the store's internal state
  - items: map[string]*models.Item — catalog of items stored in memory
  - requestsHandled: int — server-side counter of requests processed (stateful)

Initialization
- NewMemoryStore() creates the store and seeds it with demo data by calling `seed()`.
- seed() inserts a fixed set of items using `Create()` (ensures consistent timestamps).

Key methods and their roles
- IncrementRequests(): increments the stateful request counter under a write lock.
- List(): returns a slice of items; uses RLock for safe concurrent reads.
- Get(id string): returns a single item or error if not found.
- Create(req models.CreateItemRequest): validates input, builds a new Item with a generated ID and timestamps, stores it, and returns the created item.
- Update(id string, req models.UpdateItemRequest): applies partial updates to an existing item; updates the `UpdatedAt` timestamp.
- Delete(id string): removes the item if present.
- Stats(): aggregates totals (items, quantity, value) and category counts; returns a `StatsResponse`.
- Reset(): clears all items and re-seeds demo data.
- seed(): helper that populates a fixed set of demo items.
- newID(): generates an 8-byte random hex string as a unique ID.

Concurrency patterns and safety
- All mutating operations (`Create`, `Update`, `Delete`, `Reset`) acquire `s.mu.Lock()` to ensure exclusive access.
- Read operations (`List`, `Get`, `Stats`) acquire `s.mu.RLock()` to allow concurrent reads.
- The pattern prevents data races in a multi-request environment.

Data flow (conceptual)
- HTTP handlers obtain `MemoryStore` via `NewMemoryStore()` and call methods like `List()`, `Get()`, `Create()`, etc.
- The results are returned to the calling handler, which then formats JSON responses.

Code excerpts (key blocks)
```go
// IncrementRequests records that a request was handled
func (s *MemoryStore) IncrementRequests() {
  s.mu.Lock()
  s.requestsHandled++
  s.mu.Unlock()
}

// List returns all items
func (s *MemoryStore) List() []models.Item {
  s.mu.RLock()
  defer s.mu.RUnlock()
  out := make([]models.Item, 0, len(s.items))
  for _, v := range s.items {
    out = append(out, *v)
  }
  return out
}
```

Seed data and demo perspective
- seed() creates 5 items (MacBook Pro, Sony headphones, Standing Desk, The Pragmatic Programmer, Nike shoes).
- This ensures that developers see deterministic output on startup.

Extending the store
- To swap with a real database later, preserve the same interface used by `ItemHandler`.
- A repository abstraction could be introduced to decouple business logic from persistence.
