import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface UseScenarioFormProps {
  isLoading: boolean;
  formValues: any[];
  confirmLeaveDialog?: (message: string) => Promise<boolean>;
}

export function useScenarioForm({ isLoading, formValues, confirmLeaveDialog }: UseScenarioFormProps) {
  const router = useRouter();
  const isNavigatingRef = useRef(false);
  const hasUnsavedChangesRef = useRef(false);
  const initialValuesRef = useRef<any[] | null>(null);

  // 初回ロード完了後、初期値を保存
  if (!isLoading && initialValuesRef.current === null) {
    initialValuesRef.current = formValues;
  }

  // フォーム値が初期値と異なるかチェック
  const hasChanges = !isLoading &&
    initialValuesRef.current !== null &&
    JSON.stringify(formValues) !== JSON.stringify(initialValuesRef.current);

  hasUnsavedChangesRef.current = hasChanges;

  // ページ離脱時の警告（イベントリスナー登録のみuseEffectを使用）
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChangesRef.current && !isNavigatingRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    const handleClick = async (e: MouseEvent) => {
      if (!hasUnsavedChangesRef.current) return;

      const target = e.target as HTMLElement;
      const link = target.closest("a");

      if (link && link.href && !link.href.includes(`/scenarios/`)) {
        e.preventDefault();
        e.stopPropagation();

        if (!confirmLeaveDialog) {
          console.error("confirmLeaveDialog is not provided");
          return;
        }

        const confirmed = await confirmLeaveDialog("変更が保存されていません。このページを離れますか？");

        if (confirmed) {
          isNavigatingRef.current = true;
          hasUnsavedChangesRef.current = false;
          window.location.href = link.href;
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleClick, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleClick, true);
    };
  }, [confirmLeaveDialog]);

  const confirmLeave = async (): Promise<boolean> => {
    if (hasUnsavedChangesRef.current) {
      if (!confirmLeaveDialog) {
        console.error("confirmLeaveDialog is not provided");
        return false;
      }
      return await confirmLeaveDialog("変更が保存されていません。このページを離れますか？");
    }
    return true;
  };

  const resetUnsavedChanges = () => {
    if (initialValuesRef.current !== null) {
      initialValuesRef.current = formValues;
    }
    hasUnsavedChangesRef.current = false;
  };

  return {
    hasUnsavedChanges: hasChanges,
    confirmLeave,
    resetUnsavedChanges,
  };
}
