import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, CheckCircle2 } from "lucide-react";

interface ScenarioDetailHeaderProps {
  isApplied: boolean;
  isSubmitting: boolean;
  isUpdated: boolean;
  hasUnsavedChanges: boolean;
  scenarioId: string;
  onBack: () => void | Promise<void>;
  onCancel: () => void | Promise<void>;
  onApiTest: () => void;
}

export function ScenarioDetailHeader({
  isApplied,
  isSubmitting,
  isUpdated,
  hasUnsavedChanges,
  scenarioId,
  onBack,
  onCancel,
  onApiTest,
}: ScenarioDetailHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          戻る
        </Button>
        {isApplied && (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            適用中
          </Badge>
        )}
      </div>
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          キャンセル
        </Button>
        <Button type="submit" form="scenario-edit-form" disabled={isSubmitting}>
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? "更新中..." : "更新"}
        </Button>
        {isUpdated && (
          <Button
            type="button"
            variant="secondary"
            onClick={onApiTest}
          >
            APIテスト
          </Button>
        )}
      </div>
    </div>
  );
}
