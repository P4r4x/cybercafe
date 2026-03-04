package users

import (
	"context"
)

type UserPostgresRepo interface {
	Register(c context.Context, d *RegisterInfoDetail) (RegisterResult, error)
	GetAccount(c context.Context, uid string) (*UserAccount, error)
	GetBookshelf(c context.Context, uid string, page, pageSize int) ([]BookshelfItemDTO, int, error)
	AddBook(c context.Context, uid string, bookID string) error
	RemoveBook(c context.Context, uid string, bookID string) error
	HasBook(c context.Context, uid string, bookID string) (bool, error)
}

type UserCacheRepo interface {
	UserPostgresRepo
	InvalidateBookshelfCache(c context.Context, uid string) error
}
