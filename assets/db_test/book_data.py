import csv
import json
import psycopg
from psycopg.types.json import Json
from decimal import Decimal

conn = psycopg.connect(
    host="127.0.0.1",
    port=15432,
    dbname="cybercafe",
    user="cybercafe",
    password="cybercafe"
)

insert_sql = """
INSERT INTO books (
    uuid, id, total, remain, title, author, publisher, price, extra
)
VALUES (
    %(uuid)s, %(id)s, %(total)s, %(remain)s,
    %(title)s, %(author)s, %(publisher)s, %(price)s,
    %(extra)s
)
"""

with conn, conn.cursor() as cur:
    with open("./assets/db_test/books.csv", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            row["total"] = int(row["total"])
            row["remain"] = int(row["remain"])
            row["price"] = Decimal(row["price"])
            row["extra"] = Json(json.loads(row["extra"]))

            cur.execute(insert_sql, row)

print("✅ 数据导入完成")
