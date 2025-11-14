'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, FileText } from 'lucide-react';
import type { DDLTable } from '@/types/scenario';
import { toast } from 'sonner';

interface ScenarioTablesEditorProps {
  tables: DDLTable[];
  onChange: (tables: DDLTable[]) => void;
}

export function ScenarioTablesEditor({
  tables,
  onChange,
}: ScenarioTablesEditorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTable, setNewTable] = useState<Partial<DDLTable>>({
    name: '',
    ddl: '',
    dependencies: [],
    order: 0,
  });

  const handleAdd = () => {
    if (!newTable.name || !newTable.ddl) {
      toast.error('テーブル名とDDLを入力してください');
      return;
    }

    const table: DDLTable = {
      name: newTable.name,
      ddl: newTable.ddl,
      dependencies: newTable.dependencies || [],
      order: tables.length,
    };

    onChange([...tables, table]);
    setNewTable({ name: '', ddl: '', dependencies: [], order: 0 });
    setIsAdding(false);
    toast.success('テーブルを追加しました');
  };

  const handleRemove = (index: number) => {
    onChange(tables.filter((_, i) => i !== index));
    toast.success('テーブルを削除しました');
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
        if (Array.isArray(data)) {
          onChange(data);
          toast.success('テーブル定義をインポートしました');
        } else {
          toast.error('無効なJSON形式です');
        }
      } catch (error) {
        toast.error('JSONの読み込みに失敗しました');
      }
    };
    input.click();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>テーブル定義</CardTitle>
            <CardDescription>シナリオに必要なテーブルを追加</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleImportJSON}
            >
              <FileText className="h-4 w-4 mr-2" />
              JSON
            </Button>
            <Button type="button" size="sm" onClick={() => setIsAdding(true)}>
              <Plus className="h-4 w-4 mr-2" />
              追加
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* テーブル一覧 */}
        {tables.length > 0 ? (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>テーブル名</TableHead>
                  <TableHead>DDL (抜粋)</TableHead>
                  <TableHead>依存</TableHead>
                  <TableHead className="w-20">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tables.map((table, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono font-medium">
                      {table.name}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground max-w-md truncate">
                      {table.ddl}
                    </TableCell>
                    <TableCell>
                      {table.dependencies.length > 0 ? (
                        <span className="text-xs text-muted-foreground">
                          {table.dependencies.join(', ')}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          なし
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            テーブルが追加されていません
          </div>
        )}

        {/* 追加フォーム */}
        {isAdding && (
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="text-lg">新しいテーブルを追加</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="table-name">テーブル名 *</Label>
                <Input
                  id="table-name"
                  value={newTable.name || ''}
                  onChange={(e) =>
                    setNewTable({ ...newTable, name: e.target.value })
                  }
                  placeholder="users"
                />
              </div>
              <div>
                <Label htmlFor="table-ddl">DDL (CREATE TABLE文) *</Label>
                <Textarea
                  id="table-ddl"
                  value={newTable.ddl || ''}
                  onChange={(e) =>
                    setNewTable({ ...newTable, ddl: e.target.value })
                  }
                  placeholder="CREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(100), ...);"
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
              <div>
                <Label htmlFor="table-deps">依存テーブル (カンマ区切り)</Label>
                <Input
                  id="table-deps"
                  value={newTable.dependencies?.join(', ') || ''}
                  onChange={(e) =>
                    setNewTable({
                      ...newTable,
                      dependencies: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="departments, roles"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAdding(false);
                    setNewTable({
                      name: '',
                      ddl: '',
                      dependencies: [],
                      order: 0,
                    });
                  }}
                >
                  キャンセル
                </Button>
                <Button type="button" onClick={handleAdd}>
                  追加
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
