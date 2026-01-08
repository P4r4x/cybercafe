package main

import (
	"CyberCafe/internal/http"
	"CyberCafe/internal/infra/db"
	"github.com/gin-gonic/gin"
	"log"
)

func main() {

	// ====== 初始化数据库 ======

	pg, err := db.NewPostgres()
	if err != nil {
		log.Fatalf("init postgres failed: %v", err)
	}

	// ====== 全局中间件和构建引擎 ======

	engine := gin.New()
	engine.Use(gin.Logger())
	engine.Use(gin.Recovery())

	// ====== 初始化路由 ======

	http.InitRoutes(engine, pg)

	// ====== 启动服务 ======

	if err := engine.Run(":9016"); err != nil {
		log.Fatal(err)
	}
}
