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
- **データベース**: IndexedDB (Dexie.js)
- **パッケージマネージャー**: pnpm 9+
- **モノレポ**: TurboRepo
- **テスト**: vitest

## 📋 前提条件

- Node.js 22+
- pnpm 9+

## 🛠️ セットアップ

### クイックスタート

```bash
# 依存関係のインストール
pnpm install

# フロントエンドとバックエンドを同時に起動
pnpm dev
```

- フロントエンド: http://localhost:3000
- バックエンドAPI: http://localhost:3001

### 個別起動

```bash
# バックエンドのみ
cd backend
pnpm dev

# フロントエンドのみ
cd frontend
pnpm dev
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

## 🧪 テスト実行

```bash
# 全プロジェクトのテスト実行
pnpm test

# 個別実行
cd backend && pnpm test
cd frontend && pnpm test
```

## 🏗️ ビルド

```bash
# 全プロジェクトのビルド
pnpm build

# クリーン
pnpm clean
```

## 📝 ライセンス

MIT
