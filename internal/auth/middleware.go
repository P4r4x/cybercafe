package auth

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenStr := extractJWT(c)
		if tokenStr == "" {
			c.Redirect(http.StatusFound, "/login")
			c.Abort()
			return
		}

		claims, err := ParseToken(tokenStr)
		if err != nil {
			c.Redirect(http.StatusFound, "/login")
			c.Abort()
			return
		}

		// 注入上下文
		c.Set("uid", claims.UID)
		c.Set("role", claims.Role)

		c.Next()
	}
}

// 从 Header (优先) 或 Cookie 中提取 JWT
func extractJWT(c *gin.Context) string {
	// Header, 从 Authorization: Bearer 之后提取
	authHeader := c.GetHeader("Authorization")
	if strings.HasPrefix(authHeader, "Bearer ") {
		return strings.TrimPrefix(authHeader, "Bearer ")
	}

	// Cookie: 从 token 中提取
	if token, err := c.Cookie("token"); err == nil {
		return token
	}

	return ""
}
