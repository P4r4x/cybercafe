package router

import (
	"CyberCafe/backend/internal/auth"
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func (c *Container) RegisterRoutes(r *gin.Engine) {
	container := c

	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			"https://app.cybercafe.test:9017",
			"https://app.cybercafe.test:9016",
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

	r.OPTIONS("/*path", func(c *gin.Context) {
		c.Status(204)
	})

	r.GET("/hi", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "Hello world!"})
	})

	api := r.Group("/api")
	{
		api.POST("/login", func(c *gin.Context) {
			container.AuthHandler.LoginHandler(c)
		})

		api.POST("/register", func(c *gin.Context) {
			container.UserHandler.RegisterHandler(c)
		})

		api.GET("/logout", func(c *gin.Context) {
			container.AuthHandler.LogoutHandler(c)
		})

		booksGroup := api.Group("/books")
		{
			booksGroup.POST("/query", container.BookHandler.BookQueryHandler)

			authBooks := booksGroup.Group("/")
			authBooks.Use(auth.AuthRequired())
			{
				authBooks.POST("/borrow", func(c *gin.Context) {
					c.Set("action", "borrow")
					container.BookHandler.BookChangeRemainHandler(c)
				})

				authBooks.POST("/return", func(c *gin.Context) {
					c.Set("action", "return")
					container.BookHandler.BookChangeRemainHandler(c)
				})

				authBooks.POST("/purchase", func(c *gin.Context) {
					c.JSON(http.StatusOK, gin.H{"message": "TODO 购买"})
				})

				authBooks.GET("/:id", container.BookHandler.BookDetailHandler)

				authBooks.POST("/search", container.BookHandler.BookSearchHandler)

				authBooks.GET("/add/:id", container.UserHandler.AddBookHandler)

				authBooks.GET("/remove/:id", container.UserHandler.RemoveBookHandler)

				authBooks.GET("/has/:id", container.UserHandler.HasBookHandler)

				adminBooks := booksGroup.Group("/")
				adminBooks.Use(
					auth.AuthRequired(),
					auth.AdminRequired(),
				)

				adminBooks.POST("/add_stock", container.BookHandler.BookAddStockHandler)
			}
		}

		{
			authPages := api.Group("/me")
			authPages.Use(auth.AuthRequired())
			{
				authPages.GET("/summary", func(c *gin.Context) {
					container.UserHandler.MeSummaryHandler(c)
				})
				authPages.GET("/bookshelf", func(c *gin.Context) {
					container.UserHandler.GetBookshelfHandler(c)
				})
				authPages.GET("/dashboard", func(c *gin.Context) {
					container.DashboardHandler.DashboardHandler(c)
				})
				authPages.GET("/recent_book_records", func(c *gin.Context) {
					container.DashboardHandler.RecentRecordsHandler(c)
				})
			}
		}

		orderGroup := api.Group("/orders")
		orderGroup.Use(auth.AuthRequired())
		{
			orderGroup.POST("/submit", func(c *gin.Context) {
				container.OrderHandler.SubmitHandler(c)
			})

			orderGroup.POST("/confirm", func(c *gin.Context) {
				container.OrderHandler.ConfirmHandler(c)
			})

			orderGroup.POST("/cancel", func(c *gin.Context) {
				container.OrderHandler.CancelHandler(c)
			})

			orderGroup.GET("/:id", func(c *gin.Context) {
				container.OrderHandler.GetBasicHandler(c)
			})

			orderGroup.POST("/pay/balance", func(c *gin.Context) {
				container.OrderHandler.PayBalanceHandler(c)
			})

			orderGroup.GET("/history", func(c *gin.Context) {
				container.OrderHandler.HistoryHandler(c)
			})

			orderGroup.GET("/unpaid", func(c *gin.Context) {
				container.OrderHandler.GetUnpaidHandler(c)
			})
		}

		productsGroup := api.Group("/products")
		{
			productsGroup.GET("/all", func(c *gin.Context) {
				container.ProductHandler.GetAllHandler(c)
			})
		}
	}
}
