package books

import (
	"errors"
	"golang.org/x/net/context"
)

type BookService struct {
	repo BookRepo
}

// BookQuery 查询图书参数
type BookQuery struct {
	ID        *BookID `json:"id"`
	Title     *string `json:"title"`
	Author    *string `json:"author"`
	Publisher *string `json:"publisher"`
}

// BookChangeRemainRequest 借阅图书参数
type BookChangeRemainRequest struct {
	ID     BookID `json:"id"`
	Amount int    `json:"amount"`
}

// BookChangeStockRequest 修改图书库存服务
type BookChangeStockRequest struct {
	ID     BookID `json:"id"`
	Amount int    `json:"amount"`
}

// ====== 报错信息 ======

// ErrBookNotFound 获取图书失败
var ErrBookNotFound = errors.New("book not found")

// ErrInvalidAmount 借书参数错误
var ErrInvalidAmount = errors.New("invalid amount")

// ErrNotEnoughRemain 图书余量不足
var ErrNotEnoughRemain = errors.New("not enough remain")

// ErrExceedTotal 图书余量溢出
var ErrExceedTotal = errors.New("exceed total")

func NewService(repo BookRepo) *BookService {
	return &BookService{repo: repo}
}

// BookQueryService 查询图书服务, 支持多条件查询
func (s *BookService) BookQueryService(ctx context.Context, q BookQuery) ([]*Book, error) {
	//TODO 权限, 校验, 统计, 缓存, 并发控制
	result, err := s.repo.Find(ctx, q)
	if err != nil {
		return nil, err
	}
	return result, nil
}

// BookBorrowService 借书服务
func (s *BookService) BookBorrowService(ctx context.Context, q BookChangeRemainRequest) (interface{}, error) {

	// 载入查询参数, 必须是唯一的参数
	bookId := &q.ID
	amount := &q.Amount

	// 参数校验
	if *amount <= 0 {
		return nil, ErrInvalidAmount
	}
	if bookId == nil {
		return nil, ErrBookNotFound
	}
	err := s.repo.AddRemain(ctx, *bookId, -*amount)
	if err != nil {
		return nil, err
	}
	return "success", nil
}

// BookReturnService 归还服务
func (s *BookService) BookReturnService(ctx context.Context, q BookChangeRemainRequest) (interface{}, error) {

	// 载入查询参数, 必须是唯一的参数
	bookId := &q.ID
	amount := &q.Amount

	// 参数校验, 注意还书时传入的是正数
	if *amount <= 0 {
		return nil, ErrInvalidAmount
	}
	if bookId == nil {
		return nil, ErrBookNotFound
	}
	err := s.repo.AddRemain(ctx, *bookId, *amount)
	if err != nil {
		return nil, err
	}
	return "success", nil

}

func (s *BookService) BookAddStockService(ctx context.Context, q BookChangeStockRequest) (interface{}, error) {

	// 载入查询参数, 必须是唯一的参数
	bookId := &q.ID
	amount := &q.Amount

	// 参数校验
	if bookId == nil {
		return nil, ErrBookNotFound
	}
	err := s.repo.AddStock(ctx, *bookId, *amount)
	if err != nil {
		return nil, err
	}
	return "success", nil
}
