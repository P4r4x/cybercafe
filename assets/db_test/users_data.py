import csv
import json
import psycopg
from psycopg.types.json import Json
from datetime import datetime

conn = psycopg.connect(
    host="127.0.0.1",
    port=15432,
    dbname="cybercafe",
    user="cybercafe",
    password="cybercafe"
)

insert_sql = """
             INSERT INTO users (
                 id, username, email, phone, password_hash,
                 role, status, user_group, extra, last_login_at, created_at
             ) VALUES (
                          %(id)s, %(username)s, %(email)s, %(phone)s, %(password_hash)s,
                          %(role)s, %(status)s, %(user_group)s, %(extra)s, %(last_login_at)s, %(created_at)s
                      ) \
             """

def parse_timestamp(timestamp_str):
    """解析时间戳字符串，如果是空字符串则返回None"""
    if timestamp_str is None or timestamp_str.strip() == '':
        return None
    return datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S')

def parse_json(json_str):
    """解析JSON字符串，如果是空字符串则返回空字典"""
    if json_str is None or json_str.strip() == '':
        return {}
    return json.loads(json_str)

with conn, conn.cursor() as cur:
    with open("./assets/db_test/users.csv", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # 处理特殊字段
            row["extra"] = Json(parse_json(row["extra"]))
            row["last_login_at"] = parse_timestamp(row["last_login_at"])
            row["created_at"] = parse_timestamp(row["created_at"])

            # 处理可能为空的字段
            if row["email"] == '':
                row["email"] = None
            if row["phone"] == '':
                row["phone"] = None
            if row["user_group"] == '':
                row["user_group"] = None

            cur.execute(insert_sql, row)

print("[+] 数据导入完成")