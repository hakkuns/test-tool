'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FileText, Upload, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { API_URL } from '@/lib/api'
import { db } from '@/lib/db'

interface ParsedTable {
  name: string
  columns: Array<{
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
  }>
  foreignKeys: Array<{
    column: string
    references: {
      table: string
      column: string
    }
  }>
  order: number
}

export function DDLUploader() {
  const [ddlText, setDdlText] = useState('')
  const [parsedTables, setParsedTables] = useState<ParsedTable[]>([])

  const parseMutation = useMutation({
    mutationFn: async (ddls: string[]) => {
      const response = await fetch(`${API_URL}/api/tables/parse-multiple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ddls }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to parse DDL')
      }

      return response.json()
    },
    onSuccess: async (data) => {
      setParsedTables(data.tables)
      
      // IndexedDBに保存
      for (const table of data.tables) {
        await db.ddlTables.put({
          name: table.name,
          ddl: ddlText, // 元のDDLを保存
          dependencies: table.foreignKeys.map(fk => fk.references.table),
          order: table.order,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      }

      toast.success(`${data.tables.length}個のテーブル定義を解析しました`)
    },
    onError: (error: Error) => {
      toast.error(`解析エラー: ${error.message}`)
    },
  })

  const handleParse = () => {
    if (!ddlText.trim()) {
      toast.error('DDLを入力してください')
      return
    }

    // セミコロンで分割して複数のDDLを抽出
    const ddls = ddlText
      .split(';')
      .map(ddl => ddl.trim())
      .filter(ddl => ddl.length > 0)
      .map(ddl => ddl + ';')

    if (ddls.length === 0) {
      toast.error('有効なDDLが見つかりません')
      return
    }

    parseMutation.mutate(ddls)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setDdlText(content)
    }
    reader.readAsText(file)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          DDL アップロード
        </CardTitle>
        <CardDescription>
          PostgreSQL の CREATE TABLE 文を入力してください
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex gap-2">
            <label htmlFor="file-upload">
              <Button type="button" variant="outline" size="sm" asChild>
                <span className="cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" />
                  ファイルを選択
                </span>
              </Button>
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".sql,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          <Textarea
            placeholder="CREATE TABLE users (&#10;  id SERIAL PRIMARY KEY,&#10;  name VARCHAR(255) NOT NULL&#10;);"
            value={ddlText}
            onChange={(e) => setDdlText(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
          />
        </div>

        <Button 
          onClick={handleParse} 
          disabled={parseMutation.isPending}
          className="w-full"
        >
          {parseMutation.isPending ? '解析中...' : 'テーブルを解析'}
        </Button>

        {parsedTables.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">
                  {parsedTables.length}個のテーブルを検出しました
                </p>
                <div className="text-sm">
                  <p>作成順序:</p>
                  <ol className="list-decimal list-inside">
                    {parsedTables.map((table) => (
                      <li key={table.name}>
                        {table.name} ({table.columns.length}カラム)
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
