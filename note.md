线上东东佛书店
===

> 仿照西西弗书店的模式集成图书借阅等功能的 Go 项目, 本意是借这个机会熟悉 GoLang 开发

# 项目进度

## 整体进度

|任务|进度|
|----|----|
|(后端) 图书基本功能开发(CRUD)(mvp)|complete|
|(后端) 鉴权, 跨域认证(mvp)|complete|
|(后端) 登录注册界面|complete|
|(前端) 登录注册界面|complete|
|(后端) 借还记录功能|complete|
|(前端) 用户中心, 仪表盘主页| in progress|
|(前端) 浏览器缓存机制|TODO|
|admin 功能|TODO|
|人员管理|TODO|
|借还记录|TODO|
|订座订购功能|TODO|
|接入 Redis| TODO |
|WebUI (基本前端)|TODO|
|前端美化|TODO|
|移动端|TODO|
|应用安全|TODO|

## 数据库

Docker 一键部署 Postgres:

```bash
docker run -d --name pg16 -e POSTGRES_USER=cybercafe -e POSTGRES_PASSWORD=cybercafe -e POSTGRES_DB=cybercafe -e LANG=C.UTF-8 -e LC_ALL=C.UTF-8 -v /d/workspace/cybercafe/assets/db:/var/lib/postgresql/data -p 15432:5432 postgres:16
```

## 开发日志

### 职责分离

后端采用分层设计, 从用户到数据库做分层:

```
用户 (浏览器)
↓
Handler (解释器)
↓
Service (业务逻辑)
↓
Repo (数据库交互)
↓
Database
```

### 预留字段

> 2026/01/06

考虑这张表, 为了方便之后的维护和二次开发, 为可能有增加的信息字段预留了一个 extra 字段, 为 jsonb 格式, 这样可以用比较小的代价来换取维护成本

```sql
CREATE TABLE books ( uuid UUID PRIMARY KEY, id TEXT NOT NULL UNIQUE, total INT NOT NULL CHECK (total >= 0), remain INT NOT NULL CHECK (remain >= 0), title TEXT NOT NULL, author TEXT NOT NULL, publisher TEXT,  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0), extra JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), CHECK (remain <= total) );
```

### 预编译查询

> 2026/01/08

采用分段式查询和预编译, 可以有效防止 SQL 注入, 考虑这两段查询:

- 分组查询:

```go
	baseSQL := `
		SELECT 
    	uuid, id, title, author, publisher, total, remain, extra, created_at, updated_at 
		FROM books
		`
	var (
		conditions []string
		args       []any
		idx        = 1
	)
	if q.ID != nil {
		conditions = append(conditions, fmt.Sprintf("id = $%d", idx))
		args = append(args, *q.ID)
		idx++
	}
	if q.Title != nil {
		conditions = append(conditions, fmt.Sprintf("title ILIKE $%d", idx))
		args = append(args, "%"+*q.Title+"%")
		idx++
	}
	if q.Author != nil {
		conditions = append(conditions, fmt.Sprintf("author ILIKE $%d", idx))
		args = append(args, "%"+*q.Author+"%")
		idx++
	}
	if q.Publisher != nil {
		conditions = append(conditions, fmt.Sprintf("publisher ILIKE $%d", idx))
		args = append(args, "%"+*q.Publisher+"%")
		idx++
	}
	if len(conditions) > 0 {
		baseSQL += " WHERE " + strings.Join(conditions, " AND ")
	}
```

- 字符串拼接:

```go
// danger !
sql := "select name, gender from users where id = '" + attr1 + "'"
```

两者的根本区别在于, 分组式查询将用户可控的内容限制在了字段值, 而非字段名; 也就是说, 用户只能控制所查参数的值, 而不能控制要查哪一个参数; 

也就是要查的字段已经提前完成了编译, 在数据库眼里这句的解析类似:

```sql
SELECT a,b FROM c where d = $1
```

而如果用户控制了上述的 a, b 或者 d, 则数据库的编译解析将发生在用户输入之后, 这就会发生注入的风险;

### 彻底的分离和减少复用

在多次调整结构后, 将查书和借书的复用部分完全取消, 决定将借书之前查书的部分不使用后端的 handler 或者 service , 防止将来可能的业务混乱, 准备等 webui 上线后留给前端;

### 登录鉴权

#### 流程图

```text
         ┌───────────────┐
         │   前端请求 API │
         └───────┬───────┘
                 │
                 ▼
        ┌─────────────────┐
        │  中间件：鉴权拦截 │
        └───────┬─────────┘
                 │
     ┌───────────┴───────────┐
     │                       │
     ▼                       ▼
未登录 / Token 无效       已登录
     │                       │
     ▼                       ▼
返回 401 或跳转登录      ┌──────────────────────┐
                        │ 权限检查（用户/管理员） │
                        └───────┬───────────────┘
                                │
              ┌─────────────────┴─────────────────┐
              │                                   │
              ▼                                   ▼
      权限不足（普通用户操作管理员接口）       权限足够
              │                                   │
              ▼                                   ▼
          返回 403                                调用 Handler
                                                    │
                                                    ▼
                                         访问相应业务逻辑（repo / entity）
                                                    │
                                                    ▼
                                                返回响应
                                                    │
                                                    ▼
                                              前端接收处理
```

### 数据库设计

关于数据库的并发效率, 总结了一下最近的开发经验:

> 并发效率 ≈ 锁粒度 × 扫描行数 × 索引可用性 × 是否发生写

设计关键在于:

1. 是否命中索引 (Index Access Path)

| 条件                 | 是否走索引     | 代价            |
| -------------------- | -------------- | --------------- |
| `pk = ?`             | ✅ 精确索引     | O(log N) + 1 行 |
| `unique_key = ?`     | ✅ 精确索引     | O(log N) + 1 行 |
| `non_unique_key = ?` | ✅ 索引         | O(log N) + k 行 |
| `LIKE 'abc%'`        | ✅ **范围扫描** | O(log N) + 范围 |
| `LIKE '%abc'`        | ❌              | 全表扫描        |
| `LIKE '%abc%'`       | ❌              | 全表扫描        |


2. 实际扫描行

例如: 

```sql
SELECT * FROM books WHERE author = 'Tom';
```

- 无索引 `->` 扫全表
- 有索引 `->` 

3. 是否发生写

读写锁完全不一样, 对于不同的行为, PG 的处理:

> PG 本身是 增量快照 + transaction 维护的;

| 操作                  | 锁                   |
| --------------------- | -------------------- |
| 普通 SELECT           | ❌ 不加行锁（快照读） |
| SELECT ... FOR UPDATE | ✅ 行锁               |
| UPDATE / DELETE       | ✅ 行锁 + 间隙锁      |
| DDL                   | ❌/✅（取决于操作）    |

可见 读走的是**一致性快照 (Read View)**

4. 锁粒度

常见锁: 行锁, 间隙锁, 表锁

| 场景                    | 锁规模        |
| ----------------------- | ------------- |
| `pk = ? UPDATE`         | 1 行          |
| `unique = ? UPDATE`     | 1 行          |
| `non-unique = ? UPDATE` | 多行          |
| `range UPDATE`          | 行锁 + 间隙锁 |
| `LIKE '%xx%' UPDATE`    | 大量行 + 间隙 |
| `LOCK TABLE`            | 表锁（灾难）  |

---

了解到这些之后就能明白, 尽量需要让读写, 特别是写操作 **都基于唯一字段**; (Primary-Key Oriented API)

> 这个情况下查询路径一定是最短路径, 数据库会在扫到第一条数据后自动停止扫描并返回结果, 这个过程对用户和程序员完全透明;

#### 可能的未来问题?

刚刚已经提到, 前缀查询是范围扫描, 而后缀和模糊查询不可以; 这是从 `string -> int` 得出的结论; 那么其实只要设计一个翻转后的索引即可, 而对于模糊查询, PG 有专门的索引 GIN TRGM (Trigram)

> 还有相似度搜索, 这是最强大的功能;

```sql
SELECT * FROM users WHERE name % 'Jon';
-- 返回与"Jon"相似的名字（如"John", "Jhon", "Johan"等）
```

### 账号校验

> 2026/01/10

为什么“先查账号，再比密码”, 而不是 `username = x and password = x` ? 

> 首先数据库里存的绝对不是密码明文; 而是:
>
> ```
> bcrypt(password, salt, cost)
> argon2(password, salt, params)
> ```

1. 防止把密码学逻辑下沉到数据库

简单来讲, 问题:

| 问题              | 后果           |
| ----------------- | -------------- |
| DB 知道 hash 细节 | 攻击面扩大     |
| DB 可直接校验密码 | 泄漏风险增加   |
| 算法升级困难      | 数据库迁移噩梦 |

认证逻辑必须在应用层, 才方便处理安全问题;

2. 防止数据库权限过大

如果 DB 可以直接判断 `username + password` 组合, 则 SQL 注入 / 日志泄漏 / 备份泄漏 后, 攻击者直接可以登录任意账户, 这非常危险;

长话短说, 数据库不应该具有 **认证语义**;

---

### Login / Register + JWT 后端实现小结

本次实现覆盖了 **注册（Register）→ 登录（Login）→ JWT 鉴权** 的完整链路，整体设计以「分层清晰、职责单一、安全优先」为原则，核心要点如下。

---

#### 一、清晰的领域划分（Boundary 正确）

- **users 域**
  - 负责身份创建（Register）
  - 只关心用户是否存在、如何存储
  - 不产生任何鉴权态

- **auth 域**
  - 负责身份认证（Login）
  - 校验凭据、签发 JWT
  - 不创建用户、不修改用户基础信息

> Register ≠ Authentication  
> Register 是 Identity Creation，Login 才是 Auth

---

#### 二、严格的分层职责（非常关键）

##### Handler
- 只负责：
  - HTTP 参数解析
  - 基础校验
  - 错误 → HTTP 状态码映射
- **不处理密码、不写业务规则**

##### Service
- 业务核心层：
  - bcrypt 生成 / 校验
  - userid 生成与冲突重试
  - 注册 / 登录规则控制
- **唯一允许“理解密码语义”的层**

##### Repo
- 纯数据访问层：
  - INSERT / SELECT
  - 利用数据库约束保证一致性
- **只接收 password_hash，不接触明文密码**

---

#### 三、注册流程设计要点（Register）

- 不做「先查再插」
- 直接 `INSERT`，由 DB UNIQUE 约束兜底
- PostgreSQL 唯一约束显式命名：
  - `uk_users_username`
  - `uk_users_email`
  - `uk_users_phone`
  - `uk_users_userid`
- Repo 层解析 `unique_violation (23505)`，返回**语义化错误**
- userid：
  - 服务端生成
  - 使用 `crypto/rand`
  - 非连续、不可预测
  - 冲突在 service 层 retry

---

#### 四、密码与安全策略

- 明文密码生命周期极短：
  - 仅存在于 handler → service
- bcrypt：
  - 只在 service 层生成 / 校验
  - repo 永远只存 hash
- repo 不依赖 bcrypt，保证：
  - 可测试性
  - 可替换性
  - 职责纯净

---

#### 五、登录流程设计要点（Login）

- 登录只做：
  - 查询 credential
  - bcrypt.Compare
  - 签发 JWT
- 不自动注册、不混合注册逻辑
- 登录失败原因可控（不存在 / 密码错误）

---

#### 六、JWT 设计原则

- JWT 只在 auth 域生成
- payload 最小化（user_id / role 等）
- handler 只负责：
  - 取 token
  - 调用 auth service 校验
- 中间件做统一鉴权，业务 handler 不感知 JWT 细节

---

#### 七、错误设计（工程级）

- repo 返回 **业务语义错误**
- handler 决定 HTTP 状态码：
  - 400：参数错误
  - 401：认证失败
  - 409：资源冲突（用户名 / 邮箱 / 手机）
  - 500：系统错误
- 不依赖字符串匹配判断错误类型

---

#### 八、整体收益

- 并发安全（无 TOCTOU）
- 安全边界清晰（最小暴露）
- 易于测试（service / repo 可独立 mock）
- 可扩展（未来支持 OAuth / WebAuthn 不翻层）
- 结构稳定，避免中后期重构

---

### 联调注意

联调时, 前端和数据库在 docker, 而后端在宿主机; 宿主机访问 docker 内容非常简单, 通过端口映射即可; 但是 docker 访问宿主机, 不可以用 `localhost` (指向容器自身), 而要使用 `host.docker.internal`;

这个写法是非法组合 (协议级非法), 会导致无法访问, 注意避免:

```
AllowOrigins: []string{"*"} 
AllowCredentials: true
```

#### 非简单请求

触发预检（OPTIONS）的条件（命中其中之一即可）

- 跨域（5173 → 9016） ✅
- Content-Type: application/json ❌（不是 simple header）
- POST + JSON body ❌

#### 跨域认证

从不同端口收发数据属于跨域, 需要做跨域鉴权; 有几种解决方式:

 - 临时调试:

```go
	// 成功响应
	// c.SetCookie("cookie",
	// 	result.Token,
	// 	7200,
	// 	"/",
	// 	// 本地测试时将 domain 留空
	// 	"localhost",
	// 	true,
	// 	true)

	// 调试配置: 允许跨站
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "cookie",
		Value:    result.Token,
		Path:     "/",
		Domain:   "localhost",
		MaxAge:   7200,
		Secure:   true,
		HttpOnly: true,
		SameSite: http.SameSiteNoneMode, // *
	})
```

### 前端发起查询的参数设计

> 2026/01/15

前端永远不应该可以直接在 post 或 get 的参数中直接涉及查询参数, 相反, 应该存放在 JWT 中; 因为 JWT 存在签名机制, 用户无法篡改, 否则无法通过服务端的校验;

简单来说, 概括一下这样做的优点:

- 语义统一;
- 查询条件统一, 干净;
- 语义接口稳定;

### Dashboard 页面

下一步是开发用户的仪表盘页面, 这一步是前后端同时推进的; 考虑主页上涉及的功能有: 查看账户余额, 显示会员等级, 查询借还记录, 显示书架, 显示推荐商品;

> 2026/01/18

前端仪表盘功能汇总:

### mkcert HTTPS 服务

github: [mkcert](https://github.com/FiloSottile/mkcert/releases/tag/v1.4.4)

> 2026/01/21

```bash
mkcert -install
mkcert localhost 127.0.0.1 ::1
```



1️⃣ 用户态内容

我的会员等级
当前可用优惠券
借阅剩余额度

2️⃣ 场景入口

今日可借阅书籍
门店座位情况（实时感）
推荐阅读 / 试读

3️⃣ 商业引导

会员升级提
限时优惠
到店自取推荐

#### 建表

拿最典型的三个表为例: **账户表 (余额, 会员等级..), 借还记录表, 收藏图书表**

显然这三个表都需要与 user 表直接相连, 这里涉及到一个外键设计问题, 现在有很多大型项目在设计数据库的时候会**禁用物理外键+级联**, 把数据库的约束放到应用层由程序员显式解决; 这么做的原因是: 1. 高并发场景下, 物理外键会引起数据库额外开销, 容易形成性能瓶颈; 2. 维护外键约束时, 尤其是删除操作中, 需要对相关表加表级锁, 容易阻塞影响吞吐; 

这里本项目的 PG 就发挥了优势: PG 的外键实现更优 (说的就是 Mysql), 使用了更优的表级锁, 只要不频繁发起大规模删除操作, 就不容易阻塞; 

### context 生命周期和事务一致性

> 2026/01/18

在 Go 使用 `database/sql` 与 PostgreSQL 交互时，`context.Context` 不仅用于超时控制，也直接影响数据库连接与事务的生命周期。

### 跨域认证 2.0

> 2026/01/21

一开始做前后端分离，用的是 Cookie + JWT，前端 9017，后端 9016，看起来一切配置都对：

- 后端 `Set-Cookie`
- CORS 开 `AllowCredentials`
- 前端 `fetch(..., credentials: "include")`

但实际各种怪问题接连出现。

#### 第一坑: Cookie 明明 Set 了, 后续请求不带

是浏览器策略的问题; 

需要 `SameSite=None`; `Secure=true`, 但是 `Secure=true` 需要 HTTPS

#### 第二坑：HTTPS 上了，Chrome 能用，Firefox 不行

表现：
- Chrome：正常登录
- Firefox：*failed to fetch*，后端压根没收到请求

原因：
- Firefox 对 localhost + HTTPS + 跨域 + Cookie 极度严格
- localhost 在 HTTPS 场景下就是个雷

#### 第三坑：Firefox + Burp 更炸

即使信任了 PortSwigger CA, Firefox 仍然拒绝 `https://localhost`

最可能的原因:
  Firefox 对 localhost 的 TLS 和 MITM 有额外限制

#### 最终解法

不用 localhost;

hosts 里面放域名:

```
127.0.0.1 frontend.test
127.0.0.1 backend.test
```

mkcert 生成域名:

```
mkcert frontend.test 
mkcert backend.test
```

前后端都用 HTTPS + 域名跑; 调试不用 Burpsuite, 用 Chrome 自带监控够用;
早点上域名和证书，反而少踩坑。

### 前端书籍详情页

> 2026/01/22

从搜书结果页进入书籍详情页，路由 `/search_books/:id`

先做了后端, 现在搞一下前端, 目标是直观但是易用;

#### 后端接口

`GET /books/:id`:

复用了条件查询的接口, 返回值是 `[]*Book` 数组, 前端需要明确取数组第一个; 注意一下特殊字段, 例如 `Decimal` 前端要按 string 接收;

封面处理: 暂时不存数据库, 直接按照 {book_id}.png 的方式直观的存在一个固定文件夹;

详情页的关键设计是解析方式, 为了以后的可扩展 (毕竟详情页想显示什么都可以), 后端对应的字段是 extra (JSONB), 方便修改; 包含 `intro / summary / genre / field / award / words` 等; 暂时没给这个页面加类似 dashboard 的兜底文案;

顺便做了一个一键借阅的功能, 把详情跟借阅给稍微串了一下; 当然以后应该还要做二次开发, 比如可能会做一个 QRCode 生成, 凭 QRCode 确认借书已完成; 不过这都是非常后期要做的事情了;

#### 返回按钮

> 2026/01/22

这里踩了一个大坑; 一开始在 Search → Detail 页面点击返回时，发现搜索框内容和搜索结果全部丢失。

一开始用的是 `navigate(-1)`, 当时以为会把「上一个页面的状态」一起带回来。但是实际上 `-1` 只**负责 URL 回退，不负责 组件实例回溯**。

Search 页面在跳转到 Detail 后 **被卸载**，返回时是一个 **全新的 Search 组件实例**; 而之前的 Dashboard → Search 的跳转可以成功的原因是因为其本质并不是保存状态, 而是**带参数初始化**; 反过来说这里不行的原因就是因为原有组件已经卸载销毁, 返回的时候重新创建了一个新的, 代码被重新跑了一遍, 也就是重新初始化了;

也就是说, 如果要保存状态返回, 需要一个其他的载体来放参数, 在浏览器中最好的载体肯定就是 URL 了; 和 AI 互动了一会发现可以做一个简单的 URL 序列化;

解决方案:

- 将搜索状态整体序列化进 URL（snapshot → JSON → encode）
- Search 页面优先从 URL 恢复状态
- Dashboard 跳转只在 URL 为空时生效 (设置优先级)
- `navigate(-1)` 保持不变

#### 收获

- “页面返回 ≠ 状态回溯”
- React Router 只保证路由，不保证组件存活
- 状态设计本质是 生命周期设计
- URL 才是真正跨生命周期的状态边界

### 时区设置

> 2026/02/13

**问题描述**：订单创建后 `expired_at` 时间比实际时间回退 8 小时

**根因分析**：
- Go 应用使用 `time.Now().Format("2006-01-02 15:04:05")` 生成时间字符串
- `time.Now()` 返回 UTC 时间
- 数据库使用 CST (UTC+8) 时区
- 时区不一致导致存储的时间比实际早 8 小时

**解决方案**：统一使用 `time.Time` 类型，让 `pgx` 驱动自动处理时区转换

**修改文件**：
- `entity.go`：结构体字段类型从 `string` 改为 `time.Time`
- `repo_loader.go`：移除 `.Format()` 调用，直接使用 `time.Now()`
- `repo_postgres.go`：调整扫描逻辑适配 `time.Time`

**修改详情**：
| 结构体 | 字段 |
| ------ | ---- |
| `PersistOrder` | CreatedAt, UpdatedAt, ExpiredAt |
| `PersistOrderItem` | CreatedAt |
| `PersistOrderItemOption` | CreatedAt |
| `ConfirmResponse` | ExpiredAt |
| `BasicOrderResponse` | CreatedAt, UpdatedAt, ExpiredAt |

**核心改动**：
```go
// 修改前
CreatedAt: time.Now().Format("2006-01-02 15:04:05")

// 修改后
CreatedAt: time.Now()
```

**效果**：`pgx` 驱动会自动将 `time.Time` 与数据库 `timestamp` 进行正确的时区转换。

### 评论系统

### 订单查询

> 2026/02/14

今天重新思考了一下订单查询系统的设计问题，核心在于订单明细的存储方式选择。

当前模型是 orders (区别于 product) 表存基础信息（含总价），明细拆分在 order_items / order_options / order_option_values 等结构化表中。问题在于：订单列表查询频繁，而真正进入详情页查看复杂选项的场景相对较少。

对比了三种方案：

A 是在 orders 表中直接存 jsonb 明细快照。优点是查询简单、性能好，天然符合“订单是历史快照”的特性；缺点是结构化统计能力弱，扩展性受限。

B 是完全依赖结构化表，通过联表或视图查询生成详情。优点是模型规范、数据一致性强、便于统计分析；缺点是查询复杂度高，高并发下 join 成本明显。

C 是折中方案：结构化表保留，写入时生成 snapshot 存入 orders 表。列表页和详情页优先走 snapshot，统计和分析走结构化表。写入复杂度略高，但读性能和扩展性都更均衡。

结合真实电商业务场景下（高频查列表、低频查详情, orders 表 snapshot 在内的大多数字段有类似"元数据"的特性, 原则上可以一次写入, 不再改动, order 相关表禁用物理删除），似乎 C 更好; 本质上是“写用规范模型，读用物化模型”的思路，用一定冗余换取查询效率，符合实际工程场景。

后续实现重点：

snapshot 在同一事务中生成，保证一致性
控制 snapshot 颗粒度，只存展示所需信息
统计逻辑仍依赖结构化表
这次设计的关键收获是：订单是历史快照数据，不能完全用传统范式思维看待，需要结合真实访问模式做权衡。

不过考量了一下网站暂时用不上这个功能 -> B 方案足够, 后续接入 Redis, 优先优化 Redis 层面

### 阅读器功能

架构: 前端解析（epub.js）+ 后端流式传输

后端需要维护的接口:
1. 获取书籍元数据接口 (已有)
2. 返回书籍章节信息的接口 (新增)

前端: epub.js 解析

数据库:
需要维护的新表: 
1. 章节信息表; 
2. 阅读记录表- 关系应该是 pk->书(主)->uid->进度信息->extra(jsonb)

其他要做的准备:
批量从 epub 中提取章节信息;
批量从 epub 中提取字数统计;
自动化导入进入数据库;
后端需要断点续传epub到前端, 不能原样传输整个文件防止泄露

### 接入 Redis

> 2026/02/28

#### 规范化部署并用 Docker 部署 Redis

准备文件结构:

```
cybercafe/
│
├── docker/
│   ├── docker-compose.yml
│   ├── .env                  ← 仅给 compose + PG 用
│   │
│   └── redis/
│       └── users.acl         ← Redis ACL 文件
│
├── assets/
│   ├── db/
│   └── redis/
│
└── env/                      ← 给 Go 应用用
    └── app.env
```

`users.acl` 用于管理 redis:7 的用户:

```acl

# 禁用默认用户
user default off

# 添加 cybercafe 用户
user cybercafe on >cybercafe allcommands allkeys
```

准备一个 `docker-compose.yml` :

```yml
name: cybercafe

services:

  postgres:
    image: postgres:16
    container_name: cybercafe-postgres
    restart: unless-stopped
    env_file:
      - .env
    environment:
      LANG: C.UTF-8
      LC_ALL: C.UTF-8
    volumes:
      - ../assets/db:/var/lib/postgresql/data
    ports:
      - "15432:5432"

  redis:
    image: redis:7
    container_name: cybercafe-redis
    restart: unless-stopped
    command: >
      redis-server
      --appendonly yes
      --aclfile /usr/local/etc/redis/users.acl
    volumes:
      - ../assets/redis:/data
      - ./redis/users.acl:/usr/local/etc/redis/users.acl
    ports:
      - "16379:6379"
```

docker 目录执行:

```bash
docker compose up -d
```

#### 重构 router

用容器模式重构 router;

示例:

```go
// Container 依赖注入容器
// 负责管理所有模块的依赖初始化和 Handler 实例
type Container struct {
	db    *db.Postgres
	redis *redis.Redis

	// 各模块的 Handler（供路由注册使用）
	BookHandler      *books2.BookHandler
	AuthHandler      *auth.CredentialHandler
	UserHandler      *users2.UserHandler
	DashboardHandler *dashboard2.Handler
	OrderHandler     *order2.OrderHandler
	ProductHandler   *products2.ProductHandler
}

// NewContainer 创建容器实例，初始化所有依赖
func NewContainer(pg *db.Postgres, r *redis.Redis) *Container {
	c := &Container{
		db:    pg,
		redis: r,
	}
	c.initBooks()
	c.initAuth()
	c.initUsers()
	c.initDashboard()
	c.initOrders()
	c.initProducts()
	return c
}

// initBooks 初始化图书模块的依赖
func (c *Container) initBooks() {
	repo := books2.NewPostgresRepo(c.db.DB())
	svc := books2.NewService(repo)
	c.BookHandler = books2.NewHandler(svc)
}
```

这样职责会更加清晰, 新路由新功能加入时按需在上方加入即可;

#### 接入计划

| 接口路径 | 场景描述 | 缓存策略 / TTL | 适配度 | 备注 | 进度 |
|-----------|------------|----------------|--------|------|----|
| `GET /api/products/all` | 全局商品列表，极少变更 | TTL 5–10 分钟 | 高 | 使用“旁路缓存（Cache-Aside）”，注意数据量不要过大，避免单 Key 体积过大影响网络与内存效率。 | 已完成: `2026/03/03`|
| `GET /api/books/:id` | 单本详情，读多写少 | TTL 5–10 分钟 | 高 | 经典 Cache-Aside 模式。库存或详情变更时必须主动删除缓存。 | 已完成: `2026/03/03` |
| `POST /api/books/search` | 搜索结果，复用高 | TTL 2–5 分钟 | 中 | 警惕缓存污染。对搜索参数做规范化排序后哈希（如 SHA256）作为 Key。 | TODO |
| `GET /api/me/bookshelf`| 用户书架查询 | TTL 2–5 分钟 | 中 | 用户书架是被大量访问的场景, 注意添加或移除书籍时需要删除缓存 | 已完成: `2026/03/04`|
| `GET /api/me/summary` | 用户个人摘要 | TTL 1–2 分钟 | 中 | Key 必须带用户维度：user:summary:{uid}，防止数据串号。 | TODO |
| `GET /api/me/dashboard` | 仪表盘汇总数据 | TTL 1–2 分钟 | 中 | 建议在相关数据变更时主动删除对应 Key，实现“准实时”效果。 | TODO |
| `GET /api/me/recent`... | 最近借阅记录 | TTL 1–2 分钟 | 中 | 同上，Key 必须细分到用户级别，例如 user:recent:{uid}。 | TODO |
| `POST /api/login` | 登录限流 / 防暴力破解 | 动态过期（滑动窗口） | 高 | 属于业务控制而非缓存。建议使用 Redis 的 INCR + EXPIRE 实现限流。 | Future |
| Token 黑名单 | JWT 立即失效控制 | TTL = Token 剩余有效期 | 高 | 安全关键逻辑。仅在登出或强制失效时写入 Redis。注意不要做全量扫描。 | Future |

#### Redis 缓存设计模式

- Cache-Aside: (最常用)

```
1. 先查 Redis
2. 没有命中 → 查 DB
3. 查到 → 写回 Redis
4. 返回数据
```

- Read-Through (读穿)

```
App → Cache → DB
```

由缓存层自动帮查数据库; 

> 代码干净, 统一管理, 但是**Redis 原生不支持**

- Write-Through (写穿)

```
写 Cache → Cache 自动写 DB
```

强一致性, 业务场景需要极强的一致性时考虑; 写延迟高, Redis 适配低

- Write-Behind (写回)

```
写 Cache → 异步写 DB
```

性能极高, 一致性差;

> 现在显然用旁路缓存即可; 结构:

```go
func GetAllProducts(ctx context.Context) ([]Product, error) {
	key := "product:list:all"

	// 查缓存
	val, err := rdb.Get(ctx, key).Result()
	if err == nil {
		var list []Product
		_ = json.Unmarshal([]byte(val), &list)
		return list, nil
	}

	// 查数据库
	list, err := repo.GetAllFromDB()
	if err != nil {
		return nil, err
	}

	// 回写缓存
	bytes, _ := json.Marshal(list)
	rdb.Set(ctx, key, bytes, 0) // 永不过期

	return list, nil
}
```
#### 实现

```
HTTP 请求
   ↓
Gin Router (routes.go)
   ↓
Handler (handler.go)
   ↓
Service (service.go)
   ↓
CacheDecorator (repo_cache.go) ←── Redis 缓存层
   ↓
PostgresRepo (repo_postgres.go) ←── 数据库层
   ↓
PostgreSQL
```



## 测试数据:

```json
"username":"john_doe",
"password":"12345678",
"email":"johndoe@example.com",
"phone":"11122233344"

"username":"alice",
"password":"12345678",
"email":"alice@example.com",
"phone":"11122233355"

"username":"zhangquandan",
"password":"1234567890",
"email":"zqd@example.com",
"phone":"13300012345"
```
## 前端初始化

项目结构:

```
.
├── backend/
└── frontend/
    ├── src/
    │   ├── assets/
    │   ├── App.tsx
    │   ├── main.tsx
    │   └── index.css
    ├── index.html
    ├── package.json
    ├── package-lock.json
    ├── tsconfig.json
    ├── tsconfig.node.json
    ├── vite.config.ts
    ├── tailwind.config.ts
    ├── postcss.config.js

```

执行

```bash
cd frontend
npm install
docker compose up -d
```

## (TODO) 结构
                  
```
src/
├─ api/                # 所有后端通信（REST / GraphQL）
│  ├─ http.ts          # axios / fetch 封装
│  ├─ auth.ts
│  ├─ books.ts
│  └─ index.ts
│
├─ components/         # 纯 UI 组件（无业务）
│  ├─ Button.tsx
│  ├─ Input.tsx
│  └─ Modal.tsx
│
├─ features/           # 业务功能域（强烈推荐）
│  ├─ auth/
│  │  ├─ pages/
│  │  │  └─ Login.tsx
│  │  ├─ hooks.ts
│  │  └─ types.ts
│  │
│  ├─ books/
│  │  ├─ pages/
│  │  │  └─ BookList.tsx
│  │  ├─ components/
│  │  ├─ hooks.ts
│  │  └─ types.ts
│
├─ layouts/            # 页面布局（Header / Sidebar）
│  └─ MainLayout.tsx
│
├─ router/             # 路由
│  └─ index.tsx
│
├─ store/              # 状态管理（后面再说）
│
├─ styles/             # 全局样式 / tailwind 扩展
│
├─ App.tsx
└─ main.tsx
```

### react 学习笔记

#### useState

用人话来说, `useState` 是为了方便 **"保存, 渲染 + 刷新"**, 如果不用这个功能, 则变量改变后组件不会重新渲染;

> 例如, 一个记录点击次数的功能, 假设按一个按钮就会使得计数 +1 , 此处如果不用 useState, 那么即使计数值发生了改变, 由于前端没有重新渲染, 用户将看不见值改变;

###

