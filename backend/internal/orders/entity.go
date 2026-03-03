package orders

import (
	"github.com/shopspring/decimal"
	"time"
)

// ===== submit 功能相关 =====

// 1. 接收前端 json

// OrderRequest 订单请求
type OrderRequest struct {
	Items []*OrderItem `json:"items"`

	// 优惠券, 暂时留空
	// TODO 优惠券
	Coupons []string `json:"coupons,omitempty"`
}

// OrderItem 单个商品的订单请求
type OrderItem struct {
	ProductID int64              `json:"product_id"`
	Quantity  int32              `json:"quantity"`
	Options   []*OrderItemOption `json:"options,omitempty"`
}

// OrderItemOption 商品选项
type OrderItemOption struct {
	OptionCode string   `json:"option_code"`
	Values     []string `json:"values"`
}

// 2. 用于 DB 查询 / 校验的结构

// ProductSnapshot 商品基础信息
type ProductSnapshot struct {
	ID        int64
	Name      string
	BasePrice decimal.Decimal
	IsActive  bool
}

// ProductOptionSnapshot 商品选项快照
type ProductOptionSnapshot struct {
	ID         int64
	ProductID  int64
	OptionCode string
	OptionType string // single / multi
	Required   bool
}

// ProductOptionValueSnapshot 商品选项值快照
type ProductOptionValueSnapshot struct {
	ID         int64
	OptionID   int64
	Value      string
	ExtraPrice decimal.Decimal
}

// 3. 聚合后的 可计算结构: 辅助结构, 防止到处 map + join

// OrderContext 一次提交订单的权威上下文
type OrderContext struct {
	Items []*OrderItemContext
}

// OrderItemContext 一件商品在订单中的计算态
type OrderItemContext struct {
	Product  ProductSnapshot
	Quantity int32
	Options  []*OrderOptionContext
}

// OrderOptionContext 一个被选中的 option + value
type OrderOptionContext struct {
	Option ProductOptionSnapshot
	Value  ProductOptionValueSnapshot
}

// 4. 返回前端的结构

// SubmitResponse 应答
type SubmitResponse struct {
	Result *PriceResult `json:"result"`
	Token  string       `json:"token"`
}

// ===== Confirm 功能相关 =====

// 1. 接收前端数据

type ConfirmRequest struct {
	Order  OrderRequest `json:"order"`
	Result *PriceResult `json:"result"`
	Token  string       `json:"token"`
}

// 2. 传回前端结构

type OrderId int64

type ConfirmResponse struct {
	Id          OrderId      `json:"order_id"`
	ExpiredAt   time.Time    `json:"expired_at"`
	PriceResult *PriceResult `json:"result"`
}

// 3. (数据库) 持久化相关结构

// PersistOrder 持久化订单的属性主表
type PersistOrder struct {
	ID          int64           `db:"id"`
	UID         string          `db:"user_id"`
	TotalAmount decimal.Decimal `db:"total_amount"`
	Status      string          `db:"status"`
	CreatedAt   time.Time       `db:"created_at"`
	UpdatedAt   time.Time       `db:"updated_at"`
	ExpiredAt   time.Time       `db:"expired_at"`
}

// PersistOrderItem 持久化订单的商品属性表
type PersistOrderItem struct {
	ID          int64           `db:"id"`
	OrderID     int64           `db:"order_id"`
	ProductID   int64           `db:"product_id"`
	ProductName string          `db:"product_name"`
	Quantity    int32           `db:"quantity"`
	BasePrice   decimal.Decimal `db:"base_price"`
	CreatedAt   time.Time       `db:"created_at"`
}

// PersistOrderItemOption 持久化订单的商品选项表
type PersistOrderItemOption struct {
	ID          int64           `db:"id"`
	OrderItemID int64           `db:"order_item_id"`
	OptionCode  string          `db:"option_code"`
	OptionValue string          `db:"option_value"`
	ExtraPrice  decimal.Decimal `db:"extra_price"`
	CreatedAt   time.Time       `db:"created_at"`
}

// ===== Cancel 功能相关 =====

type CancelRequest struct {
	OrderId int64 `json:"order_id"`
}

// ===== Query 基本查找功能相关 =====

type BasicOrderRequest struct {
	OrderId int64 `json:"order_id"`
}

type BasicOrderResponse struct {
	Id          int64     `json:"order_id" db:"id"`
	UserId      string    `json:"user_id" db:"user_id"`
	TotalAmount string    `json:"total_amount" db:"total_amount"`
	Status      string    `json:"status" db:"status"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
	ExpiredAt   time.Time `json:"expired_at" db:"expired_at"`
}

// ===== 余额支付相关 =====

type BalancePaymentRequest struct {
	OrderId int64 `json:"order_id"`
}

// ===== 订单明细相关 =====

// 1. 请求结构

type OrderHistoryRequest struct {
	Page     int `json:"page"`
	PageSize int `json:"page_size"`
}

// 2. 响应结构

type HistoryResponse struct {
	History    []*OrderHistory `json:"history"`
	Total      int64           `json:"total"`
	TotalPages int64           `json:"total_pages"`
}

type OrderHistory struct {
	ID          int64               `json:"id"`
	UserID      string              `json:"user_id"`
	Status      string              `json:"status"`
	TotalAmount decimal.Decimal     `json:"total_amount"`
	CreatedAt   time.Time           `json:"created_at"`
	ExpiredAt   time.Time           `json:"expired_at"`
	Items       []*OrderHistoryItem `json:"items"`
}

type OrderHistoryItem struct {
	ID          int64                    `json:"id"`
	ProductID   int64                    `json:"product_id"`
	ProductName string                   `json:"product_name"`
	Quantity    int                      `json:"quantity"`
	BasePrice   decimal.Decimal          `json:"base_price"`
	Options     []OrderHistoryItemOption `json:"options"`
}

type OrderHistoryItemOption struct {
	ID          int64           `json:"id"`
	OptionCode  string          `json:"option_code"`
	OptionValue string          `json:"option_value"`
	ExtraPrice  decimal.Decimal `json:"extra_price"`
}
