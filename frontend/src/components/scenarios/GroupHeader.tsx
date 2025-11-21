import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  Download,
  Edit,
  Trash2,
} from "lucide-react";
import type { ScenarioGroup } from "@/types/scenario";

interface GroupHeaderProps {
  group: ScenarioGroup;
  isExpanded: boolean;
  scenarioCount: number;
  onToggle: () => void;
  onExport: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function GroupHeader({
  group,
  isExpanded,
  scenarioCount,
  onToggle,
  onExport,
  onEdit,
  onDelete,
}: GroupHeaderProps) {
  return (
    <div className="flex items-center hover:bg-muted/50 p-1.5 rounded-lg transition-colors">
      <button onClick={onToggle} className="flex items-center gap-2">
        {isExpanded ? (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        )}
        <Folder className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">{group.name}</h2>
        <Badge variant="secondary" className="text-xs ml-1">
          {scenarioCount}件
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
          onClick={onExport}
          className="h-8 w-8 p-0"
          title="グループをエクスポート"
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onEdit}
          className="h-8 w-8 p-0"
          title="グループを編集"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDelete}
          className="h-8 w-8 p-0"
          title="グループを削除"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
