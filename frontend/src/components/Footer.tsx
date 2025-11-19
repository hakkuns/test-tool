'use client';

import { Database, Heart } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* ロゴとタイトル */}
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold text-muted-foreground">
              Testing Assistant Suite
            </span>
          </div>

          {/* 中央のテキスト */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Made with</span>
            <Heart className="h-4 w-4 text-red-500 fill-red-500" />
            <span>for developers</span>
          </div>

          {/* 右側 */}
          <div className="text-sm text-muted-foreground">
            <span>© {currentYear}</span>
          </div>
        </div>

        {/* 下部の説明 */}
        <div className="mt-4 text-center text-xs text-muted-foreground">
          <p>API testing and database management tool for development teams</p>
        </div>
      </div>
    </footer>
  );
}
