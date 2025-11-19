"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Copy, Check, FileJson, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ResponseViewerProps {
  response: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: any;
    duration: number;
    timestamp: string;
  } | null;
  error?: {
    error: string;
    message: string;
    duration: number;
    timestamp: string;
  } | null;
  isLoading?: boolean;
}

export function ResponseViewer({
  response,
  error,
  isLoading,
}: ResponseViewerProps) {
  const [copiedBody, setCopiedBody] = useState(false);
  const [copiedHeaders, setCopiedHeaders] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="absolute inset-0 h-12 w-12 animate-ping opacity-20">
              <Loader2 className="h-12 w-12 text-primary" />
            </div>
          </div>
          <p className="text-center text-muted-foreground font-medium">
            リクエストを送信中...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!response && !error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center min-h-[400px]">
          <p className="text-center text-muted-foreground">
            リクエストを送信するとレスポンスがここに表示されます
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>エラーレスポンス</CardTitle>
            <Badge variant="destructive">{error.error}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-1">エラーメッセージ:</p>
            <div className="bg-destructive/15 text-destructive p-3 rounded">
              {error.message}
            </div>
          </div>

          <div className="flex gap-4 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">実行時間:</span> {error.duration}ms
            </div>
            <div>
              <span className="font-medium">時刻:</span>{" "}
              {new Date(error.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!response) return null;

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "bg-green-500";
    if (status >= 300 && status < 400) return "bg-blue-500";
    if (status >= 400 && status < 500) return "bg-yellow-500";
    return "bg-red-500";
  };

  const formatBody = (body: any) => {
    if (typeof body === "string") {
      try {
        return JSON.stringify(JSON.parse(body), null, 2);
      } catch {
        return body;
      }
    }
    return JSON.stringify(body, null, 2);
  };

  const handleCopyBody = async () => {
    try {
      const formattedBody = formatBody(response.body);
      await navigator.clipboard.writeText(formattedBody);
      setCopiedBody(true);
      toast.success("レスポンスボディをコピーしました");
      setTimeout(() => setCopiedBody(false), 2000);
    } catch (err) {
      toast.error("コピーに失敗しました");
    }
  };

  const handleCopyHeaders = async () => {
    try {
      const headersText = Object.entries(response.headers)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n");
      await navigator.clipboard.writeText(headersText);
      setCopiedHeaders(true);
      toast.success("ヘッダーをコピーしました");
      setTimeout(() => setCopiedHeaders(false), 2000);
    } catch (err) {
      toast.error("コピーに失敗しました");
    }
  };

  const handleOpenInVSCode = async () => {
    try {
      const formattedBody = formatBody(response.body);

      // 一時ファイルとして保存するためのAPIエンドポイントを呼び出す
      const blob = new Blob([formattedBody], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `response-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("レスポンスをダウンロードしました");
    } catch (err) {
      toast.error("ダウンロードに失敗しました");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>レスポンス</CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={`${getStatusColor(response.status)} text-white`}>
              {response.status} {response.statusText}
            </Badge>
            <Badge variant="outline">{response.duration}ms</Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {new Date(response.timestamp).toLocaleString()}
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="body">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="body">ボディ</TabsTrigger>
            <TabsTrigger value="headers">ヘッダー</TabsTrigger>
          </TabsList>

          {/* ボディタブ */}
          <TabsContent value="body" className="space-y-2">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyBody}
                className="flex-1"
              >
                {copiedBody ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    コピー済み
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    コピー
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleOpenInVSCode}
                className="flex-1"
              >
                <FileJson className="h-4 w-4 mr-2" />
                ダウンロード
              </Button>
            </div>
            <ScrollArea className="h-96 w-full rounded border">
              <pre className="p-4 text-sm font-mono whitespace-pre overflow-x-auto">
                {formatBody(response.body)}
              </pre>
            </ScrollArea>
          </TabsContent>

          {/* ヘッダータブ */}
          <TabsContent value="headers" className="space-y-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyHeaders}
              className="w-full"
            >
              {copiedHeaders ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  コピー済み
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  コピー
                </>
              )}
            </Button>
            <ScrollArea className="h-96 w-full rounded border">
              <div className="p-4 space-y-2">
                {Object.entries(response.headers).map(([key, value]) => (
                  <div key={key} className="text-sm">
                    <span className="font-medium">{key}:</span>{" "}
                    <span className="text-muted-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
