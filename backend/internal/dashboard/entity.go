package dashboard

import (
	"github.com/shopspring/decimal"
	"time"
)

// DashboardResponse 定义仪表盘返回数据, 有三个部分, 保持这个结构易于扩展
type DashboardResponse struct {
	User  UserInfo    `json:"user"`
	Stats BorrowStats `json:"stats"`
}

// UserInfo 仪表盘用户信息
type UserInfo struct {
	UID         string          `json:"uid"`
	Username    string          `json:"username"`
	Level       int             `json:"level"`
	Exp         int64           `json:"exp"`
	ExpRequired int64           `json:"exp_required"`
	Balance     decimal.Decimal `json:"balance"`
}

// BorrowStats 借阅统计
type BorrowStats struct {
	Current int `json:"current"`
	Limit   int `json:"limit"`
}

// RecentBorrowResp 最近借阅记录, 为了方便前端读取, 做了结构一致的处理
type RecentBorrowResp struct {
	Records []BorrowItem `json:"records"`
}

// RecentRecords 最近借阅记录, 数组结构
type RecentRecords struct {
	Records []BorrowItem `json:"records"`
}

// BorrowItem 借阅记录
type BorrowItem struct {
	BookID   string     `json:"book_id"`
	Title    string     `json:"title"`
	BorrowAt time.Time  `json:"borrow_at"`
	DueAt    time.Time  `json:"due_at"`
	ReturnAt *time.Time `json:"return_at,omitempty"`
}
