package orders

import (
	auth2 "CyberCafe/backend/internal/auth"
	"github.com/gin-gonic/gin"
	"net/http"
)

type OrderHandler struct {
	svc *OrderService
}

func NewHandler(svc *OrderService) *OrderHandler {
	return &OrderHandler{
		svc: svc,
	}
}

// SubmitHandler 提交, 预览订单
// POST /api/orders/preview
func (h OrderHandler) SubmitHandler(c *gin.Context) {

	var req OrderRequest

	// 0. 从 JWT 中获取用户 ID
	claims := c.MustGet("claims").(*auth2.Claims)
	uid := claims.UID

	// 1. 解析 JSON
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	submit, err := h.svc.SubmitService(c, uid, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, submit)
}

func (h OrderHandler) ConfirmHandler(c *gin.Context) {

	var req ConfirmRequest

	// 0. 从 JWT 中获取用户 ID
	claims := c.MustGet("claims").(*auth2.Claims)
	uid := claims.UID

	// 1. 解析 JSON
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	// 2. 尝试生成确认订单
	confirmResult, err := h.svc.ConfirmService(c, uid, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, confirmResult)
}

func (h OrderHandler) CancelHandler(c *gin.Context) {
	var req CancelRequest

	// 0. 从 JWT 中获取用户 ID
	claims := c.MustGet("claims").(*auth2.Claims)
	uid := claims.UID

	// 1. 解析 JSON
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	// 2. 尝试取消订单
	err := h.svc.CancelService(c, uid, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	}

	c.JSON(http.StatusOK, "success")
}
