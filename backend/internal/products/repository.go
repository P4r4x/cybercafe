package products

import "context"

type ProductRepo interface {
	GetAllProducts(ctx context.Context) ([]*ProductInfo, error)
}
