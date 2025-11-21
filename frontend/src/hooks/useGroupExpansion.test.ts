import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGroupExpansion } from "./useGroupExpansion";

describe("useGroupExpansion", () => {
  beforeEach(() => {
    // localStorageをモック
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with empty Set when no saved data", () => {
    (global.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(
      null
    );

    const { result } = renderHook(() => useGroupExpansion());

    expect(result.current.expandedGroups.size).toBe(0);
  });

  it("should restore state from localStorage", () => {
    (global.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(
      JSON.stringify(["group1", "group2"])
    );

    const { result } = renderHook(() => useGroupExpansion());

    expect(result.current.expandedGroups.has("group1")).toBe(true);
    expect(result.current.expandedGroups.has("group2")).toBe(true);
  });

  it("should toggle group expansion", () => {
    (global.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(
      null
    );

    const { result } = renderHook(() => useGroupExpansion());

    act(() => {
      result.current.toggleGroup("group1");
    });

    expect(result.current.expandedGroups.has("group1")).toBe(true);

    act(() => {
      result.current.toggleGroup("group1");
    });

    expect(result.current.expandedGroups.has("group1")).toBe(false);
  });

  it("should save to localStorage on toggle", () => {
    (global.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(
      null
    );

    const { result } = renderHook(() => useGroupExpansion());

    act(() => {
      result.current.toggleGroup("group1");
    });

    expect(global.localStorage.setItem).toHaveBeenCalledWith(
      "expandedGroups",
      JSON.stringify(["group1"])
    );
  });
});
