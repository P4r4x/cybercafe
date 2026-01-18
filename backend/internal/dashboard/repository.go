package dashboard

import "context"

type DashboardRepo interface {
	GetUserInfo(ctx context.Context, uid string) (*UserInfo, error)
	GetBorrowStats(ctx context.Context, uid string) (*BorrowStats, error)
	GetRecentBorrows(ctx context.Context, uid string, limit int) ([]BorrowItem, error)
}
