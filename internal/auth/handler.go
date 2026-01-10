package auth

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"regexp"
)

type CredentialHandler struct {
	svc *CredentialService
}

func NewHandler(svc *CredentialService) *CredentialHandler {
	return &CredentialHandler{
		svc: svc,
	}
}

func (h *CredentialHandler) LoginHandler(c *gin.Context) {

	req := LoginInfo{}

	// 1. 解析 JSON
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	// 2. 基本结构校验：username / email 必须且只能存在一个，password 必须存在
	hasUsername := req.Username != nil && *req.Username != ""
	hasEmail := req.Email != nil && *req.Email != ""
	hasPassword := req.Password != nil && *req.Password != ""

	if hasPassword == false || hasUsername == hasEmail {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	// 3. username / email 校验（互斥分支）
	if hasUsername {
		username := *req.Username

		// username: 字母、数字、下划线，长度 3~18
		if len(username) < 3 || len(username) > 18 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid username"})
			return
		}

		usernameRegex := regexp.MustCompile(`^[a-zA-Z0-9_]+$`)
		if !usernameRegex.MatchString(username) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid username"})
			return
		}
	}

	if hasEmail {
		email := *req.Email

		// email: 合法格式，长度限制
		if len(email) < 3 || len(email) > 64 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid email"})
			return
		}

		emailRegex := regexp.MustCompile(
			`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`,
		)
		if !emailRegex.MatchString(email) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid email"})
			return
		}
	}

	// 4. password 校验, 不做字符集白名单, 只排除控制字符
	password := *req.Password

	if len(password) < 8 || len(password) > 128 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid password"})
		return
	}

	for _, r := range password {
		// 排除 ASCII 控制字符
		if r < 32 || r == 127 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid password"})
			return
		}
	}

	result, err := h.svc.LoginService(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "login failed"})
		return
	}

	// 成功响应
	c.JSON(http.StatusOK, gin.H{
		"message": "login success",
		"data":    result,
	})
}
