package users

import (
	"crypto/rand"
	"errors"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"math/big"
)

// ===== 报错处理 =====

// ErrRegisterFailed 登录失败
var ErrRegisterFailed = errors.New("register failed")

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
		return nil, ErrRegisterFailed
	}

	return &result, nil
}

func generateUserID() string {
	const (
		min = 100_000_000 // 9 位
		max = 999_999_999 // 9 位
	)

	nBig, err := rand.Int(rand.Reader, big.NewInt(max-min+1))
	if err != nil {
		// 理论上极少发生，直接 panic 或向上抛都可以
		panic("failed to generate secure userid")
	}

	return big.NewInt(0).Add(nBig, big.NewInt(min)).String()
}
