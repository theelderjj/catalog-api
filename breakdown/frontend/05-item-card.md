# 05-item-card.md — Presentational Card for a Catalog Item

Overview
- ItemCard.tsx renders a compact, presentational view of a single catalog item.
- It demonstrates props-driven rendering and simple user interactions (Edit, Delete).

Props
- item: Item — data shape from frontend/types
- onEdit: (item: Item) => void
- onDelete: (id: string) => void

Structure and rendering
- Iconography: category-based emoji mapping (e.g., 💻 for electronics)
- Title, category label, and summary values (price, quantity)
- Optional description and tags rendered as chips when present
- Inline display of ID for educational purposes
- Action buttons: Edit (PUT) and Delete

Data flow notes
- The component receives the item via props and does not fetch data itself.
- User actions bubble up via callbacks to the parent (CatalogPage) which then triggers API calls.

ASCII diagram: Component composition
```
CatalogPage (ItemCard) ---- onEdit(item)
CatalogPage (ItemCard) ---- onDelete(id)
```
