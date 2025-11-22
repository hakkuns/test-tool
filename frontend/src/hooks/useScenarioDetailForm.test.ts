import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useScenarioDetailForm } from "./useScenarioDetailForm";
import type { DDLTable, TableData, MockEndpoint } from "@/types/scenario";

describe("useScenarioDetailForm", () => {
  const mockInitialData = {
    name: "Test Scenario",
    description: "Test Description",
    tags: ["tag1", "tag2"],
    targetApiMethod: "GET" as const,
    targetApiUrl: "http://localhost:8080/api/test",
    targetApiHeaders: { "Content-Type": "application/json" },
    targetApiBody: { test: "data" },
    tables: [] as DDLTable[],
    tableData: [] as TableData[],
    mockApis: [] as MockEndpoint[],
    testHeaders: { Authorization: "Bearer token" },
    testBody: '{"key": "value"}',
  };

  it("should initialize with provided initial data", () => {
    const { result } = renderHook(() => useScenarioDetailForm(mockInitialData));

    expect(result.current.name).toBe("Test Scenario");
    expect(result.current.description).toBe("Test Description");
    expect(result.current.tags).toEqual(["tag1", "tag2"]);
    expect(result.current.targetApiMethod).toBe("GET");
    expect(result.current.targetApiUrl).toBe("http://localhost:8080/api/test");
    expect(result.current.targetApiHeaders).toEqual({ "Content-Type": "application/json" });
    expect(result.current.targetApiBody).toEqual({ test: "data" });
    expect(result.current.tables).toEqual([]);
    expect(result.current.tableData).toEqual([]);
    expect(result.current.mockApis).toEqual([]);
    expect(result.current.testHeaders).toEqual({ Authorization: "Bearer token" });
    expect(result.current.testBody).toBe('{"key": "value"}');
  });

  it("should update name state", () => {
    const { result } = renderHook(() => useScenarioDetailForm(mockInitialData));

    act(() => {
      result.current.setName("Updated Name");
    });

    expect(result.current.name).toBe("Updated Name");
  });

  it("should update description state", () => {
    const { result } = renderHook(() => useScenarioDetailForm(mockInitialData));

    act(() => {
      result.current.setDescription("Updated Description");
    });

    expect(result.current.description).toBe("Updated Description");
  });

  it("should update tags state", () => {
    const { result } = renderHook(() => useScenarioDetailForm(mockInitialData));

    act(() => {
      result.current.setTags(["new-tag"]);
    });

    expect(result.current.tags).toEqual(["new-tag"]);
  });

  it("should update targetApiMethod state", () => {
    const { result } = renderHook(() => useScenarioDetailForm(mockInitialData));

    act(() => {
      result.current.setTargetApiMethod("POST");
    });

    expect(result.current.targetApiMethod).toBe("POST");
  });

  it("should update targetApiUrl state", () => {
    const { result } = renderHook(() => useScenarioDetailForm(mockInitialData));

    act(() => {
      result.current.setTargetApiUrl("http://localhost:3000/api/updated");
    });

    expect(result.current.targetApiUrl).toBe("http://localhost:3000/api/updated");
  });

  it("should update targetApiHeaders state", () => {
    const { result } = renderHook(() => useScenarioDetailForm(mockInitialData));

    const newHeaders = { "X-Custom-Header": "value" };
    act(() => {
      result.current.setTargetApiHeaders(newHeaders);
    });

    expect(result.current.targetApiHeaders).toEqual(newHeaders);
  });

  it("should update targetApiBody state", () => {
    const { result } = renderHook(() => useScenarioDetailForm(mockInitialData));

    const newBody = { updated: "body" };
    act(() => {
      result.current.setTargetApiBody(newBody);
    });

    expect(result.current.targetApiBody).toEqual(newBody);
  });

  it("should update tables state", () => {
    const { result } = renderHook(() => useScenarioDetailForm(mockInitialData));

    const newTables: DDLTable[] = [
      { name: "users", ddl: "CREATE TABLE users (id INT)" },
    ];
    act(() => {
      result.current.setTables(newTables);
    });

    expect(result.current.tables).toEqual(newTables);
  });

  it("should update tableData state", () => {
    const { result } = renderHook(() => useScenarioDetailForm(mockInitialData));

    const newTableData: TableData[] = [
      { tableName: "users", data: [] },
    ];
    act(() => {
      result.current.setTableData(newTableData);
    });

    expect(result.current.tableData).toEqual(newTableData);
  });

  it("should update mockApis state", () => {
    const { result } = renderHook(() => useScenarioDetailForm(mockInitialData));

    const newMockApis: MockEndpoint[] = [
      {
        path: "/api/mock",
        method: "GET",
        status: 200,
        response: {},
      },
    ];
    act(() => {
      result.current.setMockApis(newMockApis);
    });

    expect(result.current.mockApis).toEqual(newMockApis);
  });

  it("should update testHeaders state", () => {
    const { result } = renderHook(() => useScenarioDetailForm(mockInitialData));

    const newTestHeaders = { "X-Test-Header": "test-value" };
    act(() => {
      result.current.setTestHeaders(newTestHeaders);
    });

    expect(result.current.testHeaders).toEqual(newTestHeaders);
  });

  it("should update testBody state", () => {
    const { result } = renderHook(() => useScenarioDetailForm(mockInitialData));

    act(() => {
      result.current.setTestBody('{"updated": "body"}');
    });

    expect(result.current.testBody).toBe('{"updated": "body"}');
  });

  it("should handle empty initial data", () => {
    const emptyData = {
      name: "",
      description: "",
      tags: [],
      targetApiMethod: "GET" as const,
      targetApiUrl: "",
      targetApiHeaders: {},
      targetApiBody: undefined,
      tables: [],
      tableData: [],
      mockApis: [],
      testHeaders: {},
      testBody: "",
    };

    const { result } = renderHook(() => useScenarioDetailForm(emptyData));

    expect(result.current.name).toBe("");
    expect(result.current.description).toBe("");
    expect(result.current.tags).toEqual([]);
    expect(result.current.targetApiMethod).toBe("GET");
    expect(result.current.targetApiUrl).toBe("");
    expect(result.current.targetApiHeaders).toEqual({});
    expect(result.current.targetApiBody).toBeUndefined();
    expect(result.current.tables).toEqual([]);
    expect(result.current.tableData).toEqual([]);
    expect(result.current.mockApis).toEqual([]);
    expect(result.current.testHeaders).toEqual({});
    expect(result.current.testBody).toBe("");
  });

  it("should allow multiple state updates", () => {
    const { result } = renderHook(() => useScenarioDetailForm(mockInitialData));

    act(() => {
      result.current.setName("First Update");
      result.current.setDescription("First Description");
    });

    expect(result.current.name).toBe("First Update");
    expect(result.current.description).toBe("First Description");

    act(() => {
      result.current.setName("Second Update");
      result.current.setDescription("Second Description");
    });

    expect(result.current.name).toBe("Second Update");
    expect(result.current.description).toBe("Second Description");
  });
});
