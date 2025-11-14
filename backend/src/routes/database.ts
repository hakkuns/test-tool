import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import * as dbService from '../services/databaseService'
import { testConnection } from '../db/pool'

const database = new Hono()

// ヘルスチェック（DB接続確認）
database.get('/health', async (c) => {
  const isConnected = await testConnection()
  return c.json({
    status: isConnected ? 'ok' : 'error',
    database: isConnected ? 'connected' : 'disconnected',
  }, isConnected ? 200 : 503)
})

// テーブル一覧取得
database.get('/tables', async (c) => {
  try {
    const tables = await dbService.getTables()
    return c.json({ tables })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

// テーブルのカラム情報取得
database.get('/tables/:tableName/columns', async (c) => {
  try {
    const tableName = c.req.param('tableName')
    const columns = await dbService.getTableColumns(tableName)
    return c.json({ tableName, columns })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

// DDL実行
const executeDDLSchema = z.object({
  ddl: z.string().min(1, 'DDL is required'),
})

database.post('/execute-ddl', zValidator('json', executeDDLSchema), async (c) => {
  try {
    const { ddl } = c.req.valid('json')
    await dbService.executeDDL(ddl)
    return c.json({ message: 'DDL executed successfully' })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// 複数DDL実行
const executeDDLsSchema = z.object({
  ddls: z.array(z.string().min(1)).min(1, 'At least one DDL is required'),
})

database.post('/execute-ddls', zValidator('json', executeDDLsSchema), async (c) => {
  try {
    const { ddls } = c.req.valid('json')
    await dbService.executeDDLs(ddls)
    return c.json({ message: `${ddls.length} DDLs executed successfully` })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// データ挿入
const insertDataSchema = z.object({
  tableName: z.string().min(1, 'Table name is required'),
  data: z.array(z.record(z.any())).min(1, 'At least one row is required'),
})

database.post('/insert-data', zValidator('json', insertDataSchema), async (c) => {
  try {
    const { tableName, data } = c.req.valid('json')
    const insertedCount = await dbService.insertData(tableName, data)
    return c.json({ 
      message: `${insertedCount} rows inserted successfully`,
      insertedCount 
    })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// テーブルデータ削除
database.delete('/tables/:tableName/truncate', async (c) => {
  try {
    const tableName = c.req.param('tableName')
    await dbService.truncateTable(tableName)
    return c.json({ message: `Table ${tableName} truncated successfully` })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// テーブル削除
database.delete('/tables/:tableName', async (c) => {
  try {
    const tableName = c.req.param('tableName')
    await dbService.dropTable(tableName)
    return c.json({ message: `Table ${tableName} dropped successfully` })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

export default database
