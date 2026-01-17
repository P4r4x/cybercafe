package router

import (
	auth2 "CyberCafe/backend/internal/auth"
	books2 "CyberCafe/backend/internal/books"
	"CyberCafe/backend/internal/infra/db"
	users2 "CyberCafe/backend/internal/users"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"net/http"
	"time"
)

func InitRoutes(engine *gin.Engine, pg *db.Postgres) {
	r := engine

	// 调试配置, 生产时用下方注释
	r.Use(cors.New(cors.Config{
		AllowOriginFunc: func(origin string) bool {
			return true
		},
		AllowOrigins: []string{
			// 只允许前端访问
			"http://localhost:9017",
			// 允许 Burp Suite 调试
			"http://localhost:8080",
			"http://burp",
		},
		AllowMethods: []string{
			"GET", "POST", "PUT", "DELETE", "OPTIONS",
		},
		AllowHeaders: []string{
			"Origin", "Content-Type", "Authorization",
		},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// ===== 注入 books 相关依赖 =====
	bookRepo := books2.NewPostgresRepo(pg.DB())
	bookSvc := books2.NewService(bookRepo)
	bookHandler := books2.NewHandler(bookSvc)

	// ===== 注入 auth 相关依赖 =====
	authRepo := auth2.NewPostgresRepo(pg.DB())
	authSvc := auth2.NewService(authRepo)
	authHandler := auth2.NewHandler(authSvc)

	// ===== 注入 users 相关依赖 =====
	userRepo := users2.NewPostgresRepo(pg.DB())
	userSvc := users2.NewService(userRepo)
	userHandler := users2.NewHandler(userSvc)

	// ===== 跨域 =====
	// 仅调试使用

	r.OPTIONS("/*path", func(c *gin.Context) {
		c.Status(204)
	})

	// ===== 测试路由 =====
	r.GET("/hi", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "Hello world!"})
	})

	// ===== 登录路由组 =====

	r.POST("/login", func(c *gin.Context) {
		authHandler.LoginHandler(c)
	})

	r.POST("/register", func(c *gin.Context) {
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
			authBooks.Use(auth2.AuthRequired())
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

				// 向书架添加图书
				authBooks.GET("/add/:id", userHandler.AddBookHandler)

				// 需要管理员权限组
				adminBooks := booksGroup.Group("/")
				adminBooks.Use(
					auth2.AuthRequired(),
					auth2.AdminRequired(),
				)

				// 添加库存
				adminBooks.POST("/add_stock", bookHandler.BookAddStockHandler)

			}

		}
		{
			authPages := booksGroup.Group("/me")
			authPages.Use(auth2.AuthRequired())
			{
				authPages.GET("/summary", func(c *gin.Context) {
					userHandler.MeSummaryHandler(c)
				})
				authPages.GET("/bookshelf", func(c *gin.Context) {
					userHandler.GetBookshelfHandler(c)
				})
				authPages.POST("/dashboard", func(c *gin.Context) {
					// userHandler.DashboardHandler(c)
				})
			}
		}
	}
}
