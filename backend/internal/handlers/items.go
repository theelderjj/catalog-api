// Package handlers implements the HTTP handlers for the catalog API.
//
// EDUCATIONAL NOTES embedded in each handler explain:
//   - What makes each request stateless (all info is in the request itself)
//   - What state lives on the server side
//   - HTTP semantics: idempotency, safe methods, status codes
package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/your-org/catalog-api/internal/models"
	"github.com/your-org/catalog-api/internal/store"
)

type ItemHandler struct {
	store *store.MemoryStore
}

func NewItemHandler(s *store.MemoryStore) *ItemHandler {
	return &ItemHandler{store: s}
}

// CountRequests is middleware that increments the server's request counter.
// This counter is purely stateful — it exists only in server memory.
func (h *ItemHandler) CountRequests(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h.store.IncrementRequests()
		next.ServeHTTP(w, r)
	})
}

// ListItems handles GET /api/items
//
// STATELESS: The server doesn't need to know who you are or what you did before.
// Every call to this endpoint with the same data returns the same result.
// SAFE + IDEMPOTENT: GET never modifies data. Calling it 100 times = same as calling it once.
func (h *ItemHandler) ListItems(w http.ResponseWriter, r *http.Request) {
	// Optional filter by category query param — e.g. ?category=electronics
	category := r.URL.Query().Get("category")

	items := h.store.List()

	if category != "" {
		filtered := []models.Item{}
		for _, item := range items {
			if strings.EqualFold(string(item.Category), category) {
				filtered = append(filtered, item)
			}
		}
		items = filtered
	}

	if items == nil {
		items = []models.Item{}
	}

	respond(w, http.StatusOK, items)
}

// GetItem handles GET /api/items/{id}
//
// STATELESS: The ID in the URL is all the server needs — no session, no context from prior calls.
// SAFE + IDEMPOTENT: Reading the same item repeatedly has no side effects.
func (h *ItemHandler) GetItem(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	item, err := h.store.Get(id)
	if err != nil {
		respondError(w, http.StatusNotFound, "item not found", err.Error())
		return
	}
	respond(w, http.StatusOK, item)
}

// CreateItem handles POST /api/items
//
// NOT IDEMPOTENT: Calling this twice with the same body creates two items with different IDs.
// The server mutates its state — this is the "stateful" side of REST.
// Returns 201 Created with the new item (including server-generated ID and timestamps).
func (h *ItemHandler) CreateItem(w http.ResponseWriter, r *http.Request) {
	var req models.CreateItemRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid JSON body", err.Error())
		return
	}

	item, err := h.store.Create(req)
	if err != nil {
		respondError(w, http.StatusUnprocessableEntity, "validation failed", err.Error())
		return
	}

	// Location header tells the client where to find the new resource — REST convention
	w.Header().Set("Location", "/api/items/"+item.ID)
	respond(w, http.StatusCreated, item)
}

// UpdateItem handles PUT /api/items/{id}
//
// IDEMPOTENT: Sending the same PUT twice results in the same final state.
// NOT SAFE: It mutates server state.
// Uses partial update (PATCH semantics) for simplicity — only provided fields change.
func (h *ItemHandler) UpdateItem(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var req models.UpdateItemRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid JSON body", err.Error())
		return
	}

	item, err := h.store.Update(id, req)
	if err != nil {
		respondError(w, http.StatusNotFound, "item not found", err.Error())
		return
	}

	respond(w, http.StatusOK, item)
}

// DeleteItem handles DELETE /api/items/{id}
//
// IDEMPOTENT: Deleting something that's already gone still "succeeds" from the client's view.
// We return 404 here for clarity, but 204 would also be valid per REST conventions.
func (h *ItemHandler) DeleteItem(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.store.Delete(id); err != nil {
		respondError(w, http.StatusNotFound, "item not found", err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent) // 204: success, no body
}

// GetStats handles GET /api/stats
//
// STATEFUL DEMONSTRATION: The server aggregates data it holds in memory.
// The client can't compute this — it needs the server's view of all items.
// Also returns `requests_handled`, a purely server-side counter the client never sends.
func (h *ItemHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	respond(w, http.StatusOK, h.store.Stats())
}

// ResetStore handles POST /api/reset
//
// Educational endpoint: wipes all items and reloads demo data.
// Demonstrates that server state is independent of any individual client.
func (h *ItemHandler) ResetStore(w http.ResponseWriter, r *http.Request) {
	h.store.Reset()
	respond(w, http.StatusOK, map[string]string{"message": "store reset to demo data"})
}

// ── helpers ────────────────────────────────────────────────────────────────

type errorResponse struct {
	Error   string `json:"error"`
	Detail  string `json:"detail,omitempty"`
	Status  int    `json:"status"`
}

func respond(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

func respondError(w http.ResponseWriter, status int, msg, detail string) {
	respond(w, status, errorResponse{Error: msg, Detail: detail, Status: status})
}
