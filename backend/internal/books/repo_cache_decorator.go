package books

import "context"

type BookCacheDecorator struct {
	postgres BookPostgresRepo
	redis    *BookRedisCache
}

func NewBookCacheDecorator(postgres BookPostgresRepo, redis *BookRedisCache) *BookCacheDecorator {
	return &BookCacheDecorator{
		postgres: postgres,
		redis:    redis,
	}
}

func (c *BookCacheDecorator) Find(ctx context.Context, q BookQuery) ([]*Book, error) {
	// 仅当查询条件有 ID 时走缓存
	if q.ID != nil {
		// 1. 先查缓存
		book, err := c.redis.GetBookByID(ctx, *q.ID)
		if err != nil {
			return nil, err
		}
		if book != nil {
			return []*Book{book}, nil
		}

		// 2. 缓存未命中，查 postgres
		books, err := c.postgres.Find(ctx, q)
		if err != nil {
			return nil, err
		}
		// 3. 只查到一本书时写入缓存
		if len(books) == 1 {
			err := c.redis.SetBookByID(ctx, books[0])
			if err != nil {
				return nil, err
			}
		}
		return books, nil
	}
	// 非 ID 查询，直接走 postgres
	return c.postgres.Find(ctx, q)
}

func (c *BookCacheDecorator) AddRemain(ctx context.Context, uid string, bookID BookID, delta int) error {
	return c.postgres.AddRemain(ctx, uid, bookID, delta)
}

func (c *BookCacheDecorator) AddStock(ctx context.Context, bookID BookID, delta int) error {
	return c.postgres.AddStock(ctx, bookID, delta)
}

func (c *BookCacheDecorator) Search(ctx context.Context, q SearchBooksReq) ([]*Book, error) {
	return c.postgres.Search(ctx, q)
}

func (c *BookCacheDecorator) GetUserBorrowStatus(ctx context.Context, uid string) (BorrowStatus, error) {
	return c.postgres.GetUserBorrowStatus(ctx, uid)
}

func (c *BookCacheDecorator) GetUserLevel(ctx context.Context, uid string) (int, error) {
	return c.postgres.GetUserLevel(ctx, uid)
}

func (c *BookCacheDecorator) InvalidateCache(ctx context.Context, keys ...string) error {
	if len(keys) == 0 {
		return nil
	}
	return c.redis.Del(ctx, keys...)
}
