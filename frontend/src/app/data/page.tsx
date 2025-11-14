'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Database, Plus, Trash2, Send, AlertCircle } from 'lucide-react'
import { API_URL } from '@/lib/api'

interface TableInfo {
  table_name: string
  column_count: number
}

interface ColumnInfo {
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
  character_maximum_length: number | null
  numeric_precision: number | null
  numeric_scale: number | null
}

export default function DataInputPage() {
  const [selectedTable, setSelectedTable] = useState<string>('')
  const [rowData, setRowData] = useState<Record<string, any>[]>([{}])
  const queryClient = useQueryClient()

  // テーブル一覧を取得
  const { data: tablesData, isLoading: tablesLoading } = useQuery({
    queryKey: ['database-tables'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/database/tables`)
      if (!response.ok) throw new Error('Failed to fetch tables')
      return response.json()
    },
  })

  // 選択されたテーブルのカラム情報を取得
  const { data: columnsData, isLoading: columnsLoading } = useQuery({
    queryKey: ['table-columns', selectedTable],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/database/tables/${selectedTable}/columns`)
      if (!response.ok) throw new Error('Failed to fetch columns')
      return response.json()
    },
    enabled: !!selectedTable,
  })

  // データ挿入
  const insertMutation = useMutation({
    mutationFn: async (data: { tableName: string; data: Record<string, any>[] }) => {
      const response = await fetch(`${API_URL}/api/database/insert-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to insert data')
      }

      return response.json()
    },
    onSuccess: (data) => {
      toast.success(`${data.insertedCount}件のデータを挿入しました`)
      setRowData([{}])
      queryClient.invalidateQueries({ queryKey: ['database-tables'] })
    },
    onError: (error: Error) => {
      toast.error(`挿入エラー: ${error.message}`)
    },
  })

  const columns: ColumnInfo[] = columnsData?.columns || []
  const tables: TableInfo[] = tablesData?.tables || []

  const handleAddRow = () => {
    setRowData([...rowData, {}])
  }

  const handleRemoveRow = (index: number) => {
    setRowData(rowData.filter((_, i) => i !== index))
  }

  const handleCellChange = (rowIndex: number, columnName: string, value: string) => {
    const newRowData = [...rowData]
    newRowData[rowIndex] = {
      ...newRowData[rowIndex],
      [columnName]: value,
    }
    setRowData(newRowData)
  }

  const handleSubmit = () => {
    if (!selectedTable) {
      toast.error('テーブルを選択してください')
      return
    }

    // 空の行を除外
    const validRows = rowData.filter(row => Object.keys(row).length > 0)
    
    if (validRows.length === 0) {
      toast.error('データを入力してください')
      return
    }

    insertMutation.mutate({
      tableName: selectedTable,
      data: validRows,
    })
  }

  const handleTableChange = (tableName: string) => {
    setSelectedTable(tableName)
    setRowData([{}])
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">データ入力</h1>
          <p className="text-muted-foreground">PostgreSQLにテストデータを投入します</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            テーブル選択
          </CardTitle>
          <CardDescription>
            データを投入するテーブルを選択してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedTable} onValueChange={handleTableChange}>
            <SelectTrigger>
              <SelectValue placeholder="テーブルを選択..." />
            </SelectTrigger>
            <SelectContent>
              {tables.map((table) => (
                <SelectItem key={table.table_name} value={table.table_name}>
                  {table.table_name} ({table.column_count}カラム)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedTable && columns.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>カラム情報</CardTitle>
              <CardDescription>{selectedTable}テーブルの構造</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {columns.map((column) => (
                  <div key={column.column_name} className="border rounded-lg p-3 space-y-1">
                    <div className="font-medium">{column.column_name}</div>
                    <div className="flex gap-2 text-sm">
                      <Badge variant="outline">{column.data_type}</Badge>
                      {column.is_nullable === 'NO' && (
                        <Badge variant="destructive">必須</Badge>
                      )}
                    </div>
                    {column.column_default && (
                      <div className="text-xs text-muted-foreground">
                        デフォルト: {column.column_default}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>データ入力</span>
                <div className="flex gap-2">
                  <Button onClick={handleAddRow} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    行追加
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    size="sm"
                    disabled={insertMutation.isPending}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    送信
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((column) => (
                        <TableHead key={column.column_name}>
                          {column.column_name}
                          {column.is_nullable === 'NO' && <span className="text-red-500">*</span>}
                        </TableHead>
                      ))}
                      <TableHead className="w-[50px]">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rowData.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {columns.map((column) => (
                          <TableCell key={column.column_name}>
                            <Input
                              value={row[column.column_name] || ''}
                              onChange={(e) => handleCellChange(rowIndex, column.column_name, e.target.value)}
                              placeholder={column.column_default || ''}
                              className="min-w-[150px]"
                            />
                          </TableCell>
                        ))}
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveRow(rowIndex)}
                            disabled={rowData.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!selectedTable && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            テーブルを選択してデータ入力を開始してください
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
