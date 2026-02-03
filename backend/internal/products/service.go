package products

import "context"

type ProductService struct {
	repo ProductRepo
}

func NewService(repo ProductRepo) *ProductService {
	return &ProductService{repo: repo}
}

func (s *ProductService) ProductListService(ctx context.Context) ([]*Product, error) {
	products, err := s.repo.ProductList(ctx)
	if err != nil {
		return nil, err
	}
	return products, nil
}
