import { useState, useMemo } from "react";
import type { TestScenario, ScenarioGroup } from "@/types/scenario";
import { filterScenarios, groupScenarios } from "@/lib/utils/scenarioUtils";

/**
 * シナリオの検索・フィルタリングを管理するフック
 */
export function useScenarioFilters(
  scenarios: TestScenario[],
  groups: ScenarioGroup[]
) {
  const [searchText, setSearchText] = useState("");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<
    string | "all" | "ungrouped"
  >("all");

  // グループ別にシナリオを整理
  const { groupedScenarios, ungroupedScenarios, existingGroupIds } = useMemo(
    () => groupScenarios(scenarios, groups),
    [scenarios, groups]
  );

  // フィルター適用後のシナリオ
  const filteredScenarios = useMemo(
    () =>
      filterScenarios(
        scenarios,
        searchText,
        selectedGroupFilter,
        existingGroupIds
      ),
    [scenarios, searchText, selectedGroupFilter, existingGroupIds]
  );

  // フィルター適用後のグループ別シナリオ
  const filteredGroupedScenarios = useMemo(
    () =>
      groupedScenarios.map((group) => ({
        ...group,
        scenarios: filterScenarios(
          group.scenarios,
          searchText,
          selectedGroupFilter,
          existingGroupIds
        ),
      })),
    [groupedScenarios, searchText, selectedGroupFilter, existingGroupIds]
  );

  // フィルター適用後の未分類シナリオ
  const filteredUngroupedScenarios = useMemo(
    () =>
      filterScenarios(
        ungroupedScenarios,
        searchText,
        selectedGroupFilter,
        existingGroupIds
      ),
    [ungroupedScenarios, searchText, selectedGroupFilter, existingGroupIds]
  );

  // グループフィルターが適用されている場合の表示制御
  const shouldShowGroup = (groupId: string) => {
    return selectedGroupFilter === "all" || selectedGroupFilter === groupId;
  };

  const shouldShowUngrouped =
    selectedGroupFilter === "all" || selectedGroupFilter === "ungrouped";

  const clearFilters = () => {
    setSearchText("");
    setSelectedGroupFilter("all");
  };

  return {
    searchText,
    setSearchText,
    selectedGroupFilter,
    setSelectedGroupFilter,
    filteredScenarios,
    filteredGroupedScenarios,
    filteredUngroupedScenarios,
    shouldShowGroup,
    shouldShowUngrouped,
    clearFilters,
    existingGroupIds,
  };
}
