"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Play, Loader2 } from "lucide-react";
import { proxyRequest } from "@/lib/api";
import { toast } from "sonner";

interface ApiTestSectionProps {
  targetApi: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: any;
  };
  isApplied: boolean;
  onApply: () => Promise<void>;
}

export function ApiTestSection({
  targetApi,
  isApplied,
  onApply,
}: ApiTestSectionProps) {
  const [isApplying, setIsApplying] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testBody, setTestBody] = useState(
    targetApi.body ? JSON.stringify(targetApi.body, null, 2) : "",
  );
  const [testHeaders, setTestHeaders] = useState(
    targetApi.headers ? JSON.stringify(targetApi.headers, null, 2) : "{}",
  );
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<any>(null);

  // GETやDELETEではボディを送信すべきではない
  const bodyAllowed = !["GET", "DELETE", "HEAD", "OPTIONS"].includes(
    targetApi.method.toUpperCase(),
  );

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await onApply();
    } finally {
      setIsApplying(false);
    }
  };

  const handleTest = async () => {
    if (!isApplied) {
      toast.error("先にシナリオを適用してください");
      return;
    }

    setIsTesting(true);
    setResponse(null);
    setError(null);

    try {
      let parsedBody: any = undefined;
      if (testBody.trim()) {
        try {
          parsedBody = JSON.parse(testBody);
        } catch {
          parsedBody = testBody;
        }
      }

      let parsedHeaders: Record<string, string> = {};
      if (testHeaders.trim()) {
        try {
          parsedHeaders = JSON.parse(testHeaders);
        } catch (e) {
          toast.error("ヘッダーのJSON形式が不正です");
          return;
        }
      }

      const result = await proxyRequest({
        method: targetApi.method,
        url: targetApi.url,
        headers: parsedHeaders,
        body: parsedBody,
      });

      if (result.success && result.response) {
        setResponse(result.response);
        toast.success("テストが成功しました");
      } else {
        // エラーレスポンスの詳細を含める
        const errorDetail = {
          ...result,
          requestUrl: targetApi.url,
          requestMethod: targetApi.method,
        };
        setError(errorDetail);
        toast.error(result.message || "テストが失敗しました");
      }
    } catch (err) {
      console.error("Test error:", err);
      const errorData = {
        error: "Request failed",
        message: err instanceof Error ? err.message : "Unknown error",
        requestUrl: targetApi.url,
        requestMethod: targetApi.method,
      };
      setError(errorData);
      toast.error("テストの実行に失敗しました");
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "text-green-600";
    if (status >= 300 && status < 400) return "text-blue-600";
    if (status >= 400 && status < 500) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              API テスト実行
              {isApplied ? (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  適用済み
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-gray-50 text-gray-700 border-gray-200"
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  未適用
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              シナリオを適用してからAPIテストを実行できます
            </CardDescription>
          </div>
          <Button
            onClick={handleApply}
            disabled={isApplying || isApplied}
            variant={isApplied ? "outline" : "default"}
          >
            {isApplying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                適用中...
              </>
            ) : isApplied ? (
              "適用済み"
            ) : (
              "シナリオを適用"
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* API情報 */}
        <div className="bg-muted p-4 rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <Badge>{targetApi.method}</Badge>
            <code className="text-sm">{targetApi.url}</code>
          </div>
        </div>

        {isApplied && (
          <>
            {/* リクエストボディ */}
            {bodyAllowed && (
              <div>
                <Label htmlFor="test-body">リクエストボディ (JSON)</Label>
                <Textarea
                  id="test-body"
                  value={testBody}
                  onChange={(e) => setTestBody(e.target.value)}
                  placeholder='{"key": "value"}'
                  rows={6}
                  className="font-mono text-sm mt-2"
                />
              </div>
            )}

            {/* ヘッダー */}
            <div>
              <Label htmlFor="test-headers">ヘッダー (JSON)</Label>
              <Textarea
                id="test-headers"
                value={testHeaders}
                onChange={(e) => setTestHeaders(e.target.value)}
                placeholder='{"Content-Type": "application/json"}'
                rows={3}
                className="font-mono text-sm mt-2"
              />
            </div>

            {/* テスト実行ボタン */}
            <Button
              onClick={handleTest}
              disabled={isTesting}
              className="w-full"
              size="lg"
            >
              {isTesting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  テスト実行中...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  テストを実行
                </>
              )}
            </Button>

            {/* レスポンス表示 */}
            {response && (
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">ステータス:</span>
                      <span
                        className={`font-bold ${getStatusColor(
                          response.status,
                        )}`}
                      >
                        {response.status}
                      </span>
                      <span className="text-muted-foreground text-sm ml-auto">
                        {response.duration}ms
                      </span>
                    </div>
                    {response.headers && (
                      <div>
                        <span className="font-semibold">ヘッダー:</span>
                        <pre className="mt-1 p-2 bg-white rounded text-xs overflow-auto max-h-32">
                          {JSON.stringify(response.headers, null, 2)}
                        </pre>
                      </div>
                    )}
                    {response.body && (
                      <div>
                        <span className="font-semibold">レスポンスボディ:</span>
                        <pre className="mt-1 p-2 bg-white rounded text-xs overflow-auto max-h-64">
                          {typeof response.body === "string"
                            ? response.body
                            : JSON.stringify(response.body, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* エラー表示 */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="font-semibold">エラー</div>
                    {error.requestUrl && (
                      <div className="text-sm">
                        <span className="font-semibold">リクエスト先: </span>
                        <span className="font-mono">
                          {error.requestMethod} {error.requestUrl}
                        </span>
                      </div>
                    )}
                    {error.error && <div>{error.error}</div>}
                    {error.message && (
                      <div className="text-sm mt-1">{error.message}</div>
                    )}
                    {error.error === "Network error" &&
                      error.requestUrl?.includes("localhost") && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                          <span className="font-semibold">💡 ヒント:</span>
                          <p className="mt-1">
                            dev container内から
                            <code className="bg-yellow-100 px-1 rounded">
                              localhost
                            </code>
                            にアクセスしようとしています。
                            バックエンドが自動的に
                            <code className="bg-yellow-100 px-1 rounded">
                              host.docker.internal
                            </code>
                            に変換を試みましたが、 接続に失敗しました。
                          </p>
                          <p className="mt-1">以下を確認してください：</p>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>テスト対象のAPIが起動しているか</li>
                            <li>ポート番号が正しいか</li>
                            <li>ファイアウォール設定</li>
                          </ul>
                        </div>
                      )}
                    {error.duration && (
                      <div className="text-sm text-muted-foreground">
                        所要時間: {error.duration}ms
                      </div>
                    )}
                    {error.response && (
                      <div className="mt-2">
                        <span className="font-semibold text-sm">詳細:</span>
                        <pre className="mt-1 p-2 bg-white/10 rounded text-xs overflow-auto max-h-32">
                          {JSON.stringify(error.response, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        {!isApplied && (
          <Alert>
            <AlertDescription>
              シナリオを適用すると、テーブル作成・データ投入・モックAPI設定が実行され、
              APIテストを実行できるようになります。
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
