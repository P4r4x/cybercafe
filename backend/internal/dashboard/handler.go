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
