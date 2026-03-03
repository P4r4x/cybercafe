package router

import (
	"CyberCafe/backend/internal/auth"
	books2 "CyberCafe/backend/internal/books"
	dashboard2 "CyberCafe/backend/internal/dashboard"
	"CyberCafe/backend/internal/infra/db"
	"CyberCafe/backend/internal/infra/redis"
	order2 "CyberCafe/backend/internal/orders"
	products2 "CyberCafe/backend/internal/products"
	users2 "CyberCafe/backend/internal/users"
)

// Container 依赖注入容器
// 负责管理所有模块的依赖初始化和 Handler 实例
type Container struct {
	db    *db.Postgres
	redis *redis.Redis

	// 各模块的 Handler（供路由注册使用）
	BookHandler      *books2.BookHandler
	AuthHandler      *auth.CredentialHandler
	UserHandler      *users2.UserHandler
	DashboardHandler *dashboard2.Handler
	OrderHandler     *order2.OrderHandler
	ProductHandler   *products2.ProductHandler
}

// NewContainer 创建容器实例，初始化所有依赖
func NewContainer(pg *db.Postgres, r *redis.Redis) *Container {
	c := &Container{
		db:    pg,
		redis: r,
	}
	c.initBooks()
	c.initAuth()
	c.initUsers()
	c.initDashboard()
	c.initOrders()
	c.initProducts()
	return c
}

// initBooks 初始化图书模块的依赖
func (c *Container) initBooks() {
	repo := books2.NewPostgresRepo(c.db.DB())
	svc := books2.NewService(repo)
	c.BookHandler = books2.NewHandler(svc)
}

// initAuth 初始化认证模块的依赖
func (c *Container) initAuth() {
	repo := auth.NewPostgresRepo(c.db.DB())
	svc := auth.NewService(repo)
	c.AuthHandler = auth.NewHandler(svc)
}

// initUsers 初始化用户模块的依赖
func (c *Container) initUsers() {
	repo := users2.NewPostgresRepo(c.db.DB())
	svc := users2.NewService(repo)
	c.UserHandler = users2.NewHandler(svc)
}

// initDashboard 初始化仪表盘模块的依赖
func (c *Container) initDashboard() {
	repo := dashboard2.NewPostgresRepo(c.db.DB())
	svc := dashboard2.NewService(repo)
	c.DashboardHandler = dashboard2.NewHandler(svc)
}

// initOrders 初始化订单模块的依赖
func (c *Container) initOrders() {
	repo := order2.NewPostgresRepo(c.db.DB())
	svc := order2.NewService(repo, order2.NewDefaultPriceCalculator("CNY"))
	c.OrderHandler = order2.NewHandler(svc)
}

// initProducts 初始化商品模块的依赖
func (c *Container) initProducts() {
	repo := products2.NewPostgresRepo(c.db.DB())
	svc := products2.NewService(repo)
	c.ProductHandler = products2.NewHandler(svc)
}
