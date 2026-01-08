package user

import (
	"CyberCafe/internal/infra/db"
	"time"
)

type User struct {
	ID        string     `json:"id" db:"id"`
	Username  string     `json:"username" db:"username" binding:"required"`
	Email     string     `json:"email" db:"email" binding:"required,email"`
	Password  string     `json:"-" db:"password_hash"` // 不在JSON中暴露，数据库存储哈希值
	Role      string     `json:"role" db:"role"`
	Extra     db.JSONMap `json:"extra" db:"extra"`
	LastLogin time.Time
}
