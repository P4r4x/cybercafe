package users

import (
	"CyberCafe/backend/internal/infra/db"
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
// TODO 待完善
type UserAccount struct {
	UserID    string    `db:"user_id"`
	Balance   int64     `db:"balance"`
	UpdatedAt time.Time `db:"updated_at"`
}

// UserMembership 会员信息
// TODO 待完善
type UserMembership struct {
	UserID string `db:"user_id"`
	Level  int    `db:"level"`
	Exp    int64  `db:"exp"`
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
