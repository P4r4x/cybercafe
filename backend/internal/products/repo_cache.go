package products

import (
	"context"
	"time"

	"CyberCafe/backend/internal/infra/redis"
)

const (
	ProductsAllCacheKey = "products:all"
	ProductsCacheTTL    = 10 * time.Minute
)

type ProductRedisCache struct {
	redisCache *redis.Cache
}

func NewProductRedisCache(r *redis.Cache) *ProductRedisCache {
	return &ProductRedisCache{
		redisCache: r,
	}
}

func (r *ProductRedisCache) GetProductsAll(ctx context.Context) ([]*ProductInfo, error) {
	var products []*ProductInfo
	if err := r.redisCache.Get(ctx, ProductsAllCacheKey, &products); err != nil {
		return nil, err
	}
	return products, nil
}

func (r *ProductRedisCache) SetProductsAll(ctx context.Context, products []*ProductInfo) error {
	return r.redisCache.Set(ctx, ProductsAllCacheKey, products, ProductsCacheTTL)
}

func (r *ProductRedisCache) Del(ctx context.Context, keys ...string) error {
	return r.redisCache.Del(ctx, keys...)
}
