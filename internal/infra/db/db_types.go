package db

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
)

type JSONMap map[string]string

// Scan 给 JSONMap 类型增加 sql.Scanner 接口.
// 支持 json / jsonb / text → JSONMap; 调整后 JSONMap 将可扫
func (m *JSONMap) Scan(src any) error {
	if src == nil {
		*m = nil
		return nil
	}

	var data []byte

	switch v := src.(type) {
	case []byte:
		data = v
	case string:
		data = []byte(v)
	default:
		return fmt.Errorf("JSONMap: unsupported Scan source type: %T", src)
	}

	if len(data) == 0 {
		*m = JSONMap{}
		return nil
	}

	return json.Unmarshal(data, m)
}

// Value  给 JSONMap 类型增加 driver.Valuer 接口.
// 支持 JSONMap → json / jsonb
func (m JSONMap) Value() (driver.Value, error) {
	if m == nil {
		return nil, nil
	}
	return json.Marshal(m)
}
