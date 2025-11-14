# PostgreSQL Test Helper - 開発インストラクション

## 📋 プロジェクト概要

Spring Boot + PostgreSQL APIバックエンドサーバーのローカル環境テストを支援するWebツール。

### 目的
- PostgreSQLテーブルの迅速なセットアップ
- テストデータの柔軟な管理
- 外部APIのモック化によるテストの独立性確保
- Spring Boot APIの簡単なテスト実行

### 技術スタック
- **フロントエンド**: Next.js 15 + TypeScript + React 19 + shadcn/ui
- **バックエンド**: Hono (最新) + Node.js 22 + TypeScript
- **データベース**: PostgreSQL 16+
- **パッケージマネージャー**: pnpm 9+
- **開発環境**: Docker (PostgreSQL用)

---

## 🏗️ システムアーキテクチャ

```
┌─────────────────────────────────────────────────┐
│           Next.js Frontend (Port: 3000)         │
│  ┌──────────┬──────────┬──────────┬──────────┐ │
│  │テーブル  │データ    │モックAPI │APIテスト  │ │
│  │管理      │入力      │設定      │クライアント│ │
│  └──────────┴──────────┴──────────┴──────────┘ │
│  LocalStorage (DDL/Data/Mock/Request履歴)       │
└─────────────────┬───────────────────────────────┘
                  │ REST API (JSON)
┌─────────────────▼───────────────────────────────┐
│         Hono Backend API (Port: 3001)           │
│  ┌──────────┬──────────┬──────────┬──────────┐ │
│  │DDL解析   │データCRUD│モック管理│APIプロキシ│ │
│  │依存関係  │JSON変換  │動的ルート│リクエスト │ │
│  │解決      │          │          │転送      │ │
│  └──────────┴──────────┴──────────┴──────────┘ │
└─────────┬───────────────────────────┬───────────┘
          │ pg driver                 │ HTTP Request
┌─────────▼───────────────┐   ┌──────▼──────────┐
│PostgreSQL (Port: 5432)  │   │  Spring Boot    │
│テストデータベース        │   │  (Port: 8080)   │
└─────────────────────────┘   └─────────────────┘

[APIテスト機能] ──> [Honoプロキシ] ──> [Spring Boot API]
                                          ↓
                                      [PostgreSQL]
```

---

## 📁 プロジェクトディレクトリ構成

```
postgres-test-helper/
├── README.md
├── DEVELOPMENT_INSTRUCTIONS.md  # このファイル
├── docker-compose.yml
├── .gitignore
│
├── frontend/                    # Next.js アプリケーション
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── components.json         # shadcn/ui設定
│   ├── .env.local
│   │
│   └── src/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx           # ダッシュボード
│       │   ├── tables/
│       │   │   └── page.tsx       # テーブル管理画面
│       │   ├── data/
│       │   │   └── page.tsx       # データ入力画面
│       │   ├── mock/
│       │   │   └── page.tsx       # モックAPI管理画面
│       │   └── api-test/
│       │       └── page.tsx       # APIテスト画面
│       │
│       ├── components/
│       │   ├── ui/                # shadcn/uiコンポーネント
│       │   │   ├── button.tsx
│       │   │   ├── input.tsx
│       │   │   ├── table.tsx
│       │   │   ├── card.tsx
│       │   │   ├── dialog.tsx
│       │   │   ├── dropdown-menu.tsx
│       │   │   ├── tabs.tsx
│       │   │   ├── toast.tsx
│       │   │   ├── form.tsx
│       │   │   ├── select.tsx
│       │   │   ├── textarea.tsx
│       │   │   ├── badge.tsx
│       │   │   ├── alert.tsx
│       │   │   └── scroll-area.tsx
│       │   ├── layout/
│       │   │   ├── Header.tsx
│       │   │   └── Sidebar.tsx
│       │   ├── tables/
│       │   │   ├── DDLUploader.tsx
│       │   │   ├── TableList.tsx
│       │   │   └── DependencyGraph.tsx
│       │   ├── data/
│       │   │   ├── TableSelector.tsx
│       │   │   ├── DataGrid.tsx
│       │   │   └── JsonEditor.tsx
│       │   ├── mock/
│       │   │   ├── EndpointList.tsx
│       │   │   ├── EndpointEditor.tsx
│       │   │   └── ResponsePreview.tsx
│       │   └── api-test/
│       │       ├── RequestForm.tsx
│       │       ├── ResponseViewer.tsx
│       │       ├── RequestHistory.tsx
│       │       └── HeaderEditor.tsx
│       │
│       ├── lib/
│       │   ├── api.ts             # API呼び出し関数
│       │   ├── storage.ts         # LocalStorage管理
│       │   ├── utils.ts           # shadcn/ui utilities
│       │   └── cn.ts              # classnames utility
│       │
│       └── types/
│           └── index.ts           # 型定義
│
├── backend/                       # Hono API サーバー
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env
│   │
│   └── src/
│       ├── index.ts               # エントリーポイント
│       │
│       ├── routes/
│       │   ├── tables.ts          # テーブル管理API
│       │   ├── data.ts            # データ操作API
│       │   ├── mock.ts            # モックAPI
│       │   └── proxy.ts           # APIプロキシ
│       │
│       ├── services/
│       │   ├── ddlParser.ts       # DDL解析
│       │   ├── dependencyResolver.ts  # 依存関係解決
│       │   ├── dbService.ts       # DB操作
│       │   └── mockService.ts     # モック管理
│       │
│       ├── utils/
│       │   ├── database.ts        # DB接続・プール
│       │   ├── logger.ts
│       │   └── validator.ts
│       │
│       └── types/
│           └── index.ts           # 型定義
│
└── docs/                          # ドキュメント
    ├── API.md                     # API仕様書
    ├── SETUP.md                   # セットアップガイド
    └── ARCHITECTURE.md            # アーキテクチャ詳細
```

---

## 🚀 セットアップ手順

### クイックスタート（ゼロから構築）

```bash
# 1. プロジェクトルート作成
mkdir postgres-test-helper
cd postgres-test-helper

# 2. Docker Compose設定
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    container_name: postgres-test-helper
    environment:
      POSTGRES_DB: testdb
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
EOF

# 3. PostgreSQL起動
docker-compose up -d

# 4. バックエンドプロジェクト作成
mkdir backend
cd backend
pnpm init

# package.json編集（上記の内容を参照）
# tsconfig.json作成
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
EOF

# 依存関係インストール
pnpm add hono @hono/node-server pg zod dotenv
pnpm add -D @types/node @types/pg tsx typescript

# .env作成
cat > .env << 'EOF'
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/testdb
NODE_ENV=development
EOF

# srcディレクトリ作成
mkdir -p src/{routes,services,utils,types}

cd ..

# 5. フロントエンドプロジェクト作成
pnpm create next-app@latest frontend --typescript --tailwind --app --src-dir --import-alias "@/*"

cd frontend

# shadcn/ui初期化
pnpm dlx shadcn@latest init

# shadcn/uiコンポーネントのインストール
pnpm dlx shadcn@latest add button input table card dialog dropdown-menu tabs toast form select textarea badge alert

# 追加の依存関係
pnpm add @tanstack/react-query @tanstack/react-table axios react-hook-form @hookform/resolvers zod

# .env.local作成
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF

cd ..

echo "✅ セットアップ完了！"
echo "Backend: cd backend && pnpm dev"
echo "Frontend: cd frontend && pnpm dev"
```

### 前提条件
- Node.js 22+ インストール済み
- pnpm 9+ インストール済み (`npm install -g pnpm`)
- Docker & Docker Compose インストール済み

### 1. PostgreSQL起動

```bash
# docker-compose.ymlが既にある場合
docker-compose up -d

# 確認
docker ps
```

### 2. バックエンドセットアップ

```bash
cd backend
pnpm install

# .envファイルが無ければ作成
cp .env.example .env  # または手動で作成

# 開発サーバー起動
pnpm dev
# http://localhost:3001 で起動
```

### 3. フロントエンドセットアップ

```bash
cd frontend
pnpm install

# .env.localファイルが無ければ作成
cp .env.local.example .env.local  # または手動で作成

# 開発サーバー起動
pnpm dev
# http://localhost:3000 で起動
```

### 4. アクセス
- フロントエンド: http://localhost:3000
- バックエンドAPI: http://localhost:3001
- PostgreSQL: localhost:5432

---

## 🎯 機能仕様詳細

### 1. テーブル作成機能

#### 機能要件
1. **DDLファイルアップロード**
   - 複数の.sqlファイルを同時アップロード可能
   - ドラッグ&ドロップ対応
   - テキスト直接入力にも対応

2. **DDL解析**
   - CREATE TABLE文のパース
   - 外部キー制約の抽出
   - テーブル依存関係の構築

3. **依存関係解決**
   - トポロジカルソートによる作成順序決定
   - 循環参照の検出とエラー表示
   - 依存関係グラフの可視化

4. **テーブル作成実行**
   - 依存順に自動実行
   - エラー時のロールバック
   - 実行ログの表示

5. **DDLエクスポート**
   - 全テーブルのDDLをJSON形式でダウンロード
   - 作成順序情報も含む

6. **LocalStorage保存**
   - DDL情報の自動保存
   - 次回起動時の自動ロード
   - 手動での編集・更新も可能

7. **全テーブル削除**
   - 依存関係を考慮した逆順削除
   - 確認ダイアログ表示

#### データ構造

```typescript
interface DDLTable {
  name: string;
  ddl: string;
  dependencies: string[];  // 依存する他テーブル名
  order: number;           // 作成順序
}

interface DDLData {
  tables: DDLTable[];
  timestamp: string;
  version: string;
}
```

#### API エンドポイント

```typescript
// DDL解析
POST /api/tables/parse
Request: { ddlFiles: string[] }
Response: { 
  tables: DDLTable[], 
  dependencies: Record<string, string[]>,
  order: string[]
}

// テーブル作成
POST /api/tables/create
Request: { tables: DDLTable[] }
Response: { 
  success: boolean, 
  created: string[], 
  errors: Array<{table: string, error: string}>
}

// テーブル一覧取得
GET /api/tables
Response: { tables: Array<{name: string, columns: ColumnInfo[]}> }

// DDL JSONエクスポート
GET /api/tables/export
Response: DDLData (JSON file download)

// 全テーブル削除
DELETE /api/tables
Response: { deleted: string[] }
```

#### 実装のポイント

**DDLパーサー (ddlParser.ts)**
```typescript
// 正規表現でCREATE TABLE文を解析
// - テーブル名抽出
// - カラム定義抽出
// - 制約抽出（PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK）
// - REFERENCES句から依存テーブル抽出
```

**依存関係解決 (dependencyResolver.ts)**
```typescript
// トポロジカルソート実装
// 1. 依存がないテーブルを Queue に追加
// 2. Queue から取り出して作成順リストに追加
// 3. そのテーブルに依存していたテーブルの依存カウントを減らす
// 4. 依存カウントが0になったテーブルを Queue に追加
// 5. すべてのテーブルが処理されるまで繰り返し
// 6. 処理されなかったテーブルがあれば循環参照エラー
```

---

### 2. テーブルデータ入力機能

#### 機能要件

1. **テーブル選択**
   - 作成済みテーブルのドロップダウンリスト
   - テーブル構造（カラム情報）の自動取得・表示

2. **データグリッド表示**
   - インタラクティブなテーブル形式
   - インライン編集機能
   - ページネーション
   - ソート機能

3. **CRUD操作**
   - 新規行追加
   - 既存行編集
   - 行削除（単一・複数）
   - 一括操作

4. **JSONモード**
   - JSON形式での直接編集
   - シンタックスハイライト
   - バリデーション

5. **データインポート/エクスポート**
   - JSON形式でのダウンロード
   - JSON形式でのアップロード
   - CSV対応（オプション）

6. **バリデーション**
   - データ型チェック
   - NOT NULL制約チェック
   - 外部キー整合性チェック

#### データ構造

```typescript
interface TableData {
  tableName: string;
  columns: ColumnInfo[];
  rows: Record<string, any>[];
}

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  references?: {
    table: string;
    column: string;
  };
}
```

#### API エンドポイント

```typescript
// テーブル構造取得
GET /api/data/:tableName/schema
Response: { columns: ColumnInfo[] }

// データ取得
GET /api/data/:tableName?page=1&limit=50
Response: { 
  data: Record<string, any>[], 
  total: number,
  page: number,
  limit: number
}

// データ挿入
POST /api/data/:tableName
Request: { data: Record<string, any> | Record<string, any>[] }
Response: { inserted: number, ids: any[] }

// データ更新
PUT /api/data/:tableName/:id
Request: { data: Record<string, any> }
Response: { updated: boolean }

// データ削除
DELETE /api/data/:tableName/:id
Response: { deleted: boolean }

// データエクスポート
GET /api/data/:tableName/export
Response: TableData (JSON file download)

// データインポート
POST /api/data/:tableName/import
Request: { data: Record<string, any>[] }
Response: { imported: number, errors: any[] }
```

#### UI実装のポイント

```typescript
// shadcn/ui コンポーネントを使用したデータグリッド例
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// TanStack Tableと組み合わせ
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table'

function DataGrid({ tableName, columns, data }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })
  
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// フォーム実装例
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

function DataEditForm({ onSubmit }) {
  const form = useForm({
    resolver: zodResolver(schema),
  })
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="fieldName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Field Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

---

### 3. モックAPI作成機能

#### 機能要件

1. **エンドポイント登録**
   - HTTPメソッド選択（GET/POST/PUT/DELETE/PATCH）
   - パス入力（パスパラメータ対応: `/api/users/:id`）
   - レスポンス設定
     - ステータスコード
     - レスポンスボディ（JSON）
     - レスポンスヘッダー
     - 遅延時間（ms）

2. **リクエストマッチング条件**（オプション）
   - リクエストボディの条件
   - クエリパラメータの条件
   - ヘッダーの条件
   - 複数パターンの登録

3. **動的パラメータ**
   - パスパラメータの抽出と埋め込み
   - クエリパラメータの利用
   - テンプレート変数

4. **モックエンドポイント管理**
   - 一覧表示
   - 編集・削除
   - 有効/無効の切り替え
   - 優先順位設定

5. **設定エクスポート/インポート**
   - JSON形式でのダウンロード
   - JSON形式でのアップロード
   - LocalStorageへの自動保存

6. **リクエストログ**（オプション）
   - 実際に受けたリクエストの記録
   - マッチしたモックの表示
   - デバッグ支援

#### データ構造

```typescript
interface MockEndpoint {
  id: string;
  name?: string;              // わかりやすい名前
  enabled: boolean;
  priority: number;           // マッチング優先度
  
  // リクエスト定義
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;               // /api/users/:id
  
  // マッチング条件（オプション）
  requestMatch?: {
    query?: Record<string, string>;
    body?: any;
    headers?: Record<string, string>;
  };
  
  // レスポンス定義
  response: {
    status: number;
    headers?: Record<string, string>;
    body: any;
    delay?: number;           // ms
  };
  
  // メタデータ
  createdAt: string;
  updatedAt: string;
}

interface MockConfig {
  endpoints: MockEndpoint[];
  version: string;
}
```

#### API エンドポイント

```typescript
// モックエンドポイント一覧取得
GET /api/mock/endpoints
Response: { endpoints: MockEndpoint[] }

// モックエンドポイント作成
POST /api/mock/endpoints
Request: Omit<MockEndpoint, 'id' | 'createdAt' | 'updatedAt'>
Response: { endpoint: MockEndpoint, mockUrl: string }

// モックエンドポイント更新
PUT /api/mock/endpoints/:id
Request: Partial<MockEndpoint>
Response: { endpoint: MockEndpoint }

// モックエンドポイント削除
DELETE /api/mock/endpoints/:id
Response: { deleted: boolean }

// 設定エクスポート
GET /api/mock/export
Response: MockConfig (JSON file download)

// 設定インポート
POST /api/mock/import
Request: MockConfig
Response: { imported: number }

// ========================================
// 実際のモックエンドポイント（動的生成）
// ========================================
ANY /mock/*
// 例: GET /mock/api/users/123
// 登録されたモックからマッチするものを検索して返す
```

#### 実装の核心部分

**モックマッチング (mockService.ts)**

```typescript
function findMatchingMock(
  path: string,
  method: string,
  query: Record<string, string>,
  body: any,
  headers: Record<string, string>,
  endpoints: MockEndpoint[]
): { mock: MockEndpoint; params: Record<string, string> } | null {
  
  // 優先度順にソート
  const sortedEndpoints = endpoints
    .filter(e => e.enabled)
    .sort((a, b) => b.priority - a.priority);
  
  for (const endpoint of sortedEndpoints) {
    // メソッドチェック
    if (endpoint.method !== method) continue;
    
    // パスパターンマッチング
    const pathMatch = matchPathPattern(endpoint.path, path);
    if (!pathMatch.matches) continue;
    
    // リクエスト条件チェック
    if (endpoint.requestMatch) {
      if (endpoint.requestMatch.query && 
          !matchObject(endpoint.requestMatch.query, query)) {
        continue;
      }
      if (endpoint.requestMatch.body && 
          !matchObject(endpoint.requestMatch.body, body)) {
        continue;
      }
      if (endpoint.requestMatch.headers && 
          !matchHeaders(endpoint.requestMatch.headers, headers)) {
        continue;
      }
    }
    
    // マッチした！
    return { mock: endpoint, params: pathMatch.params };
  }
  
  return null;
}

// パスパターンマッチング
// /api/users/:id が /api/users/123 にマッチするか判定
function matchPathPattern(pattern: string, path: string): {
  matches: boolean;
  params: Record<string, string>;
} {
  const patternParts = pattern.split('/');
  const pathParts = path.split('/');
  
  if (patternParts.length !== pathParts.length) {
    return { matches: false, params: {} };
  }
  
  const params: Record<string, string> = {};
  
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      // パスパラメータ
      const paramName = patternParts[i].slice(1);
      params[paramName] = pathParts[i];
    } else if (patternParts[i] !== pathParts[i]) {
      return { matches: false, params: {} };
    }
  }
  
  return { matches: true, params };
}
```

**動的ルーティング (routes/mock.ts)**

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { findMatchingMock, interpolateResponse } from '../services/mockService';

const mockRouter = new Hono();

// CORS有効化（Spring Bootからのアクセス対応）
mockRouter.use('/mock/*', cors());

// 全HTTPメソッドをキャッチ
mockRouter.all('/mock/*', async (c) => {
  const originalPath = c.req.path.replace('/mock', '');
  const method = c.req.method;
  const query = Object.fromEntries(new URL(c.req.url).searchParams);
  const body = await c.req.json().catch(() => null);
  const headers = Object.fromEntries(c.req.raw.headers);
  
  // モック検索
  const endpoints = await getEnabledMockEndpoints(); // DB or メモリ
  const match = findMatchingMock(originalPath, method, query, body, headers, endpoints);
  
  if (!match) {
    return c.json({ 
      error: 'No matching mock endpoint found',
      path: originalPath,
      method 
    }, 404);
  }
  
  // レスポンス生成
  const { mock, params } = match;
  
  // 遅延
  if (mock.response.delay) {
    await new Promise(resolve => setTimeout(resolve, mock.response.delay));
  }
  
  // パラメータ埋め込み
  const responseBody = interpolateResponse(mock.response.body, params, query);
  
  // ヘッダー設定
  if (mock.response.headers) {
    Object.entries(mock.response.headers).forEach(([key, value]) => {
      c.header(key, value);
    });
  }
  
  return c.json(responseBody, mock.response.status);
});

export default mockRouter;
```

**バックエンドのindex.ts**

```typescript
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import tablesRouter from './routes/tables'
import dataRouter from './routes/data'
import mockRouter from './routes/mock'
import proxyRouter from './routes/proxy'

const app = new Hono()

// CORS設定
app.use('/*', cors({
  origin: ['http://localhost:3000'],
  credentials: true,
}))

// ルート登録
app.route('/api/tables', tablesRouter)
app.route('/api/data', dataRouter)
app.route('/api/mock', mockRouter)
app.route('/api/proxy', proxyRouter)

// ヘルスチェック
app.get('/health', (c) => c.json({ status: 'ok' }))

const port = Number(process.env.PORT) || 3001
console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})
```

---

### 4. APIテスト機能（Spring Boot API クライアント）

#### 機能要件

1. **リクエスト送信**
   - HTTPメソッド選択（GET/POST/PUT/DELETE/PATCH）
   - URL入力（Spring BootのエンドポイントURL）
   - リクエストヘッダー設定
   - リクエストボディ入力（JSON形式）
   - クエリパラメータ設定

2. **レスポンス表示**
   - HTTPステータスコード表示
   - レスポンスヘッダー表示
   - レスポンスボディ表示（JSON整形）
   - レスポンス時間表示
   - エラー表示

3. **リクエスト履歴**
   - 送信したリクエストの履歴保存
   - 履歴からのリクエスト再実行
   - 履歴の検索・フィルタリング
   - LocalStorageへの保存

4. **環境設定**
   - ベースURL設定（デフォルト: http://localhost:8080）
   - タイムアウト設定
   - 共通ヘッダー設定（認証トークンなど）

5. **エクスポート/インポート**
   - リクエストコレクションのJSON保存
   - Postmanライクなコレクション管理

#### データ構造

```typescript
interface ApiRequest {
  id: string;
  name?: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  body?: string; // JSON string
  createdAt: string;
}

interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  duration: number; // ms
  timestamp: string;
}

interface RequestHistoryItem {
  request: ApiRequest;
  response?: ApiResponse;
  error?: string;
}

interface Environment {
  name: string;
  baseUrl: string;
  timeout: number;
  commonHeaders: Record<string, string>;
}
```

#### API エンドポイント

```typescript
// プロキシ経由でSpring Boot APIにリクエスト
POST /api/proxy/request
Request: {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
  timeout?: number;
}
Response: {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  duration: number;
}

// リクエスト履歴の保存（クライアント側LocalStorage）
// 環境設定の保存（クライアント側LocalStorage）
```

#### 実装の核心部分

**プロキシサービス (routes/proxy.ts)**

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const proxyRouter = new Hono();

proxyRouter.use('/*', cors());

proxyRouter.post('/request', async (c) => {
  try {
    const { method, url, headers, body, timeout = 30000 } = await c.req.json();
    
    const startTime = Date.now();
    
    // Spring Boot APIへリクエストを転送
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeout),
    });
    
    const duration = Date.now() - startTime;
    
    // レスポンスヘッダーを取得
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    
    // レスポンスボディを取得
    let responseBody;
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      responseBody = await response.json();
    } else {
      responseBody = await response.text();
    }
    
    return c.json({
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
      duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return c.json({
      error: error.message,
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

export default proxyRouter;
```

**リクエストフォーム (components/api-test/RequestForm.tsx)**

```typescript
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Send, Save } from "lucide-react"

const requestSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
  url: z.string().url("Invalid URL"),
  body: z.string().optional(),
})

interface RequestFormProps {
  onSubmit: (data: any) => Promise<void>
  isLoading: boolean
}

export function RequestForm({ onSubmit, isLoading }: RequestFormProps) {
  const [headers, setHeaders] = useState<Record<string, string>>({
    "Content-Type": "application/json"
  })
  
  const form = useForm<z.infer<typeof requestSchema>>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      method: "GET",
      url: "http://localhost:8080/api/",
      body: "",
    },
  })

  const handleSubmit = async (values: z.infer<typeof requestSchema>) => {
    await onSubmit({
      ...values,
      headers,
      body: values.body ? JSON.parse(values.body) : undefined,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Request</CardTitle>
        <CardDescription>
          Test your Spring Boot API endpoints
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="flex gap-2">
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem className="w-[150px]">
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                        <SelectItem value="PATCH">PATCH</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input placeholder="http://localhost:8080/api/users" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" disabled={isLoading}>
                <Send className="mr-2 h-4 w-4" />
                Send
              </Button>
            </div>

            <Tabs defaultValue="body" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="body">Body</TabsTrigger>
                <TabsTrigger value="headers">Headers</TabsTrigger>
                <TabsTrigger value="params">Params</TabsTrigger>
              </TabsList>
              
              <TabsContent value="body" className="space-y-4">
                <FormField
                  control={form.control}
                  name="body"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Request Body (JSON)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='{"name": "John", "email": "john@example.com"}'
                          className="font-mono min-h-[200px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="headers" className="space-y-4">
                <div className="space-y-2">
                  {Object.entries(headers).map(([key, value]) => (
                    <div key={key} className="flex gap-2">
                      <Input value={key} disabled className="flex-1" />
                      <Input 
                        value={value} 
                        onChange={(e) => setHeaders({...headers, [key]: e.target.value})}
                        className="flex-1" 
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setHeaders({...headers, "": ""})}
                  >
                    Add Header
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="params">
                <p className="text-sm text-muted-foreground">
                  Query parameters (coming soon)
                </p>
              </TabsContent>
            </Tabs>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
```

**レスポンスビューア (components/api-test/ResponseViewer.tsx)**

```typescript
"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Clock, AlertCircle, CheckCircle } from "lucide-react"

interface ResponseViewerProps {
  response?: {
    status: number
    statusText: string
    headers: Record<string, string>
    body: any
    duration: number
    timestamp: string
  }
  error?: string
}

export function ResponseViewer({ response, error }: ResponseViewerProps) {
  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!response) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Response</CardTitle>
          <CardDescription>Send a request to see the response</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const statusColor = response.status < 300 ? "success" : 
                       response.status < 400 ? "warning" : "destructive"

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {response.status < 300 ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            Response
          </CardTitle>
          <div className="flex items-center gap-4">
            <Badge variant={statusColor === "success" ? "default" : "destructive"}>
              {response.status} {response.statusText}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {response.duration}ms
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="body" className="w-full">
          <TabsList>
            <TabsTrigger value="body">Body</TabsTrigger>
            <TabsTrigger value="headers">Headers</TabsTrigger>
          </TabsList>
          
          <TabsContent value="body">
            <ScrollArea className="h-[400px] w-full rounded-md border p-4">
              <pre className="text-sm">
                {typeof response.body === 'string' 
                  ? response.body 
                  : JSON.stringify(response.body, null, 2)}
              </pre>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="headers">
            <ScrollArea className="h-[400px] w-full rounded-md border p-4">
              <div className="space-y-2">
                {Object.entries(response.headers).map(([key, value]) => (
                  <div key={key} className="flex gap-2 text-sm">
                    <span className="font-mono font-semibold text-muted-foreground min-w-[200px]">
                      {key}:
                    </span>
                    <span className="font-mono">{value}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
```

**APIテストページ (app/api-test/page.tsx)**

```typescript
"use client"

import { useState } from "react"
import { RequestForm } from "@/components/api-test/RequestForm"
import { ResponseViewer } from "@/components/api-test/ResponseViewer"
import { RequestHistory } from "@/components/api-test/RequestHistory"

export default function ApiTestPage() {
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSendRequest = async (requestData: any) => {
    setIsLoading(true)
    setError("")
    setResponse(null)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/proxy/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      })

      const data = await res.json()

      if (data.error) {
        setError(data.error)
      } else {
        setResponse(data)
        
        // 履歴に保存
        const history = JSON.parse(localStorage.getItem('api-request-history') || '[]')
        history.unshift({
          request: requestData,
          response: data,
          timestamp: new Date().toISOString(),
        })
        localStorage.setItem('api-request-history', JSON.stringify(history.slice(0, 50)))
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">API Test Client</h1>
        <p className="text-muted-foreground">
          Test your Spring Boot API endpoints
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <RequestForm onSubmit={handleSendRequest} isLoading={isLoading} />
          <ResponseViewer response={response} error={error} />
        </div>
        
        <div>
          <RequestHistory onSelectRequest={handleSendRequest} />
        </div>
      </div>
    </div>
  )
}
```

**リクエスト履歴コンポーネント (components/api-test/RequestHistory.tsx)**

```typescript
"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Clock, Trash2, RotateCcw } from "lucide-react"
import { storage } from "@/lib/storage"

interface RequestHistoryProps {
  onSelectRequest: (request: any) => void
}

export function RequestHistory({ onSelectRequest }: RequestHistoryProps) {
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    const loadHistory = () => {
      const savedHistory = storage.loadApiHistory()
      setHistory(savedHistory)
    }
    loadHistory()
    
    // LocalStorageの変更を監視
    window.addEventListener('storage', loadHistory)
    return () => window.removeEventListener('storage', loadHistory)
  }, [])

  const handleClearHistory = () => {
    storage.saveApiHistory([])
    setHistory([])
  }

  const handleReplay = (item: any) => {
    onSelectRequest(item.request)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>History</CardTitle>
          <CardDescription>Recent API requests</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearHistory}
          disabled={history.length === 0}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <div className="space-y-2">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No history yet
              </p>
            ) : (
              history.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => handleReplay(item)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {item.request.method}
                      </Badge>
                      {item.response && (
                        <Badge
                          variant={item.response.status < 300 ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {item.response.status}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-mono truncate">
                      {item.request.url}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(item.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleReplay(item)
                    }}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
```

#### UI実装のポイント

- Postmanライクな3ペイン構成
- JSONシンタックスハイライト
- レスポンスタイムの視覚的表示
- ステータスコードによる色分け
- リクエスト履歴からのワンクリック再実行

---

## 💾 LocalStorage管理

### 保存データ構造

```typescript
// localStorage keys
const STORAGE_KEYS = {
  DDL: 'postgres-test-helper:ddl',
  DATA: 'postgres-test-helper:data',
  MOCK: 'postgres-test-helper:mock',
  API_HISTORY: 'postgres-test-helper:api-history',
  API_ENV: 'postgres-test-helper:api-env',
};

// DDL保存形式
interface StoredDDL {
  tables: DDLTable[];
  timestamp: string;
  version: string;
}

// データ保存形式（テーブルごと）
interface StoredTableData {
  [tableName: string]: {
    rows: Record<string, any>[];
    timestamp: string;
  };
}

// モック保存形式
interface StoredMock {
  endpoints: MockEndpoint[];
  timestamp: string;
  version: string;
}

// APIリクエスト履歴保存形式
interface StoredApiHistory {
  history: RequestHistoryItem[];
  timestamp: string;
}

// API環境設定保存形式
interface StoredApiEnvironment {
  baseUrl: string;
  timeout: number;
  commonHeaders: Record<string, string>;
}
```

### 実装 (lib/storage.ts)

```typescript
export const storage = {
  // DDL
  saveDDL: (data: StoredDDL) => {
    localStorage.setItem(STORAGE_KEYS.DDL, JSON.stringify(data));
  },
  loadDDL: (): StoredDDL | null => {
    const data = localStorage.getItem(STORAGE_KEYS.DDL);
    return data ? JSON.parse(data) : null;
  },
  
  // テーブルデータ
  saveTableData: (tableName: string, rows: any[]) => {
    const allData = storage.loadAllTableData() || {};
    allData[tableName] = { rows, timestamp: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.DATA, JSON.stringify(allData));
  },
  loadTableData: (tableName: string) => {
    const allData = storage.loadAllTableData();
    return allData?.[tableName]?.rows || null;
  },
  loadAllTableData: (): StoredTableData | null => {
    const data = localStorage.getItem(STORAGE_KEYS.DATA);
    return data ? JSON.parse(data) : null;
  },
  
  // モック
  saveMock: (data: StoredMock) => {
    localStorage.setItem(STORAGE_KEYS.MOCK, JSON.stringify(data));
  },
  loadMock: (): StoredMock | null => {
    const data = localStorage.getItem(STORAGE_KEYS.MOCK);
    return data ? JSON.parse(data) : null;
  },
  
  // APIリクエスト履歴
  saveApiHistory: (history: RequestHistoryItem[]) => {
    const data: StoredApiHistory = {
      history: history.slice(0, 50), // 最新50件のみ保存
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.API_HISTORY, JSON.stringify(data));
  },
  loadApiHistory: (): RequestHistoryItem[] => {
    const data = localStorage.getItem(STORAGE_KEYS.API_HISTORY);
    return data ? JSON.parse(data).history : [];
  },
  addToApiHistory: (item: RequestHistoryItem) => {
    const history = storage.loadApiHistory();
    history.unshift(item);
    storage.saveApiHistory(history);
  },
  
  // API環境設定
  saveApiEnvironment: (env: StoredApiEnvironment) => {
    localStorage.setItem(STORAGE_KEYS.API_ENV, JSON.stringify(env));
  },
  loadApiEnvironment: (): StoredApiEnvironment | null => {
    const data = localStorage.getItem(STORAGE_KEYS.API_ENV);
    return data ? JSON.parse(data) : null;
  },
  
  // クリア
  clear: () => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  },
};
```

---

## 🧪 開発フェーズ

### Phase 1: 環境構築 (1日)
- [ ] プロジェクト初期化
- [ ] Docker Compose設定
- [ ] Next.js セットアップ
- [ ] Hono セットアップ
- [ ] PostgreSQL接続確認
- [ ] 基本的なレイアウト作成

### Phase 2: テーブル作成機能 (2-3日)
- [ ] DDLパーサー実装
- [ ] 依存関係解決アルゴリズム実装
- [ ] テーブル作成API実装
- [ ] DDLアップロードUI実装
- [ ] テーブル一覧表示UI実装
- [ ] LocalStorage保存機能実装
- [ ] JSONエクスポート機能実装
- [ ] 全削除機能実装

### Phase 3: データ入力機能 (2-3日)
- [ ] テーブル構造取得API実装
- [ ] データCRUD API実装
- [ ] テーブル選択UI実装
- [ ] データグリッドUI実装
- [ ] JSON編集モード実装
- [ ] インポート/エクスポート機能実装
- [ ] バリデーション実装

### Phase 4: モックAPI機能 (2-3日)
- [ ] モック管理API実装
- [ ] パスマッチングロジック実装
- [ ] 動的ルーティング実装
- [ ] モック一覧UI実装
- [ ] エンドポイント編集UI実装
- [ ] リクエストテスト機能実装
- [ ] 設定インポート/エクスポート実装

### Phase 5: APIテスト機能 (2日)
- [ ] プロキシAPI実装
- [ ] リクエスト送信機能実装
- [ ] レスポンス表示UI実装
- [ ] ヘッダー・ボディ編集UI実装
- [ ] リクエスト履歴機能実装
- [ ] 環境設定機能実装
- [ ] LocalStorage保存機能実装

### Phase 6: 統合・改善 (1-2日)
- [ ] エラーハンドリング強化
- [ ] ローディング状態の実装
- [ ] トースト通知の実装
- [ ] UI/UXの改善
- [ ] レスポンシブ対応
- [ ] 統合テスト

---

## 🎨 shadcn/uiを使ったUI実装例

### DDLアップロードコンポーネント

```tsx
// src/components/tables/DDLUploader.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Upload, FileText } from "lucide-react"

export function DDLUploader() {
  const [ddlText, setDdlText] = useState("")
  const { toast } = useToast()

  const handleUpload = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tables/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ddl: ddlText })
      })
      
      if (!response.ok) throw new Error('Failed to parse DDL')
      
      toast({
        title: "Success",
        description: "DDL parsed successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to parse DDL",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          DDL Upload
        </CardTitle>
        <CardDescription>
          Paste your SQL DDL statements here
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="CREATE TABLE users (&#10;  id SERIAL PRIMARY KEY,&#10;  name VARCHAR(255) NOT NULL&#10;);"
          value={ddlText}
          onChange={(e) => setDdlText(e.target.value)}
          className="min-h-[300px] font-mono"
        />
        <Button onClick={handleUpload} className="w-full">
          <Upload className="mr-2 h-4 w-4" />
          Parse & Create Tables
        </Button>
      </CardContent>
    </Card>
  )
}
```

### テーブル一覧コンポーネント

```tsx
// src/components/tables/TableList.tsx
"use client"

import { useQuery } from "@tanstack/react-query"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2, Download } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function TableList() {
  const { toast } = useToast()
  
  const { data: tables, refetch } = useQuery({
    queryKey: ['tables'],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tables`)
      return res.json()
    }
  })

  const handleDeleteAll = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tables`, {
        method: 'DELETE'
      })
      toast({ title: "All tables deleted" })
      refetch()
    } catch (error) {
      toast({ title: "Error", variant: "destructive" })
    }
  }

  const handleExport = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tables/export`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tables.json'
    a.click()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Database Tables</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDeleteAll}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Table Name</TableHead>
              <TableHead>Columns</TableHead>
              <TableHead>Row Count</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tables?.map((table: any) => (
              <TableRow key={table.name}>
                <TableCell className="font-mono">{table.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{table.columnCount}</Badge>
                </TableCell>
                <TableCell>{table.rowCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
```

### モックエンドポイント編集ダイアログ

```tsx
// src/components/mock/EndpointEditor.tsx
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

const mockEndpointSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
  path: z.string().min(1, "Path is required"),
  statusCode: z.number().min(100).max(599),
  responseBody: z.string().min(1, "Response body is required"),
  delay: z.number().min(0).optional(),
})

export function EndpointEditor() {
  const form = useForm<z.infer<typeof mockEndpointSchema>>({
    resolver: zodResolver(mockEndpointSchema),
    defaultValues: {
      method: "GET",
      path: "/api/",
      statusCode: 200,
      responseBody: "{}",
      delay: 0,
    },
  })

  const onSubmit = async (values: z.infer<typeof mockEndpointSchema>) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mock/endpoints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          response: {
            status: values.statusCode,
            body: JSON.parse(values.responseBody),
            delay: values.delay,
          }
        })
      })
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Endpoint
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Mock Endpoint</DialogTitle>
          <DialogDescription>
            Configure a new mock API endpoint
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                        <SelectItem value="PATCH">PATCH</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="statusCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status Code</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(+e.target.value)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="path"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Path</FormLabel>
                  <FormControl>
                    <Input placeholder="/api/users/:id" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="responseBody"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Response Body (JSON)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder='{"message": "Success"}'
                      className="font-mono min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="delay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delay (ms)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={e => field.onChange(+e.target.value)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full">Create Endpoint</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
```

### データグリッドコンポーネント

```tsx
// src/components/data/DataGrid.tsx
"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash, Save } from "lucide-react"

interface DataGridProps {
  tableName: string
}

export function DataGrid({ tableName }: DataGridProps) {
  const queryClient = useQueryClient()
  const [editingRow, setEditingRow] = useState<any>(null)

  const { data } = useQuery({
    queryKey: ['tableData', tableName],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/data/${tableName}`
      )
      return res.json()
    }
  })

  const updateMutation = useMutation({
    mutationFn: async (row: any) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/data/${tableName}/${row.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(row)
        }
      )
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tableData', tableName] })
      setEditingRow(null)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: any) => {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/data/${tableName}/${id}`,
        { method: 'DELETE' }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tableData', tableName] })
    }
  })

  const columns = data?.columns?.map((col: any) => ({
    accessorKey: col.name,
    header: col.name,
    cell: ({ row }: any) => {
      const isEditing = editingRow?.id === row.original.id
      
      if (isEditing) {
        return (
          <Input
            value={editingRow[col.name]}
            onChange={(e) =>
              setEditingRow({ ...editingRow, [col.name]: e.target.value })
            }
          />
        )
      }
      
      return <div>{row.getValue(col.name)}</div>
    },
  })) || []

  const table = useReactTable({
    data: data?.rows || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{tableName}</CardTitle>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Row
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </TableHead>
                  ))}
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                  <TableCell>
                    <div className="flex gap-2">
                      {editingRow?.id === row.original.id ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateMutation.mutate(editingRow)}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingRow(row.original)}
                        >
                          Edit
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(row.original.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## 🎨 shadcn/ui 設定

### components.json

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

### tailwind.config.js

```javascript
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
export default config
```

### src/app/globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### src/lib/utils.ts

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## 📦 パッケージ依存関係

### Backend (package.json)

```json
{
  "name": "postgres-test-helper-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "hono": "^4.6.14",
    "@hono/node-server": "^1.13.7",
    "pg": "^8.13.1",
    "zod": "^3.24.1",
    "dotenv": "^16.4.7"
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "@types/pg": "^8.11.10",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2"
  },
  "engines": {
    "node": ">=22.0.0",
    "pnpm": ">=9.0.0"
  }
}
```

### Frontend (package.json)

```json
{
  "name": "postgres-test-helper-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^15.1.3",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@tanstack/react-query": "^5.62.8",
    "@tanstack/react-table": "^8.20.6",
    "axios": "^1.7.9",
    "react-hook-form": "^7.54.2",
    "zod": "^3.24.1",
    "@hookform/resolvers": "^3.9.1",
    
    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-dropdown-menu": "^2.1.2",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-select": "^2.1.2",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-tabs": "^1.1.1",
    "@radix-ui/react-toast": "^1.2.2",
    
    "lucide-react": "^0.468.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "@types/react": "^19.0.6",
    "@types/react-dom": "^19.0.2",
    "typescript": "^5.7.2",
    "tailwindcss": "^3.4.17",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "eslint": "^9.17.0",
    "eslint-config-next": "^15.1.3"
  },
  "engines": {
    "node": ">=22.0.0",
    "pnpm": ">=9.0.0"
  }
}
```

---

## 🧪 テストシナリオ

### 基本フロー

1. **テーブル作成**
   ```
   1. DDLファイルをアップロード
   2. 依存関係が正しく解決されることを確認
   3. テーブルが作成されることを確認
   4. LocalStorageに保存されることを確認
   ```

2. **データ入力**
   ```
   1. 作成したテーブルを選択
   2. データを1件追加
   3. データを編集
   4. データを削除
   5. JSONインポートで複数件追加
   6. JSONエクスポートで確認
   ```

3. **モックAPI**
   ```
   1. モックエンドポイントを作成
   2. curlでリクエストして応答を確認
   3. Spring Bootアプリから呼び出して確認
   4. 異なる条件のモックを複数作成
   5. 優先度が正しく機能することを確認
   ```

4. **APIテスト**
   ```
   1. Spring Bootアプリを起動
   2. GETリクエストを送信してレスポンスを確認
   3. POSTリクエストでデータ作成を確認
   4. ヘッダーを追加して送信
   5. リクエスト履歴に保存されることを確認
   6. 履歴から再実行できることを確認
   7. エラーレスポンスの表示を確認
   ```

### エッジケース

- DDLに構文エラーがある場合
- 循環参照がある場合
- 外部キー制約違反のデータを入力した場合
- 存在しないモックパスにアクセスした場合
- 大量データの処理

---

## 🔧 トラブルシューティング

### よくある問題

1. **PostgreSQL接続エラー**
   ```bash
   # Dockerコンテナの状態確認
   docker ps
   docker logs postgres-test-helper
   
   # ポート競合確認
   lsof -i :5432
   ```

2. **CORS エラー**
   ```typescript
   // backend/src/index.ts
   import { cors } from 'hono/cors';
   app.use('/*', cors({
     origin: 'http://localhost:3000',
     credentials: true,
   }));
   ```

3. **LocalStorageが保存されない**
   - ブラウザの開発者ツールでストレージを確認
   - プライベートモードでないか確認
   - ストレージ容量制限を確認

---

## 📝 コーディング規約

### TypeScript
- 厳格な型定義を使用
- `any` の使用を最小限に
- インターフェースとTypeの使い分け

### React
- 関数コンポーネントを使用
- カスタムフックで再利用可能なロジックを分離
- propsは明示的に型定義

### API
- RESTful設計に従う
- エラーレスポンスは統一フォーマット
- バリデーションはZodを使用

---

## 🚀 デプロイ（参考）

### Docker化

```dockerfile
# backend/Dockerfile
FROM node:22-alpine

# pnpmのインストール
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

CMD ["pnpm", "start"]
```

```dockerfile
# frontend/Dockerfile
FROM node:22-alpine

# pnpmのインストール
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

CMD ["pnpm", "start"]
```

### docker-compose拡張（フルスタック）

```yaml
version: '3.8'

services:
  frontend:
    build: 
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:3001
    depends_on:
      - backend
  
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/testdb
      - PORT=3001
    depends_on:
      postgres:
        condition: service_healthy
  
  postgres:
    image: postgres:16-alpine
    container_name: postgres-test-helper
    environment:
      POSTGRES_DB: testdb
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

---

## 📚 参考資料

- [Hono Documentation](https://hono.dev/)
- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TanStack Table](https://tanstack.com/table/latest)
- [Zod Validation](https://zod.dev/)
- [pnpm Documentation](https://pnpm.io/)
- [Radix UI Primitives](https://www.radix-ui.com/)

---

## 🎯 今後の拡張案

1. **データ生成機能**: Faker.jsを使ったテストデータ自動生成
2. **スナップショット機能**: データベース状態の保存・復元
3. **ER図可視化**: テーブル関係の図示
4. **クエリビルダー**: GUIでのSQL生成
5. **API履歴**: リクエスト/レスポンスのログ保存
6. **シード管理**: 初期データセットの管理
7. **マルチDB対応**: MySQL、SQLite対応
8. **認証機能**: モックAPIへの認証追加
9. **WebSocket対応**: リアルタイム通信のモック
10. **パフォーマンステスト**: 負荷テスト機能
11. **APIテスト自動化**: テストスクリプトの保存・実行
12. **環境変数管理**: 開発・ステージング・本番環境の切り替え
13. **レスポンスアサーション**: 期待値との比較機能
14. **GraphQL対応**: GraphQLクエリのテスト
15. **Swagger/OpenAPI統合**: API定義からテストケース生成

---

## ✅ チェックリスト

開発開始前に確認：
- [ ] Node.js 22+ インストール済み (`node --version`)
- [ ] pnpm 9+ インストール済み (`pnpm --version`)
- [ ] Docker & Docker Compose インストール済み
- [ ] PostgreSQLの基本知識
- [ ] TypeScriptの基本知識
- [ ] Reactの基本知識
- [ ] shadcn/uiの基本理解

---

以上で開発インストラクションは完了です。
このドキュメントに従って、段階的に実装を進めてください。