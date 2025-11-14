# テストシナリオ統合管理機能 実装プラン

> **対象プロジェクト**: PostgreSQL Test Helper  
> このドキュメントのファイルパスは、プロジェクトルート（test-tool）からの相対パスで記載されています。

## 📋 概要

テスト対象 API を起点に、テーブルデータ・外部 API モック・テスト設定を統合管理し、1 つの JSON で保存・復元できる機能を実装する。

## 🎯 実装目標

1. **テストシナリオ**を中心とした統合管理
2. テストバリエーション（正常系・異常系など）の管理
3. すべての設定を含む**統合エクスポート/インポート**
4. テーブルデータのエクスポート/インポート機能
5. API テスト設定の永続化

## 📊 現状と不足機能

### 既存機能

- ✅ DDL 解析・テーブル作成
- ✅ テーブルへのデータ挿入
- ✅ モック API 設定
- ✅ API テスト実行
- ✅ モック API のエクスポート/インポート
- ✅ DDL 設定のエクスポート/インポート

### 不足機能

- ❌ テストシナリオの概念と管理機能
- ❌ テーブルデータのエクスポート/インポート
- ❌ API テスト設定の保存機能
- ❌ 統合エクスポート/インポート（全設定を 1 つの JSON で）
- ❌ テストバリエーション管理
- ❌ シナリオベースの UI

---

## 🏗️ アーキテクチャ設計

### データモデル

```typescript
// テストシナリオ（最上位の概念）
interface TestScenario {
  id: string; // 一意ID
  name: string; // シナリオ名（例: "ユーザー登録_正常系"）
  description?: string; // 説明
  targetApi: ApiTestConfig; // テスト対象API設定
  tables: DDLTable[]; // 必要なテーブル定義
  tableData: TableData[]; // 必要なテーブルデータ
  mockApis: MockEndpoint[]; // 必要なモックAPI
  variations: TestVariation[]; // テストバリエーション
  tags: string[]; // タグ（検索・分類用）
  createdAt: string;
  updatedAt: string;
}

// APIテスト設定（保存可能に）
interface ApiTestConfig {
  id?: string; // 保存時のID
  name?: string; // 設定名
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  url: string; // テスト対象URL
  headers?: Record<string, string>; // リクエストヘッダー
  body?: any; // リクエストボディ
  timeout?: number; // タイムアウト（ms）
}

// テーブルデータ
interface TableData {
  tableName: string; // テーブル名
  rows: Record<string, any>[]; // データ行
  truncateBefore?: boolean; // 挿入前にテーブルをクリア
}

// テストバリエーション
interface TestVariation {
  id: string; // バリエーションID
  name: string; // バリエーション名（例: "異常系_メール重複"）
  description?: string; // 説明
  tableDataOverrides?: TableData[]; // このバリエーション固有のテーブルデータ
  mockApiOverrides?: MockEndpoint[]; // このバリエーション固有のモックAPI
  apiConfigOverrides?: Partial<ApiTestConfig>; // API設定の上書き
  expectedResponse?: {
    // 期待されるレスポンス
    status?: number;
    body?: any;
    headers?: Record<string, string>;
  };
}

// 統合エクスポート形式
interface ScenarioExport {
  version: string; // エクスポート形式バージョン
  exportedAt: string; // エクスポート日時
  scenario: TestScenario; // シナリオ全体
}
```

---

## 📝 実装フェーズ

### Phase 1: バックエンド基盤実装 (6-8 時間)

#### 1.1 型定義の追加

**ファイル**: `backend/src/types/index.ts`

```typescript
// 新規型定義を追加
-TestScenario - ApiTestConfig - TableData - TestVariation - ScenarioExport;
```

**タスク**:

- [ ] 型定義ファイルに新しいインターフェースを追加
- [ ] Zod スキーマの作成（バリデーション用）

**所要時間**: 1 時間

---

#### 1.2 テーブルデータエクスポート/インポート機能

**ファイル**: `backend/src/services/databaseService.ts`

**新規関数**:

```typescript
// テーブルのデータをエクスポート
async function exportTableData(tableName: string): Promise<TableData>;

// 複数テーブルのデータをエクスポート
async function exportAllTableData(): Promise<TableData[]>;

// テーブルデータをインポート
async function importTableData(data: TableData): Promise<number>;

// 複数テーブルのデータをインポート
async function importAllTableData(dataList: TableData[]): Promise<void>;
```

**タスク**:

- [ ] `exportTableData()` 実装 - SELECT 文でデータ取得
- [ ] `exportAllTableData()` 実装 - 全テーブルのデータ取得
- [ ] `importTableData()` 実装 - truncate オプション対応
- [ ] `importAllTableData()` 実装 - トランザクション対応
- [ ] ユニットテスト作成

**所要時間**: 2 時間

---

#### 1.3 シナリオ管理サービス

**ファイル**: `backend/src/services/scenarioService.ts` (新規作成)

**クラス**: `ScenarioService`

**メソッド**:

```typescript
class ScenarioService {
  private scenarios: Map<string, TestScenario> = new Map();

  // CRUD操作
  getAllScenarios(): TestScenario[];
  getScenarioById(id: string): TestScenario | undefined;
  createScenario(
    scenario: Omit<TestScenario, 'id' | 'createdAt' | 'updatedAt'>
  ): TestScenario;
  updateScenario(
    id: string,
    updates: Partial<TestScenario>
  ): TestScenario | null;
  deleteScenario(id: string): boolean;

  // バリエーション管理
  addVariation(
    scenarioId: string,
    variation: Omit<TestVariation, 'id'>
  ): TestVariation | null;
  updateVariation(
    scenarioId: string,
    variationId: string,
    updates: Partial<TestVariation>
  ): boolean;
  deleteVariation(scenarioId: string, variationId: string): boolean;

  // エクスポート/インポート
  exportScenario(id: string): ScenarioExport | null;
  importScenario(data: ScenarioExport): TestScenario;
  exportAllScenarios(): ScenarioExport[];
  importAllScenarios(dataList: ScenarioExport[]): void;

  // シナリオの適用（環境セットアップ）
  async applyScenario(id: string, variationId?: string): Promise<void>;

  // タグ検索
  searchByTags(tags: string[]): TestScenario[];
}
```

**タスク**:

- [ ] ScenarioService クラス実装
- [ ] 各メソッドの実装
- [ ] `applyScenario()` - テーブル作成 → データ挿入 → モック API 設定の自動実行
- [ ] ユニットテスト作成

**所要時間**: 3-4 時間

---

#### 1.4 API エンドポイント実装

**ファイル**: `backend/src/routes/scenarios.ts` (新規作成)

**エンドポイント**:

```typescript
// シナリオCRUD
GET    /api/scenarios              // 全シナリオ取得
GET    /api/scenarios/:id          // シナリオ詳細取得
POST   /api/scenarios              // シナリオ作成
PUT    /api/scenarios/:id          // シナリオ更新
DELETE /api/scenarios/:id          // シナリオ削除

// バリエーション管理
POST   /api/scenarios/:id/variations              // バリエーション追加
PUT    /api/scenarios/:id/variations/:varId       // バリエーション更新
DELETE /api/scenarios/:id/variations/:varId       // バリエーション削除

// エクスポート/インポート
GET    /api/scenarios/:id/export   // 個別シナリオエクスポート
GET    /api/scenarios/export/all   // 全シナリオエクスポート
POST   /api/scenarios/import        // シナリオインポート

// シナリオ適用
POST   /api/scenarios/:id/apply    // シナリオ環境セットアップ
POST   /api/scenarios/:id/apply/:varId  // バリエーション環境セットアップ

// 検索
GET    /api/scenarios/search?tags=tag1,tag2  // タグ検索
```

**タスク**:

- [ ] ルーターファイル作成
- [ ] 各エンドポイント実装
- [ ] バリデーションスキーマ作成
- [ ] エラーハンドリング
- [ ] `server.ts`にルーター追加

**所要時間**: 2-3 時間

---

#### 1.5 データベース API 拡張

**ファイル**: `backend/src/routes/database.ts`

**新規エンドポイント**:

```typescript
GET    /api/database/data/:tableName     // テーブルデータエクスポート
GET    /api/database/data/export/all     // 全テーブルデータエクスポート
POST   /api/database/data/import         // テーブルデータインポート
```

**タスク**:

- [ ] エンドポイント追加
- [ ] databaseService の新関数を呼び出し
- [ ] レスポンス形式の統一

**所要時間**: 1 時間

---

### Phase 2: フロントエンド実装 (8-10 時間)

#### 2.1 API Client 実装

**ファイル**: `frontend/src/lib/api/scenarios.ts` (新規作成)

```typescript
export const scenarioApi = {
  // CRUD
  getAll: () => fetch('/api/scenarios').then(r => r.json()),
  getById: (id: string) => fetch(`/api/scenarios/${id}`).then(r => r.json()),
  create: (data: CreateScenarioInput) => fetch('/api/scenarios', {...}),
  update: (id: string, data: Partial<TestScenario>) => fetch(...),
  delete: (id: string) => fetch(...),

  // エクスポート/インポート
  exportScenario: (id: string) => fetch(`/api/scenarios/${id}/export`),
  exportAll: () => fetch('/api/scenarios/export/all'),
  importScenario: (file: File) => { ... },

  // シナリオ適用
  apply: (id: string, variationId?: string) => fetch(...),
}
```

**タスク**:

- [ ] API クライアント実装
- [ ] エラーハンドリング
- [ ] TypeScript 型定義

**所要時間**: 1-2 時間

---

#### 2.2 シナリオ一覧画面

**ファイル**: `frontend/src/app/scenarios/page.tsx` (新規作成)

**機能**:

- シナリオ一覧表示（カード形式）
- 新規作成ボタン
- 検索・フィルター（タグ）
- エクスポート/インポートボタン
- 各シナリオの操作（編集・削除・適用・エクスポート）

**コンポーネント構成**:

```
scenarios/page.tsx
  ├─ ScenarioList
  │   └─ ScenarioCard (各シナリオ)
  ├─ ScenarioSearch
  └─ ImportExportButtons
```

**タスク**:

- [ ] ページコンポーネント作成
- [ ] React Query 統合
- [ ] UI 実装（shadcn/ui 使用）
- [ ] インポート/エクスポート機能

**所要時間**: 2-3 時間

---

#### 2.3 シナリオ作成/編集画面

**ファイル**: `frontend/src/app/scenarios/[id]/page.tsx` (新規作成)
**ファイル**: `frontend/src/app/scenarios/new/page.tsx` (新規作成)

**機能**:

- シナリオ基本情報入力
- ターゲット API 設定
- テーブル選択・DDL 設定
- テーブルデータ入力（JSON/GUI）
- モック API 選択・設定
- バリエーション管理
- プレビュー機能
- 保存・適用ボタン

**コンポーネント構成**:

```
scenarios/[id]/page.tsx
  ├─ ScenarioForm
  │   ├─ BasicInfoSection
  │   ├─ TargetApiSection
  │   ├─ TablesSection
  │   ├─ TableDataSection
  │   ├─ MockApisSection
  │   └─ VariationsSection
  └─ PreviewPanel
```

**タスク**:

- [ ] フォームコンポーネント作成
- [ ] React Hook Form 統合
- [ ] バリデーション実装
- [ ] ステップ式 UI 実装
- [ ] バリエーション追加/編集 UI

**所要時間**: 4-5 時間

---

#### 2.4 シナリオ適用・実行画面

**ファイル**: `frontend/src/app/scenarios/[id]/run/page.tsx` (新規作成)

**機能**:

- シナリオ適用状況表示
- テーブル作成状況
- データ挿入状況
- モック API 設定状況
- API テスト実行
- レスポンス表示
- バリエーション切り替え

**タスク**:

- [ ] 実行画面コンポーネント作成
- [ ] ステータス表示 UI
- [ ] API テスト実行機能統合
- [ ] バリエーション切り替え UI

**所要時間**: 2-3 時間

---

#### 2.5 ナビゲーション更新

**ファイル**: `frontend/src/components/Navigation.tsx`
**ファイル**: `frontend/src/app/page.tsx`

**タスク**:

- [ ] シナリオページへのリンク追加
- [ ] ホーム画面にシナリオカード追加
- [ ] アイコン追加

**所要時間**: 30 分

---

### Phase 3: 統合・テスト (4-6 時間)

#### 3.1 統合テスト

**テストシナリオ**:

1. シナリオ作成 → エクスポート → インポート → 適用
2. バリエーション追加 → 切り替え → 実行
3. 複数シナリオのエクスポート/インポート
4. 既存データとの統合

**タスク**:

- [ ] E2E テストシナリオ作成
- [ ] バックエンド API 統合テスト
- [ ] フロントエンド E2E テスト（Playwright）

**所要時間**: 2-3 時間

---

#### 3.2 ドキュメント作成

**ファイル**:

- `docs/SCENARIO_USER_GUIDE.md` - ユーザーガイド
- `docs/SCENARIO_API.md` - API 仕様書
- `README.md` - 更新

**内容**:

- シナリオ機能の使い方
- エクスポート/インポート形式
- API 仕様詳細
- サンプルシナリオ

**タスク**:

- [ ] ユーザーガイド作成
- [ ] API 仕様書作成
- [ ] README 更新
- [ ] サンプル JSON ファイル作成

**所要時間**: 2-3 時間

---

## 🎨 UI/UX デザイン方針

### シナリオ一覧画面

```
┌─────────────────────────────────────────────────┐
│  🧪 テストシナリオ                    [+新規作成] │
│  [🔍検索] [🏷️タグ] [⬇️インポート] [⬆️エクスポート]  │
├─────────────────────────────────────────────────┤
│ ┌──────────────────┐  ┌──────────────────┐     │
│ │ ユーザー登録_正常系  │  │ ユーザー登録_異常系  │     │
│ │ POST /api/users  │  │ POST /api/users  │     │
│ │ 📊 2 tables      │  │ 📊 2 tables      │     │
│ │ 🔌 1 mock        │  │ 🔌 1 mock        │     │
│ │ 🔀 3 variations  │  │ 🔀 2 variations  │     │
│ │ [編集][削除][適用]  │  │ [編集][削除][適用]  │     │
│ └──────────────────┘  └──────────────────┘     │
└─────────────────────────────────────────────────┘
```

### シナリオ編集画面（ステップ形式）

```
Step 1: 基本情報 → Step 2: API設定 → Step 3: データ → Step 4: モック → Step 5: バリエーション
```

---

## 📦 エクスポート JSON 形式例

```json
{
  "version": "1.0.0",
  "exportedAt": "2025-11-14T10:30:00.000Z",
  "scenario": {
    "id": "scenario_001",
    "name": "ユーザー登録_正常系",
    "description": "新規ユーザーが正常に登録できることを確認",
    "targetApi": {
      "name": "ユーザー登録API",
      "method": "POST",
      "url": "http://localhost:8080/api/users",
      "headers": {
        "Content-Type": "application/json"
      },
      "body": {
        "name": "Test User",
        "email": "test@example.com",
        "password": "password123"
      }
    },
    "tables": [
      {
        "name": "users",
        "ddl": "CREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(100), email VARCHAR(100) UNIQUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);",
        "dependencies": [],
        "order": 0
      }
    ],
    "tableData": [
      {
        "tableName": "users",
        "truncateBefore": true,
        "rows": [
          {
            "id": 1,
            "name": "Existing User",
            "email": "existing@example.com"
          }
        ]
      }
    ],
    "mockApis": [
      {
        "id": "mock_email_001",
        "name": "Email Service Mock",
        "enabled": true,
        "priority": 0,
        "method": "POST",
        "path": "/api/email/send",
        "response": {
          "status": 200,
          "body": {
            "sent": true,
            "messageId": "mock-123"
          }
        }
      }
    ],
    "variations": [
      {
        "id": "var_001",
        "name": "異常系_メール重複",
        "description": "既存のメールアドレスで登録を試みる",
        "apiConfigOverrides": {
          "body": {
            "name": "Another User",
            "email": "existing@example.com",
            "password": "password456"
          }
        },
        "expectedResponse": {
          "status": 409,
          "body": {
            "error": "Email already exists"
          }
        }
      },
      {
        "id": "var_002",
        "name": "異常系_バリデーションエラー",
        "description": "不正なメールアドレス形式",
        "apiConfigOverrides": {
          "body": {
            "name": "Test User",
            "email": "invalid-email",
            "password": "password123"
          }
        },
        "expectedResponse": {
          "status": 400,
          "body": {
            "error": "Invalid email format"
          }
        }
      }
    ],
    "tags": ["users", "registration", "authentication"],
    "createdAt": "2025-11-14T08:00:00.000Z",
    "updatedAt": "2025-11-14T10:00:00.000Z"
  }
}
```

---

## 🚀 実装順序

### Week 1: バックエンド基盤

1. 型定義追加（1 時間）
2. テーブルデータエクスポート/インポート（2 時間）
3. シナリオ管理サービス（4 時間）
4. API エンドポイント実装（3 時間）

### Week 2: フロントエンド

5. API クライアント実装（2 時間）
6. シナリオ一覧画面（3 時間）
7. シナリオ作成/編集画面（5 時間）
8. シナリオ適用・実行画面（3 時間）

### Week 3: 統合・テスト

9. 統合テスト（3 時間）
10. ドキュメント作成（3 時間）

**合計見積もり時間**: 28-32 時間

---

## ✅ チェックリスト

### Phase 1: バックエンド

- [ ] 型定義追加
- [ ] テーブルデータエクスポート機能
- [ ] テーブルデータインポート機能
- [ ] ScenarioService クラス実装
- [ ] シナリオ CRUD API
- [ ] バリエーション管理 API
- [ ] エクスポート/インポート API
- [ ] シナリオ適用 API
- [ ] ユニットテスト

### Phase 2: フロントエンド

- [ ] API クライアント実装
- [ ] シナリオ一覧画面
- [ ] シナリオ作成画面
- [ ] シナリオ編集画面
- [ ] バリエーション管理 UI
- [ ] シナリオ適用・実行画面
- [ ] エクスポート/インポート UI
- [ ] ナビゲーション更新

### Phase 3: 統合・テスト

- [ ] 統合テスト
- [ ] E2E テスト
- [ ] API 仕様書
- [ ] ユーザーガイド
- [ ] サンプルシナリオ作成

---

## 🎯 成功基準

1. ✅ テストシナリオを GUI で作成できる
2. ✅ シナリオを 1 つの JSON ファイルでエクスポートできる
3. ✅ エクスポートした JSON をインポートして完全復元できる
4. ✅ シナリオ適用でテーブル・データ・モック API が自動セットアップされる
5. ✅ バリエーション切り替えで異なるテストパターンを実行できる
6. ✅ 既存の個別機能（テーブル管理・データ入力・モック API・API テスト）も引き続き使用できる

---

## 📌 注意事項

### 互換性

- 既存のモック API エクスポート/インポート機能は維持
- 既存の DDL エクスポート/インポート機能は維持
- 新しいシナリオ機能は既存機能の上位レイヤーとして実装

### パフォーマンス

- 大量のテーブルデータエクスポート時はストリーミング対応を検討
- シナリオ適用時はプログレス表示

### セキュリティ

- インポート時のバリデーション必須
- SQL インジェクション対策（既存の parameterized query 使用）

### 拡張性

- 将来的な機能追加を考慮した設計
  - テスト実行履歴の保存
  - シナリオ実行のスケジューリング
  - CI/CD 統合
  - チーム共有機能

---

## 📚 参考リソース

- [既存 API 仕様書](./API.md)
- [プロジェクト計画書](../PROJECT_PLAN.md)
- [README](../README.md)
