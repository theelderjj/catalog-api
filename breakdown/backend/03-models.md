# 03-models.md — Data Structures and Types (Go Models)

Overview
- This document explains the data models used by the Go backend, located in `backend/internal/models/item.go` and related DTOs.
- It covers how JSON payloads map to Go structs, and how the server uses these types to implement REST semantics.

Key Go types and their purposes
- Category (string type alias) with enumerated constants:
  - CategoryElectronics, CategoryClothing, CategoryFurniture, CategoryBooks, CategoryOther
- Item struct:
  - ID: unique identifier (string)
  - Name, Description: textual fields
  - Category: Category enum alias
  - Value: monetary value (float64)
  - Quantity: stock count (int)
  - Tags: string slice for metadata
  - CreatedAt, UpdatedAt: timestamps (time.Time)
- CreateItemRequest: payload for POST /api/items
- UpdateItemRequest: payload for PUT /api/items/{id} with pointers for partial updates
- StatsResponse: aggregates used by /api/stats

Code excerpts (Go structs)
```go
// Item represents a single personal belonging in the catalog.
type Item struct {
  ID          string    `json:"id"`
  Name        string    `json:"name"`
  Description string    `json:"description"`
  Category    Category  `json:"category"`
  Value       float64   `json:"value"`
  Quantity    int       `json:"quantity"`
  Tags        []string  `json:"tags"`
  CreatedAt   time.Time `json:"created_at"`
  UpdatedAt   time.Time `json:"updated_at"`
}

// CreateItemRequest is the body for POST /api/items
type CreateItemRequest struct {
  Name        string   `json:"name"`
  Description string   `json:"description"`
  Category    Category `json:"category"`
  Value       float64  `json:"value"`
  Quantity    int      `json:"quantity"`
  Tags        []string `json:"tags"`
}

// UpdateItemRequest is the body for PUT /api/items/:id
type UpdateItemRequest struct {
  Name        *string   `json:"name"`
  Description *string   `json:"description"`
  Category    *Category `json:"category"`
  Value       *float64  `json:"value"`
  Quantity    *int      `json:"quantity"`
  Tags        []string  `json:"tags"`
}

// StatsResponse is returned by GET /api/stats
type StatsResponse struct {
  TotalItems      int            `json:"total_items"`
  TotalQuantity   int            `json:"total_quantity"`
  TotalValue      float64        `json:"total_value"`
  ByCategory      map[string]int `json:"by_category"`
  RequestsHandled int            `json:"requests_handled"`
}
```

Notes on JSON mappings
- Go `json` struct tags map fields to snake_case in many frontend conventions when using the provided TS types.
- The `UpdateItemRequest` uses pointer fields for partial updates; nil means "no change".

Relationships to store and handlers
- `MemoryStore` holds a slice-like representation of items via a map: `map[string]*Item`.
- DTOs are used to validate and transfer data between client and server, keeping concerns separated.

Educational takeaways
- JSON tags enable seamless marshalling/unmarshalling with the `encoding/json` package.
- Time fields require explicit population (e.g., `CreatedAt`, `UpdatedAt`), typically with `time.Now()` during creation or updates.
