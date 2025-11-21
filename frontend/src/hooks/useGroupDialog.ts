import { useState, useCallback } from "react";
import type { ScenarioGroup } from "@/types/scenario";

/**
 * グループダイアログの状態管理フック
 */
export function useGroupDialog() {
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ScenarioGroup | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

  const openGroupDialog = useCallback((group?: ScenarioGroup) => {
    setEditingGroup(group || null);
    setGroupDialogOpen(true);
  }, []);

  const closeGroupDialog = useCallback(() => {
    setGroupDialogOpen(false);
    setEditingGroup(null);
  }, []);

  const openDeleteDialog = useCallback((groupId: string) => {
    setGroupToDelete(groupId);
    setDeleteDialogOpen(true);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false);
    setGroupToDelete(null);
  }, []);

  /**
   * グループ保存ハンドラー
   */
  const handleSaveGroup = useCallback(
    async (
      name: string,
      description: string,
      createGroup: (name: string, description: string) => Promise<unknown>,
      updateGroup: (
        id: string,
        name: string,
        description: string,
      ) => Promise<unknown>,
    ) => {
      try {
        if (editingGroup) {
          await updateGroup(editingGroup.id, name, description);
        } else {
          await createGroup(name, description);
        }
      } finally {
        closeGroupDialog();
      }
    },
    [editingGroup, closeGroupDialog],
  );

  /**
   * グループ削除ハンドラー
   */
  const handleDeleteGroup = useCallback(
    async (deleteGroup: (id: string) => Promise<unknown>) => {
      if (!groupToDelete) return;

      try {
        await deleteGroup(groupToDelete);
      } finally {
        closeDeleteDialog();
      }
    },
    [groupToDelete, closeDeleteDialog],
  );

  return {
    groupDialogOpen,
    editingGroup,
    openGroupDialog,
    closeGroupDialog,
    setGroupDialogOpen,
    handleSaveGroup,
    deleteDialogOpen,
    groupToDelete,
    openDeleteDialog,
    closeDeleteDialog,
    setDeleteDialogOpen,
    handleDeleteGroup,
  };
}
