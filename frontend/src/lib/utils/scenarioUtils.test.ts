import { describe, it, expect } from "vitest";
import {
  sortScenariosByFavorite,
  filterScenarios,
  groupScenarios,
} from "./scenarioUtils";
import type { TestScenario, ScenarioGroup } from "@/types/scenario";

describe("sortScenariosByFavorite", () => {
  it("should sort favorites first", () => {
    const scenarios: TestScenario[] = [
      {
        id: "1",
        name: "Normal",
        isFavorite: false,
        createdAt: "2024-01-01",
      } as TestScenario,
      {
        id: "2",
        name: "Favorite",
        isFavorite: true,
        createdAt: "2024-01-02",
      } as TestScenario,
    ];

    const sorted = sortScenariosByFavorite(scenarios);
    expect(sorted[0].isFavorite).toBe(true);
    expect(sorted[1].isFavorite).toBe(false);
  });

  it("should sort by creation date when favorite status is the same", () => {
    const scenarios: TestScenario[] = [
      {
        id: "1",
        name: "Older",
        isFavorite: false,
        createdAt: "2024-01-01",
      } as TestScenario,
      {
        id: "2",
        name: "Newer",
        isFavorite: false,
        createdAt: "2024-01-02",
      } as TestScenario,
    ];

    const sorted = sortScenariosByFavorite(scenarios);
    expect(sorted[0].id).toBe("2"); // Newer comes first
    expect(sorted[1].id).toBe("1");
  });
});

describe("filterScenarios", () => {
  const scenarios: TestScenario[] = [
    {
      id: "1",
      name: "Test Scenario",
      description: "A test description",
      groupId: "group1",
    } as TestScenario,
    {
      id: "2",
      name: "Another Test",
      description: "Different description",
      groupId: "group2",
    } as TestScenario,
    {
      id: "3",
      name: "Ungrouped",
      description: "No group",
    } as TestScenario,
  ];

  const existingGroupIds = new Set(["group1", "group2"]);

  it("should filter by search text in name", () => {
    const filtered = filterScenarios(
      scenarios,
      "Another",
      "all",
      existingGroupIds,
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("2");
  });

  it("should filter by search text in description", () => {
    const filtered = filterScenarios(
      scenarios,
      "test description",
      "all",
      existingGroupIds,
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("1");
  });

  it("should filter by group", () => {
    const filtered = filterScenarios(scenarios, "", "group1", existingGroupIds);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("1");
  });

  it("should filter ungrouped scenarios", () => {
    const filtered = filterScenarios(
      scenarios,
      "",
      "ungrouped",
      existingGroupIds,
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("3");
  });

  it("should show all when filter is 'all'", () => {
    const filtered = filterScenarios(scenarios, "", "all", existingGroupIds);
    expect(filtered).toHaveLength(3);
  });

  it("should combine search text and group filter", () => {
    const filtered = filterScenarios(
      scenarios,
      "Test",
      "group1",
      existingGroupIds,
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("1");
  });
});

describe("groupScenarios", () => {
  const scenarios: TestScenario[] = [
    {
      id: "1",
      name: "Scenario 1",
      groupId: "group1",
      isFavorite: false,
      createdAt: "2024-01-01",
    } as TestScenario,
    {
      id: "2",
      name: "Scenario 2",
      groupId: "group1",
      isFavorite: true,
      createdAt: "2024-01-02",
    } as TestScenario,
    {
      id: "3",
      name: "Scenario 3",
      isFavorite: false,
      createdAt: "2024-01-03",
    } as TestScenario,
  ];

  const groups: ScenarioGroup[] = [
    {
      id: "group1",
      name: "Group 1",
      description: "Test group",
    } as ScenarioGroup,
  ];

  it("should separate grouped and ungrouped scenarios", () => {
    const result = groupScenarios(scenarios, groups);

    expect(result.groupedScenarios).toHaveLength(1);
    expect(result.groupedScenarios[0].scenarios).toHaveLength(2);
    expect(result.ungroupedScenarios).toHaveLength(1);
    expect(result.ungroupedScenarios[0].id).toBe("3");
  });

  it("should sort scenarios within groups by favorite", () => {
    const result = groupScenarios(scenarios, groups);

    const scenariosInGroup = result.groupedScenarios[0].scenarios;
    expect(scenariosInGroup[0].isFavorite).toBe(true);
    expect(scenariosInGroup[1].isFavorite).toBe(false);
  });

  it("should return correct existingGroupIds set", () => {
    const result = groupScenarios(scenarios, groups);

    expect(result.existingGroupIds.has("group1")).toBe(true);
    expect(result.existingGroupIds.has("nonexistent")).toBe(false);
  });
});
