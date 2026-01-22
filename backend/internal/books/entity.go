package books

import (
	"CyberCafe/backend/internal/infra/db"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/shopspring/decimal"
	"time"
)

type BookID string

type JSONMap map[string]string

type Book struct {
	UUID      pgtype.UUID     `json:"uuid"`
	Id        BookID          `json:"id"`
	Total     int             `json:"total"`
	Remain    int             `json:"remain"`
	Title     string          `json:"title"`
	Author    string          `json:"author"`
	Publisher string          `json:"publisher"`
	Price     decimal.Decimal `json:"price"`
	HasEBook  bool            `json:"has_ebook"`
	Extra     db.JSONMap      `json:"extra"`
	CreateAt  time.Time       `json:"created_at"`
	UpdateAt  time.Time       `json:"updated_at"`
}

// BookQuery 查询图书参数
// 全部用指针的好处是, 如果某个字段为空, 则不会被赋值 (nil)
// 和空值相区分, 这么做非常干净
type BookQuery struct {
	ID        *BookID `json:"id"`
	Title     *string `json:"title"`
	Author    *string `json:"author"`
	Publisher *string `json:"publisher"`
}

// BookDetailQuery 获取图书详情参数
type BookDetailQuery struct {
	ID *BookID `json:"id"`
}

// BookChangeRemainRequest 借阅图书参数
type BookChangeRemainRequest struct {
	ID     BookID `json:"id"`
	Amount int    `json:"amount"`
}

// BookChangeStockRequest 修改图书库存服务
type BookChangeStockRequest struct {
	ID     BookID `json:"id"`
	Amount int    `json:"amount"`
}

// SearchBooksReq 复合查询参数结构
// 全部用指针的好处是, 如果某个字段为空, 则不会被赋值 (nil)
// 和空值相区分, 这么做非常干净
type SearchBooksReq struct {
	Title     *string          `json:"title"`
	Author    *string          `json:"author"`
	Publisher *string          `json:"publisher"`
	PriceMin  *decimal.Decimal `json:"price_min"`
	PriceMax  *decimal.Decimal `json:"price_max"`
	HasRemain *bool            `json:"has_remain"`
	HasEbook  *bool            `json:"has_ebook"`
}

// BorrowStatus 用户借阅状态, 是否有逾期, 借阅可用额度
type BorrowStatus struct {
	HasOverdue bool
	UsedAmount int
}
