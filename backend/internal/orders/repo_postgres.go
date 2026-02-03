package orders

import (
	"context"
	"database/sql"
	"errors"
	_ "github.com/jackc/pgx/v5/stdlib"
)

type PostgresRepo struct {
	db *sql.DB
	tx *sql.Tx
}

func NewPostgresRepo(db *sql.DB) OrderRepo {
	return &PostgresRepo{
		db: db,
	}
}

var (
	ErrInvalidQuantity     = errors.New("invalid quantity")
	ErrProductNotFound     = errors.New("product not found or inactive")
	ErrOptionNotFound      = errors.New("product option not found")
	ErrOptionValueNotFound = errors.New("option value not found")
	ErrInvalidOptionValue  = errors.New("invalid option value count")
)

// Commit 提交事务
func (r *PostgresRepo) Commit() error {
	return r.tx.Commit()
}

// Rollback 回滚事务
func (r *PostgresRepo) Rollback() error {
	return r.tx.Rollback()
}

// BeginTx 开启事务
func (r *PostgresRepo) BeginTx(ctx context.Context) (OrderTx, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}

	return &PostgresRepo{
		db: r.db,
		tx: tx,
	}, nil
}

// ValidateOrder 纯校验订单数据，不构建上下文
func (r *PostgresRepo) ValidateOrder(
	ctx context.Context,
	req *OrderRequest,
) error {

	if req == nil || len(req.Items) == 0 {
		return errors.New("empty order items")
	}

	// 1. 收集 product_id
	productIDs := collectProductIDs(req.Items)

	// 2. 批量加载 + 聚合
	productMap, err := r.loadProductAgg(ctx, productIDs)
	if err != nil {
		return err
	}

	// 3. 校验每个 item（不构建上下文）
	for _, item := range req.Items {
		if err := validateItem(item, productMap); err != nil {
			return err
		}
	}

	return nil
}

// BuildOrderContext 纯构建 OrderContext，不做校验
func (r *PostgresRepo) BuildOrderContext(
	ctx context.Context,
	req *OrderRequest,
) (*OrderContext, error) {

	if req == nil || len(req.Items) == 0 {
		return nil, errors.New("empty order items")
	}

	// 1. 收集 product_id
	productIDs := collectProductIDs(req.Items)

	// 2. 批量加载 + 聚合
	productMap, err := r.loadProductAgg(ctx, productIDs)
	if err != nil {
		return nil, err
	}

	// 3. 构建 OrderContext
	orderCtx := &OrderContext{
		Items: make([]*OrderItemContext, 0, len(req.Items)),
	}

	for _, item := range req.Items {
		itemCtx, err := buildItemContext(item, productMap)
		if err != nil {
			return nil, err
		}
		orderCtx.Items = append(orderCtx.Items, itemCtx)
	}

	return orderCtx, nil
}

// CheckOrder 预检查订单 + 构建计算态上下文
func (r *PostgresRepo) CheckOrder(
	ctx context.Context,
	req *OrderRequest,
) (*OrderContext, error) {

	// 注: 此处将原有函数拆成了两个部分方便外部复用

	if err := r.ValidateOrder(ctx, req); err != nil {
		return nil, err
	}

	return r.BuildOrderContext(ctx, req)
}

/*
===========================================================
持久化方法实现
===========================================================
*/

// CreateOrder 创建订单主记录
func (r *PostgresRepo) CreateOrder(ctx context.Context, order *PersistOrder) (int64, error) {
	if order == nil {
		return 0, errors.New("nil order")
	}

	query := `
		INSERT INTO orders (user_id, total_amount, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id
	`

	var orderID int64
	err := r.tx.QueryRowContext(ctx, query,
		order.UID,
		order.TotalAmount,
		order.Status,
		order.CreatedAt,
		order.UpdatedAt,
	).Scan(&orderID)

	if err != nil {
		return 0, err
	}

	return orderID, nil
}

// CreateOrderItems 批量创建订单商品记录
func (r *PostgresRepo) CreateOrderItems(ctx context.Context, items []*PersistOrderItem) ([]int64, error) {
	if len(items) == 0 {
		return nil, nil
	}

	query := `
		INSERT INTO order_items (order_id, product_id, product_name, quantity, base_price, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id
	`

	itemIDs := make([]int64, 0, len(items))
	for _, item := range items {
		var itemID int64
		err := r.tx.QueryRowContext(ctx, query,
			item.OrderID,
			item.ProductID,
			item.ProductName,
			item.Quantity,
			item.BasePrice,
			item.CreatedAt,
		).Scan(&itemID)

		if err != nil {
			return nil, err
		}

		itemIDs = append(itemIDs, itemID)
	}

	return itemIDs, nil
}

// CreateOrderItemOptions 批量创建订单商品选项记录
func (r *PostgresRepo) CreateOrderItemOptions(ctx context.Context, options []*PersistOrderItemOption) error {
	if len(options) == 0 {
		return nil
	}

	query := `
		INSERT INTO order_item_options (order_item_id, option_code, option_value, extra_price, created_at)
		VALUES ($1, $2, $3, $4, $5)
	`

	for _, opt := range options {
		_, err := r.tx.ExecContext(ctx, query,
			opt.OrderItemID,
			opt.OptionCode,
			opt.OptionValue,
			opt.ExtraPrice,
			opt.CreatedAt,
		)

		if err != nil {
			return err
		}
	}

	return nil
}

/*
===========================================================
取消订单方法实现
===========================================================
*/

func (r *PostgresRepo) CancelOrder(ctx context.Context, uid string, orderID int64) error {
	query := `
		UPDATE orders
		SET status = 'canceled'
		WHERE id = $1 
		AND user_id = $2
		AND status in ('created', 'expired')
	`

	// 注意, 不需要事务的时候使用 r.db; 需要时使用 r.tx
	_, err := r.db.ExecContext(ctx, query, orderID, uid)
	if err != nil {
		return err
	}
	return nil
}
