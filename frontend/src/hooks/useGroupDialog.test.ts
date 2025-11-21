import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGroupDialog } from "./useGroupDialog";
import type { ScenarioGroup } from "@/types/scenario";

describe("useGroupDialog", () => {
  const mockGroup: ScenarioGroup = {
    id: "group-123",
    name: "Test Group",
    description: "Test Description",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  };

  it("should initialize with closed dialog state", () => {
    const { result } = renderHook(() => useGroupDialog());

    expect(result.current.groupDialogOpen).toBe(false);
    expect(result.current.editingGroup).toBeNull();
  });

  it("should open dialog for creating new group", () => {
    const { result } = renderHook(() => useGroupDialog());

    act(() => {
      result.current.openGroupDialog();
    });

    expect(result.current.groupDialogOpen).toBe(true);
    expect(result.current.editingGroup).toBeNull();
  });

  it("should open dialog for editing existing group", () => {
    const { result } = renderHook(() => useGroupDialog());

    act(() => {
      result.current.openGroupDialog(mockGroup);
    });

    expect(result.current.groupDialogOpen).toBe(true);
    expect(result.current.editingGroup).toEqual(mockGroup);
  });

  it("should close dialog and clear editing group", () => {
    const { result } = renderHook(() => useGroupDialog());

    // 編集ダイアログを開く
    act(() => {
      result.current.openGroupDialog(mockGroup);
    });

    // 閉じる
    act(() => {
      result.current.closeGroupDialog();
    });

    expect(result.current.groupDialogOpen).toBe(false);
    expect(result.current.editingGroup).toBeNull();
  });

  it("should handle save for new group", async () => {
    const mockCreateGroup = vi.fn().mockResolvedValue({ id: "new-group" });
    const mockUpdateGroup = vi.fn();
    const { result } = renderHook(() => useGroupDialog());

    // 新規作成ダイアログを開く
    act(() => {
      result.current.openGroupDialog();
    });

    // 保存実行
    await act(async () => {
      await result.current.handleSaveGroup(
        "New Group",
        "New Description",
        mockCreateGroup,
        mockUpdateGroup
      );
    });

    expect(mockCreateGroup).toHaveBeenCalledWith("New Group", "New Description");
    expect(mockUpdateGroup).not.toHaveBeenCalled();
    expect(result.current.groupDialogOpen).toBe(false);
    expect(result.current.editingGroup).toBeNull();
  });

  it("should handle save for existing group", async () => {
    const mockCreateGroup = vi.fn();
    const mockUpdateGroup = vi.fn().mockResolvedValue(mockGroup);
    const { result } = renderHook(() => useGroupDialog());

    // 編集ダイアログを開く
    act(() => {
      result.current.openGroupDialog(mockGroup);
    });

    // 保存実行
    await act(async () => {
      await result.current.handleSaveGroup(
        "Updated Group",
        "Updated Description",
        mockCreateGroup,
        mockUpdateGroup
      );
    });

    expect(mockUpdateGroup).toHaveBeenCalledWith(
      "group-123",
      "Updated Group",
      "Updated Description"
    );
    expect(mockCreateGroup).not.toHaveBeenCalled();
    expect(result.current.groupDialogOpen).toBe(false);
    expect(result.current.editingGroup).toBeNull();
  });

  it("should close dialog even if save fails", async () => {
    const mockCreateGroup = vi.fn().mockRejectedValue(new Error("Save failed"));
    const mockUpdateGroup = vi.fn();
    const { result } = renderHook(() => useGroupDialog());

    act(() => {
      result.current.openGroupDialog();
    });

    await act(async () => {
      try {
        await result.current.handleSaveGroup(
          "New Group",
          "Description",
          mockCreateGroup,
          mockUpdateGroup
        );
      } catch (error) {
        // エラーは無視
      }
    });

    // エラーが発生してもダイアログは閉じられる
    expect(result.current.groupDialogOpen).toBe(false);
  });

  it("should allow manual dialog state change", () => {
    const { result } = renderHook(() => useGroupDialog());

    act(() => {
      result.current.setGroupDialogOpen(true);
    });

    expect(result.current.groupDialogOpen).toBe(true);

    act(() => {
      result.current.setGroupDialogOpen(false);
    });

    expect(result.current.groupDialogOpen).toBe(false);
  });

  it("should initialize delete dialog with closed state", () => {
    const { result } = renderHook(() => useGroupDialog());

    expect(result.current.deleteDialogOpen).toBe(false);
    expect(result.current.groupToDelete).toBeNull();
  });

  it("should open delete dialog with group id", () => {
    const { result } = renderHook(() => useGroupDialog());

    act(() => {
      result.current.openDeleteDialog("group-123");
    });

    expect(result.current.deleteDialogOpen).toBe(true);
    expect(result.current.groupToDelete).toBe("group-123");
  });

  it("should close delete dialog and clear group id", () => {
    const { result } = renderHook(() => useGroupDialog());

    act(() => {
      result.current.openDeleteDialog("group-123");
    });

    act(() => {
      result.current.closeDeleteDialog();
    });

    expect(result.current.deleteDialogOpen).toBe(false);
    expect(result.current.groupToDelete).toBeNull();
  });

  it("should handle delete group", async () => {
    const mockDeleteGroup = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useGroupDialog());

    act(() => {
      result.current.openDeleteDialog("group-123");
    });

    await act(async () => {
      await result.current.handleDeleteGroup(mockDeleteGroup);
    });

    expect(mockDeleteGroup).toHaveBeenCalledWith("group-123");
    expect(result.current.deleteDialogOpen).toBe(false);
    expect(result.current.groupToDelete).toBeNull();
  });

  it("should close delete dialog even if delete fails", async () => {
    const mockDeleteGroup = vi
      .fn()
      .mockRejectedValue(new Error("Delete failed"));
    const { result } = renderHook(() => useGroupDialog());

    act(() => {
      result.current.openDeleteDialog("group-123");
    });

    await act(async () => {
      try {
        await result.current.handleDeleteGroup(mockDeleteGroup);
      } catch (error) {
        // エラーは無視
      }
    });

    expect(result.current.deleteDialogOpen).toBe(false);
    expect(result.current.groupToDelete).toBeNull();
  });

  it("should do nothing if no group is selected for deletion", async () => {
    const mockDeleteGroup = vi.fn();
    const { result } = renderHook(() => useGroupDialog());

    await act(async () => {
      await result.current.handleDeleteGroup(mockDeleteGroup);
    });

    expect(mockDeleteGroup).not.toHaveBeenCalled();
  });

  it("should allow manual delete dialog state change", () => {
    const { result } = renderHook(() => useGroupDialog());

    act(() => {
      result.current.setDeleteDialogOpen(true);
    });

    expect(result.current.deleteDialogOpen).toBe(true);

    act(() => {
      result.current.setDeleteDialogOpen(false);
    });

    expect(result.current.deleteDialogOpen).toBe(false);
  });
});
