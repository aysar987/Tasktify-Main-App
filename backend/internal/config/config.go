package config

import (
	"os"
	"strconv"
	"strings"
)

type Config struct {
	AppEnv      string
	Port        string
	DatabaseURL string
	DBMaxConns  int32
	AutoMigrate bool
	CORSOrigins []string
}

func Load() Config {
	return Config{
		AppEnv:      value("APP_ENV", "development"),
		Port:        value("PORT", "4000"),
		DatabaseURL: os.Getenv("DATABASE_URL"),
		DBMaxConns:  int32Value("DB_MAX_CONNS", 10),
		AutoMigrate: boolValue("DB_AUTO_MIGRATE", false),
		CORSOrigins: split(value("CORS_ORIGINS", "http://localhost:3000")),
	}
}

func int32Value(key string, fallback int32) int32 {
	value, err := strconv.ParseInt(os.Getenv(key), 10, 32)
	if err != nil || value < 1 {
		return fallback
	}
	return int32(value)
}

func boolValue(key string, fallback bool) bool {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	parsed, err := strconv.ParseBool(value)
	if err != nil {
		return fallback
	}
	return parsed
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
