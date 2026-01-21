package books

import (
	auth2 "CyberCafe/backend/internal/auth"
	"errors"
	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
	"net/http"
	"strings"
)

type BookHandler struct {
	svc *BookService
}

const (
	Borrow = "borrow"
	Return = "return"
)

// ErrorHandler 借还书解释器的错误映射
func ErrorHandler(err error, c *gin.Context) {
	switch {
	case errors.Is(err, ErrBookNotFound):
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})

	case errors.Is(err, ErrNotEnoughRemain):
		c.JSON(http.StatusConflict, gin.H{"error": err.Error()})

	case errors.Is(err, ErrExceedTotal):
		c.JSON(http.StatusConflict, gin.H{"error": err.Error()})

	case errors.Is(err, ErrInvalidAmount):
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})

	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
	}
	return
}
func NewHandler(svc *BookService) *BookHandler {
	return &BookHandler{svc: svc}
}

// BookQueryHandler 查询图书的解释器, 从 POST 中解析参数
func (h *BookHandler) BookQueryHandler(c *gin.Context) {
	var req BookQuery

	// 1. 解析 JSON
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	// 2. 参数基础检查
	if req.Author == nil && req.ID == nil && req.Publisher == nil && req.Title == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "at least one condition is required"})
		return
	}

	// 3. 调用 BookService
	books, err := h.svc.BookQueryService(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 4. 响应, 返回查到的 图书列表
	c.JSON(200, books)
}

// BookChangeRemainHandler
// POST /api/books/borrow: 借 / 还书的接口, 接受唯一参数, 获取图书的库存信息, 尝试借 / 还;
func (h *BookHandler) BookChangeRemainHandler(c *gin.Context) {
	var req BookChangeRemainRequest

	// 0. 从 JWT 中获取用户 ID
	claims := c.MustGet("claims").(*auth2.Claims) // 你已有
	uid := claims.UID

	// 1. 解析 JSON
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	// 2. 基础参数校验
	// 改变量必须大于 0
	if req.Amount <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "amount must be greater than 0"})
		return
	}
	// 只能接受 id 参数, 防止多结果
	if req.ID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "book id is required"})
		return
	}

	// 载入查询参数
	query := BookChangeRemainRequest{
		ID:     req.ID,
		Amount: req.Amount,
	}

	action, _ := c.Get("action")
	switch action {
	case Borrow:
		// 3. 调用对应的 BookService
		_, err := h.svc.BookBorrowService(c.Request.Context(), uid, query)
		if err != nil {
			// 4. 错误处理, 状态码映射
			ErrorHandler(err, c)
			return
		}
	case Return:
		// 3. 调用对应的 BookService
		_, err := h.svc.BookReturnService(c.Request.Context(), uid, query)
		if err != nil {
			// 4. 错误处理, 状态码映射
			ErrorHandler(err, c)
			return
		}
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid action"})
	}

	// 5. 成功响应
	c.JSON(http.StatusOK, gin.H{"message": "action success"})
}

func (h *BookHandler) BookAddStockHandler(c *gin.Context) {

	var req BookChangeStockRequest

	// 1. 解析 JSON
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	// 2. 基础参数校验
	// 只能接受 id 参数, 防止多结果
	if req.ID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "book id is required"})
		return
	}

	query := BookChangeStockRequest{
		ID:     req.ID,
		Amount: req.Amount,
	}

	_, err := h.svc.BookAddStockService(c.Request.Context(), query)
	if err != nil {
		// 3. 错误处理, 状态码映射
		ErrorHandler(err, c)
		return
	}

	// 4. 成功响应
	c.JSON(http.StatusOK, gin.H{"message": "action success"})
}

func (h *BookHandler) BookSearchHandler(c *gin.Context) {
	var req SearchBooksReq

	// 1. 解析 JSON
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request body",
		})
		return
	}

	// 2. 至少一个条件
	if req.Title == nil &&
		req.Author == nil &&
		req.Publisher == nil &&
		req.PriceMin == nil &&
		req.PriceMax == nil &&
		req.HasRemain == nil &&
		req.HasEbook == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "at least one condition is required",
		})
		return
	}

	// 3. 文本字段过滤（trim + 长度限制）
	const maxTextLen = 100

	cleanText := func(s *string) error {
		if s == nil {
			return nil
		}
		v := strings.TrimSpace(*s)
		if v == "" {
			return errors.New("text field cannot be empty")
		}
		if len([]rune(v)) > maxTextLen {
			return errors.New("text field too long")
		}
		*s = v
		return nil
	}

	if err := cleanText(req.Title); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid title"})
		return
	}
	if err := cleanText(req.Author); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid author"})
		return
	}
	if err := cleanText(req.Publisher); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid publisher"})
		return
	}

	// 4. price 区间校验
	if req.PriceMin != nil && req.PriceMin.LessThan(decimal.Zero) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "price_min must be >= 0"})
		return
	}
	if req.PriceMax != nil && req.PriceMax.LessThan(decimal.Zero) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "price_max must be >= 0"})
		return
	}
	if req.PriceMin != nil && req.PriceMax != nil {
		if req.PriceMin.GreaterThan(*req.PriceMax) {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "price_min cannot be greater than price_max",
			})
			return
		}
	}

	// 5. 调用 service
	books, err := h.svc.BookSearchService(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"items": books,
	})
}
