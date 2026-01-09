package auth

// Credential 登录凭证, 认证专用
type Credential struct {
	UserID       string
	PasswordHash string
	Salt         string
}
