import { describe, it, expect, beforeEach } from 'vitest'
import { mockService } from '../services/mockService'
import type { MockEndpoint } from '../types'

describe('MockService', () => {
  beforeEach(() => {
    // 各テストの前にエンドポイントをクリア
    mockService.deleteAllEndpoints()
  })

  describe('CRUD Operations', () => {
    it('should create a new mock endpoint', () => {
      const endpoint = mockService.createEndpoint({
        name: 'Test Endpoint',
        enabled: true,
        priority: 0,
        method: 'GET',
        path: '/api/users/:id',
        response: {
          status: 200,
          body: { message: 'Success' },
        },
      })

      expect(endpoint).toBeDefined()
      expect(endpoint.id).toBeTruthy()
      expect(endpoint.name).toBe('Test Endpoint')
      expect(endpoint.method).toBe('GET')
      expect(endpoint.path).toBe('/api/users/:id')
    })

    it('should retrieve all endpoints', () => {
      mockService.createEndpoint({
        enabled: true,
        priority: 0,
        method: 'GET',
        path: '/api/test1',
        response: { status: 200, body: {} },
      })

      mockService.createEndpoint({
        enabled: true,
        priority: 1,
        method: 'POST',
        path: '/api/test2',
        response: { status: 201, body: {} },
      })

      const endpoints = mockService.getAllEndpoints()
      expect(endpoints).toHaveLength(2)
      // 優先度の高い順にソートされていることを確認
      expect(endpoints[0].priority).toBe(1)
      expect(endpoints[1].priority).toBe(0)
    })

    it('should update an endpoint', () => {
      const endpoint = mockService.createEndpoint({
        enabled: true,
        priority: 0,
        method: 'GET',
        path: '/api/test',
        response: { status: 200, body: {} },
      })

      const updated = mockService.updateEndpoint(endpoint.id, {
        name: 'Updated Name',
        priority: 5,
      })

      expect(updated).toBeDefined()
      expect(updated?.name).toBe('Updated Name')
      expect(updated?.priority).toBe(5)
      expect(updated?.path).toBe('/api/test') // 変更していない項目は保持
    })

    it('should delete an endpoint', () => {
      const endpoint = mockService.createEndpoint({
        enabled: true,
        priority: 0,
        method: 'GET',
        path: '/api/test',
        response: { status: 200, body: {} },
      })

      const deleted = mockService.deleteEndpoint(endpoint.id)
      expect(deleted).toBe(true)

      const endpoints = mockService.getAllEndpoints()
      expect(endpoints).toHaveLength(0)
    })

    it('should return false when deleting non-existent endpoint', () => {
      const deleted = mockService.deleteEndpoint('non-existent-id')
      expect(deleted).toBe(false)
    })
  })

  describe('Path Pattern Matching', () => {
    it('should match exact path', () => {
      const result = mockService.matchPathPattern('/api/users', '/api/users')
      expect(result.isMatch).toBe(true)
      expect(result.params).toEqual({})
    })

    it('should match path with single parameter', () => {
      const result = mockService.matchPathPattern('/api/users/:id', '/api/users/123')
      expect(result.isMatch).toBe(true)
      expect(result.params).toEqual({ id: '123' })
    })

    it('should match path with multiple parameters', () => {
      const result = mockService.matchPathPattern(
        '/api/users/:userId/posts/:postId',
        '/api/users/123/posts/456'
      )
      expect(result.isMatch).toBe(true)
      expect(result.params).toEqual({ userId: '123', postId: '456' })
    })

    it('should not match path with different segment count', () => {
      const result = mockService.matchPathPattern('/api/users/:id', '/api/users')
      expect(result.isMatch).toBe(false)
    })

    it('should not match path with different static segments', () => {
      const result = mockService.matchPathPattern('/api/users/:id', '/api/posts/123')
      expect(result.isMatch).toBe(false)
    })
  })

  describe('Response Interpolation', () => {
    it('should interpolate string parameters', () => {
      const response = 'User ID: {{id}}'
      const params = { id: '123' }
      const result = mockService.interpolateResponse(response, params)
      expect(result).toBe('User ID: 123')
    })

    it('should interpolate parameters in object', () => {
      const response = {
        id: '{{id}}',
        name: 'User {{id}}',
        nested: {
          value: '{{id}}',
        },
      }
      const params = { id: '123' }
      const result = mockService.interpolateResponse(response, params)
      expect(result).toEqual({
        id: '123',
        name: 'User 123',
        nested: {
          value: '123',
        },
      })
    })

    it('should interpolate parameters in array', () => {
      const response = ['{{id}}', 'User {{id}}']
      const params = { id: '123' }
      const result = mockService.interpolateResponse(response, params)
      expect(result).toEqual(['123', 'User 123'])
    })

    it('should handle missing parameters', () => {
      const response = 'User {{id}}'
      const params = {}
      const result = mockService.interpolateResponse(response, params)
      expect(result).toBe('User ')
    })
  })

  describe('Finding Matching Mock', () => {
    it('should find matching mock by method and path', () => {
      mockService.createEndpoint({
        enabled: true,
        priority: 0,
        method: 'GET',
        path: '/api/users/:id',
        response: { status: 200, body: { message: 'Found' } },
      })

      const match = mockService.findMatchingMock('GET', '/api/users/123')
      expect(match).toBeDefined()
      expect(match?.path).toBe('/api/users/:id')
    })

    it('should not match disabled endpoints', () => {
      mockService.createEndpoint({
        enabled: false,
        priority: 0,
        method: 'GET',
        path: '/api/users/:id',
        response: { status: 200, body: {} },
      })

      const match = mockService.findMatchingMock('GET', '/api/users/123')
      expect(match).toBeNull()
    })

    it('should not match different HTTP method', () => {
      mockService.createEndpoint({
        enabled: true,
        priority: 0,
        method: 'GET',
        path: '/api/users/:id',
        response: { status: 200, body: {} },
      })

      const match = mockService.findMatchingMock('POST', '/api/users/123')
      expect(match).toBeNull()
    })

    it('should match with query parameters', () => {
      mockService.createEndpoint({
        enabled: true,
        priority: 0,
        method: 'GET',
        path: '/api/users',
        requestMatch: {
          query: { status: 'active' },
        },
        response: { status: 200, body: {} },
      })

      const match = mockService.findMatchingMock('GET', '/api/users', {
        status: 'active',
        other: 'param',
      })
      expect(match).toBeDefined()

      const noMatch = mockService.findMatchingMock('GET', '/api/users', {
        status: 'inactive',
      })
      expect(noMatch).toBeNull()
    })

    it('should match with request body', () => {
      mockService.createEndpoint({
        enabled: true,
        priority: 0,
        method: 'POST',
        path: '/api/users',
        requestMatch: {
          body: { type: 'admin' },
        },
        response: { status: 201, body: {} },
      })

      const match = mockService.findMatchingMock('POST', '/api/users', undefined, {
        type: 'admin',
        name: 'John',
      })
      expect(match).toBeDefined()

      const noMatch = mockService.findMatchingMock('POST', '/api/users', undefined, {
        type: 'user',
      })
      expect(noMatch).toBeNull()
    })

    it('should match with headers (case-insensitive)', () => {
      mockService.createEndpoint({
        enabled: true,
        priority: 0,
        method: 'GET',
        path: '/api/users',
        requestMatch: {
          headers: { 'Authorization': 'Bearer token' },
        },
        response: { status: 200, body: {} },
      })

      const match = mockService.findMatchingMock(
        'GET',
        '/api/users',
        undefined,
        undefined,
        { 'authorization': 'Bearer token' } // 小文字でもマッチ
      )
      expect(match).toBeDefined()
    })

    it('should prioritize by priority value', () => {
      mockService.createEndpoint({
        enabled: true,
        priority: 0,
        method: 'GET',
        path: '/api/users/:id',
        response: { status: 200, body: { priority: 'low' } },
      })

      mockService.createEndpoint({
        enabled: true,
        priority: 10,
        method: 'GET',
        path: '/api/users/:id',
        response: { status: 200, body: { priority: 'high' } },
      })

      const match = mockService.findMatchingMock('GET', '/api/users/123')
      expect(match?.priority).toBe(10)
      expect(match?.response.body).toEqual({ priority: 'high' })
    })
  })

  describe('Import/Export', () => {
    it('should export all endpoints', () => {
      mockService.createEndpoint({
        enabled: true,
        priority: 0,
        method: 'GET',
        path: '/api/test1',
        response: { status: 200, body: {} },
      })

      mockService.createEndpoint({
        enabled: true,
        priority: 0,
        method: 'POST',
        path: '/api/test2',
        response: { status: 201, body: {} },
      })

      const exported = mockService.exportEndpoints()
      expect(exported).toHaveLength(2)
    })

    it('should import endpoints', () => {
      const endpoints: MockEndpoint[] = [
        {
          id: 'test-1',
          enabled: true,
          priority: 0,
          method: 'GET',
          path: '/api/test1',
          response: { status: 200, body: {} },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'test-2',
          enabled: true,
          priority: 0,
          method: 'POST',
          path: '/api/test2',
          response: { status: 201, body: {} },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      mockService.importEndpoints(endpoints)

      const imported = mockService.getAllEndpoints()
      expect(imported).toHaveLength(2)
      expect(imported[0].id).toBe('test-1')
      expect(imported[1].id).toBe('test-2')
    })

    it('should clear existing endpoints on import', () => {
      mockService.createEndpoint({
        enabled: true,
        priority: 0,
        method: 'GET',
        path: '/api/old',
        response: { status: 200, body: {} },
      })

      const newEndpoints: MockEndpoint[] = [
        {
          id: 'new-1',
          enabled: true,
          priority: 0,
          method: 'GET',
          path: '/api/new',
          response: { status: 200, body: {} },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      mockService.importEndpoints(newEndpoints)

      const imported = mockService.getAllEndpoints()
      expect(imported).toHaveLength(1)
      expect(imported[0].path).toBe('/api/new')
    })
  })
})
