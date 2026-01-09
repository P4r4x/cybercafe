package auth

type UserQuery struct {
}

type CredentialService struct {
	repo CredentialRepo
}

func NewService(repo CredentialRepo) *CredentialService {
	return &CredentialService{
		repo: repo,
	}
}
