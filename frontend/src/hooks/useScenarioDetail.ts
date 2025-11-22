import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { scenariosApi } from "@/lib/api/scenarios";
import { toast } from "sonner";

export function useScenarioDetail(id: string) {
  const router = useRouter();

  // React Queryを使用してシナリオデータを取得
  const {
    data: scenario,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["scenarios", id],
    queryFn: () => scenariosApi.getById(id),
    enabled: !!id,
    staleTime: 30 * 1000, // 30秒間はキャッシュを使う
    retry: false, // 404エラーの場合はリトライしない
  });

  // エラーハンドリング - シナリオが見つからない場合はホームへ
  if (error) {
    console.error("Failed to load scenario:", error);
    toast.error("シナリオが見つかりません");
    router.push("/");
  }

  // LocalStorageから適用状態を取得
  const appliedScenarioId = typeof window !== "undefined"
    ? localStorage.getItem("appliedScenarioId")
    : null;
  const isApplied = appliedScenarioId === id;

  return {
    isLoading,
    isApplied,
    // シナリオデータをフラットに返す（既存のインターフェースを維持）
    name: scenario?.name || "",
    description: scenario?.description || "",
    tags: scenario?.tags || [],
    targetApiMethod: scenario?.targetApi.method || "GET",
    targetApiUrl: scenario?.targetApi.url || "",
    targetApiHeaders: scenario?.targetApi.headers || {},
    targetApiBody: scenario?.targetApi.body,
    tables: scenario?.tables || [],
    tableData: scenario?.tableData || [],
    mockApis: scenario?.mockApis || [],
    testHeaders: scenario?.testSettings?.headers || {},
    testBody: scenario?.testSettings?.body || "",
  };
}
