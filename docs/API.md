# API仕様書

PostgreSQL Test Helper バックエンドAPIの仕様書

## ベースURL

```
http://localhost:3001
```

## 共通レスポンス形式

### 成功レスポンス
```json
{
  "success": true,
  "data": {},
  "message": "optional message"
}
```

### エラーレスポンス
```json
{
  "success": false,
  "error": "Error type",
  "message": "Error message",
  "details": []
}
```

---

## ヘルスチェック

### GET /health

サーバーの稼働状態を確認します。

**レスポンス**
```json
{
  "status": "ok",
  "message": "PostgreSQL Test Helper API is running",
  "timestamp": "2025-11-14T06:00:00.000Z"
}
```

---

## テーブル管理API

### POST /api/tables/parse

DDL文を解析してテーブル定義を取得します。

**リクエストボディ**
```json
{
  "ddl": "CREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(100));"
}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "tables": [
      {
        "name": "users",
        "ddl": "CREATE TABLE users ...",
        "dependencies": [],
        "order": 0
      }
    ]
  }
}
```

### POST /api/tables/create

解析済みDDLからテーブルを作成します。

**リクエストボディ**
```json
{
  "tables": [
    {
      "name": "users",
      "ddl": "CREATE TABLE users ...",
      "dependencies": [],
      "order": 0
    }
  ]
}
```

**レスポンス**
```json
{
  "success": true,
  "message": "Tables created successfully",
  "created": ["users"]
}
```

### GET /api/tables

作成済みテーブル一覧を取得します。

**レスポンス**
```json
{
  "success": true,
  "data": {
    "tables": ["users", "posts", "comments"]
  }
}
```

### DELETE /api/tables

すべてのテーブルを削除します（依存関係を考慮）。

**レスポンス**
```json
{
  "success": true,
  "message": "All tables dropped successfully",
  "dropped": ["comments", "posts", "users"]
}
```

### GET /api/tables/export

DDL設定をJSONでエクスポートします。

**レスポンス**
```json
{
  "success": true,
  "data": {
    "tables": [...]
  },
  "exportedAt": "2025-11-14T06:00:00.000Z"
}
```

---

## データベース管理API

### GET /api/database/tables

データベース内のテーブル一覧を取得します。

**レスポンス**
```json
{
  "success": true,
  "tables": ["users", "posts"]
}
```

### GET /api/database/schema/:tableName

指定したテーブルのスキーマ情報を取得します。

**パラメータ**
- `tableName`: テーブル名

**レスポンス**
```json
{
  "success": true,
  "schema": {
    "tableName": "users",
    "columns": [
      {
        "name": "id",
        "type": "integer",
        "nullable": false,
        "default": "nextval('users_id_seq'::regclass)"
      }
    ]
  }
}
```

### POST /api/database/query

SQLクエリを実行します。

**リクエストボディ**
```json
{
  "query": "SELECT * FROM users LIMIT 10"
}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "rows": [...],
    "rowCount": 10
  }
}
```

---

## モックAPI

### GET /api/mock/endpoints

すべてのモックエンドポイントを取得します。

**レスポンス**
```json
{
  "success": true,
  "data": [
    {
      "id": "mock_123",
      "name": "Get User Mock",
      "enabled": true,
      "priority": 0,
      "method": "GET",
      "path": "/api/users/:id",
      "response": {
        "status": 200,
        "body": {"id": "{{id}}"},
        "delay": 0
      },
      "createdAt": "2025-11-14T06:00:00.000Z",
      "updatedAt": "2025-11-14T06:00:00.000Z"
    }
  ],
  "count": 1
}
```

### POST /api/mock/endpoints

新しいモックエンドポイントを作成します。

**リクエストボディ**
```json
{
  "name": "Get User Mock",
  "enabled": true,
  "priority": 0,
  "method": "GET",
  "path": "/api/users/:id",
  "requestMatch": {
    "query": {"status": "active"},
    "headers": {"Authorization": "Bearer token"},
    "body": {"type": "user"}
  },
  "response": {
    "status": 200,
    "headers": {"Content-Type": "application/json"},
    "body": {"id": "{{id}}", "name": "Test User"},
    "delay": 500
  }
}
```

**レスポンス**
```json
{
  "success": true,
  "data": {...},
  "message": "Mock endpoint created successfully"
}
```

### PUT /api/mock/endpoints/:id

モックエンドポイントを更新します。

**パラメータ**
- `id`: モックエンドポイントID

**リクエストボディ**
```json
{
  "enabled": false,
  "priority": 10
}
```

**レスポンス**
```json
{
  "success": true,
  "data": {...},
  "message": "Mock endpoint updated successfully"
}
```

### DELETE /api/mock/endpoints/:id

指定したモックエンドポイントを削除します。

**パラメータ**
- `id`: モックエンドポイントID

**レスポンス**
```json
{
  "success": true,
  "message": "Mock endpoint deleted successfully"
}
```

### DELETE /api/mock/endpoints

すべてのモックエンドポイントを削除します。

**レスポンス**
```json
{
  "success": true,
  "message": "All mock endpoints deleted successfully"
}
```

### GET /api/mock/export

モック設定をエクスポートします。

**レスポンス**
```json
{
  "success": true,
  "data": [...],
  "exportedAt": "2025-11-14T06:00:00.000Z"
}
```

### POST /api/mock/import

モック設定をインポートします。

**リクエストボディ**
```json
[
  {
    "id": "mock_123",
    "name": "Get User Mock",
    ...
  }
]
```

**レスポンス**
```json
{
  "success": true,
  "message": "Successfully imported 10 mock endpoints",
  "count": 10
}
```

### ANY /api/mock/serve/*

モックエンドポイントとして動作します。

**例**
```bash
# モック作成: GET /api/users/:id -> {"id": "{{id}}"}
# アクセス
GET http://localhost:3001/api/mock/serve/api/users/123

# レスポンス
{
  "id": "123",
  "name": "Test User 123"
}
```

---

## APIプロキシ

### POST /api/proxy/request

外部APIへのリクエストをプロキシします。

**リクエストボディ**
```json
{
  "method": "GET",
  "url": "http://localhost:8080/api/users",
  "headers": {
    "Authorization": "Bearer token",
    "Content-Type": "application/json"
  },
  "body": {"key": "value"},
  "timeout": 30000
}
```

**レスポンス (成功)**
```json
{
  "success": true,
  "response": {
    "status": 200,
    "statusText": "OK",
    "headers": {"content-type": "application/json"},
    "body": {...},
    "duration": 150,
    "timestamp": "2025-11-14T06:00:00.000Z"
  }
}
```

**レスポンス (エラー)**
```json
{
  "success": false,
  "error": "Request timeout",
  "message": "Request timed out after 30000ms",
  "duration": 30001,
  "timestamp": "2025-11-14T06:00:00.000Z"
}
```

---

## エラーコード

| ステータスコード | 説明 |
|---------|------|
| 200 | 成功 |
| 201 | 作成成功 |
| 400 | バリデーションエラー |
| 404 | リソースが見つからない |
| 408 | リクエストタイムアウト |
| 500 | サーバーエラー |
| 502 | ネットワークエラー |

## 認証

現在、認証は実装されていません。ローカル開発環境での使用を想定しています。
