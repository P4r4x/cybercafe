create table public.products
(
    id         bigserial
        primary key,
    name       text                                   not null,
    base_price numeric(10, 2)                         not null
        constraint products_base_price_check
            check (base_price >= (0)::numeric),
    is_active  boolean                  default true  not null,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null
);

alter table public.products
    owner to cybercafe;

create table public.product_options
(
    id          bigserial
        primary key,
    product_id  bigint                                 not null
        constraint fk_product_options_product
            references public.products
            on delete cascade,
    option_code text                                   not null,
    option_type text                                   not null
        constraint product_options_option_type_check
            check (option_type = ANY (ARRAY ['single'::text, 'multi'::text])),
    required    boolean                  default false not null,
    created_at  timestamp with time zone default now() not null,
    constraint uq_product_option
        unique (product_id, option_code)
);

alter table public.product_options
    owner to cybercafe;

create table public.product_option_values
(
    id          bigserial
        primary key,
    option_id   bigint                                 not null
        constraint fk_option_values_option
            references public.product_options
            on delete cascade,
    value       text                                   not null,
    extra_price numeric(10, 2)           default 0     not null
        constraint product_option_values_extra_price_check
            check (extra_price >= (0)::numeric),
    created_at  timestamp with time zone default now() not null,
    constraint uq_option_value
        unique (option_id, value)
);

alter table public.product_option_values
    owner to cybercafe;

