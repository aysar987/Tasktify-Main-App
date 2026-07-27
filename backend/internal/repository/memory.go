package repository

import (
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/tasktify/tasktify/backend/internal/domain"
)

var ErrNotFound = errors.New("resource not found")

type Memory struct {
	mu            sync.RWMutex
	users         map[string]domain.User
	providers     []domain.Provider
	tasks         map[string]domain.Task
	banners       []domain.Banner
	conversations []domain.Conversation
	nextUser      int
	nextTask      int
}

func NewMemory() *Memory {
	providers := []domain.Provider{
		{ID: "p1", Name: "Ari Staprans", Title: "Teknisi Listrik Senior", Category: "Listrik", Location: "Makassar", Rating: 4.9, Jobs: 128, Verified: true, PriceFrom: 150000, Initials: "AS"},
		{ID: "p2", Name: "Keisha Mahira", Title: "Electrical Engineer", Category: "Listrik", Location: "Jakarta Selatan", Rating: 4.8, Jobs: 96, Verified: true, PriceFrom: 200000, Initials: "KM"},
		{ID: "p3", Name: "Budi Santoso", Title: "Spesialis Plumbing", Category: "Plumbing", Location: "Jakarta Barat", Rating: 4.7, Jobs: 211, Verified: true, PriceFrom: 125000, Initials: "BS"},
		{ID: "p4", Name: "Nadia Putri", Title: "Teknisi AC & Cooling", Category: "AC", Location: "Tangerang", Rating: 4.9, Jobs: 154, Verified: true, PriceFrom: 175000, Initials: "NP"},
	}
	user := domain.User{ID: "u1", Username: "matthew.a", Phone: "+6281234567890", Email: "matthew.alden@email.com", Password: "password123", Address: "Jakarta Pusat", Verified: true, CreatedAt: time.Now()}
	tasks := map[string]domain.Task{
		"TSK-1048": {ID: "TSK-1048", UserID: "u1", Title: "Perbaiki korsleting dapur", Category: "Listrik", Location: "Kebayoran Baru, Jakarta", MinBudget: 200000, MaxBudget: 350000, Schedule: time.Now().Add(2 * time.Hour), Note: "Listrik sering turun saat microwave dinyalakan.", Status: "ongoing", ProviderID: "p1", CreatedAt: time.Now()},
		"TSK-1049": {ID: "TSK-1049", UserID: "u1", Title: "Servis AC kamar utama", Category: "AC", Location: "Menteng, Jakarta", MinBudget: 200000, MaxBudget: 275000, Schedule: time.Now().Add(48 * time.Hour), Note: "AC tidak dingin.", Status: "scheduled", ProviderID: "p4", CreatedAt: time.Now()},
	}
	return &Memory{
		users: map[string]domain.User{"u1": user}, providers: providers, tasks: tasks,
		banners:       []domain.Banner{{ID: "b1", Name: "Bantuan cepat untuk rumah Anda", Image: "/banners/home-service.webp"}},
		conversations: []domain.Conversation{{ID: "c1", UserID: "u1", ProviderID: "p1", LastMessage: "Saya sudah dalam perjalanan.", UpdatedAt: time.Now()}},
		nextUser:      2, nextTask: 1050,
	}
}

func (m *Memory) CreateUser(user domain.User) (domain.User, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	for _, current := range m.users {
		if current.Username == user.Username || current.Phone == user.Phone {
			return domain.User{}, errors.New("username or phone already registered")
		}
	}
	user.ID = fmt.Sprintf("u%d", m.nextUser)
	m.nextUser++
	user.CreatedAt = time.Now()
	m.users[user.ID] = user
	return user, nil
}

func (m *Memory) Authenticate(identifier, password string) (domain.User, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	for _, user := range m.users {
		if (user.Username == identifier || user.Email == identifier || user.Phone == identifier) && user.Password == password {
			return user, nil
		}
	}
	return domain.User{}, ErrNotFound
}

func (m *Memory) User(id string) (domain.User, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	user, ok := m.users[id]
	if !ok {
		return domain.User{}, ErrNotFound
	}
	return user, nil
}

func (m *Memory) UpdateUser(id string, update domain.User) (domain.User, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	user, ok := m.users[id]
	if !ok {
		return domain.User{}, ErrNotFound
	}
	if update.Username != "" {
		user.Username = update.Username
	}
	if update.Phone != "" {
		user.Phone = update.Phone
	}
	if update.Email != "" {
		user.Email = update.Email
	}
	if update.Address != "" {
		user.Address = update.Address
	}
	m.users[id] = user
	return user, nil
}

func (m *Memory) VerifyUser(id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	user, ok := m.users[id]
	if !ok {
		return ErrNotFound
	}
	user.Verified = true
	m.users[id] = user
	return nil
}

func (m *Memory) Providers(query, category string) ([]domain.Provider, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	result := make([]domain.Provider, 0)
	query = strings.ToLower(query)
	for _, provider := range m.providers {
		haystack := strings.ToLower(provider.Name + " " + provider.Title + " " + provider.Location)
		if (query == "" || strings.Contains(haystack, query)) && (category == "" || strings.EqualFold(category, "Semua") || strings.EqualFold(provider.Category, category)) {
			result = append(result, provider)
		}
	}
	return result, nil
}

func (m *Memory) CreateTask(task domain.Task) (domain.Task, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	task.ID = fmt.Sprintf("TSK-%d", m.nextTask)
	m.nextTask++
	task.Status = "waiting"
	task.CreatedAt = time.Now()
	m.tasks[task.ID] = task
	return task, nil
}

func (m *Memory) Tasks(userID, status string) ([]domain.Task, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	result := make([]domain.Task, 0)
	for _, task := range m.tasks {
		if (userID == "" || task.UserID == userID) && (status == "" || task.Status == status) {
			result = append(result, task)
		}
	}
	return result, nil
}

func (m *Memory) Task(id string) (domain.Task, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	task, ok := m.tasks[id]
	if !ok {
		return domain.Task{}, ErrNotFound
	}
	return task, nil
}

func (m *Memory) UpdateTaskStatus(id, status string) (domain.Task, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	task, ok := m.tasks[id]
	if !ok {
		return domain.Task{}, ErrNotFound
	}
	task.Status = status
	m.tasks[id] = task
	return task, nil
}

func (m *Memory) Banners() ([]domain.Banner, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return append([]domain.Banner(nil), m.banners...), nil
}

func (m *Memory) Conversations(userID string) ([]domain.Conversation, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	result := make([]domain.Conversation, 0)
	for _, item := range m.conversations {
		if item.UserID == userID {
			result = append(result, item)
		}
	}
	return result, nil
}
