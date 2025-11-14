import { describe, it, expect } from 'vitest'
import { DDLParser } from '../services/ddlParser'

describe('DDLParser', () => {
  const parser = new DDLParser()

  describe('基本的なテーブル定義', () => {
    it('シンプルなテーブルをパースできる', () => {
      const ddl = `
        CREATE TABLE users (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE
        )
      `
      
      const result = parser.parse(ddl)
      
      expect(result.name).toBe('users')
      expect(result.columns).toHaveLength(3)
      expect(result.columns[0]).toMatchObject({
        name: 'id',
        type: 'INTEGER',
        primaryKey: true
      })
      expect(result.columns[1]).toMatchObject({
        name: 'name',
        type: 'TEXT',
        nullable: false
      })
      expect(result.columns[2]).toMatchObject({
        name: 'email',
        type: 'TEXT',
        unique: true
      })
    })

    it('IF NOT EXISTSを含むテーブルをパースできる', () => {
      const ddl = 'CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY)'
      const result = parser.parse(ddl)
      expect(result.name).toBe('products')
    })

    it('DEFAULT値を持つカラムをパースできる', () => {
      const ddl = `
        CREATE TABLE settings (
          id INTEGER PRIMARY KEY,
          theme TEXT DEFAULT 'light',
          count INTEGER DEFAULT 0
        )
      `
      
      const result = parser.parse(ddl)
      expect(result.columns[1].defaultValue).toBe('light')
      expect(result.columns[2].defaultValue).toBe('0')
    })
  })

  describe('外部キー制約', () => {
    it('インライン外部キーをパースできる', () => {
      const ddl = `
        CREATE TABLE posts (
          id INTEGER PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          title TEXT NOT NULL
        )
      `
      
      const result = parser.parse(ddl)
      expect(result.columns[1].references).toEqual({
        table: 'users',
        column: 'id'
      })
      expect(result.foreignKeys).toHaveLength(1)
      expect(result.foreignKeys[0]).toEqual({
        column: 'user_id',
        references: { table: 'users', column: 'id' }
      })
    })

    it('CONSTRAINT形式の外部キーをパースできる', () => {
      const ddl = `
        CREATE TABLE comments (
          id INTEGER PRIMARY KEY,
          post_id INTEGER,
          CONSTRAINT fk_post FOREIGN KEY (post_id) REFERENCES posts(id)
        )
      `
      
      const result = parser.parse(ddl)
      expect(result.foreignKeys).toHaveLength(1)
      expect(result.foreignKeys[0]).toEqual({
        column: 'post_id',
        references: { table: 'posts', column: 'id' }
      })
    })
  })

  describe('依存関係解決', () => {
    it('正しい順序でテーブルをソートできる', () => {
      const tables = [
        parser.parse('CREATE TABLE posts (id INTEGER PRIMARY KEY, user_id INTEGER REFERENCES users(id))'),
        parser.parse('CREATE TABLE users (id INTEGER PRIMARY KEY)'),
        parser.parse('CREATE TABLE comments (id INTEGER PRIMARY KEY, post_id INTEGER REFERENCES posts(id))')
      ]
      
      const order = parser.resolveTableDependencies(tables)
      
      expect(order).toEqual(['users', 'posts', 'comments'])
    })

    it('循環依存を検出できる', () => {
      const tables = [
        parser.parse('CREATE TABLE a (id INTEGER PRIMARY KEY, b_id INTEGER REFERENCES b(id))'),
        parser.parse('CREATE TABLE b (id INTEGER PRIMARY KEY, a_id INTEGER REFERENCES a(id))')
      ]
      
      expect(() => parser.resolveTableDependencies(tables)).toThrow('Circular dependency')
    })

    it('自己参照テーブルを処理できる', () => {
      const tables = [
        parser.parse('CREATE TABLE categories (id INTEGER PRIMARY KEY, parent_id INTEGER REFERENCES categories(id))')
      ]
      
      const order = parser.resolveTableDependencies(tables)
      expect(order).toEqual(['categories'])
    })
  })

  describe('エッジケース', () => {
    it('コメントを無視する', () => {
      const ddl = `
        -- This is a comment
        CREATE TABLE users (
          id INTEGER PRIMARY KEY, -- inline comment
          /* block comment */ name TEXT
        )
      `
      
      const result = parser.parse(ddl)
      expect(result.columns).toHaveLength(2)
    })

    it('大文字小文字を区別しない', () => {
      const ddl = 'create table Users (ID integer primary key)'
      const result = parser.parse(ddl)
      expect(result.name).toBe('Users')
    })

    it('不正な構文でエラーをスローする', () => {
      expect(() => parser.parse('INVALID SQL')).toThrow()
      expect(() => parser.parse('CREATE TABLE')).toThrow()
    })
  })
})
