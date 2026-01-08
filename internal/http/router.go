package http

import (
	"CyberCafe/internal/books"
	"CyberCafe/internal/infra/db"

	"github.com/gin-gonic/gin"
	"net/http"
)

func InitRoutes(engine *gin.Engine, pg *db.Postgres) {
	r := engine

	// ===== 注入 books 相关依赖 =====
	bookRepo := books.NewPostgresRepo(pg.DB())
	bookSvc := books.NewService(bookRepo)
	bookHandler := books.NewHandler(bookSvc)

	// ===== 测试路由 =====
	r.GET("/hi", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "Hello world!",
		})
	})

	// ===== API 路由组 =====
	api := r.Group("/api")
	{
		booksGroup := api.Group("/books")
		{
			booksGroup.POST("/query", bookHandler.BookQueryHandler)
			booksGroup.POST("/borrow", bookHandler.BorrowBookHandler)
		}
	}
}
