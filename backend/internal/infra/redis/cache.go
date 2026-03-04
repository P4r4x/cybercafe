package redis

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"time"

	goredis "github.com/redis/go-redis/v9"
)

// Cache 统一的 Redis 缓存封装
// 提供 Get/Set/Del 三个基础方法，通过泛型或接口实现通用序列化
type Cache struct {
	client *goredis.Client
}

// NewCache 创建缓存实例
// 参数：
//   - client: 已有 goredis.Client 实例
func NewCache(client *goredis.Client) *Cache {
	return &Cache{client: client}
}

// Get 从 Redis 获取数据并反序列化
// 参数：
//   - ctx: 上下文
//   - key: Redis 键名
//   - result: 指针类型，用于接收反序列化结果
//
// 返回值：
//   - error: 获取失败时返回错误
//
// 使用示例：
//
//	var user User
//	err := cache.Get(ctx, "user:1", &user)
func (c *Cache) Get(ctx context.Context, key string, result interface{}) error {
	data, err := c.client.Get(ctx, key).Bytes()
	if err != nil {
		// Key 不存在时返回 nil，不返回错误
		if errors.Is(err, goredis.Nil) {
			return nil
		}
		return err
	}

	// ====== DEBUG HIT 日志 ======
	log.Printf(
		"[Cache] [DEBUG] [HIT] %s - %s",
		time.Now().Format("2006:01:02 15:04:05"),
		key,
	)

	// 反序列化到传入的指针
	if err := json.Unmarshal(data, result); err != nil {
		return err
	}

	return nil
}

// Set 将数据序列化并写入 Redis
// 参数：
//   - ctx: 上下文
//   - key: Redis 键名
//   - value: 要写入的值（任意可序列化类型）
//   - ttl: 过期时间
//
// 返回值：
//   - error: 写入失败时返回错误
//
// 使用示例：
//
//	user := User{ID: 1, Name: "tom"}
//	err := cache.Set(ctx, "user:1", user, 5*time.Minute)
func (c *Cache) Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}

	return c.client.Set(ctx, key, data, ttl).Err()
}

// Del 从 Redis 删除一个或多个键
// 参数：
//   - ctx: 上下文
//   - keys: 要删除的键名列表（支持变长参数）
//
// 返回值：
//   - error: 删除失败时返回错误
//
// 使用示例：
//
//	// 删除单个键
//	err := cache.Del(ctx, "user:1")
//	// 删除多个键
//	err := cache.Del(ctx, "user:1", "user:2", "user:3")
func (c *Cache) Del(ctx context.Context, keys ...string) error {
	if len(keys) == 0 {
		return nil
	}
	// ====== DEBUG DEL 日志 ======
	log.Printf("[Redis] [DEBUG] [DEL] %s - %v \n", time.Now().Format("2006:01:02 15:04:05"), keys)
	return c.client.Del(ctx, keys...).Err()
}
