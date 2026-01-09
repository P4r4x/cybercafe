线上东东佛书店
===

> 仿照西西弗书店的模式集成图书借阅等功能的 Go 项目, 本意是借这个机会熟悉 GoLang 开发

# 项目进度

## 整体进度

|任务|进度|
|----|----|
|图书基本功能开发(CRUD)(mvp)|complete|
|鉴权, 跨域认证(mvp)|in progress|
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

