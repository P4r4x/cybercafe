CREATE TABLE users (
    id UUID PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    userid TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    phone TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'users',
    status TEXT NOT NULL DEFAULT 'inactive',
    user_group TEXT, 
    extra JSONB NOT NULL DEFAULT '{}',
    last_login_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

ALTER TABLE users
ADD CONSTRAINT uk_users_username UNIQUE (username),
ADD CONSTRAINT uk_users_userid UNIQUE (userid),
ADD CONSTRAINT uk_users_email UNIQUE (email),
ADD CONSTRAINT uk_users_phone UNIQUE (phone);


