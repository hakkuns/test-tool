export interface DDLTable {
  name: string;
  ddl: string;
  dependencies: string[];
  order: number;
}

export interface ParsedColumn {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  isPrimaryKey: boolean;
  references?: {
    table: string;
    column: string;
  };
}

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
    body?: any;
    delay?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ApiRequest {
  id: string;
  name?: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  body?: string;
  createdAt: string;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  duration: number;
  timestamp: string;
}

// テストシナリオ管理用の型定義

export interface ScenarioGroup {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiTestConfig {
  id?: string;
  name?: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  url: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

export interface TableData {
  tableName: string;
  rows: Record<string, any>[];
  truncateBefore?: boolean;
  readOnly?: boolean;
}

export interface TestScenario {
  id: string;
  groupId?: string;
  groupName?: string;
  name: string;
  description?: string;
  targetApi: ApiTestConfig;
  tables: DDLTable[];
  tableData: TableData[];
  mockApis: MockEndpoint[];
  testSettings?: {
    headers?: Record<string, string>;
    body?: string;
  };
  expectedResponse?: {
    status?: number;
    body?: any;
    headers?: Record<string, string>;
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ScenarioExport {
  version: string;
  exportedAt: string;
  scenario: TestScenario;
}
