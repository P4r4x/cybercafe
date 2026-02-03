package main

import (
	"CyberCafe/backend/internal/infra/db"
	"CyberCafe/backend/internal/router"
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

	router.InitRoutes(engine, pg)

	// ====== 启动服务 ======

	// if err := engine.Run(":9016"); err != nil {
	//	log.Fatal(err)
	//}

	// HTTPS
	if err := engine.RunTLS(":9016",
		"backend/cert/cybercafe.test+1.pem",
		"backend/cert/cybercafe.test+1-key.pem"); err != nil {
		log.Fatal(err)
	}
}
