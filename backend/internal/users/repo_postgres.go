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
func (p PostgresRepo) Register(d *RegisterInfoDetail) (RegisterResult, error) {

	// 涉及多条查询的事务时, 使用独立的 ctx
	ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
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

func (p PostgresRepo) GetBookshelf(uid string, page int, pageSize int) ([]BookshelfBookDTO, int, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 6
	}

	offset := (page - 1) * pageSize

	// ---------- count ----------
	var total int
	countQuery := `
        SELECT COUNT(1)
        FROM user_bookshelf
        WHERE uid = $1
          AND deleted_at IS NULL
    `
	if err := p.db.QueryRow(countQuery, uid).Scan(&total); err != nil {
		return nil, 0, err
	}

	// ---------- list ----------
	query := `
        SELECT
            b.id,
            b.uuid,
            b.title,
            b.author,
            b.publisher,
            b.price,
            b.total,
            b.remain,
            b.has_ebook,
            b.extra,
            ub.created_at
        FROM user_bookshelf ub
        JOIN books b ON b.id = ub.book_id
        WHERE ub.uid = $1
          AND ub.deleted_at IS NULL
        ORDER BY ub.created_at DESC
        LIMIT $2 OFFSET $3
    `

	rows, err := p.db.Query(query, uid, pageSize, offset)
	if err != nil {
		return nil, 0, err
	}
	defer func(rows *sql.Rows) {
		err := rows.Close()
		if err != nil {

		}
	}(rows)

	items := make([]BookshelfBookDTO, 0)
	for rows.Next() {
		var item BookshelfBookDTO
		if err := rows.Scan(
			&item.ID,
			&item.UUID,
			&item.Title,
			&item.Author,
			&item.Publisher,
			&item.Price,
			&item.Total,
			&item.Remain,
			&item.HasEbook,
			&item.Extra,
			&item.AddedAt,
		); err != nil {
			return nil, 0, err
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	return items, total, nil
}

func (p PostgresRepo) AddBook(uid string, bookID string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
	defer cancel()

	tx, err := p.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() {
		if tx != nil {
			_ = tx.Rollback()
		}
	}()

	// 1 尝试恢复之前删除的记录
	updateQuery := `
        UPDATE user_bookshelf
        SET deleted_at = NULL,
            created_at = NOW()
        WHERE uid = $1
          AND book_id = $2
          AND deleted_at IS NOT NULL
    `
	res, err := tx.ExecContext(ctx, updateQuery, uid, bookID)
	if err != nil {
		return err
	}

	rows, _ := res.RowsAffected()
	if rows > 0 {
		// 成功恢复软删除记录
		if err := tx.Commit(); err != nil {
			return err
		}
		tx = nil
		return nil
	}

	// 2 尝试插入新的记录
	insertQuery := `
        INSERT INTO user_bookshelf (uid, book_id, created_at)
        VALUES ($1, $2, NOW())
    `
	_, err = tx.ExecContext(ctx, insertQuery, uid, bookID)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			// active 已存在
			return errors.New("book already in bookshelf")
		}
		return err
	}

	if err := tx.Commit(); err != nil {
		return err
	}
	tx = nil
	return nil
}

func (p PostgresRepo) RemoveBook(uid string, bookID string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
	defer cancel()

	// 直接更新 deleted_at，幂等
	query := `
		UPDATE user_bookshelf
		SET deleted_at = NOW()
		WHERE uid = $1
		  AND book_id = $2
		  AND deleted_at IS NULL
	`
	res, err := p.db.ExecContext(ctx, query, uid, bookID)
	if err != nil {
		return err
	}
	rows, _ := res.RowsAffected()
	if rows == 0 {
		return errors.New("book not in bookshelf")
	}
	return nil
}

// InBookshelf 判断书是否在用户书架, 在则返回 true, 否则返回 false
func (p PostgresRepo) InBookshelf(uid string, bookID string) (bool, error) {

	// 独立 ctx
	ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
	defer cancel()

	query := `
		SELECT 1
		FROM user_bookshelf
		WHERE uid = $1
		  AND book_id = $2
		  AND deleted_at IS NULL
		LIMIT 1
	`

	var dummy int
	err := p.db.QueryRowContext(ctx, query, uid, bookID).Scan(&dummy)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return false, nil
		}
		return false, err
	}

	return true, nil
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
