package router

import (
	"CyberCafe/backend/internal/infra/db"
	"CyberCafe/backend/internal/infra/redis"
	"github.com/gin-gonic/gin"
)

func InitRoutes(engine *gin.Engine, pg *db.Postgres, r *redis.Redis) {
	container := NewContainer(pg, r)
	container.RegisterRoutes(engine)
}
