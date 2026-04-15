package main

import (
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/your-org/catalog-api/internal/handlers"
	"github.com/your-org/catalog-api/internal/store"
)

func main() {
	s := store.NewMemoryStore()
	h := handlers.NewItemHandler(s)

	r := chi.NewRouter()

	// Middleware
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.RealIP)

	// CORS — allow the Vite dev server and any configured frontend URL
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173"
	}
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{frontendURL},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"Accept", "Content-Type"},
	}))

	// Count every request for the stats endpoint demo
	r.Use(h.CountRequests)

	// Routes
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok"}`))
	})

	r.Route("/api", func(r chi.Router) {
		// Items — full CRUD
		r.Get("/items", h.ListItems)           // GET    (safe, idempotent)
		r.Post("/items", h.CreateItem)          // POST   (not idempotent)
		r.Get("/items/{id}", h.GetItem)         // GET    (safe, idempotent)
		r.Put("/items/{id}", h.UpdateItem)      // PUT    (idempotent, not safe)
		r.Delete("/items/{id}", h.DeleteItem)   // DELETE (idempotent, not safe)

		// Educational endpoints
		r.Get("/stats", h.GetStats)    // shows server-side state
		r.Post("/reset", h.ResetStore) // resets to demo data
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("catalog-api listening on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}
