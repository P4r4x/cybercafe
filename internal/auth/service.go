package auth

import (
	"errors"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/net/context"
)

// ===== 报错处理 =====

// ErrLoginFailed 登录失败
var ErrLoginFailed = errors.New("login failed")

type CredentialService struct {
	repo CredentialRepo
}

func NewService(repo CredentialRepo) *CredentialService {
	return &CredentialService{
		repo: repo,
	}
}

// LoginService 登录服务, 逻辑是先查找账号, 再验证密码
func (s CredentialService) LoginService(c context.Context, req LoginInfo) (*LoginResult, error) {

	// 1. 查找用户
	user, err := s.repo.Find(c, req)
	if err != nil {
		// 数据库或系统错误
		return nil, err
	}
	// 2. 用户不存在
	if user == nil {
		return nil, ErrLoginFailed
	}

	// 3. 校验密码
	if err := bcrypt.CompareHashAndPassword(
		[]byte(user.PasswordHash),
		[]byte(*req.Password),
	); err != nil {
		// 密码错误
		return nil, ErrLoginFailed
	}

	// 4. 生成 JWT
	token, err := GenerateToken(user.UserID)
	if err != nil {
		return nil, err
	}
	result := LoginResult{
		Token: token,
	}

	return &result, nil
}
