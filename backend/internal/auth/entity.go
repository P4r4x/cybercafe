package auth

// Credential 登录凭证, 认证专用
type Credential struct {
	UserID       string
	PasswordHash string
	Role         string
}

type LoginInfo struct {
	Email    *string `json:"email"`
	Username *string `json:"username"`
	Password *string `json:"password"`
}

type LoginResult struct {
	Token string `json:"token"`
}
