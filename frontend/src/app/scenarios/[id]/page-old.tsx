"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Plus, X, Play } from "lucide-react";
import { scenariosApi } from "@/lib/api/scenarios";
import type {
  TestScenario,
  UpdateScenarioInput,
  ApiTestConfig,
} from "@/types/scenario";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ScenarioDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [scenario, setScenario] = useState<TestScenario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // フォーム状態
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // API設定
  const [apiMethod, setApiMethod] = useState<ApiTestConfig["method"]>("GET");
  const [apiUrl, setApiUrl] = useState("");
  const [apiHeaders, setApiHeaders] = useState("{}");
  const [apiBody, setApiBody] = useState("{}");

  // テーブル定義（JSON形式）
  const [tablesJson, setTablesJson] = useState("[]");

  // テーブルデータ（JSON形式）
  const [tableDataJson, setTableDataJson] = useState("[]");

  // モックAPI（JSON形式）
  const [mockApisJson, setMockApisJson] = useState("[]");

  // 期待レスポンス
  const [expectedStatus, setExpectedStatus] = useState("");
  const [expectedBody, setExpectedBody] = useState("{}");

  // シナリオデータを取得
  useEffect(() => {
    const fetchScenario = async () => {
      try {
        setIsLoading(true);
        const data = await scenariosApi.getById(id);
        setScenario(data);

        // フォームに値をセット
        setName(data.name);
        setDescription(data.description || "");
        setTags(data.tags);
        setApiMethod(data.targetApi.method);
        setApiUrl(data.targetApi.url);
        setApiHeaders(JSON.stringify(data.targetApi.headers || {}, null, 2));
        setApiBody(JSON.stringify(data.targetApi.body || {}, null, 2));
        setTablesJson(JSON.stringify(data.tables, null, 2));
        setTableDataJson(JSON.stringify(data.tableData, null, 2));
        setMockApisJson(JSON.stringify(data.mockApis, null, 2));
        setExpectedStatus(data.expectedResponse?.status?.toString() || "");
        setExpectedBody(
          JSON.stringify(data.expectedResponse?.body || {}, null, 2),
        );
      } catch (error) {
        toast.error("シナリオの取得に失敗しました");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchScenario();
    }
  }, [id]);

  // タグ追加
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  // タグ削除
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  // 保存
  const handleSave = async () => {
    try {
      setIsSaving(true);

      // バリデーション
      if (!name.trim()) {
        toast.error("シナリオ名を入力してください");
        return;
      }
      if (!apiUrl.trim()) {
        toast.error("APIのURLを入力してください");
        return;
      }

      // JSON パース
      const tables = JSON.parse(tablesJson);
      const tableData = JSON.parse(tableDataJson);
      const mockApis = JSON.parse(mockApisJson);
      const headers = JSON.parse(apiHeaders);
      const body = apiBody.trim() ? JSON.parse(apiBody) : undefined;
      const expectedResponseBody = expectedBody.trim()
        ? JSON.parse(expectedBody)
        : undefined;

      const input: UpdateScenarioInput = {
        name: name.trim(),
        description: description.trim() || undefined,
        targetApi: {
          method: apiMethod,
          url: apiUrl.trim(),
          headers: Object.keys(headers).length > 0 ? headers : undefined,
          body,
        },
        tables,
        tableData,
        mockApis,
        expectedResponse:
          expectedStatus || expectedResponseBody
            ? {
                status: expectedStatus ? Number(expectedStatus) : undefined,
                body: expectedResponseBody,
              }
            : undefined,
        tags,
      };

      await scenariosApi.update(id, input);
      toast.success("シナリオを更新しました");
    } catch (error) {
      toast.error("シナリオの更新に失敗しました");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  // シナリオ適用
  const handleApply = async () => {
    if (
      !confirm(
        `シナリオ "${name}" を適用しますか？\n既存のテーブルとモックAPIに影響します。`,
      )
    ) {
      return;
    }

    try {
      setIsApplying(true);
      const result = await scenariosApi.apply(id);
      toast.success(
        `シナリオを適用しました\nテーブル: ${result.tablesCreated}個\nデータ: ${result.dataInserted}行\nモックAPI: ${result.mocksConfigured}個`,
      );
    } catch (error) {
      toast.error("シナリオの適用に失敗しました");
      console.error(error);
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">シナリオが見つかりません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
          <h1 className="text-3xl font-bold">シナリオ編集</h1>
          <p className="text-muted-foreground text-sm mt-1">
            作成日時: {new Date(scenario.createdAt).toLocaleString("ja-JP")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleApply} disabled={isApplying}>
            <Play className="h-4 w-4 mr-2" />
            {isApplying ? "適用中..." : "適用"}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>

      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
          <CardDescription>シナリオの名前と説明</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">シナリオ名 *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: ユーザー登録_正常系"
            />
          </div>
          <div>
            <Label htmlFor="description">説明</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="このシナリオの説明を入力..."
              rows={3}
            />
          </div>
          <div>
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
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => handleRemoveTag(tag)}
                >
                  {tag}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* テスト対象API */}
      <Card>
        <CardHeader>
          <CardTitle>テスト対象API</CardTitle>
          <CardDescription>テストするAPIのエンドポイント設定</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label htmlFor="method">メソッド *</Label>
              <Select
                value={apiMethod}
                onValueChange={(value) =>
                  setApiMethod(value as ApiTestConfig["method"])
                }
              >
                <SelectTrigger id="method">
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
            <div className="col-span-3">
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="http://localhost:8080/api/users"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="headers">ヘッダー (JSON)</Label>
            <Textarea
              id="headers"
              value={apiHeaders}
              onChange={(e) => setApiHeaders(e.target.value)}
              placeholder='{"Content-Type": "application/json"}'
              rows={3}
              className="font-mono text-sm"
            />
          </div>
          <div>
            <Label htmlFor="body">ボディ (JSON)</Label>
            <Textarea
              id="body"
              value={apiBody}
              onChange={(e) => setApiBody(e.target.value)}
              placeholder='{"name": "Test User", "email": "test@example.com"}'
              rows={5}
              className="font-mono text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* データ設定 */}
      <Card>
        <CardHeader>
          <CardTitle>データ設定</CardTitle>
          <CardDescription>
            テーブル定義、データ、モックAPIをJSON形式で指定
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="tables">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tables">テーブル定義</TabsTrigger>
              <TabsTrigger value="data">テーブルデータ</TabsTrigger>
              <TabsTrigger value="mocks">モックAPI</TabsTrigger>
            </TabsList>
            <TabsContent value="tables" className="space-y-2">
              <Label>テーブル定義 (JSON配列)</Label>
              <Textarea
                value={tablesJson}
                onChange={(e) => setTablesJson(e.target.value)}
                placeholder='[{"name": "users", "ddl": "CREATE TABLE users (...)", "dependencies": [], "order": 0}]'
                rows={10}
                className="font-mono text-sm"
              />
            </TabsContent>
            <TabsContent value="data" className="space-y-2">
              <Label>テーブルデータ (JSON配列)</Label>
              <Textarea
                value={tableDataJson}
                onChange={(e) => setTableDataJson(e.target.value)}
                placeholder='[{"tableName": "users", "rows": [{"id": 1, "name": "Test"}], "truncateBefore": true}]'
                rows={10}
                className="font-mono text-sm"
              />
            </TabsContent>
            <TabsContent value="mocks" className="space-y-2">
              <Label>モックAPI (JSON配列)</Label>
              <Textarea
                value={mockApisJson}
                onChange={(e) => setMockApisJson(e.target.value)}
                placeholder='[{"id": "mock1", "method": "POST", "path": "/api/email", "enabled": true, "priority": 0, "response": {"status": 200, "body": {}}, "createdAt": "", "updatedAt": ""}]'
                rows={10}
                className="font-mono text-sm"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 期待レスポンス */}
      <Card>
        <CardHeader>
          <CardTitle>期待レスポンス（オプション）</CardTitle>
          <CardDescription>テスト実行時の期待される結果</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="expectedStatus">ステータスコード</Label>
            <Input
              id="expectedStatus"
              type="number"
              value={expectedStatus}
              onChange={(e) => setExpectedStatus(e.target.value)}
              placeholder="200"
            />
          </div>
          <div>
            <Label htmlFor="expectedBody">レスポンスボディ (JSON)</Label>
            <Textarea
              id="expectedBody"
              value={expectedBody}
              onChange={(e) => setExpectedBody(e.target.value)}
              placeholder='{"success": true}'
              rows={5}
              className="font-mono text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* 保存ボタン */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={handleApply}
          disabled={isApplying}
          size="lg"
        >
          <Play className="h-4 w-4 mr-2" />
          {isApplying ? "適用中..." : "シナリオを適用"}
        </Button>
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "保存中..." : "変更を保存"}
        </Button>
      </div>
    </div>
  );
}
