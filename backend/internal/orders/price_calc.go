package orders

import (
	"context"
	"errors"

	"github.com/shopspring/decimal"
)

/*
===========================================================
PriceCalculator 接口（纯计算）
===========================================================
*/

// PriceCalculator
// 只负责在【已校验的 OrderContext】上进行价格计算
// 严禁访问 repo / DB
type PriceCalculator interface {
	Calculate(ctx context.Context, order *OrderContext) (*PriceResult, error)
}

/*
===========================================================
默认实现
===========================================================
*/

// DefaultPriceCalculator
// 无状态、可复用、线程安全
type DefaultPriceCalculator struct {
	Currency string
}

// NewDefaultPriceCalculator 创建
func NewDefaultPriceCalculator(currency string) *DefaultPriceCalculator {
	return &DefaultPriceCalculator{
		Currency: currency,
	}
}

// Calculate
// 输入：OrderContext（权威计算态）
// 输出：PriceResult（完整计价明细）
func (pc *DefaultPriceCalculator) Calculate(
	ctx context.Context,
	order *OrderContext,
) (*PriceResult, error) {

	if order == nil || len(order.Items) == 0 {
		return nil, ErrEmptyOrder
	}

	items := make([]*PriceItemDetail, 0, len(order.Items))
	subtotal := decimal.Zero

	for _, item := range order.Items {
		itemDetail := calculateItem(item)
		items = append(items, itemDetail)
		subtotal = subtotal.Add(itemDetail.ItemAmount)
	}

	return &PriceResult{
		Items:    items,
		Subtotal: subtotal,
		Total:    subtotal, // 预留：税费 / 运费 / 优惠
		Currency: pc.Currency,
	}, nil
}

/*
===========================================================
单 Item 计算（核心 hot path）
===========================================================
*/

func calculateItem(item *OrderItemContext) *PriceItemDetail {
	qty := decimal.NewFromInt32(item.Quantity)

	// unit price = base + options
	unitPrice := item.Product.BasePrice

	opts := make([]PriceOption, 0, len(item.Options))
	for _, opt := range item.Options {
		unitPrice = unitPrice.Add(opt.Value.ExtraPrice)

		opts = append(opts, PriceOption{
			OptionCode:  opt.Option.OptionCode,
			OptionValue: opt.Value.Value,
			ExtraPrice:  opt.Value.ExtraPrice,
		})
	}

	itemAmount := unitPrice.Mul(qty)

	return &PriceItemDetail{
		ProductID:  item.Product.ID,
		Quantity:   int(item.Quantity),
		BasePrice:  item.Product.BasePrice,
		Options:    opts,
		ItemAmount: itemAmount,
	}
}

/*
===========================================================
错误定义
===========================================================
*/

var (
	ErrEmptyOrder = errors.New("empty order context")
)

/*
===========================================================
以下为价格计算结果 entity
===========================================================
*/

// PriceResult
// 整个订单的计价结果
type PriceResult struct {
	Items     []*PriceItemDetail         `json:"items"`
	Subtotal  decimal.Decimal            `json:"subtotal"`
	Total     decimal.Decimal            `json:"total"`
	Currency  string                     `json:"currency"`
	Breakdown map[string]decimal.Decimal `json:"breakdown,omitempty"`
}

// PriceItemDetail
// 单个商品的计价明细
type PriceItemDetail struct {
	ProductID  int64           `json:"product_id"`
	Quantity   int             `json:"quantity"`
	BasePrice  decimal.Decimal `json:"base_price"`
	Options    []PriceOption   `json:"options"`
	ItemAmount decimal.Decimal `json:"item_amount"`
}

// PriceOption
// 单个 option value 的价格影响
type PriceOption struct {
	OptionCode  string          `json:"option_code"`
	OptionValue string          `json:"option_value"`
	ExtraPrice  decimal.Decimal `json:"extra_price"`
}
