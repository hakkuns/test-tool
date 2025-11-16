import { pool } from '../db/pool';
import type { PoolClient } from 'pg';
import type { TableData } from '../types';

/**
 * DDLを実行する
 */
export async function executeDDL(ddl: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(ddl);
  } finally {
    client.release();
  }
}

/**
 * 複数のDDLを順番に実行する（トランザクション内）
 */
export async function executeDDLs(ddls: string[]): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const ddl of ddls) {
      await client.query(ddl);
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
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
  `;

  const result = await pool.query(query, [tableName]);
  return result.rows;
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
  `;

  const result = await pool.query(query);
  return result.rows;
}

/**
 * PostgreSQLエラーを解析してユーザーフレンドリーなメッセージに変換
 */
function parsePostgresError(error: any): string {
  const message = error.message || '';
  const code = error.code || '';

  // PostgreSQLエラーコードに基づいて処理
  switch (code) {
    case '23505': // unique_violation
      // キー重複エラー
      const duplicateMatch = message.match(
        /Key \((.*?)\)=\((.*?)\) already exists/
      );
      if (duplicateMatch) {
        return `重複エラー: キー ${duplicateMatch[1]} の値 ${duplicateMatch[2]} は既に存在します`;
      }
      return '主キーまたはユニークキーの重複エラーが発生しました';

    case '23503': // foreign_key_violation
      return '外部キー制約違反: 参照先のデータが存在しません';

    case '23502': // not_null_violation
      const columnMatch = message.match(/column "(.*?)"/);
      if (columnMatch) {
        return `NOT NULL制約違反: カラム ${columnMatch[1]} に NULL は設定できません`;
      }
      return 'NOT NULL制約違反: 必須項目が入力されていません';

    case '23514': // check_constraint_violation
      return 'チェック制約違反: データが制約条件を満たしていません';

    case '42P01': // undefined_table
      return 'テーブルが存在しません';

    case '42703': // undefined_column
      const undefinedColMatch = message.match(/column "(.*?)"/);
      if (undefinedColMatch) {
        return `カラム ${undefinedColMatch[1]} が存在しません`;
      }
      return 'カラムが存在しません';

    case '22P02': // invalid_text_representation
      return 'データ型が不正です（例: 数値フィールドに文字列を入力）';

    case '22001': // string_data_right_truncation
      return '文字列が長すぎます';

    default:
      return message || 'データベースエラーが発生しました';
  }
}

/**
 * テーブルにデータを挿入する
 */
export async function insertData(
  tableName: string,
  data: Record<string, any>[]
): Promise<number> {
  if (data.length === 0) {
    return 0;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let insertedCount = 0;

    for (const row of data) {
      // 空文字列やnullを除外して、データベースのデフォルト値を使用
      const filteredRow = Object.entries(row).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      const columns = Object.keys(filteredRow);
      const values = Object.values(filteredRow);

      if (columns.length === 0) {
        // 全てのカラムが空の場合はスキップ
        continue;
      }

      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

      const query = `
        INSERT INTO "${tableName}" (${columns.map((c) => `"${c}"`).join(', ')})
        VALUES (${placeholders})
      `;

      await client.query(query, values);
      insertedCount++;
    }

    await client.query('COMMIT');
    return insertedCount;
  } catch (error) {
    await client.query('ROLLBACK');
    throw new Error(parsePostgresError(error));
  } finally {
    client.release();
  }
}

/**
 * テーブルのデータを全削除する
 */
export async function truncateTable(tableName: string): Promise<void> {
  await pool.query(`TRUNCATE TABLE "${tableName}" CASCADE`);
}

/**
 * テーブルを削除する
 */
export async function dropTable(tableName: string): Promise<void> {
  await pool.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
}

/**
 * テーブルのデータをエクスポートする
 */
export async function exportTableData(tableName: string): Promise<TableData> {
  const query = `SELECT * FROM "${tableName}"`;
  const result = await pool.query(query);

  return {
    tableName,
    rows: result.rows,
    truncateBefore: false,
  };
}

/**
 * 全テーブルのデータをエクスポートする
 */
export async function exportAllTableData(): Promise<TableData[]> {
  const tables = await getTables();
  const tableData: TableData[] = [];

  for (const table of tables) {
    const data = await exportTableData(table.table_name);
    tableData.push(data);
  }

  return tableData;
}

/**
 * テーブルデータをインポートする
 */
export async function importTableData(data: TableData): Promise<number> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // データインポート前に常にテーブルをクリア
    await client.query(`TRUNCATE TABLE "${data.tableName}" CASCADE`);

    let insertedCount = 0;

    // データを挿入
    for (const row of data.rows) {
      const columns = Object.keys(row);
      const values = Object.values(row);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

      const query = `
        INSERT INTO "${data.tableName}" (${columns
        .map((c) => `"${c}"`)
        .join(', ')})
        VALUES (${placeholders})
      `;

      await client.query(query, values);
      insertedCount++;
    }

    await client.query('COMMIT');
    return insertedCount;
  } catch (error) {
    await client.query('ROLLBACK');
    throw new Error(parsePostgresError(error));
  } finally {
    client.release();
  }
}

/**
 * テーブルのキー情報を取得する（プライマリキーと外部キー）
 */
export async function getTableKeyInfo(tableName: string) {
  const client = await pool.connect();
  try {
    // プライマリキーを取得
    const pkQuery = `
      SELECT a.attname AS column_name
      FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = $1::regclass
        AND i.indisprimary
    `;
    const pkResult = await client.query(pkQuery, [tableName]);
    const primaryKeys = pkResult.rows.map((row) => row.column_name);

    // 外部キーを取得
    const fkQuery = `
      SELECT
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = $1
        AND tc.table_schema = 'public'
    `;
    const fkResult = await client.query(fkQuery, [tableName]);
    const foreignKeys = fkResult.rows.map((row) => ({
      column: row.column_name,
      references: {
        table: row.foreign_table_name,
        column: row.foreign_column_name,
      },
    }));

    return {
      primaryKeys,
      foreignKeys,
    };
  } finally {
    client.release();
  }
}

/**
 * 複数テーブルのデータをインポートする
 */
export async function importAllTableData(dataList: TableData[]): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const data of dataList) {
      // truncateBeforeがtrueの場合、テーブルをクリア
      if (data.truncateBefore) {
        await client.query(`TRUNCATE TABLE "${data.tableName}" CASCADE`);
      }

      // データを挿入
      for (const row of data.rows) {
        const columns = Object.keys(row);
        const values = Object.values(row);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

        const query = `
          INSERT INTO "${data.tableName}" (${columns
          .map((c) => `"${c}"`)
          .join(', ')})
          VALUES (${placeholders})
        `;

        await client.query(query, values);
      }
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw new Error(parsePostgresError(error));
  } finally {
    client.release();
  }
}
