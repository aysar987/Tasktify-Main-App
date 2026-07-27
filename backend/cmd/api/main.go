package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	"github.com/tasktify/tasktify/backend/internal/config"
	"github.com/tasktify/tasktify/backend/internal/database"
	httpserver "github.com/tasktify/tasktify/backend/internal/http"
	"github.com/tasktify/tasktify/backend/internal/repository"
)

func main() {
	_ = godotenv.Load()
	cfg := config.Load()

	ctx := context.Background()
	pool, err := database.Connect(ctx, cfg.DatabaseURL, cfg.DBMaxConns)
	if err != nil {
		log.Fatalf("database connection failed: %v", err)
	}
	defer pool.Close()

	if cfg.AutoMigrate {
		if err := database.Migrate(ctx, pool); err != nil {
			log.Fatalf("database migration failed: %v", err)
		}
		log.Print("database schema is up to date")
	}

	router := httpserver.NewServerWithStore(cfg, repository.NewPostgres(pool))
	server := &http.Server{
		Addr:              cfg.Address(),
		Handler:           router,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	go func() {
		log.Printf("Tasktify API listening on %s with Supabase Postgres", cfg.Address())
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("server failed: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("graceful shutdown failed: %v", err)
	}
}
