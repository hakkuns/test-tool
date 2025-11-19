'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { JsonEditor } from '@/components/ui/json-editor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, RefreshCw, Copy, Check } from 'lucide-react';
import { ConstantsTooltip } from '@/components/ui/constants-tooltip';
import type { TestScenario } from '@/types/scenario';
import {
  replaceConstantsInHeaders,
  replaceConstantsInObject,
} from '@/utils/constants';
import { toast } from 'sonner';

interface HeaderEntry {
  key: string;
  value: string;
}

interface RequestFormProps {
  onSubmit: (data: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
    timeout?: number;
  }) => Promise<void>;
  isLoading?: boolean;
  initialData?: TestScenario;
  originalScenario?: TestScenario;
}

export function RequestForm({
  onSubmit,
  isLoading,
  initialData,
  originalScenario,
}: RequestFormProps) {
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('http://localhost:8080/api/');
  const [headers, setHeaders] = useState<HeaderEntry[]>([
    { key: 'Content-Type', value: 'application/json' },
  ]);
  const [body, setBody] = useState('{\n  \n}');
  const [requestTimeout, setRequestTimeout] = useState('30000');
  const [copiedCurl, setCopiedCurl] = useState(false);

  // curlコマンドを生成
  const generateCurlCommand = () => {
    let curl = `curl -X ${method}`;
    
    // URL
    curl += ` '${url}'`;
    
    // ヘッダー
    for (const header of headers) {
      if (header.key && header.value) {
        curl += ` \\\n  -H '${header.key}: ${header.value}'`;
      }
    }
    
    // ボディ（GET/HEAD以外）
    if (method !== 'GET' && method !== 'HEAD' && body.trim()) {
      const escapedBody = body.replace(/'/g, "'\\''");
      curl += ` \\\n  -d '${escapedBody}'`;
    }
    
    return curl;
  };

  // curlコマンドをクリップボードにコピー
  const handleCopyCurl = async () => {
    try {
      const curlCommand = generateCurlCommand();
      await navigator.clipboard.writeText(curlCommand);
      setCopiedCurl(true);
      toast.success('curlコマンドをコピーしました');
      setTimeout(() => setCopiedCurl(false), 2000);
    } catch (err) {
      toast.error('コピーに失敗しました');
      console.error('Failed to copy:', err);
    }
  };

  // シナリオから初期値を設定
  useEffect(() => {
    if (initialData) {
      setMethod(initialData.targetApi.method);
      setUrl(initialData.targetApi.url);

      // testSettingsからヘッダーとボディを設定
      if (initialData.testSettings) {
        if (initialData.testSettings.headers) {
          const headerEntries = Object.entries(
            initialData.testSettings.headers
          ).map(([key, value]) => ({ key, value }));
          setHeaders(
            headerEntries.length > 0
              ? headerEntries
              : [{ key: 'Content-Type', value: 'application/json' }]
          );
        }
        if (initialData.testSettings.body) {
          setBody(initialData.testSettings.body);
        }
      } else {
        // testSettingsがない場合はデフォルト
        setHeaders([{ key: 'Content-Type', value: 'application/json' }]);
        setBody('{\n  \n}');
      }
    }
  }, [initialData]);

  const handleAddHeader = () => {
    setHeaders([...headers, { key: '', value: '' }]);
  };

  const handleRemoveHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const handleHeaderChange = (
    index: number,
    field: 'key' | 'value',
    value: string
  ) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = value;
    setHeaders(newHeaders);
  };

  const handleRefreshConstants = () => {
    // 元のシナリオから定数パターンを取得して再変換
    if (!originalScenario?.testSettings) {
      return;
    }

    // 元のヘッダーから定数を再変換
    if (originalScenario.testSettings.headers) {
      const originalHeaders = Object.entries(
        originalScenario.testSettings.headers
      ).map(([key, value]) => ({ key, value }));
      const convertedHeaders = replaceConstantsInHeaders(originalHeaders);
      setHeaders(convertedHeaders);
    }

    // 元のボディから定数を再変換
    if (originalScenario.testSettings.body) {
      try {
        const parsedBody = JSON.parse(originalScenario.testSettings.body);
        const convertedBodyObj = replaceConstantsInObject(parsedBody);
        setBody(JSON.stringify(convertedBodyObj, null, 2));
      } catch {
        // JSONでない場合はそのまま
        setBody(originalScenario.testSettings.body);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ヘッダーをオブジェクトに変換
    const headersObj: Record<string, string> = {};
    for (const header of headers) {
      if (header.key && header.value) {
        headersObj[header.key] = header.value;
      }
    }

    // ボディはGET/HEADでは送信しない
    const requestBody =
      method !== 'GET' && method !== 'HEAD' ? body : undefined;

    await onSubmit({
      method,
      url,
      headers: headersObj,
      body: requestBody,
      timeout: Number.parseInt(requestTimeout),
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>リクエスト設定</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyCurl}
              className="flex items-center gap-1"
              title="curlコマンドをコピー"
            >
              {copiedCurl ? (
                <>
                  <Check className="h-4 w-4" />
                  コピー済み
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  curl
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRefreshConstants}
              disabled={!originalScenario?.testSettings}
              className="flex items-center gap-1"
              title="定数を再変換（$TIMESTAMP等の値を更新）"
            >
              <RefreshCw className="h-4 w-4" />
              定数を再変換
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* メソッド & URL */}
          <div className="flex gap-2">
            <div className="w-40">
              <Label htmlFor="method" className="mb-2 block">
                メソッド
              </Label>
              <Select value={method} onValueChange={setMethod}>
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

            <div className="flex-1">
              <Label htmlFor="url" className="mb-2 block">
                URL
              </Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="http://localhost:8080/api/users"
                required
              />
            </div>
          </div>

          <Tabs defaultValue="headers">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="headers">ヘッダー</TabsTrigger>
              <TabsTrigger value="body">ボディ</TabsTrigger>
              <TabsTrigger value="settings">設定</TabsTrigger>
            </TabsList>

            {/* ヘッダータブ */}
            <TabsContent value="headers" className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Label>ヘッダー</Label>
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
                {headers.map((header, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="キー"
                      value={header.key}
                      onChange={(e) =>
                        handleHeaderChange(index, 'key', e.target.value)
                      }
                      className="flex-1"
                    />
                    <Input
                      placeholder="値"
                      value={header.value}
                      onChange={(e) =>
                        handleHeaderChange(index, 'value', e.target.value)
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
              {(method === 'GET' || method === 'HEAD') ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  {method} リクエストではボディを送信できません
                </p>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="body">リクエストボディ (JSON)</Label>
                      <ConstantsTooltip />
                    </div>
                    <JsonEditor
                      value={body}
                      onChange={(value) => setBody(value || '')}
                      height="256px"
                    />
                  </div>
                </>
              )}
            </TabsContent>

            {/* 設定タブ */}
            <TabsContent value="settings" className="space-y-2">
              <div className="space-y-2">
                <Label htmlFor="timeout">タイムアウト (ミリ秒)</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={requestTimeout}
                  onChange={(e) => setRequestTimeout(e.target.value)}
                  min="0"
                  max="300000"
                  step="1000"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  最大: 300000ms (5分)
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? '送信中...' : 'リクエストを送信'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
