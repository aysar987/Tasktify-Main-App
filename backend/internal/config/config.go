package config

import (
	"os"
	"strings"
)

type Config struct {
	AppEnv      string
	Port        string
	DatabaseURL string
	CORSOrigins []string
}

func Load() Config {
	return Config{
		AppEnv:      value("APP_ENV", "development"),
		Port:        value("PORT", "4000"),
		DatabaseURL: os.Getenv("DATABASE_URL"),
		CORSOrigins: split(value("CORS_ORIGINS", "http://localhost:3000")),
	}
}

func (c Config) Address() string {
	return ":" + c.Port
}

func value(key, fallback string) string {
	if current := os.Getenv(key); current != "" {
		return current
	}
	return fallback
}

func split(value string) []string {
	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		if trimmed := strings.TrimSpace(part); trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}
