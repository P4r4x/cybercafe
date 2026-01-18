// level_rule_provider.go

package rules

import "fmt"

// LevelRule 等级规则, 暂时写死在 Go 层面
type LevelRule struct {
	Level       int
	ExpRequired int
	BorrowLimit int
}

// LevelRuleMap 等级规则映射
var LevelRuleMap = map[int]LevelRule{
	1: {Level: 1, ExpRequired: 0, BorrowLimit: 2},
	2: {Level: 2, ExpRequired: 100, BorrowLimit: 3},
	3: {Level: 3, ExpRequired: 300, BorrowLimit: 5},
	4: {Level: 4, ExpRequired: 600, BorrowLimit: 8},
}

// GetLevelRule 返回当前等级规则和下一等级规则
func GetLevelRule(level int) (current LevelRule, next *LevelRule, err error) {
	rule, ok := LevelRuleMap[level]
	if !ok {
		return LevelRule{}, nil, fmt.Errorf("level rule not found for level %d", level)
	}

	// 尝试获取下一级
	if nextRule, ok := LevelRuleMap[level+1]; ok {
		next = &nextRule
	}

	return rule, next, nil
}

// CalcExp 计算经验增长并判断升级
// 返回：等级变化量、新经验值、错误
func CalcExp(level int, currentExp int, addExp int) (int, int, error) {
	if addExp < 0 {
		return 0, currentExp, fmt.Errorf("addExp must be non-negative")
	}

	exp := currentExp + addExp
	levelDelta := 0
	curLevel := level

	for {
		_, nextRule, err := GetLevelRule(curLevel)
		if err != nil {
			return 0, currentExp, err
		}

		// 已是最高等级
		if nextRule == nil {
			break
		}

		// 经验不足以升级
		if exp < nextRule.ExpRequired {
			break
		}

		// 升级
		levelDelta++
		curLevel++
	}

	return levelDelta, exp, nil
}
