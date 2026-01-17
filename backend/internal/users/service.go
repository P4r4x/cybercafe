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
	repo UserRepo
}

func NewService(repo UserRepo) *UserService {
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

func (s UserService) UserBookshelf(uid string) ([]BookshelfItemDTO, error) {
	return s.repo.GetBookshelf(uid)
}

func (s UserService) AddBook(uid string, bookID string) error {
	return s.repo.AddBook(uid, bookID)
}
