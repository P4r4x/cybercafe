package products

import "context"

type ProductRepo interface {
	ProductList(ctx context.Context) ([]*Product, error)
}
