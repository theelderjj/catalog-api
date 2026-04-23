# 08-concept-panel.md — API Concepts Visual Panel

Overview
- ConceptPanel visually explains REST concepts like stateless vs stateful, safe vs unsafe, and idempotent vs non-idempotent operations.
- It consumes the last API log to highlight relevant concepts and uses a static METHOD_INFO map to describe each HTTP method.

Key ideas
- Stateless HTTP: each request carries all necessary information; GET requests are typically stateless.
- Stateful server data: operations that mutate server-side state (POST, PUT, DELETE) are stateful in practice.
- Safety: Safe methods do not mutate (GET, HEAD, OPTIONS).
- Idempotence: Multiple identical requests yield the same result (GET, PUT, DELETE); POST is not idempotent.

Data sources
- The panel subscribes to the global logs via `subscribeToLogs` and reads the latest `RequestLog`.
- It maps the latest log to a color-highlighted card and shows a short description and example usage.

ASCII diagram: Concept flow based on last request
```
Last request -> METHOD_INFO lookups -> highlighing in ConceptCard
```
