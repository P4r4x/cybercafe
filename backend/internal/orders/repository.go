package orders

import "context"

type OrderRepo interface {
	BeginTx(ctx context.Context) (OrderTx, error)
	CheckOrder(ctx context.Context, req *OrderRequest) (*OrderContext, error)
	ValidateOrder(ctx context.Context, req *OrderRequest) error
	BuildOrderContext(ctx context.Context, req *OrderRequest) (*OrderContext, error)
	CancelOrder(ctx context.Context, uid string, orderID int64) error
}

type OrderTx interface {
	CreateOrder(ctx context.Context, order *PersistOrder) (int64, error)
	CreateOrderItems(ctx context.Context, items []*PersistOrderItem) ([]int64, error)
	CreateOrderItemOptions(ctx context.Context, options []*PersistOrderItemOption) error

	Commit() error
	Rollback() error
}
