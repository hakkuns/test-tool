import { describe, it, expect } from 'vitest'
import app from '../index'

describe('Tables API', () => {
  describe('POST /api/tables/parse', () => {
    it('単一のDDLをパースできる', async () => {
      const res = await app.request('/api/tables/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ddl: 'CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL)'
        }),
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.table.name).toBe('users')
      expect(data.table.columns).toHaveLength(2)
    })

    it('不正なDDLでエラーを返す', async () => {
      const res = await app.request('/api/tables/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ddl: 'INVALID SQL'
        }),
      })

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.success).toBe(false)
      expect(data.error).toBeDefined()
    })
  })

  describe('POST /api/tables/parse-multiple', () => {
    it('複数のDDLをパースして依存関係を解決できる', async () => {
      const res = await app.request('/api/tables/parse-multiple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ddls: [
            'CREATE TABLE posts (id INTEGER PRIMARY KEY, user_id INTEGER REFERENCES users(id))',
            'CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)',
            'CREATE TABLE comments (id INTEGER PRIMARY KEY, post_id INTEGER REFERENCES posts(id))'
          ]
        }),
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.tables).toHaveLength(3)
      expect(data.order).toEqual(['users', 'posts', 'comments'])
      expect(data.dependencies).toBeDefined()
      expect(data.dependencies.posts).toEqual(['users'])
      expect(data.dependencies.comments).toEqual(['posts'])
    })

    it('循環依存を検出してエラーを返す', async () => {
      const res = await app.request('/api/tables/parse-multiple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ddls: [
            'CREATE TABLE a (id INTEGER PRIMARY KEY, b_id INTEGER REFERENCES b(id))',
            'CREATE TABLE b (id INTEGER PRIMARY KEY, a_id INTEGER REFERENCES a(id))'
          ]
        }),
      })

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('Circular dependency')
    })
  })

  describe('GET /api/tables/health', () => {
    it('ヘルスチェックが成功する', async () => {
      const res = await app.request('/api/tables/health')
      
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.status).toBe('ok')
    })
  })
})
