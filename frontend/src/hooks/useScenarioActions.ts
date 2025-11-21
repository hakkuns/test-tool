import { useCallback } from "react";

/**
 * シナリオに関連するアクションを管理するフック
 */
export function useScenarioActions() {
  /**
   * シナリオコピー後のフィルター切り替え処理
   */
  const handleCopyScenario = useCallback(
    async (
      copyScenario: (id: string, name: string) => Promise<string | undefined>,
      setSelectedGroupFilter: (filter: string) => void,
      id: string,
      name: string
    ) => {
      const groupId = await copyScenario(id, name);
      if (groupId) {
        setSelectedGroupFilter(groupId);
      } else {
        setSelectedGroupFilter("ungrouped");
      }
    },
    []
  );

  return {
    handleCopyScenario,
  };
}
