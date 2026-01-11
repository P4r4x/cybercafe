package users

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"regexp"
)

type UserHandler struct {
	svc *UserService
}

func NewHandler(svc *UserService) *UserHandler {
	return &UserHandler{
		svc: svc,
	}
}

func (h *UserHandler) RegisterHandler(c *gin.Context) {
	req := RegisterInfo{}

	// 1. 解析 JSON
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	// 2. 基本结构校验： username, password, email 为必填项
	hasUsername := req.Username != ""
	hasEmail := req.Email != ""
	hasPassword := req.Password != ""

	if hasPassword == false || hasUsername == false || hasEmail == false {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	// 3. 参数校验
	// username: 字母、数字、下划线，长度 3~18
	username := req.Username
	if len(username) < 3 || len(username) > 18 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid username"})
		return
	}
	usernameRegex := regexp.MustCompile(`^[a-zA-Z0-9_]+$`)
	if !usernameRegex.MatchString(username) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid username"})
		return
	}

	// email: 合法格式，长度限制
	email := req.Email
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

	// password 校验, 不做字符集白名单, 只排除控制字符
	password := req.Password
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

	// phone 校验, 只允许数字, 长度限制
	if req.Phone != nil {
		phone := *req.Phone
		if len(phone) < 8 || len(phone) > 16 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid phone"})
			return
		}
		phoneRegex := regexp.MustCompile(`^[0-9]+$`)
		if !phoneRegex.MatchString(phone) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid phone"})
			return
		}
	}

	user, err := h.svc.UserRegister(c, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "register success",
		"data":    user,
	})
}
