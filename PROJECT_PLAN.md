# PostgreSQL Test Helper - プロジェクト実装計画

## 📋 プロジェクト概要

Spring Boot + PostgreSQL APIバックエンドサーバーのローカル環境テストを支援するWebツール。

### 主要機能
1. **テーブル作成機能**: DDL解析と依存関係解決による自動テーブル作成
2. **データ入力機能**: GUI/JSONでのテストデータ管理
3. **モックAPI機能**: 外部APIをモック化してテストの独立性を確保
4. **APIテスト機能**: Spring Boot APIのエンドポイントをテスト

### 技術スタック
- **フロントエンド**: Next.js 15 + TypeScript + React 19 + shadcn/ui
- **バックエンド**: Hono (最新) + Node.js 22 + TypeScript
- **データベース**: PostgreSQL 16+
- **パッケージマネージャー**: pnpm 9+
- **テスト**: vitest

---

## 🎯 実装フェーズと実装計画

### Phase 0: プロジェクト初期設定 (約1-2時間)

**目標**: 開発環境のセットアップと基本構造の構築

#### 実装タスク

1. **プロジェクトルート構成**
   - [ ] プロジェクトルートディレクトリの作成
   - [ ] `.gitignore` ファイルの作成
   - [ ] `README.md` の作成
   - [ ] `docker-compose.yml` の作成とPostgreSQL設定
   - [ ] Docker起動確認

2. **バックエンドプロジェクト初期化**
   - [ ] `backend/` ディレクトリ作成
   - [ ] `package.json` 作成（Hono, pg, zod, dotenv等）
   - [ ] `tsconfig.json` 作成
   - [ ] `.env` ファイル作成（DATABASE_URL等）
   - [ ] ディレクトリ構造作成（src/routes, src/services, src/utils, src/types）
   - [ ] 基本的な `src/index.ts` 作成（Honoサーバー起動）
   - [ ] ヘルスチェックエンドポイント (`/health`) 実装
   - [ ] PostgreSQL接続確認用のユーティリティ作成
   - [ ] 依存関係インストール (`pnpm install`)

3. **フロントエンドプロジェクト初期化**
   - [ ] `frontend/` ディレクトリ作成
   - [ ] Next.js 15プロジェクト作成 (`pnpm create next-app`)
   - [ ] shadcn/ui初期化 (`pnpm dlx shadcn@latest init`)
   - [ ] 必要なshadcn/uiコンポーネントのインストール
   - [ ] `.env.local` ファイル作成（API URL設定）
   - [ ] 基本レイアウトコンポーネント作成（Header, Sidebar）
   - [ ] グローバルスタイル設定（globals.css）
   - [ ] 依存関係インストール

4. **vitestセットアップ**
   - [ ] バックエンド用vitest設定
   - [ ] フロントエンド用vitest設定
   - [ ] サンプルテストファイルの作成

**コミットポイント**: `feat: initial project setup with Docker, backend, and frontend structure`

**確認項目**:
- PostgreSQLがDocker上で起動できること
- バックエンドが `http://localhost:3001` で起動できること
- フロントエンドが `http://localhost:3000` で起動できること
- `/health` エンドポイントが正常に応答すること
- vitestでサンプルテストが実行できること

---

### Phase 1: テーブル作成機能 (約8-10時間)

**目標**: DDLファイルを解析してPostgreSQLテーブルを作成する機能の実装

#### 実装タスク

##### 1.1 DDLパーサーの実装 (2-3時間)

- [ ] `backend/src/services/ddlParser.ts` 作成
  - [ ] `parseDDL(ddlText: string)` 関数実装
  - [ ] CREATE TABLE文の正規表現パターン作成
  - [ ] テーブル名抽出ロジック
  - [ ] カラム定義抽出ロジック
  - [ ] PRIMARY KEY制約の抽出
  - [ ] FOREIGN KEY制約の抽出（REFERENCES句の解析）
  - [ ] 複数DDL文の分割処理
- [ ] `backend/src/__tests__/ddlParser.test.ts` 作成
  - [ ] 基本的なCREATE TABLEのパーステスト
  - [ ] 外部キー制約を含むDDLのテスト
  - [ ] 複数テーブルDDLのテスト
  - [ ] エラーケースのテスト

**コミット**: `feat: implement DDL parser with FK extraction`

##### 1.2 依存関係解決の実装 (2-3時間)

- [ ] `backend/src/services/dependencyResolver.ts` 作成
  - [ ] `buildDependencyGraph(tables: ParsedTable[])` 実装
  - [ ] トポロジカルソートアルゴリズム実装
  - [ ] 循環参照検出ロジック実装
  - [ ] 依存関係グラフの可視化用データ生成
- [ ] `backend/src/__tests__/dependencyResolver.test.ts` 作成
  - [ ] 単純な依存関係のテスト
  - [ ] 複雑な依存関係のテスト
  - [ ] 循環参照検出のテスト

**コミット**: `feat: implement dependency resolver with topological sort`

##### 1.3 データベースサービスの実装 (1-2時間)

- [ ] `backend/src/utils/database.ts` 作成
  - [ ] PostgreSQL接続プール設定
  - [ ] `query(sql: string, params?: any[])` 実装
  - [ ] トランザクション管理
  - [ ] 接続エラーハンドリング
- [ ] `backend/src/services/dbService.ts` 作成
  - [ ] `createTable(ddl: string)` 実装
  - [ ] `dropTable(tableName: string)` 実装
  - [ ] `listTables()` 実装
  - [ ] `getTableSchema(tableName: string)` 実装
  - [ ] `dropAllTables()` 実装（依存関係考慮）
- [ ] データベース操作のテスト作成

**コミット**: `feat: implement database service for table management`

##### 1.4 テーブル管理APIの実装 (2-3時間)

- [ ] `backend/src/routes/tables.ts` 作成
  - [ ] `POST /api/tables/parse` - DDL解析エンドポイント
  - [ ] `POST /api/tables/create` - テーブル作成エンドポイント
  - [ ] `GET /api/tables` - テーブル一覧取得エンドポイント
  - [ ] `GET /api/tables/export` - DDL JSONエクスポート
  - [ ] `DELETE /api/tables` - 全テーブル削除エンドポイント
  - [ ] エラーハンドリング実装
  - [ ] Zodバリデーション実装
- [ ] APIエンドポイントのテスト作成
- [ ] `backend/src/index.ts` にルート登録

**コミット**: `feat: implement table management API endpoints`

##### 1.5 フロントエンドコンポーネント実装 (2-3時間)

- [ ] `frontend/src/lib/api.ts` 作成
  - [ ] API呼び出し関数群の実装
- [ ] `frontend/src/lib/storage.ts` 作成
  - [ ] LocalStorage管理関数の実装
- [ ] `frontend/src/types/index.ts` 作成
  - [ ] 型定義の追加
- [ ] `frontend/src/components/tables/DDLUploader.tsx` 作成
  - [ ] DDLテキスト入力フォーム
  - [ ] ファイルアップロード機能（オプション）
  - [ ] パース結果表示
- [ ] `frontend/src/components/tables/TableList.tsx` 作成
  - [ ] テーブル一覧表示
  - [ ] 削除ボタン
  - [ ] エクスポートボタン
- [ ] `frontend/src/components/tables/DependencyGraph.tsx` 作成（オプション）
  - [ ] 依存関係の可視化
- [ ] `frontend/src/app/tables/page.tsx` 作成
  - [ ] テーブル管理画面のレイアウト
  - [ ] React Query統合
- [ ] コンポーネントのテスト作成

**コミット**: `feat: implement table management UI components`

**Phase 1 完了時のテスト**:
- [ ] DDLテキストをアップロードして解析できること
- [ ] 依存関係が正しく表示されること
- [ ] テーブルが作成順に作成されること
- [ ] 作成されたテーブルが一覧に表示されること
- [ ] LocalStorageに保存されること
- [ ] JSONエクスポートが機能すること
- [ ] 全削除が依存関係を考慮して実行されること

---

### Phase 2: データ入力機能 (約6-8時間)

**目標**: 作成したテーブルにGUI/JSONでデータを入力・管理する機能の実装

#### 実装タスク

##### 2.1 データ操作APIの実装 (2-3時間)

- [ ] `backend/src/routes/data.ts` 作成
  - [ ] `GET /api/data/:tableName/schema` - テーブルスキーマ取得
  - [ ] `GET /api/data/:tableName` - データ取得（ページネーション対応）
  - [ ] `POST /api/data/:tableName` - データ挿入（単一/複数対応）
  - [ ] `PUT /api/data/:tableName/:id` - データ更新
  - [ ] `DELETE /api/data/:tableName/:id` - データ削除
  - [ ] `GET /api/data/:tableName/export` - データJSONエクスポート
  - [ ] `POST /api/data/:tableName/import` - データJSONインポート
- [ ] バリデーション実装
  - [ ] データ型チェック
  - [ ] NOT NULL制約チェック
  - [ ] 外部キー整合性チェック（オプション）
- [ ] データ操作APIのテスト作成

**コミット**: `feat: implement data CRUD API with validation`

##### 2.2 データグリッドコンポーネント実装 (2-3時間)

- [ ] `frontend/src/components/data/TableSelector.tsx` 作成
  - [ ] テーブル選択ドロップダウン
  - [ ] テーブルスキーマ表示
- [ ] `frontend/src/components/data/DataGrid.tsx` 作成
  - [ ] TanStack Tableを使用したデータグリッド
  - [ ] インライン編集機能
  - [ ] 行追加ボタン
  - [ ] 行削除ボタン
  - [ ] ページネーション
  - [ ] ソート機能（オプション）
- [ ] `frontend/src/components/data/JsonEditor.tsx` 作成
  - [ ] JSON形式での編集
  - [ ] シンタックスハイライト
  - [ ] バリデーション表示
- [ ] `frontend/src/app/data/page.tsx` 作成
  - [ ] データ管理画面のレイアウト
  - [ ] データグリッドとJSON編集のタブ切り替え
- [ ] コンポーネントのテスト作成

**コミット**: `feat: implement data grid UI with inline editing`

##### 2.3 インポート/エクスポート機能実装 (1-2時間)

- [ ] JSONエクスポート機能
  - [ ] ダウンロードボタンの実装
  - [ ] ファイル生成ロジック
- [ ] JSONインポート機能
  - [ ] ファイルアップロード機能
  - [ ] バリデーション
  - [ ] エラー表示
- [ ] LocalStorageとの連携
- [ ] テスト作成

**コミット**: `feat: implement data import/export functionality`

**Phase 2 完了時のテスト**:
- [ ] テーブル選択でスキーマが表示されること
- [ ] データの追加・編集・削除ができること
- [ ] JSON形式での編集ができること
- [ ] データがJSONでエクスポートできること
- [ ] JSONデータをインポートできること
- [ ] バリデーションエラーが適切に表示されること

---

### Phase 3: モックAPI機能 (約6-8時間)

**目標**: 外部APIをモック化してテストを独立させる機能の実装

#### 実装タスク

##### 3.1 モック管理サービスの実装 (2-3時間)

- [ ] `backend/src/services/mockService.ts` 作成
  - [ ] `findMatchingMock()` - リクエストマッチング実装
  - [ ] `matchPathPattern()` - パスパターンマッチング
  - [ ] `interpolateResponse()` - パラメータ埋め込み
  - [ ] モックエンドポイントのメモリ管理
- [ ] モックサービスのテスト作成

**コミット**: `feat: implement mock service with pattern matching`

##### 3.2 モックAPIエンドポイントの実装 (2-3時間)

- [ ] `backend/src/routes/mock.ts` 作成
  - [ ] `GET /api/mock/endpoints` - モックエンドポイント一覧取得
  - [ ] `POST /api/mock/endpoints` - モックエンドポイント作成
  - [ ] `PUT /api/mock/endpoints/:id` - モックエンドポイント更新
  - [ ] `DELETE /api/mock/endpoints/:id` - モックエンドポイント削除
  - [ ] `GET /api/mock/export` - モック設定エクスポート
  - [ ] `POST /api/mock/import` - モック設定インポート
  - [ ] `ANY /mock/*` - 動的モックルーティング
- [ ] CORS設定の追加
- [ ] モックAPIのテスト作成

**コミット**: `feat: implement mock API endpoints with dynamic routing`

##### 3.3 モック管理UIの実装 (2-3時間)

- [ ] `frontend/src/components/mock/EndpointList.tsx` 作成
  - [ ] モックエンドポイント一覧表示
  - [ ] 有効/無効切り替え
  - [ ] 編集・削除ボタン
- [ ] `frontend/src/components/mock/EndpointEditor.tsx` 作成
  - [ ] モックエンドポイント作成/編集ダイアログ
  - [ ] HTTPメソッド選択
  - [ ] パス入力
  - [ ] レスポンス設定（ステータス、ボディ、遅延）
- [ ] `frontend/src/components/mock/ResponsePreview.tsx` 作成
  - [ ] レスポンスプレビュー表示
- [ ] `frontend/src/app/mock/page.tsx` 作成
  - [ ] モックAPI管理画面
- [ ] コンポーネントのテスト作成

**コミット**: `feat: implement mock API management UI`

**Phase 3 完了時のテスト**:
- [ ] モックエンドポイントの作成ができること
- [ ] パスパラメータが正しく機能すること
- [ ] curlで作成したモックにアクセスできること
- [ ] レスポンスの遅延が機能すること
- [ ] 優先度が正しく機能すること
- [ ] 設定のエクスポート/インポートができること

---

### Phase 4: APIテスト機能 (約5-7時間)

**目標**: Spring Boot APIエンドポイントをテストするクライアント機能の実装

#### 実装タスク

##### 4.1 APIプロキシの実装 (1-2時間)

- [ ] `backend/src/routes/proxy.ts` 作成
  - [ ] `POST /api/proxy/request` - リクエストプロキシエンドポイント
  - [ ] Spring Boot APIへのリクエスト転送
  - [ ] レスポンスの取得と返却
  - [ ] タイムアウト処理
  - [ ] エラーハンドリング
- [ ] プロキシAPIのテスト作成

**コミット**: `feat: implement API proxy for Spring Boot testing`

##### 4.2 リクエストフォームの実装 (2-3時間)

- [ ] `frontend/src/components/api-test/RequestForm.tsx` 作成
  - [ ] HTTPメソッド選択
  - [ ] URL入力
  - [ ] ヘッダー編集機能
  - [ ] リクエストボディ入力（JSON）
  - [ ] 送信ボタン
- [ ] `frontend/src/components/api-test/HeaderEditor.tsx` 作成
  - [ ] ヘッダーの追加/削除/編集
- [ ] コンポーネントのテスト作成

**コミット**: `feat: implement API request form component`

##### 4.3 レスポンス表示とリクエスト履歴の実装 (2-3時間)

- [ ] `frontend/src/components/api-test/ResponseViewer.tsx` 作成
  - [ ] ステータスコード表示
  - [ ] レスポンスヘッダー表示
  - [ ] レスポンスボディ表示（JSON整形）
  - [ ] レスポンス時間表示
  - [ ] エラー表示
- [ ] `frontend/src/components/api-test/RequestHistory.tsx` 作成
  - [ ] リクエスト履歴一覧
  - [ ] 履歴からの再実行機能
  - [ ] 履歴削除機能
- [ ] `frontend/src/app/api-test/page.tsx` 作成
  - [ ] APIテスト画面のレイアウト
  - [ ] React Query統合
- [ ] LocalStorageとの連携
- [ ] コンポーネントのテスト作成

**コミット**: `feat: implement response viewer and request history`

**Phase 4 完了時のテスト**:
- [ ] リクエストを送信してレスポンスが表示されること
- [ ] ヘッダーをカスタマイズできること
- [ ] リクエストボディを設定できること
- [ ] リクエスト履歴に保存されること
- [ ] 履歴から再実行できること
- [ ] エラーが適切に表示されること

---

### Phase 5: 統合・改善・ドキュメント (約4-6時間)

**目標**: 全体の統合、UI/UX改善、ドキュメント整備

#### 実装タスク

##### 5.1 エラーハンドリングとUI改善 (2-3時間)

- [ ] 全APIエンドポイントの統一エラーレスポンス
- [ ] トースト通知の実装
- [ ] ローディング状態の統一実装
- [ ] エラーバウンダリーの実装
- [ ] レスポンシブ対応の確認と修正
- [ ] アクセシビリティの確認
- [ ] パフォーマンスの最適化

**コミット**: `feat: improve error handling and UI consistency`

##### 5.2 統合テストとE2Eテスト (1-2時間)

- [ ] 全機能を通したE2Eテストシナリオ作成
- [ ] テストの実行と修正
- [ ] CI/CD設定（オプション）

**コミット**: `test: add integration and E2E tests`

##### 5.3 ドキュメント整備 (1-2時間)

- [ ] `README.md` の充実
  - [ ] セットアップ手順
  - [ ] 使い方ガイド
  - [ ] スクリーンショット追加
- [ ] `docs/API.md` の作成
  - [ ] 全APIエンドポイントの仕様
- [ ] `docs/SETUP.md` の作成
  - [ ] 詳細なセットアップガイド
- [ ] コード内コメントの追加

**コミット**: `docs: add comprehensive documentation`

---

## 🧪 テスト戦略

### 単体テスト (vitest)

**バックエンド**:
- DDLパーサーのロジック
- 依存関係解決アルゴリズム
- モックマッチングロジック
- データバリデーション

**フロントエンド**:
- ユーティリティ関数
- カスタムフック
- コンポーネントロジック

### 統合テスト

- APIエンドポイントのテスト
- データベース操作のテスト
- モックエンドポイントの動作テスト

### E2Eテスト（オプション）

- ユーザーフロー全体のテスト
- ブラウザ自動化テスト

---

## 📦 コミット戦略

### コミットメッセージ規約

```
<type>: <subject>

[optional body]

[optional footer]
```

**Type一覧**:
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント
- `style`: フォーマット
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `chore`: ビルド・設定変更

### マイルストーン

1. **Phase 0完了**: 基本環境構築
2. **Phase 1完了**: テーブル作成機能
3. **Phase 2完了**: データ入力機能
4. **Phase 3完了**: モックAPI機能
5. **Phase 4完了**: APIテスト機能
6. **Phase 5完了**: 統合・改善完了

---

## 🎯 成功基準

### 機能要件
- [ ] DDLから自動的にテーブルが作成できる
- [ ] テーブルデータをGUIで管理できる
- [ ] 外部APIをモック化できる
- [ ] Spring Boot APIのエンドポイントをテストできる

### 非機能要件
- [ ] 各機能にテストが実装されている（カバレッジ70%以上目標）
- [ ] エラーハンドリングが適切に実装されている
- [ ] レスポンシブデザインになっている
- [ ] LocalStorageでデータが永続化されている
- [ ] ドキュメントが整備されている

---

## 📝 備考

- 各フェーズは独立して実装・テスト・コミット可能
- 機能実装後は必ずテストを書く
- コミットは小さく、頻繁に行う
- 各フェーズ完了時に動作確認を行う
- 問題が発生した場合は早期に修正する

---

**次のステップ**: Phase 0から順次実装を開始します。
