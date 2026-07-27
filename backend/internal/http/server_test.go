package http

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/tasktify/tasktify/backend/internal/config"
)

func TestHealth(t *testing.T) {
	server := NewServer(config.Config{AppEnv: "test", CORSOrigins: []string{"http://localhost:3000"}})
	request := httptest.NewRequest(http.MethodGet, "/api/v1/health", nil)
	response := httptest.NewRecorder()
	server.ServeHTTP(response, request)
	if response.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", response.Code)
	}
}

func TestCreateAndListTask(t *testing.T) {
	server := NewServer(config.Config{AppEnv: "test"})
	body := []byte(`{"userId":"u1","title":"Tes listrik","category":"Listrik","location":"Jakarta","minBudget":100000,"maxBudget":300000,"schedule":"2026-08-01T09:00:00Z","note":"Kabel perlu dicek"}`)
	create := httptest.NewRequest(http.MethodPost, "/api/v1/tasks", bytes.NewReader(body))
	create.Header.Set("Content-Type", "application/json")
	createResponse := httptest.NewRecorder()
	server.ServeHTTP(createResponse, create)
	if createResponse.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", createResponse.Code, createResponse.Body.String())
	}
	list := httptest.NewRequest(http.MethodGet, "/api/v1/tasks?userId=u1&status=waiting", nil)
	listResponse := httptest.NewRecorder()
	server.ServeHTTP(listResponse, list)
	if listResponse.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", listResponse.Code)
	}
}
