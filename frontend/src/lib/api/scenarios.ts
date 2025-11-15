import { db } from '../db';
import { API_URL } from '../api';
import type {
  TestScenario,
  CreateScenarioInput,
  UpdateScenarioInput,
  ScenarioExport,
  ApplyScenarioResult,
} from '@/types/scenario';

// UUIDを生成するヘルパー関数
function generateId(): string {
  return crypto.randomUUID();
}

export const scenariosApi = {
  /**
   * 全シナリオを取得
   */
  getAll: async (): Promise<TestScenario[]> => {
    const scenarios = await db.scenarios.toArray();
    return scenarios
      .map((s) => ({ ...s, id: s.scenarioId }))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  },

  /**
   * IDでシナリオを取得
   */
  getById: async (id: string): Promise<TestScenario> => {
    const scenario = await db.scenarios.where('scenarioId').equals(id).first();
    if (!scenario) {
      throw new Error('Scenario not found');
    }
    return { ...scenario, id: scenario.scenarioId };
  },

  /**
   * シナリオを作成
   */
  create: async (input: CreateScenarioInput): Promise<TestScenario> => {
    const now = new Date().toISOString();
    const scenarioId = generateId();
    const scenario = {
      scenarioId,
      ...input,
      createdAt: now,
      updatedAt: now,
    };

    await db.scenarios.add(scenario);
    return { ...scenario, id: scenarioId };
  },

  /**
   * シナリオを更新
   */
  update: async (
    id: string,
    input: UpdateScenarioInput
  ): Promise<TestScenario> => {
    const existing = await db.scenarios.where('scenarioId').equals(id).first();
    if (!existing) {
      throw new Error('Scenario not found');
    }

    const updated = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    await db.scenarios.update(existing.id!, updated);
    return { ...updated, id: updated.scenarioId };
  },

  /**
   * シナリオを削除
   */
  delete: async (id: string): Promise<void> => {
    const scenario = await db.scenarios.where('scenarioId').equals(id).first();
    if (!scenario) {
      throw new Error('Scenario not found');
    }
    await db.scenarios.delete(scenario.id!);
  },

  /**
   * シナリオをエクスポート
   */
  exportScenario: async (id: string): Promise<ScenarioExport> => {
    const scenario = await scenariosApi.getById(id);
    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      scenario,
    };
  },

  /**
   * 全シナリオをエクスポート
   */
  exportAll: async (): Promise<ScenarioExport[]> => {
    const scenarios = await scenariosApi.getAll();
    return scenarios.map((scenario) => ({
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      scenario,
    }));
  },

  /**
   * シナリオをインポート
   */
  importScenario: async (
    exportData: ScenarioExport | ScenarioExport[]
  ): Promise<TestScenario | TestScenario[]> => {
    const dataArray = Array.isArray(exportData) ? exportData : [exportData];
    const imported: TestScenario[] = [];

    for (const { scenario } of dataArray) {
      const { id, createdAt, updatedAt, ...rest } = scenario;
      const created = await scenariosApi.create(rest);
      imported.push(created);
    }

    return Array.isArray(exportData) ? imported : imported[0];
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
    // IndexedDBからシナリオを取得
    const scenario = await scenariosApi.getById(id);

    let tablesCreated = 0;
    let dataInserted = 0;
    let mocksConfigured = 0;

    // 1. テーブルを作成
    if (scenario.tables && scenario.tables.length > 0) {
      const sortedTables = [...scenario.tables].sort(
        (a, b) => a.order - b.order
      );

      const createResponse = await fetch(`${API_URL}/api/tables/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tables: sortedTables }),
      });

      if (!createResponse.ok) {
        const error = await createResponse
          .json()
          .catch(() => ({ message: 'Unknown error' }));
        throw new Error(
          `テーブル作成失敗: ${
            error.message || error.error || `HTTP ${createResponse.status}`
          }`
        );
      }

      tablesCreated = sortedTables.length;
    }

    // 2. テーブルデータを挿入
    if (scenario.tableData && scenario.tableData.length > 0) {
      for (const tableData of scenario.tableData) {
        // 空文字列やnullを除外してデータをクリーンアップ
        const cleanedRows = tableData.rows.map((row) => {
          return Object.entries(row).reduce((acc, [key, value]) => {
            if (value !== '' && value !== null && value !== undefined) {
              acc[key] = value;
            }
            return acc;
          }, {} as Record<string, any>);
        });

        const importResponse = await fetch(
          `${API_URL}/api/database/data/import`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...tableData,
              rows: cleanedRows,
            }),
          }
        );

        if (!importResponse.ok) {
          const error = await importResponse
            .json()
            .catch(() => ({ message: 'Unknown error' }));
          console.error('Data import error:', {
            status: importResponse.status,
            error,
            tableData,
          });
          throw new Error(
            `データ投入失敗 (${tableData.tableName}): ${
              error.message || error.error || `HTTP ${importResponse.status}`
            }`
          );
        }

        const result = await importResponse.json();
        dataInserted += result.insertedCount || tableData.rows.length;
      }
    }

    // 3. モックAPIを設定
    if (scenario.mockApis && scenario.mockApis.length > 0) {
      // 既存のモックを全削除
      const deleteResponse = await fetch(`${API_URL}/api/mock/endpoints`, {
        method: 'DELETE',
      });

      if (!deleteResponse.ok) {
        console.warn('Failed to delete existing mocks, continuing anyway...');
      }

      for (const mockApi of scenario.mockApis) {
        const mockResponse = await fetch(`${API_URL}/api/mock/endpoints`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: mockApi.name,
            enabled: mockApi.enabled,
            priority: mockApi.priority,
            method: mockApi.method,
            path: mockApi.path,
            requestMatch: mockApi.requestMatch,
            response: mockApi.response,
          }),
        });

        if (!mockResponse.ok) {
          const error = await mockResponse
            .json()
            .catch(() => ({ message: 'Unknown error' }));
          throw new Error(
            `モック設定失敗: ${
              error.message || error.error || `HTTP ${mockResponse.status}`
            }`
          );
        }

        mocksConfigured++;
      }
    }

    return {
      tablesCreated,
      dataInserted,
      mocksConfigured,
    };
  },

  /**
   * タグで検索
   */
  searchByTags: async (tags: string[]): Promise<TestScenario[]> => {
    const allScenarios = await scenariosApi.getAll();
    return allScenarios.filter((scenario) =>
      tags.some((tag) => scenario.tags.includes(tag))
    );
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
