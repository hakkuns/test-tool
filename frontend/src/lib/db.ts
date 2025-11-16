import Dexie, { type EntityTable } from 'dexie';
import type { TestScenario as ScenarioType } from '@/types/scenario';

// シナリオの型（IndexedDB用にidをnumberに）
export interface TestScenario extends Omit<ScenarioType, 'id'> {
  id?: number;
  scenarioId: string; // 元のUUID
}

// テーブル定義の型
export interface DDLTable {
  id?: number;
  name: string;
  ddl: string;
  dependencies: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

// テストデータの型
export interface TableData {
  id?: number;
  tableName: string;
  rows: Record<string, any>[];
  createdAt: string;
  updatedAt: string;
}

// モックエンドポイントの型
export interface MockEndpoint {
  id?: number;
  name?: string;
  enabled: boolean;
  priority: number;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  requestMatch?: {
    query?: Record<string, string>;
    body?: any;
    headers?: Record<string, string>;
  };
  response: {
    status: number;
    headers?: Record<string, string>;
    body: any;
    delay?: number;
  };
  createdAt: string;
  updatedAt: string;
}

// APIリクエスト履歴の型
export interface ApiRequestHistory {
  id?: number;
  name?: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers: Record<string, string>;
  body?: string;
  response?: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: any;
    duration: number;
  };
  error?: string;
  createdAt: string;
}

// データベース接続情報の型
export interface DatabaseConnection {
  id?: number;
  name: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// IndexedDB データベース定義
const db = new Dexie('PostgresTestHelperDB') as Dexie & {
  scenarios: EntityTable<TestScenario, 'id'>;
  ddlTables: EntityTable<DDLTable, 'id'>;
  tableData: EntityTable<TableData, 'id'>;
  mockEndpoints: EntityTable<MockEndpoint, 'id'>;
  apiHistory: EntityTable<ApiRequestHistory, 'id'>;
  dbConnections: EntityTable<DatabaseConnection, 'id'>;
};

// スキーマ定義
db.version(1).stores({
  ddlTables: '++id, name, order, createdAt',
  tableData: '++id, tableName, createdAt',
  mockEndpoints: '++id, path, method, priority, enabled, createdAt',
  apiHistory: '++id, method, url, createdAt',
});

// バージョン2: scenariosストアを追加
db.version(2).stores({
  scenarios: '++id, scenarioId, name, createdAt, updatedAt',
  ddlTables: '++id, name, order, createdAt',
  tableData: '++id, tableName, createdAt',
  mockEndpoints: '++id, path, method, priority, enabled, createdAt',
  apiHistory: '++id, method, url, createdAt',
});

// バージョン3: scenarioIdにユニーク制約を追加
db.version(3)
  .stores({
    scenarios: '++id, &scenarioId, name, createdAt, updatedAt',
    ddlTables: '++id, name, order, createdAt',
    tableData: '++id, tableName, createdAt',
    mockEndpoints: '++id, path, method, priority, enabled, createdAt',
    apiHistory: '++id, method, url, createdAt',
  })
  .upgrade(async (trans) => {
    // 既存のシナリオから重複を削除
    const scenarios = await trans.table('scenarios').toArray();
    const seen = new Set<string>();
    const toDelete: number[] = [];

    for (const scenario of scenarios) {
      if (seen.has(scenario.scenarioId)) {
        // 重複している場合は削除対象に追加
        if (scenario.id) {
          toDelete.push(scenario.id);
        }
      } else {
        seen.add(scenario.scenarioId);
      }
    }

    // 重複レコードを削除
    for (const id of toDelete) {
      await trans.table('scenarios').delete(id);
    }

    console.log(`Removed ${toDelete.length} duplicate scenarios`);
  });

// バージョン4: 強制的にクリーンアップ
db.version(4)
  .stores({
    scenarios: '++id, &scenarioId, name, createdAt, updatedAt',
    ddlTables: '++id, name, order, createdAt',
    tableData: '++id, tableName, createdAt',
    mockEndpoints: '++id, path, method, priority, enabled, createdAt',
    apiHistory: '++id, method, url, createdAt',
  })
  .upgrade(async (trans) => {
    // 再度重複チェック
    const scenarios = await trans.table('scenarios').toArray();
    const seen = new Set<string>();
    const toDelete: number[] = [];

    for (const scenario of scenarios) {
      if (seen.has(scenario.scenarioId)) {
        if (scenario.id) {
          toDelete.push(scenario.id);
        }
      } else {
        seen.add(scenario.scenarioId);
      }
    }

    for (const id of toDelete) {
      await trans.table('scenarios').delete(id);
    }

    if (toDelete.length > 0) {
      console.log(
        `Version 4: Removed ${toDelete.length} remaining duplicate scenarios`
      );
    }
  });

// バージョン5: データベース接続情報ストアを追加
db.version(5).stores({
  scenarios: '++id, &scenarioId, name, createdAt, updatedAt',
  ddlTables: '++id, name, order, createdAt',
  tableData: '++id, tableName, createdAt',
  mockEndpoints: '++id, path, method, priority, enabled, createdAt',
  apiHistory: '++id, method, url, createdAt',
  dbConnections: '++id, name, isActive, createdAt, updatedAt',
});

export { db };
