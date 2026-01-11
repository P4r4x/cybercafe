package auth

import (
	"database/sql"
	"errors"
	"golang.org/x/net/context"
)

type PostgresRepo struct {
	db *sql.DB
}

func NewPostgresRepo(db *sql.DB) CredentialRepo {
	return &PostgresRepo{
		db: db,
	}
}

// Find 获取登录凭证, 根据 username / email 查询
func (p PostgresRepo) Find(ctx context.Context, req LoginInfo) (*Credential, error) {

	// 预编译语句
	const (
		findByUsernameSQL = `
		SELECT id, password_hash, role
		FROM users
		WHERE username = $1
		LIMIT 1
	`

		findByEmailSQL = `
		SELECT id, password_hash, role
		FROM users
		WHERE email = $1
		LIMIT 1
	`
	)

	var cred Credential
	var row *sql.Row

	if req.Username != nil {
		row = p.db.QueryRowContext(
			ctx,
			findByUsernameSQL,
			*req.Username,
		)
	} else {
		row = p.db.QueryRowContext(
			ctx,
			findByEmailSQL,
			*req.Email,
		)
	}

	err := row.Scan(
		&cred.UserID,
		&cred.PasswordHash,
		&cred.Role,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			// 未找到用户
			return nil, nil
		}
		// 数据库错误
		return nil, err
	}

	return &cred, nil
}
