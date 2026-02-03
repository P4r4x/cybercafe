package users

import (
	"context"
	"crypto/rand"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"math/big"
)

type UserService struct {
	repo UserRepo
}

func NewService(repo UserRepo) *UserService {
	return &UserService{
		repo: repo,
	}
}

func (s UserService) UserRegister(req RegisterInfo) (*RegisterResult, error) {

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

	result, err := s.repo.Register(&info)
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

func (s *UserService) GetBookshelfService(uid string, page int) ([]BookshelfBookDTO, int, error) {

	if page <= 0 {
		page = 1
	}

	const pageSize = 6

	items, total, err := s.repo.GetBookshelf(uid, page, pageSize)
	if err != nil {
		return nil, 0, err
	}

	return items, total, nil

}

func (s UserService) AddBook(uid string, bookID string) error {
	err := s.repo.AddBook(uid, bookID)
	if err != nil {
		return err
	}
	return nil
}

func (s UserService) RemoveBook(uid string, bookID string) error {
	err := s.repo.RemoveBook(uid, bookID)
	if err != nil {
		return err
	}
	return nil
}

func (s UserService) IsInBookshelf(uid string, id string) (bool, error) {
	isIn, err := s.repo.InBookshelf(uid, id)
	if err != nil {
		return false, err
	}
	return isIn, nil
}
