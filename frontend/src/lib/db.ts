import Dexie, { type EntityTable } from 'dexie'

// テーブル定義の型
export interface DDLTable {
  id?: number
  name: string
  ddl: string
  dependencies: string[]
  order: number
  createdAt: string
  updatedAt: string
}

// テストデータの型
export interface TableData {
  id?: number
  tableName: string
  rows: Record<string, any>[]
  createdAt: string
  updatedAt: string
}

// モックエンドポイントの型
export interface MockEndpoint {
  id?: number
  name?: string
  enabled: boolean
  priority: number
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  requestMatch?: {
    query?: Record<string, string>
    body?: any
    headers?: Record<string, string>
  }
  response: {
    status: number
    headers?: Record<string, string>
    body: any
    delay?: number
  }
  createdAt: string
  updatedAt: string
}

// APIリクエスト履歴の型
export interface ApiRequestHistory {
  id?: number
  name?: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
  headers: Record<string, string>
  body?: string
  response?: {
    status: number
    statusText: string
    headers: Record<string, string>
    body: any
    duration: number
  }
  error?: string
  createdAt: string
}

// IndexedDB データベース定義
const db = new Dexie('PostgresTestHelperDB') as Dexie & {
  ddlTables: EntityTable<DDLTable, 'id'>
  tableData: EntityTable<TableData, 'id'>
  mockEndpoints: EntityTable<MockEndpoint, 'id'>
  apiHistory: EntityTable<ApiRequestHistory, 'id'>
}

// スキーマ定義
db.version(1).stores({
  ddlTables: '++id, name, order, createdAt',
  tableData: '++id, tableName, createdAt',
  mockEndpoints: '++id, path, method, priority, enabled, createdAt',
  apiHistory: '++id, method, url, createdAt',
})

export { db }
