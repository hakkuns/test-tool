import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { scenariosApi } from "@/lib/api/scenarios";
import type { TestScenario } from "@/types/scenario";
import { toast } from "sonner";

const SCENARIOS_QUERY_KEY = ["scenarios"] as const;

/**
 * シナリオデータの取得と操作を管理するフック（React Query版）
 */
export function useScenarios() {
  const queryClient = useQueryClient();

  // シナリオ一覧を取得
  const {
    data: scenarios = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: SCENARIOS_QUERY_KEY,
    queryFn: scenariosApi.getAll,
    staleTime: 30 * 1000, // 30秒間はキャッシュを使う
  });

  // エラーハンドリング
  if (error) {
    toast.error("シナリオの取得に失敗しました");
    console.error("Fetch scenarios error:", error);
  }

  // シナリオを削除
  const deleteMutation = useMutation({
    mutationFn: scenariosApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCENARIOS_QUERY_KEY });
      toast.success("シナリオを削除しました");
    },
    onError: (error) => {
      toast.error("シナリオの削除に失敗しました");
      console.error(error);
    },
  });

  // シナリオをコピー
  const copyMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const original = scenarios.find((s) => s.id === id);
      if (!original) {
        throw new Error("コピー元のシナリオが見つかりません");
      }

      await scenariosApi.create({
        name: `${name}のコピー`,
        description: original.description,
        targetApi: original.targetApi,
        tables: original.tables || [],
        tableData: original.tableData || [],
        mockApis: original.mockApis || [],
        testSettings: original.testSettings,
        expectedResponse: original.expectedResponse,
        tags: original.tags || [],
        groupId: original.groupId,
      });

      return original.groupId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCENARIOS_QUERY_KEY });
      toast.success("シナリオをコピーしました");
    },
    onError: (error) => {
      toast.error("シナリオのコピーに失敗しました");
      console.error(error);
    },
  });

  // シナリオをエクスポート
  const exportScenario = async (id: string) => {
    try {
      const exportData = await scenariosApi.exportScenario(id);
      scenariosApi.downloadAsJson(exportData);
      toast.success("シナリオをエクスポートしました");
    } catch (error) {
      toast.error("エクスポートに失敗しました");
      console.error(error);
      throw error;
    }
  };

  // シナリオをインポート
  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const text = await file.text();
      const exportData = JSON.parse(text);

      // フォーマットを検証
      if (exportData.group && exportData.scenarios) {
        throw new Error(
          "グループファイルです。「グループインポート」を使用してください"
        );
      }

      const dataArray = Array.isArray(exportData) ? exportData : [exportData];
      for (const data of dataArray) {
        const scenario = data.scenario || data;
        if (!scenario || !scenario.name) {
          throw new Error(
            "シナリオインポートファイルの形式が正しくありません"
          );
        }
      }

      return scenariosApi.importFromFile(file);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCENARIOS_QUERY_KEY });
      toast.success("シナリオをインポートしました");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "インポートに失敗しました");
      console.error(error);
    },
  });

  const importScenario = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    importMutation.mutate(file);
    event.target.value = "";
  };

  // シナリオを適用
  const applyScenario = async (id: string, name: string) => {
    if (
      !confirm(
        `シナリオ "${name}" を適用しますか？\n既存のテーブルとモックAPIに影響します。`
      )
    ) {
      return;
    }

    try {
      const scenario = scenarios.find((s) => s.id === id);
      const result = await scenariosApi.apply(id);
      toast.success(
        `シナリオを適用しました\nテーブル: ${scenario?.tableData?.length || 0}個\nデータ: ${result.dataInserted}行\nモックAPI: ${result.mocksConfigured}個`
      );
    } catch (error) {
      toast.error("シナリオの適用に失敗しました");
      console.error(error);
      throw error;
    }
  };

  // シナリオのグループを変更
  const moveToGroupMutation = useMutation({
    mutationFn: async ({
      scenarioId,
      newGroupId,
    }: {
      scenarioId: string;
      newGroupId: string | undefined;
    }) => {
      return scenariosApi.update(scenarioId, { groupId: newGroupId });
    },
    onMutate: async ({ scenarioId, newGroupId }) => {
      // 楽観的更新
      await queryClient.cancelQueries({ queryKey: SCENARIOS_QUERY_KEY });
      const previousScenarios = queryClient.getQueryData<TestScenario[]>(
        SCENARIOS_QUERY_KEY
      );

      queryClient.setQueryData<TestScenario[]>(SCENARIOS_QUERY_KEY, (old) =>
        old?.map((s) =>
          s.id === scenarioId ? { ...s, groupId: newGroupId } : s
        )
      );

      return { previousScenarios };
    },
    onSuccess: () => {
      toast.success("シナリオを移動しました");
    },
    onError: (error, _variables, context) => {
      // ロールバック
      if (context?.previousScenarios) {
        queryClient.setQueryData(SCENARIOS_QUERY_KEY, context.previousScenarios);
      }
      toast.error("シナリオの移動に失敗しました");
      console.error(error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SCENARIOS_QUERY_KEY });
    },
  });

  // お気に入りの切り替え
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (scenarioId: string) => {
      const scenario = scenarios.find((s) => s.id === scenarioId);
      if (!scenario) {
        throw new Error("シナリオが見つかりません");
      }

      return scenariosApi.update(scenarioId, {
        isFavorite: !scenario.isFavorite,
      });
    },
    onMutate: async (scenarioId) => {
      // 楽観的更新
      await queryClient.cancelQueries({ queryKey: SCENARIOS_QUERY_KEY });
      const previousScenarios = queryClient.getQueryData<TestScenario[]>(
        SCENARIOS_QUERY_KEY
      );

      queryClient.setQueryData<TestScenario[]>(SCENARIOS_QUERY_KEY, (old) =>
        old?.map((s) =>
          s.id === scenarioId ? { ...s, isFavorite: !s.isFavorite } : s
        )
      );

      return { previousScenarios };
    },
    onError: (error, _scenarioId, context) => {
      // ロールバック
      if (context?.previousScenarios) {
        queryClient.setQueryData(SCENARIOS_QUERY_KEY, context.previousScenarios);
      }
      toast.error("お気に入りの更新に失敗しました");
      console.error(error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SCENARIOS_QUERY_KEY });
    },
  });

  // テスト結果の更新
  const updateTestResultMutation = useMutation({
    mutationFn: async ({
      scenarioId,
      result,
    }: {
      scenarioId: string;
      result: "success" | "failure" | "unknown";
    }) => {
      const now = new Date().toISOString();
      await scenariosApi.update(scenarioId, {
        lastTestResult: result,
        lastTestedAt: now,
      });
      return { scenarioId, result, now };
    },
    onMutate: async ({ scenarioId, result }) => {
      // 楽観的更新
      await queryClient.cancelQueries({ queryKey: SCENARIOS_QUERY_KEY });
      const previousScenarios = queryClient.getQueryData<TestScenario[]>(
        SCENARIOS_QUERY_KEY
      );
      const now = new Date().toISOString();

      queryClient.setQueryData<TestScenario[]>(SCENARIOS_QUERY_KEY, (old) =>
        old?.map((s) =>
          s.id === scenarioId
            ? { ...s, lastTestResult: result, lastTestedAt: now }
            : s
        )
      );

      return { previousScenarios };
    },
    onSuccess: (_data, { result }) => {
      const resultText =
        result === "success" ? "成功" : result === "failure" ? "失敗" : "不明";
      toast.success(`テスト結果を「${resultText}」に更新しました`);
    },
    onError: (error, _variables, context) => {
      // ロールバック
      if (context?.previousScenarios) {
        queryClient.setQueryData(SCENARIOS_QUERY_KEY, context.previousScenarios);
      }
      toast.error("テスト結果の更新に失敗しました");
      console.error(error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SCENARIOS_QUERY_KEY });
    },
  });

  return {
    scenarios,
    isLoading,
    deleteScenario: (id: string) => deleteMutation.mutate(id),
    copyScenario: (id: string, name: string) =>
      copyMutation.mutateAsync({ id, name }),
    exportScenario,
    importScenario,
    applyScenario,
    moveToGroup: (scenarioId: string, newGroupId: string | undefined) =>
      moveToGroupMutation.mutate({ scenarioId, newGroupId }),
    toggleFavorite: (scenarioId: string) =>
      toggleFavoriteMutation.mutate(scenarioId),
    updateTestResult: (
      scenarioId: string,
      result: "success" | "failure" | "unknown"
    ) => updateTestResultMutation.mutate({ scenarioId, result }),
  };
}
