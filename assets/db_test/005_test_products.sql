insert into products (name, base_price, description)
values
    ('黑糖奶茶', 12.00, '香浓红茶搭配黑糖与鲜奶，经典台式风味'),
    ('美式咖啡', 10.00, '精选咖啡豆萃取，口感纯粹'),
    ('生椰拿铁', 14.00, '浓缩咖啡与生椰乳融合，顺滑醇香'),
    ('杨枝甘露', 16.00, '芒果、西柚与椰浆的经典港式甜品');

-- 杯型（必选）
insert into product_options (product_id, option_code, option_type, required)
values
    (1, '份量', 'single', true),
    (1, '甜度', 'single', true),
    (1, '小料', 'multi', false);

insert into product_options (product_id, option_code, option_type, required)
values
    (2, '份量', 'single', true),
    (2, '温度', 'single', true);

insert into product_options (product_id, option_code, option_type, required)
values
    (3, '份量', 'single', true),
    (3, '温度', 'single', true),
    (3, '小料', 'multi', false);

insert into product_options (product_id, option_code, option_type, required)
values
    (4, '份量', 'single', true),
    (4, '小料', 'multi', false);

-- 杯型可选项
-- 黑糖奶茶 份量
insert into product_option_values (option_id, value, extra_price)
values
    (1, '中杯', 0),
    (1, '大杯', 2.00);

-- 美式咖啡 份量
insert into product_option_values (option_id, value, extra_price)
values
    (4, '中杯', 0),
    (4, '大杯', 1.50);

-- 生椰拿铁 份量
insert into product_option_values (option_id, value, extra_price)
values
    (6, '中杯', 0),
    (6, '大杯', 2.00);

-- 杨枝甘露 份量
insert into product_option_values (option_id, value, extra_price)
values
    (9, '标准杯', 0);

-- 黑糖奶茶 甜度
insert into product_option_values (option_id, value, extra_price)
values
    (2, '全糖', 0),
    (2, '半糖', 0),
    (2, '少糖', 0);

-- 美式咖啡 ice
insert into product_option_values (option_id, value, extra_price)
values
    (5, '热', 0),
    (5, '冰', 0);

-- 生椰拿铁 ice
insert into product_option_values (option_id, value, extra_price)
values
    (7, '少冰', 0),
    (7, '正常冰', 0);

-- 黑糖奶茶 '小料'
insert into product_option_values (option_id, value, extra_price)
values
    (3, '珍珠', 1.00),
    (3, '椰果', 1.00);

-- 生椰拿铁 extra
insert into product_option_values (option_id, value, extra_price)
values
    (8, '浓缩', 2.00);

-- 杨枝甘露 extra
insert into product_option_values (option_id, value, extra_price)
values
    (10, '西柚果肉', 2.00);
