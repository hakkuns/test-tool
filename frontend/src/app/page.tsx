import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  TestTube,
  FlaskConical,
  Database,
  FileJson,
  Settings,
} from 'lucide-react';

export default function Home() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">PostgreSQL Test Helper</h1>
        <p className="text-lg text-muted-foreground">
          Spring Boot + PostgreSQL アプリケーションのテストを支援するツール
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        <Card className="border-primary border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-6 w-6" />
              テストシナリオ
            </CardTitle>
            <CardDescription>
              テーブル定義・データ・モックAPIを統合管理してテストシナリオを作成
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Database className="h-4 w-4" />
              <span>テーブル定義（DDL）</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileJson className="h-4 w-4" />
              <span>テストデータ</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Settings className="h-4 w-4" />
              <span>モックAPI設定</span>
            </div>
            <Link href="/scenarios">
              <Button className="w-full mt-4" size="lg">
                シナリオ管理を開く
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-6 w-6" />
              API テスト
            </CardTitle>
            <CardDescription>
              Spring Boot APIのテスト実行とリクエスト履歴管理
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/api-test">
              <Button className="w-full" variant="outline" size="lg">
                APIテストを開く
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-sm text-muted-foreground max-w-2xl mx-auto">
        <p>
          💡 <strong>ヒント:</strong>{' '}
          シナリオ機能では、テーブル定義・テストデータ・モックAPIを一括管理できます。
          個別の設定もGUIとJSONの両方でインポート可能です。
        </p>
      </div>
    </div>
  );
}
