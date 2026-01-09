package auth

// Credential 登录凭证, 认证专用
type Credential struct {
	UserID       string
	PasswordHash string
}

type LoginInfo struct {
	Email    *string `json:"email" binding:"required"`
	Username *string `json:"username" binding:"required"`
	Password *string `json:"password" binding:"required"`
}

type LoginResult struct {
	Token string `json:"token"`
}
