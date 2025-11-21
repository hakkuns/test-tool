import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileJson, Search, Plus } from "lucide-react";

type EmptyStateProps =
  | {
      type: "no-scenarios";
      onCreateScenario: () => void;
    }
  | {
      type: "no-results";
      onClearFilters: () => void;
    };

export function EmptyState(props: EmptyStateProps) {
  if (props.type === "no-scenarios") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <FileJson className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            シナリオがまだありません
          </p>
          <Button onClick={props.onCreateScenario}>
            <Plus className="h-4 w-4 mr-2" />
            最初のシナリオを作成
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center h-64">
        <Search className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">
          条件に一致するシナリオが見つかりませんでした
        </p>
        <Button variant="outline" onClick={props.onClearFilters}>
          検索条件をクリア
        </Button>
      </CardContent>
    </Card>
  );
}
