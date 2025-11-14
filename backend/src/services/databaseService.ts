import { pool } from '../db/pool'
import type { PoolClient } from 'pg'

/**
 * DDLを実行する
 */
export async function executeDDL(ddl: string): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query(ddl)
  } finally {
    client.release()
  }
}

/**
 * 複数のDDLを順番に実行する（トランザクション内）
 */
export async function executeDDLs(ddls: string[]): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    
    for (const ddl of ddls) {
      await client.query(ddl)
    }
    
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

/**
 * テーブルのカラム情報を取得する
 */
export async function getTableColumns(tableName: string) {
  const query = `
    SELECT 
      column_name,
      data_type,
      is_nullable,
      column_default,
      character_maximum_length,
      numeric_precision,
      numeric_scale
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
    ORDER BY ordinal_position
  `
  
  const result = await pool.query(query, [tableName])
  return result.rows
}

/**
 * データベース内の全テーブル一覧を取得する
 */
export async function getTables() {
  const query = `
    SELECT 
      table_name,
      (
        SELECT COUNT(*) 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND columns.table_name = tables.table_name
      ) as column_count
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `
  
  const result = await pool.query(query)
  return result.rows
}

/**
 * テーブルにデータを挿入する
 */
export async function insertData(
  tableName: string,
  data: Record<string, any>[]
): Promise<number> {
  if (data.length === 0) {
    return 0
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    let insertedCount = 0

    for (const row of data) {
      const columns = Object.keys(row)
      const values = Object.values(row)
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ')

      const query = `
        INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')})
        VALUES (${placeholders})
      `

      await client.query(query, values)
      insertedCount++
    }

    await client.query('COMMIT')
    return insertedCount
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

/**
 * テーブルのデータを全削除する
 */
export async function truncateTable(tableName: string): Promise<void> {
  await pool.query(`TRUNCATE TABLE "${tableName}" CASCADE`)
}

/**
 * テーブルを削除する
 */
export async function dropTable(tableName: string): Promise<void> {
  await pool.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`)
}
