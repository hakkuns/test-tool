"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Code2, FileText, Copy, Check, Download } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { MockRequestLog, MockEndpoint } from "@/lib/api";

interface MockLogViewerProps {
  logs: MockRequestLog[];
  endpoints: MockEndpoint[];
}

// JSONエディターコンポーネント
function JsonViewer({ data, label }: { data: any; label: string }) {
  const [viewMode, setViewMode] = useState<"editor" | "text">("editor");
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();

  const formattedData = useMemo(() => {
    if (typeof data === "string") {
      try {
        return JSON.stringify(JSON.parse(data), null, 2);
      } catch {
        return data;
      }
    }
    return JSON.stringify(data, null, 2);
  }, [data]);

  const isValidJson = useMemo(() => {
    try {
      if (!data) return false;
      if (typeof data === "string") {
        JSON.parse(data);
      }
      return true;
    } catch {
      return false;
    }
  }, [data]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedData);
      setCopied(true);
      toast.success(`${label}をコピーしました`);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("コピーに失敗しました");
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([formattedData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${label.replace(/\s/g, "-")}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`${label}をダウンロードしました`);
    } catch (err) {
      toast.error("ダウンロードに失敗しました");
    }
  };

  if (!data) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        {label}なし
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleCopy}
                className="h-7 w-7"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{copied ? "コピー済み" : "コピー"}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleDownload}
                className="h-7 w-7"
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>ダウンロード</p>
            </TooltipContent>
          </Tooltip>

          {isValidJson && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setViewMode(viewMode === "editor" ? "text" : "editor")}
                  className="h-7 w-7"
                >
                  {viewMode === "editor" ? (
                    <FileText className="h-3.5 w-3.5" />
                  ) : (
                    <Code2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{viewMode === "editor" ? "テキスト表示" : "エディター表示"}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
      </div>
      {viewMode === "editor" && isValidJson ? (
        <div className="h-48 w-full rounded border overflow-hidden">
          <Editor
            height="100%"
            language="json"
            value={formattedData}
            theme={theme === "dark" ? "vs-dark" : "light"}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 12,
              lineNumbers: "on",
              folding: true,
              automaticLayout: true,
              wordWrap: "on",
              formatOnPaste: true,
              formatOnType: true,
            }}
          />
        </div>
      ) : (
        <ScrollArea className="h-48 w-full rounded border">
          <pre className="p-4 text-xs font-mono">
            {formattedData}
          </pre>
        </ScrollArea>
      )}
    </div>
  );
}

export function MockLogViewer({ logs, endpoints }: MockLogViewerProps) {
  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>モックエンドポイントログ</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            リクエストを送信すると、モックエンドポイントへのリクエストログがここに表示されます
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "bg-green-500";
    if (status >= 300 && status < 400) return "bg-blue-500";
    if (status >= 400 && status < 500) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-blue-500 text-white border-blue-500";
      case "POST":
        return "bg-green-500 text-white border-green-500";
      case "PUT":
        return "bg-yellow-500 text-white border-yellow-500";
      case "PATCH":
        return "bg-purple-500 text-white border-purple-500";
      case "DELETE":
        return "bg-red-500 text-white border-red-500";
      default:
        return "bg-gray-500 text-white border-gray-500";
    }
  };

  // ログを古い順（昇順）にソート - アクセスされた順
  const sortedLogs = [...logs].sort((a, b) => {
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>モックエンドポイントログ ({logs.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedLogs.map((log) => {
            // 対応するエンドポイントを探す
            const endpoint = endpoints.find(
              (ep) => ep.id === log.matchedEndpointId,
            );
            const mockUrl = `http://localhost:3001/api/mock/serve${log.path}`;

            return (
              <Card key={log.id} className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          className={`font-mono ${getMethodColor(log.method)}`}
                        >
                          {log.method}
                        </Badge>
                        {log.matchedEndpointName && (
                          <span className="font-semibold">
                            {log.matchedEndpointName}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground font-mono break-all">
                        {mockUrl}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        className={`${getStatusColor(log.responseStatus)} text-white`}
                      >
                        {log.responseStatus}
                      </Badge>
                      {log.duration !== undefined && (
                        <Badge variant="outline">{log.duration}ms</Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString()}
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <Tabs defaultValue="response" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="response">レスポンス</TabsTrigger>
                      <TabsTrigger value="request">リクエスト</TabsTrigger>
                      <TabsTrigger value="query">クエリパラメータ</TabsTrigger>
                      <TabsTrigger value="headers">ヘッダー</TabsTrigger>
                    </TabsList>

                    <TabsContent value="response">
                      <JsonViewer
                        data={log.responseBody}
                        label="レスポンスボディ"
                      />
                    </TabsContent>

                    <TabsContent value="request">
                      <JsonViewer
                        data={log.body}
                        label="リクエストボディ"
                      />
                    </TabsContent>

                    <TabsContent value="query">
                      <ScrollArea className="h-48 w-full rounded border">
                        {log.query && Object.keys(log.query).length > 0 ? (
                          <div className="p-4 space-y-2">
                            {Object.entries(log.query).map(([key, value]) => (
                              <div key={key} className="text-sm">
                                <span className="font-medium">{key}:</span>{" "}
                                <span className="text-muted-foreground">
                                  {value}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 text-sm text-muted-foreground">
                            クエリパラメータなし
                          </div>
                        )}
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="headers">
                      <ScrollArea className="h-48 w-full rounded border">
                        {log.headers && Object.keys(log.headers).length > 0 ? (
                          <div className="p-4 space-y-2">
                            {Object.entries(log.headers).map(([key, value]) => (
                              <div key={key} className="text-xs">
                                <span className="font-medium">{key}:</span>{" "}
                                <span className="text-muted-foreground break-all">
                                  {value}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 text-sm text-muted-foreground">
                            ヘッダーなし
                          </div>
                        )}
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
