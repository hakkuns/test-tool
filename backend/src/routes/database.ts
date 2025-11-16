import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import * as dbService from '../services/databaseService';
import { testConnection } from '../db/pool';
import pkg from 'pg';
const { Pool } = pkg;

const database = new Hono();

// DB接続テスト用スキーマ
const testConnectionSchema = z.object({
  host: z.string().min(1, 'Host is required'),
  port: z.number().int().positive(),
  database: z.string().min(1, 'Database is required'),
  user: z.string().min(1, 'User is required'),
  password: z.string().optional(),
  ssl: z.boolean().optional(),
});

// 任意のDB接続をテスト
database.post(
  '/test-connection',
  zValidator('json', testConnectionSchema),
  async (c) => {
    try {
      const config = c.req.valid('json');

      // 一時的なプールを作成してテスト
      const testPool = new Pool({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.password || undefined,
        ssl: config.ssl ? { rejectUnauthorized: false } : false,
        max: 1,
        connectionTimeoutMillis: 5000,
      });

      try {
        const client = await testPool.connect();
        await client.query('SELECT 1');
        client.release();

        return c.json({
          success: true,
          message: 'Connection successful',
        });
      } catch (error: any) {
        return c.json(
          {
            success: false,
            error: error.message || 'Connection failed',
          },
          400
        );
      } finally {
        await testPool.end();
      }
    } catch (error: any) {
      return c.json(
        {
          success: false,
          error: error.message || 'Invalid connection parameters',
        },
        400
      );
    }
  }
);

// ヘルスチェック（DB接続確認）
database.get('/health', async (c) => {
  const isConnected = await testConnection();
  return c.json(
    {
      status: isConnected ? 'ok' : 'error',
      database: isConnected ? 'connected' : 'disconnected',
    },
    isConnected ? 200 : 503
  );
});

// テーブル一覧取得
database.get('/tables', async (c) => {
  try {
    const tables = await dbService.getTables();
    return c.json({ tables });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// テーブルのカラム情報取得
database.get('/tables/:tableName/columns', async (c) => {
  try {
    const tableName = c.req.param('tableName');
    const columns = await dbService.getTableColumns(tableName);
    return c.json({ tableName, columns });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// テーブルのキー情報取得（プライマリキー、外部キー）
database.get('/tables/:tableName/keys', async (c) => {
  try {
    const tableName = c.req.param('tableName');
    const keyInfo = await dbService.getTableKeyInfo(tableName);
    return c.json({ tableName, ...keyInfo });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// DDL実行
const executeDDLSchema = z.object({
  ddl: z.string().min(1, 'DDL is required'),
});

database.post(
  '/execute-ddl',
  zValidator('json', executeDDLSchema),
  async (c) => {
    try {
      const { ddl } = c.req.valid('json');
      await dbService.executeDDL(ddl);
      return c.json({ message: 'DDL executed successfully' });
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  }
);

// 複数DDL実行
const executeDDLsSchema = z.object({
  ddls: z.array(z.string().min(1)).min(1, 'At least one DDL is required'),
});

database.post(
  '/execute-ddls',
  zValidator('json', executeDDLsSchema),
  async (c) => {
    try {
      const { ddls } = c.req.valid('json');
      await dbService.executeDDLs(ddls);
      return c.json({ message: `${ddls.length} DDLs executed successfully` });
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  }
);

// データ挿入
const insertDataSchema = z.object({
  tableName: z.string().min(1, 'Table name is required'),
  data: z.array(z.record(z.any())).min(1, 'At least one row is required'),
});

database.post(
  '/insert-data',
  zValidator('json', insertDataSchema),
  async (c) => {
    try {
      const { tableName, data } = c.req.valid('json');
      const insertedCount = await dbService.insertData(tableName, data);
      return c.json({
        message: `${insertedCount} rows inserted successfully`,
        insertedCount,
      });
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  }
);

// テーブルデータ削除
database.delete('/tables/:tableName/truncate', async (c) => {
  try {
    const tableName = c.req.param('tableName');
    await dbService.truncateTable(tableName);
    return c.json({ message: `Table ${tableName} truncated successfully` });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// テーブル削除
database.delete('/tables/:tableName', async (c) => {
  try {
    const tableName = c.req.param('tableName');
    await dbService.dropTable(tableName);
    return c.json({ message: `Table ${tableName} dropped successfully` });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// テーブルデータエクスポート
database.get('/data/:tableName', async (c) => {
  try {
    const tableName = c.req.param('tableName');
    const tableData = await dbService.exportTableData(tableName);
    return c.json({
      success: true,
      data: tableData,
    });
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message,
      },
      400
    );
  }
});

// 全テーブルデータエクスポート
database.get('/data/export/all', async (c) => {
  try {
    const allTableData = await dbService.exportAllTableData();
    return c.json({
      success: true,
      data: allTableData,
      count: allTableData.length,
    });
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message,
      },
      500
    );
  }
});

// テーブルデータインポート
const importDataSchema = z.object({
  tableName: z.string().min(1),
  rows: z.array(z.record(z.any())),
  truncateBefore: z.boolean().optional(),
});

database.post(
  '/data/import',
  zValidator('json', importDataSchema),
  async (c) => {
    try {
      const tableData = c.req.valid('json');
      console.log('Importing data:', {
        tableName: tableData.tableName,
        rowCount: tableData.rows.length,
        sampleRow: tableData.rows[0],
      });
      const insertedCount = await dbService.importTableData(tableData);
      return c.json({
        success: true,
        message: `${insertedCount} rows imported successfully`,
        insertedCount,
      });
    } catch (error: any) {
      console.error('Import error:', error.message);
      return c.json(
        {
          success: false,
          error: error.message,
        },
        400
      );
    }
  }
);

export default database;
