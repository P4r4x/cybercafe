package products

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

type ProductHandler struct {
	svc *ProductService
}

func NewHandler(svc *ProductService) *ProductHandler {
	return &ProductHandler{
		svc: svc,
	}
}

func (h *ProductHandler) ProductListHandler(c *gin.Context) {
	productList, err := h.svc.ProductListService(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	}
	c.JSON(http.StatusOK, productList)
}
