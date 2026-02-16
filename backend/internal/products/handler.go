package products

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type ProductHandler struct {
	svc *ProductService
}

func NewHandler(svc *ProductService) *ProductHandler {
	return &ProductHandler{svc: svc}
}

func (h *ProductHandler) GetAllHandler(c *gin.Context) {
	products, err := h.svc.GetAllProducts(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch products"})
		return
	}

	c.JSON(http.StatusOK, products)
}
