package products

import (
	"context"
	"database/sql"

	_ "github.com/jackc/pgx/v5/stdlib"
)

type PostgresRepo struct {
	db *sql.DB
}

func NewPostgresRepo(db *sql.DB) ProductRepo {
	return &PostgresRepo{
		db: db,
	}
}

func (p PostgresRepo) GetAllProducts(ctx context.Context) ([]*ProductInfo, error) {

	// ---------- 1. 查询 products ----------
	rows, err := p.db.QueryContext(ctx, `
		select
			id,
			name,
			description,
			base_price,
			is_active,
			created_at,
			updated_at
		from products
		where is_active = true
		order by id
	`)
	if err != nil {
		return nil, err
	}
	defer func(rows *sql.Rows) {
		err := rows.Close()
		if err != nil {

		}
	}(rows)

	products := make([]*ProductInfo, 0)
	productMap := make(map[int64]*ProductInfo)

	for rows.Next() {
		var pInfo ProductInfo
		if err := rows.Scan(
			&pInfo.ID,
			&pInfo.Name,
			&pInfo.Description,
			&pInfo.BasePrice,
			&pInfo.IsActive,
			&pInfo.CreatedAt,
			&pInfo.UpdatedAt,
		); err != nil {
			return nil, err
		}

		pInfo.Options = make([]ProductOptionInfo, 0)
		products = append(products, &pInfo)
		productMap[pInfo.ID] = &pInfo
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	if len(products) == 0 {
		return products, nil
	}

	// ---------- 2. 查询 product_options ----------
	optRows, err := p.db.QueryContext(ctx, `
		select
			id,
			product_id,
			option_code,
			option_type,
			required,
			created_at
		from product_options
		order by product_id, id
	`)
	if err != nil {
		return nil, err
	}
	defer func(optRows *sql.Rows) {
		err := optRows.Close()
		if err != nil {

		}
	}(optRows)

	// 用于快速查找 option 在 products 中的位置
	// map[optionID] -> [productIndex, optionInProductIndex]
	optionLocation := make(map[int64][2]int)

	for optRows.Next() {
		var opt ProductOptionInfo
		if err := optRows.Scan(
			&opt.ID,
			&opt.ProductID,
			&opt.OptionCode,
			&opt.OptionType,
			&opt.Required,
			&opt.CreatedAt,
		); err != nil {
			return nil, err
		}

		opt.Values = make([]ProductOptionValueInfo, 0)

		if prod, ok := productMap[opt.ProductID]; ok {
			prod.Options = append(prod.Options, opt)
			// 记录这个option在products中的位置
			optionLocation[opt.ID] = [2]int{0, len(prod.Options) - 1}
		}
	}

	if err := optRows.Err(); err != nil {
		return nil, err
	}

	// 更新optionLocation中的productIndex
	for i, prod := range products {
		for j := range prod.Options {
			if loc, ok := optionLocation[prod.Options[j].ID]; ok {
				loc[0] = i
				optionLocation[prod.Options[j].ID] = loc
			}
		}
	}

	// ---------- 3. 查询 product_option_values ----------
	valRows, err := p.db.QueryContext(ctx, `
		select
			id,
			option_id,
			value,
			extra_price,
			created_at
		from product_option_values
		order by option_id, id
	`)
	if err != nil {
		return nil, err
	}
	defer func(valRows *sql.Rows) {
		err := valRows.Close()
		if err != nil {

		}
	}(valRows)

	for valRows.Next() {
		var v ProductOptionValueInfo
		if err := valRows.Scan(
			&v.ID,
			&v.OptionID,
			&v.Value,
			&v.ExtraPrice,
			&v.CreatedAt,
		); err != nil {
			return nil, err
		}

		if loc, ok := optionLocation[v.OptionID]; ok {
			prodIdx := loc[0]
			optIdx := loc[1]
			products[prodIdx].Options[optIdx].Values = append(products[prodIdx].Options[optIdx].Values, v)
		}
	}

	if err := valRows.Err(); err != nil {
		return nil, err
	}

	return products, nil
}
