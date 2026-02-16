package router

import (
	auth2 "CyberCafe/backend/internal/auth"
	books2 "CyberCafe/backend/internal/books"
	dashboard2 "CyberCafe/backend/internal/dashboard"
	"CyberCafe/backend/internal/infra/db"
	order2 "CyberCafe/backend/internal/orders"
	products2 "CyberCafe/backend/internal/products"
	users2 "CyberCafe/backend/internal/users"
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func InitRoutes(engine *gin.Engine, pg *db.Postgres) {
	r := engine

	// 调试配置, 生产时用下方注释
	r.Use(cors.New(cors.Config{
		//AllowOriginFunc: func(origin string) bool {
		//	return true
		//},
		AllowOrigins: []string{
			// 只允许前端访问
			"https://app.cybercafe.test:9017",
			"https://app.cybercafe.test:9016",
			// 允许 Burp Suite 调试
			// "http://burp",
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

	// ===== 注入 dashboard 相关依赖 =====
	dashboardRepo := dashboard2.NewPostgresRepo(pg.DB())
	dashboardSvc := dashboard2.NewService(dashboardRepo)
	dashboardHandler := dashboard2.NewHandler(dashboardSvc)

	// ===== 注入 orders 相关依赖 =====
	orderRepo := order2.NewPostgresRepo(pg.DB())
	orderSvc := order2.NewService(orderRepo, order2.NewDefaultPriceCalculator("CNY"))
	orderHandler := order2.NewHandler(orderSvc)

	// ===== 注入 products 相关依赖 =====
	productRepo := products2.NewPostgresRepo(pg.DB())
	productSvc := products2.NewService(productRepo)
	productHandler := products2.NewHandler(productSvc)

	// ===== 跨域 =====
	// 仅调试使用

	r.OPTIONS("/*path", func(c *gin.Context) {
		c.Status(204)
	})

	// ===== 测试路由 =====
	r.GET("/hi", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "Hello world!"})
	})

	// ===== API 路由组 =====
	api := r.Group("/api")
	{
		// ===== 登录路由组 =====
		api.POST("/login", func(c *gin.Context) {
			authHandler.LoginHandler(c)
		})

		api.POST("/register", func(c *gin.Context) {
			userHandler.RegisterHandler(c)
		})

		api.GET("/logout", func(c *gin.Context) {
			authHandler.LogoutHandler(c)
		})

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

				// 获取图书详情
				authBooks.GET("/:id", bookHandler.BookDetailHandler)

				// 复合查询 (搜书)
				authBooks.POST("/search", bookHandler.BookSearchHandler)

				// 向书架添加图书
				authBooks.GET("/add/:id", userHandler.AddBookHandler)

				// 从书架删除图书
				authBooks.GET("/remove/:id", userHandler.RemoveBookHandler)

				// 查询书架中是否有指定图书
				authBooks.GET("/has/:id", userHandler.HasBookHandler)

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
			authPages := api.Group("/me")
			authPages.Use(auth2.AuthRequired())
			{
				authPages.GET("/summary", func(c *gin.Context) {
					userHandler.MeSummaryHandler(c)
				})
				authPages.GET("/bookshelf", func(c *gin.Context) {
					userHandler.GetBookshelfHandler(c)
				})
				authPages.GET("/dashboard", func(c *gin.Context) {
					dashboardHandler.DashboardHandler(c)
				})
				authPages.GET("/recent_book_records", func(c *gin.Context) {
					dashboardHandler.RecentRecordsHandler(c)
				})
			}
		}

		orderGroup := api.Group("/orders")
		orderGroup.Use(auth2.AuthRequired())
		{
			// 提交订单
			orderGroup.POST("/submit", func(c *gin.Context) {
				orderHandler.SubmitHandler(c)
			})

			// 确认订单
			orderGroup.POST("/confirm", func(c *gin.Context) {
				orderHandler.ConfirmHandler(c)
			})

			// 取消订单
			orderGroup.POST("/cancel", func(c *gin.Context) {
				orderHandler.CancelHandler(c)
			})

			// 获取订单详情 (基本信息)
			orderGroup.GET("/:id", func(c *gin.Context) {
				orderHandler.GetBasicHandler(c)
			})

			// 余额支付
			orderGroup.POST("/pay/balance", func(c *gin.Context) {
				orderHandler.PayBalanceHandler(c)
			})
		}

		// ===== 商品路由组 =====
		productsGroup := api.Group("/products")
		{
			productsGroup.GET("/all", func(c *gin.Context) {
				productHandler.GetAllHandler(c)
			})
		}
	}
}
