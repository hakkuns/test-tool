import { useState, useCallback } from "react";

/**
 * シナリオ削除ダイアログの状態管理フック
 */
export function useScenarioDialog() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scenarioToDelete, setScenarioToDelete] = useState<string | null>(null);

  const openDeleteDialog = useCallback((id: string) => {
    setScenarioToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false);
    setScenarioToDelete(null);
  }, []);

  /**
   * 削除実行ハンドラー
   */
  const handleDeleteScenario = useCallback(
    async (deleteScenario: (id: string) => void) => {
      if (!scenarioToDelete) return;
      try {
        await deleteScenario(scenarioToDelete);
      } finally {
        closeDeleteDialog();
      }
    },
    [scenarioToDelete, closeDeleteDialog]
  );

  return {
    deleteDialogOpen,
    scenarioToDelete,
    openDeleteDialog,
    closeDeleteDialog,
    setDeleteDialogOpen,
    handleDeleteScenario,
  };
}
