package dashboard

import (
	"CyberCafe/backend/internal/rules"
	"context"
)

type DashboardService struct {
	repo DashboardRepo
}

func NewService(repo DashboardRepo) *DashboardService {
	return &DashboardService{repo: repo}
}

func (s *DashboardService) GetDashboardService(ctx context.Context, uid string) (*DashboardResponse, error) {

	// 对结果进行初始化
	resp := &DashboardResponse{
		User: UserInfo{
			UID: uid,
		},
		Stats:  BorrowStats{},
		Recent: []BorrowItem{},
	}

	// 1. 用户信息
	if user, err := s.repo.GetUserInfo(ctx, uid); err == nil {
		resp.User = *user
	}

	// 2. 借阅统计 (未还)
	if stats, err := s.repo.GetBorrowStats(ctx, uid); err == nil {
		resp.Stats = *stats
	}

	// 3. 最近借阅
	if recent, err := s.repo.GetRecentBorrows(ctx, uid, 5); err == nil {
		resp.Recent = recent
	}

	// 4. 根据等级规则注入 ExpRequired & BorrowLimit, 根据用户等级返回等级参数
	currentRule, nextRule, err := rules.GetLevelRule(resp.User.Level)
	if err != nil {
		return nil, err
	}

	// 借阅上限
	resp.Stats.Limit = currentRule.BorrowLimit

	// 升级所需经验（下一等级阈值）
	if nextRule != nil {
		resp.User.ExpRequired = int64(nextRule.ExpRequired)
	} else {
		// 满级：经验条拉满
		resp.User.ExpRequired = resp.User.Exp
	}

	return resp, nil
}
