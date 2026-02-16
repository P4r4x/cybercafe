package users

import (
	"context"
)

type UserRepo interface {
	Register(c context.Context, d *RegisterInfoDetail) (RegisterResult, error)
	GetAccount(c context.Context, uid string) (*UserAccount, error)
	GetBookshelf(uid string, page, pageSize int) ([]BookshelfItemDTO, int, error)
	AddBook(uid string, bookID string) error
	RemoveBook(uid string, bookID string) error
	HasBook(uid string, bookID string) (bool, error)
}
