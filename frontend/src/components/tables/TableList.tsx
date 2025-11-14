'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, Trash2, Database } from 'lucide-react'
import { db } from '@/lib/db'
import { toast } from 'sonner'

export function TableList() {
  const tables = useLiveQuery(() => db.ddlTables.orderBy('order').toArray())

  const handleExport = async () => {
    if (!tables || tables.length === 0) {
      toast.error('エクスポートするテーブルがありません')
      return
    }

    const data = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      tables: tables.map(t => ({
        name: t.name,
        ddl: t.ddl,
        dependencies: t.dependencies,
        order: t.order,
      })),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tables-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)

    toast.success('テーブル定義をエクスポートしました')
  }

  const handleDeleteAll = async () => {
    if (!confirm('すべてのテーブル定義を削除しますか？')) {
      return
    }

    await db.ddlTables.clear()
    toast.success('すべてのテーブル定義を削除しました')
  }

  const handleDelete = async (id: number) => {
    if (!confirm('このテーブル定義を削除しますか？')) {
      return
    }

    await db.ddlTables.delete(id)
    toast.success('テーブル定義を削除しました')
  }

  if (!tables) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          読み込み中...
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          テーブル一覧 ({tables.length})
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={tables.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            エクスポート
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDeleteAll} disabled={tables.length === 0}>
            <Trash2 className="mr-2 h-4 w-4" />
            すべて削除
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {tables.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>テーブル定義がありません</p>
            <p className="text-sm">DDLをアップロードしてください</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">順序</TableHead>
                  <TableHead>テーブル名</TableHead>
                  <TableHead>依存関係</TableHead>
                  <TableHead>作成日時</TableHead>
                  <TableHead className="w-[100px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tables.map((table) => (
                  <TableRow key={table.id}>
                    <TableCell className="font-mono">{table.order}</TableCell>
                    <TableCell className="font-mono font-semibold">{table.name}</TableCell>
                    <TableCell>
                      {table.dependencies.length > 0 ? (
                        <div className="flex gap-1 flex-wrap">
                          {table.dependencies.map((dep) => (
                            <Badge key={dep} variant="secondary" className="text-xs">
                              {dep}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">なし</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(table.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => table.id && handleDelete(table.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
