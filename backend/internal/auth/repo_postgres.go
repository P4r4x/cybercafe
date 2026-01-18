package auth

import (
	"context"
	"database/sql"
	"errors"
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
		SELECT id, userid, password_hash, role, status
		FROM users
		WHERE username = $1
		LIMIT 1
	`

		findByEmailSQL = `
		SELECT id, userid, password_hash, role, status
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
		&cred.UUID,
		&cred.UserID,
		&cred.PasswordHash,
		&cred.Role,
		&cred.Status,
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
