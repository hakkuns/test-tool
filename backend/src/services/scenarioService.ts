import type {
  TestScenario,
  ScenarioExport,
  DDLTable,
  TableData,
  MockEndpoint,
  ScenarioGroup,
} from '../types/index.js';
import * as databaseService from './databaseService.js';
import { mockService } from './mockService.js';

/**
 * テストシナリオ管理サービス
 */
class ScenarioService {
  private scenarios: Map<string, TestScenario> = new Map();
  private groups: Map<string, ScenarioGroup> = new Map();

  /**
   * すべてのシナリオを取得
   */
  getAllScenarios(): TestScenario[] {
    return Array.from(this.scenarios.values()).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * IDでシナリオを取得
   */
  getScenarioById(id: string): TestScenario | undefined {
    return this.scenarios.get(id);
  }

  /**
   * シナリオを作成
   */
  createScenario(
    scenario: Omit<TestScenario, 'id' | 'createdAt' | 'updatedAt'>
  ): TestScenario {
    const id = this.generateId();
    const now = new Date().toISOString();
    const newScenario: TestScenario = {
      ...scenario,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.scenarios.set(id, newScenario);
    return newScenario;
  }

  /**
   * シナリオを更新
   */
  updateScenario(
    id: string,
    updates: Partial<Omit<TestScenario, 'id' | 'createdAt' | 'updatedAt'>>
  ): TestScenario | null {
    const scenario = this.scenarios.get(id);
    if (!scenario) {
      return null;
    }
    const updated: TestScenario = {
      ...scenario,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.scenarios.set(id, updated);
    return updated;
  }

  /**
   * シナリオを削除
   */
  deleteScenario(id: string): boolean {
    return this.scenarios.delete(id);
  }

  /**
   * すべてのシナリオを削除
   */
  deleteAllScenarios(): void {
    this.scenarios.clear();
  }

  /**
   * シナリオをエクスポート
   */
  exportScenario(id: string): ScenarioExport | null {
    const scenario = this.scenarios.get(id);
    if (!scenario) {
      return null;
    }
    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      scenario,
    };
  }

  /**
   * すべてのシナリオをエクスポート
   */
  exportAllScenarios(): ScenarioExport[] {
    return this.getAllScenarios().map((scenario) => ({
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      scenario,
    }));
  }

  /**
   * シナリオをインポート
   */
  importScenario(data: ScenarioExport): TestScenario {
    const scenario = data.scenario;
    this.scenarios.set(scenario.id, scenario);
    return scenario;
  }

  /**
   * 複数のシナリオをインポート
   */
  importAllScenarios(dataList: ScenarioExport[]): TestScenario[] {
    const imported: TestScenario[] = [];
    for (const data of dataList) {
      const scenario = this.importScenario(data);
      imported.push(scenario);
    }
    return imported;
  }

  /**
   * シナリオを適用（環境セットアップ）
   * 1. テーブルを作成
   * 2. テーブルデータを挿入
   * 3. モックAPIを設定
   */
  async applyScenario(id: string): Promise<{
    tablesCreated: number;
    dataInserted: number;
    mocksConfigured: number;
  }> {
    const scenario = this.scenarios.get(id);
    if (!scenario) {
      throw new Error(`Scenario not found: ${id}`);
    }

    let tablesCreated = 0;
    let dataInserted = 0;
    let mocksConfigured = 0;

    // 1. テーブルを作成（依存関係順）
    const sortedTables = this.sortTablesByDependencies(scenario.tables);
    for (const table of sortedTables) {
      await databaseService.executeDDL(table.ddl);
      tablesCreated++;
    }

    // 2. テーブルデータを挿入（依存関係を解決して順序制御）
    const sortedTableData = this.sortTableDataByDependencies(
      scenario.tableData,
      scenario.tables
    );

    for (const tableData of sortedTableData) {
      // 参照のみのテーブルはデータ挿入をスキップ
      if (tableData.readOnly) {
        continue;
      }
      const inserted = await databaseService.importTableData(tableData);
      dataInserted += inserted;
    }

    // 3. モックAPIを設定
    for (const mockApi of scenario.mockApis) {
      // 既存のモックを削除して新しいものを追加
      const existing = mockService.getEndpointById(mockApi.id);
      if (existing) {
        mockService.deleteEndpoint(mockApi.id);
      }
      mockService.createEndpoint({
        name: mockApi.name,
        enabled: mockApi.enabled,
        priority: mockApi.priority,
        method: mockApi.method,
        path: mockApi.path,
        requestMatch: mockApi.requestMatch,
        response: mockApi.response,
      });
      mocksConfigured++;
    }

    return {
      tablesCreated,
      dataInserted,
      mocksConfigured,
    };
  }

  /**
   * タグで検索
   */
  searchByTags(tags: string[]): TestScenario[] {
    return this.getAllScenarios().filter((scenario) =>
      tags.some((tag) => scenario.tags.includes(tag))
    );
  }

  /**
   * テーブルを依存関係順にソート
   */
  private sortTablesByDependencies(tables: DDLTable[]): DDLTable[] {
    return [...tables].sort((a, b) => a.order - b.order);
  }

  /**
   * テーブルデータを依存関係順にソート
   * 外部キー制約のあるテーブルは参照先より後に挿入する
   */
  private sortTableDataByDependencies(
    tableData: TableData[],
    tables: DDLTable[]
  ): TableData[] {
    // テーブル名から依存関係を構築
    const dependencies = new Map<string, string[]>();

    for (const table of tables) {
      const deps: string[] = [];
      if (table.dependencies && table.dependencies.length > 0) {
        deps.push(...table.dependencies);
      }
      dependencies.set(table.name, deps);
    }

    // トポロジカルソート
    const sorted: TableData[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (tableName: string) => {
      if (visited.has(tableName)) return;
      if (visiting.has(tableName)) {
        // 循環依存を検出したが、処理を続行
        console.warn(`Circular dependency detected for table: ${tableName}`);
        return;
      }

      visiting.add(tableName);
      const deps = dependencies.get(tableName) || [];

      for (const dep of deps) {
        visit(dep);
      }

      visiting.delete(tableName);
      visited.add(tableName);

      // このテーブルのデータを追加
      const data = tableData.find((td) => td.tableName === tableName);
      if (data) {
        sorted.push(data);
      }
    };

    // すべてのテーブルデータを処理
    for (const data of tableData) {
      visit(data.tableName);
    }

    return sorted;
  }

  /**
   * ユニークIDを生成
   */
  private generateId(): string {
    return `scenario_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * グループIDを生成
   */
  private generateGroupId(): string {
    return `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * すべてのグループを取得
   */
  getAllGroups(): ScenarioGroup[] {
    return Array.from(this.groups.values()).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * IDでグループを取得
   */
  getGroupById(id: string): ScenarioGroup | undefined {
    return this.groups.get(id);
  }

  /**
   * グループを作成
   */
  createGroup(
    group: Omit<ScenarioGroup, 'id' | 'createdAt' | 'updatedAt'>
  ): ScenarioGroup {
    const id = this.generateGroupId();
    const now = new Date().toISOString();
    const newGroup: ScenarioGroup = {
      ...group,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.groups.set(id, newGroup);
    return newGroup;
  }

  /**
   * グループを更新
   */
  updateGroup(
    id: string,
    updates: Partial<Omit<ScenarioGroup, 'id' | 'createdAt' | 'updatedAt'>>
  ): ScenarioGroup | null {
    const group = this.groups.get(id);
    if (!group) {
      return null;
    }
    const updated: ScenarioGroup = {
      ...group,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.groups.set(id, updated);
    return updated;
  }

  /**
   * グループを削除
   */
  deleteGroup(id: string): boolean {
    // グループに属するシナリオのgroupIdをクリア
    const scenarios = this.getScenariosByGroup(id);
    for (const scenario of scenarios) {
      this.updateScenario(scenario.id, {
        groupId: undefined,
        groupName: undefined,
      });
    }
    return this.groups.delete(id);
  }

  /**
   * グループに属するシナリオを取得
   */
  getScenariosByGroup(groupId: string): TestScenario[] {
    return this.getAllScenarios().filter((s) => s.groupId === groupId);
  }
}

// シングルトンインスタンスをエクスポート
export const scenarioService = new ScenarioService();
