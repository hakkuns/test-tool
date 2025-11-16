import type { MockEndpoint } from '../types/index'

/**
 * モックエンドポイント管理サービス
 */
class MockService {
  private endpoints: Map<string, MockEndpoint> = new Map()

  /**
   * すべてのモックエンドポイントを取得
   */
  getAllEndpoints(): MockEndpoint[] {
    return Array.from(this.endpoints.values())
      .sort((a, b) => b.priority - a.priority)
  }

  /**
   * 有効なモックエンドポイントのみ取得
   */
  getEnabledEndpoints(): MockEndpoint[] {
    return this.getAllEndpoints().filter((endpoint) => endpoint.enabled)
  }

  /**
   * IDでモックエンドポイントを取得
   */
  getEndpointById(id: string): MockEndpoint | undefined {
    return this.endpoints.get(id)
  }

  /**
   * モックエンドポイントを作成
   */
  createEndpoint(
    endpoint: Omit<MockEndpoint, 'id' | 'createdAt' | 'updatedAt'>
  ): MockEndpoint {
    const id = this.generateId()
    const now = new Date().toISOString()
    const newEndpoint: MockEndpoint = {
      ...endpoint,
      id,
      createdAt: now,
      updatedAt: now,
    }
    this.endpoints.set(id, newEndpoint)
    return newEndpoint
  }

  /**
   * モックエンドポイントを更新
   */
  updateEndpoint(
    id: string,
    updates: Partial<Omit<MockEndpoint, 'id' | 'createdAt' | 'updatedAt'>>
  ): MockEndpoint | null {
    const endpoint = this.endpoints.get(id)
    if (!endpoint) {
      return null
    }
    const updated: MockEndpoint = {
      ...endpoint,
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    this.endpoints.set(id, updated)
    return updated
  }

  /**
   * モックエンドポイントを削除
   */
  deleteEndpoint(id: string): boolean {
    return this.endpoints.delete(id)
  }

  /**
   * すべてのモックエンドポイントを削除
   */
  deleteAllEndpoints(): void {
    this.endpoints.clear()
  }

  /**
   * モックエンドポイントのエクスポート
   */
  exportEndpoints(): MockEndpoint[] {
    return this.getAllEndpoints()
  }

  /**
   * モックエンドポイントのインポート
   */
  importEndpoints(endpoints: MockEndpoint[]): void {
    this.endpoints.clear()
    for (const endpoint of endpoints) {
      this.endpoints.set(endpoint.id, endpoint)
    }
  }

  /**
   * リクエストに一致するモックエンドポイントを検索
   */
  findMatchingMock(
    method: string,
    path: string,
    query?: Record<string, string>,
    body?: any,
    headers?: Record<string, string>
  ): MockEndpoint | null {
    const enabledEndpoints = this.getEnabledEndpoints()

    for (const endpoint of enabledEndpoints) {
      // HTTPメソッドチェック
      if (endpoint.method !== method.toUpperCase()) {
        continue
      }

      // パスパターンマッチング
      const pathMatch = this.matchPathPattern(endpoint.path, path)
      if (!pathMatch.isMatch) {
        continue
      }

      // requestMatchが存在する場合は詳細マッチング
      if (endpoint.requestMatch) {
        // クエリパラメータチェック
        if (
          endpoint.requestMatch.query &&
          !this.matchObject(endpoint.requestMatch.query, query || {})
        ) {
          continue
        }

        // リクエストボディチェック
        if (endpoint.requestMatch.body && !this.matchObject(endpoint.requestMatch.body, body)) {
          continue
        }

        // ヘッダーチェック（大文字小文字区別なし）
        if (endpoint.requestMatch.headers) {
          const normalizedHeaders = this.normalizeHeaders(headers || {})
          const normalizedMatchHeaders = this.normalizeHeaders(endpoint.requestMatch.headers)
          if (!this.matchObject(normalizedMatchHeaders, normalizedHeaders)) {
            continue
          }
        }
      }

      // すべての条件に一致
      return endpoint
    }

    return null
  }

  /**
   * パスパターンマッチング（パラメータ対応）
   * 例: /users/:id は /users/123 にマッチ
   */
  matchPathPattern(
    pattern: string,
    actualPath: string
  ): { isMatch: boolean; params: Record<string, string> } {
    const params: Record<string, string> = {}

    // パターンと実際のパスをセグメントに分割
    const patternSegments = pattern.split('/').filter(Boolean)
    const pathSegments = actualPath.split('/').filter(Boolean)

    // セグメント数が異なる場合は不一致
    if (patternSegments.length !== pathSegments.length) {
      return { isMatch: false, params }
    }

    // 各セグメントを比較
    for (let i = 0; i < patternSegments.length; i++) {
      const patternSeg = patternSegments[i]
      const pathSeg = pathSegments[i]

      // パラメータ（:で始まる）の場合
      if (patternSeg.startsWith(':')) {
        const paramName = patternSeg.slice(1)
        params[paramName] = pathSeg
        continue
      }

      // 通常のセグメントは完全一致
      if (patternSeg !== pathSeg) {
        return { isMatch: false, params }
      }
    }

    return { isMatch: true, params }
  }

  /**
   * レスポンスボディにパスパラメータを埋め込む
   */
  interpolateResponse(response: any, params: Record<string, string>): any {
    if (typeof response === 'string') {
      return this.interpolateString(response, params)
    }

    if (Array.isArray(response)) {
      return response.map((item) => this.interpolateResponse(item, params))
    }

    if (typeof response === 'object' && response !== null) {
      const result: any = {}
      for (const [key, value] of Object.entries(response)) {
        result[key] = this.interpolateResponse(value, params)
      }
      return result
    }

    return response
  }

  /**
   * 文字列内のパラメータを置換
   * 例: "User {{id}}" + {id: "123"} => "User 123"
   */
  private interpolateString(str: string, params: Record<string, string>): string {
    return str.replace(/\{\{(\w+)\}\}/g, (_, paramName) => {
      return params[paramName] || ''
    })
  }

  /**
   * オブジェクトの部分一致をチェック
   */
  private matchObject(pattern: any, actual: any): boolean {
    if (typeof pattern !== 'object' || pattern === null) {
      return pattern === actual
    }

    if (typeof actual !== 'object' || actual === null) {
      return false
    }

    for (const [key, value] of Object.entries(pattern)) {
      if (typeof value === 'object' && value !== null) {
        if (!this.matchObject(value, actual[key])) {
          return false
        }
      } else if (actual[key] !== value) {
        return false
      }
    }

    return true
  }

  /**
   * ヘッダーを正規化（小文字化）
   */
  private normalizeHeaders(headers: Record<string, string>): Record<string, string> {
    const normalized: Record<string, string> = {}
    for (const [key, value] of Object.entries(headers)) {
      normalized[key.toLowerCase()] = value
    }
    return normalized
  }

  /**
   * ユニークIDを生成
   */
  private generateId(): string {
    return `mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }
}

export const mockService = new MockService()
