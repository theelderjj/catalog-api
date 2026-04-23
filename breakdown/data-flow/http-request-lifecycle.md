# http-request-lifecycle.md — Journey of a HTTP Request Through the System

Overview
- This document traces a typical HTTP request from the browser through the backend, illustrating where data originates, how it mutates state, and how the response travels back to the client.

Journey map (ASCII)
```
Browser       ->  Network  ->  Frontend (axios)  ->  Backend (Go)  ->  MemoryStore  ->  Backend (Go)  ->  Frontend  ->  Browser
```

Backend data flow (step-by-step)
- Client sends HTTP request to backend endpoint (e.g., POST /api/items).
- Router matches route; middleware stack executes in order: Logger, Recoverer, RealIP, CORS, CountRequests.
- Handler reads input (e.g., `CreateItemRequest` from JSON body) and calls the store to mutate state.
- MemoryStore updates its internal map under a write lock and returns the created item with ID and timestamps.
- Handler writes HTTP response (status 201) with the new item as JSON.
- Interceptors on the frontend receive the corresponding log entry, recording method, URL, timing, and status.
- Frontend components update UI state as needed (e.g., reloading item list).

Key takeaways
- Stateless protocol: each HTTP request contains all necessary information for the server to process it.
- Stateful concerns exist on the server side in MemoryStore (items, counters) but clients do not maintain server state.
- Data flows are straightforward and easy to reason about for educational purposes.
