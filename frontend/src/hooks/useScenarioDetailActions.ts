import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { scenariosApi } from "@/lib/api/scenarios";
import type { UpdateScenarioInput, DDLTable, TableData, MockEndpoint } from "@/types/scenario";
import { toast } from "sonner";
import {
  replaceConstantsInHeaders,
  replaceConstantsInObject,
} from "@/utils/constants";

interface UseScenarioDetailActionsProps {
  id: string;
  name: string;
  description: string;
  tags: string[];
  targetApiMethod: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";
  targetApiUrl: string;
  targetApiHeaders: Record<string, string>;
  targetApiBody: any;
  tables: DDLTable[];
  tableData: TableData[];
  mockApis: MockEndpoint[];
  testHeaders: Record<string, string>;
  testBody: string;
  setTestHeaders: (headers: Record<string, string>) => void;
  setTestBody: (body: string) => void;
  resetUnsavedChanges: () => void;
  confirmApplyDialog?: (title: string, description: string) => Promise<boolean>;
}

export function useScenarioDetailActions(props: UseScenarioDetailActionsProps) {
  const queryClient = useQueryClient();
  const [isUpdated, setIsUpdated] = useState(false);
  const [appliedScenarioId, setAppliedScenarioId] = useState(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("appliedScenarioId");
  });

  // 適用状態を計算
  const isApplied = useMemo(() => appliedScenarioId === props.id, [appliedScenarioId, props.id]);

  // シナリオ更新のミューテーション
  const updateMutation = useMutation({
    mutationFn: async (e: React.FormEvent) => {
      e.preventDefault();

      if (!props.name.trim()) {
        throw new Error("シナリオ名を入力してください");
      }

      if (!props.targetApiUrl.trim()) {
        throw new Error("対象APIのURLを入力してください");
      }

      const update: UpdateScenarioInput = {
        name: props.name,
        description: props.description || undefined,
        targetApi: {
          method: props.targetApiMethod,
          url: props.targetApiUrl,
          headers:
            Object.keys(props.targetApiHeaders).length > 0
              ? props.targetApiHeaders
              : undefined,
          body: props.targetApiBody,
        },
        tables: props.tables,
        tableData: props.tableData,
        mockApis: props.mockApis,
        testSettings:
          Object.keys(props.testHeaders).length > 0 || props.testBody
            ? {
                headers:
                  Object.keys(props.testHeaders).length > 0 ? props.testHeaders : undefined,
                body: props.testBody || undefined,
              }
            : undefined,
        tags: props.tags,
      };

      return scenariosApi.update(props.id, update);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
      queryClient.invalidateQueries({ queryKey: ["scenarios", props.id] });
      props.resetUnsavedChanges();
      setIsUpdated(true);
      toast.success("シナリオを更新しました");
    },
    onError: (error) => {
      console.error("Failed to update scenario:", error);
      toast.error(error instanceof Error ? error.message : "シナリオの更新に失敗しました");
    },
  });

  // シナリオ適用のミューテーション
  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!props.confirmApplyDialog) {
        console.error("confirmApplyDialog is not provided");
        throw new Error("CANCEL");
      }

      const confirmed = await props.confirmApplyDialog(
        "シナリオを適用",
        "このシナリオを適用しますか？\nテーブル作成・データ投入・モックAPI設定が実行されます。"
      );

      if (!confirmed) {
        throw new Error("CANCEL");
      }

      // 値のマッピングを共有して、ヘッダーとボディで同じ定数は同じ値になるようにする
      const valueMap = new Map<string, string>();

      // テスト設定の定数を変換してフォームに反映
      const convertedHeaders = replaceConstantsInHeaders(props.testHeaders, valueMap);
      props.setTestHeaders(convertedHeaders);

      let convertedBody = props.testBody;
      if (props.testBody) {
        try {
          const parsedBody = JSON.parse(props.testBody);
          const convertedBodyObj = replaceConstantsInObject(parsedBody, valueMap);
          convertedBody = JSON.stringify(convertedBodyObj, null, 2);
          props.setTestBody(convertedBody);
        } catch {
          // JSONでない場合はそのまま
        }
      }

      return scenariosApi.apply(props.id);
    },
    onSuccess: (result) => {
      // 適用成功後、LocalStorageに保存
      localStorage.setItem("appliedScenarioId", props.id);
      setAppliedScenarioId(props.id);

      toast.success(
        `シナリオを適用しました\nテーブル: ${result.tablesCreated}個\nデータ: ${result.dataInserted}行\nモックAPI: ${result.mocksConfigured}個`,
      );
    },
    onError: (error) => {
      // キャンセルの場合はエラー表示しない
      if (error instanceof Error && error.message === "CANCEL") {
        return;
      }
      console.error("Failed to apply scenario:", error);
      toast.error(
        error instanceof Error ? error.message : "シナリオの適用に失敗しました",
      );
    },
  });

  return {
    isSubmitting: updateMutation.isPending,
    isApplying: applyMutation.isPending,
    isUpdated,
    isApplied,
    handleSubmit: updateMutation.mutate,
    handleApply: () => applyMutation.mutate(),
  };
}
