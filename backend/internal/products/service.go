package products

import "context"

type ProductService struct {
	repo ProductRepo
}

func NewService(repo ProductRepo) *ProductService {
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
