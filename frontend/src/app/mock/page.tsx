'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Download, Upload, Trash2 } from 'lucide-react'
import { EndpointList } from '@/components/mock/EndpointList'
import { EndpointEditor } from '@/components/mock/EndpointEditor'
import {
  type MockEndpoint,
  getMockEndpoints,
  createMockEndpoint,
  updateMockEndpoint,
  deleteMockEndpoint,
  deleteAllMockEndpoints,
  exportMockEndpoints,
  importMockEndpoints,
} from '@/lib/api'
import { toast } from 'sonner'

export default function MockPage() {
  const [endpoints, setEndpoints] = useState<MockEndpoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingEndpoint, setEditingEndpoint] = useState<MockEndpoint | null>(null)

  // エンドポイント一覧を取得
  const fetchEndpoints = async () => {
    try {
      const result = await getMockEndpoints()
      setEndpoints(result.data)
    } catch (error) {
      toast.error('Failed to fetch mock endpoints')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEndpoints()
  }, [])

  // エンドポイント作成/更新
  const handleSave = async (data: Partial<MockEndpoint>) => {
    try {
      if (editingEndpoint) {
        await updateMockEndpoint(editingEndpoint.id, data)
        toast.success('Mock endpoint updated successfully')
      } else {
        await createMockEndpoint(data as any)
        toast.success('Mock endpoint created successfully')
      }
      await fetchEndpoints()
    } catch (error) {
      toast.error('Failed to save mock endpoint')
      throw error
    }
  }

  // エンドポイント削除
  const handleDelete = async (id: string) => {
    try {
      await deleteMockEndpoint(id)
      toast.success('Mock endpoint deleted successfully')
      await fetchEndpoints()
    } catch (error) {
      toast.error('Failed to delete mock endpoint')
      console.error(error)
    }
  }

  // すべてのエンドポイント削除
  const handleDeleteAll = async () => {
    if (!confirm('Are you sure you want to delete all mock endpoints?')) {
      return
    }

    try {
      await deleteAllMockEndpoints()
      toast.success('All mock endpoints deleted successfully')
      await fetchEndpoints()
    } catch (error) {
      toast.error('Failed to delete all mock endpoints')
      console.error(error)
    }
  }

  // エンドポイント有効/無効切り替え
  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await updateMockEndpoint(id, { enabled })
      await fetchEndpoints()
    } catch (error) {
      toast.error('Failed to toggle endpoint')
      console.error(error)
    }
  }

  // エンドポイント複製
  const handleDuplicate = async (endpoint: MockEndpoint) => {
    try {
      const { id, createdAt, updatedAt, ...data } = endpoint
      await createMockEndpoint({
        ...data,
        name: `${endpoint.name || 'Endpoint'} (Copy)`,
      })
      toast.success('Mock endpoint duplicated successfully')
      await fetchEndpoints()
    } catch (error) {
      toast.error('Failed to duplicate mock endpoint')
      console.error(error)
    }
  }

  // エクスポート
  const handleExport = async () => {
    try {
      const result = await exportMockEndpoints()
      const blob = new Blob([JSON.stringify(result.data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mock-endpoints-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Mock endpoints exported successfully')
    } catch (error) {
      toast.error('Failed to export mock endpoints')
      console.error(error)
    }
  }

  // インポート
  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const data = JSON.parse(text)

        if (!Array.isArray(data)) {
          toast.error('Invalid file format: expected an array')
          return
        }

        await importMockEndpoints(data)
        toast.success(`Successfully imported ${data.length} mock endpoints`)
        await fetchEndpoints()
      } catch (error) {
        toast.error('Failed to import mock endpoints')
        console.error(error)
      }
    }
    input.click()
  }

  // 新規作成
  const handleCreate = () => {
    setEditingEndpoint(null)
    setEditorOpen(true)
  }

  // 編集
  const handleEdit = (endpoint: MockEndpoint) => {
    setEditingEndpoint(endpoint)
    setEditorOpen(true)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mock API Management</h1>
        <p className="text-muted-foreground">
          外部APIをモック化してテストの独立性を確保します。
        </p>
      </div>

      {/* アクションボタン */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Endpoint
        </Button>
        <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
        <Button onClick={handleImport} variant="outline" className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Import
        </Button>
        <Button
          onClick={handleDeleteAll}
          variant="destructive"
          className="flex items-center gap-2"
          disabled={endpoints.length === 0}
        >
          <Trash2 className="h-4 w-4" />
          Delete All
        </Button>
      </div>

      {/* モックURL情報 */}
      <div className="bg-muted p-4 rounded-lg mb-6">
        <p className="text-sm font-medium mb-2">Mock Server Base URL:</p>
        <code className="text-sm bg-background px-2 py-1 rounded">
          http://localhost:3001/api/mock/serve
        </code>
        <p className="text-xs text-muted-foreground mt-2">
          Example: GET http://localhost:3001/api/mock/serve/api/users/123
        </p>
      </div>

      {/* エンドポイント一覧 */}
      <EndpointList
        endpoints={endpoints}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggle={handleToggle}
        onDuplicate={handleDuplicate}
      />

      {/* エディタダイアログ */}
      <EndpointEditor
        open={editorOpen}
        endpoint={editingEndpoint}
        onClose={() => setEditorOpen(false)}
        onSave={handleSave}
      />
    </div>
  )
}
