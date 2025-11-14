export interface ColumnDefinition {
  name: string
  type: string
  nullable: boolean
  primaryKey: boolean
  unique: boolean
  defaultValue?: string
  references?: {
    table: string
    column: string
  }
}

export interface TableDefinition {
  name: string
  columns: ColumnDefinition[]
  foreignKeys: {
    column: string
    references: {
      table: string
      column: string
    }
  }[]
}

export class DDLParser {
  /**
   * CREATE TABLE文をパースしてテーブル定義を返す
   */
  parse(ddl: string): TableDefinition {
    const normalizedDDL = this.normalizeDDL(ddl)
    
    // テーブル名を抽出
    const tableNameMatch = normalizedDDL.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["']?(\w+)["']?\s*\(/i)
    if (!tableNameMatch) {
      throw new Error('Invalid CREATE TABLE syntax: table name not found')
    }
    const tableName = tableNameMatch[1]

    // カラム定義部分を抽出
    const columnsMatch = normalizedDDL.match(/\(([\s\S]+)\)/i)
    if (!columnsMatch) {
      throw new Error('Invalid CREATE TABLE syntax: column definitions not found')
    }

    const columnDefinitions = this.parseColumnDefinitions(columnsMatch[1])
    
    return {
      name: tableName,
      columns: columnDefinitions.columns,
      foreignKeys: columnDefinitions.foreignKeys
    }
  }

  /**
   * DDL文を正規化（コメント削除、改行統一）
   */
  private normalizeDDL(ddl: string): string {
    return ddl
      .replace(/--.*$/gm, '') // 行コメント削除
      .replace(/\/\*[\s\S]*?\*\//g, '') // ブロックコメント削除
      .replace(/\s+/g, ' ') // 複数空白を1つに
      .trim()
  }

  /**
   * カラム定義をパース
   */
  private parseColumnDefinitions(columnsPart: string): {
    columns: ColumnDefinition[]
    foreignKeys: TableDefinition['foreignKeys']
  } {
    const columns: ColumnDefinition[] = []
    const foreignKeys: TableDefinition['foreignKeys'] = []

    // カンマで分割（ただしカッコ内のカンマは除外）
    const parts = this.splitByComma(columnsPart)

    for (const part of parts) {
      const trimmed = part.trim()
      
      // CONSTRAINT ... FOREIGN KEY の場合
      if (/^CONSTRAINT\s+\w+\s+FOREIGN\s+KEY/i.test(trimmed)) {
        const fk = this.parseForeignKeyConstraint(trimmed)
        if (fk) foreignKeys.push(fk)
        continue
      }

      // 通常のカラム定義
      const column = this.parseColumn(trimmed)
      if (column) {
        columns.push(column)
        
        // インラインFOREIGN KEY
        if (column.references) {
          foreignKeys.push({
            column: column.name,
            references: column.references
          })
        }
      }
    }

    return { columns, foreignKeys }
  }

  /**
   * カンマで分割（カッコ内は無視）
   */
  private splitByComma(text: string): string[] {
    const parts: string[] = []
    let current = ''
    let depth = 0

    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      
      if (char === '(') depth++
      else if (char === ')') depth--
      else if (char === ',' && depth === 0) {
        parts.push(current)
        current = ''
        continue
      }

      current += char
    }

    if (current.trim()) {
      parts.push(current)
    }

    return parts
  }

  /**
   * 単一カラム定義をパース
   */
  private parseColumn(columnDef: string): ColumnDefinition | null {
    // カラム名と型を抽出
    const match = columnDef.match(/^["']?(\w+)["']?\s+(\w+(?:\([^)]+\))?)/i)
    if (!match) return null

    const [, name, type] = match

    const column: ColumnDefinition = {
      name,
      type,
      nullable: !/NOT\s+NULL/i.test(columnDef),
      primaryKey: /PRIMARY\s+KEY/i.test(columnDef),
      unique: /UNIQUE/i.test(columnDef)
    }

    // DEFAULT値
    const defaultMatch = columnDef.match(/DEFAULT\s+(.+?)(?:\s+|$)/i)
    if (defaultMatch) {
      column.defaultValue = defaultMatch[1].replace(/['"]/g, '')
    }

    // REFERENCES（インライン外部キー）
    const referencesMatch = columnDef.match(/REFERENCES\s+["']?(\w+)["']?\s*\(["']?(\w+)["']?\)/i)
    if (referencesMatch) {
      column.references = {
        table: referencesMatch[1],
        column: referencesMatch[2]
      }
    }

    return column
  }

  /**
   * FOREIGN KEY制約をパース
   */
  private parseForeignKeyConstraint(constraint: string): TableDefinition['foreignKeys'][0] | null {
    const match = constraint.match(
      /FOREIGN\s+KEY\s*\(["']?(\w+)["']?\)\s+REFERENCES\s+["']?(\w+)["']?\s*\(["']?(\w+)["']?\)/i
    )
    
    if (!match) return null

    return {
      column: match[1],
      references: {
        table: match[2],
        column: match[3]
      }
    }
  }

  /**
   * 複数のテーブル間の依存関係を解決
   */
  resolveTableDependencies(tables: TableDefinition[]): string[] {
    const graph = new Map<string, Set<string>>()
    const inDegree = new Map<string, number>()

    // グラフを構築
    for (const table of tables) {
      graph.set(table.name, new Set())
      inDegree.set(table.name, 0)
    }

    for (const table of tables) {
      for (const fk of table.foreignKeys) {
        if (fk.references.table !== table.name) { // 自己参照は除外
          graph.get(fk.references.table)?.add(table.name)
          inDegree.set(table.name, (inDegree.get(table.name) || 0) + 1)
        }
      }
    }

    // トポロジカルソート（Kahn's Algorithm）
    const queue: string[] = []
    const result: string[] = []

    for (const [table, degree] of inDegree) {
      if (degree === 0) queue.push(table)
    }

    while (queue.length > 0) {
      const current = queue.shift()!
      result.push(current)

      for (const dependent of graph.get(current) || []) {
        const newDegree = (inDegree.get(dependent) || 0) - 1
        inDegree.set(dependent, newDegree)
        if (newDegree === 0) {
          queue.push(dependent)
        }
      }
    }

    // 循環依存チェック
    if (result.length !== tables.length) {
      throw new Error('Circular dependency detected in table definitions')
    }

    return result
  }
}
