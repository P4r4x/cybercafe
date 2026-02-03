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
|(前端) 仪表盘主页|complete|
|WebUI (基本前端)|complete|
|借还记录|complete|
|购物车, 取餐点餐|in progress|
|人员管理|TODO|
|订座订购功能|TODO|
|接入 Redis| TODO |
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

### 查询结构体: 指针设计

查询参数使用指针的优势验证: 

1. 精确查询:

```go
// 用户想查标题为空字符串的书籍
req := BookQuery{Title: &""}
// SQL: WHERE title = ''

// 用户想忽略标题条件
req := BookQuery{}
// SQL: 不包含title条件
```

2. 复合查询

```
// 查询价格为0的书籍
req := SearchBooksReq{PriceMin: &decimal.Zero}
// SQL: WHERE price >= 0

// 忽略价格条件  
req := SearchBooksReq{}
// SQL: 不包含价格条件
```

虽然这个例子有点偏离实际, 但意思大概就是这个样子; 涉及和前端传参, 尤其是 POST 表单对接的时候, 需要注意, 非必选项使用指针更好;

### 登出功能

由于用了 httpOnly 的 cookie, 登出页面需要走后端接口, 因为 js 是**无权访问**这种 cookie 的; 登出只需要在后端 setcookie, 设置一个空 cookie, 且过期即可; 这样也没必要再走一次校验; 

### 进一步学习 Cookie (跨域认证 3.0)

这篇专栏很有帮助: [知乎专栏](https://zhuanlan.zhihu.com/p/354215929)


|请求类型|	Lax模式|	Strict模式|	None模式|
|-------|---------|---------|--------|
|同站导航|	✅ 允许|	✅ 允许|	✅ 允许|
|同站AJAX|	✅ 允许|	❌ 阻止|	✅ 允许|
|跨站导航|	⚠️ 有限|	❌ 阻止|	✅ 允许|
|跨站AJAX|	❌ 阻止|	❌ 阻止|	✅ 允许|

看到这里决定把站内 cookie 换用 Lax 模式;

为了解决前后端跨站的问题, 用 mkcert:

```bash
mkcert *.cybercafe.test
```

> 注意, 用通配符;

然后往 hosts 里改:

```hosts
127.0.0.1 前端域名
127.0.0.1 后端域名
```

即可; 这样即使是不同端口, 也不视为跨站; 刚刚的 set-cookie 也可以正确放行;

### 头像管理

头像和之前的数据最大的不同在于, 用户的头像是一个**二进制文件** (图片); 显然不适合直接把整个二进制文件存进数据库; 考虑这个方案:

```
写 (upload/change) => 后端
读 (view/fetch) => 不走后端
```

假设头像没有隐私设置 (即不存在 *"用户读其他人头像非法"* 的情况)

#### 读入口

```
Frontend  ──GET──▶ CDN / Static / OSS
```

返回示例:

```json
{
  "avatar_url": "https://cdn.xxx/avatars/123/1707050123.webp"
}
```

#### 写入口

```
Browser ──POST => Backend
Backend: /api/avatar/update
  - 校验 JWT
  - 校验 mime / size
  - decode → re-encode
  - 生成 version(timestampz)
  - PUT 到 storage
  - 返回 avatar_url
```

这个过程数据库几乎完全不参与;
为了查看历史头像/撤回, 数据库只需要维护一个字段: (users 表) avatar_version

示例的路径:  `./avatar/md5{uid}/{version}.png`

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

#### hook 闭包

很多时候你会觉得 `setState` 直接用当前变量就够了，比如 `setCount(count + 1)`，在点按钮、同步执行的那一瞬间，它看起来完全没问题。但这个写法其实是偷偷依赖了一个前提：这个函数执行时，闭包里的 `count` 一定是“最新的”。一旦这个前提被打破——比如一次事件里多次 set、进了 `setTimeout`、`useEffect`、订阅回调，或者在 React 18 的并发和批处理下——你用的就不再是“真实状态”，而只是“当年 render 时记住的那个值”。这就是所谓的闭包陈旧问题。

函数式更新 `setCount(prev => prev + 1)` 的意义就在这：它不是从闭包里拿 state，而是把“怎么算下一个状态”这个规则交给 React，由 React 在真正更新时，把当下最新的 state传给你。你不再假设执行时机、不再关心中间发生了什么，只声明一件事：新状态如何由旧状态推导出来。也正因为这样，函数式更新才能安全地组合、重放、批量执行，才能在 effect、异步回调、并发渲染里保持正确。

所以本质区别不在“写法”，而在信任谁：直接写 `count + 1` 是在信任当前闭包；写 `prev => prev + 1` 是在信任 React 的状态调度。当你的更新逻辑依赖旧状态时，闭包永远是不稳定因素，而函数式更新就是把这个不稳定因素彻底移走。

所以就结论来说, 永远用闭包表达是更加安全的, 对未来调试有好处;

### 优惠券 + 点单系统

#### 流程设计 (初版)

> 2026/01/26

##### 商品展示阶段

1. 前端请求商品数据
2. 后端返回商品基础信息 + 可选项规则

返回信息包括基础信息: 价格/名称/是否可售, 选项分量 / 甜度 / 温度 / 小料;

前端仅用于展示和交互，不参与定价逻辑。

##### 用户选购阶段

用户填写购物车; 可以自选优惠券; 这些流程全部发生在前端;

##### 提交订单预览

前端提交购物车并生成预览, 确认后发送到后端;

##### 后端下单校验与计价 (核心)

后端在此阶段承担 唯一裁判角色，所有合法性与金额以此为准。后端处理顺序:

1. 读入 JSONB 快照
  
   - 解析前端提交的订单项
   - 校验 JSON 结构完整性与字段合法性

2. 参数合法性校验

   - 数量是否 > 0
   - 选项字段是否缺失
   - 单选 / 多选规则是否符合定义

3. 商品合法性校验

   - 商品是否存在
   - 是否上架 / 可售
   - 选项是否属于该商品
   - 选项值是否合法
   - 附加价格是否匹配当前商品规则
  
    校验方式: 使用 **商品基础表 + 商品选项表** 进行联合校验, 不信任任何前端提交的价格字段
  
  4. 优惠券合法性校验
   
  - 用户是否持有该优惠券
  - 是否在有效期内
  - 是否满足优惠券规则 (基于订单 JSONB)
    - 商品范围限制
    - 最低消费
    - 首单 / 周期规则等
    
    注意这里需要用结构化 JSON, 避免 eval 类执行;

  5. 计价流程
  
     统计基础商品价格 + 所有选项附加价格 + 数量累计 + 优惠券折扣计算得到应付金额

  6. 金额一致性校验
  
  若前端提交了展示金额; 一致则通过, 否则修改订单金额并返回前端

  7. 进入支付准备状态
  
  生成序列号, 订单变为待支付状态

##### 支付阶段 (简述)

- 在用户确认支付后：

  后端再次校验订单（防重放）
  校验用户余额 / 发起第三方支付

- 扣款成功后：

  生成正式订单
  生成当日取餐号
  订单状态进入 PAID

#### 相关数据表

> 示意

商品基础表;

```
products
- id
- name
- base_price
- is_active
```

商品选项定义表;

```
product_options
- id
- product_id
- option_code   (size / sugar / topping / temp)
- option_type   (single / multi)
- required

```

商品选项值表:

```
product_option_values
- id
- option_id
- value
- extra_price
```

> 2026/01/26

为什么这里要做三张表, 而不是两张? 因为对每个扩展选项的键 / 值做清晰的规范处理, 有利于扩展; 设想: 如果用两张表, 那么需要用 JSONB 的方式来存具体选项, 这样不能直接排序或者简单增减规则;

订单主表

```
orders
- id
- user_id
- order_no
- pickup_no
- business_date
- status
- total_amount
- discount_amount
- pay_amount
- created_at
- paid_at
```

订单项表（关键）

```
order_items
- id
- order_id
- product_id
- product_name   (冗余快照)
- quantity
- unit_price
- options        (JSONB)
- remark
- item_total

```

> 这个订单项表只是一个快照;

优惠券定义表

```
coupons
- id
- name
- discount_type
- discount_value
- rules (JSONB)
- valid_from
- valid_to
```

用户优惠券表

```
user_coupons
- id
- user_id
- coupon_id
- status
- used_order_id
```

rules JSONB 示例:

```json
{
  "conditions": [
    { "type": "min_total_price", "value": 2000 },
    { "type": "include_products", "product_ids": ["p1", "p2"] },
    { "type": "first_order" }
  ]
}
```

#### 初版总结

商品规则结构化，订单结果快照化

前端负责交互，后端负责裁判

价格只在后端计算

JSONB 用于“结果记录”，不是“规则定义”

所有钱相关逻辑必须可复算、可审计

优惠券规则集中管理，避免表结构爆炸

#### 修正版

> 2026/01/30

旧流程的问题:

preview 就落库(用户刷新 / 重复点 / 网络抖动)

DB 中产生：

- 脏订单
- 重复订单
- 需要 cron / 清理脚本

新流程的改进

preview 完全无 DB 副作用

只是：校验计算, 生成 token

##### 新版流程

> 2026/01/31

把 preview 拆开成两步: submit + confirm;

submit 流程不落库, 只有 confirm 落库;

安全性由 token 保证: 

1. 用户传一个快照到服务器. 服务器校验商品合法后计算价格 + Token 到浏览器;
2. 浏览器渲染合法的认证后订单给用户, 用户确认后再经过 confirm 服务;
3. confirm 服务会校验 Token, 确认后落库;

整个过程 Token 无状态, 完全无 DB 负担;

```go

// SubmitService
// 订单预览 + 校验 + 生成权威价格 + 下单 token
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

	// 3. 生成订单提交 token（暂留）
	//    token 应基于 OrderContext + PriceResult
	//    而不是原始 req（防止前端篡改）
	orderToken := generateOrderToken(ctx, uid, orderCtx, priceResult)

	// 4. 返回结果（预览态）
	return &SubmitResponse{
		Result: priceResult,
		Token:  orderToken,
	}, nil
}
```

### 计价器纯化带来的直接收益

##### ✅ 性能
- 不再触发 IO
- O(N) 顺序遍历
- CPU cache 友好
- 可被频繁调用（preview / retry / verify）

##### ✅ 可测试性
- 单测不需要 mock DB
- 构造 OrderContext 即可
- 可做属性测试（property-based testing）

#### ✅ 可复用性
- preview 使用
- submit 前复算
- token 校验时复算
- 风控 / 对账 / 审计

#### ✅ 语义清晰
> **计价器 = 数学函数，不是服务**

---

#### 为什么计价器必须依赖 OrderContext，而不是 OrderRequest

| 输入         | 是否可信     | 问题           |
| ------------ | ------------ | -------------- |
| OrderRequest | ❌ 用户输入   | 可被篡改、重放 |
| OrderContext | ✅ 系统校验后 | 唯一权威       |

结论：
> **只要计价器接受 OrderRequest，就永远存在“绕过校验”的可能性**

好处：
- auth 不被业务污染
- orders 可以独立演进
- token 规则可随业务变化

---

##### orderToken 的本质：业务级签名

> **orderToken 不是凭证，而是“共识证明”**

它通常绑定：
- uid
- OrderContext hash
- PriceResult hash
- timestamp / ttl

作用：
- 防篡改
- 防重放
- 防跨用户提交

---

#### 分离带来的系统级优势

##### ✅ 安全性
- 即使 auth token 泄漏
- 没有 orderToken 也无法下单

##### ✅ 防抖 / 防重
- preview 无状态
- submit 必须携带 token
- token 可设计为一次性或短期有效

##### ✅ 并发友好
- preview 可无限并发
- submit 严格收敛

---

### 完整 订单链路

```
Submit (preview)
↓
CheckOrder → OrderContext
↓
PriceCalculator → PriceResult
↓
generateOrderToken → Token
↓
返回前端
```

```
CreateOrder (submit)
↓
VerifyOrderToken
↓
（可选）重新 Calculate
↓
唯一一次落库
```

> 2026/02/01

(在 AI 的协作下) 整理了一份前端的文档: [购物车逻辑](./frontend/src/docs/order-implementation.md)


### 提前聚合的数据结构

> 2026/02/02

#### ❌ 传统写法 - N+1查询
```go
for _, item := range orderItems {
    product, _ := db.GetProduct(item.ProductID)        // 1次查询
    for _, opt := range item.Options {
        option, _ := db.GetOption(opt.OptionCode)       // N次查询  
        for _, val := range opt.Values {
            optionValue, _ := db.GetOptionValue(val)    // M次查询
        }
    }
}
// 总复杂度：1 + N + M -> 退化!
// 关键: 每一层的查询中, sql 查询次数是不可预测的
```

这种写法在订单场景下会导致：
- 商品查询次数 = 订单商品数量
- 选项查询次数 = 所有商品的选项总数  
- 选项值查询次数 = 所有选项的值总数
- 总查询次数 = 商品数 * 选项数 * 选项值数

>  解决方案：中间数据结构 + 批量预加载

#### ✅ 优化写法 - 批量加载

```go
// 第一步：收集所有需要的ID
productIDs := collectProductIDs(orderItems)          // O(P)

// 第二步：批量加载（3 次查询搞定, 对应 3 张表）
products := batchLoadProducts(productIDs)             // 1次查询
options := batchLoadOptions(productIDs)               // 1次查询  
values := batchLoadValues(optionIDs)                 // 1次查询

// 第三步：构建内存索引 (Go Map 结构自带)
productMap := buildProductMap(products)              // O(P)
optionMap := buildOptionMap(options)                  // O(O)
valueMap := buildValueMap(values)                    // O(V)

// 第四步：全部内存操作，无数据库查询
for _, item := range orderItems {
    product := productMap[item.ProductID]             // O(1)
    for _, opt := range item.Options {
        option := optionMap[opt.OptionCode]           // O(1)
        for _, val := range opt.Values {
            optionValue := valueMap[val]              // O(1)
        }
    }
}
```

#### 总结

> 用一次 `Join + Group` 的效果，替代多次 点查; 或者说把聚合提前到应用层而非数据库;

这种操作的本质是利用编程语言的内存管理, 通过提前聚合来避免大量的含 where sql 语句批量执行; 并且*内存管理*听起来有点吓人, 但是编程语言基本上都自然支持, 结构体会自动入堆, 实际上这段代码就是在内存里放了一堆数据, 在其生命周期结束之前, 分配到需要的地方就行了;

进一步的讲, 这种提前聚合的操作应该可以普遍适用于有以下场景:

1. 多层关联表 (即 1 层以上的 **1 对多结构**);
2. 读多写少的场景 (第 1 条通常就满足这个特征)

### 支付流程设计

支付接口设计为 `POST` `/api/orders/pay`。
接口参数只需要订单 ID，从请求体读取；用户身份不从前端传，由服务端通过 JWT 鉴权直接得到用户 ID。金额等关键字段一律不信任前端，只从订单表读取。

后端的核心目标只有一件事：
在并发场景下，确保“这个用户的这个订单，只能被成功支付一次，且账户余额不会被扣错”。

为此，**支付不是“校验 + 扣款 + 改状态”三件事，而是一个跨表的状态迁移过程，必须由数据库保证原子性**。

需要开启一个事务 (涉及金额均需要开启事务), 事务两个步骤:

- 1: 查询订单归属;
- 2: 查余额 + 扣款, 聚合到一个语句中执行 (并发安全);

### Token 校验随机失败问题修复

> 2026/02/03

调试了很久, 调试日志和总结都放进了 [这里](debug-info.md)