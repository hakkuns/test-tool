import type { TestScenario, ScenarioGroup } from "@/types/scenario";

/**
 * シナリオをお気に入り優先でソート
 */
export function sortScenariosByFavorite(
  scenarios: TestScenario[]
): TestScenario[] {
  return [...scenarios].sort((a, b) => {
    // お気に入りを優先
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    // 作成日時で降順
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/**
 * シナリオをフィルタリング
 */
export function filterScenarios(
  scenarios: TestScenario[],
  searchText: string,
  selectedGroupFilter: string | "all" | "ungrouped",
  existingGroupIds: Set<string>
): TestScenario[] {
  let filtered = scenarios;

  // テキスト検索
  if (searchText.trim()) {
    const searchLower = searchText.toLowerCase();
    filtered = filtered.filter(
      (s) =>
        s.name.toLowerCase().includes(searchLower) ||
        s.description?.toLowerCase().includes(searchLower)
    );
  }

  // グループフィルター
  if (selectedGroupFilter !== "all") {
    if (selectedGroupFilter === "ungrouped") {
      filtered = filtered.filter(
        (s) => !s.groupId || !existingGroupIds.has(s.groupId)
      );
    } else {
      filtered = filtered.filter((s) => s.groupId === selectedGroupFilter);
    }
  }

  return filtered;
}

/**
 * シナリオをグループ別に整理
 */
export function groupScenarios(
  scenarios: TestScenario[],
  groups: ScenarioGroup[]
): {
  groupedScenarios: Array<{ group: ScenarioGroup; scenarios: TestScenario[] }>;
  ungroupedScenarios: TestScenario[];
  existingGroupIds: Set<string>;
} {
  const existingGroupIds = new Set(groups.map((g) => g.id));

  // 未分類のシナリオ
  const ungroupedScenarios = sortScenariosByFavorite(
    scenarios.filter((s) => !s.groupId || !existingGroupIds.has(s.groupId))
  );

  // グループ化されたシナリオ
  const groupedScenarios = groups.map((group) => ({
    group,
    scenarios: sortScenariosByFavorite(
      scenarios.filter((s) => s.groupId === group.id)
    ),
  }));

  return {
    groupedScenarios,
    ungroupedScenarios,
    existingGroupIds,
  };
}
