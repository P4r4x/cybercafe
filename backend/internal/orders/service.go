package orders

import (
	"context"
	"errors"
)

type OrderService struct {
	repo            OrderRepo
	priceCalculator PriceCalculator
}

func NewService(repo OrderRepo, pc PriceCalculator) *OrderService {
	return &OrderService{
		repo:            repo,
		priceCalculator: pc,
	}
}

// SubmitService 订单预览 + 校验 + 生成权威价格 + 下单 token
func (s *OrderService) SubmitService(
	ctx context.Context,
	uid string,
	req *OrderRequest,
) (*SubmitResponse, error) {

	if req == nil {
		return nil, ErrInvalidRequest
	}

	// 1. 校验请求 + 构建权威 OrderContext
	//    这里完成：
	//    - 商品是否合法
	//    - option/value 是否合法
	//    - required option 是否满足
	//    - quantity 是否有效
	//    - OrderContext 冻结为可信计算态
	orderCtx, err := s.repo.CheckOrder(ctx, req)
	if err != nil {
		return nil, err
	}

	// 2. 纯计算价格, 无 DB
	priceResult, err := s.priceCalculator.Calculate(ctx, orderCtx)
	if err != nil {
		return nil, err
	}

	// 3. 生成订单提交 token
	//    token 应基于 OrderContext + PriceResult
	//    而不是原始 req（防止前端篡改）
	orderToken := generateOrderToken(ctx, uid, orderCtx, priceResult)

	// 4. 返回结果（预览态）
	return &SubmitResponse{
		Result: priceResult,
		Token:  orderToken,
	}, nil
}

// ConfirmService 确认订单服务
func (s *OrderService) ConfirmService(
	ctx context.Context,
	uid string,
	req *ConfirmRequest) (*ConfirmResponse, error) {

	if req == nil {
		return nil, errors.New("invalid request")
	}

	// 1. 尝试构建权威 OrderContext
	//    OrderContext 冻结为可信计算态
	orderCtx, err := s.repo.BuildOrderContext(ctx, &req.Order)
	if err != nil {
		return nil, err
	}

	// 2. 校验 Token 是否有效
	if _, err := VerifyOrderToken(ctx, req.Token, uid, orderCtx, req.Result); err != nil {
		return nil, err
	}

	// 3. 开启事务
	tx, err := s.repo.BeginTx(ctx)
	if err != nil {
		return nil, err
	}
	defer func() {
		if r := recover(); r != nil {
			err := tx.Rollback()
			if err != nil {
				return
			}
			panic(r)
		}
	}()

	// 4. 转换并创建订单
	persistOrder := convertToPersistOrder(uid, orderCtx, req.Result)
	orderID, err := tx.CreateOrder(ctx, persistOrder)
	if err != nil {
		err := tx.Rollback()
		if err != nil {
			return nil, err
		}
		return nil, err
	}

	// 5. 创建订单商品
	persistItems := convertToPersistOrderItems(orderID, orderCtx)
	itemIDs, err := tx.CreateOrderItems(ctx, persistItems)
	if err != nil {
		err := tx.Rollback()
		if err != nil {
			return nil, err
		}
		return nil, err
	}

	// 6. 创建订单商品选项
	persistOptions := convertToPersistOrderItemOptions(itemIDs, orderCtx)
	err = tx.CreateOrderItemOptions(ctx, persistOptions)
	if err != nil {
		err := tx.Rollback()
		if err != nil {
			return nil, err
		}
		return nil, err
	}

	// 7. 提交事务
	if err := tx.Commit(); err != nil {
		return nil, err
	}

	// 8. 返回确认结果（包含过期时间）
	return &ConfirmResponse{
		Id:          OrderId(orderID),
		ExpiredAt:   persistOrder.ExpiredAt,
		PriceResult: req.Result,
	}, nil
}

// CancelService 取消订单
func (s *OrderService) CancelService(ctx context.Context, uid string, req *CancelRequest) error {
	// 单次 Cancel 请求可以聚合到 一个 update 语句中, 这样也不需要事务了;
	// 数据库需要的校验: 订单号, 订单归属, 订单必须是待支付,或者过期状态
	if err := s.repo.CancelOrder(ctx, uid, req.OrderId); err != nil {
		return err
	}
	return nil
}

// BalancePaymentService 尝试进行余额支付
func (s *OrderService) BalancePaymentService(ctx context.Context, uid string, req *BalancePaymentRequest) error {

	// 1. 开启事务
	tx, err := s.repo.BeginTx(ctx)
	if err != nil {
		return err
	}
	defer func() {
		if r := recover(); r != nil {
			err := tx.Rollback()
			if err != nil {
				return
			}
			panic(r)
		}
	}()

	// 2. 校验订单归属, 状态 + 校验余额 + 尝试扣款
	if err := tx.CommitOrderPayment(ctx, uid, req.OrderId); err != nil {
		// 如果是订单过期错误，需要先提交事务以保存状态更新
		if err.Error() == "order has expired" {
			if commitErr := tx.Commit(); commitErr != nil {
				return commitErr
			}
		} else {
			// 其他错误回滚事务
			if rollbackErr := tx.Rollback(); rollbackErr != nil {
				return rollbackErr
			}
		}
		return err
	}

	// 3. 提交事务
	if err := tx.Commit(); err != nil {
		return err
	}

	return nil
}

// GetBasicOrderService 获取订单基础信息
func (s *OrderService) GetBasicOrderService(ctx context.Context, orderID int64) (*BasicOrderResponse, error) {
	return s.repo.GetBasicOrder(ctx, orderID)
}

// GetHistoryService 获取订单历史
func (s *OrderService) GetHistoryService(ctx context.Context, uid string, page int64, pageSize int64) (*HistoryResponse, error) {
	res, err := s.repo.GetHistory(ctx, uid, page, pageSize)
	if err != nil {
		return nil, err
	}
	return res, nil
}

// GetUnpaidService 获取未支付订单
func (s *OrderService) GetUnpaidService(ctx context.Context, uid string) ([]*OrderHistory, error) {
	return s.repo.GetUnpaidOrders(ctx, uid)
}
