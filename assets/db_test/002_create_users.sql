create table public.users
(
    id            uuid                               not null
        primary key,
    username      text                               not null
        unique
        constraint uk_users_username
            unique,
    userid        bigint                             not null
        unique
        constraint uk_users_userid
            unique,
    email         text                               not null
        unique
        constraint uk_users_email
            unique,
    phone         text
        unique
        constraint uk_users_phone
            unique,
    password_hash text                               not null,
    role          text      default 'users'::text    not null,
    status        text      default 'inactive'::text not null,
    extra         jsonb     default '{}'::jsonb      not null,
    last_login_at timestamp,
    created_at    timestamp default now()            not null,
    delete_at     timestamp with time zone
);

alter table public.users
    owner to cybercafe;