package auth

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// AuthRequired 登录验证
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
	if token, err := c.Cookie("cookie"); err == nil {
		return token
	}

	return ""
}

// AdminRequired 管理员验证
func AdminRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		claims, ok := c.Get("claims")
		if !ok {
			c.AbortWithStatusJSON(401, gin.H{"error": "unauthorized"})
			return
		}

		if claims.(*Claims).Role != "admin" {
			c.AbortWithStatusJSON(403, gin.H{"error": "forbidden"})
			return
		}

		c.Next()
	}
}
