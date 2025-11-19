'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Database,
  TestTube,
  Home,
  BookOpen,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { checkDatabaseConnection } from '@/lib/api';
import { ReadmeDialog } from '@/components/ReadmeDialog';
import { DatabaseConnectionDialog } from '@/components/DatabaseConnectionDialog';

export function Navigation() {
  const pathname = usePathname();
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [readmeOpen, setReadmeOpen] = useState(false);
  const [dbDialogOpen, setDbDialogOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkDbConnection();
    // DB接続状態を5秒ごとに確認
    const interval = setInterval(checkDbConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkDbConnection = async () => {
    try {
      const result = await checkDatabaseConnection();
      setDbConnected(result.database === 'connected');
    } catch (error) {
      setDbConnected(false);
    }
  };

  const links = [
    {
      href: '/',
      label: 'ホーム',
      icon: Home,
    },
    {
      href: '/api-test',
      label: 'APIテスト',
      icon: TestTube,
    },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Database className="h-6 w-6" />
            <span className="font-bold text-base sm:text-lg md:text-xl">
              <span className="hidden sm:inline">Testing Assistant Suite</span>
              <span className="sm:hidden">TAS</span>
            </span>
          </Link>

          {/* デスクトップメニュー */}
          <div className="hidden md:flex items-center space-x-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            {/* 使い方ボタン */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReadmeOpen(true)}
              className="flex items-center space-x-2 px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <BookOpen className="h-4 w-4" />
              <span>使い方</span>
            </Button>

            {/* DB接続状態 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDbDialogOpen(true)}
              className="ml-4 flex items-center gap-2 px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              title="データベース接続設定"
            >
              <Database className="h-4 w-4" />
              {dbConnected === null ? (
                <Badge variant="secondary" className="text-xs">
                  確認中
                </Badge>
              ) : dbConnected ? (
                <Badge className="bg-green-500 hover:bg-green-600 text-xs">
                  接続中
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">
                  未接続
                </Badge>
              )}
            </Button>
          </div>

          {/* モバイルメニュー */}
          <div className="flex md:hidden items-center space-x-2">
            {/* DB接続状態（モバイル） */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDbDialogOpen(true)}
              className="flex items-center gap-1 px-2 py-2"
              title="データベース接続設定"
            >
              <Database className="h-4 w-4" />
              {dbConnected === null ? (
                <Badge variant="secondary" className="text-xs h-2 w-2 p-0 rounded-full" />
              ) : dbConnected ? (
                <Badge className="bg-green-500 h-2 w-2 p-0 rounded-full" />
              ) : (
                <Badge variant="destructive" className="h-2 w-2 p-0 rounded-full" />
              )}
            </Button>

            {/* ハンバーガーメニュー */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* モバイルメニュードロップダウン */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t py-2 space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center space-x-3 px-4 py-3 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <Button
              variant="ghost"
              onClick={() => {
                setReadmeOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full justify-start flex items-center space-x-3 px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <BookOpen className="h-5 w-5" />
              <span>使い方</span>
            </Button>
          </div>
        )}
      </div>
      <ReadmeDialog open={readmeOpen} onOpenChange={setReadmeOpen} />
      <DatabaseConnectionDialog
        open={dbDialogOpen}
        onOpenChange={setDbDialogOpen}
      />
    </nav>
  );
}
