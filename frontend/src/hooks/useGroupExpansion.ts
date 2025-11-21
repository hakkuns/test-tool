import { useState, useCallback } from "react";

const STORAGE_KEY = "expandedGroups";

/**
 * グループの展開/折りたたみ状態を管理するフック
 * localStorageに状態を保存する
 */
export function useGroupExpansion() {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    // localStorageから展開状態を復元
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return new Set(JSON.parse(saved));
        } catch (error) {
          console.error("Failed to parse expandedGroups from localStorage:", error);
        }
      }
    }
    return new Set();
  });

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(groupId)) {
        newExpanded.delete(groupId);
      } else {
        newExpanded.add(groupId);
      }

      // localStorageに保存
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(newExpanded)));
      }

      return newExpanded;
    });
  }, []);

  return {
    expandedGroups,
    toggleGroup,
  };
}
