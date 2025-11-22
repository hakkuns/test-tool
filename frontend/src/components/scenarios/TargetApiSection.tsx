import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface TargetApiSectionProps {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";
  url: string;
  onMethodChange: (method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS") => void;
  onUrlChange: (url: string) => void;
}

export function TargetApiSection({
  method,
  url,
  onMethodChange,
  onUrlChange,
}: TargetApiSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>対象API</CardTitle>
        <CardDescription>
          このシナリオでテストする対象のAPIエンドポイント
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <div className="space-y-2 w-40">
            <Label htmlFor="targetApiMethod">HTTPメソッド *</Label>
            <Select
              value={method}
              onValueChange={(value) =>
                onMethodChange(value as typeof method)
              }
            >
              <SelectTrigger id="targetApiMethod">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
                <SelectItem value="HEAD">HEAD</SelectItem>
                <SelectItem value="OPTIONS">OPTIONS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 space-y-2">
            <Label htmlFor="targetApiUrl">URL *</Label>
            <Input
              id="targetApiUrl"
              value={url}
              onChange={(e) => onUrlChange(e.target.value)}
              required
              placeholder="http://localhost:8080/api/users"
            />
            <p className="text-xs text-muted-foreground mt-1">
              完全なURL（http://またはhttps://から始まる）を入力してください。
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
