'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScenarioTablesEditor } from '@/components/scenarios/ScenarioTablesEditor';
import { ScenarioDataEditor } from '@/components/scenarios/ScenarioDataEditor';
import { ScenarioMocksEditor } from '@/components/scenarios/ScenarioMocksEditor';
import { TestSettingsEditor } from '@/components/scenarios/TestSettingsEditor';
import { scenariosApi } from '@/lib/api/scenarios';
import { FileJson, Upload } from 'lucide-react';
import type {
  CreateScenarioInput,
  DDLTable,
  TableData,
  MockEndpoint,
} from '@/types/scenario';
import { toast } from 'sonner';

export default function NewScenarioPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Basic info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Target API
  const [targetApiPath, setTargetApiPath] = useState('');
  const [targetApiMethod, setTargetApiMethod] = useState<
    'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'
  >('GET');
  const [targetApiUrl, setTargetApiUrl] = useState('');
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
  const [testBody, setTestBody] = useState('');

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleImportJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        // シナリオ全体のインポート
        if (data.name) setName(data.name);
        if (data.description) setDescription(data.description);
        if (data.tags) setTags(data.tags);
        if (data.targetApi) {
          if (data.targetApi.method) setTargetApiMethod(data.targetApi.method);
          if (data.targetApi.url) setTargetApiUrl(data.targetApi.url);
          if (data.targetApi.headers)
            setTargetApiHeaders(data.targetApi.headers);
          if (data.targetApi.body) setTargetApiBody(data.targetApi.body);
        }
        if (data.tables) setTables(data.tables);
        if (data.tableData) setTableData(data.tableData);
        if (data.mockApis) setMockApis(data.mockApis);
        if (data.testSettings) {
          setTestHeaders(data.testSettings.headers || {});
          setTestBody(data.testSettings.body || '');
        }

        toast.success('シナリオをインポートしました');
      } catch (error) {
        console.error('Import error:', error);
        toast.error('JSONの読み込みに失敗しました');
      }
    };
    input.click();
  };

  const handleExportJSON = () => {
    const data: Omit<CreateScenarioInput, 'id' | 'createdAt' | 'updatedAt'> = {
      name,
      description: description || undefined,
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

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scenario-${name || 'new'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('シナリオをエクスポートしました');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('シナリオ名を入力してください');
      return;
    }

    if (!targetApiUrl.trim()) {
      toast.error('対象APIのURLを入力してください');
      return;
    }

    setIsSubmitting(true);

    try {
      const scenario: CreateScenarioInput = {
        name,
        description: description || undefined,
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

      await scenariosApi.create(scenario);
      toast.success('シナリオを作成しました');
      router.push('/scenarios');
    } catch (error) {
      console.error('Failed to create scenario:', error);
      toast.error('シナリオの作成に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">新しいシナリオを作成</h1>
          <p className="text-muted-foreground mt-2">
            テストシナリオを作成し、API、テーブル、データ、モックを設定します
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={handleImportJSON}>
            <Upload className="h-4 w-4 mr-2" />
            JSON インポート
          </Button>
          <Button type="button" variant="outline" onClick={handleExportJSON}>
            <FileJson className="h-4 w-4 mr-2" />
            JSON エクスポート
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本情報 */}
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">シナリオ名 *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="ユーザー登録テスト"
              />
            </div>
            <div>
              <Label htmlFor="description">説明</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="このシナリオの概要を入力..."
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
                    if (e.key === 'Enter') {
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
            <div className="grid grid-cols-4 gap-4">
              <div>
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
              <div className="col-span-3">
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
                  dev
                  container内から外部APIにアクセスする場合、localhostではなくhost.docker.internalを使用してください。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* テスト設定 */}
        <TestSettingsEditor
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

        {/* アクション */}
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '作成中...' : '作成'}
          </Button>
        </div>
      </form>
    </div>
  );
}
