

## 数据库

Docker 一键部署 Postgres:

```bash
docker run -d --name pg16 -e POSTGRES_USER=cybercafe -e POSTGRES_PASSWORD=cybercafe -e POSTGRES_DB=cybercafe -e LANG=C.UTF-8 -e LC_ALL=C.UTF-8 -v /d/workspace/cybercafe/assets/db:/var/lib/postgresql/data -p 15432:5432 postgres:16
```

### 示例表

```sql
CREATE TABLE books ( uuid UUID PRIMARY KEY, id TEXT NOT NULL UNIQUE, total INT NOT NULL CHECK (total >= 0), remain INT NOT NULL CHECK (remain >= 0), title TEXT NOT NULL, author TEXT NOT NULL, publisher TEXT,  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0), extra JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), CHECK (remain <= total) );
```

### CRUD

强制使用预编译:



## 后端设计

### 职责分离

```text
Client
  |
  |  HTTP GET /api/books/123
  |
  v
+-------------------+
|   Gin Router      |
+-------------------+
  |
  |  调用 handler.Get(c)
  |
  v
+-------------------+
|  BookHandler      |
|  (handler.go)     |
+-------------------+
  |
  |  1. 解析参数 id=123
  |  2. ctx := c.Request.Context()
  |  3. 调用 svc.GetBook(ctx, id)
  |
  v
+-------------------+
|  BookService      |
|  (service.go)     |
+-------------------+
  |
  |  4. 业务入口（此处无复杂规则）
  |  5. 调用 repo.GetByID(ctx, id)
  |
  v
+-------------------+
|  BookRepository   |   <-- interface
|  (repository.go)  |
+-------------------+
  |
  |  6. 实际实现：PostgresRepo
  |
  v
+-------------------+
|  PostgresRepo     |
|  (pg impl)        |
+-------------------+
  |
  |  7. 执行 SQL
  |     SELECT ... FROM books WHERE id=?
  |
  v
+-------------------+
|  PostgreSQL       |
+-------------------+

  ↑
  |  8. 返回 Book entity
  |
+-------------------+
|  BookRepository   |
+-------------------+
  ↑
  |  9. 返回 *Book
  |
+-------------------+
|  BookService      |
+-------------------+
  ↑
  | 10. 返回 *Book
  |
+-------------------+
|  BookHandler      |
+-------------------+
  |
  | 11. 转换为 HTTP JSON
  |
  v
Client

```