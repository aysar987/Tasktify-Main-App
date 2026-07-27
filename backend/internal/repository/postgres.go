package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"

	"github.com/tasktify/tasktify/backend/internal/domain"
)

type Postgres struct {
	pool *pgxpool.Pool
}

func NewPostgres(pool *pgxpool.Pool) *Postgres {
	return &Postgres{pool: pool}
}

func normalizeError(err error) error {
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	}
	return err
}

func scanUser(row pgx.Row) (domain.User, error) {
	var user domain.User
	err := row.Scan(&user.ID, &user.Username, &user.Phone, &user.Email, &user.Password, &user.Address, &user.Verified, &user.CreatedAt)
	return user, normalizeError(err)
}

func (p *Postgres) CreateUser(user domain.User) (domain.User, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return domain.User{}, fmt.Errorf("hash password: %w", err)
	}
	return scanUser(p.pool.QueryRow(context.Background(), `
		INSERT INTO users (username, phone, email, password_hash, address)
		VALUES ($1, $2, NULLIF($3, ''), $4, $5)
		RETURNING id::text, username, phone, COALESCE(email, ''), password_hash,
		          address, verified, created_at`,
		user.Username, user.Phone, user.Email, string(hash), user.Address,
	))
}

func (p *Postgres) Authenticate(identifier, password string) (domain.User, error) {
	user, err := scanUser(p.pool.QueryRow(context.Background(), `
		SELECT id::text, username, phone, COALESCE(email, ''), password_hash,
		       address, verified, created_at
		FROM users
		WHERE username = $1 OR phone = $1 OR email = $1
		LIMIT 1`, identifier,
	))
	if err != nil {
		return domain.User{}, err
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return domain.User{}, ErrNotFound
	}
	return user, nil
}

func (p *Postgres) User(id string) (domain.User, error) {
	return scanUser(p.pool.QueryRow(context.Background(), `
		SELECT id::text, username, phone, COALESCE(email, ''), password_hash,
		       address, verified, created_at
		FROM users WHERE id = $1`, id,
	))
}

func (p *Postgres) UpdateUser(id string, update domain.User) (domain.User, error) {
	return scanUser(p.pool.QueryRow(context.Background(), `
		UPDATE users
		SET username = COALESCE(NULLIF($2, ''), username),
		    phone = COALESCE(NULLIF($3, ''), phone),
		    email = COALESCE(NULLIF($4, ''), email),
		    address = COALESCE(NULLIF($5, ''), address)
		WHERE id = $1
		RETURNING id::text, username, phone, COALESCE(email, ''), password_hash,
		          address, verified, created_at`,
		id, update.Username, update.Phone, update.Email, update.Address,
	))
}

func (p *Postgres) VerifyUser(id string) error {
	tag, err := p.pool.Exec(context.Background(), `UPDATE users SET verified = TRUE WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (p *Postgres) Providers(query, category string) ([]domain.Provider, error) {
	rows, err := p.pool.Query(context.Background(), `
		SELECT id::text, name, title, category, location, rating, jobs,
		       verified, price_from, initials
		FROM providers
		WHERE ($1 = '' OR name ILIKE '%' || $1 || '%' OR title ILIKE '%' || $1 || '%' OR location ILIKE '%' || $1 || '%')
		  AND ($2 = '' OR LOWER($2) = 'semua' OR LOWER(category) = LOWER($2))
		ORDER BY rating DESC, jobs DESC`, query, category,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := make([]domain.Provider, 0)
	for rows.Next() {
		var provider domain.Provider
		if err := rows.Scan(&provider.ID, &provider.Name, &provider.Title, &provider.Category, &provider.Location, &provider.Rating, &provider.Jobs, &provider.Verified, &provider.PriceFrom, &provider.Initials); err != nil {
			return nil, err
		}
		result = append(result, provider)
	}
	return result, rows.Err()
}

func (p *Postgres) CreateTask(task domain.Task) (domain.Task, error) {
	err := p.pool.QueryRow(context.Background(), `
		INSERT INTO tasks (user_id, title, category, location, min_budget, max_budget, schedule, note)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, status, created_at`,
		task.UserID, task.Title, task.Category, task.Location, task.MinBudget, task.MaxBudget, task.Schedule, task.Note,
	).Scan(&task.ID, &task.Status, &task.CreatedAt)
	return task, normalizeError(err)
}

func scanTask(row pgx.Row) (domain.Task, error) {
	var task domain.Task
	err := row.Scan(&task.ID, &task.UserID, &task.Title, &task.Category, &task.Location, &task.MinBudget, &task.MaxBudget, &task.Schedule, &task.Note, &task.Status, &task.ProviderID, &task.CreatedAt)
	return task, normalizeError(err)
}

func (p *Postgres) Tasks(userID, status string) ([]domain.Task, error) {
	rows, err := p.pool.Query(context.Background(), `
		SELECT id, user_id::text, title, category, location, min_budget, max_budget,
		       schedule, note, status, COALESCE(provider_id::text, ''), created_at
		FROM tasks
		WHERE ($1 = '' OR user_id = NULLIF($1, '')::uuid)
		  AND ($2 = '' OR status = $2)
		ORDER BY created_at DESC`, userID, status,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := make([]domain.Task, 0)
	for rows.Next() {
		var task domain.Task
		if err := rows.Scan(&task.ID, &task.UserID, &task.Title, &task.Category, &task.Location, &task.MinBudget, &task.MaxBudget, &task.Schedule, &task.Note, &task.Status, &task.ProviderID, &task.CreatedAt); err != nil {
			return nil, err
		}
		result = append(result, task)
	}
	return result, rows.Err()
}

func (p *Postgres) Task(id string) (domain.Task, error) {
	return scanTask(p.pool.QueryRow(context.Background(), `
		SELECT id, user_id::text, title, category, location, min_budget, max_budget,
		       schedule, note, status, COALESCE(provider_id::text, ''), created_at
		FROM tasks WHERE id = $1`, id,
	))
}

func (p *Postgres) UpdateTaskStatus(id, status string) (domain.Task, error) {
	return scanTask(p.pool.QueryRow(context.Background(), `
		UPDATE tasks SET status = $2 WHERE id = $1
		RETURNING id, user_id::text, title, category, location, min_budget, max_budget,
		          schedule, note, status, COALESCE(provider_id::text, ''), created_at`, id, status,
	))
}

func (p *Postgres) Banners() ([]domain.Banner, error) {
	rows, err := p.pool.Query(context.Background(), `SELECT id::text, name, image FROM banners ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := make([]domain.Banner, 0)
	for rows.Next() {
		var banner domain.Banner
		if err := rows.Scan(&banner.ID, &banner.Name, &banner.Image); err != nil {
			return nil, err
		}
		result = append(result, banner)
	}
	return result, rows.Err()
}

func (p *Postgres) Conversations(userID string) ([]domain.Conversation, error) {
	rows, err := p.pool.Query(context.Background(), `
		SELECT id::text, user_id::text, provider_id::text, last_message, updated_at
		FROM conversations
		WHERE user_id = $1
		ORDER BY updated_at DESC`, userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := make([]domain.Conversation, 0)
	for rows.Next() {
		var item domain.Conversation
		if err := rows.Scan(&item.ID, &item.UserID, &item.ProviderID, &item.LastMessage, &item.UpdatedAt); err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	return result, rows.Err()
}

func IsUniqueViolation(err error) bool {
	return strings.Contains(strings.ToLower(err.Error()), "duplicate key")
}

var _ Store = (*Postgres)(nil)
var _ Store = (*Memory)(nil)
