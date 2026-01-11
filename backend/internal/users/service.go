package users

import (
	"crypto/rand"
	"github.com/gin-gonic/gin"
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

func (s UserService) UserRegister(c *gin.Context, req RegisterInfo) (*RegisterResult, error) {

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
