'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Database,
  FileJson,
  Settings,
  TestTube,
  Home,
  FlaskConical,
  BookOpen,
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
      label: 'Home',
      icon: Home,
    },
    {
      href: '/api-test',
      label: 'API Test',
      icon: TestTube,
    },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Database className="h-6 w-6" />
            <span className="font-bold text-lg sm:text-xl">
              Testing Assistant Suite
            </span>
          </Link>

          <div className="flex items-center space-x-1">
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
                  <span className="hidden sm:inline">{link.label}</span>
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
              <span className="hidden sm:inline">使い方</span>
            </Button>

            {/* DB接続状態 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDbDialogOpen(true)}
              className="ml-2 sm:ml-4 flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              title="データベース接続設定"
            >
              <Database className="h-4 w-4" />
              {dbConnected === null ? (
                <Badge
                  variant="secondary"
                  className="text-xs hidden sm:inline-flex"
                >
                  確認中
                </Badge>
              ) : dbConnected ? (
                <Badge className="bg-green-500 hover:bg-green-600 text-xs">
                  <span className="hidden sm:inline">接続中</span>
                  <span className="sm:hidden">●</span>
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">
                  <span className="hidden sm:inline">未接続</span>
                  <span className="sm:hidden">●</span>
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>
      <ReadmeDialog open={readmeOpen} onOpenChange={setReadmeOpen} />
      <DatabaseConnectionDialog
        open={dbDialogOpen}
        onOpenChange={setDbDialogOpen}
      />
    </nav>
  );
}
