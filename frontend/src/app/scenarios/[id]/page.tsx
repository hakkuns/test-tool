'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { ArrowLeft, Save, Play, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScenarioTablesEditor } from '@/components/scenarios/ScenarioTablesEditor';
import { ScenarioDataEditor } from '@/components/scenarios/ScenarioDataEditor';
import { ScenarioMocksEditor } from '@/components/scenarios/ScenarioMocksEditor';
import { TestSettingsEditor } from '@/components/scenarios/TestSettingsEditor';
import { scenariosApi } from '@/lib/api/scenarios';
import type {
  TestScenario,
  UpdateScenarioInput,
  DDLTable,
  TableData,
  MockEndpoint,
} from '@/types/scenario';
import { toast } from 'sonner';

export default function ScenarioDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);

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

  // Load scenario
  useEffect(() => {
    if (!id) return;

    const loadScenario = async () => {
      setIsLoading(true);
      try {
        const data = await scenariosApi.getById(id);
        setName(data.name);
        setDescription(data.description || '');
        setTags(data.tags || []);
        setTargetApiMethod(data.targetApi.method);
        setTargetApiUrl(data.targetApi.url || '');
        setTargetApiHeaders(data.targetApi.headers || {});
        setTargetApiBody(data.targetApi.body);
        setTables(data.tables || []);
        setTableData(data.tableData || []);
        setMockApis(data.mockApis || []);
        setTestHeaders(data.testSettings?.headers || {});
        setTestBody(data.testSettings?.body || '');

        // 適用状態を確認
        const appliedScenarioId = localStorage.getItem('appliedScenarioId');
        setIsApplied(appliedScenarioId === id);

        // 初期データのロード完了をマーク
        setInitialDataLoaded(true);
      } catch (error) {
        console.error('Failed to load scenario:', error);
        toast.error('シナリオが見つかりません');
        // シナリオが見つからない場合はホームに戻る
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    loadScenario();
  }, [id]);

  // フォームの変更を監視
  useEffect(() => {
    // 初期データのロードが完了してから変更を監視
    if (initialDataLoaded && !isLoading) {
      console.log('Change detected, setting hasUnsavedChanges to true');
      setHasUnsavedChanges(true);
    }
  }, [
    initialDataLoaded,
    isLoading,
    name,
    description,
    tags,
    targetApiMethod,
    targetApiUrl,
    targetApiHeaders,
    targetApiBody,
    tables,
    tableData,
    mockApis,
    testHeaders,
    testBody,
  ]);

  // ページ離脱時の警告
  useEffect(() => {
    console.log('hasUnsavedChanges:', hasUnsavedChanges);

    // ブラウザのページ離脱時の警告
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        console.log('Preventing unload');
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // リンククリックをインターセプト
    const handleClick = (e: MouseEvent) => {
      if (!hasUnsavedChanges) return;

      const target = e.target as HTMLElement;
      const link = target.closest('a');

      if (link && link.href && !link.href.includes(`/scenarios/${id}`)) {
        if (!confirm('変更が保存されていません。このページを離れますか？')) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    document.addEventListener('click', handleClick, true);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleClick, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUnsavedChanges, id]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
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
      const update: UpdateScenarioInput = {
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

      await scenariosApi.update(id, update);
      setHasUnsavedChanges(false);
      setIsUpdated(true);
      toast.success('シナリオを更新しました');
    } catch (error) {
      console.error('Failed to update scenario:', error);
      toast.error('シナリオの更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApply = async () => {
    if (
      !confirm(
        'このシナリオを適用しますか？\nテーブル作成・データ投入・モックAPI設定が実行されます。'
      )
    ) {
      return;
    }

    setIsApplying(true);
    try {
      const result = await scenariosApi.apply(id);

      // 適用成功後、LocalStorageに保存
      localStorage.setItem('appliedScenarioId', id);
      setIsApplied(true);

      toast.success(
        `シナリオを適用しました\nテーブル: ${result.tablesCreated}個\nデータ: ${result.dataInserted}行\nモックAPI: ${result.mocksConfigured}個`
      );
    } catch (error) {
      console.error('Failed to apply scenario:', error);
      toast.error(
        error instanceof Error ? error.message : 'シナリオの適用に失敗しました'
      );
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          戻る
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">シナリオを編集</h1>
              {isApplied && (
                <Badge className="bg-green-500 hover:bg-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  適用中
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-2">
              テストシナリオの設定を変更します
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleApply}
              disabled={isApplying}
            >
              <Play className="h-4 w-4 mr-2" />
              {isApplying ? '適用中...' : 'シナリオを適用'}
            </Button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本情報 */}
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">シナリオ名 *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="ユーザー登録テスト"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">説明</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="このシナリオの概要を入力..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
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
              <div className="space-y-2">
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
              <div className="col-span-3 space-y-2">
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
        <div className="flex gap-4 justify-end mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (
                hasUnsavedChanges &&
                !confirm('変更が保存されていません。このページを離れますか？')
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
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? '更新中...' : '更新'}
          </Button>
          {isUpdated && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/api-test')}
            >
              API Test
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
