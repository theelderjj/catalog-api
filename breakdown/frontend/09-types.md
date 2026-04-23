# 09-types.md — TypeScript Types Alignment with Backend

Overview
- This document maps the frontend TypeScript types to the Go backend models and DTOs used in the example.
- It clarifies how data shapes flow across the API boundary, including JSON field names and dotted-cased time fields.

TypeScript types (frontend)
- Catetory union type
  - type Category = 'electronics' | 'clothing' | 'furniture' | 'books' | 'other'
- Item interface (matching REST payload shape)
- CreateItemPayload and UpdateItemPayload for API calls
- StatsResponse, and RequestLog used by UI components
- Shared conventions: snake_case in TS interface names for JSON mapping is the usual translation from Go's `json` tags.

Go backend alignment (brief cross-reference)
- Item: fields ID, Name, Description, Category, Value, Quantity, Tags, CreatedAt, UpdatedAt
- CreateItemRequest: fields for payload properties used to create an item
- UpdateItemRequest: optional fields (pointers) for partial updates
- StatsResponse: server aggregates with items, quantities, and by-category counts

Data flow mapping
- API returns JSON that is decoded into TS interfaces (Item, CreateItemPayload, UpdateItemPayload, StatsResponse).
- When a frontend component uses these types, it is guaranteed to be in sync with the backend DTOs and JSON payload shapes.

ASCII diagram: Data shape mapping
```
Go Item (JSON)  <->  TypeScript Item
-id             <-  id
-name           <-  name
-description    <-  description
-category       <-  category
-value          <-  value
-quantity       <-  quantity
-tags           <-  tags
-created_at     <-  created_at
-updated_at     <-  updated_at
```
