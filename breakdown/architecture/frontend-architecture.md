# frontend-architecture.md — React SPA Architecture and Data Flow

Overview
- This document describes the architecture of the React/TypeScript frontend in the catalog-api repo.
- It explains the component composition, state management strategy, API integration, and how data moves from user actions to UI updates.

High-level architecture
- Root App component orchestrates layout and view switching between CatalogPage and ConceptPanel.
- CatalogPage is responsible for data fetching and managing item state (local to the page).
- A lightweight API client (`axios`) with interceptors is used to log and monitor API calls.
- The UI includes several presentational components (ItemCard, ItemForm, StatsPanel) and observability components (RequestLogPanel, ConceptPanel).
- Data flow is driven by local component state and a simple pub/sub mechanism for API request logs.

Key abstractions
- API layer: `frontend/src/api/client.ts` exposes `itemsApi` and `utilsApi` for HTTP calls.
- State flow within components:
  - CatalogPage: items, filter, modal, loading, error
  - ItemForm: local form state; onSubmit maps to payloads
  - RequestLogPanel: subscribes to logs and renders a live feed
- UI composition: a two-column layout with content on the left and logs on the right; tab navigation toggles content.

Component hierarchy (ASCII)
```
App
├─ Header
├─ CatalogPage / ConceptPanel
│  ├─ ItemCard (list of items)
│  ├─ ItemForm (modal)
│  └─ StatsPanel
└─ RequestLogPanel (sidebar)
```

Data flow narrative (user action to UI update)
- User action (add/edit/delete) triggers an API call via `itemsApi`.
- Axios interceptors emit a `RequestLog` entry consumed by RequestLogPanel and ConceptPanel.
- Successful responses update CatalogPage state (e.g., refresh list); errors are surfaced to the user.

Notes and future improvements
- This architecture is intentionally lightweight for learning: a minimal pub/sub layer and in-memory store on the backend.
- For production, consider a global state manager (Redux, Zustand) and a proper data-fetching layer with caching.
