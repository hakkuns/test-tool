import { z } from 'zod';

// APIテスト設定スキーマ
export const apiTestConfigSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']),
  url: z.string().url(),
  headers: z.record(z.string()).optional(),
  body: z.any().optional(),
  timeout: z.number().positive().optional(),
});

// テーブルデータスキーマ
export const tableDataSchema = z.object({
  tableName: z.string().min(1),
  rows: z.array(z.record(z.any())),
  truncateBefore: z.boolean().optional().default(false),
});

// DDLテーブルスキーマ
export const ddlTableSchema = z.object({
  name: z.string().min(1),
  ddl: z.string().min(1),
  dependencies: z.array(z.string()),
  order: z.number().int().min(0),
});

// モックエンドポイントスキーマ
export const mockEndpointSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  enabled: z.boolean(),
  priority: z.number().int().min(0),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  path: z.string(),
  requestMatch: z
    .object({
      query: z.record(z.string()).optional(),
      body: z.any().optional(),
      headers: z.record(z.string()).optional(),
    })
    .optional(),
  response: z.object({
    status: z.number().int(),
    headers: z.record(z.string()).optional(),
    body: z.any(),
    delay: z.number().nonnegative().optional(),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// テストシナリオスキーマ
export const testScenarioSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  targetApi: apiTestConfigSchema,
  tables: z.array(ddlTableSchema),
  tableData: z.array(tableDataSchema),
  mockApis: z.array(mockEndpointSchema),
  expectedResponse: z
    .object({
      status: z.number().optional(),
      body: z.any().optional(),
      headers: z.record(z.string()).optional(),
    })
    .optional(),
  tags: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// シナリオエクスポートスキーマ
export const scenarioExportSchema = z.object({
  version: z.string(),
  exportedAt: z.string(),
  scenario: testScenarioSchema,
});

// 作成時の入力スキーマ（IDやタイムスタンプを省略）
export const createScenarioSchema = testScenarioSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// 更新時の入力スキーマ
export const updateScenarioSchema = testScenarioSchema.partial().omit({
  id: true,
  createdAt: true,
});
