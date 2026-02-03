package orders

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"
)

// ===========================================================
// Token 生成和校验
// ===========================================================

// generateOrderToken 生成订单提交 token
func generateOrderToken(
	ctx context.Context,
	uid string,
	order *OrderContext,
	price *PriceResult,
) string {
	// Token 有效期 15 分钟
	expiresAt := time.Now().Add(15 * time.Minute).Unix()

	payload := OrderTokenPayload{
		UID:       uid,
		OrderHash: hashOrderContext(order),
		PriceHash: hashPriceResult(price),
		ExpiresAt: expiresAt,
	}

	// 使用 HMAC-SHA256 签名
	signature := signPayload(ctx, payload)

	// Base64 URL 编码
	tokenBytes, _ := json.Marshal(payload)
	payloadStr := base64.RawURLEncoding.EncodeToString(tokenBytes)
	return payloadStr + "." + signature
}

// VerifyOrderToken 校验订单 token
func VerifyOrderToken(
	ctx context.Context,
	tokenString string,
	expectedUID string,
	order *OrderContext,
	price *PriceResult,
) (*OrderTokenPayload, error) {
	// 1. 解析 token
	parts := strings.SplitN(tokenString, ".", 2)
	if len(parts) != 2 {
		return nil, ErrInvalidToken
	}

	payloadBytes, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return nil, ErrInvalidToken
	}

	var payload OrderTokenPayload
	if err := json.Unmarshal(payloadBytes, &payload); err != nil {
		return nil, ErrInvalidToken
	}

	// 2. 校验签名
	if !verifySignature(ctx, payload, parts[1]) {
		return nil, ErrInvalidTokenSignature
	}

	// 3. 校验用户
	if payload.UID != expectedUID {
		return nil, ErrTokenUserMismatch
	}

	// 4. 校验过期
	if time.Now().Unix() > payload.ExpiresAt {
		return nil, ErrTokenExpired
	}

	// 5. 校验订单一致性 - 添加调试
	currentOrderHash := hashOrderContext(order)
	currentPriceHash := hashPriceResult(price)

	if payload.OrderHash != currentOrderHash {
		// 🔍 调试：打印 Hash 对比和详细内容
		fmt.Printf("=== TOKEN ORDER MISMATCH DEBUG ===\n")
		fmt.Printf("Token OrderHash: %s\n", payload.OrderHash)
		fmt.Printf("Current OrderHash: %s\n", currentOrderHash)

		// 打印 OrderContext 的 JSON 内容
		orderJSON, _ := json.MarshalIndent(order, "", "  ")
		fmt.Printf("Order Context JSON:\n%s\n", string(orderJSON))

		// 打印每个 item 的详细信息
		fmt.Printf("Order Items Detail:\n")
		for i, item := range order.Items {
			fmt.Printf("  [%d] ProductID: %d, Quantity: %d\n", i, item.Product.ID, item.Quantity)
			for j, opt := range item.Options {
				fmt.Printf("      [%d] OptionCode: %s, Value: %s, ExtraPrice: %s\n",
					j, opt.Option.OptionCode, opt.Value.Value, opt.Value.ExtraPrice.String())
			}
		}
		fmt.Printf("===================================\n")
		return nil, ErrTokenOrderMismatch
	}

	if payload.PriceHash != currentPriceHash {
		// 🔍 调试：打印 Hash 对比
		fmt.Printf("=== TOKEN PRICE MISMATCH DEBUG ===\n")
		fmt.Printf("Token PriceHash: %s\n", payload.PriceHash)
		fmt.Printf("Current PriceHash: %s\n", currentPriceHash)
		fmt.Printf("Price Result: %+v\n", price)
		fmt.Printf("================================\n")
		return nil, ErrTokenPriceMismatch
	}

	return &payload, nil
}

// ===========================================================
// Token 数据结构
// ===========================================================

// OrderTokenPayload Token 载荷
type OrderTokenPayload struct {
	UID       string `json:"uid"`
	OrderHash string `json:"order_hash"`
	PriceHash string `json:"price_hash"`
	ExpiresAt int64  `json:"expires_at"`
}

// ===========================================================
// 签名相关
// ===========================================================

const tokenSecret = "cybercafe-order-token-secret-2024"

// signPayload 生成签名
func signPayload(ctx context.Context, payload OrderTokenPayload) string {
	h := hmac.New(sha256.New, []byte(tokenSecret))
	payloadBytes, _ := json.Marshal(payload)
	h.Write(payloadBytes)
	return base64.RawURLEncoding.EncodeToString(h.Sum(nil))
}

// verifySignature 校验签名
func verifySignature(ctx context.Context, payload OrderTokenPayload, signature string) bool {
	expected := signPayload(ctx, payload)
	return hmac.Equal([]byte(signature), []byte(expected))
}

// ===========================================================
// Hash / Sign（稳定、可重复）
// ===========================================================

func hashOrderContext(order *OrderContext) string {
	// OrderContext 是可信结构，可直接 json
	b, _ := json.Marshal(order)
	sum := sha256.Sum256(b)
	return base64.RawURLEncoding.EncodeToString(sum[:])
}

func hashPriceResult(price *PriceResult) string {
	b, _ := json.Marshal(price)
	sum := sha256.Sum256(b)
	return base64.RawURLEncoding.EncodeToString(sum[:])
}

// ===========================================================
// 错误定义
// ===========================================================

var (
	ErrInvalidRequest        = errors.New("invalid request")
	ErrInvalidTokenInput     = errors.New("invalid token input")
	ErrInvalidToken          = errors.New("invalid token")
	ErrInvalidTokenSignature = errors.New("invalid token signature")
	ErrTokenExpired          = errors.New("token expired")
	ErrTokenUserMismatch     = errors.New("token uid mismatch")
	ErrTokenOrderMismatch    = errors.New("token order mismatch")
	ErrTokenPriceMismatch    = errors.New("token price mismatch")
)
