# PostgreSQL Test Helper

Spring Boot + PostgreSQL APIバックエンドサーバーのローカル環境テストを支援するWebツール。

## 🎯 主要機能

1. **テーブル作成機能**: DDL解析と依存関係解決による自動テーブル作成
2. **データ入力機能**: GUI/JSONでのテストデータ管理
3. **モックAPI機能**: 外部APIをモック化してテストの独立性を確保
4. **APIテスト機能**: Spring Boot APIのエンドポイントをテスト

## 🚀 技術スタック

- **フロントエンド**: Next.js 15 + TypeScript + React 19 + shadcn/ui
- **バックエンド**: Hono (最新) + Node.js 22 + TypeScript
- **データベース**: PostgreSQL 16+
- **パッケージマネージャー**: pnpm 9+
- **テスト**: vitest

## 📋 前提条件

- Node.js 22+
- pnpm 9+
- Docker & Docker Compose

## 🛠️ セットアップ

### 1. PostgreSQL起動

```bash
docker-compose up -d
```

### 2. バックエンドセットアップ

```bash
cd backend
pnpm install
pnpm dev
# http://localhost:3001 で起動
```

### 3. フロントエンドセットアップ

```bash
cd frontend
pnpm install
pnpm dev
# http://localhost:3000 で起動
```

## 📁 プロジェクト構造

```
postgres-test-helper/
├── README.md
├── PROJECT_PLAN.md
├── docker-compose.yml
├── backend/          # Hono APIサーバー
└── frontend/         # Next.js アプリケーション
```

## 📖 ドキュメント

- [プロジェクト実装計画](PROJECT_PLAN.md)
- [開発インストラクション](.github/instructions/DEVELOPMENT_INSTRUCTION.md.instructions.md)

## 🧪 テスト実行

```bash
# バックエンドテスト
cd backend
pnpm test

# フロントエンドテスト
cd frontend
pnpm test
```

## 📝 ライセンス

MIT
