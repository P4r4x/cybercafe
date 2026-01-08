package books

import (
	"errors"
	"github.com/gin-gonic/gin"
	"net/http"
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
		_, err := h.svc.BookBorrowService(c.Request.Context(), query)
		if err != nil {
			// 4. 错误处理, 状态码映射
			ErrorHandler(err, c)
			return
		}
	case Return:
		// 3. 调用对应的 BookService
		_, err := h.svc.BookReturnService(c.Request.Context(), query)
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
