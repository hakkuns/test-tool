'use client'

import { useState, useEffect } from 'react'
import { RequestForm } from '@/components/api-test/RequestForm'
import { ResponseViewer } from '@/components/api-test/ResponseViewer'
import { RequestHistory, type HistoryItem } from '@/components/api-test/RequestHistory'
import { proxyRequest } from '@/lib/api'
import { toast } from 'sonner'

const HISTORY_KEY = 'api-test-history'
const MAX_HISTORY = 50

export default function ApiTestPage() {
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])

  // 履歴をLocalStorageから読み込み
  useEffect(() => {
    const savedHistory = localStorage.getItem(HISTORY_KEY)
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory))
      } catch (e) {
        console.error('Failed to load history:', e)
      }
    }
  }, [])

  // 履歴をLocalStorageに保存
  const saveHistory = (newHistory: HistoryItem[]) => {
    setHistory(newHistory)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory))
  }

  // リクエスト送信
  const handleSubmit = async (data: {
    method: string
    url: string
    headers: Record<string, string>
    body?: string
    timeout?: number
  }) => {
    setIsLoading(true)
    setResponse(null)
    setError(null)

    try {
      // ボディをパース
      let parsedBody: any = undefined
      if (data.body) {
        try {
          parsedBody = JSON.parse(data.body)
        } catch {
          parsedBody = data.body // JSON以外はそのまま
        }
      }

      const result = await proxyRequest({
        method: data.method,
        url: data.url,
        headers: data.headers,
        body: parsedBody,
        timeout: data.timeout,
      })

      if (result.success && result.response) {
        setResponse(result.response)
        toast.success('Request completed successfully')

        // 履歴に追加
        const historyItem: HistoryItem = {
          id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          method: data.method,
          url: data.url,
          headers: data.headers,
          body: data.body,
          timeout: data.timeout,
          timestamp: new Date().toISOString(),
          response: {
            status: result.response.status,
            duration: result.response.duration,
          },
        }

        const newHistory = [historyItem, ...history].slice(0, MAX_HISTORY)
        saveHistory(newHistory)
      } else {
        setError(result)
        toast.error('Request failed')
      }
    } catch (err) {
      console.error('Request error:', err)
      const errorData = {
        error: 'Request failed',
        message: err instanceof Error ? err.message : 'Unknown error',
        duration: 0,
        timestamp: new Date().toISOString(),
      }
      setError(errorData)
      toast.error('Request failed')
    } finally {
      setIsLoading(false)
    }
  }

  // 履歴から再実行
  const handleReplay = (item: HistoryItem) => {
    handleSubmit({
      method: item.method,
      url: item.url,
      headers: item.headers,
      body: item.body,
      timeout: item.timeout,
    })
  }

  // 履歴削除
  const handleDeleteHistory = (id: string) => {
    const newHistory = history.filter((item) => item.id !== id)
    saveHistory(newHistory)
    toast.success('History item deleted')
  }

  // 全履歴削除
  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all history?')) {
      saveHistory([])
      toast.success('History cleared')
    }
  }

  // エクスポート
  const handleExport = () => {
    if (history.length === 0) {
      toast.error('エクスポートする履歴がありません')
      return
    }

    const data = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      history: history,
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `api-test-history-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('履歴をエクスポートしました')
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

        // バリデーション
        if (!data.history || !Array.isArray(data.history)) {
          toast.error('無効なファイル形式です')
          return
        }

        // 現在の履歴とマージするか確認
        if (history.length > 0) {
          const shouldMerge = confirm(
            `現在${history.length}件の履歴があります。インポートした履歴とマージしますか？\n` +
              'キャンセルを押すと既存の履歴を置き換えます。'
          )

          if (shouldMerge) {
            // マージ（重複を除外）
            const existingIds = new Set(history.map((h) => h.id))
            const newItems = data.history.filter((h: HistoryItem) => !existingIds.has(h.id))
            const merged = [...newItems, ...history].slice(0, MAX_HISTORY)
            saveHistory(merged)
            toast.success(
              `${newItems.length}件の新しい履歴をインポートしました（合計: ${merged.length}件）`
            )
          } else {
            // 置き換え
            saveHistory(data.history.slice(0, MAX_HISTORY))
            toast.success(`${data.history.length}件の履歴をインポートしました`)
          }
        } else {
          // 履歴が空の場合はそのままインポート
          saveHistory(data.history.slice(0, MAX_HISTORY))
          toast.success(`${data.history.length}件の履歴をインポートしました`)
        }
      } catch (error) {
        toast.error('履歴のインポートに失敗しました')
        console.error(error)
      }
    }
    input.click()
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">API Test Client</h1>
        <p className="text-muted-foreground">
          Spring Boot APIエンドポイントをテストします
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 左側: リクエストフォーム */}
        <div className="space-y-6">
          <RequestForm
            onSubmit={handleSubmit}
            onExport={handleExport}
            onImport={handleImport}
            isLoading={isLoading}
          />
          <RequestHistory
            history={history}
            onReplay={handleReplay}
            onDelete={handleDeleteHistory}
            onClear={handleClearHistory}
          />
        </div>

        {/* 右側: レスポンス表示 */}
        <div>
          <ResponseViewer response={response} error={error} />
        </div>
      </div>
    </div>
  )
}
