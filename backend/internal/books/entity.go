package books

import (
	"CyberCafe/backend/internal/infra/db"
	"github.com/jackc/pgx/v5/pgtype"
	"time"
)

type BookID string

type JSONMap map[string]string

type Book struct {
	UUID      pgtype.UUID `json:"uuid"`
	Id        BookID      `json:"id"`
	Total     int         `json:"total"`
	Remain    int         `json:"remain"`
	Title     string      `json:"title"`
	Author    string      `json:"author"`
	Publisher string      `json:"publisher"`
	Price     float64     `json:"price"`
	Extra     db.JSONMap  `json:"extra"`
	CreateAt  time.Time   `json:"created_at"`
	UpdateAt  time.Time   `json:"updated_at"`
}
