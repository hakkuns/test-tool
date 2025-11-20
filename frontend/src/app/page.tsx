"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Download,
  Upload,
  Play,
  Edit,
  Trash2,
  FileJson,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  Folder,
  MoreVertical,
  Database,
  Table,
  Rows,
  Network,
  Star,
  StarOff,
  CircleCheck,
  CircleX,
  CircleHelp,
  Search,
  X,
  Copy,
} from "lucide-react";
import { scenariosApi, groupsApi } from "@/lib/api/scenarios";
import type { TestScenario, ScenarioGroup } from "@/types/scenario";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Home() {
  const router = useRouter();
  const [scenarios, setScenarios] = useState<TestScenario[]>([]);
  const [groups, setGroups] = useState<ScenarioGroup[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    // localStorageから展開状態を復元
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("expandedGroups");
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
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scenarioToDelete, setScenarioToDelete] = useState<string | null>(null);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ScenarioGroup | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");

  // 検索とフィルター
  const [searchText, setSearchText] = useState("");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<
    string | "all" | "ungrouped"
  >("all");

  // データ取得
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const scenariosData = await scenariosApi.getAll();

      // グループ取得は失敗しても続行
      let groupsData: ScenarioGroup[] = [];
      try {
        groupsData = await groupsApi.getAll();
      } catch (groupError) {
        console.warn(
          "Failed to fetch groups, continuing without groups:",
          groupError,
        );
        toast.error("グループの取得に失敗しました（シナリオは表示されます）");
      }

      setScenarios(scenariosData);
      setGroups(groupsData);
    } catch (error) {
      toast.error("データの取得に失敗しました");
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // グループの展開/折りたたみ
  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
    // localStorageに保存
    if (typeof window !== "undefined") {
      localStorage.setItem("expandedGroups", JSON.stringify(Array.from(newExpanded)));
    }
  };

  // グループ作成ダイアログを開く
  const openGroupDialog = (group?: ScenarioGroup) => {
    if (group) {
      setEditingGroup(group);
      setGroupName(group.name);
      setGroupDescription(group.description || "");
    } else {
      setEditingGroup(null);
      setGroupName("");
      setGroupDescription("");
    }
    setGroupDialogOpen(true);
  };

  // グループ保存
  const handleSaveGroup = async () => {
    if (!groupName.trim()) {
      toast.error("グループ名を入力してください");
      return;
    }

    try {
      if (editingGroup) {
        const updated = await groupsApi.update(editingGroup.id, {
          name: groupName,
          description: groupDescription,
        });
        toast.success("グループを更新しました");
      } else {
        const created = await groupsApi.create({
          name: groupName,
          description: groupDescription,
        });
        toast.success("グループを作成しました");
      }
      setGroupDialogOpen(false);
      await fetchData();
    } catch (error) {
      console.error("Group save error:", error);
      toast.error(
        `グループの保存に失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`,
      );
    }
  };

  // グループ削除
  const handleDeleteGroup = async (groupId: string) => {
    if (
      !confirm(
        "このグループを削除しますか？\nグループ内のシナリオは削除されません。",
      )
    ) {
      return;
    }

    try {
      await groupsApi.delete(groupId);
      toast.success("グループを削除しました");
      await fetchData();
    } catch (error) {
      toast.error("グループの削除に失敗しました");
      console.error(error);
    }
  };

  // グループエクスポート
  const handleExportGroup = async (groupId: string, groupName: string) => {
    try {
      const exportData = await groupsApi.exportGroup(groupId);
      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `group_${groupName}_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("グループをエクスポートしました");
    } catch (error) {
      toast.error("グループのエクスポートに失敗しました");
      console.error(error);
    }
  };

  // グループインポート
  const handleImportGroup = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const exportData = JSON.parse(text);

      // グループファイルのフォーマットを検証
      if (!exportData.group || !exportData.scenarios) {
        toast.error("グループインポートファイルの形式が正しくありません");
        event.target.value = "";
        return;
      }

      if (!exportData.group.name) {
        toast.error("グループ名が見つかりません");
        event.target.value = "";
        return;
      }

      const result = await groupsApi.importGroup(exportData);
      toast.success(
        `グループ「${result.group.name}」をインポートしました（${result.scenarios.length}個のシナリオ）`,
      );
      await fetchData();
    } catch (error) {
      toast.error("グループのインポートに失敗しました");
      console.error(error);
    }

    event.target.value = "";
  };

  // シナリオ削除
  const handleDelete = async () => {
    if (!scenarioToDelete) return;

    try {
      await scenariosApi.delete(scenarioToDelete);
      toast.success("シナリオを削除しました");
      await fetchData();
    } catch (error) {
      toast.error("シナリオの削除に失敗しました");
      console.error(error);
    } finally {
      setDeleteDialogOpen(false);
      setScenarioToDelete(null);
    }
  };

  // シナリオコピー
  const handleCopy = async (id: string, name: string) => {
    try {
      const original = scenarios.find((s) => s.id === id);
      if (!original) return;

      const copied = await scenariosApi.create({
        name: `${name}のコピー`,
        description: original.description,
        targetApi: original.targetApi,
        tables: original.tables || [],
        tableData: original.tableData || [],
        mockApis: original.mockApis || [],
        testSettings: original.testSettings,
        expectedResponse: original.expectedResponse,
        tags: original.tags || [],
        groupId: original.groupId,
      });
      toast.success("シナリオをコピーしました");
      await fetchData();

      // コピー後、コピー元のグループにフィルターを切り替える
      if (original.groupId) {
        setSelectedGroupFilter(original.groupId);
      } else {
        setSelectedGroupFilter("ungrouped");
      }
    } catch (error) {
      toast.error("シナリオのコピーに失敗しました");
      console.error(error);
    }
  };

  // シナリオエクスポート
  const handleExport = async (id: string) => {
    try {
      const exportData = await scenariosApi.exportScenario(id);
      scenariosApi.downloadAsJson(exportData);
      toast.success("シナリオをエクスポートしました");
    } catch (error) {
      toast.error("エクスポートに失敗しました");
      console.error(error);
    }
  };

  // シナリオインポート
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const exportData = JSON.parse(text);

      // フォーマットを検証
      // グループファイルの場合はエラー
      if (exportData.group && exportData.scenarios) {
        toast.error(
          "グループファイルです。「グループインポート」を使用してください",
        );
        event.target.value = "";
        return;
      }

      // シナリオファイルの検証
      const dataArray = Array.isArray(exportData) ? exportData : [exportData];
      for (const data of dataArray) {
        const scenario = data.scenario || data;
        if (!scenario || !scenario.name) {
          toast.error("シナリオインポートファイルの形式が正しくありません");
          event.target.value = "";
          return;
        }
      }

      await scenariosApi.importFromFile(file);
      toast.success("シナリオをインポートしました");
      await fetchData();
    } catch (error) {
      toast.error("インポートに失敗しました");
      console.error(error);
    }

    event.target.value = "";
  };

  // シナリオ適用
  const handleApply = async (id: string, name: string) => {
    if (
      !confirm(
        `シナリオ "${name}" を適用しますか？\n既存のテーブルとモックAPIに影響します。`,
      )
    ) {
      return;
    }

    try {
      const scenario = scenarios.find((s) => s.id === id);
      const result = await scenariosApi.apply(id);
      toast.success(
        `シナリオを適用しました\nテーブル: ${scenario?.tableData?.length || 0}個\nデータ: ${result.dataInserted}行\nモックAPI: ${result.mocksConfigured}個`,
      );
    } catch (error) {
      toast.error("シナリオの適用に失敗しました");
      console.error(error);
    }
  };

  // シナリオのグループを変更
  const handleMoveToGroup = async (
    scenarioId: string,
    newGroupId: string | undefined,
  ) => {
    try {
      const scenario = scenarios.find((s) => s.id === scenarioId);
      if (!scenario) return;

      await scenariosApi.update(scenarioId, {
        groupId: newGroupId,
      });
      toast.success("シナリオを移動しました");
      await fetchData();
    } catch (error) {
      toast.error("シナリオの移動に失敗しました");
      console.error(error);
    }
  };

  // お気に入りの切り替え
  const handleToggleFavorite = async (scenarioId: string) => {
    try {
      const scenario = scenarios.find((s) => s.id === scenarioId);
      if (!scenario) return;

      await scenariosApi.update(scenarioId, {
        isFavorite: !scenario.isFavorite,
      });

      // ローカルステートを更新
      setScenarios((prev) =>
        prev.map((s) =>
          s.id === scenarioId ? { ...s, isFavorite: !s.isFavorite } : s,
        ),
      );
    } catch (error) {
      toast.error("お気に入りの更新に失敗しました");
      console.error(error);
    }
  };

  // テスト結果の更新
  const handleUpdateTestResult = async (
    scenarioId: string,
    result: "success" | "failure" | "unknown",
  ) => {
    try {
      const now = new Date().toISOString();
      await scenariosApi.update(scenarioId, {
        lastTestResult: result,
        lastTestedAt: now,
      });

      // ローカルステートを更新
      setScenarios((prev) =>
        prev.map((s) =>
          s.id === scenarioId
            ? { ...s, lastTestResult: result, lastTestedAt: now }
            : s,
        ),
      );

      const resultText =
        result === "success" ? "成功" : result === "failure" ? "失敗" : "不明";
      toast.success(`テスト結果を「${resultText}」に更新しました`);
    } catch (error) {
      toast.error("テスト結果の更新に失敗しました");
      console.error(error);
    }
  };

  // 検索とフィルターロジック
  const filterScenarios = (scenarioList: TestScenario[]) => {
    let filtered = scenarioList;

    // テキスト検索
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(searchLower) ||
          s.description?.toLowerCase().includes(searchLower),
      );
    }

    // グループフィルター
    if (selectedGroupFilter !== "all") {
      if (selectedGroupFilter === "ungrouped") {
        filtered = filtered.filter(
          (s) => !s.groupId || !existingGroupIds.has(s.groupId),
        );
      } else {
        filtered = filtered.filter((s) => s.groupId === selectedGroupFilter);
      }
    }

    return filtered;
  };

  // グループ別にシナリオを整理
  // 存在するグループのIDセット
  const existingGroupIds = new Set(groups.map((g) => g.id));

  // フィルター適用後のシナリオ
  const filteredScenarios = filterScenarios(scenarios);

  // groupIdが無いか、存在しないグループIDを持つシナリオは未分類とする
  // お気に入りが前に来るようにソート
  const ungroupedScenarios = filteredScenarios
    .filter((s) => !s.groupId || !existingGroupIds.has(s.groupId))
    .sort((a, b) => {
      // お気に入りを優先
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      // 作成日時で降順
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const groupedScenarios = groups.map((group) => ({
    group,
    scenarios: filteredScenarios
      .filter((s) => s.groupId === group.id)
      .sort((a, b) => {
        // お気に入りを優先
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        // 作成日時で降順
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }),
  }));

  // グループフィルターが適用されている場合の表示制御
  const shouldShowGroup = (groupId: string) => {
    return selectedGroupFilter === "all" || selectedGroupFilter === groupId;
  };

  const shouldShowUngrouped =
    selectedGroupFilter === "all" || selectedGroupFilter === "ungrouped";

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
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="シナリオ名または説明で検索..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchText && (
            <button
              onClick={() => setSearchText("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select
          value={selectedGroupFilter}
          onValueChange={(value) => setSelectedGroupFilter(value)}
        >
          <SelectTrigger className="w-full lg:w-[180px]">
            <SelectValue placeholder="グループで絞り込み" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて表示</SelectItem>
            <SelectItem value="ungrouped">未分類のみ</SelectItem>
            {groups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="default">
                <FolderPlus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">グループ</span>
                <span className="sm:hidden">Group</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openGroupDialog()}>
                <FolderPlus className="h-4 w-4 mr-2" />
                グループ作成
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <label htmlFor="import-group-file" className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  グループインポート
                </label>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <input
            id="import-group-file"
            type="file"
            accept=".json"
            onChange={handleImportGroup}
            className="hidden"
          />
          <label htmlFor="import-file">
            <Button variant="outline" asChild size="default">
              <span>
                <Upload className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">インポート</span>
                <span className="sm:hidden">Import</span>
              </span>
            </Button>
          </label>
          <input
            id="import-file"
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <Button onClick={() => router.push("/scenarios/new")} size="default">
            <Plus className="h-4 w-4 mr-2" />
            新規作成
          </Button>
        </div>
      </div>

      {/* 検索結果の件数表示 */}
      {(searchText || selectedGroupFilter !== "all") && (
        <div className="text-sm text-muted-foreground">
          {filteredScenarios.length}件のシナリオが見つかりました
          {searchText && ` (検索: "${searchText}")`}
        </div>
      )}

      {/* シナリオ一覧 */}
      {scenarios.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <FileJson className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              シナリオがまだありません
            </p>
            <Button onClick={() => router.push("/scenarios/new")}>
              <Plus className="h-4 w-4 mr-2" />
              最初のシナリオを作成
            </Button>
          </CardContent>
        </Card>
      ) : filteredScenarios.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              条件に一致するシナリオが見つかりませんでした
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchText("");
                setSelectedGroupFilter("all");
              }}
            >
              検索条件をクリア
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* グループ化されたシナリオ */}
          {groupedScenarios
            .filter(
              ({ group, scenarios: groupScenarios }) =>
                shouldShowGroup(group.id) && groupScenarios.length > 0,
            )
            .map(({ group, scenarios: groupScenarios }) => (
              <div key={group.id} className="space-y-1">
                <div className="flex items-center hover:bg-muted/50 p-1.5 rounded-lg transition-colors">
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="flex items-center gap-2"
                  >
                    {expandedGroups.has(group.id) ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                    <Folder className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">{group.name}</h2>
                    <Badge variant="secondary" className="text-xs ml-1">
                      {groupScenarios.length}件
                    </Badge>
                    {group.description && (
                      <span className="text-sm text-muted-foreground ml-2 hidden lg:inline">
                        {group.description}
                      </span>
                    )}
                  </button>
                  <div className="flex-1" />
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleExportGroup(group.id, group.name)}
                      className="h-8 w-8 p-0"
                      title="グループをエクスポート"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openGroupDialog(group)}
                      className="h-8 w-8 p-0"
                      title="グループを編集"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteGroup(group.id)}
                      className="h-8 w-8 p-0"
                      title="グループを削除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {expandedGroups.has(group.id) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-9">
                    {groupScenarios.map((scenario) => (
                      <ScenarioCard
                        key={scenario.id}
                        scenario={scenario}
                        groups={groups}
                        onExport={handleExport}
                        onCopy={handleCopy}
                        onDelete={(id) => {
                          setScenarioToDelete(id);
                          setDeleteDialogOpen(true);
                        }}
                        onMoveToGroup={handleMoveToGroup}
                        onToggleFavorite={handleToggleFavorite}
                        onUpdateTestResult={handleUpdateTestResult}
                        router={router}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}

          {/* グループ化されていないシナリオ */}
          {shouldShowUngrouped && ungroupedScenarios.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 p-1.5">
                <FileJson className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">未分類</h2>
                <Badge variant="secondary" className="text-xs">
                  {ungroupedScenarios.length}件
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-9">
                {ungroupedScenarios.map((scenario) => (
                  <ScenarioCard
                    key={scenario.id}
                    scenario={scenario}
                    groups={groups}
                    onExport={handleExport}
                    onCopy={handleCopy}
                    onDelete={(id) => {
                      setScenarioToDelete(id);
                      setDeleteDialogOpen(true);
                    }}
                    onMoveToGroup={handleMoveToGroup}
                    onToggleFavorite={handleToggleFavorite}
                    onUpdateTestResult={handleUpdateTestResult}
                    router={router}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 削除確認ダイアログ */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>シナリオを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。シナリオのデータが完全に削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>削除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* グループ作成/編集ダイアログ */}
      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? "グループ編集" : "グループ作成"}
            </DialogTitle>
            <DialogDescription>
              シナリオをグループ化して管理できます
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                グループ名 ({groupName.length}/100)
              </label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="例: ユーザーAPI"
                maxLength={100}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                説明（任意） ({groupDescription.length}/500)
              </label>
              <Textarea
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="グループの説明"
                maxLength={500}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSaveGroup}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// HTTPメソッドの色を取得
function getMethodColor(method: string): string {
  switch (method) {
    case "GET":
      return "bg-blue-500 text-white border-blue-500";
    case "POST":
      return "bg-green-500 text-white border-green-500";
    case "PUT":
      return "bg-yellow-500 text-white border-yellow-500";
    case "PATCH":
      return "bg-purple-500 text-white border-purple-500";
    case "DELETE":
      return "bg-red-500 text-white border-red-500";
    default:
      return "bg-gray-500 text-white border-gray-500";
  }
}

// シナリオカードコンポーネント
function ScenarioCard({
  scenario,
  groups,
  onExport,
  onCopy,
  onDelete,
  onMoveToGroup,
  onToggleFavorite,
  onUpdateTestResult,
  router,
}: {
  scenario: TestScenario;
  groups: ScenarioGroup[];
  onToggleFavorite: (id: string) => void;
  onUpdateTestResult: (
    id: string,
    result: "success" | "failure" | "unknown",
  ) => void;
  onExport: (id: string) => void;
  onCopy: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onMoveToGroup: (scenarioId: string, groupId: string | undefined) => void;
  router: any;
}) {
  return (
    <Card className="hover:shadow-lg transition-shadow flex flex-col overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              onClick={() => onToggleFavorite(scenario.id)}
              className="hover:scale-110 transition-transform flex-shrink-0"
            >
              {scenario.isFavorite ? (
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              ) : (
                <StarOff className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
            <CardTitle className="truncate text-lg font-semibold" title={scenario.name}>
              {scenario.name}
            </CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onCopy(scenario.id, scenario.name)}
              >
                <Copy className="h-4 w-4 mr-2" />
                コピー
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>グループに移動</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onMoveToGroup(scenario.id, undefined)}
              >
                未分類
              </DropdownMenuItem>
              {groups.map((group) => (
                <DropdownMenuItem
                  key={group.id}
                  onClick={() => onMoveToGroup(scenario.id, group.id)}
                >
                  {group.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {scenario.description && (
          <CardDescription className="line-clamp-2 break-words mt-1.5" title={scenario.description}>{scenario.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex flex-col flex-1">
        {/* タグ */}
        {scenario.tags && scenario.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {scenario.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* スペーサー */}
        <div className="flex-1" />

        {/* 統計情報 - 右寄せ */}
        <div className="flex items-center justify-end gap-4 text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Table className="h-3.5 w-3.5" />
            <span className="font-medium">
              {scenario.tableData?.length || 0}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Rows className="h-3.5 w-3.5" />
            <span className="font-medium">
              {scenario.tableData?.reduce((sum, t) => sum + t.rows.length, 0) ||
                0}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Network className="h-3.5 w-3.5" />
            <span className="font-medium">
              {scenario.mockApis?.length || 0}
            </span>
          </div>

          {/* テスト結果 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 hover:opacity-70 transition-opacity">
                {scenario.lastTestResult === "success" ? (
                  <CircleCheck className="h-4 w-4 text-green-500" />
                ) : scenario.lastTestResult === "failure" ? (
                  <CircleX className="h-4 w-4 text-red-500" />
                ) : (
                  <CircleHelp className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>テスト結果</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onUpdateTestResult(scenario.id, "success")}
              >
                <CircleCheck className="h-4 w-4 mr-2 text-green-500" />
                成功
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onUpdateTestResult(scenario.id, "failure")}
              >
                <CircleX className="h-4 w-4 mr-2 text-red-500" />
                失敗
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onUpdateTestResult(scenario.id, "unknown")}
              >
                <CircleHelp className="h-4 w-4 mr-2 text-gray-400" />
                未テスト
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* アクション - アイコンのみ */}
        <div className="flex items-center gap-2 pt-3 border-t">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => router.push(`/scenarios/${scenario.id}`)}
            title="編集"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onExport(scenario.id)}
            title="エクスポート"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(scenario.id)}
            title="削除"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <div className="flex-1" />
          <span className="text-xs text-muted-foreground">
            {new Date(scenario.createdAt).toLocaleDateString("ja-JP")}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
