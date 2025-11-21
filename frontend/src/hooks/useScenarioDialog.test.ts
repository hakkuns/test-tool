import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useScenarioDialog } from "./useScenarioDialog";

describe("useScenarioDialog", () => {
  it("should initialize with closed dialog state", () => {
    const { result } = renderHook(() => useScenarioDialog());

    expect(result.current.deleteDialogOpen).toBe(false);
    expect(result.current.scenarioToDelete).toBeNull();
  });

  it("should open delete dialog with scenario id", () => {
    const { result } = renderHook(() => useScenarioDialog());

    act(() => {
      result.current.openDeleteDialog("scenario-123");
    });

    expect(result.current.deleteDialogOpen).toBe(true);
    expect(result.current.scenarioToDelete).toBe("scenario-123");
  });

  it("should close delete dialog and clear scenario id", () => {
    const { result } = renderHook(() => useScenarioDialog());

    // まず開く
    act(() => {
      result.current.openDeleteDialog("scenario-123");
    });

    // 閉じる
    act(() => {
      result.current.closeDeleteDialog();
    });

    expect(result.current.deleteDialogOpen).toBe(false);
    expect(result.current.scenarioToDelete).toBeNull();
  });

  it("should handle delete scenario", async () => {
    const mockDeleteScenario = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useScenarioDialog());

    // シナリオを選択してダイアログを開く
    act(() => {
      result.current.openDeleteDialog("scenario-123");
    });

    // 削除実行
    await act(async () => {
      await result.current.handleDeleteScenario(mockDeleteScenario);
    });

    expect(mockDeleteScenario).toHaveBeenCalledWith("scenario-123");
    expect(result.current.deleteDialogOpen).toBe(false);
    expect(result.current.scenarioToDelete).toBeNull();
  });

  it("should close dialog even if delete fails", async () => {
    const mockDeleteScenario = vi.fn().mockRejectedValue(new Error("Delete failed"));
    const { result } = renderHook(() => useScenarioDialog());

    act(() => {
      result.current.openDeleteDialog("scenario-123");
    });

    await act(async () => {
      try {
        await result.current.handleDeleteScenario(mockDeleteScenario);
      } catch (error) {
        // エラーは無視
      }
    });

    // finallyブロックで閉じられる
    expect(result.current.deleteDialogOpen).toBe(false);
    expect(result.current.scenarioToDelete).toBeNull();
  });

  it("should do nothing if no scenario is selected", async () => {
    const mockDeleteScenario = vi.fn();
    const { result } = renderHook(() => useScenarioDialog());

    // シナリオを選択せずに削除実行
    await act(async () => {
      await result.current.handleDeleteScenario(mockDeleteScenario);
    });

    expect(mockDeleteScenario).not.toHaveBeenCalled();
  });

  it("should allow manual dialog state change", () => {
    const { result } = renderHook(() => useScenarioDialog());

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
