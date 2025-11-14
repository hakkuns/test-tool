import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, FileJson, Settings, TestTube } from "lucide-react";

export default function Home() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">PostgreSQL Test Helper</h1>
        <p className="text-lg text-muted-foreground">
          Spring Boot + PostgreSQL アプリケーションのテストを支援するツール
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              テーブル管理
            </CardTitle>
            <CardDescription>
              DDLを解析してテーブル定義を管理
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/tables">
              <Button className="w-full">テーブル管理を開く</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileJson className="h-5 w-5" />
              データ入力
            </CardTitle>
            <CardDescription>
              テストデータの作成と管理
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/data">
              <Button className="w-full">データ入力を開く</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              モック API
            </CardTitle>
            <CardDescription>
              外部APIのモック設定
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/mock">
              <Button className="w-full">モックAPIを開く</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              API テスト
            </CardTitle>
            <CardDescription>
              Spring Boot APIのテスト実行
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/api-test">
              <Button className="w-full">APIテストを開く</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
