package users

import (
	"context"
	"database/sql"
	"errors"
	"github.com/jackc/pgx/v5/pgconn"
	"time"
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

// Register 注册, 向 users 和 user_account 表中插入数据
func (p PostgresRepo) Register(c context.Context, d *RegisterInfoDetail) (RegisterResult, error) {

	// 涉及多条查询的事务时, 使用独立的 ctx
	ctx, cancel := context.WithTimeout(context.Background(), 9999*time.Second)
	defer cancel()

	tx, err := p.db.BeginTx(ctx, &sql.TxOptions{
		Isolation: sql.LevelReadCommitted,
	})
	if err != nil {
		return RegisterResult{}, err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	// ---------- 1. 插入 users ----------
	const insertUserSQL = `
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
	err = tx.QueryRowContext(
		ctx,
		insertUserSQL,
		d.ID,
		d.Username,
		d.UserID,
		d.Email,
		d.Phone,
		d.PasswordHash,
	).Scan(&userID)

	if err != nil {
		return RegisterResult{}, parsePgRegisterError(err)
	}

	// ---------- 2. 初始化 user_account ----------
	const insertAccountSQL = `
		INSERT INTO user_account (
			uid,
			balance,
			exp,
			level,
			status
		)
		VALUES ($1, 0, 0, 1, 'active');
	`

	_, err = tx.ExecContext(ctx, insertAccountSQL, userID)
	if err != nil {
		return RegisterResult{}, err
	}

	// ---------- 3. 提交事务 ----------
	if err = tx.Commit(); err != nil {
		return RegisterResult{}, err
	}

	return RegisterResult{UserID: userID}, nil

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

func (p PostgresRepo) GetBookshelf(
	uid string,
	page, pageSize int,
) ([]BookshelfItemDTO, int, error) {

	if page < 1 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}

	offset := (page - 1) * pageSize

	const querySQL = `
		SELECT
			b.id,
			b.title,
			b.author,
			COUNT(*) OVER() AS total
		FROM user_bookshelf ub
		JOIN books b ON ub.book_id = b.id
		WHERE ub.uid = $1
		  AND ub.deleted_at IS NULL
		ORDER BY ub.created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := p.db.Query(querySQL, uid, pageSize, offset)
	if err != nil {
		return nil, 0, err
	}
	defer func(rows *sql.Rows) {
		err := rows.Close()
		if err != nil {

		}
	}(rows)

	items := make([]BookshelfItemDTO, 0, pageSize)

	var total int
	for rows.Next() {
		var item BookshelfItemDTO
		if err := rows.Scan(
			&item.BookID,
			&item.Title,
			&item.Author,
			&total,
		); err != nil {
			return nil, 0, err
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	// 如果当前页没有数据（比如 page 超出范围），total 会是 0
	if len(items) == 0 {
		return items, 0, nil
	}

	return items, total, nil
}

func (p PostgresRepo) AddBook(uid string, bookID string) error {
	query := `
		INSERT INTO user_bookshelf (uid, book_id)
		VALUES ($1, $2)
		ON CONFLICT (uid, book_id)
		DO UPDATE
		SET deleted_at = NULL
		WHERE user_bookshelf.deleted_at IS NOT NULL;
	`

	_, err := p.db.Exec(query, uid, bookID)
	if err != nil {
		return err
	}

	return nil
}

func (p PostgresRepo) RemoveBook(uid string, bookID string) error {
	query := `
		UPDATE user_bookshelf
		SET deleted_at = now()
		WHERE uid = $1
		  AND book_id = $2
		  AND deleted_at IS NULL
	`

	_, err := p.db.Exec(query, uid, bookID)
	if err != nil {
		return err
	}

	return nil
}

// HasBook 检查用户是否已添加某本书
func (p PostgresRepo) HasBook(uid string, bookID string) (bool, error) {

	const query = `
		SELECT COUNT(*)
		FROM user_bookshelf
		WHERE uid = $1
		  AND book_id = $2
		  AND deleted_at IS NULL
	`
	var count int
	err := p.db.QueryRow(query, uid, bookID).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func parsePgRegisterError(err error) error {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		if pgErr.Code == "23505" {
			switch pgErr.ConstraintName {
			case "users_username_key":
				return ErrUsernameExists
			case "users_email_key":
				return ErrEmailExists
			case "users_phone_key":
				return ErrPhoneExists
			case "users_userid_key":
				return ErrUserIDExists
			}
		}
	}
	return err
}
