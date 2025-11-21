import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { groupsApi } from "@/lib/api/scenarios";
import type { ScenarioGroup } from "@/types/scenario";
import { toast } from "sonner";

const GROUPS_QUERY_KEY = ["groups"] as const;

/**
 * グループデータの取得と操作を管理するフック（React Query版）
 */
export function useGroups() {
  const queryClient = useQueryClient();

  // グループ一覧を取得
  const {
    data: groups = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: GROUPS_QUERY_KEY,
    queryFn: groupsApi.getAll,
    staleTime: 30 * 1000, // 30秒間はキャッシュを使う
  });

  // エラーハンドリング
  if (error) {
    console.warn("Failed to fetch groups, continuing without groups:", error);
    toast.error("グループの取得に失敗しました（シナリオは表示されます）");
  }

  // グループを作成
  const createMutation = useMutation({
    mutationFn: async ({
      name,
      description,
    }: {
      name: string;
      description: string;
    }) => {
      if (!name.trim()) {
        throw new Error("グループ名を入力してください");
      }
      return groupsApi.create({ name, description });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY });
      toast.success("グループを作成しました");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "不明なエラー";
      toast.error(`グループの作成に失敗しました: ${message}`);
      console.error("Group create error:", error);
    },
  });

  // グループを更新
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      name,
      description,
    }: {
      id: string;
      name: string;
      description: string;
    }) => {
      if (!name.trim()) {
        throw new Error("グループ名を入力してください");
      }
      return groupsApi.update(id, { name, description });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY });
      toast.success("グループを更新しました");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "不明なエラー";
      toast.error(`グループの更新に失敗しました: ${message}`);
      console.error("Group update error:", error);
    },
  });

  // グループを削除
  const deleteMutation = useMutation({
    mutationFn: async (groupId: string) => {
      return groupsApi.delete(groupId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY });
      toast.success("グループを削除しました");
    },
    onError: (error) => {
      toast.error("グループの削除に失敗しました");
      console.error(error);
    },
  });

  // グループをエクスポート
  const exportGroup = async (groupId: string, groupName: string) => {
    try {
      const exportData = await groupsApi.exportGroup(groupId);
      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `group_${groupName}_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("グループをエクスポートしました");
    } catch (error) {
      toast.error("グループのエクスポートに失敗しました");
      console.error(error);
      throw error;
    }
  };

  // グループをインポート
  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const text = await file.text();
      const exportData = JSON.parse(text);

      // グループファイルのフォーマットを検証
      if (!exportData.group || !exportData.scenarios) {
        throw new Error("グループインポートファイルの形式が正しくありません");
      }

      if (!exportData.group.name) {
        throw new Error("グループ名が見つかりません");
      }

      return groupsApi.importGroup(exportData);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY });
      // シナリオも更新されるため、シナリオのクエリも無効化
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
      toast.success(
        `グループ「${result.group.name}」をインポートしました（${result.scenarios.length}個のシナリオ）`
      );
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "グループのインポートに失敗しました";
      toast.error(message);
      console.error(error);
    },
  });

  const importGroup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    importMutation.mutate(file);
    event.target.value = "";
  };

  return {
    groups,
    isLoading,
    createGroup: (name: string, description: string) =>
      createMutation.mutateAsync({ name, description }),
    updateGroup: (id: string, name: string, description: string) =>
      updateMutation.mutateAsync({ id, name, description }),
    deleteGroup: (groupId: string) => deleteMutation.mutate(groupId),
    exportGroup,
    importGroup,
  };
}
