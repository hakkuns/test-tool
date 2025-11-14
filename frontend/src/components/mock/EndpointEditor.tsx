'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { MockEndpoint } from '@/lib/api'

interface EndpointEditorProps {
  open: boolean
  endpoint?: MockEndpoint | null
  onClose: () => void
  onSave: (data: Partial<MockEndpoint>) => Promise<void>
}

export function EndpointEditor({ open, endpoint, onClose, onSave }: EndpointEditorProps) {
  const [name, setName] = useState('')
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'>('GET')
  const [path, setPath] = useState('')
  const [priority, setPriority] = useState('0')
  const [responseStatus, setResponseStatus] = useState('200')
  const [responseBody, setResponseBody] = useState('{}')
  const [responseHeaders, setResponseHeaders] = useState('')
  const [responseDelay, setResponseDelay] = useState('')
  const [matchQuery, setMatchQuery] = useState('')
  const [matchHeaders, setMatchHeaders] = useState('')
  const [matchBody, setMatchBody] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // エンドポイントデータを初期化
  useEffect(() => {
    if (endpoint) {
      setName(endpoint.name || '')
      setMethod(endpoint.method)
      setPath(endpoint.path)
      setPriority(endpoint.priority.toString())
      setResponseStatus(endpoint.response.status.toString())
      setResponseBody(JSON.stringify(endpoint.response.body, null, 2))
      setResponseHeaders(
        endpoint.response.headers ? JSON.stringify(endpoint.response.headers, null, 2) : ''
      )
      setResponseDelay(endpoint.response.delay?.toString() || '')
      setMatchQuery(
        endpoint.requestMatch?.query
          ? JSON.stringify(endpoint.requestMatch.query, null, 2)
          : ''
      )
      setMatchHeaders(
        endpoint.requestMatch?.headers
          ? JSON.stringify(endpoint.requestMatch.headers, null, 2)
          : ''
      )
      setMatchBody(
        endpoint.requestMatch?.body ? JSON.stringify(endpoint.requestMatch.body, null, 2) : ''
      )
    } else {
      // リセット
      setName('')
      setMethod('GET')
      setPath('/api/')
      setPriority('0')
      setResponseStatus('200')
      setResponseBody('{\n  "message": "Success"\n}')
      setResponseHeaders('')
      setResponseDelay('')
      setMatchQuery('')
      setMatchHeaders('')
      setMatchBody('')
    }
    setError(null)
  }, [endpoint, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      // JSON文字列をパース
      const parsedResponseBody = JSON.parse(responseBody)
      const parsedResponseHeaders = responseHeaders ? JSON.parse(responseHeaders) : undefined
      const parsedMatchQuery = matchQuery ? JSON.parse(matchQuery) : undefined
      const parsedMatchHeaders = matchHeaders ? JSON.parse(matchHeaders) : undefined
      const parsedMatchBody = matchBody ? JSON.parse(matchBody) : undefined

      const data: Partial<MockEndpoint> = {
        name: name || undefined,
        method,
        path,
        priority: Number.parseInt(priority),
        enabled: endpoint?.enabled ?? true,
        response: {
          status: Number.parseInt(responseStatus),
          headers: parsedResponseHeaders,
          body: parsedResponseBody,
          delay: responseDelay ? Number.parseInt(responseDelay) : undefined,
        },
        requestMatch:
          parsedMatchQuery || parsedMatchHeaders || parsedMatchBody
            ? {
                query: parsedMatchQuery,
                headers: parsedMatchHeaders,
                body: parsedMatchBody,
              }
            : undefined,
      }

      await onSave(data)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save endpoint')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{endpoint ? 'Edit Mock Endpoint' : 'Create Mock Endpoint'}</DialogTitle>
          <DialogDescription>
            モックエンドポイントを設定します。パスパラメータには :id のような形式を使用できます。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/15 text-destructive px-4 py-2 rounded text-sm">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name (Optional)</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="User API Mock"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="method">Method</Label>
                <Select value={method} onValueChange={(v: any) => setMethod(v)}>
                  <SelectTrigger id="method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Input
                  id="priority"
                  type="number"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="path">Path</Label>
              <Input
                id="path"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/api/users/:id"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Example: /api/users/:id (パラメータは :name 形式)
              </p>
            </div>
          </div>

          <Tabs defaultValue="response">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="response">Response</TabsTrigger>
              <TabsTrigger value="match">Match Conditions</TabsTrigger>
            </TabsList>

            {/* Response Tab */}
            <TabsContent value="response" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="responseStatus">Status Code</Label>
                  <Input
                    id="responseStatus"
                    type="number"
                    value={responseStatus}
                    onChange={(e) => setResponseStatus(e.target.value)}
                    placeholder="200"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="responseDelay">Delay (ms)</Label>
                  <Input
                    id="responseDelay"
                    type="number"
                    value={responseDelay}
                    onChange={(e) => setResponseDelay(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="responseBody">Response Body (JSON)</Label>
                <Textarea
                  id="responseBody"
                  value={responseBody}
                  onChange={(e) => setResponseBody(e.target.value)}
                  placeholder='{"message": "Success"}'
                  className="font-mono text-sm h-32"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  パスパラメータは {`{{paramName}}`} で埋め込めます
                </p>
              </div>

              <div>
                <Label htmlFor="responseHeaders">Response Headers (JSON, Optional)</Label>
                <Textarea
                  id="responseHeaders"
                  value={responseHeaders}
                  onChange={(e) => setResponseHeaders(e.target.value)}
                  placeholder='{"Content-Type": "application/json"}'
                  className="font-mono text-sm h-20"
                />
              </div>
            </TabsContent>

            {/* Match Conditions Tab */}
            <TabsContent value="match" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                以下の条件を設定すると、該当するリクエストのみにマッチします（省略可）
              </p>

              <div>
                <Label htmlFor="matchQuery">Query Parameters (JSON, Optional)</Label>
                <Textarea
                  id="matchQuery"
                  value={matchQuery}
                  onChange={(e) => setMatchQuery(e.target.value)}
                  placeholder='{"status": "active"}'
                  className="font-mono text-sm h-20"
                />
              </div>

              <div>
                <Label htmlFor="matchHeaders">Headers (JSON, Optional)</Label>
                <Textarea
                  id="matchHeaders"
                  value={matchHeaders}
                  onChange={(e) => setMatchHeaders(e.target.value)}
                  placeholder='{"Authorization": "Bearer token"}'
                  className="font-mono text-sm h-20"
                />
              </div>

              <div>
                <Label htmlFor="matchBody">Request Body (JSON, Optional)</Label>
                <Textarea
                  id="matchBody"
                  value={matchBody}
                  onChange={(e) => setMatchBody(e.target.value)}
                  placeholder='{"type": "user"}'
                  className="font-mono text-sm h-20"
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : endpoint ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
