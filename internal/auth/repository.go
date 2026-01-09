package auth

import "golang.org/x/net/context"

type CredentialRepo interface {
	Find(ctx context.Context, username string) (*Credential, error)
	Create(ctx context.Context, cred *Credential) error
}
