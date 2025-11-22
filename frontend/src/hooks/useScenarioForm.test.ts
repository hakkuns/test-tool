import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useScenarioForm } from "./useScenarioForm";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("useScenarioForm", () => {
  beforeEach(() => {
    // Clear event listeners before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up event listeners after each test
    vi.restoreAllMocks();
  });

  it("should initialize without unsaved changes", () => {
    const { result } = renderHook(() =>
      useScenarioForm({
        isLoading: false,
        formValues: ["value1", "value2"],
        confirmLeaveDialog: vi.fn(),
      })
    );

    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it("should not track changes while loading", () => {
    const { result } = renderHook(() =>
      useScenarioForm({
        isLoading: true,
        formValues: ["value1", "value2"],
        confirmLeaveDialog: vi.fn(),
      })
    );

    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it("should detect changes when form values differ from initial values", () => {
    const { result, rerender } = renderHook(
      ({ formValues }) =>
        useScenarioForm({
          isLoading: false,
          formValues,
          confirmLeaveDialog: vi.fn(),
        }),
      {
        initialProps: { formValues: ["value1", "value2"] },
      }
    );

    // Initially no changes
    expect(result.current.hasUnsavedChanges).toBe(false);

    // Update form values
    rerender({ formValues: ["value1", "updated"] });

    expect(result.current.hasUnsavedChanges).toBe(true);
  });

  it("should reset unsaved changes", () => {
    const { result, rerender } = renderHook(
      ({ formValues }) =>
        useScenarioForm({
          isLoading: false,
          formValues,
          confirmLeaveDialog: vi.fn(),
        }),
      {
        initialProps: { formValues: ["value1", "value2"] },
      }
    );

    // Make changes
    rerender({ formValues: ["value1", "updated"] });
    expect(result.current.hasUnsavedChanges).toBe(true);

    // Reset unsaved changes with current values
    act(() => {
      result.current.resetUnsavedChanges();
    });

    // Force re-render to get updated hasUnsavedChanges value
    rerender({ formValues: ["value1", "updated"] });

    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it("should confirm leave when there are unsaved changes", async () => {
    const confirmLeaveDialog = vi.fn().mockResolvedValue(true);
    const { result, rerender } = renderHook(
      ({ formValues }) =>
        useScenarioForm({
          isLoading: false,
          formValues,
          confirmLeaveDialog,
        }),
      {
        initialProps: { formValues: ["value1", "value2"] },
      }
    );

    // Make changes
    rerender({ formValues: ["value1", "updated"] });

    let canLeave: boolean | undefined;
    await act(async () => {
      canLeave = await result.current.confirmLeave();
    });

    expect(confirmLeaveDialog).toHaveBeenCalledWith(
      "変更が保存されていません。このページを離れますか?"
    );
    expect(canLeave).toBe(true);
  });

  it("should allow leave without confirmation when there are no changes", async () => {
    const confirmLeaveDialog = vi.fn();
    const { result } = renderHook(() =>
      useScenarioForm({
        isLoading: false,
        formValues: ["value1", "value2"],
        confirmLeaveDialog,
      })
    );

    let canLeave: boolean | undefined;
    await act(async () => {
      canLeave = await result.current.confirmLeave();
    });

    expect(confirmLeaveDialog).not.toHaveBeenCalled();
    expect(canLeave).toBe(true);
  });

  it("should handle cancel on confirm leave dialog", async () => {
    const confirmLeaveDialog = vi.fn().mockResolvedValue(false);
    const { result, rerender } = renderHook(
      ({ formValues }) =>
        useScenarioForm({
          isLoading: false,
          formValues,
          confirmLeaveDialog,
        }),
      {
        initialProps: { formValues: ["value1", "value2"] },
      }
    );

    // Make changes
    rerender({ formValues: ["value1", "updated"] });

    let canLeave: boolean | undefined;
    await act(async () => {
      canLeave = await result.current.confirmLeave();
    });

    expect(confirmLeaveDialog).toHaveBeenCalled();
    expect(canLeave).toBe(false);
  });

  it("should return false when confirmLeaveDialog is not provided", async () => {
    const { result, rerender } = renderHook(
      ({ formValues }) =>
        useScenarioForm({
          isLoading: false,
          formValues,
          confirmLeaveDialog: undefined,
        }),
      {
        initialProps: { formValues: ["value1", "value2"] },
      }
    );

    // Make changes
    rerender({ formValues: ["value1", "updated"] });

    let canLeave: boolean | undefined;
    await act(async () => {
      canLeave = await result.current.confirmLeave();
    });

    expect(canLeave).toBe(false);
  });

  it("should handle complex form values", () => {
    const complexInitialValues = [
      { id: 1, name: "Test" },
      ["array", "values"],
      "string",
      123,
    ];

    const { result, rerender } = renderHook(
      ({ formValues }) =>
        useScenarioForm({
          isLoading: false,
          formValues,
          confirmLeaveDialog: vi.fn(),
        }),
      {
        initialProps: { formValues: complexInitialValues },
      }
    );

    expect(result.current.hasUnsavedChanges).toBe(false);

    // Update complex values
    const updatedValues = [
      { id: 1, name: "Updated" },
      ["array", "values"],
      "string",
      123,
    ];
    rerender({ formValues: updatedValues });

    expect(result.current.hasUnsavedChanges).toBe(true);
  });

  it("should not consider initial loading as changes", () => {
    const { result, rerender } = renderHook(
      ({ isLoading, formValues }) =>
        useScenarioForm({
          isLoading,
          formValues,
          confirmLeaveDialog: vi.fn(),
        }),
      {
        initialProps: {
          isLoading: true,
          formValues: [] as any[],
        },
      }
    );

    expect(result.current.hasUnsavedChanges).toBe(false);

    // Finish loading with actual data
    rerender({
      isLoading: false,
      formValues: ["value1", "value2"],
    });

    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it("should reset unsaved changes after update", () => {
    const { result, rerender } = renderHook(
      ({ formValues }) =>
        useScenarioForm({
          isLoading: false,
          formValues,
          confirmLeaveDialog: vi.fn(),
        }),
      {
        initialProps: { formValues: ["value1", "value2"] },
      }
    );

    // Make changes
    rerender({ formValues: ["value1", "updated"] });
    expect(result.current.hasUnsavedChanges).toBe(true);

    // Simulate save operation: reset with current values
    act(() => {
      result.current.resetUnsavedChanges();
    });

    // Force re-render to get updated hasUnsavedChanges value
    rerender({ formValues: ["value1", "updated"] });

    expect(result.current.hasUnsavedChanges).toBe(false);

    // Further changes should be detected
    rerender({ formValues: ["value1", "another update"] });
    expect(result.current.hasUnsavedChanges).toBe(true);
  });
});
