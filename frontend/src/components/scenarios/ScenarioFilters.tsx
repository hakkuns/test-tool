import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Upload, FolderPlus, Search, X } from "lucide-react";
import type { ScenarioGroup } from "@/types/scenario";

interface ScenarioFiltersProps {
  searchText: string;
  onSearchTextChange: (text: string) => void;
  selectedGroupFilter: string | "all" | "ungrouped";
  onGroupFilterChange: (value: string) => void;
  groups: ScenarioGroup[];
  onCreateScenario: () => void;
  onCreateGroup: () => void;
  onImportScenario: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onImportGroup: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ScenarioFilters({
  searchText,
  onSearchTextChange,
  selectedGroupFilter,
  onGroupFilterChange,
  groups,
  onCreateScenario,
  onCreateGroup,
  onImportScenario,
  onImportGroup,
}: ScenarioFiltersProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="シナリオ名または説明で検索..."
          value={searchText}
          onChange={(e) => onSearchTextChange(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchText && (
          <button
            onClick={() => onSearchTextChange("")}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <Select value={selectedGroupFilter} onValueChange={onGroupFilterChange}>
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
            <DropdownMenuItem onClick={onCreateGroup}>
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
          onChange={onImportGroup}
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
          onChange={onImportScenario}
          className="hidden"
        />
        <Button onClick={onCreateScenario} size="default">
          <Plus className="h-4 w-4 mr-2" />
          新規作成
        </Button>
      </div>
    </div>
  );
}
