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
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			c.Abort()
			return
		}

		claims, err := ParseToken(tokenStr)

		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			c.Abort()
			return
		}

		if claims.Status != "active" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			c.Abort()
			return
		}

		// 注入上下文
		c.Set("claims", claims)

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
		claims := c.MustGet("claims").(*Claims)
		if claims.Role != "admin" {
			c.AbortWithStatusJSON(403, gin.H{"error": "forbidden"})
			return
		}
		c.Next()
	}
}
