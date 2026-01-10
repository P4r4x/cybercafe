package users

import (
	"database/sql"
	"errors"
	"github.com/jackc/pgx/v5/pgconn"
	"golang.org/x/net/context"
)

type PostgresRepo struct {
	db *sql.DB
}

func NewPostgresRepo(db *sql.DB) UserRepo {
	return &PostgresRepo{
		db: db,
	}
}

// ====== 报错处理 ======

var (
	ErrUsernameExists = errors.New("username already exists")
	ErrEmailExists    = errors.New("email already exists")
	ErrPhoneExists    = errors.New("phone already exists")
	ErrUserIDExists   = errors.New("userid already exists")
)

func (p PostgresRepo) Register(c context.Context, d *RegisterInfoDetail) (RegisterResult, error) {

	const baseSQL = `
        INSERT INTO users (
            id,
            username,
            userid,
            email,
            phone,
            password_hash
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING userid;
    `

	var userID string

	err := p.db.QueryRowContext(
		c,
		baseSQL,
		d.ID, // UUID
		d.Username,
		d.UserID, // 你生成的 9+ 位数字
		d.Email,
		d.Phone, // *string / sql.NullString
		d.PasswordHash,
	).Scan(&userID)

	if err == nil {
		return RegisterResult{UserID: userID}, nil
	}

	// ----- 解析 postgres 错误 -----
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		// unique_violation
		if pgErr.Code == "23505" {
			switch pgErr.ConstraintName {
			case "uk_users_username":
				return RegisterResult{}, ErrUsernameExists
			case "uk_users_email":
				return RegisterResult{}, ErrEmailExists
			case "uk_users_phone":
				return RegisterResult{}, ErrPhoneExists
			case "uk_users_userid":
				return RegisterResult{}, errors.New("userid collision")
			}
		}
	}

	// 未知数据库错误
	return RegisterResult{}, err
}
