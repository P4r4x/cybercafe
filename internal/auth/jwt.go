package auth

import (
	"errors"
	"github.com/golang-jwt/jwt/v5"
	"time"
)

type Claims struct {
	UID string `json:"sub"`
	jwt.RegisteredClaims
}

// TODO ⚠️ 后续放 env
var secret = []byte("your-secret-key")

// GenerateToken 生成 JWT
func GenerateToken(uid string) (string, error) {
	claims := Claims{
		UID: uid,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(2 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(secret)
}

// ParseToken 解析并验证 JWT
func ParseToken(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(
		tokenStr,
		&Claims{},
		func(t *jwt.Token) (any, error) {

			// 验证签名方法
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, errors.New("unexpected signing method")
			}
			return secret, nil
		},
	)

	if err != nil || !token.Valid {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok {
		return nil, errors.New("invalid claims")
	}

	return claims, nil
}
