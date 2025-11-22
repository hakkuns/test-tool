"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ScenarioTablesEditor } from "@/components/scenarios/ScenarioTablesEditor";
import { ScenarioDataEditor } from "@/components/scenarios/ScenarioDataEditor";
import { ScenarioMocksEditor } from "@/components/scenarios/ScenarioMocksEditor";
import { TestSettingsEditor } from "@/components/scenarios/TestSettingsEditor";
import { BasicInfoSection } from "@/components/scenarios/BasicInfoSection";
import { TargetApiSection } from "@/components/scenarios/TargetApiSection";
import { ScenarioDetailHeader } from "@/components/scenarios/ScenarioDetailHeader";
import { ScenarioDetailActions } from "@/components/scenarios/ScenarioDetailActions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useScenarioDetail } from "@/hooks/useScenarioDetail";
import { useScenarioDetailForm } from "@/hooks/useScenarioDetailForm";
import { useScenarioForm } from "@/hooks/useScenarioForm";
import { useScenarioDetailActions } from "@/hooks/useScenarioDetailActions";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";

// フォーム本体（ローディング完了後のみレンダリング）
function ScenarioForm({ id, scenarioData, initialIsApplied }: {
  id: string;
  scenarioData: any;
  initialIsApplied: boolean;
}) {
  const router = useRouter();

  // Tag input state
  const [tagInput, setTagInput] = useState("");

  // Confirm dialogs
  const { dialogState: leaveDialogState, confirm: confirmLeave, handleCancel: handleLeaveCancel } = useConfirmDialog();
  const { dialogState: applyDialogState, confirm: confirmApply, handleCancel: handleApplyCancel } = useConfirmDialog();

  // Editable form state (ローディング完了後のみ呼ばれる)
  const formState = useScenarioDetailForm(scenarioData);

  // Wrapper function for leave confirmation dialog
  const confirmLeaveDialog = async (message: string): Promise<boolean> => {
    return confirmLeave({
      title: "未保存の変更",
      description: message,
      confirmText: "移動",
      cancelText: "キャンセル",
      variant: "default",
    });
  };

  // Wrapper function for apply confirmation dialog
  const confirmApplyDialog = async (title: string, description: string): Promise<boolean> => {
    return confirmApply({
      title,
      description,
      confirmText: "適用",
      cancelText: "キャンセル",
      variant: "default",
    });
  };

  // Form validation and unsaved changes tracking
  const { hasUnsavedChanges, confirmLeave: confirmLeaveAction, resetUnsavedChanges } = useScenarioForm({
    isLoading: false, // すでにローディング完了後
    formValues: [
      formState.name,
      formState.description,
      formState.tags,
      formState.targetApiMethod,
      formState.targetApiUrl,
      formState.targetApiHeaders,
      formState.targetApiBody,
      formState.tables,
      formState.tableData,
      formState.mockApis,
      formState.testHeaders,
      formState.testBody,
    ],
    confirmLeaveDialog,
  });

  // Actions (submit, apply)
  const {
    isSubmitting,
    isUpdated,
    isApplied,
    handleSubmit,
    handleApply,
  } = useScenarioDetailActions({
    id,
    ...formState,
    resetUnsavedChanges,
    confirmApplyDialog,
  });

  // Tag handlers
  const handleAddTag = () => {
    if (tagInput.trim() && !formState.tags.includes(tagInput.trim())) {
      formState.setTags([...formState.tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    formState.setTags(formState.tags.filter((t) => t !== tag));
  };

  // Navigation handlers
  const handleBack = async () => {
    if (await confirmLeaveAction()) {
      router.back();
    }
  };

  const handleCancel = async () => {
    if (await confirmLeaveAction()) {
      router.back();
    }
  };

  const handleApiTest = () => {
    router.push(`/api-test?scenario=${id}`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <ScenarioDetailHeader
        isApplied={isApplied}
        isSubmitting={isSubmitting}
        isUpdated={isUpdated}
        hasUnsavedChanges={hasUnsavedChanges}
        scenarioId={id}
        onBack={handleBack}
        onCancel={handleCancel}
        onApiTest={handleApiTest}
      />

      <form id="scenario-edit-form" onSubmit={handleSubmit} className="space-y-6">
        {/* 基本情報 */}
        <BasicInfoSection
          name={formState.name}
          description={formState.description}
          tags={formState.tags}
          tagInput={tagInput}
          onNameChange={formState.setName}
          onDescriptionChange={formState.setDescription}
          onTagInputChange={setTagInput}
          onAddTag={handleAddTag}
          onRemoveTag={handleRemoveTag}
        />

        {/* 対象API */}
        <TargetApiSection
          method={formState.targetApiMethod}
          url={formState.targetApiUrl}
          onMethodChange={formState.setTargetApiMethod}
          onUrlChange={formState.setTargetApiUrl}
        />

        {/* テスト設定 */}
        <TestSettingsEditor
          method={formState.targetApiMethod}
          headers={formState.testHeaders}
          body={formState.testBody}
          onHeadersChange={formState.setTestHeaders}
          onBodyChange={formState.setTestBody}
        />

        {/* テーブル定義 */}
        <ScenarioTablesEditor
          tables={formState.tables}
          onChange={formState.setTables}
        />

        {/* テーブルデータ */}
        <ScenarioDataEditor
          tableData={formState.tableData}
          availableTables={formState.tables.map((t) => t.name)}
          onChange={formState.setTableData}
        />

        {/* モックAPI */}
        <ScenarioMocksEditor
          mocks={formState.mockApis}
          onChange={formState.setMockApis}
        />

        {/* アクション */}
        <ScenarioDetailActions
          isSubmitting={isSubmitting}
          isUpdated={isUpdated}
          scenarioId={id}
          onCancel={handleCancel}
          onApiTest={handleApiTest}
        />
      </form>

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={leaveDialogState.open}
        onOpenChange={handleLeaveCancel}
        onConfirm={leaveDialogState.onConfirm}
        title={leaveDialogState.title}
        description={leaveDialogState.description}
        confirmText={leaveDialogState.confirmText}
        cancelText={leaveDialogState.cancelText}
        variant={leaveDialogState.variant}
      />
      <ConfirmDialog
        open={applyDialogState.open}
        onOpenChange={handleApplyCancel}
        onConfirm={applyDialogState.onConfirm}
        title={applyDialogState.title}
        description={applyDialogState.description}
        confirmText={applyDialogState.confirmText}
        cancelText={applyDialogState.cancelText}
        variant={applyDialogState.variant}
      />
    </div>
  );
}

export default function ScenarioDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  // Load scenario data with React Query
  const { isLoading, isApplied: initialIsApplied, ...scenarioData } = useScenarioDetail(id);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  // ローディング完了後、ScenarioFormをレンダリング（フックは完全なデータで初期化される）
  return <ScenarioForm id={id} scenarioData={scenarioData} initialIsApplied={initialIsApplied} />;
}
