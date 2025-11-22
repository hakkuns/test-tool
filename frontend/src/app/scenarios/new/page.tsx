"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScenarioTablesEditor } from "@/components/scenarios/ScenarioTablesEditor";
import { ScenarioDataEditor } from "@/components/scenarios/ScenarioDataEditor";
import { ScenarioMocksEditor } from "@/components/scenarios/ScenarioMocksEditor";
import { TestSettingsEditor } from "@/components/scenarios/TestSettingsEditor";
import { scenariosApi, groupsApi } from "@/lib/api/scenarios";
import type {
  CreateScenarioInput,
  DDLTable,
  TableData,
  MockEndpoint,
  ScenarioGroup,
} from "@/types/scenario";
import { toast } from "sonner";

export default function NewScenarioPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [groups, setGroups] = useState<ScenarioGroup[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isCreated, setIsCreated] = useState(false);
  const [createdScenarioId, setCreatedScenarioId] = useState<string>("");

  // Basic info
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [groupId, setGroupId] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Target API
  const [targetApiPath, setTargetApiPath] = useState("");
  const [targetApiMethod, setTargetApiMethod] = useState<
    "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS"
  >("GET");
  const [targetApiUrl, setTargetApiUrl] = useState("");
  const [targetApiHeaders, setTargetApiHeaders] = useState<
    Record<string, string>
  >({});
  const [targetApiBody, setTargetApiBody] = useState<any>();

  // Tables, data, mocks
  const [tables, setTables] = useState<DDLTable[]>([]);
  const [tableData, setTableData] = useState<TableData[]>([]);
  const [mockApis, setMockApis] = useState<MockEndpoint[]>([]);

  // Test settings
  const [testHeaders, setTestHeaders] = useState<Record<string, string>>({});
  const [testBody, setTestBody] = useState("");

  // グループ一覧を取得
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const data = await groupsApi.getAll();
        setGroups(data);
      } catch (error) {
        console.error("Failed to fetch groups:", error);
      }
    };
    fetchGroups();
  }, []);

  // フォームの変更を監視
  useEffect(() => {
    const hasData = Boolean(
      name.trim() ||
        description.trim() ||
        tags.length > 0 ||
        targetApiUrl.trim() ||
        tables.length > 0 ||
        tableData.length > 0 ||
        mockApis.length > 0,
    );
    setHasUnsavedChanges(hasData);
  }, [name, description, tags, targetApiUrl, tables, tableData, mockApis]);

  // ページ離脱時の警告
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    // リンククリックをインターセプト
    const handleClick = (e: MouseEvent) => {
      if (!hasUnsavedChanges) return;

      const target = e.target as HTMLElement;
      const link = target.closest("a");

      if (link && link.href && !link.href.includes("/scenarios/new")) {
        if (!confirm("変更が保存されていません。このページを離れますか？")) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    document.addEventListener("click", handleClick, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleClick, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUnsavedChanges]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("シナリオ名を入力してください");
      return;
    }

    if (!targetApiUrl.trim()) {
      toast.error("対象APIのURLを入力してください");
      return;
    }

    setIsSubmitting(true);

    try {
      const scenario: CreateScenarioInput = {
        name,
        description: description || undefined,
        groupId: groupId || undefined,
        targetApi: {
          method: targetApiMethod,
          url: targetApiUrl,
          headers:
            Object.keys(targetApiHeaders).length > 0
              ? targetApiHeaders
              : undefined,
          body: targetApiBody,
        },
        tables,
        tableData,
        mockApis,
        testSettings:
          Object.keys(testHeaders).length > 0 || testBody
            ? {
                headers:
                  Object.keys(testHeaders).length > 0 ? testHeaders : undefined,
                body: testBody || undefined,
              }
            : undefined,
        tags,
      };

      const result = await scenariosApi.create(scenario);
      setHasUnsavedChanges(false);
      setIsCreated(true);
      setCreatedScenarioId(result.id);

      // React Queryのキャッシュを無効化して、APIテストページで最新のシナリオ一覧を取得できるようにする
      await queryClient.invalidateQueries({ queryKey: ["scenarios"] });

      toast.success("シナリオを作成しました");
    } catch (error) {
      console.error("Failed to create scenario:", error);
      toast.error("シナリオの作成に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* アクションボタン - 上部 */}
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (
                hasUnsavedChanges &&
                !confirm("変更が保存されていません。このページを離れますか？")
              ) {
                return;
              }
              router.back();
            }}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "作成中..." : "作成"}
          </Button>
          {isCreated && createdScenarioId && (
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                router.push(`/api-test?scenario=${createdScenarioId}`)
              }
            >
              APIテスト
            </Button>
          )}
        </div>

        {/* 基本情報 */}
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
                onChange={(e) => setName(e.target.value)}
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
                onChange={(e) => setDescription(e.target.value)}
                placeholder="このシナリオの概要を入力..."
                rows={3}
                maxLength={500}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group">グループ</Label>
              <Select
                value={groupId || "none"}
                onValueChange={(value) =>
                  setGroupId(value === "none" ? "" : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="グループを選択（任意）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">なし（未分類）</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>タグ</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="タグを入力してEnter"
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  追加
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-secondary rounded-md text-sm cursor-pointer"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag} ×
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 対象API */}
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
                  value={targetApiMethod}
                  onValueChange={(value) =>
                    setTargetApiMethod(value as typeof targetApiMethod)
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
                  value={targetApiUrl}
                  onChange={(e) => setTargetApiUrl(e.target.value)}
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

        {/* テスト設定 */}
        <TestSettingsEditor
          method={targetApiMethod}
          headers={testHeaders}
          body={testBody}
          onHeadersChange={setTestHeaders}
          onBodyChange={setTestBody}
        />

        {/* テーブル定義 */}
        <ScenarioTablesEditor tables={tables} onChange={setTables} />

        {/* テーブルデータ */}
        <ScenarioDataEditor
          tableData={tableData}
          availableTables={tables.map((t) => t.name)}
          onChange={setTableData}
        />

        {/* モックAPI */}
        <ScenarioMocksEditor mocks={mockApis} onChange={setMockApis} />
      </form>
    </div>
  );
}
