'use client';

import { useRef } from 'react';
import { Editor } from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Code } from 'lucide-react';
import type { editor } from 'monaco-editor';

interface JsonEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  height?: string;
  disabled?: boolean;
  readOnly?: boolean;
  showFormatButton?: boolean;
}

export function JsonEditor({
  value,
  onChange,
  height = '200px',
  disabled = false,
  readOnly = false,
  showFormatButton = true,
}: JsonEditorProps) {
  const { theme } = useTheme();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorChange = (value: string | undefined) => {
    onChange(value);
  };

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
  };

  const handleFormat = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  };

  return (
    <div className="space-y-2">
      {showFormatButton && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleFormat}
            disabled={disabled || readOnly}
            className="flex items-center gap-1"
          >
            <Code className="h-3 w-3" />
            Format
          </Button>
        </div>
      )}
      <div className="border overflow-hidden relative">
        <style>{`
          .monaco-editor .view-lines {
            padding-right: 16px;
          }
          .monaco-editor,
          .monaco-editor-background,
          .monaco-editor .inputarea.ime-input,
          .monaco-editor .view-line,
          .monaco-editor .lines-content {
            background-color: rgb(250 250 250) !important;
          }
          .dark .monaco-editor,
          .dark .monaco-editor-background,
          .dark .monaco-editor .inputarea.ime-input,
          .dark .monaco-editor .view-line,
          .dark .monaco-editor .lines-content {
            background-color: rgb(24 24 27) !important;
          }
          .monaco-editor .margin,
          .monaco-editor .line-numbers,
          .monaco-editor .margin-view-overlays {
            background-color: rgb(245 245 245) !important;
          }
          .dark .monaco-editor .margin,
          .dark .monaco-editor .line-numbers,
          .dark .monaco-editor .margin-view-overlays {
            background-color: rgb(39 39 42) !important;
          }
          .monaco-editor .selected-text {
            background-color: rgba(173, 214, 255, 0.3) !important;
          }
          .dark .monaco-editor .selected-text {
            background-color: rgba(173, 214, 255, 0.15) !important;
          }
          .monaco-editor .view-overlays .current-line,
          .monaco-editor .view-overlays .current-line-exact {
            background-color: rgb(229 231 235) !important;
          }
          .dark .monaco-editor .view-overlays .current-line,
          .dark .monaco-editor .view-overlays .current-line-exact {
            background-color: rgb(63 63 70) !important;
          }
          .monaco-editor .margin-view-overlays .current-line-margin,
          .monaco-editor .margin-view-overlays .current-line-margin-both {
            background-color: rgb(229 231 235) !important;
            width: 100% !important;
          }
          .dark .monaco-editor .margin-view-overlays .current-line-margin,
          .dark .monaco-editor .margin-view-overlays .current-line-margin-both {
            background-color: rgb(63 63 70) !important;
            width: 100% !important;
          }
          .monaco-editor .margin-view-overlays .line-numbers.active-line-number {
            background-color: rgb(229 231 235) !important;
          }
          .dark .monaco-editor .margin-view-overlays .line-numbers.active-line-number {
            background-color: rgb(63 63 70) !important;
          }
        `}</style>
        <Editor
          height={height}
          defaultLanguage="json"
          value={value}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: '"Cascadia Code", "Fira Code", "Consolas", "Monaco", monospace',
            fontLigatures: true,
            lineNumbers: 'on',
            lineNumbersMinChars: 4,
            glyphMargin: false,
            folding: true,
            lineDecorationsWidth: 8,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            formatOnPaste: true,
            formatOnType: false,
            readOnly: disabled || readOnly,
            domReadOnly: disabled || readOnly,
            padding: { top: 8, bottom: 8 },
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              verticalScrollbarSize: 14,
              horizontalScrollbarSize: 14,
              useShadows: true,
            },
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            overviewRulerBorder: false,
            fixedOverflowWidgets: true,
            renderLineHighlight: 'all',
            renderLineHighlightOnlyWhenFocus: false,
            smoothScrolling: true,
            cursorBlinking: 'blink',
            cursorSmoothCaretAnimation: 'off',
            bracketPairColorization: {
              enabled: true,
            },
          }}
        />
      </div>
    </div>
  );
}
