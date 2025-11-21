import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Edit,
  Download,
  Trash2,
  MoreVertical,
  Table,
  Rows,
  Network,
  Star,
  StarOff,
  CircleCheck,
  CircleX,
  CircleHelp,
  Copy,
} from "lucide-react";
import type { TestScenario, ScenarioGroup } from "@/types/scenario";

interface ScenarioCardProps {
  scenario: TestScenario;
  groups: ScenarioGroup[];
  onToggleFavorite: (id: string) => void;
  onUpdateTestResult: (
    id: string,
    result: "success" | "failure" | "unknown"
  ) => void;
  onExport: (id: string) => void;
  onCopy: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onMoveToGroup: (scenarioId: string, groupId: string | undefined) => void;
  onEdit: (id: string) => void;
}

export function ScenarioCard({
  scenario,
  groups,
  onToggleFavorite,
  onUpdateTestResult,
  onExport,
  onCopy,
  onDelete,
  onMoveToGroup,
  onEdit,
}: ScenarioCardProps) {
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
            <CardTitle
              className="truncate text-lg font-semibold"
              title={scenario.name}
            >
              {scenario.name}
            </CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 flex-shrink-0"
              >
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
          <CardDescription
            className="line-clamp-2 break-words mt-1.5"
            title={scenario.description}
          >
            {scenario.description}
          </CardDescription>
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
            onClick={() => onEdit(scenario.id)}
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
