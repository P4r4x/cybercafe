package orders

import (
	"context"
	"database/sql"
	"errors"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/shopspring/decimal"
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
	ErrOrderNotPayable     = errors.New("order not payable")
	ErrOrderExpired        = errors.New("order has expired")
	ErrUserNotExist        = errors.New("user not exist")
	ErrInsufficientBalance = errors.New("insufficient balance")
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

	const query = `
		INSERT INTO orders (user_id, total_amount, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, expired_at
	`

	var orderID int64
	var expiredAt time.Time
	err := r.tx.QueryRowContext(ctx, query,
		order.UID,
		order.TotalAmount,
		order.Status,
		order.CreatedAt,
		order.UpdatedAt,
	).Scan(&orderID, &expiredAt)

	if err != nil {
		return 0, err
	}

	order.ExpiredAt = expiredAt

	return orderID, nil
}

// CreateOrderItems 批量创建订单商品记录
func (r *PostgresRepo) CreateOrderItems(ctx context.Context, items []*PersistOrderItem) ([]int64, error) {
	if len(items) == 0 {
		return nil, nil
	}

	const query = `
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

	const query = `
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
	const query = `
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

/*
===========================================================
获取订单基础信息方法实现
===========================================================
*/

// GetBasicOrder 获取订单基础信息, 仅返回基础信息 (id, 价格, 状态)
func (r *PostgresRepo) GetBasicOrder(ctx context.Context, orderID int64) (*BasicOrderResponse, error) {
	const query = `
		SELECT id, created_at, expired_at, status, total_amount, user_id
		FROM orders
		WHERE id = $1
	`

	res := &BasicOrderResponse{}

	rows, err := r.db.QueryContext(ctx, query, orderID)
	if err != nil {
		return nil, err
	}
	defer func(rows *sql.Rows) {
		err := rows.Close()
		if err != nil {

		}
	}(rows)

	// 扫描结果
	for rows.Next() {
		if err := rows.Scan(
			&res.Id,
			&res.CreatedAt,
			&res.ExpiredAt,
			&res.Status,
			&res.TotalAmount,
			&res.UserId,
		); err != nil {
			return nil, err
		}
	}

	return res, nil
}

/*
===========================================================
余额支付方法实现
===========================================================
*/

// CommitOrderPayment 尝试进行余额扣款
func (r *PostgresRepo) CommitOrderPayment(ctx context.Context, uid string, orderID int64) error {

	var (
		totalAmount decimal.Decimal
		balance     decimal.Decimal
		expiredAt   time.Time
	)

	// 1. 归属查询, 并上锁
	const query1 = `
		SELECT total_amount, expired_at
		FROM orders
		WHERE id = $1
		  AND user_id = $2
		  AND status = 'created'
	`
	err := r.tx.QueryRowContext(ctx, query1, orderID, uid).Scan(&totalAmount, &expiredAt)
	if errors.Is(err, sql.ErrNoRows) {
		return ErrOrderNotPayable
	}
	if err != nil {
		return err
	}

	// 2. 过期校验
	const query2 = `
	UPDATE orders
	SET status = 'expired',
		updated_at = now()
	WHERE id = $1
	`

	// 如果订单过期, 更新状态并返回错误
	if expiredAt.Before(time.Now()) {
		_, err := r.tx.ExecContext(ctx, query2, orderID)
		if err != nil {
			return err
		}
		return ErrOrderExpired
	}

	// 3. 锁账户
	const query3 = `
	SELECT balance
	FROM user_account
	WHERE uid = $1
	AND status = 'active'
	FOR UPDATE;
	`
	err = r.tx.QueryRowContext(ctx, query3, uid).Scan(&balance)
	if errors.Is(err, sql.ErrNoRows) {
		return ErrUserNotExist
	}
	if balance.LessThan(totalAmount) {
		return ErrInsufficientBalance
	}

	// 4. 扣款
	const query4 = `
	UPDATE user_account
	SET balance = balance - $1,
		updated_at = now()
	WHERE uid = $2
	AND balance >= $1
	`

	var res sql.Result
	res, err = r.tx.ExecContext(ctx, query4, totalAmount, uid)
	if err != nil {
		return err
	}

	// 兜底逻辑
	rows, _ := res.RowsAffected()
	if rows == 0 {
		return ErrInsufficientBalance
	}

	// 5. 支付成功时更新订单状态
	const query5 = `
	UPDATE orders
	SET status = 'paid',
		updated_at = now()
	WHERE id = $1
	`
	_, err = r.tx.ExecContext(ctx, query5, orderID)

	if err != nil {
		return err
	}
	return nil
}

/*
===========================================================
返回用户订单历史的方法
===========================================================
*/

func (r *PostgresRepo) GetHistory(
	ctx context.Context,
	uid string,
	page int64,
	pageSize int64,
) (*HistoryResponse, error) {

	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 || pageSize > 100 {
		pageSize = 10
	}

	offset := (page - 1) * pageSize

	// =============================
	// 1. 查询总数
	// =============================
	var total int64
	err := r.db.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM orders WHERE user_id = $1
	`, uid).Scan(&total)
	if err != nil {
		return nil, err
	}

	totalPages := (total + pageSize - 1) / pageSize

	// =============================
	// 2. 查询订单列表
	// =============================
	orderRows, err := r.db.QueryContext(ctx, `
		SELECT id, user_id, status, total_amount, created_at, expired_at
		FROM orders
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`, uid, pageSize, offset)
	if err != nil {
		return nil, err
	}
	defer func(orderRows *sql.Rows) {
		err := orderRows.Close()
		if err != nil {

		}
	}(orderRows)

	var orders []*OrderHistory
	orderMap := make(map[int64]*OrderHistory)
	var orderIDs []int64

	for orderRows.Next() {
		var o OrderHistory

		err := orderRows.Scan(
			&o.ID,
			&o.UserID,
			&o.Status,
			&o.TotalAmount,
			&o.CreatedAt,
			&o.ExpiredAt,
		)
		if err != nil {
			return nil, err
		}

		o.Items = make([]*OrderHistoryItem, 0)

		orderMap[o.ID] = &o
		orderIDs = append(orderIDs, o.ID)
		orders = append(orders, &o)
	}

	if err := orderRows.Err(); err != nil {
		return nil, err
	}

	// 没有订单直接返回
	if len(orderIDs) == 0 {
		return &HistoryResponse{History: orders, Total: total, TotalPages: totalPages}, nil
	}

	// =============================
	// 3. 查询所有 order_items
	// =============================
	itemRows, err := r.db.QueryContext(ctx, `
		SELECT id, order_id, product_id, product_name, quantity, base_price
		FROM order_items
		WHERE order_id = ANY($1)
	`, orderIDs)
	if err != nil {
		return nil, err
	}
	defer func(itemRows *sql.Rows) {
		err := itemRows.Close()
		if err != nil {

		}
	}(itemRows)

	itemMap := make(map[int64]*OrderHistoryItem)
	var itemIDs []int64

	for itemRows.Next() {
		var item OrderHistoryItem
		var orderID int64

		err := itemRows.Scan(
			&item.ID,
			&orderID,
			&item.ProductID,
			&item.ProductName,
			&item.Quantity,
			&item.BasePrice,
		)
		if err != nil {
			return nil, err
		}

		item.Options = make([]OrderHistoryItemOption, 0)

		itemMap[item.ID] = &item
		itemIDs = append(itemIDs, item.ID)

		if order, ok := orderMap[orderID]; ok {
			order.Items = append(order.Items, &item)
		}
	}

	if err := itemRows.Err(); err != nil {
		return nil, err
	}

	// 没有 item
	if len(itemIDs) == 0 {
		return &HistoryResponse{History: orders, Total: total, TotalPages: totalPages}, nil
	}

	// =============================
	// 4. 查询所有 options
	// =============================
	optionRows, err := r.db.QueryContext(ctx, `
		SELECT id, order_item_id, option_code, option_value, extra_price
		FROM order_item_options
		WHERE order_item_id = ANY($1)
	`, itemIDs)
	if err != nil {
		return nil, err
	}
	defer func(optionRows *sql.Rows) {
		err := optionRows.Close()
		if err != nil {

		}
	}(optionRows)

	for optionRows.Next() {
		var opt OrderHistoryItemOption
		var itemID int64

		err := optionRows.Scan(
			&opt.ID,
			&itemID,
			&opt.OptionCode,
			&opt.OptionValue,
			&opt.ExtraPrice,
		)
		if err != nil {
			return nil, err
		}

		if item, ok := itemMap[itemID]; ok {
			item.Options = append(item.Options, opt)
		}
	}

	if err := optionRows.Err(); err != nil {
		return nil, err
	}

	return &HistoryResponse{History: orders, Total: total, TotalPages: totalPages}, nil
}

/*
===========================================================
获取用户所有未支付订单
===========================================================
*/

// GetUnpaidOrders 获取所有未支付订单, 带详情; 复用了获取历史订单的逻辑
func (r *PostgresRepo) GetUnpaidOrders(ctx context.Context, uid string) ([]*OrderHistory, error) {

	// =============================
	// 1. 查询未支付订单列表
	// =============================
	orderRows, err := r.db.QueryContext(ctx, `
		SELECT id, user_id, status, total_amount, created_at, expired_at
		FROM orders
		WHERE user_id = $1 AND status = 'created'
		ORDER BY created_at DESC
	`, uid)
	if err != nil {
		return nil, err
	}
	defer func(orderRows *sql.Rows) {
		err := orderRows.Close()
		if err != nil {

		}
	}(orderRows)

	var orders []*OrderHistory
	orderMap := make(map[int64]*OrderHistory)
	var orderIDs []int64

	for orderRows.Next() {
		var o OrderHistory

		err := orderRows.Scan(
			&o.ID,
			&o.UserID,
			&o.Status,
			&o.TotalAmount,
			&o.CreatedAt,
			&o.ExpiredAt,
		)
		if err != nil {
			return nil, err
		}

		o.Items = make([]*OrderHistoryItem, 0)

		orderMap[o.ID] = &o
		orderIDs = append(orderIDs, o.ID)
		orders = append(orders, &o)
	}

	if err := orderRows.Err(); err != nil {
		return nil, err
	}

	// 没有未支付订单直接返回
	if len(orderIDs) == 0 {
		return orders, nil
	}

	// =============================
	// 2. 查询所有 order_items
	// =============================
	itemRows, err := r.db.QueryContext(ctx, `
		SELECT id, order_id, product_id, product_name, quantity, base_price
		FROM order_items
		WHERE order_id = ANY($1)
	`, orderIDs)
	if err != nil {
		return nil, err
	}
	defer func(itemRows *sql.Rows) {
		err := itemRows.Close()
		if err != nil {

		}
	}(itemRows)

	itemMap := make(map[int64]*OrderHistoryItem)
	var itemIDs []int64

	for itemRows.Next() {
		var item OrderHistoryItem
		var orderID int64

		err := itemRows.Scan(
			&item.ID,
			&orderID,
			&item.ProductID,
			&item.ProductName,
			&item.Quantity,
			&item.BasePrice,
		)
		if err != nil {
			return nil, err
		}

		item.Options = make([]OrderHistoryItemOption, 0)

		itemMap[item.ID] = &item
		itemIDs = append(itemIDs, item.ID)

		if order, ok := orderMap[orderID]; ok {
			order.Items = append(order.Items, &item)
		}
	}

	if err := itemRows.Err(); err != nil {
		return nil, err
	}

	// 没有 item
	if len(itemIDs) == 0 {
		return orders, nil
	}

	// =============================
	// 3. 查询所有 options
	// =============================
	optionRows, err := r.db.QueryContext(ctx, `
		SELECT id, order_item_id, option_code, option_value, extra_price
		FROM order_item_options
		WHERE order_item_id = ANY($1)
	`, itemIDs)
	if err != nil {
		return nil, err
	}
	defer func(optionRows *sql.Rows) {
		err := optionRows.Close()
		if err != nil {

		}
	}(optionRows)

	for optionRows.Next() {
		var opt OrderHistoryItemOption
		var itemID int64

		err := optionRows.Scan(
			&opt.ID,
			&itemID,
			&opt.OptionCode,
			&opt.OptionValue,
			&opt.ExtraPrice,
		)
		if err != nil {
			return nil, err
		}

		if item, ok := itemMap[itemID]; ok {
			item.Options = append(item.Options, opt)
		}
	}

	if err := optionRows.Err(); err != nil {
		return nil, err
	}

	return orders, nil
}
