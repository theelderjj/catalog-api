# 01-app.md — Root App Component and Layout

Overview
- This document explains the App.tsx component that forms the top-level layout of the frontend SPA.
- It manages the primary navigation (Catalog vs Concepts) and coordinates two major panels: the left content area and the persistent right-hand Request Log panel.

Component roles and relationships
- App.tsx is a simple stateful root that controls which page is shown via a `tab` state.
- It renders two child regions:
  1) Left: dynamic content area that switches between CatalogPage and ConceptPanel
 2) Right: RequestLogPanel (always visible)
- It wires user interactions (tab clicks) to state changes, causing re-renders of the main content area.

Key code touchpoints (high-level references)
- State: `const [tab, setTab] = useState<Tab>('catalog')`
- Tab buttons: map over [catalog, concepts] to render toggleable buttons
- Main layout: a flex container with left content and right sidebar
- Left content rendering:
  - `tab === 'catalog' && <CatalogPage />`
  - `tab === 'concepts' && <ConceptPanel />`
- Right panel: `<RequestLogPanel />`

Data flow summary
- Data in the UI starts with user interaction (tab switch or actions within CatalogPage).
- CatalogPage fetches data from the backend via `itemsApi` (see frontend/02-api-client.md).
- RequestLogPanel subscribes to a global log store updated by Axios interceptors (see 02-api-client.md).
- The UI remains stateless regarding user-specific data; the backend and in-browser logs carry the dynamic state.

ASCII diagram: Frontend app layout
```
App
├─ Header / Title
├─ Tabs: Catalog | Concepts
├─ Main content (left): CatalogPage | ConceptPanel
└─ Request Log (right): RequestLogPanel
```

Educational notes
- The layout emphasizes a split-view: content-driven on the left, observability on the right.
- Components are designed to be reusable and isolated; CatalogPage manages its own items state, while App manages which view is shown.
