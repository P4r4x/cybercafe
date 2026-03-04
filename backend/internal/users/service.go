package users

import (
	"context"
	"crypto/rand"
	"errors"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"math/big"
)

var ErrUserNotFound = errors.New("user not found")

type UserService struct {
	repo UserCacheRepo
}

func NewService(repo UserCacheRepo) *UserService {
	return &UserService{
		repo: repo,
	}
}

func (s UserService) UserRegister(c context.Context, req RegisterInfo) (*RegisterResult, error) {

	hash, err := bcrypt.GenerateFromPassword(
		[]byte(req.Password),
		bcrypt.DefaultCost,
	)
	if err != nil {
		return nil, err
	}

	info := RegisterInfoDetail{
		ID:           uuid.New().String(),
		UserID:       generateUserID(),
		Username:     req.Username,
		Email:        req.Email,
		Phone:        *req.Phone,
		PasswordHash: string(hash),
	}

	result, err := s.repo.Register(c, &info)
	if err != nil {
		return nil, err
	}

	return &result, nil
}

func generateUserID() string {
	const (
		min_id = 100_000_000 // 9 位
		max_id = 999_999_999 // 9 位
	)

	nBig, err := rand.Int(rand.Reader, big.NewInt(max_id-min_id+1))
	if err != nil {
		panic("failed to generate secure userid")
	}

	return big.NewInt(0).Add(nBig, big.NewInt(min_id)).String()
}

func (s UserService) AccountSummary(c context.Context, uid string) (*UserAccount, error) {
	result, err := s.repo.GetAccount(c, uid)
	if err != nil {
		return nil, err
	}
	if &result.UID == nil {
		return nil, ErrUserNotFound
	}
	return result, nil
}

func (s UserService) UserBookshelf(ctx context.Context, uid string, page, pageSize int) ([]BookshelfItemDTO, Pagination, error) {
	items, total, err := s.repo.GetBookshelf(ctx, uid, page, pageSize)
	if err != nil {
		return nil, Pagination{}, err
	}

	// 构造分页请求
	pagination := Pagination{
		Page:       page,
		PageSize:   pageSize,
		Total:      total,
		TotalPages: (total + pageSize - 1) / pageSize,
	}

	return items, pagination, nil
}

func (s UserService) AddBook(ctx context.Context, uid string, bookID string) error {
	return s.repo.AddBook(ctx, uid, bookID)
}

func (s UserService) RemoveBook(ctx context.Context, uid string, bookID string) error {
	return s.repo.RemoveBook(ctx, uid, bookID)
}

func (s UserService) HasBook(ctx context.Context, uid string, bookID string) (bool, error) {
	return s.repo.HasBook(ctx, uid, bookID)
}
