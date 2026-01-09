package auth

import "github.com/gin-gonic/gin"

type CredentialHandler struct {
	svc *CredentialService
}

func NewHandler(svc *CredentialService) *CredentialHandler {
	return &CredentialHandler{
		svc: svc,
	}
}

func (h *CredentialHandler) RegisterHandler(c *gin.Context) {

}

func (h *CredentialHandler) LoginHandler(c *gin.Context) {

}
