package users

import (
	"CyberCafe/backend/internal/infra/db"
	"github.com/shopspring/decimal"
	"time"
)

// User 用户基本数据
type User struct {
	ID       string `db:"id" json:"id"`
	Username string `db:"username" json:"username"`
	Nickname string `db:"nickname" json:"nickname"`
	Email    string `db:"email" json:"email"`
	Phone    string `db:"phone" json:"phone"`

	PasswordHash string `db:"password_hash" json:"-"`

	Role      string  `db:"role" json:"role"`
	UserGroup *string `db:"user_group" json:"user_group,omitempty"`

	Extra db.JSONMap `db:"extra" json:"extra"`

	LastLoginAt *time.Time `db:"last_login_at" json:"last_login_at"`
	CreatedAt   time.Time  `db:"created_at" json:"created_at"`
}

// UserAccount 账户信息
type UserAccount struct {
	UID       string          `db:"uid"`
	Balance   decimal.Decimal `db:"balance"`
	Exp       int64           `db:"exp"`
	Level     int             `db:"level"`
	Status    int             `db:"status"`
	UpdatedAt time.Time       `db:"updated_at"`
}

type RegisterInfo struct {
	Username string  `json:"username" binding:"required"`
	Password string  `json:"password" binding:"required"`
	Email    string  `json:"email" binding:"required,email"`
	Phone    *string `json:"phone"`
}

type RegisterInfoDetail struct {
	ID           string
	UserID       string
	Username     string
	Email        string
	Phone        string
	PasswordHash string
}

type RegisterResult struct {
	UserID string `json:"user_id"`
}

// 获取书架参数

type BookshelfItemDTO struct {
	BookID string
	Title  string
	Author string
}

type Pagination struct {
	Page       int `json:"page"`
	PageSize   int `json:"pageSize"`
	Total      int `json:"total"`
	TotalPages int `json:"totalPages"`
}

type BookshelfResponse struct {
	Items      []BookshelfItemDTO `json:"items"`
	Pagination Pagination         `json:"pagination"`
}
