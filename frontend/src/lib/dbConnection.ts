import { db, type DatabaseConnection } from "./db";

/**
 * アクティブなDB接続を取得
 */
export async function getActiveConnection(): Promise<DatabaseConnection | null> {
  const connections = await db.dbConnections
    .where("isActive")
    .equals(1)
    .toArray();
  return connections[0] || null;
}

/**
 * すべてのDB接続を取得
 */
export async function getAllConnections(): Promise<DatabaseConnection[]> {
  return db.dbConnections.orderBy("createdAt").reverse().toArray();
}

/**
 * DB接続を保存
 */
export async function saveConnection(
  connection: Omit<DatabaseConnection, "id" | "createdAt" | "updatedAt">,
): Promise<number> {
  const now = new Date().toISOString();

  // 新しい接続をアクティブにする場合、他の接続を非アクティブに
  if (connection.isActive) {
    await db.dbConnections.toCollection().modify({ isActive: false });
  }

  const id = await db.dbConnections.add({
    ...connection,
    createdAt: now,
    updatedAt: now,
  });

  return id as number;
}

/**
 * DB接続を更新
 */
export async function updateConnection(
  id: number,
  updates: Partial<Omit<DatabaseConnection, "id" | "createdAt">>,
): Promise<void> {
  const now = new Date().toISOString();

  // アクティブにする場合、他の接続を非アクティブに
  if (updates.isActive) {
    await db.dbConnections.toCollection().modify({ isActive: false });
  }

  await db.dbConnections.update(id, {
    ...updates,
    updatedAt: now,
  });
}

/**
 * DB接続を削除
 */
export async function deleteConnection(id: number): Promise<void> {
  await db.dbConnections.delete(id);
}

/**
 * 接続をアクティブに設定
 */
export async function setActiveConnection(id: number): Promise<void> {
  // すべての接続を非アクティブに
  await db.dbConnections.toCollection().modify({ isActive: false });

  // 指定した接続をアクティブに
  await db.dbConnections.update(id, {
    isActive: true,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * デフォルト接続に戻す（すべての接続を非アクティブに）
 */
export async function useDefaultConnection(): Promise<void> {
  await db.dbConnections.toCollection().modify({ isActive: false });
}
