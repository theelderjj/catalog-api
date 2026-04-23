# 03-catalog-page.md — Catalog Page Lifecycle and State Management

Overview
- CatalogPage.tsx is the main content surface for listing, filtering, creating, updating, and deleting items.
- This breakdown explains how data flows from the API into local state, how user actions map to API calls, and how the UI updates in response.

State and lifecycle
- Local state managed via React hooks:
  - items: Item[] — list of catalog items from API
  - filter: Category | 'all' — current category filter
  - modal: Modal | null — controls create/edit dialog visibility
  - loading: boolean — loading indicator during API calls
  - error: string | null — error banner when API fails
- Effect: `useEffect` triggers `load()` whenever `filter` changes
- Data flow on initial render: `load()` fetches items via `itemsApi.list(category)` and populates `items`.
- Filtering is client-side (the server supports ?category= argument, but the UI composes the API call depending on filter).
- Create/Update/Delete flows all end with a call to `load()` to refresh the list.

API integration points
- `itemsApi.list(category?)` → GET /api/items with optional `category` param
- `itemsApi.create(data)` → POST /api/items
- `itemsApi.update(id, data)` → PUT /api/items/{id}
- `itemsApi.delete(id)` → DELETE /api/items/{id}

UI composition and interactions
- Header section shows a counter of items: `{items.length} items`.
- Category filters render as pills; clicking a pill updates `filter` and triggers reload.
- The item grid renders `ItemCard` components; each card forwards `onEdit` and `onDelete` callbacks.
- The modal renders `ItemForm` for both create and edit modes; the form maps UI values to payload types.
- Errors render as a small red message; loading shows a placeholder text.

State to API payload mapping
- For creation and update, user input from the form yields either
  - CreateItemPayload (POST) or UpdateItemPayload (PUT)
- The mapping is done in `ItemForm` and forwarded to `handleCreate` / `handleUpdate`.

ASCII diagram: Data flow in CatalogPage
```
User actions (Filter / Add / Edit / Delete)
      |
      v
CatalogPage state changes (filter, modal, loading, error)
      |
      v
API calls via itemsApi (GET/POST/PUT/DELETE)
      |
      v
API response -> Update `items` state via `setItems` or show errors
      |
      v
UI re-renders with updated item list
```
