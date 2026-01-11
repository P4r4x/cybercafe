package books

import (
	"database/sql"
	"fmt"
	_ "github.com/jackc/pgx/v5/stdlib"
	"golang.org/x/net/context"
	"log"
	"strings"
)

type PostgresRepo struct {
	db *sql.DB
}

func NewPostgresRepo(db *sql.DB) BookRepo {
	return &PostgresRepo{
		db: db,
	}
}

// Find
//
// 发起多条件查询, 获取图书的库存信息 + 元数据, 返回 图书 Book 结构体切片
func (r *PostgresRepo) Find(ctx context.Context, q BookQuery) ([]*Book, error) {
	baseSQL := `
		SELECT 
    	uuid, id, title, author, publisher, total, remain, extra, created_at, updated_at 
		FROM books
		`
	var (
		conditions []string
		args       []any
		idx        = 1
	)
	if q.ID != nil {
		conditions = append(conditions, fmt.Sprintf("id = $%d", idx))
		args = append(args, *q.ID)
		idx++
	}
	if q.Title != nil {
		conditions = append(conditions, fmt.Sprintf("title ILIKE $%d", idx))
		args = append(args, "%"+*q.Title+"%")
		idx++
	}
	if q.Author != nil {
		conditions = append(conditions, fmt.Sprintf("author ILIKE $%d", idx))
		args = append(args, "%"+*q.Author+"%")
		idx++
	}
	if q.Publisher != nil {
		conditions = append(conditions, fmt.Sprintf("publisher ILIKE $%d", idx))
		args = append(args, "%"+*q.Publisher+"%")
		idx++
	}
	if len(conditions) > 0 {
		baseSQL += " WHERE " + strings.Join(conditions, " AND ")
	}
	rows, err := r.db.QueryContext(ctx, baseSQL, args...)
	if err != nil {
		return nil, err
	}
	defer func() {
		if err := rows.Close(); err != nil {
			log.Printf("rows close error: %v", err)
		}
	}()
	var books []*Book
	for rows.Next() {
		var b Book
		if err := rows.Scan(
			&b.UUID, &b.Id, &b.Title, &b.Author, &b.Publisher, &b.Total, &b.Remain, &b.Extra, &b.CreateAt, &b.UpdateAt,
		); err != nil {
			return nil, err
		}
		books = append(books, &b)
	}
	return books, nil
}

// AddRemain 增加 / 减少 图书余量 , 基于预编译和参数化查询
func (r *PostgresRepo) AddRemain(ctx context.Context, bookID BookID, delta int) error {
	const q = ` 
		WITH target AS (
			SELECT id, remain, total
			FROM books
			WHERE id = $2
		),
		updated AS (
			UPDATE books b
			SET remain = t.remain + $1
			FROM target t
			WHERE b.id = t.id
			  AND t.remain + $1 >= 0
			  AND t.remain + $1 <= t.total
			RETURNING b.id
)
SELECT
    EXISTS (SELECT 1 FROM target) AS exists,
    EXISTS (SELECT 1 FROM updated) AS updated;`
	var exists bool
	var updated bool
	err := r.db.QueryRowContext(ctx, q, delta, bookID).Scan(&exists, &updated)
	if err != nil {
		return err
	}
	if !exists {
		return ErrBookNotFound
	}
	if !updated {
		if delta < 0 {
			return ErrNotEnoughRemain
		}
		return ErrExceedTotal
	}
	return nil
}

func (r *PostgresRepo) AddStock(ctx context.Context, bookID BookID, delta int) error {
	const q = ` 
		WITH target AS (
			SELECT id, remain, total
			FROM books
			WHERE id = $2
		),
		updated AS (
			UPDATE books b
			SET remain = t.remain + $1,
				total  = t.total + $1
			FROM target t
			WHERE b.id = t.id
			  AND t.remain + $1 >= 0
			RETURNING b.id
		)
		SELECT
		EXISTS (SELECT 1 FROM target) AS exists,
		EXISTS (SELECT 1 FROM updated) AS updated;`
	var exists bool
	var updated bool
	err := r.db.QueryRowContext(ctx, q, delta, bookID).Scan(&exists, &updated)
	if err != nil {
		return err
	}
	if !exists {
		return ErrBookNotFound
	}
	if !updated {
		return ErrNotEnoughRemain
	}
	return nil
}
