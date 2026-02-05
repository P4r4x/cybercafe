package users

import (
	"context"
)

type UserRepo interface {
	Register(c context.Context, d *RegisterInfoDetail) (RegisterResult, error)
	GetAccount(c context.Context, uid string) (*UserAccount, error)
	GetBookshelf(uid string) ([]BookshelfItemDTO, error)
	AddBook(uid string, bookID string) error
}
