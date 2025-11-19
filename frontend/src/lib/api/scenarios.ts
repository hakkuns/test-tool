import { db } from "../db";
import { API_URL } from "../api";
import type {
  TestScenario,
  CreateScenarioInput,
  UpdateScenarioInput,
  ScenarioExport,
  ApplyScenarioResult,
  ScenarioGroup,
} from "@/types/scenario";

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
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  },

  /**
   * IDでシナリオを取得
   */
  getById: async (id: string): Promise<TestScenario> => {
    const scenario = await db.scenarios.where("scenarioId").equals(id).first();
    if (!scenario) {
      throw new Error("Scenario not found");
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
    input: UpdateScenarioInput,
  ): Promise<TestScenario> => {
    const existing = await db.scenarios.where("scenarioId").equals(id).first();
    if (!existing) {
      throw new Error("Scenario not found");
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
    const scenario = await db.scenarios.where("scenarioId").equals(id).first();
    if (!scenario) {
      throw new Error("Scenario not found");
    }
    await db.scenarios.delete(scenario.id!);
  },

  /**
   * シナリオをエクスポート
   */
  exportScenario: async (id: string): Promise<ScenarioExport> => {
    const scenario = await scenariosApi.getById(id);
    let group: ScenarioGroup | undefined;

    // グループ情報があれば取得
    if (scenario.groupId) {
      try {
        group = await groupsApi.getById(scenario.groupId);
      } catch (error) {
        console.warn("Group not found for scenario:", error);
      }
    }

    return {
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      scenario,
      group,
    };
  },

  /**
   * 全シナリオをエクスポート
   */
  exportAll: async (): Promise<ScenarioExport[]> => {
    const scenarios = await scenariosApi.getAll();
    const exports: ScenarioExport[] = [];

    for (const scenario of scenarios) {
      let group: ScenarioGroup | undefined;

      // グループ情報があれば取得
      if (scenario.groupId) {
        try {
          group = await groupsApi.getById(scenario.groupId);
        } catch (error) {
          console.warn("Group not found for scenario:", error);
        }
      }

      exports.push({
        version: "1.0.0",
        exportedAt: new Date().toISOString(),
        scenario,
        group,
      });
    }

    return exports;
  },

  /**
   * シナリオをインポート
   */
  importScenario: async (
    exportData: ScenarioExport | ScenarioExport[],
  ): Promise<TestScenario | TestScenario[]> => {
    const dataArray = Array.isArray(exportData) ? exportData : [exportData];
    const imported: TestScenario[] = [];
    const groupIdMap = new Map<string, string>(); // 元のgroupId -> 新しいgroupId

    for (const data of dataArray) {
      // データの構造を確認
      const scenario = data.scenario || data;
      const group = data.group;

      if (!scenario) {
        console.error("Invalid export data:", data);
        continue;
      }

      let newGroupId: string | undefined;

      // グループ情報がある場合、グループを復元または取得
      if (group && scenario.groupId) {
        // 既にマップに存在する場合は再利用
        if (groupIdMap.has(scenario.groupId)) {
          newGroupId = groupIdMap.get(scenario.groupId);
        } else {
          // 同じ名前のグループが存在するか確認
          const allGroups = await groupsApi.getAll();
          const existingGroup = allGroups.find((g) => g.name === group.name);

          if (existingGroup) {
            // 既存のグループを使用
            newGroupId = existingGroup.id;
          } else {
            // 新しいグループを作成
            const { id, createdAt, updatedAt, ...groupData } = group;
            const createdGroup = await groupsApi.create(groupData);
            newGroupId = createdGroup.id;
          }

          groupIdMap.set(scenario.groupId, newGroupId);
        }
      }

      // 既存のID関連フィールドをすべて除外し、新しいシナリオとして作成
      const { id, createdAt, updatedAt, groupId, groupName, ...rest } =
        scenario;

      // scenarioIdはランタイムでのみ存在する可能性があるため、除外
      if ("scenarioId" in rest) {
        delete (rest as any).scenarioId;
      }

      // インポート時は常に新しいシナリオとして作成（複製を許可）
      const created = await scenariosApi.create({
        ...rest,
        name: rest.name + " (コピー)",
        groupId: newGroupId, // 新しいグループIDまたはundefined
      });
      imported.push(created);
    }

    return Array.isArray(exportData) ? imported : imported[0];
  },

  /**
   * ファイルからシナリオをインポート
   */
  importFromFile: async (
    file: File,
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
        (a, b) => a.order - b.order,
      );

      const createResponse = await fetch(`${API_URL}/api/tables/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tables: sortedTables }),
      });

      if (!createResponse.ok) {
        const error = await createResponse
          .json()
          .catch(() => ({ message: "Unknown error" }));
        throw new Error(
          `テーブル作成失敗: ${
            error.message || error.error || `HTTP ${createResponse.status}`
          }`,
        );
      }

      tablesCreated = sortedTables.length;
    }

    // 2. テーブルデータを挿入
    if (scenario.tableData && scenario.tableData.length > 0) {
      for (const tableData of scenario.tableData) {
        // 空文字列やnullを除外してデータをクリーンアップ
        const cleanedRows = tableData.rows.map((row) => {
          return Object.entries(row).reduce(
            (acc, [key, value]) => {
              if (value !== "" && value !== null && value !== undefined) {
                acc[key] = value;
              }
              return acc;
            },
            {} as Record<string, any>,
          );
        });

        const importResponse = await fetch(
          `${API_URL}/api/database/data/import`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...tableData,
              rows: cleanedRows,
            }),
          },
        );

        if (!importResponse.ok) {
          const error = await importResponse
            .json()
            .catch(() => ({ message: "Unknown error" }));
          console.error("Data import error:", {
            status: importResponse.status,
            error,
            tableData,
          });

          // SQLエラーメッセージを解析してユーザーフレンドリーなメッセージに変換
          let errorMessage =
            error.message || error.error || `HTTP ${importResponse.status}`;

          // PostgreSQLの一般的なエラーパターンを検出
          if (
            errorMessage.includes("duplicate key") ||
            errorMessage.includes("重複")
          ) {
            errorMessage = `主キーまたはユニークキーの重複: ${tableData.tableName}`;
          } else if (
            errorMessage.includes("foreign key") ||
            errorMessage.includes("外部キー")
          ) {
            errorMessage = `外部キー制約違反: ${tableData.tableName}`;
          } else if (
            errorMessage.includes("not-null") ||
            errorMessage.includes("null value")
          ) {
            errorMessage = `NOT NULL制約違反: ${tableData.tableName}`;
          } else if (
            errorMessage.includes("check constraint") ||
            errorMessage.includes("チェック制約")
          ) {
            errorMessage = `チェック制約違反: ${tableData.tableName}`;
          } else if (
            errorMessage.includes("does not exist") ||
            errorMessage.includes("存在しません")
          ) {
            errorMessage = `テーブルまたはカラムが存在しません: ${tableData.tableName}`;
          } else {
            errorMessage = `データ投入失敗 (${tableData.tableName}): ${errorMessage}`;
          }

          throw new Error(errorMessage);
        }

        const result = await importResponse.json();
        dataInserted += result.insertedCount || tableData.rows.length;
      }
    }

    // 3. モックAPIを設定
    if (scenario.mockApis && scenario.mockApis.length > 0) {
      // 既存のモックを全削除
      const deleteResponse = await fetch(`${API_URL}/api/mock/endpoints`, {
        method: "DELETE",
      });

      if (!deleteResponse.ok) {
        console.warn("Failed to delete existing mocks, continuing anyway...");
      }

      for (const mockApi of scenario.mockApis) {
        const mockResponse = await fetch(`${API_URL}/api/mock/endpoints`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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
            .catch(() => ({ message: "Unknown error" }));
          throw new Error(
            `モック設定失敗: ${
              error.message || error.error || `HTTP ${mockResponse.status}`
            }`,
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
      tags.some((tag) => scenario.tags.includes(tag)),
    );
  },

  /**
   * JSONファイルとしてダウンロード
   */
  downloadAsJson: (data: ScenarioExport, filename?: string) => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
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
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || `scenarios_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};

/**
 * グループ管理API (IndexedDBベース)
 */
export const groupsApi = {
  /**
   * 全グループを取得
   */
  getAll: async (): Promise<ScenarioGroup[]> => {
    const groups = await db.scenarioGroups.toArray();

    // デバッグログ（開発環境のみ）
    if (process.env.NODE_ENV === "development") {
      console.log("IndexedDB scenarioGroups.toArray():", {
        count: groups.length,
        rawGroups: groups,
      });
    }

    return groups
      .map((g) => ({ ...g, id: g.groupId }))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  },

  /**
   * IDでグループを取得
   */
  getById: async (id: string): Promise<ScenarioGroup> => {
    const group = await db.scenarioGroups.where("groupId").equals(id).first();
    if (!group) {
      throw new Error("Group not found");
    }
    return { ...group, id: group.groupId };
  },

  /**
   * グループを作成
   */
  create: async (input: {
    name: string;
    description?: string;
  }): Promise<ScenarioGroup> => {
    try {
      // 同じ名前のグループが存在するかチェック
      const existingGroups = await db.scenarioGroups.toArray();
      const duplicateName = existingGroups.some(
        (g) => g.name.toLowerCase() === input.name.toLowerCase(),
      );

      if (duplicateName) {
        throw new Error("同じ名前のグループが既に存在します");
      }

      const now = new Date().toISOString();
      const groupId = generateId();
      const group = {
        groupId,
        ...input,
        createdAt: now,
        updatedAt: now,
      };

      await db.scenarioGroups.add(group);
      return { ...group, id: groupId };
    } catch (error) {
      console.error("Error creating group in IndexedDB:", error);
      throw error;
    }
  },

  /**
   * グループを更新
   */
  update: async (
    id: string,
    input: { name?: string; description?: string },
  ): Promise<ScenarioGroup> => {
    const existing = await db.scenarioGroups
      .where("groupId")
      .equals(id)
      .first();
    if (!existing) {
      throw new Error("Group not found");
    }

    // 名前を変更する場合、同じ名前のグループが存在するかチェック
    if (input.name && input.name !== existing.name) {
      const allGroups = await db.scenarioGroups.toArray();
      const duplicateName = allGroups.some(
        (g) =>
          g.groupId !== id &&
          g.name.toLowerCase() === input.name!.toLowerCase(),
      );

      if (duplicateName) {
        throw new Error("同じ名前のグループが既に存在します");
      }
    }

    const updated = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    await db.scenarioGroups.update(existing.id!, updated);

    // グループ名が変更された場合、そのグループに属するシナリオのgroupNameも更新
    if (input.name && input.name !== existing.name) {
      const scenarios = await db.scenarios
        .where("groupId")
        .equals(id)
        .toArray();
      for (const scenario of scenarios) {
        await db.scenarios.update(scenario.id!, {
          ...scenario,
          groupName: input.name,
        });
      }
    }

    return { ...updated, id: updated.groupId };
  },

  /**
   * グループを削除
   */
  delete: async (id: string): Promise<void> => {
    const group = await db.scenarioGroups.where("groupId").equals(id).first();
    if (!group) {
      throw new Error("Group not found");
    }

    // グループに属するシナリオのgroupIdとgroupNameをクリア
    const scenarios = await db.scenarios.where("groupId").equals(id).toArray();
    for (const scenario of scenarios) {
      await db.scenarios.update(scenario.id!, {
        ...scenario,
        groupId: undefined,
        groupName: undefined,
      });
    }

    await db.scenarioGroups.delete(group.id!);
  },

  /**
   * グループに属するシナリオを取得
   */
  getScenarios: async (groupId: string): Promise<TestScenario[]> => {
    const scenarios = await db.scenarios
      .where("groupId")
      .equals(groupId)
      .toArray();
    return scenarios.map((s) => ({ ...s, id: s.scenarioId }));
  },

  /**
   * グループをシナリオと一緒にエクスポート
   */
  exportGroup: async (groupId: string): Promise<any> => {
    const group = await groupsApi.getById(groupId);
    const scenarios = await groupsApi.getScenarios(groupId);

    return {
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      group,
      scenarios,
    };
  },

  /**
   * グループをシナリオと一緒にインポート
   */
  importGroup: async (
    exportData: any,
  ): Promise<{
    group: ScenarioGroup;
    scenarios: TestScenario[];
  }> => {
    const { group: groupData, scenarios: scenariosData } = exportData;

    // 同じ名前のグループが存在するか確認
    const allGroups = await groupsApi.getAll();
    const existingGroup = allGroups.find((g) => g.name === groupData.name);

    let group: ScenarioGroup;
    if (existingGroup) {
      // 既存のグループを使用
      group = existingGroup;
    } else {
      // 新しいグループを作成
      const { id, createdAt, updatedAt, ...restGroup } = groupData;
      group = await groupsApi.create(restGroup);
    }

    // シナリオをインポート
    const importedScenarios: TestScenario[] = [];
    for (const scenario of scenariosData) {
      const { id, createdAt, updatedAt, groupId, groupName, ...rest } =
        scenario;

      if ("scenarioId" in rest) {
        delete (rest as any).scenarioId;
      }

      const created = await scenariosApi.create({
        ...rest,
        name: rest.name + " (コピー)",
        groupId: group.id,
      });
      importedScenarios.push(created);
    }

    return { group, scenarios: importedScenarios };
  },
};
