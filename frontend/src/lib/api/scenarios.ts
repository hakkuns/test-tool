import { API_URL } from '../api';
import type {
  TestScenario,
  CreateScenarioInput,
  UpdateScenarioInput,
  ScenarioExport,
  ApplyScenarioResult,
} from '@/types/scenario';

const SCENARIOS_API = `${API_URL}/api/scenarios`;

// API呼び出し用のヘルパー関数
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const scenariosApi = {
  /**
   * 全シナリオを取得
   */
  getAll: async (): Promise<TestScenario[]> => {
    const data = await fetchAPI<{
      success: boolean;
      data: TestScenario[];
      count: number;
    }>(SCENARIOS_API);
    return data.data;
  },

  /**
   * IDでシナリオを取得
   */
  getById: async (id: string): Promise<TestScenario> => {
    const data = await fetchAPI<{ success: boolean; data: TestScenario }>(
      `${SCENARIOS_API}/${id}`
    );
    return data.data;
  },

  /**
   * シナリオを作成
   */
  create: async (input: CreateScenarioInput): Promise<TestScenario> => {
    const data = await fetchAPI<{ success: boolean; data: TestScenario }>(
      SCENARIOS_API,
      {
        method: 'POST',
        body: JSON.stringify(input),
      }
    );
    return data.data;
  },

  /**
   * シナリオを更新
   */
  update: async (
    id: string,
    input: UpdateScenarioInput
  ): Promise<TestScenario> => {
    const data = await fetchAPI<{ success: boolean; data: TestScenario }>(
      `${SCENARIOS_API}/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(input),
      }
    );
    return data.data;
  },

  /**
   * シナリオを削除
   */
  delete: async (id: string): Promise<void> => {
    await fetchAPI<{ success: boolean; message: string }>(
      `${SCENARIOS_API}/${id}`,
      {
        method: 'DELETE',
      }
    );
  },

  /**
   * シナリオをエクスポート
   */
  exportScenario: async (id: string): Promise<ScenarioExport> => {
    return fetchAPI<ScenarioExport>(`${SCENARIOS_API}/${id}/export`);
  },

  /**
   * 全シナリオをエクスポート
   */
  exportAll: async (): Promise<ScenarioExport[]> => {
    const data = await fetchAPI<{
      success: boolean;
      data: ScenarioExport[];
      count: number;
    }>(`${SCENARIOS_API}/export/all`);
    return data.data;
  },

  /**
   * シナリオをインポート
   */
  importScenario: async (
    exportData: ScenarioExport | ScenarioExport[]
  ): Promise<TestScenario | TestScenario[]> => {
    const data = await fetchAPI<{
      success: boolean;
      data: TestScenario | TestScenario[];
    }>(`${SCENARIOS_API}/import`, {
      method: 'POST',
      body: JSON.stringify(exportData),
    });
    return data.data;
  },

  /**
   * ファイルからシナリオをインポート
   */
  importFromFile: async (
    file: File
  ): Promise<TestScenario | TestScenario[]> => {
    const text = await file.text();
    const exportData = JSON.parse(text);
    return scenariosApi.importScenario(exportData);
  },

  /**
   * シナリオを適用（環境セットアップ）
   */
  apply: async (id: string): Promise<ApplyScenarioResult> => {
    const data = await fetchAPI<{
      success: boolean;
      data: ApplyScenarioResult;
      message: string;
    }>(`${SCENARIOS_API}/${id}/apply`, {
      method: 'POST',
    });
    return data.data;
  },

  /**
   * タグで検索
   */
  searchByTags: async (tags: string[]): Promise<TestScenario[]> => {
    const tagsParam = tags.join(',');
    const data = await fetchAPI<{
      success: boolean;
      data: TestScenario[];
      count: number;
    }>(`${SCENARIOS_API}/search?tags=${encodeURIComponent(tagsParam)}`);
    return data.data;
  },

  /**
   * JSONファイルとしてダウンロード
   */
  downloadAsJson: (data: ScenarioExport, filename?: string) => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download =
      filename || `scenario_${data.scenario.name}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * 複数シナリオをJSONファイルとしてダウンロード
   */
  downloadAllAsJson: (data: ScenarioExport[], filename?: string) => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `scenarios_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
