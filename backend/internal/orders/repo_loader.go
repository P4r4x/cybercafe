package orders

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"sort"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
)

/*
===========================================================
工具函数：数据预处理和收集
===========================================================
*/

// collectProductIDs
// 输入：订单商品项列表 []*OrderItem
// 输出：去重后的商品ID列表 []int64
// 作用：从订单请求中提取所有商品ID，用于批量查询，避免重复查询同一商品
func collectProductIDs(items []*OrderItem) []int64 {
	seen := make(map[int64]struct{}, len(items))
	for _, it := range items {
		if it != nil {
			seen[it.ProductID] = struct{}{}
		}
	}
	// 构建去重后的商品ID列表
	ids := make([]int64, 0, len(seen))
	for id := range seen {
		ids = append(ids, id)
	}
	return ids
}

/*
===========================================================
内部聚合数据结构（不对外暴露）
===========================================================
*/

// productAgg
// 作用：单个商品的完整数据聚合，包含商品基础信息和所有选项数据
// 结构：商品信息 + 选项映射表（option_code -> optionAgg）
// 优势：避免在业务逻辑中进行多次数据库JOIN查询
type productAgg struct {
	product ProductSnapshot
	options map[string]*optionAgg // option_code -> optionAgg
}

// optionAgg
// 作用：单个选项的完整数据聚合，包含选项基础信息和所有可选值
// 结构：选项信息 + 选项值映射表（value -> ProductOptionValueSnapshot）
// 优势：快速验证选项值的合法性，无需再次查询数据库
type optionAgg struct {
	option ProductOptionSnapshot
	values map[string]ProductOptionValueSnapshot // value -> snapshot
}

/*
===========================================================
数据加载层：批量加载和装配
===========================================================
*/

// loadProductAgg
// 输入：商品ID列表 []int64
// 输出：商品聚合数据映射表 map[int64]*productAgg
// 作用：一次性批量加载商品、选项、选项值数据，并装配为高效的聚合结构
// 性能：O(P + O + V) 复杂度，避免N+1查询问题
// 约束：禁止在 service / calculator 中再次进行数据库JOIN操作
func (r *PostgresRepo) loadProductAgg(
	ctx context.Context,
	productIDs []int64,
) (map[int64]*productAgg, error) {

	if len(productIDs) == 0 {
		return nil, errors.New("no product ids")
	}

	// 1. 批量加载商品基础信息
	products, err := r.loadProducts(ctx, productIDs)
	if err != nil {
		return nil, err
	}

	// 2. 批量加载商品选项信息
	options, err := r.loadProductOptions(ctx, productIDs)
	if err != nil {
		return nil, err
	}

	// 3. 批量加载选项值信息
	values, err := r.loadOptionValues(ctx, options)
	if err != nil {
		return nil, err
	}

	// 4. 构建商品ID到productAgg的映射
	productMap := make(map[int64]*productAgg, len(products))
	for _, p := range products {
		productMap[p.ID] = &productAgg{
			product: *p,
			options: make(map[string]*optionAgg),
		}
	}

	// 5. 构建选项ID到optionAgg的中转索引（避免N²复杂度）
	optionIDMap := make(map[int64]*optionAgg, len(options))

	for _, o := range options {
		p := productMap[o.ProductID]
		if p == nil {
			continue
		}

		oa := &optionAgg{
			option: *o,
			values: make(map[string]ProductOptionValueSnapshot),
		}

		p.options[o.OptionCode] = oa
		optionIDMap[o.ID] = oa
	}

	// 6. 装配选项值到对应的optionAgg中
	for _, v := range values {
		if oa := optionIDMap[v.OptionID]; oa != nil {
			oa.values[v.Value] = *v
		}
	}

	return productMap, nil
}

/*
===========================================================
数据校验层：纯校验逻辑
===========================================================
*/

// validateItem
// 输入：单个订单商品项 *OrderItem，商品聚合数据 map[int64]*productAgg
// 输出：error（nil表示校验通过）
// 作用：对单个订单商品项进行完整的数据合法性校验，不构建业务上下文
// 校验内容：商品存在性、商品状态、数量有效性、选项完整性、选项值合法性
func validateItem(
	item *OrderItem,
	productMap map[int64]*productAgg,
) error {

	if item == nil {
		return errors.New("nil order item")
	}

	p := productMap[item.ProductID]
	if p == nil {
		return fmt.Errorf("product %d not found", item.ProductID)
	}

	if !p.product.IsActive {
		return fmt.Errorf("product %d is inactive", item.ProductID)
	}

	if item.Quantity <= 0 {
		return fmt.Errorf("invalid quantity for product %d", item.ProductID)
	}

	// 构建前端请求的选项映射表
	reqOptMap := make(map[string]*OrderItemOption, len(item.Options))
	for _, o := range item.Options {
		reqOptMap[o.OptionCode] = o
	}

	// 校验必填选项是否都已提供
	for code, oa := range p.options {
		if oa.option.Required {
			if _, ok := reqOptMap[code]; !ok {
				return fmt.Errorf("missing required option: %s", code)
			}
		}
	}

	// 校验选项代码和选项值的合法性
	for code, ro := range reqOptMap {
		oa := p.options[code]
		if oa == nil {
			return fmt.Errorf("invalid option code: %s", code)
		}

		switch oa.option.OptionType {
		case "single":
			if len(ro.Values) != 1 {
				return fmt.Errorf("option %s must have exactly one value", code)
			}
		case "multi":
			if len(ro.Values) == 0 {
				return fmt.Errorf("option %s must have at least one value", code)
			}
		default:
			return fmt.Errorf("unknown option type: %s", oa.option.OptionType)
		}

		for _, val := range ro.Values {
			if _, ok := oa.values[val]; !ok {
				return fmt.Errorf("invalid value %s for option %s", val, code)
			}
		}
	}

	return nil
}

/*
===========================================================
上下文构建层：OrderContext 构建
===========================================================
*/

// buildItemContext
// 输入：单个订单商品项 *OrderItem，商品聚合数据 map[int64]*productAgg
// 输出：订单商品上下文 *OrderItemContext，error
// 作用：对单个订单商品项进行校验并构建计算态上下文，用于后续的价格计算
// 流程：先调用 validateItem 进行校验，然后构建业务上下文结构
func buildItemContext(
	item *OrderItem,
	productMap map[int64]*productAgg,
) (*OrderItemContext, error) {

	// 先进行数据校验
	if err := validateItem(item, productMap); err != nil {
		return nil, err
	}

	p := productMap[item.ProductID]

	// 构建前端请求的选项映射表
	reqOptMap := make(map[string]*OrderItemOption, len(item.Options))
	for _, o := range item.Options {
		reqOptMap[o.OptionCode] = o
	}

	// 构建订单商品上下文基础结构
	itemCtx := &OrderItemContext{
		Product:  p.product,
		Quantity: item.Quantity,
		Options:  make([]*OrderOptionContext, 0),
	}

	// 构建选项上下文（跳过校验，直接构建，因为validateItem已校验过）
	// 🔧 修复：对选项代码进行排序，确保顺序一致
	optionCodes := make([]string, 0, len(reqOptMap))
	for code := range reqOptMap {
		optionCodes = append(optionCodes, code)
	}
	sort.Strings(optionCodes) // 确保选项顺序一致

	for _, code := range optionCodes {
		ro := reqOptMap[code]
		oa := p.options[code]

		// 🔧 修复：对选项值进行排序，确保顺序一致
		sort.Strings(ro.Values) // 对值进行排序

		for _, val := range ro.Values {
			v := oa.values[val]

			itemCtx.Options = append(itemCtx.Options, &OrderOptionContext{
				Option: oa.option,
				Value:  v,
			})
		}
	}

	return itemCtx, nil
}

/*
===========================================================
数据库访问层：单一职责的数据加载函数
===========================================================
*/

// loadProducts
// 输入：商品ID列表 []int64
// 输出：商品快照列表 []*ProductSnapshot，error
// 作用：批量加载商品基础信息（ID、基础价格、状态）
// 表结构：products (id, base_price, is_active)
func (r *PostgresRepo) loadProducts(
	ctx context.Context,
	ids []int64,
) ([]*ProductSnapshot, error) {

	if len(ids) == 0 {
		return nil, nil
	}

	query := `
		SELECT id, name, base_price, is_active
		FROM products
		WHERE id = ANY($1)
	`

	rows, err := r.db.QueryContext(ctx, query, ids)
	if err != nil {
		return nil, err
	}
	defer func(rows *sql.Rows) {
		err := rows.Close()
		if err != nil {

		}
	}(rows)

	var res []*ProductSnapshot
	for rows.Next() {
		var p ProductSnapshot
		if err := rows.Scan(
			&p.ID,
			&p.Name,
			&p.BasePrice,
			&p.IsActive,
		); err != nil {
			return nil, err
		}
		res = append(res, &p)
	}

	return res, rows.Err()
}

// loadProductOptions
// 输入：商品ID列表 []int64
// 输出：商品选项快照列表 []*ProductOptionSnapshot，error
// 作用：批量加载商品选项信息（ID、商品ID、选项代码、类型、是否必填）
// 表结构：product_options (id, product_id, option_code, option_type, required)
func (r *PostgresRepo) loadProductOptions(
	ctx context.Context,
	productIDs []int64,
) ([]*ProductOptionSnapshot, error) {

	if len(productIDs) == 0 {
		return nil, nil
	}

	query := `
		SELECT id, product_id, option_code, option_type, required
		FROM product_options
		WHERE product_id = ANY($1)
	`

	rows, err := r.db.QueryContext(ctx, query, productIDs)
	if err != nil {
		return nil, err
	}
	defer func(rows *sql.Rows) {
		err := rows.Close()
		if err != nil {

		}
	}(rows)

	var res []*ProductOptionSnapshot
	for rows.Next() {
		var o ProductOptionSnapshot
		if err := rows.Scan(
			&o.ID,
			&o.ProductID,
			&o.OptionCode,
			&o.OptionType,
			&o.Required,
		); err != nil {
			return nil, err
		}
		res = append(res, &o)
	}

	return res, rows.Err()
}

// loadOptionValues
// 输入：商品选项快照列表 []*ProductOptionSnapshot
// 输出：选项值快照列表 []*ProductOptionValueSnapshot，error
// 作用：批量加载选项值信息（ID、选项ID、值、额外价格）
// 表结构：product_option_values (id, option_id, value, extra_price)
func (r *PostgresRepo) loadOptionValues(
	ctx context.Context,
	options []*ProductOptionSnapshot,
) ([]*ProductOptionValueSnapshot, error) {

	if len(options) == 0 {
		return nil, nil
	}

	// 提取所有选项ID
	optionIDs := make([]int64, 0, len(options))
	for _, o := range options {
		optionIDs = append(optionIDs, o.ID)
	}

	query := `
		SELECT id, option_id, value, extra_price
		FROM product_option_values
		WHERE option_id = ANY($1)
	`

	rows, err := r.db.QueryContext(ctx, query, optionIDs)
	if err != nil {
		return nil, err
	}
	defer func(rows *sql.Rows) {
		err := rows.Close()
		if err != nil {

		}
	}(rows)

	var res []*ProductOptionValueSnapshot
	for rows.Next() {
		var v ProductOptionValueSnapshot
		if err := rows.Scan(
			&v.ID,
			&v.OptionID,
			&v.Value,
			&v.ExtraPrice,
		); err != nil {
			return nil, err
		}
		res = append(res, &v)
	}

	return res, rows.Err()
}

/*
===========================================================
数据转换层：业务上下文到持久化结构
===========================================================
*/

// convertToPersistOrder
// 输入：用户ID string，订单上下文 *OrderContext，价格结果 *PriceResult
// 输出：持久化订单结构 *PersistOrder
// 作用：将计算态的订单上下文转换为数据库持久化结构
// 转换：订单总金额、状态初始化、时间戳设置（expired_at 由数据库默认值设置）
func convertToPersistOrder(
	uid string,
	orderCtx *OrderContext,
	priceResult *PriceResult,
) *PersistOrder {
	return &PersistOrder{
		UID:         uid,
		TotalAmount: priceResult.Total,
		Status:      "created", // 初始状态
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
}

// convertToPersistOrderItems
// 输入：订单ID int64，订单上下文 *OrderContext
// 输出：持久化订单商品列表 []*PersistOrderItem
// 作用：将计算态的订单商品上下文转换为数据库持久化结构
// 转换：商品ID、数量、基础价格、时间戳（商品名称需额外查询）
func convertToPersistOrderItems(
	orderID int64,
	orderCtx *OrderContext,
) []*PersistOrderItem {
	items := make([]*PersistOrderItem, 0, len(orderCtx.Items))

	for _, itemCtx := range orderCtx.Items {
		items = append(items, &PersistOrderItem{
			OrderID:     orderID,
			ProductID:   itemCtx.Product.ID,
			ProductName: itemCtx.Product.Name,
			Quantity:    itemCtx.Quantity,
			BasePrice:   itemCtx.Product.BasePrice,
			CreatedAt:   time.Now(),
		})
	}

	return items
}

// convertToPersistOrderItemOptions
// 输入：订单商品ID列表 []int64，订单上下文 *OrderContext
// 输出：持久化订单商品选项列表 []*PersistOrderItemOption
// 作用：将计算态的订单选项上下文转换为数据库持久化结构
// 转换：订单商品ID、选项代码、选项值、额外价格、时间戳
// 说明：通过索引对应确保选项与正确的订单商品关联
func convertToPersistOrderItemOptions(
	orderItemIDs []int64,
	orderCtx *OrderContext,
) []*PersistOrderItemOption {
	var options []*PersistOrderItemOption

	for itemIdx, itemCtx := range orderCtx.Items {
		orderItemID := orderItemIDs[itemIdx]

		for _, optCtx := range itemCtx.Options {
			options = append(options, &PersistOrderItemOption{
				OrderItemID: orderItemID,
				OptionCode:  optCtx.Option.OptionCode,
				OptionValue: optCtx.Value.Value,
				ExtraPrice:  optCtx.Value.ExtraPrice,
				CreatedAt:   time.Now(),
			})
		}
	}

	return options
}
