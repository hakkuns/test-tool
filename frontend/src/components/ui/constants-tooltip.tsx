"use client";

import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * 定数機能の説明をツールチップで表示するコンポーネント
 */
export function ConstantsTooltip() {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center"
            aria-label="定数機能について"
          >
            <Info className="h-4 w-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-sm">
          <div className="space-y-1.5 text-xs">
            <p className="font-semibold mb-1">定数機能</p>
            <p className="mb-1">$で始まる値は実行時に変換されます:</p>
            <div className="space-y-0.5 font-mono">
              <p>$SEQ → TST + 13桁タイムスタンプ</p>
              <p>$TIMESTAMP → ISO8601形式の現在時刻</p>
              <p>$UNIX_TIMESTAMP → Unixタイムスタンプ(ミリ秒)</p>
              <p>$UUID → ランダムなUUID</p>
              <p>$RANDOM_STRING → 8桁のランダム文字列</p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
