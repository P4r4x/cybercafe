package users

import (
	"context"
	"database/sql"
	"errors"
	"github.com/jackc/pgx/v5/pgconn"
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
			case "users_username_key":
				return RegisterResult{}, ErrUsernameExists
			case "users_email_key":
				return RegisterResult{}, ErrEmailExists
			case "users_phone_key":
				return RegisterResult{}, ErrPhoneExists
			case "users_userid_key":
				return RegisterResult{}, ErrUserIDExists
			}
		}
	}

	// 未知数据库错误
	return RegisterResult{}, err
}

func (p PostgresRepo) GetAccount(c context.Context, uid string) (*UserAccount, error) {

	const baseSQL = `
		SELECT uid, balance, exp, level, status, updated_at
		FROM user_account
		where uid = $1`

	var u UserAccount

	err := p.db.QueryRowContext(
		c,
		baseSQL,
		uid,
	).Scan(
		&u.UID,
		&u.Balance,
		&u.Exp,
		&u.Level,
		&u.Status,
	)

	if err != nil {
		return nil, err
	}

	return &u, nil
}

func (p PostgresRepo) GetBookshelf(uid string) ([]BookshelfItemDTO, error) {
	query := `
		SELECT
			b.id,
			b.title,
			b.author
		FROM user_bookshelf ub
		JOIN books b ON ub.book_id = b.id
		WHERE ub.uid = $1
		ORDER BY ub.created_at DESC
	`

	rows, err := p.db.Query(query, uid)
	if err != nil {
		return nil, err
	}
	defer func(rows *sql.Rows) {
		err := rows.Close()
		if err != nil {

		}
	}(rows)

	items := make([]BookshelfItemDTO, 0)

	for rows.Next() {
		var item BookshelfItemDTO
		if err := rows.Scan(
			&item.BookID,
			&item.Title,
			&item.Author,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

func (p PostgresRepo) AddBook(uid string, bookID string) error {
	query := `
		 INSERT INTO user_bookshelf (uid, book_id)
        VALUES ($1, $2)
        ON CONFLICT (uid, book_id) DO NOTHING
	`

	_, err := p.db.Exec(query, uid, bookID)
	if err != nil {
		return err
	}

	return nil
}
