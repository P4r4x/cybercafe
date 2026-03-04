package products

import "context"

type ProductCacheDecorator struct {
	postgres ProductPostgresRepo
	redis    *ProductRedisCache
}

func NewProductCacheDecorator(postgres ProductPostgresRepo, redis *ProductRedisCache) *ProductCacheDecorator {
	return &ProductCacheDecorator{
		postgres: postgres,
		redis:    redis,
	}
}

func (c *ProductCacheDecorator) GetAllProducts(ctx context.Context) ([]*ProductInfo, error) {
	products, err := c.redis.GetProductsAll(ctx)
	if err != nil {
		return nil, err
	}
	if products != nil {
		return products, nil
	}

	products, err = c.postgres.GetAllProducts(ctx)
	if err != nil {
		return nil, err
	}

	if len(products) > 0 {
		if err := c.redis.SetProductsAll(ctx, products); err != nil {
			return nil, err
		}
	}

	return products, nil
}

func (c *ProductCacheDecorator) InvalidateCache(ctx context.Context, keys ...string) error {
	if len(keys) == 0 {
		return nil
	}
	return c.redis.Del(ctx, keys...)
}
