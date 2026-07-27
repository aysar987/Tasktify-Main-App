package http

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/tasktify/tasktify/backend/internal/config"
	"github.com/tasktify/tasktify/backend/internal/repository"
)

func NewServer(cfg config.Config) *gin.Engine {
	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	router := gin.New()
	router.Use(gin.Logger(), gin.Recovery(), cors(cfg.CORSOrigins))
	router.GET("/health", health)
	api := router.Group("/api/v1")
	api.GET("/health", health)
	NewHandler(repository.NewMemory()).RegisterRoutes(api)
	router.NoRoute(func(ctx *gin.Context) { fail(ctx, http.StatusNotFound, "route not found") })
	return router
}

func health(ctx *gin.Context) {
	ok(ctx, http.StatusOK, gin.H{"status": "ok", "service": "tasktify-api", "timestamp": time.Now().UTC()})
}

func cors(origins []string) gin.HandlerFunc {
	allowed := make(map[string]struct{}, len(origins))
	for _, origin := range origins {
		allowed[origin] = struct{}{}
	}
	return func(ctx *gin.Context) {
		origin := ctx.GetHeader("Origin")
		if _, found := allowed[origin]; found {
			ctx.Header("Access-Control-Allow-Origin", origin)
			ctx.Header("Vary", "Origin")
			ctx.Header("Access-Control-Allow-Credentials", "true")
		}
		ctx.Header("Access-Control-Allow-Headers", "Authorization, Content-Type")
		ctx.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		if ctx.Request.Method == http.MethodOptions {
			ctx.AbortWithStatus(http.StatusNoContent)
			return
		}
		ctx.Next()
	}
}
