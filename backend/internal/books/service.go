package books

import (
	"CyberCafe/backend/internal/rules"
	"context"
	"errors"
)

type BookService struct {
	repo BookCacheRepo
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

// ErrUserHasOverdue 用户有逾期的借阅记录
var ErrUserHasOverdue = errors.New("user has overdue records")

// ErrBorrowLimitExceeded 借阅额度溢出
var ErrBorrowLimitExceeded = errors.New("borrow limit exceeded")

// ErrUserNotFound 未找到 用户
var ErrUserNotFound = errors.New("user not found")

func NewService(repo BookCacheRepo) *BookService {
	return &BookService{repo: repo}
}

// BookQueryService 查询图书服务, 支持多条件查询
func (s *BookService) BookQueryService(ctx context.Context, q BookQuery) ([]*Book, error) {
	return s.repo.Find(ctx, q)
}

// BookBorrowService 借书服务
func (s *BookService) BookBorrowService(ctx context.Context, uid string, q BookChangeRemainRequest) (interface{}, error) {

	// 载入查询参数, 必须是唯一的参数
	bookId := &q.ID
	amount := &q.Amount

	// 1. 参数校验
	if *amount <= 0 {
		return nil, ErrInvalidAmount
	}
	if bookId == nil {
		return nil, ErrBookNotFound
	}

	// 2. 借阅状态检查
	status, err := s.repo.GetUserBorrowStatus(ctx, uid)
	if err != nil {
		return nil, err
	}
	if status.HasOverdue {
		return nil, ErrUserHasOverdue
	}

	// 3. 用户等级 & 借阅额度
	level, err := s.repo.GetUserLevel(ctx, uid)
	if err != nil {
		return nil, err
	}
	rule, _, err := rules.GetLevelRule(level)
	if err != nil {
		return nil, err
	}

	if status.UsedAmount >= rule.BorrowLimit {
		return nil, ErrBorrowLimitExceeded
	}

	// 4. 借书事务以及写记录
	if err := s.repo.AddRemain(ctx, uid, *bookId, -*amount); err != nil {
		return nil, err
	}
	// 删除缓存
	_ = s.repo.InvalidateCache(ctx, BookCacheKeyPrefix+string(*bookId))
	return "success", nil
}

// BookReturnService 归还服务
func (s *BookService) BookReturnService(ctx context.Context, uid string, q BookChangeRemainRequest) (interface{}, error) {

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
	err := s.repo.AddRemain(ctx, uid, *bookId, *amount)
	if err != nil {
		return nil, err
	}
	// 删除缓存
	_ = s.repo.InvalidateCache(ctx, BookCacheKeyPrefix+string(*bookId))
	return "success", nil

}

// BookAddStockService 增减库存服务
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
	// 删除缓存
	_ = s.repo.InvalidateCache(ctx, BookCacheKeyPrefix+string(*bookId))
	return "success", nil
}

// BookSearchService 搜索图书服务 (复合查询)
func (s *BookService) BookSearchService(ctx context.Context, q SearchBooksReq) ([]*Book, error) {

	// TODO 增加搜索限制和返回条目
	result, err := s.repo.Search(ctx, q)
	if err != nil {
		return nil, err
	}
	return result, nil

}
