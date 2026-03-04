package users

import (
	"context"
	"strconv"
	"time"

	"CyberCafe/backend/internal/infra/redis"
)

// 缓存键前缀和 TTL 配置
const (
	// BookshelfCacheKeyPrefix 书架缓存键前缀
	// 完整键格式: bookshelf:{uid}:{page}:{pageSize}
	BookshelfCacheKeyPrefix = "bookshelf:"

	// BookshelfCacheTTL 书架缓存过期时间
	// 用户书架数据变更频率较低，设置 3 分钟缓存
	BookshelfCacheTTL = 3 * time.Minute
)

// BookshelfCacheData 书架缓存数据结构
// 用于存储用户书架的分页数据，包含书籍列表和总数
type BookshelfCacheData struct {
	// Items 书架中的书籍列表
	Items []BookshelfItemDTO `json:"items"`

	// Total 书架中书籍总数（所有分页的总和，非当前页数量）
	Total int `json:"total"`
}

// UserRedisCache Redis 缓存层
// 封装用户相关数据的 Redis 操作
type UserRedisCache struct {
	redisCache *redis.Cache
}

// NewUserRedisCache 创建用户 Redis 缓存实例
// 参数：
//   - r: 统一的 Redis 缓存封装实例
//
// 返回值：
//   - *UserRedisCache: 用户 Redis 缓存实例
func NewUserRedisCache(r *redis.Cache) *UserRedisCache {
	return &UserRedisCache{
		redisCache: r,
	}
}

// GetBookshelf 从 Redis 获取用户书架缓存
// 参数：
//   - ctx: 上下文
//   - uid: 用户 ID
//   - page: 页码
//   - pageSize: 每页数量
//
// 返回值：
//   - []BookshelfItemDTO: 书架中的书籍列表
//   - int: 书架中书籍总数
//   - error: 获取失败时返回错误
//
// 缓存键格式: bookshelf:{uid}:{page}:{pageSize}
func (r *UserRedisCache) GetBookshelf(ctx context.Context, uid string, page int32, pageSize int32) ([]BookshelfItemDTO, int, error) {
	key := BookshelfCacheKeyPrefix + uid + ":" + strconv.Itoa(int(page)) + ":" + strconv.Itoa(int(pageSize))
	var data BookshelfCacheData
	err := r.redisCache.Get(ctx, key, &data)
	if err != nil {
		return nil, 0, err
	}
	if data.Items != nil {
		return data.Items, data.Total, nil
	}
	return nil, 0, nil
}

// SetBookshelf 将用户书架数据写入 Redis 缓存
// 参数：
//   - ctx: 上下文
//   - uid: 用户 ID
//   - page: 页码
//   - pageSize: 每页数量
//   - items: 书架中的书籍列表
//   - total: 书架中书籍总数
//
// 返回值：
//   - error: 写入失败时返回错误
//
// 缓存键格式: bookshelf:{uid}:{page}:{pageSize}
// 缓存过期时间: 3 分钟
func (r *UserRedisCache) SetBookshelf(ctx context.Context, uid string, page int32, pageSize int32, items []BookshelfItemDTO, total int) error {
	key := BookshelfCacheKeyPrefix + uid + ":" + strconv.Itoa(int(page)) + ":" + strconv.Itoa(int(pageSize))
	data := BookshelfCacheData{
		Items: items,
		Total: total,
	}
	return r.redisCache.Set(ctx, key, data, BookshelfCacheTTL)
}

// DelBookshelf 删除用户书架缓存
// 参数：
//   - ctx: 上下文
//   - uid: 用户 ID
//
// 返回值：
//   - error: 删除失败时返回错误
//
// 说明：
//
//	删除指定用户的所有分页缓存（page 1-10, pageSize 10-50）
//	生产环境建议使用 Redis SCAN 或 KEYS 模式匹配删除所有相关键
func (r *UserRedisCache) DelBookshelf(ctx context.Context, uid string) error {
	// 删除该用户的所有分页缓存（简化处理，删除常用分页）
	// 实际生产中可使用 Redis SCAN 或 KEYS 模式匹配删除
	keys := make([]string, 0)
	for page := 1; page <= 10; page++ {
		for pageSize := 10; pageSize <= 50; pageSize += 10 {
			key := BookshelfCacheKeyPrefix + uid + ":" + strconv.Itoa(page) + ":" + strconv.Itoa(pageSize)
			keys = append(keys, key)
		}
	}
	return r.redisCache.Del(ctx, keys...)
}
