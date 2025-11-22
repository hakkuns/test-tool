import { useState, useCallback, useRef } from "react";

interface ConfirmDialogState {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void;
}

export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmDialogState>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback(
    (options: Omit<ConfirmDialogState, "open" | "onConfirm">): Promise<boolean> => {
      return new Promise((resolve) => {
        resolveRef.current = resolve;
        setState({
          ...options,
          open: true,
          onConfirm: () => {
            setState((prev) => ({ ...prev, open: false }));
            resolve(true);
            resolveRef.current = null;
          },
        });
      });
    },
    []
  );

  const handleCancel = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
  }, []);

  return {
    dialogState: state,
    confirm,
    handleCancel,
  };
}
