/**
 * シナリオテストで使用する定数変換ユーティリティ
 */

import { randomUUID } from 'crypto';

/**
 * $SEQ形式の16桁文字列を生成
 * TST + 13桁のタイムスタンプ
 */
function generateSeq(): string {
  const timestamp = Date.now().toString().padStart(13, '0');
  return `TST${timestamp}`;
}

/**
 * $TIMESTAMP を現在時刻(ISO8601形式)に変換
 */
function generateTimestamp(): string {
  return new Date().toISOString();
}

/**
 * $UNIX_TIMESTAMP を現在のUnixタイムスタンプ(ミリ秒)に変換
 */
function generateUnixTimestamp(): string {
  return Date.now().toString();
}

/**
 * $UUID をランダムなUUIDv4に変換
 */
function generateUuid(): string {
  return randomUUID();
}

/**
 * $RANDOM_STRING を8桁のランダム文字列に変換
 */
function generateRandomString(): string {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * サポートされている定数のマップ
 */
const CONSTANT_GENERATORS: Record<string, () => string> = {
  $SEQ: generateSeq,
  $TIMESTAMP: generateTimestamp,
  $UNIX_TIMESTAMP: generateUnixTimestamp,
  $UUID: generateUuid,
  $RANDOM_STRING: generateRandomString,
};

/**
 * 文字列内の定数($XXX)を実際の値に変換する
 * @param value 変換対象の文字列
 * @returns 定数が変換された文字列
 */
export function replaceConstants(value: string): string {
  let result = value;

  // 各定数パターンをチェックして置換
  for (const [constant, generator] of Object.entries(CONSTANT_GENERATORS)) {
    if (result.includes(constant)) {
      const generatedValue = generator();
      result = result.replaceAll(constant, generatedValue);
    }
  }

  return result;
}

/**
 * オブジェクト内の全ての文字列値に対して定数変換を適用
 * @param obj 変換対象のオブジェクト
 * @returns 定数が変換されたオブジェクト
 */
export function replaceConstantsInObject<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return replaceConstants(obj) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => replaceConstantsInObject(item)) as T;
  }

  if (typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = replaceConstantsInObject(value);
    }
    return result as T;
  }

  return obj;
}

/**
 * ヘッダーオブジェクト内の定数を変換
 */
export function replaceConstantsInHeaders(
  headers: Record<string, string>
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    result[key] = replaceConstants(value);
  }
  return result;
}

/**
 * サポートされている定数のリストを取得
 */
export function getSupportedConstants(): string[] {
  return Object.keys(CONSTANT_GENERATORS);
}
