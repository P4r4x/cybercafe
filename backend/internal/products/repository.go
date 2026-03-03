package products

import "context"

type ProductPostgresRepo interface {
	GetAllProducts(ctx context.Context) ([]*ProductInfo, error)
}

type ProductCacheRepo interface {
	ProductPostgresRepo
	InvalidateCache(ctx context.Context) error
}
