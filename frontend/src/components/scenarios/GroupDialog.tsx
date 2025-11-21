import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ScenarioGroup } from "@/types/scenario";

interface GroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingGroup: ScenarioGroup | null;
  onSave: (name: string, description: string) => void;
}

export function GroupDialog({
  open,
  onOpenChange,
  editingGroup,
  onSave,
}: GroupDialogProps) {
  // editingGroupから直接値を取得（制御コンポーネント）
  const groupName = editingGroup?.name || "";
  const groupDescription = editingGroup?.description || "";

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    onSave(name, description);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingGroup ? "グループ編集" : "グループ作成"}
          </DialogTitle>
          <DialogDescription>
            シナリオをグループ化して管理できます
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave}>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                グループ名 ({groupName.length}/100)
              </label>
              <Input
                name="name"
                defaultValue={groupName}
                placeholder="例: ユーザーAPI"
                maxLength={100}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                説明（任意） ({groupDescription.length}/500)
              </label>
              <Textarea
                name="description"
                defaultValue={groupDescription}
                placeholder="グループの説明"
                maxLength={500}
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              キャンセル
            </Button>
            <Button type="submit">保存</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
