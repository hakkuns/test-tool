'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { RequestForm } from '@/components/api-test/RequestForm';
import { ResponseViewer } from '@/components/api-test/ResponseViewer';
import {
  RequestHistory,
  type HistoryItem,
} from '@/components/api-test/RequestHistory';
import { MockEndpointList } from '@/components/api-test/MockEndpointList';
import { TableList } from '@/components/api-test/TableList';
import { proxyRequest, getMockEndpoints } from '@/lib/api';
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
import { PlayCircle, Loader2, CheckCircle2, XCircle, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';

const HISTORY_KEY = 'api-test-history';
const MAX_HISTORY = 50;

export default function ApiTestPage() {
  const router = useRouter();
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // シナリオ関連
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');
  const [isApplied, setIsApplied] = useState(false);

  // シナリオ一覧を取得（useQuery）
  const { data: scenarios = [], isLoading: isScenariosLoading } = useQuery<
    TestScenario[]
  >({
    queryKey: ['scenarios'],
    queryFn: async () => {
      const data = await scenariosApi.getAll();
      return data;
    },
  });

  // モックエンドポイント一覧を取得（useQuery）
  const { data: mockEndpointsData } = useQuery({
    queryKey: ['mock-endpoints'],
    queryFn: async () => {
      const result = await getMockEndpoints();
      return result;
    },
    refetchInterval: 10000, // 10秒ごとに自動更新
  });

  const mockEndpoints = mockEndpointsData?.data || [];

  // シナリオで実際にデータが追加されたテーブル一覧を取得
  const tables =
    selectedScenarioId && isApplied
      ? (() => {
          const scenario = scenarios.find((s) => s.id === selectedScenarioId);
          // tableDataに存在するテーブル名のみを返す（参照のみのテーブルも含む）
          return scenario?.tableData?.map((td) => td.tableName) || [];
        })()
      : [];

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

    // 適用中のシナリオを確認
    const appliedScenarioId = localStorage.getItem('appliedScenarioId');
    if (appliedScenarioId) {
      setSelectedScenarioId(appliedScenarioId);
      setIsApplied(true);
    }
  }, []);

  // シナリオが読み込まれた後、選択されたシナリオが存在するか確認
  useEffect(() => {
    // シナリオのロードが完了した後にチェック
    if (!isScenariosLoading && selectedScenarioId) {
      const scenarioExists = scenarios.some((s) => s.id === selectedScenarioId);
      if (!scenarioExists) {
        // シナリオが存在しない場合、リセット
        setSelectedScenarioId('');
        setIsApplied(false);
        localStorage.removeItem('appliedScenarioId');
        toast.error('適用されていたシナリオが削除されました');
      }
    }
  }, [scenarios, selectedScenarioId, isScenariosLoading]);

  // 履歴をLocalStorageに保存
  const saveHistory = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  };

  // リクエスト送信（useMutation）
  const requestMutation = useMutation({
    mutationFn: async (data: {
      method: string;
      url: string;
      headers: Record<string, string>;
      body?: string;
      timeout?: number;
    }) => {
      // ボディをパース
      let parsedBody: any = undefined;
      if (data.body) {
        try {
          parsedBody = JSON.parse(data.body);
        } catch {
          parsedBody = data.body; // JSON以外はそのまま
        }
      }

      return await proxyRequest({
        method: data.method,
        url: data.url,
        headers: data.headers,
        body: parsedBody,
        timeout: data.timeout,
      });
    },
    onSuccess: (result, variables) => {
      if (result.success && result.response) {
        setResponse(result.response);
        toast.success('Request completed successfully');

        // 履歴に追加
        const historyItem: HistoryItem = {
          id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          method: variables.method,
          url: variables.url,
          headers: variables.headers,
          body: variables.body,
          timeout: variables.timeout,
          timestamp: new Date().toISOString(),
          scenarioName:
            selectedScenarioId && isApplied
              ? scenarios.find((s) => s.id === selectedScenarioId)?.name
              : undefined,
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
    },
    onError: (err) => {
      console.error('Request error:', err);
      const errorData = {
        error: 'Request failed',
        message: err instanceof Error ? err.message : 'Unknown error',
        duration: 0,
        timestamp: new Date().toISOString(),
      };
      setError(errorData);
      toast.error('Request failed');
    },
  });

  // リクエスト送信
  const handleSubmit = async (data: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
    timeout?: number;
  }) => {
    setResponse(null);
    setError(null);
    requestMutation.mutate(data);
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

  // シナリオ適用（useMutation）
  const applyScenarioMutation = useMutation({
    mutationFn: async (scenarioId: string) => {
      return await scenariosApi.apply(scenarioId);
    },
    onSuccess: (result, scenarioId) => {
      // 適用成功後、LocalStorageに保存
      localStorage.setItem('appliedScenarioId', scenarioId);
      setIsApplied(true);

      toast.success(
        `シナリオを適用しました\nテーブル: ${result.tablesCreated}個\nデータ: ${result.dataInserted}行\nモックAPI: ${result.mocksConfigured}個`
      );

      // 選択されたシナリオを取得
      const scenario = scenarios.find((s) => s.id === scenarioId);
      if (scenario?.testSettings) {
        toast.info('フォームにテスト設定を適用しました');
      }
    },
    onError: (error) => {
      console.error('Failed to apply scenario:', error);
      toast.error(
        error instanceof Error ? error.message : 'シナリオの適用に失敗しました'
      );
      setIsApplied(false);
    },
  });

  // シナリオ適用
  const handleApplyScenario = async () => {
    if (!selectedScenarioId) {
      toast.error('シナリオを選択してください');
      return;
    }

    applyScenarioMutation.mutate(selectedScenarioId);
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
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="シナリオを選択..." />
                    </SelectTrigger>
                    <SelectContent className="min-w-[300px]">
                      {scenarios.map((scenario) => (
                        <SelectItem key={scenario.id} value={scenario.id}>
                          {scenario.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    router.push(`/scenarios/${selectedScenarioId}`)
                  }
                  disabled={!selectedScenarioId}
                  title="シナリオを編集"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handleApplyScenario}
                  disabled={
                    !selectedScenarioId || applyScenarioMutation.isPending
                  }
                >
                  {applyScenarioMutation.isPending ? (
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
            isLoading={requestMutation.isPending}
            initialData={
              selectedScenarioId && isApplied
                ? scenarios.find((s) => s.id === selectedScenarioId)
                : undefined
            }
          />
          <TableList tables={tables} />
          <MockEndpointList endpoints={mockEndpoints} />
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
