# Testing Assistant Suite

Spring Boot + PostgreSQL API バックエンドサーバーのローカル環境テストを支援する Web ツール。

## 🎯 主要機能

### 1. テストシナリオ管理 🆕

- テーブル定義、データ、モック API、テスト設定を統合管理
- シナリオの作成・編集・削除
- シナリオの適用（環境の自動セットアップ）
- JSON 形式でのエクスポート/インポート
- タグによる検索・分類
- API Test ページからシナリオを選択・適用
- テスト設定（Headers/Body）のデフォルト値管理

### 2. テーブル作成機能

- DDL ファイルの解析と自動テーブル作成
- FOREIGN KEY 依存関係の自動解決
- テーブル作成順序の最適化
- DDL 設定の JSON エクスポート/インポート

### 3. データ入力機能

- GUI/JSON でのテストデータ管理
- テーブルスキーマの自動取得
- データの CRUD 操作
- データの JSON エクスポート/インポート

### 4. モック API 機能

- 外部 API のモック化
- パスパラメータ対応 (`/users/:id`)
- レスポンスパラメータ埋め込み (`{{id}}`)
- リクエスト条件マッチング（クエリ、ヘッダー、ボディ）
- レスポンス遅延設定
- 優先度管理

### 5. API テスト機能

- Spring Boot API エンドポイントのテスト
- HTTP メソッド対応（GET/POST/PUT/DELETE/PATCH/HEAD/OPTIONS）
- カスタムヘッダー設定
- リクエストボディ編集
- レスポンス表示（ステータス、ヘッダー、ボディ）
- リクエスト履歴管理
- シナリオからの設定適用

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
- Docker & Docker Compose (PostgreSQL 用)

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

# API Proxy設定（オプション）
# 別のdev containerにアクセスする場合、コンテナ名を指定
# 例: TARGET_API_CONTAINER=my-spring-api
# 指定しない場合は host.docker.internal（ホストマシン）を使用
TARGET_API_CONTAINER=
```

#### フロントエンド (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 4. PostgreSQL の起動

```bash
docker-compose up -d
```

### 5. アプリケーションの起動

```bash
# フロントエンドとバックエンドを同時に起動
pnpm dev
```

- **フロントエンド**: http://localhost:3000
- **バックエンド API**: http://localhost:3001
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

### テストシナリオ作成（推奨ワークフロー） 🆕

1. トップページから「シナリオ」を開く
2. 「新規作成」ボタンをクリック
3. 基本情報を入力（名前、説明、タグ）
4. 対象 API を設定（HTTP メソッド、URL）
5. テスト設定でデフォルトの Headers/Body を設定
6. テーブル定義を追加（DDL）
7. テーブルデータを設定
8. 必要に応じてモック API を設定
9. 「作成」ボタンで保存
10. API Test ページでシナリオを選択して「適用」
11. テスト設定が自動入力されるので、必要に応じて変更して実行

### シナリオの適用とテスト実行

1. API Test ページを開く
2. シナリオドロップダウンから使用するシナリオを選択
3. 「適用」ボタンをクリック（テーブル作成、データ投入、モック設定が自動実行）
4. リクエストフォームにテスト設定が自動入力される
5. 必要に応じて Headers/Body を動的に変更
6. 「Send Request」でテスト実行

### テーブル作成（個別操作）

1. トップページから「テーブル管理」を開く
2. DDL テキストを入力またはファイルをアップロード
3. 「Parse DDL」で DDL を解析
4. 依存関係グラフを確認
5. 「Create Tables」でテーブルを作成

### データ入力（個別操作）

1. トップページから「データ入力」を開く
2. テーブルを選択
3. データグリッドでデータを追加・編集・削除
4. JSON 形式でのインポート/エクスポートも可能

### モック API 設定（個別操作）

1. トップページから「モック API」を開く
2. 「Create Endpoint」で新しいモックを作成
3. HTTP メソッド、パス、レスポンスを設定
4. パスパラメータ: `/users/:id`
5. レスポンス埋め込み: `{{id}}`
6. モック API の URL: `http://localhost:3001/api/mock/serve/your/path`

### API テスト（個別操作）

1. トップページから「API テスト」を開く
2. HTTP メソッドと URL を設定
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
├── package.json # ルートワークスペース
├── pnpm-workspace.yaml # pnpm ワークスペース設定
├── turbo.json # TurboRepo 設定
├── backend/ # Hono API サーバー
└── frontend/ # Next.js アプリケーション

````

## 📖 ドキュメント

- [API仕様書](docs/API.md)
- [トラブルシューティングガイド](docs/TROUBLESHOOTING.md) ⚠️
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
````

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

### シナリオ管理 🆕

- `GET /api/scenarios` - シナリオ一覧取得
- `GET /api/scenarios/:id` - シナリオ詳細取得
- `POST /api/scenarios` - シナリオ作成
- `PUT /api/scenarios/:id` - シナリオ更新
- `DELETE /api/scenarios/:id` - シナリオ削除
- `GET /api/scenarios/:id/export` - シナリオエクスポート
- `GET /api/scenarios/export/all` - 全シナリオエクスポート
- `POST /api/scenarios/import` - シナリオインポート
- `POST /api/scenarios/:id/apply` - シナリオ適用
- `GET /api/scenarios/search` - タグ検索

### テーブル管理

- `POST /api/tables/parse` - DDL 解析
- `POST /api/tables/create` - テーブル作成
- `GET /api/tables` - テーブル一覧
- `DELETE /api/tables` - 全テーブル削除
- `GET /api/tables/export` - DDL エクスポート

### データベース管理

- `GET /api/database/tables` - テーブル一覧取得
- `GET /api/database/schema/:tableName` - スキーマ取得
- `POST /api/database/query` - SQL クエリ実行

### モック API

- `GET /api/mock/endpoints` - エンドポイント一覧
- `POST /api/mock/endpoints` - エンドポイント作成
- `PUT /api/mock/endpoints/:id` - エンドポイント更新
- `DELETE /api/mock/endpoints/:id` - エンドポイント削除
- `GET /api/mock/export` - モック設定エクスポート
- `POST /api/mock/import` - モック設定インポート
- `ANY /api/mock/serve/*` - モックエンドポイント

### API プロキシ

- `POST /api/proxy/request` - リクエストプロキシ

詳細は [API 仕様書](./docs/API.md) を参照してください。

## ⚠️ トラブルシューティング

### API Test で 502 エラーが発生する場合

502 エラーは、テスト対象の API に接続できない場合に発生します。

**よくある原因:**

1. **URL が不正または到達不可能** - URL が正しいか、API が起動しているか確認
2. **dev container から localhost にアクセスできない** - `localhost`の代わりに`host.docker.internal`を使用
3. **ファイアウォールやネットワーク制限**

**詳細は [トラブルシューティングガイド](./docs/TROUBLESHOOTING.md) を参照してください。**

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

- [Hono](https://hono.dev/) - 高速 Web フレームワーク
- [Next.js](https://nextjs.org/) - React フレームワーク
- [shadcn/ui](https://ui.shadcn.com/) - UI コンポーネント
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
