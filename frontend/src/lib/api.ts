export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// API呼び出し用のヘルパー関数
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// Health check
export async function checkHealth() {
  return fetchAPI<{ status: string; message: string; timestamp: string }>(
    '/health'
  );
}

// プロキシを通じてSpring Boot APIにリクエスト
export async function proxyRequest(data: {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
  timeout?: number;
}) {
  return fetchAPI<{
    success: boolean;
    response?: {
      status: number;
      statusText: string;
      headers: Record<string, string>;
      body: any;
      duration: number;
      timestamp: string;
    };
    error?: string;
    message?: string;
    duration?: number;
    timestamp?: string;
  }>('/api/proxy/request', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Mock API Types
export interface MockEndpoint {
  id: string;
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

// Mock API - エンドポイント一覧取得
export async function getMockEndpoints() {
  return fetchAPI<{
    success: boolean;
    data: MockEndpoint[];
    count: number;
  }>('/api/mock/endpoints');
}

// Mock API - エンドポイント作成
export async function createMockEndpoint(
  data: Omit<MockEndpoint, 'id' | 'createdAt' | 'updatedAt'>
) {
  return fetchAPI<{
    success: boolean;
    data: MockEndpoint;
    message: string;
  }>('/api/mock/endpoints', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Mock API - エンドポイント更新
export async function updateMockEndpoint(
  id: string,
  data: Partial<Omit<MockEndpoint, 'id' | 'createdAt' | 'updatedAt'>>
) {
  return fetchAPI<{
    success: boolean;
    data: MockEndpoint;
    message: string;
  }>(`/api/mock/endpoints/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Mock API - エンドポイント削除
export async function deleteMockEndpoint(id: string) {
  return fetchAPI<{
    success: boolean;
    message: string;
  }>(`/api/mock/endpoints/${id}`, {
    method: 'DELETE',
  });
}

// Mock API - 全エンドポイント削除
export async function deleteAllMockEndpoints() {
  return fetchAPI<{
    success: boolean;
    message: string;
  }>('/api/mock/endpoints', {
    method: 'DELETE',
  });
}

// Mock API - エクスポート
export async function exportMockEndpoints() {
  return fetchAPI<{
    success: boolean;
    data: MockEndpoint[];
    exportedAt: string;
  }>('/api/mock/export');
}

// Mock API - インポート
export async function importMockEndpoints(endpoints: MockEndpoint[]) {
  return fetchAPI<{
    success: boolean;
    message: string;
    count: number;
  }>('/api/mock/import', {
    method: 'POST',
    body: JSON.stringify(endpoints),
  });
}

// Database API - テーブル一覧取得
export async function getDatabaseTables() {
  return fetchAPI<{
    tables: Array<{
      table_name: string;
      column_count: string;
    }>;
  }>('/api/database/tables');
}

// Database API - DB接続状態確認
export async function checkDatabaseConnection() {
  return fetchAPI<{
    status: string;
    database: string;
  }>('/api/tables/health');
}

// Database API - テーブルスキーマ取得
export async function getTableSchema(tableName: string) {
  return fetchAPI<{
    tableName: string;
    columns: Array<{
      column_name: string;
      data_type: string;
      is_nullable: string;
      column_default: string | null;
    }>;
  }>(`/api/database/tables/${tableName}/columns`);
}
