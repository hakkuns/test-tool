import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useConfirmDialog } from "./useConfirmDialog";

describe("useConfirmDialog", () => {
  it("should initialize with closed dialog state", () => {
    const { result } = renderHook(() => useConfirmDialog());

    expect(result.current.dialogState.open).toBe(false);
    expect(result.current.dialogState.title).toBe("");
    expect(result.current.dialogState.description).toBe("");
  });

  it("should open dialog with provided options", async () => {
    const { result } = renderHook(() => useConfirmDialog());

    let confirmPromise: Promise<boolean>;
    act(() => {
      confirmPromise = result.current.confirm({
        title: "Test Title",
        description: "Test Description",
        confirmText: "OK",
        cancelText: "Cancel",
        variant: "destructive",
      });
    });

    expect(result.current.dialogState.open).toBe(true);
    expect(result.current.dialogState.title).toBe("Test Title");
    expect(result.current.dialogState.description).toBe("Test Description");
    expect(result.current.dialogState.confirmText).toBe("OK");
    expect(result.current.dialogState.cancelText).toBe("Cancel");
    expect(result.current.dialogState.variant).toBe("destructive");

    // Cleanup: confirm to resolve promise
    act(() => {
      result.current.dialogState.onConfirm();
    });
  });

  it("should resolve true when confirmed", async () => {
    const { result } = renderHook(() => useConfirmDialog());

    let confirmPromise: Promise<boolean>;
    act(() => {
      confirmPromise = result.current.confirm({
        title: "Test",
        description: "Description",
      });
    });

    let confirmed: boolean | undefined;
    act(() => {
      result.current.dialogState.onConfirm();
      confirmPromise!.then((value) => {
        confirmed = value;
      });
    });

    await act(async () => {
      await confirmPromise!;
    });

    expect(confirmed).toBe(true);
    expect(result.current.dialogState.open).toBe(false);
  });

  it("should resolve false when canceled", async () => {
    const { result } = renderHook(() => useConfirmDialog());

    let confirmPromise: Promise<boolean>;
    act(() => {
      confirmPromise = result.current.confirm({
        title: "Test",
        description: "Description",
      });
    });

    let confirmed: boolean | undefined;
    act(() => {
      result.current.handleCancel();
      confirmPromise!.then((value) => {
        confirmed = value;
      });
    });

    await act(async () => {
      await confirmPromise!;
    });

    expect(confirmed).toBe(false);
    expect(result.current.dialogState.open).toBe(false);
  });

  it("should handle multiple confirmations sequentially", async () => {
    const { result } = renderHook(() => useConfirmDialog());

    // First confirmation
    let firstPromise: Promise<boolean>;
    act(() => {
      firstPromise = result.current.confirm({
        title: "First",
        description: "First Description",
      });
    });

    expect(result.current.dialogState.title).toBe("First");

    let firstResult: boolean | undefined;
    act(() => {
      result.current.dialogState.onConfirm();
      firstPromise!.then((value) => {
        firstResult = value;
      });
    });

    await act(async () => {
      await firstPromise!;
    });

    expect(firstResult).toBe(true);

    // Second confirmation
    let secondPromise: Promise<boolean>;
    act(() => {
      secondPromise = result.current.confirm({
        title: "Second",
        description: "Second Description",
      });
    });

    expect(result.current.dialogState.title).toBe("Second");

    let secondResult: boolean | undefined;
    act(() => {
      result.current.handleCancel();
      secondPromise!.then((value) => {
        secondResult = value;
      });
    });

    await act(async () => {
      await secondPromise!;
    });

    expect(secondResult).toBe(false);
  });

  it("should use default values for optional properties", async () => {
    const { result } = renderHook(() => useConfirmDialog());

    let confirmPromise: Promise<boolean>;
    act(() => {
      confirmPromise = result.current.confirm({
        title: "Test",
        description: "Description",
      });
    });

    expect(result.current.dialogState.confirmText).toBeUndefined();
    expect(result.current.dialogState.cancelText).toBeUndefined();
    expect(result.current.dialogState.variant).toBeUndefined();

    // Cleanup
    act(() => {
      result.current.dialogState.onConfirm();
    });

    await act(async () => {
      await confirmPromise!;
    });
  });
});
