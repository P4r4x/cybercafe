package products

import "context"

// ProductService 商品查询服务
type ProductService struct {
	repo ProductPostgresRepo
}

func NewService(repo ProductPostgresRepo) *ProductService {
	return &ProductService{repo: repo}
}

func (s *ProductService) GetAllProducts(ctx context.Context) (*ProductResponse, error) {

	items, err := s.repo.GetAllProducts(ctx)
	if err != nil {
		return nil, err
	}
	res := ProductResponse{Items: items}
	return &res, nil

}
