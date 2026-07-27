package http

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/tasktify/tasktify/backend/internal/domain"
	"github.com/tasktify/tasktify/backend/internal/repository"
)

type Handler struct{ store repository.Store }

func NewHandler(store repository.Store) *Handler { return &Handler{store: store} }

func (h *Handler) RegisterRoutes(api *gin.RouterGroup) {
	api.POST("/auth/register", h.register)
	api.POST("/auth/login", h.login)
	api.POST("/auth/reset-password", h.resetPassword)
	api.POST("/auth/verify", h.verify)
	api.GET("/users/:id", h.user)
	api.PATCH("/users/:id", h.updateUser)
	api.GET("/providers", h.providers)
	api.GET("/tasks", h.tasks)
	api.POST("/tasks", h.createTask)
	api.GET("/tasks/:id", h.task)
	api.PATCH("/tasks/:id/status", h.updateTaskStatus)
	api.GET("/banners", h.banners)
	api.GET("/conversations", h.conversations)
}

func ok(ctx *gin.Context, status int, data any) {
	ctx.JSON(status, gin.H{"success": true, "data": data})
}
func fail(ctx *gin.Context, status int, message string) {
	ctx.JSON(status, gin.H{"success": false, "message": message})
}

func (h *Handler) register(ctx *gin.Context) {
	var input struct {
		Username string `json:"username" binding:"required"`
		Phone    string `json:"phone" binding:"required"`
		Email    string `json:"email"`
		Password string `json:"password" binding:"required,min=8"`
	}
	if err := ctx.ShouldBindJSON(&input); err != nil {
		fail(ctx, http.StatusBadRequest, "username, phone, and password are required")
		return
	}
	user, err := h.store.CreateUser(domain.User{Username: input.Username, Phone: input.Phone, Email: input.Email, Password: input.Password})
	if err != nil {
		fail(ctx, http.StatusConflict, err.Error())
		return
	}
	ok(ctx, http.StatusCreated, gin.H{"user": user, "verificationRequired": true})
}

func (h *Handler) login(ctx *gin.Context) {
	var input struct {
		Identifier string `json:"identifier" binding:"required"`
		Password   string `json:"password" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&input); err != nil {
		fail(ctx, http.StatusBadRequest, "identifier and password are required")
		return
	}
	user, err := h.store.Authenticate(input.Identifier, input.Password)
	if err != nil {
		fail(ctx, http.StatusUnauthorized, "invalid credentials")
		return
	}
	ok(ctx, http.StatusOK, gin.H{"user": user, "accessToken": fmt.Sprintf("tasktify-demo-%s", user.ID)})
}

func (h *Handler) resetPassword(ctx *gin.Context) {
	var input struct {
		Email string `json:"email" binding:"required,email"`
	}
	if err := ctx.ShouldBindJSON(&input); err != nil {
		fail(ctx, http.StatusBadRequest, "valid email is required")
		return
	}
	ok(ctx, http.StatusOK, gin.H{"message": "password reset instructions sent"})
}

func (h *Handler) verify(ctx *gin.Context) {
	var input struct {
		UserID string `json:"userId" binding:"required"`
		Code   string `json:"code" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&input); err != nil || len(input.Code) < 4 {
		fail(ctx, http.StatusBadRequest, "valid userId and verification code are required")
		return
	}
	if err := h.store.VerifyUser(input.UserID); err != nil {
		fail(ctx, http.StatusNotFound, err.Error())
		return
	}
	ok(ctx, http.StatusOK, gin.H{"verified": true})
}

func (h *Handler) user(ctx *gin.Context) {
	user, err := h.store.User(ctx.Param("id"))
	if err != nil {
		fail(ctx, http.StatusNotFound, err.Error())
		return
	}
	ok(ctx, http.StatusOK, user)
}

func (h *Handler) updateUser(ctx *gin.Context) {
	var input domain.User
	if err := ctx.ShouldBindJSON(&input); err != nil {
		fail(ctx, http.StatusBadRequest, "invalid profile payload")
		return
	}
	user, err := h.store.UpdateUser(ctx.Param("id"), input)
	if err != nil {
		fail(ctx, http.StatusNotFound, err.Error())
		return
	}
	ok(ctx, http.StatusOK, user)
}

func (h *Handler) providers(ctx *gin.Context) {
	providers, err := h.store.Providers(ctx.Query("q"), ctx.Query("category"))
	if err != nil {
		fail(ctx, http.StatusInternalServerError, "failed to load providers")
		return
	}
	ok(ctx, http.StatusOK, providers)
}
func (h *Handler) tasks(ctx *gin.Context) {
	tasks, err := h.store.Tasks(ctx.Query("userId"), ctx.Query("status"))
	if err != nil {
		fail(ctx, http.StatusInternalServerError, "failed to load tasks")
		return
	}
	ok(ctx, http.StatusOK, tasks)
}

func (h *Handler) createTask(ctx *gin.Context) {
	var input struct {
		UserID    string `json:"userId"`
		Title     string `json:"title" binding:"required"`
		Category  string `json:"category" binding:"required"`
		Location  string `json:"location" binding:"required"`
		MinBudget int    `json:"minBudget"`
		MaxBudget int    `json:"maxBudget" binding:"required,min=1"`
		Schedule  string `json:"schedule" binding:"required"`
		Note      string `json:"note" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&input); err != nil {
		fail(ctx, http.StatusBadRequest, "complete task details are required")
		return
	}
	schedule, err := time.Parse(time.RFC3339, input.Schedule)
	if err != nil {
		fail(ctx, http.StatusBadRequest, "schedule must use RFC3339 format")
		return
	}
	if input.UserID == "" {
		fail(ctx, http.StatusBadRequest, "userId is required")
		return
	}
	task, err := h.store.CreateTask(domain.Task{UserID: input.UserID, Title: input.Title, Category: input.Category, Location: input.Location, MinBudget: input.MinBudget, MaxBudget: input.MaxBudget, Schedule: schedule, Note: input.Note})
	if err != nil {
		fail(ctx, http.StatusInternalServerError, "failed to create task")
		return
	}
	ok(ctx, http.StatusCreated, task)
}

func (h *Handler) task(ctx *gin.Context) {
	task, err := h.store.Task(ctx.Param("id"))
	if err != nil {
		fail(ctx, http.StatusNotFound, err.Error())
		return
	}
	ok(ctx, http.StatusOK, task)
}

func (h *Handler) updateTaskStatus(ctx *gin.Context) {
	var input struct {
		Status string `json:"status" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&input); err != nil {
		fail(ctx, http.StatusBadRequest, "status is required")
		return
	}
	allowed := "|waiting|ongoing|scheduled|history|cancelled|"
	if !strings.Contains(allowed, "|"+input.Status+"|") {
		fail(ctx, http.StatusBadRequest, "unsupported task status")
		return
	}
	task, err := h.store.UpdateTaskStatus(ctx.Param("id"), input.Status)
	if err != nil {
		fail(ctx, http.StatusNotFound, err.Error())
		return
	}
	ok(ctx, http.StatusOK, task)
}

func (h *Handler) banners(ctx *gin.Context) {
	banners, err := h.store.Banners()
	if err != nil {
		fail(ctx, http.StatusInternalServerError, "failed to load banners")
		return
	}
	ok(ctx, http.StatusOK, banners)
}
func (h *Handler) conversations(ctx *gin.Context) {
	userID := ctx.Query("userId")
	if userID == "" {
		fail(ctx, http.StatusBadRequest, "userId is required")
		return
	}
	conversations, err := h.store.Conversations(userID)
	if err != nil {
		fail(ctx, http.StatusInternalServerError, "failed to load conversations")
		return
	}
	ok(ctx, http.StatusOK, conversations)
}
