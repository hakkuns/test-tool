// フロントエンド用の型定義

export interface ScenarioGroup {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DDLTable {
  name: string;
  ddl: string;
  dependencies: string[];
  order: number;
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
  encryptedColumns?: string[];
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

export interface CreateScenarioInput {
  groupId?: string;
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
}

export interface UpdateScenarioInput {
  groupId?: string;
  name?: string;
  description?: string;
  targetApi?: ApiTestConfig;
  tables?: DDLTable[];
  tableData?: TableData[];
  mockApis?: MockEndpoint[];
  testSettings?: {
    headers?: Record<string, string>;
    body?: string;
  };
  expectedResponse?: {
    status?: number;
    body?: any;
    headers?: Record<string, string>;
  };
  tags?: string[];
}

export interface ApplyScenarioResult {
  tablesCreated: number;
  dataInserted: number;
  mocksConfigured: number;
}
