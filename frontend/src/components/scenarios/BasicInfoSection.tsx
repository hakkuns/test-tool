import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface BasicInfoSectionProps {
  name: string;
  description: string;
  tags: string[];
  tagInput: string;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onTagInputChange: (input: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
}

export function BasicInfoSection({
  name,
  description,
  tags,
  tagInput,
  onNameChange,
  onDescriptionChange,
  onTagInputChange,
  onAddTag,
  onRemoveTag,
}: BasicInfoSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>基本情報</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">シナリオ名 * ({name.length}/100)</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            required
            maxLength={100}
            placeholder="ユーザー登録テスト"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">説明 ({description.length}/500)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="このシナリオの概要を入力..."
            rows={3}
            maxLength={500}
          />
        </div>
        <div className="space-y-2">
          <Label>タグ</Label>
          <div className="flex gap-2 mb-2">
            <Input
              value={tagInput}
              onChange={(e) => onTagInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onAddTag();
                }
              }}
              placeholder="タグを入力してEnter"
            />
            <Button type="button" variant="outline" onClick={onAddTag}>
              追加
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-secondary rounded-md text-sm cursor-pointer"
                onClick={() => onRemoveTag(tag)}
              >
                {tag} ×
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
