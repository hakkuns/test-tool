'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2 } from 'lucide-react';
import type { TestScenario } from '@/types/scenario';

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
}

export function RequestForm({
  onSubmit,
  isLoading,
  initialData,
}: RequestFormProps) {
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('http://localhost:8080/api/');
  const [headers, setHeaders] = useState<HeaderEntry[]>([
    { key: 'Content-Type', value: 'application/json' },
  ]);
  const [body, setBody] = useState('{\n  \n}');
  const [timeout, setTimeout] = useState('30000');

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
      timeout: Number.parseInt(timeout),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>リクエスト設定</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Method & URL */}
          <div className="flex gap-2">
            <div className="w-32">
              <Label htmlFor="method">Method</Label>
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
              <Label htmlFor="url">URL</Label>
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
              <TabsTrigger value="headers">Headers</TabsTrigger>
              <TabsTrigger value="body">Body</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Headers Tab */}
            <TabsContent value="headers" className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Headers</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddHeader}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {headers.map((header, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Key"
                      value={header.key}
                      onChange={(e) =>
                        handleHeaderChange(index, 'key', e.target.value)
                      }
                      className="flex-1"
                    />
                    <Input
                      placeholder="Value"
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

            {/* Body Tab */}
            <TabsContent value="body">
              <div>
                <Label htmlFor="body">Request Body (JSON)</Label>
                <Textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder='{"key": "value"}'
                  className="font-mono text-sm h-64"
                  disabled={method === 'GET' || method === 'HEAD'}
                />
                {(method === 'GET' || method === 'HEAD') && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {method} リクエストではボディを送信できません
                  </p>
                )}
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <div>
                <Label htmlFor="timeout">Timeout (ms)</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={timeout}
                  onChange={(e) => setTimeout(e.target.value)}
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
            {isLoading ? 'Sending...' : 'Send Request'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
