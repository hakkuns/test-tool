"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import type { MockEndpoint } from "@/lib/api";
import { toast } from "sonner";
import { API_URL } from "@/lib/api";

interface MockEndpointListProps {
  endpoints: MockEndpoint[];
}

export function MockEndpointList({ endpoints }: MockEndpointListProps) {
  if (endpoints.length === 0) {
    return null;
  }

  const enabledEndpoints = endpoints.filter((e) => e.enabled);

  if (enabledEndpoints.length === 0) {
    return null;
  }

  const getMethodBadgeColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-blue-500";
      case "POST":
        return "bg-green-500";
      case "PUT":
        return "bg-yellow-500";
      case "DELETE":
        return "bg-red-500";
      case "PATCH":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const generateCurlCommand = (endpoint: MockEndpoint): string => {
    const url = `${API_URL}/api/mock/serve${endpoint.path}`;
    let curlCommand = `curl -X ${endpoint.method} "${url}"`;

    // ヘッダーを追加
    if (endpoint.response.headers) {
      Object.entries(endpoint.response.headers).forEach(([key, value]) => {
        curlCommand += ` \\\n  -H "${key}: ${value}"`;
      });
    }

    // POSTやPUTの場合、サンプルボディを追加
    if (
      (endpoint.method === "POST" ||
        endpoint.method === "PUT" ||
        endpoint.method === "PATCH") &&
      endpoint.requestMatch?.body
    ) {
      curlCommand += ` \\\n  -d '${JSON.stringify(
        endpoint.requestMatch.body,
      )}'`;
    }

    return curlCommand;
  };

  const copyCurlCommand = (endpoint: MockEndpoint) => {
    const curlCommand = generateCurlCommand(endpoint);
    navigator.clipboard.writeText(curlCommand);
    toast.success("curlコマンドをコピーしました");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>アクティブなモックAPI</span>
          <Badge variant="secondary">{enabledEndpoints.length}件</Badge>
        </CardTitle>
        <CardDescription>現在有効なモックAPIエンドポイント</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {enabledEndpoints.map((endpoint) => (
            <div
              key={endpoint.id}
              className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Badge className={getMethodBadgeColor(endpoint.method)}>
                  {endpoint.method}
                </Badge>
                <div className="flex-1 min-w-0">
                  {endpoint.name && (
                    <div className="text-sm font-medium mb-1">
                      {endpoint.name}
                    </div>
                  )}
                  <code className="text-xs font-mono text-muted-foreground block truncate">
                    {API_URL}/api/mock/serve{endpoint.path}
                  </code>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => copyCurlCommand(endpoint)}
                title="curlコマンドをコピー"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
