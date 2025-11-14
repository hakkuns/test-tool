import { Hono } from 'hono'
import { z } from 'zod'
import { mockService } from '../services/mockService.js'
import type { MockEndpoint } from '../types/index.js'

const mockRouter = new Hono()

// Zodスキーマ定義
const createMockEndpointSchema = z.object({
  name: z.string().optional(),
  enabled: z.boolean().default(true),
  priority: z.number().int().default(0),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  path: z.string().min(1),
  requestMatch: z
    .object({
      query: z.record(z.string()).optional(),
      body: z.any().optional(),
      headers: z.record(z.string()).optional(),
    })
    .optional(),
  response: z.object({
    status: z.number().int().min(100).max(599).default(200),
    headers: z.record(z.string()).optional(),
    body: z.any().default({}),
    delay: z.number().int().min(0).optional(),
  }),
})

const updateMockEndpointSchema = createMockEndpointSchema.partial()

const importMockEndpointsSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string().optional(),
    enabled: z.boolean(),
    priority: z.number().int(),
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
      delay: z.number().int().optional(),
    }),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
)

/**
 * モックエンドポイント一覧取得
 * GET /api/mock/endpoints
 */
mockRouter.get('/endpoints', (c) => {
  try {
    const endpoints = mockService.getAllEndpoints()
    return c.json({
      success: true,
      data: endpoints,
      count: endpoints.length,
    })
  } catch (error) {
    console.error('Error fetching mock endpoints:', error)
    return c.json(
      {
        success: false,
        error: 'Failed to fetch mock endpoints',
      },
      500
    )
  }
})

/**
 * モックエンドポイント作成
 * POST /api/mock/endpoints
 */
mockRouter.post('/endpoints', async (c) => {
  try {
    const body = await c.req.json()
    const validatedData = createMockEndpointSchema.parse(body)

    const newEndpoint = mockService.createEndpoint(validatedData as any)

    return c.json(
      {
        success: true,
        data: newEndpoint,
        message: 'Mock endpoint created successfully',
      },
      201
    )
  } catch (error) {
    console.error('Error creating mock endpoint:', error)
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
        error: 'Failed to create mock endpoint',
      },
      500
    )
  }
})

/**
 * モックエンドポイント更新
 * PUT /api/mock/endpoints/:id
 */
mockRouter.put('/endpoints/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const validatedData = updateMockEndpointSchema.parse(body)

    const updatedEndpoint = mockService.updateEndpoint(id, validatedData as any)

    if (!updatedEndpoint) {
      return c.json(
        {
          success: false,
          error: 'Mock endpoint not found',
        },
        404
      )
    }

    return c.json({
      success: true,
      data: updatedEndpoint,
      message: 'Mock endpoint updated successfully',
    })
  } catch (error) {
    console.error('Error updating mock endpoint:', error)
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
        error: 'Failed to update mock endpoint',
      },
      500
    )
  }
})

/**
 * モックエンドポイント削除
 * DELETE /api/mock/endpoints/:id
 */
mockRouter.delete('/endpoints/:id', (c) => {
  try {
    const id = c.req.param('id')
    const deleted = mockService.deleteEndpoint(id)

    if (!deleted) {
      return c.json(
        {
          success: false,
          error: 'Mock endpoint not found',
        },
        404
      )
    }

    return c.json({
      success: true,
      message: 'Mock endpoint deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting mock endpoint:', error)
    return c.json(
      {
        success: false,
        error: 'Failed to delete mock endpoint',
      },
      500
    )
  }
})

/**
 * すべてのモックエンドポイント削除
 * DELETE /api/mock/endpoints
 */
mockRouter.delete('/endpoints', (c) => {
  try {
    mockService.deleteAllEndpoints()
    return c.json({
      success: true,
      message: 'All mock endpoints deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting all mock endpoints:', error)
    return c.json(
      {
        success: false,
        error: 'Failed to delete all mock endpoints',
      },
      500
    )
  }
})

/**
 * モック設定エクスポート
 * GET /api/mock/export
 */
mockRouter.get('/export', (c) => {
  try {
    const endpoints = mockService.exportEndpoints()
    return c.json({
      success: true,
      data: endpoints,
      exportedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error exporting mock endpoints:', error)
    return c.json(
      {
        success: false,
        error: 'Failed to export mock endpoints',
      },
      500
    )
  }
})

/**
 * モック設定インポート
 * POST /api/mock/import
 */
mockRouter.post('/import', async (c) => {
  try {
    const body = await c.req.json()

    // 配列かどうかチェック
    if (!Array.isArray(body)) {
      return c.json(
        {
          success: false,
          error: 'Request body must be an array of mock endpoints',
        },
        400
      )
    }

    const validatedData = importMockEndpointsSchema.parse(body)
    mockService.importEndpoints(validatedData as any)

    return c.json({
      success: true,
      message: `Successfully imported ${validatedData.length} mock endpoints`,
      count: validatedData.length,
    })
  } catch (error) {
    console.error('Error importing mock endpoints:', error)
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
        error: 'Failed to import mock endpoints',
      },
      500
    )
  }
})

/**
 * 動的モックルーティング
 * ANY /serve/*
 * 実際のモックエンドポイントとして機能
 */
mockRouter.all('/serve/*', async (c) => {
  try {
    const method = c.req.method
    // URLからパスを取得
    const fullPath = new URL(c.req.url).pathname
    // /api/mock/serve を削除
    const path = fullPath.replace('/api/mock/serve', '') || '/'

    // クエリパラメータを取得
    const url = new URL(c.req.url)
    const query: Record<string, string> = {}
    url.searchParams.forEach((value, key) => {
      query[key] = value
    })

    // リクエストボディを取得（存在する場合）
    let body: any = undefined
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        const text = await c.req.text()
        body = text ? JSON.parse(text) : undefined
      } catch {
        // JSON以外の場合はそのまま
      }
    }

    // ヘッダーを取得
    const headers: Record<string, string> = {}
    c.req.raw.headers.forEach((value, key) => {
      headers[key] = value
    })

    // マッチするモックエンドポイントを検索
    const mockEndpoint = mockService.findMatchingMock(method, path, query, body, headers)

    if (!mockEndpoint) {
      return c.json(
        {
          success: false,
          error: 'No matching mock endpoint found',
          request: {
            method,
            path,
            query,
          },
        },
        404
      )
    }

    // パスパラメータを抽出
    const pathMatch = mockService.matchPathPattern(mockEndpoint.path, path)

    // レスポンスボディにパラメータを埋め込む
    const interpolatedBody = mockService.interpolateResponse(
      mockEndpoint.response.body,
      pathMatch.params
    )

    // 遅延が設定されている場合は待機
    if (mockEndpoint.response.delay && mockEndpoint.response.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, mockEndpoint.response.delay))
    }

    // レスポンスヘッダーを設定
    if (mockEndpoint.response.headers) {
      for (const [key, value] of Object.entries(mockEndpoint.response.headers)) {
        c.header(key, value)
      }
    }

    return c.json(interpolatedBody, mockEndpoint.response.status as any)
  } catch (error) {
    console.error('Error serving mock endpoint:', error)
    return c.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

export default mockRouter
