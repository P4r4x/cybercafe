package books

import "golang.org/x/net/context"

type BookRepo interface {
	Find(ctx context.Context, q BookQuery) ([]*Book, error)
	AddRemain(ctx context.Context, bookID BookID, delta int) error
	AddStock(ctx context.Context, bookID BookID, delta int) error
}
