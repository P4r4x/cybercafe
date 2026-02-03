package products

import (
	"context"
	"database/sql"
	"github.com/shopspring/decimal"
)

type PostgresRepo struct {
	db *sql.DB
}

func NewPostgresRepo(db *sql.DB) ProductRepo {
	return &PostgresRepo{
		db: db,
	}
}

// ProductList 获取商品列表
func (r *PostgresRepo) ProductList(ctx context.Context) ([]*Product, error) {
	const query = `
		SELECT
			p.id              AS product_id,
			p.name            AS product_name,
			p.base_price,
			p.is_active,
		
			po.id             AS option_id,
			po.option_code,
			po.option_type,
			po.required,
		
			pov.value,
			pov.extra_price
		FROM products p
		LEFT JOIN product_options po
			ON po.product_id = p.id
		LEFT JOIN product_option_values pov
			ON pov.option_id = po.id
		WHERE p.is_active = TRUE
		ORDER BY p.id, po.id;
`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer func(rows *sql.Rows) {
		err := rows.Close()
		if err != nil {

		}
	}(rows)

	productMap := make(map[int64]*Product)

	for rows.Next() {
		var (
			productID   int64
			productName string
			basePrice   decimal.Decimal
			isActive    bool

			optionID   sql.NullInt64
			optionCode sql.NullString
			optionType sql.NullString
			required   sql.NullBool

			value      sql.NullString
			extraPrice decimal.NullDecimal
		)

		err := rows.Scan(
			&productID,
			&productName,
			&basePrice,
			&isActive,

			&optionID,
			&optionCode,
			&optionType,
			&required,

			&value,
			&extraPrice,
		)
		if err != nil {
			return nil, err
		}

		// product 聚合
		product, ok := productMap[productID]
		if !ok {
			product = &Product{
				ID:        productID,
				Name:      productName,
				BasePrice: basePrice,
				IsActive:  isActive,
				Options:   make(map[string]ProductOptionView),
			}
			productMap[productID] = product
		}

		// 没有选项参数时
		if !optionID.Valid {
			continue
		}

		// option 聚合
		opt, ok := product.Options[optionCode.String]
		if !ok {
			opt = ProductOptionView{
				Type:     optionType.String,
				Required: required.Bool,
				Values:   make([]ProductOptionValueView, 0),
			}
		}

		// value 聚合
		if value.Valid {
			price := decimal.Zero
			if extraPrice.Valid {
				price = extraPrice.Decimal
			}

			opt.Values = append(opt.Values, ProductOptionValueView{
				Value:      value.String,
				ExtraPrice: price,
			})
		}

		product.Options[optionCode.String] = opt
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	// map → slice
	result := make([]*Product, 0, len(productMap))
	for _, p := range productMap {
		result = append(result, p)
	}

	return result, nil
}
