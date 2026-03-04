package users

import "context"

// UserCacheDecorator 缓存装饰器
// 实现了 Cache-Aside 模式，在 PostgreSQL 和 Redis 之间进行数据读写调度
//
// 设计模式说明：
//   - 读取时：先查 Redis，缓存未命中则查 PostgreSQL 并写入 Redis
//   - 写入时：先写 PostgreSQL，然后删除对应缓存（让下次查询重新从 DB 加载）
//
// 缓存失效策略：
//   - AddBook/RemoveBook 操作后删除用户书架缓存，确保数据一致性
type UserCacheDecorator struct {
	// postgres PostgreSQL 数据访问层
	postgres UserPostgresRepo

	// redis Redis 缓存层
	redis *UserRedisCache
}

// NewUserCacheDecorator 创建缓存装饰器实例
// 参数：
//   - postgres: PostgreSQL 仓库实例
//   - redis: Redis 缓存实例
//
// 返回值：
//   - *UserCacheDecorator: 缓存装饰器实例
func NewUserCacheDecorator(postgres UserPostgresRepo, redis *UserRedisCache) *UserCacheDecorator {
	return &UserCacheDecorator{
		postgres: postgres,
		redis:    redis,
	}
}

// GetBookshelf 获取用户书架（带缓存）
// 参数：
//   - ctx: 上下文
//   - uid: 用户 ID
//   - page: 页码
//   - pageSize: 每页数量
//
// 返回值：
//   - []BookshelfItemDTO: 书架中的书籍列表
//   - int: 书架中书籍总数
//   - error: 获取失败时返回错误
//
// 实现逻辑（Cache-Aside 模式）：
//  1. 先从 Redis 查询缓存
//  2. 缓存命中直接返回
//  3. 缓存未命中则查询 PostgreSQL
//  4. 查询成功后将数据写入 Redis 缓存
//  5. 返回查询结果
func (c *UserCacheDecorator) GetBookshelf(
	ctx context.Context,
	uid string,
	page, pageSize int,
) ([]BookshelfItemDTO, int, error) {
	// 1. 先从 Redis 查询缓存
	items, total, err := c.redis.GetBookshelf(ctx, uid, int32(page), int32(pageSize))
	if err != nil {
		return nil, 0, err
	}
	// 2. 缓存命中直接返回
	if items != nil {
		return items, total, nil
	}

	// 3. 缓存未命中，查询 PostgreSQL
	items, total, err = c.postgres.GetBookshelf(ctx, uid, page, pageSize)
	if err != nil {
		return nil, 0, err
	}

	// 4. 查询成功后将数据写入 Redis 缓存
	if len(items) > 0 {
		if err := c.redis.SetBookshelf(ctx, uid, int32(page), int32(pageSize), items, total); err != nil {
			return nil, 0, err
		}
	}

	// 5. 返回查询结果
	return items, total, nil
}

// GetAccount 获取用户账户信息
// 参数：
//   - ctx: 上下文
//   - uid: 用户 ID
//
// 返回值：
//   - *UserAccount: 用户账户信息
//   - error: 获取失败时返回错误
//
// 说明：此方法不涉及缓存，直接透传到 PostgreSQL
func (c *UserCacheDecorator) GetAccount(ctx context.Context, uid string) (*UserAccount, error) {
	return c.postgres.GetAccount(ctx, uid)
}

// Register 用户注册
func (c *UserCacheDecorator) Register(ctx context.Context, d *RegisterInfoDetail) (RegisterResult, error) {
	return c.postgres.Register(ctx, d)
}

// AddBook 添加书籍到用户书架
// 参数：
//   - ctx: 上下文
//   - uid: 用户 ID
//   - bookID: 书籍 ID
//
// 返回值：
//   - error: 添加失败时返回错误
//
// 实现逻辑：
//  1. 先执行 PostgreSQL 写入操作
//  2. 写入成功后删除用户书架缓存（让下次查询重新从 DB 加载）
func (c *UserCacheDecorator) AddBook(ctx context.Context, uid string, bookID string) error {
	// 1. 先执行 PostgreSQL 写入操作
	if err := c.postgres.AddBook(ctx, uid, bookID); err != nil {
		return err
	}
	// 2. 写入成功后删除用户书架缓存
	_ = c.redis.DelBookshelf(ctx, uid)
	return nil
}

// RemoveBook 从用户书架移除书籍
// 参数：
//   - ctx: 上下文
//   - uid: 用户 ID
//   - bookID: 书籍 ID
//
// 返回值：
//   - error: 移除失败时返回错误
//
// 实现逻辑：
//  1. 先执行 PostgreSQL 删除操作
//  2. 删除成功后删除用户书架缓存（让下次查询重新从 DB 加载）
func (c *UserCacheDecorator) RemoveBook(ctx context.Context, uid string, bookID string) error {
	// 1. 先执行 PostgreSQL 删除操作
	if err := c.postgres.RemoveBook(ctx, uid, bookID); err != nil {
		return err
	}
	// 2. 删除成功后删除用户书架缓存
	_ = c.redis.DelBookshelf(ctx, uid)
	return nil
}

// HasBook 检查用户是否已将书籍添加到书架
// 参数：
//   - ctx: 上下文
//   - uid: 用户 ID
//   - bookID: 书籍 ID
//
// 返回值：
//   - bool: 用户是否已添加该书籍
//   - error: 查询失败时返回错误
//
// 说明：
//
//	此方法不涉及独立缓存，因为书架数据已在 GetBookshelf 中缓存
//	需要判断时可以从书架缓存中遍历查找，或直接查询 PostgreSQL
func (c *UserCacheDecorator) HasBook(ctx context.Context, uid string, bookID string) (bool, error) {
	return c.postgres.HasBook(ctx, uid, bookID)
}

// InvalidateBookshelfCache 手动失效用户书架缓存
// 参数：
//   - ctx: 上下文
//   - uid: 用户 ID
//
// 返回值：
//   - error: 删除失败时返回错误
//
// 说明：
//
//	供外部调用者手动失效缓存的场景使用
//	内部 AddBook/RemoveBook 方法已自动调用此逻辑
func (c *UserCacheDecorator) InvalidateBookshelfCache(ctx context.Context, uid string) error {
	return c.redis.DelBookshelf(ctx, uid)
}
