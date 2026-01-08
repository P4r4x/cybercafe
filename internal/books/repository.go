package books

import "golang.org/x/net/context"

type Repository interface {
	Find(ctx context.Context, q BookQuery) ([]*Book, error)
	AddRemain(ctx context.Context, bookID BookID, delta int) error
}
