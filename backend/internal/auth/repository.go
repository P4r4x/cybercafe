package auth

import "context"

type CredentialRepo interface {
	Find(ctx context.Context, req LoginInfo) (*Credential, error)
}
