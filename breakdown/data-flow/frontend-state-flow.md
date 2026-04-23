# frontend-state-flow.md — React State and Prop Flow in the SPA

Overview
- This document traces how UI state is managed in the frontend and how data moves from user actions to API calls and back into the UI.

Key stateful components and flows
- App.tsx
  - Manages the top-level tab state (catalog vs concepts).
  - Renders left content area and right RequestLogPanel.
- CatalogPage.tsx
  - Manages local state for items, category filter, modal visibility, loading and error handling.
  - Triggers API calls through `itemsApi` and refreshes the list upon create/update/delete.
- ItemForm.tsx
  - Controlled inputs for item fields.
  - On submit, maps UI fields to `CreateItemPayload` or `UpdateItemPayload` and calls `onSubmit`.
- ItemCard.tsx
  - Displays item data; actions bubble up to CatalogPage via callbacks.
- StatsPanel.tsx / RequestLogPanel.tsx / ConceptPanel.tsx
  - Consume data from API and logs via the shared interfaces and pub/sub mechanism.

Data flow narratives (step-by-step)
- Step 1: User clicks a category pill. CatalogPage sets a new filter, triggering a re-fetch of items.
- Step 2: CatalogPage loads items via `itemsApi.list(category?)`. The response populates `items` state.
- Step 3: User opens the Create/Edit modal and fills the form. Upon submit, ItemForm emits payload to CatalogPage.
- Step 4: CatalogPage calls `itemsApi.create` or `itemsApi.update` and, on success, reloads the list to reflect changes.
- Step 5: All API calls emit a log entry via Axios interceptors, consumed by RequestLogPanel and ConceptPanel.

ASCII diagram: Data flow through UI (simplified)
```
User Action -> App (tab switch, etc.) -> CatalogPage (state: items, filter, modal) -> API call -> Response -> State update -> UI re-render
```
