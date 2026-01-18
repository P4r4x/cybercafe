package dashboard

import (
	"context"
	"database/sql"
)

type PostgresRepo struct {
	db *sql.DB
}

func NewPostgresRepo(db *sql.DB) DashboardRepo {
	return &PostgresRepo{
		db: db,
	}
}

// GetUserInfo 获取用户信息
func (r *PostgresRepo) GetUserInfo(ctx context.Context, uid string) (*UserInfo, error) {
	row := r.db.QueryRowContext(ctx,
		`
SELECT u.username, a.exp, a.level, a.balance
FROM user_account a
JOIN users u ON a.uid = u.userid
WHERE a.uid = $1;`, uid)

	var u UserInfo
	u.UID = uid
	if err := row.Scan(&u.Username, &u.Exp, &u.Level, &u.Balance); err != nil {
		return nil, err
	}
	return &u, nil
}

// GetBorrowStats 统计未还的借阅数目
func (r *PostgresRepo) GetBorrowStats(ctx context.Context, uid string) (*BorrowStats, error) {

	row := r.db.QueryRowContext(ctx, `
		SELECT
			COUNT(*) FILTER (WHERE return_at IS NULL) AS current
		FROM user_borrow_records
		WHERE uid = $1`, uid)

	var s BorrowStats
	if err := row.Scan(&s.Current); err != nil {
		return nil, err
	}
	return &s, nil
}

// GetRecentBorrows // 查询最近的借阅记录
func (r *PostgresRepo) GetRecentBorrows(ctx context.Context, uid string, limit int) ([]BorrowItem, error) {

	rows, err := r.db.QueryContext(ctx, `
		SELECT b.book_id, k.title, b.borrow_at, b.due_at, b.return_at
		FROM user_borrow_records b
		JOIN books k ON b.book_id = k.id
		WHERE b.uid = $1
		ORDER BY b.borrow_at DESC
		LIMIT $2`, uid, limit)
	if err != nil {
		return nil, err
	}
	defer func(rows *sql.Rows) {
		err := rows.Close()
		if err != nil {

		}
	}(rows)

	var res []BorrowItem
	for rows.Next() {
		var item BorrowItem
		if err := rows.Scan(
			&item.BookID,
			&item.Title,
			&item.BorrowAt,
			&item.ReturnAt,
		); err != nil {
			continue
		}
		res = append(res, item)
	}
	return res, nil
}
