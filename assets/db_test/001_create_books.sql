CREATE TABLE books (
    uuid UUID PRIMARY KEY,
    id TEXT NOT NULL UNIQUE,
    total INT NOT NULL CHECK (total >= 0),
    remain INT NOT NULL CHECK (remain >= 0),
    title TEXT NOT NULL, author TEXT NOT NULL,
    publisher TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    extra JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (remain <= total)
);