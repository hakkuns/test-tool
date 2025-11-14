import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as dbService from '../services/databaseService'
import { pool } from '../db/pool'

// pool.queryをモック
vi.mock('../db/pool', () => ({
  pool: {
    connect: vi.fn(),
    query: vi.fn(),
  },
  testConnection: vi.fn(),
  closePool: vi.fn(),
}))

describe('DatabaseService', () => {
  const mockClient = {
    query: vi.fn(),
    release: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(pool.connect).mockResolvedValue(mockClient as any)
  })

  describe('getTables', () => {
    it('should fetch all tables from database', async () => {
      const mockTables = [
        { table_name: 'users', column_count: 5 },
        { table_name: 'posts', column_count: 3 },
      ]

      vi.mocked(pool.query).mockResolvedValueOnce({ rows: mockTables } as any)

      const result = await dbService.getTables()

      expect(result).toEqual(mockTables)
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('information_schema.tables'))
    })
  })

  describe('getTableColumns', () => {
    it('should fetch columns for a specific table', async () => {
      const mockColumns = [
        { column_name: 'id', data_type: 'integer', is_nullable: 'NO' },
        { column_name: 'name', data_type: 'varchar', is_nullable: 'YES' },
      ]

      vi.mocked(pool.query).mockResolvedValueOnce({ rows: mockColumns } as any)

      const result = await dbService.getTableColumns('users')

      expect(result).toEqual(mockColumns)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('information_schema.columns'),
        ['users']
      )
    })
  })

  describe('insertData', () => {
    it('should insert multiple rows into a table', async () => {
      const testData = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ]

      mockClient.query.mockResolvedValue({ rowCount: 1 } as any)

      const count = await dbService.insertData('users', testData)

      expect(count).toBe(2)
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN')
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT')
      expect(mockClient.query).toHaveBeenCalledTimes(4) // BEGIN + 2 INSERTs + COMMIT
      expect(mockClient.release).toHaveBeenCalled()
    })

    it('should rollback on error', async () => {
      const testData = [{ id: 1, name: 'Alice' }]

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockRejectedValueOnce(new Error('Insert failed')) // INSERT

      await expect(dbService.insertData('users', testData)).rejects.toThrow('Insert failed')

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK')
      expect(mockClient.release).toHaveBeenCalled()
    })

    it('should return 0 for empty data array', async () => {
      const count = await dbService.insertData('users', [])
      expect(count).toBe(0)
      expect(pool.connect).not.toHaveBeenCalled()
    })
  })

  describe('executeDDL', () => {
    it('should execute a single DDL statement', async () => {
      const ddl = 'CREATE TABLE users (id SERIAL PRIMARY KEY)'

      await dbService.executeDDL(ddl)

      expect(pool.connect).toHaveBeenCalled()
      expect(mockClient.query).toHaveBeenCalledWith(ddl)
      expect(mockClient.release).toHaveBeenCalled()
    })
  })

  describe('executeDDLs', () => {
    it('should execute multiple DDL statements in a transaction', async () => {
      const ddls = [
        'CREATE TABLE users (id SERIAL PRIMARY KEY)',
        'CREATE TABLE posts (id SERIAL PRIMARY KEY, user_id INTEGER)',
      ]

      mockClient.query.mockResolvedValue({ rows: [] } as any)

      await dbService.executeDDLs(ddls)

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN')
      expect(mockClient.query).toHaveBeenCalledWith(ddls[0])
      expect(mockClient.query).toHaveBeenCalledWith(ddls[1])
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT')
      expect(mockClient.release).toHaveBeenCalled()
    })

    it('should rollback on DDL error', async () => {
      const ddls = ['CREATE TABLE users (id SERIAL PRIMARY KEY)']

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockRejectedValueOnce(new Error('DDL failed')) // CREATE TABLE

      await expect(dbService.executeDDLs(ddls)).rejects.toThrow('DDL failed')

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK')
      expect(mockClient.release).toHaveBeenCalled()
    })
  })

  describe('truncateTable', () => {
    it('should truncate a table', async () => {
      await dbService.truncateTable('users')

      expect(pool.query).toHaveBeenCalledWith('TRUNCATE TABLE "users" CASCADE')
    })
  })

  describe('dropTable', () => {
    it('should drop a table', async () => {
      await dbService.dropTable('users')

      expect(pool.query).toHaveBeenCalledWith('DROP TABLE IF EXISTS "users" CASCADE')
    })
  })
})
