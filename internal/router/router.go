package router

import (
	"CyberCafe/internal/auth"
	"CyberCafe/internal/books"
	"CyberCafe/internal/infra/db"
	"CyberCafe/internal/users"

	"github.com/gin-gonic/gin"
	"net/http"
)

func InitRoutes(engine *gin.Engine, pg *db.Postgres) {
	r := engine

	// ===== 注入 books 相关依赖 =====
	bookRepo := books.NewPostgresRepo(pg.DB())
	bookSvc := books.NewService(bookRepo)
	bookHandler := books.NewHandler(bookSvc)

	// ===== 注入 auth 相关依赖 =====
	authRepo := auth.NewPostgresRepo(pg.DB())
	authSvc := auth.NewService(authRepo)
	authHandler := auth.NewHandler(authSvc)

	// ===== 注入 users 相关依赖 =====
	userRepo := users.NewPostgresRepo(pg.DB())
	userSvc := users.NewService(userRepo)
	userHandler := users.NewHandler(userSvc)

	// ===== 测试路由 =====
	r.GET("/hi", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "Hello world!"})
	})

	// ===== 登录路由组 =====

	r.POST("/login", func(c *gin.Context) {
		authHandler.LoginHandler(c)
	})

	r.POST("register", func(c *gin.Context) {
		userHandler.RegisterHandler(c)
	})

	r.GET("/logout", func(c *gin.Context) {
		// TODO 登出
	})

	// ===== API 路由组 =====
	api := r.Group("/api")
	{
		booksGroup := api.Group("/books")
		{
			booksGroup.POST("/query", bookHandler.BookQueryHandler)

			// 需要登录
			authBooks := booksGroup.Group("/")
			authBooks.Use(auth.AuthRequired())
			{
				// 借阅
				authBooks.POST("/borrow", func(c *gin.Context) {
					c.Set("action", "borrow")
					bookHandler.BookChangeRemainHandler(c)
				})

				// 归还
				authBooks.POST("/return", func(c *gin.Context) {
					c.Set("action", "return")
					bookHandler.BookChangeRemainHandler(c)
				})

				// 购买
				authBooks.POST("/purchase", func(c *gin.Context) {
					// TODO 购买
					c.JSON(http.StatusOK, gin.H{"message": "TODO 购买"})
				})

				authBooks.POST("/add_stock", func(c *gin.Context) {
					// 需要管理员权限
					auth.AdminRequired()
					bookHandler.BookAddStockHandler(c)
				})
			}

		}
	}
}
