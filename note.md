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

