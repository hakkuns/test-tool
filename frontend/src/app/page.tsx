"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { FileJson } from "lucide-react";
import { useScenarios } from "@/hooks/useScenarios";
import { useGroups } from "@/hooks/useGroups";
import { useScenarioFilters } from "@/hooks/useScenarioFilters";
import { useGroupExpansion } from "@/hooks/useGroupExpansion";
import { useScenarioDialog } from "@/hooks/useScenarioDialog";
import { useGroupDialog } from "@/hooks/useGroupDialog";
import { useScenarioActions } from "@/hooks/useScenarioActions";
import { ScenarioCard } from "@/components/scenarios/ScenarioCard";
import { GroupHeader } from "@/components/scenarios/GroupHeader";
import { ScenarioFilters } from "@/components/scenarios/ScenarioFilters";
import { EmptyState } from "@/components/scenarios/EmptyState";
import { GroupDialog } from "@/components/scenarios/GroupDialog";
import { DeleteScenarioDialog } from "@/components/scenarios/DeleteScenarioDialog";
import { DeleteGroupDialog } from "@/components/scenarios/DeleteGroupDialog";

export default function Home() {
  const router = useRouter();

  // データフック
  const {
    scenarios,
    isLoading,
    deleteScenario,
    copyScenario,
    exportScenario,
    importScenario,
    moveToGroup,
    toggleFavorite,
    updateTestResult,
  } = useScenarios();

  const {
    groups,
    createGroup,
    updateGroup,
    deleteGroup,
    exportGroup,
    importGroup,
  } = useGroups();

  // フィルター・UI状態フック
  const {
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
  } = useScenarioFilters(scenarios, groups);

  const { expandedGroups, toggleGroup } = useGroupExpansion();

  // ダイアログフック
  const {
    deleteDialogOpen,
    openDeleteDialog,
    setDeleteDialogOpen,
    handleDeleteScenario,
  } = useScenarioDialog();

  const {
    groupDialogOpen,
    editingGroup,
    openGroupDialog,
    setGroupDialogOpen,
    handleSaveGroup,
    deleteDialogOpen: groupDeleteDialogOpen,
    openDeleteDialog: openGroupDeleteDialog,
    setDeleteDialogOpen: setGroupDeleteDialogOpen,
    handleDeleteGroup,
  } = useGroupDialog();

  // アクションフック
  const { handleCopyScenario } = useScenarioActions();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 検索、フィルター、アクションボタン */}
      <ScenarioFilters
        searchText={searchText}
        onSearchTextChange={setSearchText}
        selectedGroupFilter={selectedGroupFilter}
        onGroupFilterChange={setSelectedGroupFilter}
        groups={groups}
        onCreateScenario={() => router.push("/scenarios/new")}
        onCreateGroup={() => openGroupDialog()}
        onImportScenario={importScenario}
        onImportGroup={importGroup}
      />

      {/* 検索結果の件数表示 */}
      {(searchText || selectedGroupFilter !== "all") && (
        <div className="text-sm text-muted-foreground">
          {filteredScenarios.length}件のシナリオが見つかりました
          {searchText && ` (検索: "${searchText}")`}
        </div>
      )}

      {/* シナリオ一覧 */}
      {scenarios.length === 0 ? (
        <EmptyState
          type="no-scenarios"
          onCreateScenario={() => router.push("/scenarios/new")}
        />
      ) : filteredScenarios.length === 0 ? (
        <EmptyState type="no-results" onClearFilters={clearFilters} />
      ) : (
        <div className="space-y-3">
          {/* グループ化されたシナリオ */}
          {filteredGroupedScenarios
            .filter(
              ({ group, scenarios: groupScenarios }) =>
                shouldShowGroup(group.id) && groupScenarios.length > 0
            )
            .map(({ group, scenarios: groupScenarios }) => (
              <div key={group.id} className="space-y-1">
                <GroupHeader
                  group={group}
                  isExpanded={expandedGroups.has(group.id)}
                  scenarioCount={groupScenarios.length}
                  onToggle={() => toggleGroup(group.id)}
                  onExport={() => exportGroup(group.id, group.name)}
                  onEdit={() => openGroupDialog(group)}
                  onDelete={() => openGroupDeleteDialog(group.id)}
                />

                {expandedGroups.has(group.id) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-9">
                    {groupScenarios.map((scenario) => (
                      <ScenarioCard
                        key={scenario.id}
                        scenario={scenario}
                        groups={groups}
                        onExport={exportScenario}
                        onCopy={(id, name) =>
                          handleCopyScenario(
                            copyScenario,
                            setSelectedGroupFilter,
                            id,
                            name
                          )
                        }
                        onDelete={openDeleteDialog}
                        onMoveToGroup={moveToGroup}
                        onToggleFavorite={toggleFavorite}
                        onUpdateTestResult={updateTestResult}
                        onEdit={(id) => router.push(`/scenarios/${id}`)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}

          {/* グループ化されていないシナリオ */}
          {shouldShowUngrouped && filteredUngroupedScenarios.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 p-1.5">
                <FileJson className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">未分類</h2>
                <Badge variant="secondary" className="text-xs">
                  {filteredUngroupedScenarios.length}件
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-9">
                {filteredUngroupedScenarios.map((scenario) => (
                  <ScenarioCard
                    key={scenario.id}
                    scenario={scenario}
                    groups={groups}
                    onExport={exportScenario}
                    onCopy={(id, name) =>
                      handleCopyScenario(
                        copyScenario,
                        setSelectedGroupFilter,
                        id,
                        name
                      )
                    }
                    onDelete={openDeleteDialog}
                    onMoveToGroup={moveToGroup}
                    onToggleFavorite={toggleFavorite}
                    onUpdateTestResult={updateTestResult}
                    onEdit={(id) => router.push(`/scenarios/${id}`)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* シナリオ削除確認ダイアログ */}
      <DeleteScenarioDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => handleDeleteScenario(deleteScenario)}
      />

      {/* グループ削除確認ダイアログ */}
      <DeleteGroupDialog
        open={groupDeleteDialogOpen}
        onOpenChange={setGroupDeleteDialogOpen}
        onConfirm={() => handleDeleteGroup(deleteGroup)}
      />

      {/* グループ作成/編集ダイアログ */}
      <GroupDialog
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        editingGroup={editingGroup}
        onSave={(name, description) =>
          handleSaveGroup(name, description, createGroup, updateGroup)
        }
      />
    </div>
  );
}
