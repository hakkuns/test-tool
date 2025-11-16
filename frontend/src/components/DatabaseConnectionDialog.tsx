'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Database,
  Plus,
  Trash2,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getAllConnections,
  saveConnection,
  deleteConnection,
  setActiveConnection,
  useDefaultConnection,
} from '@/lib/dbConnection';
import type { DatabaseConnection } from '@/lib/db';
import { API_URL } from '@/lib/api';

interface DatabaseConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DatabaseConnectionDialog({
  open,
  onOpenChange,
}: DatabaseConnectionDialogProps) {
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // フォーム状態
  const [formData, setFormData] = useState({
    name: '',
    host: 'localhost',
    port: 5432,
    database: '',
    username: '',
    password: '',
    ssl: false,
  });

  // 接続一覧を読み込み
  const loadConnections = async () => {
    try {
      const conns = await getAllConnections();
      setConnections(conns);
    } catch (error) {
      console.error('Failed to load connections:', error);
      toast.error('接続情報の読み込みに失敗しました');
    }
  };

  useEffect(() => {
    if (open) {
      loadConnections();
      setIsAdding(false);
      setTestResult(null);
    }
  }, [open]);

  // フォームリセット
  const resetForm = () => {
    setFormData({
      name: '',
      host: 'localhost',
      port: 5432,
      database: '',
      username: '',
      password: '',
      ssl: false,
    });
    setTestResult(null);
  };

  // 接続テスト
  const handleTestConnection = async () => {
    if (!formData.host || !formData.database || !formData.username) {
      toast.error('ホスト、データベース名、ユーザー名は必須です');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(`${API_URL}/api/database/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: formData.host,
          port: formData.port,
          database: formData.database,
          user: formData.username,
          password: formData.password,
          ssl: formData.ssl,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setTestResult({
          success: true,
          message: '接続に成功しました',
        });
        toast.success('接続テストに成功しました');
      } else {
        setTestResult({
          success: false,
          message: result.error || '接続に失敗しました',
        });
        toast.error('接続テストに失敗しました');
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : '接続エラー',
      });
      toast.error('接続テストに失敗しました');
    } finally {
      setIsTesting(false);
    }
  };

  // 接続を保存
  const handleSaveConnection = async () => {
    if (
      !formData.name ||
      !formData.host ||
      !formData.database ||
      !formData.username
    ) {
      toast.error('名前、ホスト、データベース名、ユーザー名は必須です');
      return;
    }

    try {
      await saveConnection({
        ...formData,
        isActive: false,
      });

      toast.success('接続情報を保存しました');
      await loadConnections();
      setIsAdding(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save connection:', error);
      toast.error('接続情報の保存に失敗しました');
    }
  };

  // 接続を削除
  const handleDeleteConnection = async (id: number) => {
    if (!confirm('この接続情報を削除しますか？')) {
      return;
    }

    try {
      await deleteConnection(id);
      toast.success('接続情報を削除しました');
      await loadConnections();
    } catch (error) {
      console.error('Failed to delete connection:', error);
      toast.error('接続情報の削除に失敗しました');
    }
  };

  // 接続をアクティブに
  const handleSetActive = async (id: number) => {
    try {
      await setActiveConnection(id);
      toast.success('接続を切り替えました');
      await loadConnections();
    } catch (error) {
      console.error('Failed to set active connection:', error);
      toast.error('接続の切り替えに失敗しました');
    }
  };

  // デフォルト接続に戻す
  const handleUseDefault = async () => {
    try {
      await useDefaultConnection();
      toast.success('デフォルト接続に戻しました');
      await loadConnections();
    } catch (error) {
      console.error('Failed to use default connection:', error);
      toast.error('デフォルト接続への切り替えに失敗しました');
    }
  };

  const activeConnection = connections.find((c) => c.isActive);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            データベース接続設定
          </DialogTitle>
          <DialogDescription>
            PostgreSQLデータベースへの接続情報を管理します
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6 overflow-y-auto">
          <div className="space-y-4 pr-4 pb-4">
            {/* 現在の接続状態 */}
            <Card>
              <CardContent className="py-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">現在の接続</p>
                    {activeConnection && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleUseDefault}
                      >
                        デフォルトに戻す
                      </Button>
                    )}
                  </div>
                  {activeConnection ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="default">{activeConnection.name}</Badge>
                        <Badge variant="outline" className="text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          使用中
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div>
                          <span className="font-medium">ホスト:</span> {activeConnection.host}
                        </div>
                        <div>
                          <span className="font-medium">ポート:</span> {activeConnection.port}
                        </div>
                        <div>
                          <span className="font-medium">データベース:</span> {activeConnection.database}
                        </div>
                        <div>
                          <span className="font-medium">ユーザー:</span> {activeConnection.username}
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium">SSL:</span> {activeConnection.ssl ? '有効' : '無効'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm space-y-2">
                      <p className="text-muted-foreground">デフォルト接続（バックエンド設定）</p>
                      <p className="text-xs text-muted-foreground">
                        バックエンドの環境変数 DATABASE_URL で設定された接続を使用しています
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 保存済み接続一覧 */}
            {connections.length > 0 && (
              <div className="space-y-2">
                <Label>保存済み接続</Label>
                {connections.map((conn) => (
                  <Card
                    key={conn.id}
                    className={conn.isActive ? 'border-primary' : ''}
                  >
                    <CardContent className="py-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{conn.name}</p>
                            {conn.isActive && (
                              <Badge variant="default" className="text-xs">
                                <Check className="h-3 w-3 mr-1" />
                                使用中
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {conn.host}:{conn.port} / {conn.database}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            User: {conn.username}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {!conn.isActive && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSetActive(conn.id!)}
                            >
                              使用
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteConnection(conn.id!)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* 新規接続追加 */}
            {!isAdding ? (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsAdding(true)}
                  disabled
                >
                  <Plus className="h-4 w-4 mr-2" />
                  新しい接続を追加
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  この機能は開発中です
                </p>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="conn-name">接続名 *</Label>
                    <Input
                      id="conn-name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="例: 開発環境DB"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="conn-host">ホスト *</Label>
                      <Input
                        id="conn-host"
                        value={formData.host}
                        onChange={(e) =>
                          setFormData({ ...formData, host: e.target.value })
                        }
                        placeholder="localhost"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="conn-port">ポート *</Label>
                      <Input
                        id="conn-port"
                        type="number"
                        value={formData.port}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            port: Number.parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="conn-database">データベース名 *</Label>
                    <Input
                      id="conn-database"
                      value={formData.database}
                      onChange={(e) =>
                        setFormData({ ...formData, database: e.target.value })
                      }
                      placeholder="postgres"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="conn-username">ユーザー名 *</Label>
                    <Input
                      id="conn-username"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      placeholder="postgres"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="conn-password">パスワード</Label>
                    <Input
                      id="conn-password"
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="conn-ssl"
                      checked={formData.ssl}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, ssl: checked })
                      }
                    />
                    <Label htmlFor="conn-ssl">SSL接続を使用</Label>
                  </div>

                  {/* テスト結果 */}
                  {testResult && (
                    <div
                      className={`p-3 rounded-md flex items-start gap-2 ${
                        testResult.success
                          ? 'bg-green-50 text-green-900'
                          : 'bg-red-50 text-red-900'
                      }`}
                    >
                      {testResult.success ? (
                        <Check className="h-4 w-4 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-4 w-4 mt-0.5" />
                      )}
                      <p className="text-sm">{testResult.message}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleTestConnection}
                      disabled={isTesting}
                    >
                      {isTesting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          テスト中...
                        </>
                      ) : (
                        '接続テスト'
                      )}
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleSaveConnection}
                      disabled={isTesting}
                    >
                      保存
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setIsAdding(false);
                      resetForm();
                    }}
                  >
                    キャンセル
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            閉じる
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
