# PostgreSQL Test Helper

Spring Boot + PostgreSQL APIバックエンドサーバーのローカル環境テストを支援するWebツール。

## 🎯 主要機能

### 1. テーブル作成機能
- DDLファイルの解析と自動テーブル作成
- FOREIGN KEY依存関係の自動解決
- テーブル作成順序の最適化
- DDL設定のJSON エクスポート/インポート

### 2. データ入力機能
- GUI/JSONでのテストデータ管理
- テーブルスキーマの自動取得
- データのCRUD操作
- データのJSON エクスポート/インポート

### 3. モックAPI機能
- 外部APIのモック化
- パスパラメータ対応 (`/users/:id`)
- レスポンスパラメータ埋め込み (`{{id}}`)
- リクエスト条件マッチング（クエリ、ヘッダー、ボディ）
- レスポンス遅延設定
- 優先度管理

### 4. APIテスト機能
- Spring Boot APIエンドポイントのテスト
- HTTPメソッド対応（GET/POST/PUT/DELETE/PATCH/HEAD/OPTIONS）
- カスタムヘッダー設定
- リクエストボディ編集
- レスポンス表示（ステータス、ヘッダー、ボディ）
- リクエスト履歴管理

## 🚀 技術スタック

- **フロントエンド**: Next.js 15 + TypeScript + React 19 + shadcn/ui + Tailwind CSS
- **バックエンド**: Hono + Node.js 22 + TypeScript
- **データベース**: PostgreSQL 16+ (Docker)
- **パッケージマネージャー**: pnpm 9+
- **モノレポ**: TurboRepo
- **テスト**: vitest
- **バリデーション**: Zod

## 📋 前提条件

- Node.js 22+
- pnpm 9+
- Docker & Docker Compose (PostgreSQL用)

## 🛠️ セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/hakkuns/test-tool.git
cd test-tool
```

### 2. 依存関係のインストール

```bash
pnpm install
```

### 3. 環境変数の設定

#### バックエンド (`backend/.env`)
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/testdb
PORT=3001
```

#### フロントエンド (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 4. PostgreSQLの起動

```bash
docker-compose up -d
```

### 5. アプリケーションの起動

```bash
# フロントエンドとバックエンドを同時に起動
pnpm dev
```

- **フロントエンド**: http://localhost:3000
- **バックエンドAPI**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

### 個別起動

```bash
# バックエンドのみ
cd backend
pnpm dev

# フロントエンドのみ
cd frontend
pnpm dev
```

## 📖 使い方

### テーブル作成

1. トップページから「テーブル管理」を開く
2. DDLテキストを入力またはファイルをアップロード
3. 「Parse DDL」でDDLを解析
4. 依存関係グラフを確認
5. 「Create Tables」でテーブルを作成

### データ入力

1. トップページから「データ入力」を開く
2. テーブルを選択
3. データグリッドでデータを追加・編集・削除
4. JSON形式でのインポート/エクスポートも可能

### モックAPI設定

1. トップページから「モックAPI」を開く
2. 「Create Endpoint」で新しいモックを作成
3. HTTPメソッド、パス、レスポンスを設定
4. パスパラメータ: `/users/:id`
5. レスポンス埋め込み: `{{id}}`
6. モックAPIのURL: `http://localhost:3001/api/mock/serve/your/path`

### APIテスト

1. トップページから「APIテスト」を開く
2. HTTPメソッドとURLを設定
3. ヘッダーやリクエストボディを編集
4. 「Send Request」でリクエスト送信
5. レスポンスを確認
6. 履歴から過去のリクエストを再実行可能
```

## 📁 プロジェクト構造

```
postgres-test-helper/
├── README.md
├── PROJECT_PLAN.md
├── package.json          # ルートワークスペース
├── pnpm-workspace.yaml   # pnpmワークスペース設定
├── turbo.json            # TurboRepo設定
├── backend/              # Hono APIサーバー
└── frontend/             # Next.js アプリケーション
```

## 📖 ドキュメント

- [プロジェクト実装計画](PROJECT_PLAN.md)
- [開発インストラクション](.github/instructions/DEVELOPMENT_INSTRUCTION.md.instructions.md)


## 🧪 テスト

```bash
# 全テスト実行
pnpm test

# バックエンドのみ
cd backend
pnpm test

# フロントエンドのみ
cd frontend
pnpm test

# カバレッジ付き
pnpm test:coverage
```

## 📁 プロジェクト構造

```
test-tool/
├── backend/                 # Honoバックエンド
│   ├── src/
│   │   ├── routes/         # APIルート
│   │   ├── services/       # ビジネスロジック
│   │   ├── db/            # データベース接続
│   │   ├── types/         # 型定義
│   │   └── __tests__/     # テスト
│   └── package.json
├── frontend/               # Next.jsフロントエンド
│   ├── src/
│   │   ├── app/           # ページ
│   │   ├── components/    # Reactコンポーネント
│   │   ├── lib/           # ユーティリティ
│   │   └── test/          # テスト
│   └── package.json
├── docker-compose.yml      # PostgreSQL設定
├── turbo.json             # TurboRepo設定
└── README.md

```

## 🔌 API エンドポイント

### テーブル管理
- `POST /api/tables/parse` - DDL解析
- `POST /api/tables/create` - テーブル作成
- `GET /api/tables` - テーブル一覧
- `DELETE /api/tables` - 全テーブル削除
- `GET /api/tables/export` - DDLエクスポート

### データベース管理
- `GET /api/database/tables` - テーブル一覧取得
- `GET /api/database/schema/:tableName` - スキーマ取得
- `POST /api/database/query` - SQLクエリ実行

### モックAPI
- `GET /api/mock/endpoints` - エンドポイント一覧
- `POST /api/mock/endpoints` - エンドポイント作成
- `PUT /api/mock/endpoints/:id` - エンドポイント更新
- `DELETE /api/mock/endpoints/:id` - エンドポイント削除
- `GET /api/mock/export` - モック設定エクスポート
- `POST /api/mock/import` - モック設定インポート
- `ANY /api/mock/serve/*` - モックエンドポイント

### APIプロキシ
- `POST /api/proxy/request` - リクエストプロキシ

詳細は [API仕様書](./docs/API.md) を参照してください。

## 🤝 コントリビューション

プルリクエストを歓迎します！

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'feat: add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📝 ライセンス

MIT License

## 👨‍💻 作者

hakkuns

## 🙏 謝辞

- [Hono](https://hono.dev/) - 高速Webフレームワーク
- [Next.js](https://nextjs.org/) - Reactフレームワーク
- [shadcn/ui](https://ui.shadcn.com/) - UIコンポーネント
- [TurboRepo](https://turbo.build/) - モノレポツール
## 🏗️ ビルド

```bash
# 全プロジェクトのビルド
pnpm build

# クリーン
pnpm clean
```

## 📝 ライセンス

MIT
