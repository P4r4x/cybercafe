package books

import (
	"context"
	"time"

	"CyberCafe/backend/internal/infra/redis"
)

const (
	BookCacheKeyPrefix = "book:"
	BookCacheTTL       = 5 * time.Minute
)

type BookRedisCache struct {
	redisCache *redis.Cache
}

func NewBookRedisCache(r *redis.Cache) *BookRedisCache {
	return &BookRedisCache{
		redisCache: r,
	}
}

func (r *BookRedisCache) GetBookByID(ctx context.Context, id BookID) (*Book, error) {
	key := BookCacheKeyPrefix + string(id)
	var book Book
	if err := r.redisCache.Get(ctx, key, &book); err != nil {
		return nil, err
	}
	if book.Id != "" {
		return &book, nil
	}
	return nil, nil
}

func (r *BookRedisCache) SetBookByID(ctx context.Context, book *Book) error {
	key := BookCacheKeyPrefix + string(book.Id)
	return r.redisCache.Set(ctx, key, book, BookCacheTTL)
}

func (r *BookRedisCache) Del(ctx context.Context, keys ...string) error {
	return r.redisCache.Del(ctx, keys...)
}
