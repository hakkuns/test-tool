'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Database, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TableListProps {
  tables: string[];
}

export function TableList({ tables }: TableListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableData, setTableData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (tables.length === 0) {
    return null;
  }

  const fetchTableData = async (tableName: string) => {
    setIsLoading(true);
    setSelectedTable(tableName);
    setIsDialogOpen(true);

    try {
      const response = await fetch(`${API_URL}/api/database/data/${tableName}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }
      const result = await response.json();
      setTableData(result.data);
    } catch (error) {
      console.error('Error fetching table data:', error);
      toast.error('データの取得に失敗しました');
      setIsDialogOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedTable('');
    setTableData(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>作成済みテーブル</span>
            <Badge variant="secondary">{tables.length}件</Badge>
          </CardTitle>
          <CardDescription>現在データベースに存在するテーブル</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {tables.map((tableName) => (
              <div
                key={tableName}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <Database className="h-4 w-4 text-muted-foreground" />
                <code className="flex-1 text-sm font-mono">{tableName}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchTableData(tableName)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  データ表示
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>テーブルデータ: {selectedTable}</DialogTitle>
            <DialogDescription>
              {tableData
                ? `${tableData.rows?.length || 0}行のデータ`
                : 'データを読み込み中...'}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] w-full">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : tableData ? (
              <pre className="text-xs font-mono bg-muted p-4 rounded-lg overflow-x-auto">
                {JSON.stringify(tableData, null, 2)}
              </pre>
            ) : null}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
