// Package store provides an in-memory data store for catalog items.
//
// EDUCATIONAL NOTE — STATEFUL SERVER:
// This store lives in server memory. Every write (POST, PUT, DELETE) mutates
// server state. The client must send the right request each time — the server
// doesn't remember *which client* called it (no sessions), but it does
// maintain a shared catalog that persists across requests until the server
// restarts. This is the "stateful data, stateless protocol" model of REST.
package store

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"sync"
	"time"

	"github.com/your-org/catalog-api/internal/models"
)

// MemoryStore is a thread-safe in-memory item store.
type MemoryStore struct {
	mu              sync.RWMutex
	items           map[string]*models.Item
	requestsHandled int // incremented on every handler call
}

func NewMemoryStore() *MemoryStore {
	s := &MemoryStore{items: make(map[string]*models.Item)}
	s.seed() // pre-populate with demo data
	return s
}

// IncrementRequests records that a request was handled (stateful counter).
func (s *MemoryStore) IncrementRequests() {
	s.mu.Lock()
	s.requestsHandled++
	s.mu.Unlock()
}

// List returns all items sorted by creation time (newest first).
func (s *MemoryStore) List() []models.Item {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]models.Item, 0, len(s.items))
	for _, v := range s.items {
		out = append(out, *v)
	}
	return out
}

// Get returns a single item by ID.
func (s *MemoryStore) Get(id string) (models.Item, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	item, ok := s.items[id]
	if !ok {
		return models.Item{}, fmt.Errorf("item %q not found", id)
	}
	return *item, nil
}

// Create adds a new item and returns it with a generated ID.
func (s *MemoryStore) Create(req models.CreateItemRequest) (models.Item, error) {
	if req.Name == "" {
		return models.Item{}, fmt.Errorf("name is required")
	}
	if req.Quantity <= 0 {
		req.Quantity = 1
	}
	if req.Category == "" {
		req.Category = models.CategoryOther
	}
	if req.Tags == nil {
		req.Tags = []string{}
	}

	now := time.Now()
	item := &models.Item{
		ID:          newID(),
		Name:        req.Name,
		Description: req.Description,
		Category:    req.Category,
		Value:       req.Value,
		Quantity:    req.Quantity,
		Tags:        req.Tags,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	s.mu.Lock()
	s.items[item.ID] = item
	s.mu.Unlock()

	return *item, nil
}

// Update applies partial changes to an existing item.
func (s *MemoryStore) Update(id string, req models.UpdateItemRequest) (models.Item, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	item, ok := s.items[id]
	if !ok {
		return models.Item{}, fmt.Errorf("item %q not found", id)
	}

	if req.Name != nil {
		item.Name = *req.Name
	}
	if req.Description != nil {
		item.Description = *req.Description
	}
	if req.Category != nil {
		item.Category = *req.Category
	}
	if req.Value != nil {
		item.Value = *req.Value
	}
	if req.Quantity != nil {
		item.Quantity = *req.Quantity
	}
	if req.Tags != nil {
		item.Tags = req.Tags
	}
	item.UpdatedAt = time.Now()

	return *item, nil
}

// Delete removes an item by ID.
func (s *MemoryStore) Delete(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.items[id]; !ok {
		return fmt.Errorf("item %q not found", id)
	}
	delete(s.items, id)
	return nil
}

// Stats computes aggregate data — server derives this from its own state.
func (s *MemoryStore) Stats() models.StatsResponse {
	s.mu.RLock()
	defer s.mu.RUnlock()

	stats := models.StatsResponse{
		ByCategory:      make(map[string]int),
		RequestsHandled: s.requestsHandled,
	}
	for _, item := range s.items {
		stats.TotalItems++
		stats.TotalQuantity += item.Quantity
		stats.TotalValue += item.Value * float64(item.Quantity)
		stats.ByCategory[string(item.Category)]++
	}
	return stats
}

// Reset clears all items and reloads demo data.
func (s *MemoryStore) Reset() {
	s.mu.Lock()
	s.items = make(map[string]*models.Item)
	s.mu.Unlock()
	s.seed()
}

// seed pre-populates the store with example items for demo purposes.
func (s *MemoryStore) seed() {
	seeds := []models.CreateItemRequest{
		{Name: "MacBook Pro", Description: "16-inch, M3 Pro chip", Category: models.CategoryElectronics, Value: 2499, Quantity: 1, Tags: []string{"laptop", "apple", "work"}},
		{Name: "Sony WH-1000XM5", Description: "Noise-cancelling headphones", Category: models.CategoryElectronics, Value: 349, Quantity: 1, Tags: []string{"audio", "sony"}},
		{Name: "Standing Desk", Description: "Electric sit-stand desk, 60x30", Category: models.CategoryFurniture, Value: 650, Quantity: 1, Tags: []string{"desk", "office"}},
		{Name: "The Pragmatic Programmer", Description: "20th Anniversary Edition", Category: models.CategoryBooks, Value: 50, Quantity: 1, Tags: []string{"programming", "career"}},
		{Name: "Nike Air Max 270", Description: "Size 11, black/white", Category: models.CategoryClothing, Value: 150, Quantity: 1, Tags: []string{"shoes", "nike"}},
	}
	for _, seed := range seeds {
		_, _ = s.Create(seed)
	}
}

func newID() string {
	b := make([]byte, 8)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
