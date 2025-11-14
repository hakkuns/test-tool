'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Trash2, Play } from 'lucide-react'

export interface HistoryItem {
  id: string
  method: string
  url: string
  headers: Record<string, string>
  body?: string
  timeout?: number
  timestamp: string
  response?: {
    status: number
    duration: number
  }
}

interface RequestHistoryProps {
  history: HistoryItem[]
  onReplay: (item: HistoryItem) => void
  onDelete: (id: string) => void
  onClear: () => void
}

export function RequestHistory({ history, onReplay, onDelete, onClear }: RequestHistoryProps) {
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

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Request History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            リクエスト履歴がありません
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Request History ({history.length})</CardTitle>
          <Button variant="outline" size="sm" onClick={onClear}>
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-2">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 p-3 border rounded hover:bg-muted/50 transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={`${getMethodColor(item.method)} text-white text-xs`}>
                      {item.method}
                    </Badge>
                    {item.response && (
                      <Badge variant="outline" className="text-xs">
                        {item.response.status}
                      </Badge>
                    )}
                    {item.response && (
                      <Badge variant="outline" className="text-xs">
                        {item.response.duration}ms
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm truncate font-mono">{item.url}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.timestamp).toLocaleString()}
                  </p>
                </div>

                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onReplay(item)}
                    title="Replay"
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(item.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
