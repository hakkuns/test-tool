'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ResponseViewerProps {
  response: {
    status: number
    statusText: string
    headers: Record<string, string>
    body: any
    duration: number
    timestamp: string
  } | null
  error?: {
    error: string
    message: string
    duration: number
    timestamp: string
  } | null
}

export function ResponseViewer({ response, error }: ResponseViewerProps) {
  if (!response && !error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            リクエストを送信するとレスポンスがここに表示されます
          </p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Error Response</CardTitle>
            <Badge variant="destructive">{error.error}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-1">Error Message:</p>
            <div className="bg-destructive/15 text-destructive p-3 rounded">
              {error.message}
            </div>
          </div>

          <div className="flex gap-4 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">Duration:</span> {error.duration}ms
            </div>
            <div>
              <span className="font-medium">Time:</span>{' '}
              {new Date(error.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!response) return null

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'bg-green-500'
    if (status >= 300 && status < 400) return 'bg-blue-500'
    if (status >= 400 && status < 500) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const formatBody = (body: any) => {
    if (typeof body === 'string') {
      try {
        return JSON.stringify(JSON.parse(body), null, 2)
      } catch {
        return body
      }
    }
    return JSON.stringify(body, null, 2)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Response</CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={`${getStatusColor(response.status)} text-white`}>
              {response.status} {response.statusText}
            </Badge>
            <Badge variant="outline">{response.duration}ms</Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {new Date(response.timestamp).toLocaleString()}
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="body">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="body">Body</TabsTrigger>
            <TabsTrigger value="headers">Headers</TabsTrigger>
          </TabsList>

          {/* Body Tab */}
          <TabsContent value="body">
            <ScrollArea className="h-96 w-full rounded border">
              <pre className="p-4 text-sm font-mono">
                {formatBody(response.body)}
              </pre>
            </ScrollArea>
          </TabsContent>

          {/* Headers Tab */}
          <TabsContent value="headers">
            <ScrollArea className="h-96 w-full rounded border">
              <div className="p-4 space-y-2">
                {Object.entries(response.headers).map(([key, value]) => (
                  <div key={key} className="text-sm">
                    <span className="font-medium">{key}:</span>{' '}
                    <span className="text-muted-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
