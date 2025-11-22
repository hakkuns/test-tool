import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ScenarioDetailHeader } from "./ScenarioDetailHeader";

describe("ScenarioDetailHeader", () => {
  const defaultProps = {
    isApplied: false,
    isSubmitting: false,
    isUpdated: false,
    hasUnsavedChanges: false,
    scenarioId: "test-scenario-id",
    onBack: vi.fn(),
    onCancel: vi.fn(),
    onApiTest: vi.fn(),
  };

  it("should render header with back button", () => {
    render(<ScenarioDetailHeader {...defaultProps} />);

    expect(screen.getByRole("button", { name: /戻る/ })).toBeInTheDocument();
  });

  it("should render cancel and update buttons", () => {
    render(<ScenarioDetailHeader {...defaultProps} />);

    expect(screen.getByRole("button", { name: /キャンセル/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /更新/ })).toBeInTheDocument();
  });

  it("should call onBack when back button is clicked", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();

    render(<ScenarioDetailHeader {...defaultProps} onBack={onBack} />);

    const backButton = screen.getByRole("button", { name: /戻る/ });
    await user.click(backButton);

    expect(onBack).toHaveBeenCalledOnce();
  });

  it("should call onCancel when cancel button is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(<ScenarioDetailHeader {...defaultProps} onCancel={onCancel} />);

    const cancelButton = screen.getByRole("button", { name: /キャンセル/ });
    await user.click(cancelButton);

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("should show applied badge when isApplied is true", () => {
    render(<ScenarioDetailHeader {...defaultProps} isApplied={true} />);

    expect(screen.getByText("適用中")).toBeInTheDocument();
  });

  it("should not show applied badge when isApplied is false", () => {
    render(<ScenarioDetailHeader {...defaultProps} isApplied={false} />);

    expect(screen.queryByText("適用中")).not.toBeInTheDocument();
  });

  it("should show API test button when isUpdated is true", () => {
    render(<ScenarioDetailHeader {...defaultProps} isUpdated={true} />);

    expect(screen.getByRole("button", { name: /APIテスト/ })).toBeInTheDocument();
  });

  it("should not show API test button when isUpdated is false", () => {
    render(<ScenarioDetailHeader {...defaultProps} isUpdated={false} />);

    expect(screen.queryByRole("button", { name: /APIテスト/ })).not.toBeInTheDocument();
  });

  it("should call onApiTest when API test button is clicked", async () => {
    const user = userEvent.setup();
    const onApiTest = vi.fn();

    render(
      <ScenarioDetailHeader
        {...defaultProps}
        isUpdated={true}
        onApiTest={onApiTest}
      />
    );

    const apiTestButton = screen.getByRole("button", { name: /APIテスト/ });
    await user.click(apiTestButton);

    expect(onApiTest).toHaveBeenCalledOnce();
  });

  it("should disable cancel and update buttons when isSubmitting is true", () => {
    render(<ScenarioDetailHeader {...defaultProps} isSubmitting={true} />);

    const cancelButton = screen.getByRole("button", { name: /キャンセル/ });
    const updateButton = screen.getByRole("button", { name: /更新中.../ });

    expect(cancelButton).toBeDisabled();
    expect(updateButton).toBeDisabled();
  });

  it("should enable cancel and update buttons when isSubmitting is false", () => {
    render(<ScenarioDetailHeader {...defaultProps} isSubmitting={false} />);

    const cancelButton = screen.getByRole("button", { name: /キャンセル/ });
    const updateButton = screen.getByRole("button", { name: /更新/ });

    expect(cancelButton).not.toBeDisabled();
    expect(updateButton).not.toBeDisabled();
  });

  it("should show '更新中...' text when isSubmitting is true", () => {
    render(<ScenarioDetailHeader {...defaultProps} isSubmitting={true} />);

    expect(screen.getByText("更新中...")).toBeInTheDocument();
  });

  it("should show '更新' text when isSubmitting is false", () => {
    render(<ScenarioDetailHeader {...defaultProps} isSubmitting={false} />);

    expect(screen.getByRole("button", { name: /更新/ })).toBeInTheDocument();
  });

  it("should have correct form attribute on update button", () => {
    render(<ScenarioDetailHeader {...defaultProps} />);

    const updateButton = screen.getByRole("button", { name: /更新/ });
    expect(updateButton).toHaveAttribute("form", "scenario-edit-form");
    expect(updateButton).toHaveAttribute("type", "submit");
  });

  it("should render all elements together correctly", () => {
    render(
      <ScenarioDetailHeader
        {...defaultProps}
        isApplied={true}
        isUpdated={true}
      />
    );

    expect(screen.getByRole("button", { name: /戻る/ })).toBeInTheDocument();
    expect(screen.getByText("適用中")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /キャンセル/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /更新/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /APIテスト/ })).toBeInTheDocument();
  });

  it("should handle async onBack callback", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn().mockResolvedValue(undefined);

    render(<ScenarioDetailHeader {...defaultProps} onBack={onBack} />);

    const backButton = screen.getByRole("button", { name: /戻る/ });
    await user.click(backButton);

    expect(onBack).toHaveBeenCalledOnce();
  });

  it("should handle async onCancel callback", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn().mockResolvedValue(undefined);

    render(<ScenarioDetailHeader {...defaultProps} onCancel={onCancel} />);

    const cancelButton = screen.getByRole("button", { name: /キャンセル/ });
    await user.click(cancelButton);

    expect(onCancel).toHaveBeenCalledOnce();
  });
});
