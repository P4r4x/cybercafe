package users

import "golang.org/x/net/context"

type UserRepo interface {
	Register(ctx context.Context, d *RegisterInfoDetail) (RegisterResult, error)
}
