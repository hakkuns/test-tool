"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Edit, Loader2, PlayCircle, XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { MockEndpointList } from "@/components/api-test/MockEndpointList";
import { MockLogViewer } from "@/components/api-test/MockLogViewer";
import { RequestForm } from "@/components/api-test/RequestForm";
import {
  type HistoryItem,
  RequestHistory,
} from "@/components/api-test/RequestHistory";
import { ResponseViewer } from "@/components/api-test/ResponseViewer";
import { TableList } from "@/components/api-test/TableList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  clearMockLogs,
  getMockEndpoints,
  getMockLogs,
  type MockRequestLog,
  proxyRequest,
} from "@/lib/api";
import { groupsApi, scenariosApi } from "@/lib/api/scenarios";
import type { ScenarioGroup, TestScenario } from "@/types/scenario";
import {
  replaceConstantsInHeaders,
  replaceConstantsInObject,
} from "@/utils/constants";

const HISTORY_KEY = "api-test-history";
const MAX_HISTORY = 50;

// シナリオのハッシュを計算する関数（変更検知用）
function calculateScenarioHash(scenario: TestScenario): string {
  const hashContent = JSON.stringify({
    tableData: scenario.tableData,
    mockApis: scenario.mockApis,
    testSettings: scenario.testSettings,
    updatedAt: scenario.updatedAt,
  });
  // 簡易的なハッシュ（必要に応じてライブラリを使用）
  let hash = 0;
  for (let i = 0; i < hashContent.length; i++) {
    const char = hashContent.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

function ApiTestPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [mockLogs, setMockLogs] = useState<MockRequestLog[]>([]);

  // シナリオ関連
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("");
  const [appliedScenarioId, setAppliedScenarioId] = useState<string>("");
  const [appliedScenarioHash, setAppliedScenarioHash] = useState<string>("");
  const [groupFilter, setGroupFilter] = useState<string>("all");

  // シナリオ一覧を取得（useQuery）
  const {
    data: scenarios = [],
    isLoading: isScenariosLoading,
    dataUpdatedAt,
  } = useQuery<TestScenario[]>({
    queryKey: ["scenarios"],
    queryFn: async () => {
      const data = await scenariosApi.getAll();
      // デバッグログ
      if (process.env.NODE_ENV === "development") {
        console.log("シナリオ一覧取得:", {
          count: data.length,
          scenariosWithGroup: data
            .filter((s) => s.groupId)
            .map((s) => ({
              id: s.id,
              name: s.name,
              groupId: s.groupId,
              groupIdType: typeof s.groupId,
            })),
        });
      }
      return data;
    },
  });

  // グループ一覧を取得（useQuery）
  const { data: groups = [] } = useQuery<ScenarioGroup[]>({
    queryKey: ["scenario-groups"],
    queryFn: async () => {
      const data = await groupsApi.getAll();
      // デバッグログ
      if (process.env.NODE_ENV === "development") {
        console.log("グループ一覧取得:", {
          count: data.length,
          groups: data.map((g) => ({
            id: g.id,
            name: g.name,
            idType: typeof g.id,
          })),
        });
      }
      return data;
    },
  });

  // フィルタリングされたシナリオ
  const filteredScenarios = useMemo(() => {
    if (groupFilter === "all") {
      return scenarios;
    }
    if (groupFilter === "ungrouped") {
      return scenarios.filter((s) => !s.groupId);
    }
    // groupIdとgroupFilterの両方を比較（型変換なしで直接比較）
    const filtered = scenarios.filter((s) => s.groupId === groupFilter);

    // デバッグログ（開発中のみ）
    if (
      process.env.NODE_ENV === "development" &&
      filtered.length === 0 &&
      scenarios.some((s) => s.groupId)
    ) {
      console.log("グループフィルタリングデバッグ:", {
        groupFilter,
        groupFilterType: typeof groupFilter,
        totalScenarios: scenarios.length,
        scenariosWithGroupId: scenarios
          .filter((s) => s.groupId)
          .map((s) => ({
            name: s.name,
            groupId: s.groupId,
            groupIdType: typeof s.groupId,
            match: s.groupId === groupFilter,
          })),
      });
    }

    return filtered;
  }, [scenarios, groupFilter]);

  // モックエンドポイント一覧を取得（useQuery）
  const { data: mockEndpointsData } = useQuery({
    queryKey: ["mock-endpoints"],
    queryFn: async () => {
      const result = await getMockEndpoints();
      return result;
    },
    refetchInterval: 10000, // 10秒ごとに自動更新
  });

  const mockEndpoints = mockEndpointsData?.data || [];

  // シナリオで実際にデータが追加されたテーブル一覧を取得
  const tables = appliedScenarioId
    ? (() => {
        const scenario = scenarios.find((s) => s.id === appliedScenarioId);
        // tableDataに存在するテーブル名のみを返す（参照のみのテーブルも含む）
        return scenario?.tableData?.map((td) => td.tableName) || [];
      })()
    : [];

  // 元のシナリオ（定数パターンを含む）を取得
  const originalScenario = useMemo(() => {
    if (!appliedScenarioId) return undefined;
    return scenarios.find((s) => s.id === appliedScenarioId);
  }, [appliedScenarioId, scenarios]);

  // 選択されたシナリオの定数を変換
  const convertedScenario = useMemo(() => {
    if (!appliedScenarioId) return undefined;

    const scenario = scenarios.find((s) => s.id === appliedScenarioId);
    if (!scenario) {
      // シナリオデータが読み込まれていない場合はnullを返す（undefinedと区別）
      return null;
    }

    // 値のマッピングを共有して、ヘッダーとボディで同じ定数は同じ値になるようにする
    const valueMap = new Map<string, string>();

    // testSettingsの定数を変換
    const convertedHeaders = scenario.testSettings?.headers
      ? replaceConstantsInHeaders(scenario.testSettings.headers, valueMap)
      : {};

    let convertedBody = scenario.testSettings?.body || "";
    if (convertedBody) {
      try {
        const parsedBody = JSON.parse(convertedBody);
        const convertedBodyObj = replaceConstantsInObject(parsedBody, valueMap);
        convertedBody = JSON.stringify(convertedBodyObj, null, 2);
      } catch {
        // JSONでない場合はそのまま
      }
    }

    return {
      ...scenario,
      testSettings: {
        ...scenario.testSettings,
        headers: convertedHeaders,
        body: convertedBody,
      },
    };
  }, [appliedScenarioId, scenarios]);

  // 履歴をLocalStorageから読み込み
  useEffect(() => {
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load history:", e);
      }
    }

    // クエリパラメータからシナリオIDを取得
    const scenarioIdFromQuery = searchParams.get("scenario");

    // 適用中のシナリオを確認
    const savedAppliedScenarioId = localStorage.getItem("appliedScenarioId");
    const savedHash = localStorage.getItem("appliedScenarioHash");

    // 適用中のシナリオを復元
    if (savedAppliedScenarioId) {
      setAppliedScenarioId(savedAppliedScenarioId);
      if (savedHash) {
        setAppliedScenarioHash(savedHash);
      }
    }

    // クエリパラメータにシナリオIDがある場合は選択状態にする
    if (scenarioIdFromQuery) {
      setSelectedScenarioId(scenarioIdFromQuery);
    } else if (savedAppliedScenarioId) {
      // クエリパラメータがない場合は、適用中のシナリオを選択
      setSelectedScenarioId(savedAppliedScenarioId);
    }
  }, [searchParams]);

  // シナリオが読み込まれた後、適用済みシナリオが存在するか確認
  useEffect(() => {
    // シナリオのロードが完了し、かつデータが存在する場合のみチェック
    // dataUpdatedAtが0でない（データが取得済み）かつローディングが完了している場合
    // 適用済みシナリオのみをチェック
    if (
      !isScenariosLoading &&
      dataUpdatedAt > 0 &&
      appliedScenarioId
    ) {
      const scenarioExists = scenarios.some((s) => s.id === appliedScenarioId);
      if (!scenarioExists) {
        // 適用済みシナリオが存在しない場合、リセット
        setSelectedScenarioId("");
        setAppliedScenarioId("");
        setAppliedScenarioHash("");
        localStorage.removeItem("appliedScenarioId");
        localStorage.removeItem("appliedScenarioHash");
        toast.error("適用されていたシナリオが削除されました");
      }
    }
  }, [
    scenarios,
    appliedScenarioId,
    isScenariosLoading,
    dataUpdatedAt,
  ]);

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
      // リクエスト送信前にモックログをクリア
      await clearMockLogs();

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
    onSuccess: async (result, variables) => {
      if (result.success && result.response) {
        setResponse(result.response);
        toast.success("リクエストが正常に完了しました");

        // レスポンス受信後にモックログを取得
        try {
          const logsResult = await getMockLogs();
          if (logsResult.success) {
            setMockLogs(logsResult.data);
          }
        } catch (err) {
          console.error("Failed to fetch mock logs:", err);
        }

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
            appliedScenarioId
              ? scenarios.find((s) => s.id === appliedScenarioId)?.name
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
        toast.error("リクエストに失敗しました");
      }
    },
    onError: (err) => {
      console.error("Request error:", err);
      const errorData = {
        error: "リクエストに失敗しました",
        message: err instanceof Error ? err.message : "不明なエラー",
        duration: 0,
        timestamp: new Date().toISOString(),
      };
      setError(errorData);
      toast.error("リクエストに失敗しました");
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
    setMockLogs([]);
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
    toast.success("履歴項目を削除しました");
  };

  // 全履歴削除
  const handleClearHistory = () => {
    if (confirm("すべての履歴を削除してよろしいですか?")) {
      saveHistory([]);
      toast.success("履歴をクリアしました");
    }
  };

  // シナリオ適用（useMutation）
  const applyScenarioMutation = useMutation({
    mutationFn: async (scenarioId: string) => {
      return await scenariosApi.apply(scenarioId);
    },
    onSuccess: async (result, scenarioId) => {
      // 適用成功後、シナリオのハッシュを計算してLocalStorageに保存
      const scenario = scenarios.find((s) => s.id === scenarioId);
      const hash = scenario ? calculateScenarioHash(scenario) : "";

      localStorage.setItem("appliedScenarioId", scenarioId);
      localStorage.setItem("appliedScenarioHash", hash);
      setAppliedScenarioId(scenarioId);
      setAppliedScenarioHash(hash);

      // モックエンドポイントとシナリオ一覧を即座に再取得
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["mock-endpoints"] }),
        queryClient.invalidateQueries({ queryKey: ["scenarios"] }),
      ]);

      toast.success(
        `シナリオを適用しました\nテーブル: ${scenario?.tableData?.length || 0}個\nデータ: ${result.dataInserted}行\nモックAPI: ${result.mocksConfigured}個`,
      );

      // シナリオにテスト設定がある場合は通知
      if (scenario?.testSettings) {
        toast.info("フォームにテスト設定を適用しました");
      }
    },
    onError: (error) => {
      console.error("Failed to apply scenario:", error);
      toast.error(
        error instanceof Error ? error.message : "シナリオの適用に失敗しました",
      );
    },
  });

  // シナリオ適用
  const handleApplyScenario = async () => {
    if (!selectedScenarioId) {
      toast.error("シナリオを選択してください");
      return;
    }

    applyScenarioMutation.mutate(selectedScenarioId);
  };

  // シナリオが更新されたかどうかを判定
  const isScenarioModified = useMemo(() => {
    if (!appliedScenarioId || !appliedScenarioHash) {
      return false;
    }

    const currentScenario = scenarios.find((s) => s.id === appliedScenarioId);
    if (!currentScenario) {
      return false;
    }

    const currentHash = calculateScenarioHash(currentScenario);
    return currentHash !== appliedScenarioHash;
  }, [appliedScenarioId, appliedScenarioHash, scenarios]);

  return (
    <div className="container mx-auto p-8 space-y-6">
      {/* シナリオから適用 - 1行に配置 */}
      <div className="flex flex-col gap-3 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Select value={groupFilter} onValueChange={setGroupFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="グループ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="ungrouped">未分類</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id} title={group.name}>
                  {group.name.length > 15
                    ? `${group.name.substring(0, 15)}...`
                    : group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedScenarioId}
            onValueChange={(value) => {
              setSelectedScenarioId(value);
              // 選択しただけでは適用状態は変更しない
              // 適用ボタンを押した時のみ適用される
            }}
          >
            <SelectTrigger className="flex-1 min-w-0">
              <SelectValue placeholder="シナリオを選択..." />
            </SelectTrigger>
            <SelectContent className="max-w-[400px]">
              {filteredScenarios.length > 0 ? (
                filteredScenarios.map((scenario) => (
                  <SelectItem key={scenario.id} value={scenario.id} title={scenario.name}>
                    {scenario.name.length > 40
                      ? `${scenario.name.substring(0, 40)}...`
                      : scenario.name}
                  </SelectItem>
                ))
              ) : (
                <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                  このグループにシナリオがありません
                </div>
              )}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push(`/scenarios/${selectedScenarioId}`)}
            disabled={!selectedScenarioId}
            title="シナリオを編集"
            className="flex-shrink-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleApplyScenario}
            disabled={!selectedScenarioId || applyScenarioMutation.isPending}
            className="flex-shrink-0"
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
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 左側: リクエストフォーム */}
        <div className="space-y-6">
          <RequestForm
            onSubmit={handleSubmit}
            isLoading={requestMutation.isPending}
            initialData={convertedScenario === null ? undefined : convertedScenario}
            originalScenario={originalScenario}
            statusBadges={
              <>
                {appliedScenarioId && selectedScenarioId !== appliedScenarioId ? (
                  <>
                    <Badge
                      variant="outline"
                      className="border-blue-500 text-blue-700 bg-blue-50"
                    >
                      別のシナリオを選択中
                    </Badge>
                    <Badge className="bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      適用中: {scenarios.find((s) => s.id === appliedScenarioId)?.name.substring(0, 20) || ""}
                      {(scenarios.find((s) => s.id === appliedScenarioId)?.name.length || 0) > 20 ? "..." : ""}
                    </Badge>
                    {isScenarioModified && (
                      <Badge
                        variant="outline"
                        className="border-yellow-500 text-yellow-700 bg-yellow-50"
                      >
                        再適用が必要
                      </Badge>
                    )}
                  </>
                ) : appliedScenarioId ? (
                  <>
                    <Badge className="bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      適用済み
                    </Badge>
                    {isScenarioModified && (
                      <Badge
                        variant="outline"
                        className="border-yellow-500 text-yellow-700 bg-yellow-50"
                      >
                        再適用が必要
                      </Badge>
                    )}
                  </>
                ) : (
                  selectedScenarioId && (
                    <Badge variant="secondary">
                      <XCircle className="h-3 w-3 mr-1" />
                      未適用
                    </Badge>
                  )
                )}
              </>
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
        <div className="space-y-6">
          <ResponseViewer
            response={response}
            error={error}
            isLoading={requestMutation.isPending}
          />
          <MockLogViewer logs={mockLogs} endpoints={mockEndpoints} />
        </div>
      </div>
    </div>
  );
}

export default function ApiTestPage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-8">読み込み中...</div>}>
      <ApiTestPageContent />
    </Suspense>
  );
}
