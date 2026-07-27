package domain

import "time"

type User struct {
	ID        string    `json:"id"`
	Username  string    `json:"username"`
	Phone     string    `json:"phone"`
	Email     string    `json:"email,omitempty"`
	Password  string    `json:"-"`
	Address   string    `json:"address"`
	Verified  bool      `json:"verified"`
	CreatedAt time.Time `json:"createdAt"`
}

type Provider struct {
	ID        string  `json:"id"`
	Name      string  `json:"name"`
	Title     string  `json:"title"`
	Category  string  `json:"category"`
	Location  string  `json:"location"`
	Rating    float64 `json:"rating"`
	Jobs      int     `json:"jobs"`
	Verified  bool    `json:"verified"`
	PriceFrom int     `json:"priceFrom"`
	Initials  string  `json:"initials"`
}

type Task struct {
	ID         string    `json:"id"`
	UserID     string    `json:"userId"`
	Title      string    `json:"title"`
	Category   string    `json:"category"`
	Location   string    `json:"location"`
	MinBudget  int       `json:"minBudget"`
	MaxBudget  int       `json:"maxBudget"`
	Schedule   time.Time `json:"schedule"`
	Note       string    `json:"note"`
	Status     string    `json:"status"`
	ProviderID string    `json:"providerId,omitempty"`
	CreatedAt  time.Time `json:"createdAt"`
}

type Banner struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Image string `json:"image"`
}

type Conversation struct {
	ID          string    `json:"id"`
	UserID      string    `json:"userId"`
	ProviderID  string    `json:"providerId"`
	LastMessage string    `json:"lastMessage"`
	UpdatedAt   time.Time `json:"updatedAt"`
}
