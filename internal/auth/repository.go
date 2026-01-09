package auth

import "golang.org/x/net/context"

type CredentialRepo interface {
	Find(ctx context.Context, req LoginInfo) (*Credential, error)
	Create(ctx context.Context, cred *Credential) error
}
