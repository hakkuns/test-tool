import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useScenarioActions } from "./useScenarioActions";

describe("useScenarioActions", () => {
  it("should handle copy scenario and set filter to group", async () => {
    const mockCopyScenario = vi.fn().mockResolvedValue("group-123");
    const mockSetSelectedGroupFilter = vi.fn();
    const { result } = renderHook(() => useScenarioActions());

    await act(async () => {
      await result.current.handleCopyScenario(
        mockCopyScenario,
        mockSetSelectedGroupFilter,
        "scenario-456",
        "Test Scenario"
      );
    });

    expect(mockCopyScenario).toHaveBeenCalledWith("scenario-456", "Test Scenario");
    expect(mockSetSelectedGroupFilter).toHaveBeenCalledWith("group-123");
  });

  it("should handle copy scenario and set filter to ungrouped when no group", async () => {
    const mockCopyScenario = vi.fn().mockResolvedValue(undefined);
    const mockSetSelectedGroupFilter = vi.fn();
    const { result } = renderHook(() => useScenarioActions());

    await act(async () => {
      await result.current.handleCopyScenario(
        mockCopyScenario,
        mockSetSelectedGroupFilter,
        "scenario-456",
        "Test Scenario"
      );
    });

    expect(mockCopyScenario).toHaveBeenCalledWith("scenario-456", "Test Scenario");
    expect(mockSetSelectedGroupFilter).toHaveBeenCalledWith("ungrouped");
  });

  it("should handle copy scenario error gracefully", async () => {
    const mockCopyScenario = vi.fn().mockRejectedValue(new Error("Copy failed"));
    const mockSetSelectedGroupFilter = vi.fn();
    const { result } = renderHook(() => useScenarioActions());

    await expect(
      act(async () => {
        await result.current.handleCopyScenario(
          mockCopyScenario,
          mockSetSelectedGroupFilter,
          "scenario-456",
          "Test Scenario"
        );
      })
    ).rejects.toThrow("Copy failed");

    expect(mockCopyScenario).toHaveBeenCalledWith("scenario-456", "Test Scenario");
    expect(mockSetSelectedGroupFilter).not.toHaveBeenCalled();
  });

  it("should maintain stable reference for handleCopyScenario", () => {
    const { result, rerender } = renderHook(() => useScenarioActions());
    const firstRef = result.current.handleCopyScenario;

    rerender();

    const secondRef = result.current.handleCopyScenario;
    expect(firstRef).toBe(secondRef);
  });
});
