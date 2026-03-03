package redis

import (
	"context"
	"fmt"
	"time"

	goredis "github.com/redis/go-redis/v9"
)

// Redis 连接池封装
type Redis struct {
	client *goredis.Client
}

// Client 对外暴露 redis client
func (r *Redis) Client() *goredis.Client {
	return r.client
}

// Cache 返回统一的缓存封装实例
func (r *Redis) Cache() *Cache {
	return NewCache(r.client)
}

// NewRedis 初始化 Redis 连接
func NewRedis() (*Redis, error) {

	// ====== 直接写死配置（后续再抽离到 .env） ======
	host := "localhost"
	port := "16379"
	username := "cybercafe"
	password := "cybercafe"
	db := 0
	// ============================================

	addr := fmt.Sprintf("%s:%s", host, port)

	client := goredis.NewClient(&goredis.Options{
		Addr:         addr,
		Username:     username, // ACL 用户名
		Password:     password, // ACL 密码
		DB:           db,
		PoolSize:     10, // 连接池大小
		MinIdleConns: 3,
		DialTimeout:  5 * time.Second,
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 3 * time.Second,
	})

	// 测试连接
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("redis connection failed: %w", err)
	}

	fmt.Println("[INFO] Redis connected successfully")

	return &Redis{
		client: client,
	}, nil
}
