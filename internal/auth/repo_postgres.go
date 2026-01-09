package auth

import (
	"database/sql"
	"golang.org/x/net/context"
)

type PostgresRepo struct {
	db *sql.DB
}

func NewPostgresRepo(db *sql.DB) CredentialRepo {
	return &PostgresRepo{
		db: db,
	}
}

func (p PostgresRepo) Find(ctx context.Context, username string) (*Credential, error) {
	return nil, nil
}
func (p PostgresRepo) Create(ctx context.Context, cred *Credential) error {
	return nil
}
