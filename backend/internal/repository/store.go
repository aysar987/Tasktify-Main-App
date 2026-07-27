package repository

import "github.com/tasktify/tasktify/backend/internal/domain"

type Store interface {
	CreateUser(user domain.User) (domain.User, error)
	Authenticate(identifier, password string) (domain.User, error)
	User(id string) (domain.User, error)
	UpdateUser(id string, update domain.User) (domain.User, error)
	VerifyUser(id string) error
	Providers(query, category string) ([]domain.Provider, error)
	CreateTask(task domain.Task) (domain.Task, error)
	Tasks(userID, status string) ([]domain.Task, error)
	Task(id string) (domain.Task, error)
	UpdateTaskStatus(id, status string) (domain.Task, error)
	Banners() ([]domain.Banner, error)
	Conversations(userID string) ([]domain.Conversation, error)
}
