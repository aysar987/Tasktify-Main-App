package http

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/tasktify/tasktify/backend/internal/config"
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
	registerRoutes(api)

	return router
}

func health(ctx *gin.Context) {
	ctx.JSON(http.StatusOK, gin.H{
		"status":    "ok",
		"service":   "tasktify-api",
		"timestamp": time.Now().UTC(),
	})
}

func registerRoutes(api *gin.RouterGroup) {
	resources := []string{"auth", "users", "taskers", "tasks", "bids", "reviews", "payments"}
	for _, resource := range resources {
		path := "/" + resource
		api.Any(path, pending(resource))
		api.Any(path+"/*path", pending(resource))
	}
}

func pending(resource string) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		ctx.JSON(http.StatusNotImplemented, gin.H{
			"status":  http.StatusNotImplemented,
			"message": resource + " module is scaffolded and pending migration",
		})
	}
}

func cors(origins []string) gin.HandlerFunc {
	allowed := make(map[string]struct{}, len(origins))
	for _, origin := range origins {
		allowed[origin] = struct{}{}
	}

	return func(ctx *gin.Context) {
		origin := ctx.GetHeader("Origin")
		if _, ok := allowed[origin]; ok {
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
