package products

import (
	"github.com/shopspring/decimal"
	"time"
)

type ProductResponse struct {
	Items []*ProductInfo `json:"items"`
}

type ProductInfo struct {
	ID          int64               `json:"id" db:"id"`
	Name        string              `json:"name" db:"name"`
	Description string              `json:"description,omitempty" db:"description"`
	BasePrice   decimal.Decimal     `json:"base_price" db:"base_price"`
	IsActive    bool                `json:"is_active" db:"is_active"`
	Options     []ProductOptionInfo `json:"options"` // 非直扫字段
	CreatedAt   time.Time           `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time           `json:"updated_at" db:"updated_at"`
}

type ProductOptionInfo struct {
	ID         int64                    `json:"id" db:"id"`
	ProductID  int64                    `json:"product_id" db:"product_id"`
	OptionCode string                   `json:"option_code" db:"option_code"`
	OptionType string                   `json:"option_type" db:"option_type"`
	Required   bool                     `json:"required" db:"required"`
	CreatedAt  time.Time                `json:"created_at" db:"created_at"`
	Values     []ProductOptionValueInfo `json:"values"` // 非直扫字段
}

type ProductOptionValueInfo struct {
	ID         int64           `json:"id" db:"id"`
	OptionID   int64           `json:"option_id,omitempty" db:"option_id"`
	Value      string          `json:"value" db:"value"`
	ExtraPrice decimal.Decimal `json:"extra_price" db:"extra_price"`
	CreatedAt  time.Time       `json:"created_at" db:"created_at"`
}
