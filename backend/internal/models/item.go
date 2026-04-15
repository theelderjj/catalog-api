package models

import "time"

type Category string

const (
	CategoryElectronics Category = "electronics"
	CategoryClothing    Category = "clothing"
	CategoryFurniture   Category = "furniture"
	CategoryBooks       Category = "books"
	CategoryOther       Category = "other"
)

// Item represents a single personal belonging in the catalog.
type Item struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Category    Category  `json:"category"`
	Value       float64   `json:"value"`   // estimated dollar value
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

// StatsResponse is returned by GET /api/stats — demonstrates stateful server knowledge
type StatsResponse struct {
	TotalItems      int            `json:"total_items"`
	TotalQuantity   int            `json:"total_quantity"`
	TotalValue      float64        `json:"total_value"`
	ByCategory      map[string]int `json:"by_category"`
	RequestsHandled int            `json:"requests_handled"` // server-side counter — purely stateful
}
