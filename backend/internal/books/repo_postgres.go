package books

import (
	"context"
	"database/sql"
	"fmt"
	_ "github.com/jackc/pgx/v5/stdlib"
	"log"
	"strings"
	"time"
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
    	uuid, id, title, author, publisher, price, has_ebook, total, remain, extra, created_at, updated_at 
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
			&b.UUID, &b.Id, &b.Title, &b.Author, &b.Publisher, &b.Price, &b.HasEBook, &b.Total, &b.Remain, &b.Extra, &b.CreateAt, &b.UpdateAt,
		); err != nil {
			return nil, err
		}
		books = append(books, &b)
	}
	return books, nil
}

// AddRemain 增加 / 减少 图书余量 , 基于预编译和参数化查询, 同时生成记录
func (r *PostgresRepo) AddRemain(
	parent context.Context,
	uid string,
	bookID BookID,
	delta int,
) (err error) {

	// 独立事务 context
	ctx, cancel := context.WithTimeout(context.Background(), 9999*time.Second)
	defer cancel()

	tx, err := r.db.BeginTx(ctx, &sql.TxOptions{
		Isolation: sql.LevelReadCommitted,
	})
	if err != nil {
		return err
	}

	//  兜底 rollback, Commit 成功后会被忽略
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	// =============================
	// 1. 更新 books 表 remain
	// =============================
	const qUpdate = `
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
		EXISTS (SELECT 1 FROM target)  AS exists,
		EXISTS (SELECT 1 FROM updated) AS updated;
	`

	var exists, updated bool
	if err = tx.QueryRowContext(ctx, qUpdate, delta, bookID).
		Scan(&exists, &updated); err != nil {
		return err
	}

	if !exists {
		return ErrBookNotFound
	}
	if !updated {
		// 根据 remain 正负判断借还
		if delta < 0 {
			return ErrNotEnoughRemain
		}
		return ErrExceedTotal
	}

	// =============================
	// 2. 借还记录
	// =============================
	if delta < 0 {
		const qInsertBorrow = `
		INSERT INTO user_borrow_records
		    (uid, book_id, amount, borrow_at, due_at)
		VALUES ($1, $2, $3, now(), now() + interval '7 days')`
		if _, err = tx.ExecContext(ctx, qInsertBorrow, uid, bookID, -delta); err != nil {
			return err
		}
	}

	if delta > 0 {
		const qUpdateReturn = `
		WITH to_update AS (
			SELECT id
			FROM user_borrow_records
			WHERE uid = $1
			  AND book_id = $2
			  AND return_at IS NULL
			ORDER BY borrow_at
			LIMIT $3
		)
		UPDATE user_borrow_records
		SET return_at = now()
		WHERE id IN (SELECT id FROM to_update)
		`
		if _, err = tx.ExecContext(ctx, qUpdateReturn, uid, bookID, delta); err != nil {
			return err
		}
	}

	// =============================
	// 3. 提交事务
	// =============================
	return tx.Commit()
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
func (r *PostgresRepo) Search(ctx context.Context, q SearchBooksReq) ([]*Book, error) {
	var sb strings.Builder

	// ---- base query ----
	sb.WriteString(`
		SELECT
			id,
			title,
			author,
			publisher,
			price,
			remain,
			has_ebook,
			created_at
		FROM books
	`)

	where := make([]string, 0)
	args := make([]any, 0)
	argIdx := 1

	// ---- 文本模糊查询 ----
	if q.Title != nil {
		where = append(where, fmt.Sprintf(
			"title ILIKE $%d", argIdx,
		))
		args = append(args, "%"+*q.Title+"%")
		argIdx++
	}

	if q.Author != nil {
		where = append(where, fmt.Sprintf(
			"author ILIKE $%d", argIdx,
		))
		args = append(args, "%"+*q.Author+"%")
		argIdx++
	}

	if q.Publisher != nil {
		where = append(where, fmt.Sprintf(
			"publisher ILIKE $%d", argIdx,
		))
		args = append(args, "%"+*q.Publisher+"%")
		argIdx++
	}

	// ---- 价格区间 ----
	if q.PriceMin != nil {
		where = append(where, fmt.Sprintf(
			"price >= $%d", argIdx, // argIdx 是 int，%d 正确
		))
		args = append(args, *q.PriceMin) // *q.PriceMin 是 decimal.Decimal
		argIdx++
	}

	if q.PriceMax != nil {
		where = append(where, fmt.Sprintf(
			"price <= $%d", argIdx, // 同上
		))
		args = append(args, *q.PriceMax) // *q.PriceMax 是 decimal.Decimal
		argIdx++
	}

	// ---- 是否有余量 ----
	if q.HasRemain != nil {
		if *q.HasRemain {
			where = append(where, "remain > 0")
		} else {
			where = append(where, "remain <= 0")
		}
	}

	// ---- 是否有电子书 ----
	if q.HasEbook != nil {
		where = append(where, fmt.Sprintf(
			"has_ebook = $%d", argIdx,
		))
		args = append(args, *q.HasEbook)
		argIdx++
	}

	// ---- 拼接 WHERE ----
	if len(where) > 0 {
		sb.WriteString(" WHERE ")
		sb.WriteString(strings.Join(where, " AND "))
	}

	// ---- 默认排序 ----
	sb.WriteString(" ORDER BY created_at DESC")

	query := sb.String()

	// ---- 执行查询 ----
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer func(rows *sql.Rows) {
		err := rows.Close()
		if err != nil {

		}
	}(rows)

	// ---- 扫描结果 ----
	books := make([]*Book, 0)
	for rows.Next() {
		var b Book
		if err := rows.Scan(
			&b.Id,
			&b.Title,
			&b.Author,
			&b.Publisher,
			&b.Price,
			&b.Remain,
			&b.HasEBook,
			&b.CreateAt,
		); err != nil {
			return nil, err
		}
		books = append(books, &b)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return books, nil
}
