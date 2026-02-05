package dashboard

import (
	auth2 "CyberCafe/backend/internal/auth"
	"github.com/gin-gonic/gin"
	"net/http"
)

type Handler struct {
	svc *DashboardService
}

func NewHandler(svc *DashboardService) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) DashboardHandler(c *gin.Context) {

	// 从 JWT 中获取用户 ID
	claims := c.MustGet("claims").(*auth2.Claims) // 你已有
	uid := claims.UID

	resp, err := h.svc.GetDashboardService(c.Request.Context(), uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to load dashboard",
		})
		return
	}

	c.JSON(http.StatusOK, resp)
}

func (h *Handler) RecentRecordsHandler(c *gin.Context) {
	// 从 JWT 中获取用户 ID
	claims := c.MustGet("claims").(*auth2.Claims) // 你已有
	uid := claims.UID

	// 获取最近借阅记录, 数量暂时写死为 10
	resp, err := h.svc.BorrowHistoryService(c.Request.Context(), uid, 10)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to read history",
		})
		return
	}

	c.JSON(http.StatusOK, RecentBorrowResp{
		Records: resp,
	})
}
