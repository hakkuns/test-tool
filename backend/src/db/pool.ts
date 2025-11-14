import pg from 'pg'

const { Pool } = pg

// 環境変数からデータベースURLを取得
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://demouser:demopassword@localhost:5432/demoapp'

// 接続プールの作成
export const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20, // 最大接続数
  idleTimeoutMillis: 30000, // アイドルタイムアウト
  connectionTimeoutMillis: 2000, // 接続タイムアウト
})

// プールエラーハンドリング
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
})

// データベース接続のテスト
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect()
    const result = await client.query('SELECT NOW()')
    client.release()
    console.log('✅ PostgreSQL connected:', result.rows[0].now)
    return true
  } catch (error) {
    console.error('❌ PostgreSQL connection error:', error)
    return false
  }
}

// クリーンアップ
export async function closePool(): Promise<void> {
  await pool.end()
}
