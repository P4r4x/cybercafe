package db

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
)

// Postgres 数据库连接池
type Postgres struct {
	db *sql.DB
}

// DB 获取数据库连接池 (对外)
func (p *Postgres) DB() *sql.DB {
	return p.db
}

func NewPostgres() (*Postgres, error) {
	dsn := fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=disable",
		"cybercafe", // user
		"cybercafe", // password
		"localhost", // host
		"15432",     // port
		"cybercafe", // dbname
	)

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}

	// ======== 连接池配置（非常重要） ========
	db.SetMaxOpenConns(25)                  // 最大打开连接数
	db.SetMaxIdleConns(10)                  // 最大空闲连接
	db.SetConnMaxLifetime(30 * time.Minute) // 连接最大生命周期
	db.SetConnMaxIdleTime(5 * time.Minute)  // 空闲连接最大存活时间

	// ======== 启动时验证连接 ========
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		return nil, err
	}

	return &Postgres{db: db}, nil
}
