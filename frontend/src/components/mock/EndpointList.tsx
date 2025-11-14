'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Trash2, Edit, Copy } from 'lucide-react'
import type { MockEndpoint } from '@/lib/api'

interface EndpointListProps {
  endpoints: MockEndpoint[]
  onEdit: (endpoint: MockEndpoint) => void
  onDelete: (id: string) => void
  onToggle: (id: string, enabled: boolean) => void
  onDuplicate: (endpoint: MockEndpoint) => void
}

export function EndpointList({
  endpoints,
  onEdit,
  onDelete,
  onToggle,
  onDuplicate,
}: EndpointListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await onDelete(id)
    } finally {
      setDeletingId(null)
    }
  }

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-500'
      case 'POST':
        return 'bg-green-500'
      case 'PUT':
        return 'bg-yellow-500'
      case 'DELETE':
        return 'bg-red-500'
      case 'PATCH':
        return 'bg-purple-500'
      default:
        return 'bg-gray-500'
    }
  }

  if (endpoints.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            モックエンドポイントがありません。新しいエンドポイントを作成してください。
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {endpoints.map((endpoint) => (
        <Card key={endpoint.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={`${getMethodColor(endpoint.method)} text-white`}>
                    {endpoint.method}
                  </Badge>
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {endpoint.path}
                  </code>
                  <Badge variant="outline">Priority: {endpoint.priority}</Badge>
                </div>
                <CardTitle className="text-base">
                  {endpoint.name || 'Unnamed Endpoint'}
                </CardTitle>
                <CardDescription className="mt-1">
                  Status: {endpoint.response.status}
                  {endpoint.response.delay && ` | Delay: ${endpoint.response.delay}ms`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={endpoint.enabled}
                  onCheckedChange={(checked: boolean) => onToggle(endpoint.id, checked)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Response Preview */}
              <div>
                <p className="text-sm font-medium mb-1">Response Body:</p>
                <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-32">
                  {JSON.stringify(endpoint.response.body, null, 2)}
                </pre>
              </div>

              {/* Request Match Conditions */}
              {endpoint.requestMatch && (
                <div>
                  <p className="text-sm font-medium mb-1">Match Conditions:</p>
                  <div className="text-xs bg-muted p-2 rounded space-y-1">
                    {endpoint.requestMatch.query && (
                      <div>
                        <span className="font-medium">Query:</span>{' '}
                        {JSON.stringify(endpoint.requestMatch.query)}
                      </div>
                    )}
                    {endpoint.requestMatch.headers && (
                      <div>
                        <span className="font-medium">Headers:</span>{' '}
                        {JSON.stringify(endpoint.requestMatch.headers)}
                      </div>
                    )}
                    {endpoint.requestMatch.body && (
                      <div>
                        <span className="font-medium">Body:</span>{' '}
                        {JSON.stringify(endpoint.requestMatch.body)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(endpoint)}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDuplicate(endpoint)}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Duplicate
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(endpoint.id)}
                  disabled={deletingId === endpoint.id}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {deletingId === endpoint.id ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
