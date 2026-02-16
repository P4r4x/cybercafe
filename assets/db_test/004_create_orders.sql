-- 订单主表
CREATE TABLE public.orders (
                               id            bigserial    PRIMARY KEY,
                               user_id       text         NOT NULL,
                               total_amount  decimal(10,2) NOT NULL,
                               status        text         NOT NULL DEFAULT 'created',
                               created_at    timestamptz    NOT NULL DEFAULT now(),
                               updated_at    timestamptz    NOT NULL DEFAULT now(),
                               expired_at    timestamptz    NOT NULL
);

alter table public.orders
    owner to cybercafe;

-- 订单商品表
CREATE TABLE public.order_items (
                                    id            bigserial    PRIMARY KEY,
                                    order_id      bigint       NOT NULL REFERENCES orders(id),
                                    product_id    bigint       NOT NULL,
                                    product_name  text         NOT NULL,
                                    quantity      int        NOT NULL,
                                    base_price    decimal(10,2) NOT NULL,
                                    created_at    timestamptz    NOT NULL DEFAULT now()
);

alter table public.order_items
    owner to cybercafe;

-- 订单商品选项表
CREATE TABLE public.order_item_options (
                                           id            bigserial    PRIMARY KEY,
                                           order_item_id bigint       NOT NULL REFERENCES order_items(id),
                                           option_code   text         NOT NULL,
                                           option_value  text         NOT NULL,
                                           extra_price   decimal(10,2) NOT NULL DEFAULT 0,
                                           created_at    timestamptz    NOT NULL DEFAULT now()
);

alter table public.order_item_options
    owner to cybercafe;