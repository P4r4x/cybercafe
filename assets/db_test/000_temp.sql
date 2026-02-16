
TRUNCATE TABLE public.product_option_values, public.product_options, public.products RESTART IDENTITY;

TRUNCATE TABLE
    public.order_item_options,
    public.order_items,
    public.orders
    RESTART IDENTITY;