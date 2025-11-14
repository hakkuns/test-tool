import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { DDLParser, type TableDefinition } from '../services/ddlParser'

const tablesRouter = new Hono()
const ddlParser = new DDLParser()

// リクエストスキーマ
const parseDDLSchema = z.object({
  ddl: z.string().min(1, 'DDL is required'),
})

const parseMultipleDDLSchema = z.object({
  ddls: z.array(z.string()).min(1, 'At least one DDL is required'),
})

/**
 * POST /api/tables/parse - 単一DDLをパース
 */
tablesRouter.post('/parse', zValidator('json', parseDDLSchema), async (c) => {
  try {
    const { ddl } = c.req.valid('json')
    
    const table = ddlParser.parse(ddl)
    
    return c.json({
      success: true,
      table,
    })
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message,
      },
      400
    )
  }
})

/**
 * POST /api/tables/parse-multiple - 複数DDLをパースして依存関係を解決
 */
tablesRouter.post('/parse-multiple', zValidator('json', parseMultipleDDLSchema), async (c) => {
  try {
    const { ddls } = c.req.valid('json')
    
    // 各DDLをパース
    const tables: TableDefinition[] = []
    const errors: { ddl: string; error: string }[] = []
    
    for (const ddl of ddls) {
      try {
        const table = ddlParser.parse(ddl)
        tables.push(table)
      } catch (error: any) {
        errors.push({
          ddl: ddl.substring(0, 100) + '...',
          error: error.message,
        })
      }
    }
    
    if (errors.length > 0) {
      return c.json(
        {
          success: false,
          errors,
        },
        400
      )
    }
    
    // 依存関係を解決
    const order = ddlParser.resolveTableDependencies(tables)
    
    // 順序情報を付加
    const orderedTables = order.map((tableName, index) => {
      const table = tables.find((t) => t.name === tableName)!
      return {
        ...table,
        order: index + 1,
      }
    })
    
    // 依存関係グラフを構築
    const dependencies: Record<string, string[]> = {}
    for (const table of tables) {
      dependencies[table.name] = table.foreignKeys
        .map((fk) => fk.references.table)
        .filter((ref) => ref !== table.name) // 自己参照除外
    }
    
    return c.json({
      success: true,
      tables: orderedTables,
      order,
      dependencies,
    })
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message,
      },
      400
    )
  }
})

/**
 * GET /api/tables/health - API動作確認
 */
tablesRouter.get('/health', (c) => {
  return c.json({
    status: 'ok',
    message: 'Tables API is working',
  })
})

export default tablesRouter
