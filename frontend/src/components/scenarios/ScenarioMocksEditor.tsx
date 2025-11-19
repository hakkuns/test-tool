"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { JsonEditor } from "@/components/ui/json-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, FileText, Edit } from "lucide-react";
import { ConstantsTooltip } from "@/components/ui/constants-tooltip";
import type { MockEndpoint } from "@/types/scenario";
import { toast } from "sonner";

interface HeaderEntry {
  key: string;
  value: string;
}

interface ScenarioMocksEditorProps {
  mocks: MockEndpoint[];
  onChange: (mocks: MockEndpoint[]) => void;
}

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

const HTTP_METHODS: HttpMethod[] = ["GET", "POST", "PUT", "DELETE", "PATCH"];

export function ScenarioMocksEditor({
  mocks,
  onChange,
}: ScenarioMocksEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentMock, setCurrentMock] = useState<Partial<MockEndpoint>>({
    id: "",
    name: "",
    enabled: true,
    priority: 0,
    path: "",
    method: "GET",
    response: {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: null,
    },
    createdAt: "",
    updatedAt: "",
  });
  const [headerEntries, setHeaderEntries] = useState<HeaderEntry[]>([
    { key: "Content-Type", value: "application/json" },
  ]);
  const [bodyText, setBodyText] = useState("");

  // currentMockが変更されたときにheaderEntriesとbodyTextを更新
  useEffect(() => {
    if (currentMock.response?.headers) {
      const entries = Object.entries(currentMock.response.headers).map(
        ([key, value]) => ({
          key,
          value,
        }),
      );
      setHeaderEntries(
        entries.length > 0
          ? entries
          : [{ key: "Content-Type", value: "application/json" }],
      );
    }

    if (currentMock.response?.body) {
      setBodyText(
        typeof currentMock.response.body === "string"
          ? currentMock.response.body
          : JSON.stringify(currentMock.response.body, null, 2),
      );
    } else {
      setBodyText("");
    }
  }, [currentMock]);

  const handleAddHeader = () => {
    setHeaderEntries([...headerEntries, { key: "", value: "" }]);
  };

  const handleRemoveHeader = (index: number) => {
    const newEntries = headerEntries.filter((_, i) => i !== index);
    setHeaderEntries(newEntries);
  };

  const handleHeaderChange = (
    index: number,
    field: "key" | "value",
    value: string,
  ) => {
    const newEntries = [...headerEntries];
    newEntries[index][field] = value;
    setHeaderEntries(newEntries);
  };

  const handleAdd = () => {
    setIsEditing(true);
    setEditingIndex(null);
    setHeaderEntries([{ key: "Content-Type", value: "application/json" }]);
    setBodyText("");
    setCurrentMock({
      id: "",
      name: "",
      enabled: true,
      priority: 0,
      path: "",
      method: "GET",
      response: {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: null,
      },
      createdAt: "",
      updatedAt: "",
    });
  };

  const handleEdit = (index: number) => {
    setIsEditing(true);
    setEditingIndex(index);
    const mock = mocks[index];
    setCurrentMock(mock);
    // useEffectで自動的にheaderEntriesとbodyTextが更新される
  };

  const handleSave = () => {
    if (!currentMock.path) {
      toast.error("パスを入力してください");
      return;
    }

    if (!currentMock.method) {
      toast.error("HTTPメソッドを選択してください");
      return;
    }

    // headerEntriesからheadersオブジェクトを構築
    const parsedHeaders: Record<string, string> = {};
    for (const entry of headerEntries) {
      if (entry.key && entry.value) {
        parsedHeaders[entry.key] = entry.value;
      }
    }

    // bodyTextをパース
    let parsedBody = null;
    if (bodyText.trim()) {
      try {
        parsedBody = JSON.parse(bodyText);
      } catch {
        parsedBody = bodyText;
      }
    }

    // 定数を変換（保存時ではなく実行時に変換されることを示すため、ここでは変換しない）
    // 実際の変換はシナリオ実行時に行われる

    const now = new Date().toISOString();
    const mock: MockEndpoint = {
      id:
        currentMock.id ||
        `mock_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      name: currentMock.name || currentMock.path,
      enabled: currentMock.enabled ?? true,
      priority: currentMock.priority || 0,
      path: currentMock.path,
      method: currentMock.method,
      response: {
        status: currentMock.response?.status || 200,
        headers: parsedHeaders,
        body: parsedBody,
      },
      createdAt: currentMock.createdAt || now,
      updatedAt: now,
    };

    if (editingIndex !== null) {
      const updated = [...mocks];
      updated[editingIndex] = mock;
      onChange(updated);
      toast.success("モックAPIを更新しました");
    } else {
      onChange([...mocks, mock]);
      toast.success("モックAPIを追加しました");
    }

    setIsEditing(false);
    setEditingIndex(null);
    setCurrentMock({
      id: "",
      name: "",
      enabled: true,
      priority: 0,
      path: "",
      method: "GET",
      response: {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: null,
      },
      createdAt: "",
      updatedAt: "",
    });
  };

  const handleRemove = (index: number) => {
    onChange(mocks.filter((_, i) => i !== index));
    toast.success("モックAPIを削除しました");
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingIndex(null);
    setHeaderEntries([{ key: "Content-Type", value: "application/json" }]);
    setBodyText("");
    setCurrentMock({
      id: "",
      name: "",
      enabled: true,
      priority: 0,
      path: "",
      method: "GET",
      response: {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: null,
      },
      createdAt: "",
      updatedAt: "",
    });
  };

  const handleImportJSON = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (Array.isArray(data)) {
          onChange(data);
          toast.success("モックAPIをインポートしました");
        } else {
          toast.error("無効なJSON形式です");
        }
      } catch (error) {
        toast.error("JSONの読み込みに失敗しました");
      }
    };
    input.click();
  };

  const getMethodBadgeColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-blue-500";
      case "POST":
        return "bg-green-500";
      case "PUT":
        return "bg-yellow-500";
      case "DELETE":
        return "bg-red-500";
      case "PATCH":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <CardTitle>モックAPI</CardTitle>
            <CardDescription>外部APIのモック応答を設定</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleImportJSON}
              disabled
            >
              <FileText className="h-4 w-4 mr-2" />
              JSON
            </Button>
            <Button type="button" size="sm" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              追加
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* モックAPI一覧 */}
        {mocks.length > 0 && !isEditing ? (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名前</TableHead>
                  <TableHead>メソッド</TableHead>
                  <TableHead>パス</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>レスポンス</TableHead>
                  <TableHead className="w-24">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mocks.map((mock, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {mock.name ? (
                        <span className="font-medium">{mock.name}</span>
                      ) : (
                        <span className="text-muted-foreground italic">
                          未設定
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getMethodBadgeColor(mock.method)}>
                        {mock.method}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{mock.path}</TableCell>
                    <TableCell>{mock.response.status}</TableCell>
                    <TableCell>
                      <div className="font-mono text-xs text-muted-foreground max-w-md truncate">
                        {mock.response.body
                          ? JSON.stringify(mock.response.body).slice(0, 50) +
                            "..."
                          : "なし"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(index)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : !isEditing ? (
          <div className="text-center py-8 text-muted-foreground">
            モックAPIが追加されていません
          </div>
        ) : null}

        {/* 編集フォーム */}
        {isEditing && (
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="text-lg">
                {editingIndex !== null
                  ? "モックAPIを編集"
                  : "新しいモックAPIを追加"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mock-name">名前</Label>
                <Input
                  id="mock-name"
                  value={currentMock.name || ""}
                  onChange={(e) =>
                    setCurrentMock({ ...currentMock, name: e.target.value })
                  }
                  placeholder="ユーザー一覧取得"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mock-method">HTTPメソッド *</Label>
                  <Select
                    value={currentMock.method}
                    onValueChange={(value: HttpMethod) =>
                      setCurrentMock({ ...currentMock, method: value })
                    }
                  >
                    <SelectTrigger id="mock-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HTTP_METHODS.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mock-status">ステータスコード *</Label>
                  <Input
                    id="mock-status"
                    type="number"
                    value={currentMock.response?.status || 200}
                    onChange={(e) =>
                      setCurrentMock({
                        ...currentMock,
                        response: {
                          ...currentMock.response,
                          status: parseInt(e.target.value) || 200,
                          headers: currentMock.response?.headers || {},
                          body: currentMock.response?.body || null,
                        },
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mock-path">パス *</Label>
                <Input
                  id="mock-path"
                  value={currentMock.path || ""}
                  onChange={(e) =>
                    setCurrentMock({ ...currentMock, path: e.target.value })
                  }
                  placeholder="/api/users"
                />
              </div>

              {/* ヘッダー / ボディ タブ */}
              <Tabs defaultValue="headers">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="headers">ヘッダー</TabsTrigger>
                  <TabsTrigger value="body">ボディ</TabsTrigger>
                </TabsList>

                {/* ヘッダータブ */}
                <TabsContent value="headers" className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Label>レスポンスヘッダー</Label>
                      <ConstantsTooltip />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddHeader}
                      className="flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      追加
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto p-0.5">
                    {headerEntries.map((header, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="キー"
                          value={header.key}
                          onChange={(e) =>
                            handleHeaderChange(index, "key", e.target.value)
                          }
                          className="flex-1"
                        />
                        <Input
                          placeholder="値"
                          value={header.value}
                          onChange={(e) =>
                            handleHeaderChange(index, "value", e.target.value)
                          }
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveHeader(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* ボディタブ */}
                <TabsContent value="body" className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="mock-body">レスポンスボディ (JSON)</Label>
                      <ConstantsTooltip />
                    </div>
                    <JsonEditor
                      value={bodyText}
                      onChange={(value) => setBodyText(value || "")}
                      height="256px"
                    />
                  </div>
                </TabsContent>
              </Tabs>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  キャンセル
                </Button>
                <Button type="button" onClick={handleSave}>
                  {editingIndex !== null ? "更新" : "追加"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
