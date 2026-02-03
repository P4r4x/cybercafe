package products

import (
	"github.com/shopspring/decimal"
	"time"
)

// ProductBase 商品基础信息
type ProductBase struct {
	ID        int64           `db:"id"`
	Name      string          `db:"name"`
	BasePrice decimal.Decimal `db:"base_price"`
	IsActive  bool            `db:"is_active"`
	CreatedAt time.Time       `db:"created_at"`
	UpdatedAt time.Time       `db:"updated_at"`
}

// ProductOption 商品选项
type ProductOption struct {
	ID         int64     `db:"id"`
	ProductID  int64     `db:"product_id"`
	OptionCode string    `db:"option_code"` // size / sugar / topping / temp
	OptionType string    `db:"option_type"` // single / multi
	Required   bool      `db:"required"`
	CreatedAt  time.Time `db:"created_at"`
}

// ProductOptionValue 商品选项值
type ProductOptionValue struct {
	ID         int64           `db:"id"`
	OptionID   int64           `db:"option_id"`
	Value      string          `db:"value"`
	ExtraPrice decimal.Decimal `db:"extra_price"`
	CreatedAt  time.Time       `db:"created_at"`
}

// Product 商品视图
type Product struct {
	ID        int64           `json:"id"`
	Name      string          `json:"name"`
	BasePrice decimal.Decimal `json:"base_price"`
	IsActive  bool            `json:"is_active"`

	// options 按 option_code 聚合
	Options map[string]ProductOptionView `json:"options"`
}

// ProductOptionView 商品选项视图
type ProductOptionView struct {
	Type     string                   `json:"type"`     // single / multi
	Required bool                     `json:"required"` // 是否必选
	Values   []ProductOptionValueView `json:"values"`
}

// ProductOptionValueView 商品选项值视图
type ProductOptionValueView struct {
	Value      string          `json:"value"`
	ExtraPrice decimal.Decimal `json:"extra_price"`
}
