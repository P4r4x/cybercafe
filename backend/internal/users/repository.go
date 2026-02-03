package users

import (
	"context"
)

type UserRepo interface {
	Register(d *RegisterInfoDetail) (RegisterResult, error)
	AddBook(uid string, bookID string) error
	RemoveBook(uid string, bookID string) error
	InBookshelf(uid string, bookID string) (bool, error)
	GetAccount(c context.Context, uid string) (*UserAccount, error)
	GetBookshelf(uid string, page int, pageSize int) ([]BookshelfBookDTO, int, error)
}
