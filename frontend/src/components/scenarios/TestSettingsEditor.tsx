'use client';

import { useState, useEffect, useRef } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2 } from 'lucide-react';

interface HeaderEntry {
  key: string;
  value: string;
}

interface TestSettingsEditorProps {
  headers: Record<string, string>;
  body: string;
  onHeadersChange: (headers: Record<string, string>) => void;
  onBodyChange: (body: string) => void;
}

export function TestSettingsEditor({
  headers,
  body,
  onHeadersChange,
  onBodyChange,
}: TestSettingsEditorProps) {
  const [headerEntries, setHeaderEntries] = useState<HeaderEntry[]>(() => {
    const entries = Object.entries(headers).map(([key, value]) => ({
      key,
      value,
    }));
    return entries.length > 0 ? entries : [{ key: '', value: '' }];
  });

  const isInternalUpdateRef = useRef(false);

  // headers プロップが外部から変更された場合のみ更新
  useEffect(() => {
    // 内部更新の場合はスキップ
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      return;
    }

    const entries = Object.entries(headers).map(([key, value]) => ({
      key,
      value,
    }));
    setHeaderEntries(entries.length > 0 ? entries : [{ key: '', value: '' }]);
  }, [headers]);

  const handleAddHeader = () => {
    setHeaderEntries([...headerEntries, { key: '', value: '' }]);
  };

  const handleRemoveHeader = (index: number) => {
    const newEntries = headerEntries.filter((_, i) => i !== index);
    setHeaderEntries(newEntries);
    updateHeaders(newEntries);
  };

  const handleHeaderChange = (
    index: number,
    field: 'key' | 'value',
    value: string
  ) => {
    const newEntries = [...headerEntries];
    newEntries[index][field] = value;
    setHeaderEntries(newEntries);
    updateHeaders(newEntries);
  };

  const updateHeaders = (entries: HeaderEntry[]) => {
    const headersObj: Record<string, string> = {};
    for (const entry of entries) {
      if (entry.key && entry.value) {
        headersObj[entry.key] = entry.value;
      }
    }
    isInternalUpdateRef.current = true;
    onHeadersChange(headersObj);
  };

  return (
    <Card>
      <CardHeader className="space-y-1.5">
        <CardTitle>テスト設定</CardTitle>
        <CardDescription>
          API実行時に追加で送信するヘッダーやボディを設定
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="headers">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="headers">Headers</TabsTrigger>
            <TabsTrigger value="body">Body</TabsTrigger>
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
              {headerEntries.map((header, index) => (
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
          <TabsContent value="body" className="space-y-2">
            <div className="space-y-2">
              <Label htmlFor="testBody">Request Body</Label>
              <Textarea
                id="testBody"
                value={body}
                onChange={(e) => onBodyChange(e.target.value)}
                placeholder={`{
  "name": "test",
  "email": "test@example.com"
}`}
                rows={12}
                className="font-mono text-sm"
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
