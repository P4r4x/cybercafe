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