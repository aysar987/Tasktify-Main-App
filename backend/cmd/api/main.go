package main

import (
	"log"

	"github.com/joho/godotenv"
	"github.com/tasktify/tasktify/backend/internal/config"
	httpserver "github.com/tasktify/tasktify/backend/internal/http"
)

func main() {
	_ = godotenv.Load()

	cfg := config.Load()
	server := httpserver.NewServer(cfg)

	log.Printf("Tasktify API listening on %s", cfg.Address())
	if err := server.Run(cfg.Address()); err != nil {
		log.Fatal(err)
	}
}
