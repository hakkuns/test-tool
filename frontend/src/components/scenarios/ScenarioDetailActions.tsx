import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

interface ScenarioDetailActionsProps {
  isSubmitting: boolean;
  isUpdated: boolean;
  scenarioId: string;
  onCancel: () => void | Promise<void>;
  onApiTest: () => void;
}

export function ScenarioDetailActions({
  isSubmitting,
  isUpdated,
  scenarioId,
  onCancel,
  onApiTest,
}: ScenarioDetailActionsProps) {
  return (
    <div className="flex gap-4 justify-end mt-8">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isSubmitting}
      >
        キャンセル
      </Button>
      <Button type="submit" disabled={isSubmitting}>
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
  );
}
