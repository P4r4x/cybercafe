package orders

import (
	auth2 "CyberCafe/backend/internal/auth"
	"github.com/gin-gonic/gin"
	"net/http"
	"strconv"
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

func (h OrderHandler) GetBasicHandler(c *gin.Context) {

	// 0. 从 JWT 中获取用户 ID
	_ = c.MustGet("claims").(*auth2.Claims)

	// 1. 获取订单 ID
	orderIdStr := c.Param("order_id")
	orderId, err := strconv.ParseInt(orderIdStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid order id"})
		return
	}
	req := &BasicOrderRequest{
		OrderId: orderId,
	}

	// 2. 获取订单基础信息
	basicInfo, err := h.svc.GetBasicOrderService(c, req.OrderId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	}
	c.JSON(http.StatusOK, basicInfo)
}

func (h OrderHandler) PayBalanceHandler(c *gin.Context) {

	var req BalancePaymentRequest

	// 0. 从 JWT 中获取用户 ID
	claims := c.MustGet("claims").(*auth2.Claims)
	uid := claims.UID

	// 1. 解析 JSON
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	// 2. 调用服务层
	err := h.svc.BalancePaymentService(c, uid, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, "success")
}

func (h OrderHandler) HistoryHandler(c *gin.Context) {

	// 0. 从 JWT 中获取用户 ID
	claims := c.MustGet("claims").(*auth2.Claims)
	uid := claims.UID

	// 1. 获取 Page 和 Pagesize
	pageStr := c.DefaultQuery("page", "1")
	// pagesize := c.DefaultQuery("page_size", 10)

	// 暂时不可指定 pagesize
	pageSizeStr := "10"

	page, err := strconv.ParseInt(pageStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid page"})
		return
	}
	pageSize, err := strconv.ParseInt(pageSizeStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid page size"})
		return
	}

	// 2. 获取订单历史
	history, err := h.svc.GetHistoryService(c, uid, page, pageSize)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	}
	c.JSON(http.StatusOK, history)
}

func (h OrderHandler) GetUnpaidHandler(c *gin.Context) {

	// 0. 从 JWT 中获取用户 ID
	claims := c.MustGet("claims").(*auth2.Claims)
	uid := claims.UID

	// 1. 获取未支付订单
	orders, err := h.svc.GetUnpaidService(c, uid)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"orders": orders})
}
