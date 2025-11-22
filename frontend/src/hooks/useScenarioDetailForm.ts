import { useState } from "react";
import type { DDLTable, TableData, MockEndpoint } from "@/types/scenario";

interface ScenarioData {
  name: string;
  description: string;
  tags: string[];
  targetApiMethod: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";
  targetApiUrl: string;
  targetApiHeaders: Record<string, string>;
  targetApiBody: any;
  tables: DDLTable[];
  tableData: TableData[];
  mockApis: MockEndpoint[];
  testHeaders: Record<string, string>;
  testBody: string;
}

/**
 * シナリオフォームの編集可能な状態を管理するフック
 * React Queryから取得した読み取り専用データを編集可能な状態に変換
 *
 * Note: このフックはローディング完了後に呼び出されることを想定
 */
export function useScenarioDetailForm(initialData: ScenarioData) {
  const [name, setName] = useState(initialData.name);
  const [description, setDescription] = useState(initialData.description);
  const [tags, setTags] = useState(initialData.tags);
  const [targetApiMethod, setTargetApiMethod] = useState(initialData.targetApiMethod);
  const [targetApiUrl, setTargetApiUrl] = useState(initialData.targetApiUrl);
  const [targetApiHeaders, setTargetApiHeaders] = useState(initialData.targetApiHeaders);
  const [targetApiBody, setTargetApiBody] = useState(initialData.targetApiBody);
  const [tables, setTables] = useState(initialData.tables);
  const [tableData, setTableData] = useState(initialData.tableData);
  const [mockApis, setMockApis] = useState(initialData.mockApis);
  const [testHeaders, setTestHeaders] = useState(initialData.testHeaders);
  const [testBody, setTestBody] = useState(initialData.testBody);

  return {
    name,
    setName,
    description,
    setDescription,
    tags,
    setTags,
    targetApiMethod,
    setTargetApiMethod,
    targetApiUrl,
    setTargetApiUrl,
    targetApiHeaders,
    setTargetApiHeaders,
    targetApiBody,
    setTargetApiBody,
    tables,
    setTables,
    tableData,
    setTableData,
    mockApis,
    setMockApis,
    testHeaders,
    setTestHeaders,
    testBody,
    setTestBody,
  };
}
