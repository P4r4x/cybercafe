create table public.books
(
    uuid       uuid                                         not null
        primary key,
    id         text                                         not null
        unique,
    total      integer                                      not null
        constraint books_total_check
            check (total >= 0),
    remain     integer                                      not null
        constraint books_remain_check
            check (remain >= 0),
    title      text                                         not null,
    author     text                                         not null,
    publisher  text,
    price      numeric(10, 2)                               not null
        constraint books_price_check
            check (price >= (0)::numeric),
    extra      jsonb                    default '{}'::jsonb not null,
    created_at timestamp with time zone default now()       not null,
    updated_at timestamp with time zone default now()       not null,
    constraint books_check
        check (remain <= total)
);

alter table public.books
    owner to cybercafe;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX idx_books_title_trgm
    ON books USING gin (title gin_trgm_ops);

CREATE INDEX idx_books_author_trgm
    ON books USING gin (author gin_trgm_ops);

CREATE INDEX idx_books_publisher_trgm
    ON books USING gin (publisher gin_trgm_ops);