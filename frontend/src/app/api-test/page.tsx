'use client';

import { useState, useEffect } from 'react';
import { RequestForm } from '@/components/api-test/RequestForm';
import { ResponseViewer } from '@/components/api-test/ResponseViewer';
import {
  RequestHistory,
  type HistoryItem,
} from '@/components/api-test/RequestHistory';
import { proxyRequest } from '@/lib/api';
import { scenariosApi } from '@/lib/api/scenarios';
import type { TestScenario } from '@/types/scenario';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, Loader2, CheckCircle2, XCircle } from 'lucide-react';

const HISTORY_KEY = 'api-test-history';
const MAX_HISTORY = 50;

export default function ApiTestPage() {
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // シナリオ関連
  const [scenarios, setScenarios] = useState<TestScenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');
  const [isApplying, setIsApplying] = useState(false);
  const [isApplied, setIsApplied] = useState(false);

  // 履歴をLocalStorageから読み込み
  useEffect(() => {
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to load history:', e);
      }
    }
  }, []);

  // シナリオ一覧を読み込み
  useEffect(() => {
    const loadScenarios = async () => {
      try {
        const data = await scenariosApi.getAll();
        setScenarios(data);
      } catch (error) {
        console.error('Failed to load scenarios:', error);
        toast.error('シナリオの読み込みに失敗しました');
      }
    };
    loadScenarios();
  }, []);

  // 履歴をLocalStorageに保存
  const saveHistory = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  };

  // リクエスト送信
  const handleSubmit = async (data: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
    timeout?: number;
  }) => {
    setIsLoading(true);
    setResponse(null);
    setError(null);

    try {
      // ボディをパース
      let parsedBody: any = undefined;
      if (data.body) {
        try {
          parsedBody = JSON.parse(data.body);
        } catch {
          parsedBody = data.body; // JSON以外はそのまま
        }
      }

      const result = await proxyRequest({
        method: data.method,
        url: data.url,
        headers: data.headers,
        body: parsedBody,
        timeout: data.timeout,
      });

      if (result.success && result.response) {
        setResponse(result.response);
        toast.success('Request completed successfully');

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
        };

        const newHistory = [historyItem, ...history].slice(0, MAX_HISTORY);
        saveHistory(newHistory);
      } else {
        setError(result);
        toast.error('Request failed');
      }
    } catch (err) {
      console.error('Request error:', err);
      const errorData = {
        error: 'Request failed',
        message: err instanceof Error ? err.message : 'Unknown error',
        duration: 0,
        timestamp: new Date().toISOString(),
      };
      setError(errorData);
      toast.error('Request failed');
    } finally {
      setIsLoading(false);
    }
  };

  // 履歴から再実行
  const handleReplay = (item: HistoryItem) => {
    handleSubmit({
      method: item.method,
      url: item.url,
      headers: item.headers,
      body: item.body,
      timeout: item.timeout,
    });
  };

  // 履歴削除
  const handleDeleteHistory = (id: string) => {
    const newHistory = history.filter((item) => item.id !== id);
    saveHistory(newHistory);
    toast.success('History item deleted');
  };

  // 全履歴削除
  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all history?')) {
      saveHistory([]);
      toast.success('History cleared');
    }
  };

  // シナリオ適用
  const handleApplyScenario = async () => {
    if (!selectedScenarioId) {
      toast.error('シナリオを選択してください');
      return;
    }

    setIsApplying(true);
    try {
      await scenariosApi.apply(selectedScenarioId);
      setIsApplied(true);
      toast.success('シナリオを適用しました');

      // 選択されたシナリオを取得
      const scenario = scenarios.find((s) => s.id === selectedScenarioId);
      if (scenario?.testSettings) {
        // RequestFormコンポーネントに初期値を設定するためのイベントを発火
        // ここでは、適用後にフォームを手動で更新するためのロジックが必要
        toast.info('フォームにテスト設定を適用しました');
      }
    } catch (error) {
      console.error('Failed to apply scenario:', error);
      toast.error('シナリオの適用に失敗しました');
      setIsApplied(false);
    } finally {
      setIsApplying(false);
    }
  };

  // エクスポート
  const handleExport = () => {
    if (history.length === 0) {
      toast.error('エクスポートする履歴がありません');
      return;
    }

    const data = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      history: history,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-test-history-${
      new Date().toISOString().split('T')[0]
    }.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('リクエスト履歴をエクスポートしました');
  };

  // インポート
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        // バージョンチェック
        if (!data.version || !data.history || !Array.isArray(data.history)) {
          toast.error('Invalid file format');
          return;
        }

        // 履歴をマージするか確認
        if (history.length > 0) {
          if (
            confirm(
              '既存の履歴に追加しますか？キャンセルすると上書きされます。'
            )
          ) {
            const mergedHistory = [...data.history, ...history].slice(
              0,
              MAX_HISTORY
            );
            saveHistory(mergedHistory);
          } else {
            saveHistory(data.history.slice(0, MAX_HISTORY));
          }
        } else {
          saveHistory(data.history.slice(0, MAX_HISTORY));
        }

        toast.success(
          `Successfully imported ${data.history.length} history items`
        );
      } catch (error) {
        toast.error('Failed to import history');
        console.error(error);
      }
    };
    input.click();
  };

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">API Test Client</h1>
        <p className="text-muted-foreground">
          Spring Boot APIエンドポイントをテストします
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 左側: シナリオ選択 + リクエストフォーム */}
        <div className="space-y-6">
          {/* シナリオ選択 */}
          <Card>
            <CardHeader>
              <CardTitle>シナリオから適用</CardTitle>
              <CardDescription>
                登録済みのテストシナリオを選択して環境を構築
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">
                    シナリオ選択
                  </label>
                  <Select
                    value={selectedScenarioId}
                    onValueChange={(value) => {
                      setSelectedScenarioId(value);
                      setIsApplied(false);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="シナリオを選択..." />
                    </SelectTrigger>
                    <SelectContent>
                      {scenarios.map((scenario) => (
                        <SelectItem key={scenario.id} value={scenario.id}>
                          {scenario.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleApplyScenario}
                  disabled={!selectedScenarioId || isApplying}
                >
                  {isApplying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      適用中...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-4 w-4 mr-2" />
                      適用
                    </>
                  )}
                </Button>
              </div>
              {selectedScenarioId && (
                <div className="flex items-center gap-2">
                  {isApplied ? (
                    <Badge className="bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      適用済み
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <XCircle className="h-3 w-3 mr-1" />
                      未適用
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <RequestForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
            onExport={handleExport}
            onImport={handleImport}
            initialData={
              selectedScenarioId && isApplied
                ? scenarios.find((s) => s.id === selectedScenarioId)
                : undefined
            }
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
  );
}
