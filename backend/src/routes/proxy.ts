import { Hono } from 'hono'
import { z } from 'zod'

const proxyRouter = new Hono()

// Zodスキーマ定義
const proxyRequestSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']),
  url: z.string().url(),
  headers: z.record(z.string()).optional().default({}),
  body: z.any().optional(),
  timeout: z.number().int().min(0).max(300000).optional().default(30000), // デフォルト30秒
})

/**
 * リクエストプロキシエンドポイント
 * POST /api/proxy/request
 * Spring Boot APIへのリクエストを転送
 */
proxyRouter.post('/request', async (c) => {
  const startTime = Date.now()

  try {
    const body = await c.req.json()
    const validatedData = proxyRequestSchema.parse(body)

    const { method, url, headers, body: requestBody, timeout } = validatedData

    // AbortControllerでタイムアウト設定
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      // リクエストオプション構築
      const fetchOptions: RequestInit = {
        method,
        headers: {
          ...headers,
          // Content-Typeが設定されていない場合はデフォルト設定
          ...(requestBody && !headers['Content-Type'] && !headers['content-type']
            ? { 'Content-Type': 'application/json' }
            : {}),
        },
        signal: controller.signal,
      }

      // リクエストボディがある場合は追加
      if (requestBody && method !== 'GET' && method !== 'HEAD') {
        if (typeof requestBody === 'string') {
          fetchOptions.body = requestBody
        } else {
          fetchOptions.body = JSON.stringify(requestBody)
        }
      }

      // リクエスト実行
      const response = await fetch(url, fetchOptions)

      clearTimeout(timeoutId)

      // レスポンスヘッダーを取得
      const responseHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      // レスポンスボディを取得
      const contentType = response.headers.get('content-type') || ''
      let responseBody: any

      if (contentType.includes('application/json')) {
        try {
          responseBody = await response.json()
        } catch {
          responseBody = await response.text()
        }
      } else if (contentType.includes('text/')) {
        responseBody = await response.text()
      } else {
        // バイナリデータの場合はBase64エンコード
        const buffer = await response.arrayBuffer()
        responseBody = Buffer.from(buffer).toString('base64')
      }

      const endTime = Date.now()
      const duration = endTime - startTime

      return c.json({
        success: true,
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          body: responseBody,
          duration,
          timestamp: new Date().toISOString(),
        },
      })
    } catch (fetchError: any) {
      clearTimeout(timeoutId)

      // タイムアウトエラー
      if (fetchError.name === 'AbortError') {
        return c.json(
          {
            success: false,
            error: 'Request timeout',
            message: `Request timed out after ${timeout}ms`,
            duration: Date.now() - startTime,
            timestamp: new Date().toISOString(),
          },
          408
        )
      }

      // ネットワークエラー
      return c.json(
        {
          success: false,
          error: 'Network error',
          message: fetchError.message || 'Failed to connect to the API',
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
        502
      )
    }
  } catch (error) {
    console.error('Proxy error:', error)

    if (error instanceof z.ZodError) {
      return c.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        400
      )
    }

    return c.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
      500
    )
  }
})

export default proxyRouter
