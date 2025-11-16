'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';
import { scenariosApi, groupsApi } from '@/lib/api/scenarios';
import type { TestScenario, ScenarioGroup } from '@/types/scenario';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function Home() {
  const router = useRouter();
  const [scenarios, setScenarios] = useState<TestScenario[]>([]);
  const [groups, setGroups] = useState<ScenarioGroup[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scenarioToDelete, setScenarioToDelete] = useState<string | null>(null);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ScenarioGroup | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');

  // データ取得
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const scenariosData = await scenariosApi.getAll();
      console.log('Fetched scenarios:', scenariosData);

      // グループ取得は失敗しても続行
      let groupsData: ScenarioGroup[] = [];
      try {
        groupsData = await groupsApi.getAll();
        console.log('Fetched groups:', groupsData);
      } catch (groupError) {
        console.warn(
          'Failed to fetch groups, continuing without groups:',
          groupError
        );
        toast.error('グループの取得に失敗しました（シナリオは表示されます）');
      }

      setScenarios(scenariosData);
      setGroups(groupsData);
    } catch (error) {
      toast.error('データの取得に失敗しました');
      console.error('Fetch error:', error);
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
  };

  // グループ作成ダイアログを開く
  const openGroupDialog = (group?: ScenarioGroup) => {
    if (group) {
      setEditingGroup(group);
      setGroupName(group.name);
      setGroupDescription(group.description || '');
    } else {
      setEditingGroup(null);
      setGroupName('');
      setGroupDescription('');
    }
    setGroupDialogOpen(true);
  };

  // グループ保存
  const handleSaveGroup = async () => {
    if (!groupName.trim()) {
      toast.error('グループ名を入力してください');
      return;
    }

    try {
      if (editingGroup) {
        await groupsApi.update(editingGroup.id, {
          name: groupName,
          description: groupDescription,
        });
        toast.success('グループを更新しました');
      } else {
        await groupsApi.create({
          name: groupName,
          description: groupDescription,
        });
        toast.success('グループを作成しました');
      }
      setGroupDialogOpen(false);
      await fetchData();
    } catch (error) {
      toast.error('グループの保存に失敗しました');
      console.error(error);
    }
  };

  // グループ削除
  const handleDeleteGroup = async (groupId: string) => {
    if (
      !confirm(
        'このグループを削除しますか？\nグループ内のシナリオは削除されません。'
      )
    ) {
      return;
    }

    try {
      await groupsApi.delete(groupId);
      toast.success('グループを削除しました');
      await fetchData();
    } catch (error) {
      toast.error('グループの削除に失敗しました');
      console.error(error);
    }
  };

  // シナリオ削除
  const handleDelete = async () => {
    if (!scenarioToDelete) return;

    try {
      await scenariosApi.delete(scenarioToDelete);
      toast.success('シナリオを削除しました');
      await fetchData();
    } catch (error) {
      toast.error('シナリオの削除に失敗しました');
      console.error(error);
    } finally {
      setDeleteDialogOpen(false);
      setScenarioToDelete(null);
    }
  };

  // シナリオエクスポート
  const handleExport = async (id: string) => {
    try {
      const exportData = await scenariosApi.exportScenario(id);
      scenariosApi.downloadAsJson(exportData);
      toast.success('シナリオをエクスポートしました');
    } catch (error) {
      toast.error('エクスポートに失敗しました');
      console.error(error);
    }
  };

  // シナリオインポート
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await scenariosApi.importFromFile(file);
      toast.success('シナリオをインポートしました');
      await fetchData();
    } catch (error) {
      toast.error('インポートに失敗しました');
      console.error(error);
    }

    event.target.value = '';
  };

  // シナリオ適用
  const handleApply = async (id: string, name: string) => {
    if (
      !confirm(
        `シナリオ "${name}" を適用しますか？\n既存のテーブルとモックAPIに影響します。`
      )
    ) {
      return;
    }

    try {
      const result = await scenariosApi.apply(id);
      toast.success(
        `シナリオを適用しました\nテーブル: ${result.tablesCreated}個\nデータ: ${result.dataInserted}行\nモックAPI: ${result.mocksConfigured}個`
      );
    } catch (error) {
      toast.error('シナリオの適用に失敗しました');
      console.error(error);
    }
  };

  // シナリオのグループを変更
  const handleMoveToGroup = async (
    scenarioId: string,
    newGroupId: string | undefined
  ) => {
    try {
      const scenario = scenarios.find((s) => s.id === scenarioId);
      if (!scenario) return;

      await scenariosApi.update(scenarioId, {
        groupId: newGroupId,
      });
      toast.success('シナリオを移動しました');
      await fetchData();
    } catch (error) {
      toast.error('シナリオの移動に失敗しました');
      console.error(error);
    }
  };

  // グループ別にシナリオを整理
  // 存在するグループのIDセット
  const existingGroupIds = new Set(groups.map((g) => g.id));

  // groupIdが無いか、存在しないグループIDを持つシナリオは未分類とする
  const ungroupedScenarios = scenarios.filter(
    (s) => !s.groupId || !existingGroupIds.has(s.groupId)
  );

  const groupedScenarios = groups.map((group) => ({
    group,
    scenarios: scenarios.filter((s) => s.groupId === group.id),
  }));

  console.log('Total scenarios:', scenarios.length);
  console.log('Ungrouped scenarios:', ungroupedScenarios.length);
  console.log('Grouped scenarios:', groupedScenarios);

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
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">テストシナリオ</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            テーブル、データ、モックAPIを統合管理
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => openGroupDialog()} size="sm">
            <FolderPlus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">グループ作成</span>
            <span className="sm:hidden">グループ</span>
          </Button>
          <label htmlFor="import-file">
            <Button variant="outline" asChild size="sm">
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
          <Button onClick={() => router.push('/scenarios/new')} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            新規作成
          </Button>
        </div>
      </div>

      {/* シナリオ一覧 */}
      {scenarios.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <FileJson className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              シナリオがまだありません
            </p>
            <Button onClick={() => router.push('/scenarios/new')}>
              <Plus className="h-4 w-4 mr-2" />
              最初のシナリオを作成
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* グループ化されたシナリオ */}
          {groupedScenarios.map(({ group, scenarios: groupScenarios }) => (
            <div key={group.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="flex items-center gap-2 hover:bg-muted p-2 rounded-md transition-colors flex-1"
                >
                  {expandedGroups.has(group.id) ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                  <Folder className="h-5 w-5 text-primary" />
                  <div className="text-left flex-1">
                    <h2 className="text-xl font-semibold">{group.name}</h2>
                    {group.description && (
                      <p className="text-sm text-muted-foreground">
                        {group.description}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary">{groupScenarios.length}件</Badge>
                </button>
                <div className="flex gap-1 ml-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openGroupDialog(group)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteGroup(group.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {expandedGroups.has(group.id) && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ml-8">
                  {groupScenarios.map((scenario) => (
                    <ScenarioCard
                      key={scenario.id}
                      scenario={scenario}
                      groups={groups}
                      onExport={handleExport}
                      onDelete={(id) => {
                        setScenarioToDelete(id);
                        setDeleteDialogOpen(true);
                      }}
                      onMoveToGroup={handleMoveToGroup}
                      router={router}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* グループ化されていないシナリオ */}
          {ungroupedScenarios.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FileJson className="h-5 w-5" />
                未分類
                <Badge variant="secondary">{ungroupedScenarios.length}件</Badge>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ungroupedScenarios.map((scenario) => (
                  <ScenarioCard
                    key={scenario.id}
                    scenario={scenario}
                    groups={groups}
                    onExport={handleExport}
                    onDelete={(id) => {
                      setScenarioToDelete(id);
                      setDeleteDialogOpen(true);
                    }}
                    onMoveToGroup={handleMoveToGroup}
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
              {editingGroup ? 'グループ編集' : 'グループ作成'}
            </DialogTitle>
            <DialogDescription>
              シナリオをグループ化して管理できます
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                グループ名
              </label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="例: ユーザーAPI"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                説明（任意）
              </label>
              <Textarea
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="グループの説明"
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

// シナリオカードコンポーネント
function ScenarioCard({
  scenario,
  groups,
  onExport,
  onDelete,
  onMoveToGroup,
  router,
}: {
  scenario: TestScenario;
  groups: ScenarioGroup[];
  onExport: (id: string) => void;
  onDelete: (id: string) => void;
  onMoveToGroup: (scenarioId: string, groupId: string | undefined) => void;
  router: any;
}) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-start justify-between">
          <span className="flex-1">{scenario.name}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
        </CardTitle>
        {scenario.description && (
          <CardDescription>{scenario.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* API情報 */}
        <div className="text-sm">
          <div className="font-medium text-muted-foreground mb-1">
            テスト対象API
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="shrink-0">
              {scenario.targetApi.method}
            </Badge>
            <code className="text-xs break-all">{scenario.targetApi.url}</code>
          </div>
        </div>

        {/* 統計情報 */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center p-2 bg-muted rounded">
            <div className="font-semibold">{scenario.tableData.length}</div>
            <div className="text-muted-foreground">テーブル</div>
          </div>
          <div className="text-center p-2 bg-muted rounded">
            <div className="font-semibold">
              {scenario.tableData.reduce((sum, t) => sum + t.rows.length, 0)}
            </div>
            <div className="text-muted-foreground">データ行</div>
          </div>
          <div className="text-center p-2 bg-muted rounded">
            <div className="font-semibold">{scenario.mockApis.length}</div>
            <div className="text-muted-foreground">モックAPI</div>
          </div>
        </div>

        {/* タグ */}
        {scenario.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {scenario.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* アクション */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/scenarios/${scenario.id}`)}
          >
            <Edit className="h-3 w-3 mr-1" />
            編集
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onExport(scenario.id)}
          >
            <Download className="h-3 w-3 mr-1" />
            Export
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(scenario.id)}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            削除
          </Button>
        </div>

        {/* 作成日時 */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          作成: {new Date(scenario.createdAt).toLocaleString('ja-JP')}
        </div>
      </CardContent>
    </Card>
  );
}
