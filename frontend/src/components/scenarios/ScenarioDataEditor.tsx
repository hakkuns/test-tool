'use client';

import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, FileText } from 'lucide-react';
import type { TableData } from '@/types/scenario';
import { toast } from 'sonner';
import { getDatabaseTables, getTableSchema } from '@/lib/api';

interface ScenarioDataEditorProps {
  tableData: TableData[];
  availableTables: string[];
  onChange: (data: TableData[]) => void;
}

export function ScenarioDataEditor({
  tableData,
  availableTables,
  onChange,
}: ScenarioDataEditorProps) {
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [dbTables, setDbTables] = useState<string[]>([]);
  const [columnInfo, setColumnInfo] = useState<
    Record<string, { isNullable: boolean; dataType: string }>
  >({});

  // コンポーネントマウント時にデータベースからテーブル一覧を取得
  useEffect(() => {
    const loadDatabaseTables = async () => {
      try {
        const result = await getDatabaseTables();
        const tableNames = result.tables.map((t) => t.table_name);
        setDbTables(tableNames);
      } catch (error) {
        console.error('Failed to load tables:', error);
        // データベース接続エラーの場合は警告のみ表示
        // シナリオ作成は続行可能
      }
    };
    loadDatabaseTables();
  }, []);

  // DDLテーブルとDBテーブルをマージ
  const allTables = Array.from(new Set([...availableTables, ...dbTables]));

  // 選択されたテーブルのデータを読み込む
  useEffect(() => {
    const loadTableData = async () => {
      if (selectedTable) {
        const data = tableData.find((d) => d.tableName === selectedTable);
        if (data && data.rows.length > 0) {
          // 既存データがある場合、そのカラムを使用
          const cols = Object.keys(data.rows[0]);
          setColumns(cols);
          setRows(data.rows);

          // スキーマ情報も取得
          try {
            const schema = await getTableSchema(selectedTable);
            const colInfo: Record<
              string,
              { isNullable: boolean; dataType: string }
            > = {};
            schema.columns.forEach((col) => {
              colInfo[col.column_name] = {
                isNullable: col.is_nullable === 'YES',
                dataType: col.data_type,
              };
            });
            setColumnInfo(colInfo);
          } catch (error) {
            console.error('Failed to load schema:', error);
            setColumnInfo({});
          }
        } else {
          // データがない場合、データベースからスキーマを取得
          try {
            const schema = await getTableSchema(selectedTable);
            const cols = schema.columns.map((c) => c.column_name);
            const colInfo: Record<
              string,
              { isNullable: boolean; dataType: string }
            > = {};
            schema.columns.forEach((col) => {
              colInfo[col.column_name] = {
                isNullable: col.is_nullable === 'YES',
                dataType: col.data_type,
              };
            });
            setColumns(cols);
            setRows([]);
            setColumnInfo(colInfo);
          } catch (error) {
            console.error('Failed to load schema:', error);
            // スキーマ取得に失敗した場合は空にする
            setColumns([]);
            setRows([]);
            setColumnInfo({});
          }
        }
      } else {
        setColumns([]);
        setRows([]);
        setColumnInfo({});
      }
    };
    loadTableData();
  }, [selectedTable, tableData]);

  const handleTableSelect = (table: string) => {
    setSelectedTable(table);
  };

  const handleAddRow = () => {
    const newRow: Record<string, any> = {};
    columns.forEach((col) => {
      newRow[col] = '';
    });
    setRows([...rows, newRow]);
  };

  const handleRemoveRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleCellChange = (
    rowIndex: number,
    colName: string,
    value: string
  ) => {
    const newRows = [...rows];
    newRows[rowIndex] = { ...newRows[rowIndex], [colName]: value };
    setRows(newRows);
  };

  const handleSave = () => {
    if (!selectedTable) {
      toast.error('テーブルを選択してください');
      return;
    }

    if (columns.length === 0) {
      toast.error('カラムを追加してください');
      return;
    }

    const newData: TableData = {
      tableName: selectedTable,
      rows,
    };

    const existingIndex = tableData.findIndex(
      (d) => d.tableName === selectedTable
    );
    if (existingIndex >= 0) {
      const updated = [...tableData];
      updated[existingIndex] = newData;
      onChange(updated);
    } else {
      onChange([...tableData, newData]);
    }

    toast.success('テーブルデータを保存しました');
  };

  const handleRemoveTableData = (tableName: string) => {
    onChange(tableData.filter((d) => d.tableName !== tableName));
    if (selectedTable === tableName) {
      setSelectedTable('');
    }
    toast.success('テーブルデータを削除しました');
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
          toast.success('テーブルデータをインポートしました');
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
          <div className="space-y-1.5">
            <CardTitle>テーブルデータ</CardTitle>
            <CardDescription>各テーブルに挿入するデータを設定</CardDescription>
          </div>
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
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* データを持つテーブル一覧 */}
        {tableData.length > 0 && (
          <div className="space-y-2">
            <Label>設定済みテーブル</Label>
            <div className="flex flex-wrap gap-2">
              {tableData.map((data) => (
                <div
                  key={data.tableName}
                  className="flex items-center gap-2 px-3 py-1 bg-secondary rounded-md"
                >
                  <span className="font-mono text-sm">{data.tableName}</span>
                  <span className="text-xs text-muted-foreground">
                    ({data.rows.length} 行)
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0"
                    onClick={() => handleRemoveTableData(data.tableName)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* テーブル選択 */}
        <div className="space-y-2">
          <Label htmlFor="table-select">テーブル選択</Label>
          <Select value={selectedTable} onValueChange={handleTableSelect}>
            <SelectTrigger id="table-select">
              <SelectValue placeholder="テーブルを選択..." />
            </SelectTrigger>
            <SelectContent>
              {allTables.length === 0 && (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  テーブルが見つかりません
                </div>
              )}
              {allTables.map((table) => (
                <SelectItem key={table} value={table}>
                  {table}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* データ編集エリア */}
        {selectedTable && (
          <div className="space-y-4 border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{selectedTable} のデータ</h3>
              <Button type="button" size="sm" onClick={handleAddRow}>
                <Plus className="h-4 w-4 mr-2" />
                行を追加
              </Button>
            </div>

            {/* データ行 */}
            {columns.length > 0 && (
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((col, index) => (
                        <TableHead
                          key={index}
                          className="min-w-[150px] whitespace-nowrap"
                        >
                          {col}
                          {columnInfo[col] && !columnInfo[col].isNullable && (
                            <span className="text-red-500 ml-1" title="必須">
                              *
                            </span>
                          )}
                        </TableHead>
                      ))}
                      <TableHead className="w-20 sticky right-0 bg-background">
                        操作
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {columns.map((col, colIndex) => {
                          const colMeta = columnInfo[col];
                          const dataType =
                            colMeta?.dataType?.toLowerCase() || '';

                          // データ型に応じた入力フィールドを選択
                          if (dataType.includes('bool')) {
                            // Boolean型
                            return (
                              <TableCell
                                key={colIndex}
                                className="min-w-[150px]"
                              >
                                <Select
                                  value={row[col]?.toString() || 'null'}
                                  onValueChange={(value) =>
                                    handleCellChange(
                                      rowIndex,
                                      col,
                                      value === 'null' ? '' : value
                                    )
                                  }
                                >
                                  <SelectTrigger className="h-8 min-w-[140px]">
                                    <SelectValue placeholder="選択..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="true">true</SelectItem>
                                    <SelectItem value="false">false</SelectItem>
                                    {colMeta?.isNullable && (
                                      <SelectItem value="null">NULL</SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            );
                          } else if (
                            dataType.includes('int') ||
                            dataType.includes('numeric') ||
                            dataType.includes('decimal') ||
                            dataType.includes('float') ||
                            dataType.includes('double') ||
                            dataType.includes('real')
                          ) {
                            // 数値型
                            return (
                              <TableCell
                                key={colIndex}
                                className="min-w-[150px]"
                              >
                                <Input
                                  type="number"
                                  value={row[col] ?? ''}
                                  onChange={(e) =>
                                    handleCellChange(
                                      rowIndex,
                                      col,
                                      e.target.value
                                    )
                                  }
                                  className="h-8 min-w-[140px]"
                                  placeholder={
                                    colMeta && !colMeta.isNullable ? '必須' : ''
                                  }
                                />
                              </TableCell>
                            );
                          } else if (
                            dataType.includes('date') ||
                            dataType.includes('timestamp')
                          ) {
                            // 日付型
                            return (
                              <TableCell
                                key={colIndex}
                                className="min-w-[150px]"
                              >
                                <Input
                                  type={
                                    dataType.includes('timestamp')
                                      ? 'datetime-local'
                                      : 'date'
                                  }
                                  value={row[col] ?? ''}
                                  onChange={(e) =>
                                    handleCellChange(
                                      rowIndex,
                                      col,
                                      e.target.value
                                    )
                                  }
                                  className="h-8 min-w-[140px]"
                                  placeholder={
                                    colMeta && !colMeta.isNullable ? '必須' : ''
                                  }
                                />
                              </TableCell>
                            );
                          } else {
                            // 文字列型（デフォルト）
                            return (
                              <TableCell
                                key={colIndex}
                                className="min-w-[150px]"
                              >
                                <Input
                                  type="text"
                                  value={row[col] ?? ''}
                                  onChange={(e) =>
                                    handleCellChange(
                                      rowIndex,
                                      col,
                                      e.target.value
                                    )
                                  }
                                  className="h-8 min-w-[140px]"
                                  placeholder={
                                    colMeta && !colMeta.isNullable ? '必須' : ''
                                  }
                                />
                              </TableCell>
                            );
                          }
                        })}
                        <TableCell className="sticky right-0 bg-background">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveRow(rowIndex)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {columns.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                カラムを追加してください
              </div>
            )}

            <div className="flex justify-end">
              <Button type="button" onClick={handleSave}>
                保存
              </Button>
            </div>
          </div>
        )}

        {!selectedTable && availableTables.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            先にテーブル定義を追加してください
          </div>
        )}

        {!selectedTable && availableTables.length > 0 && (
          <div className="text-center py-8 text-muted-foreground">
            テーブルを選択してデータを編集
          </div>
        )}
      </CardContent>
    </Card>
  );
}
