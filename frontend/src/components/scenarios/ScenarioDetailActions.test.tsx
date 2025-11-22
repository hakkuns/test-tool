import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ScenarioDetailActions } from "./ScenarioDetailActions";

describe("ScenarioDetailActions", () => {
  const defaultProps = {
    isSubmitting: false,
    isUpdated: false,
    scenarioId: "test-scenario-id",
    onCancel: vi.fn(),
    onApiTest: vi.fn(),
  };

  it("should render cancel and update buttons", () => {
    render(<ScenarioDetailActions {...defaultProps} />);

    expect(screen.getByRole("button", { name: /キャンセル/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /更新/ })).toBeInTheDocument();
  });

  it("should call onCancel when cancel button is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(<ScenarioDetailActions {...defaultProps} onCancel={onCancel} />);

    const cancelButton = screen.getByRole("button", { name: /キャンセル/ });
    await user.click(cancelButton);

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("should show API test button when isUpdated is true", () => {
    render(<ScenarioDetailActions {...defaultProps} isUpdated={true} />);

    expect(screen.getByRole("button", { name: /APIテスト/ })).toBeInTheDocument();
  });

  it("should not show API test button when isUpdated is false", () => {
    render(<ScenarioDetailActions {...defaultProps} isUpdated={false} />);

    expect(screen.queryByRole("button", { name: /APIテスト/ })).not.toBeInTheDocument();
  });

  it("should call onApiTest when API test button is clicked", async () => {
    const user = userEvent.setup();
    const onApiTest = vi.fn();

    render(
      <ScenarioDetailActions
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
    render(<ScenarioDetailActions {...defaultProps} isSubmitting={true} />);

    const cancelButton = screen.getByRole("button", { name: /キャンセル/ });
    const updateButton = screen.getByRole("button", { name: /更新中.../ });

    expect(cancelButton).toBeDisabled();
    expect(updateButton).toBeDisabled();
  });

  it("should enable cancel and update buttons when isSubmitting is false", () => {
    render(<ScenarioDetailActions {...defaultProps} isSubmitting={false} />);

    const cancelButton = screen.getByRole("button", { name: /キャンセル/ });
    const updateButton = screen.getByRole("button", { name: /更新/ });

    expect(cancelButton).not.toBeDisabled();
    expect(updateButton).not.toBeDisabled();
  });

  it("should show '更新中...' text when isSubmitting is true", () => {
    render(<ScenarioDetailActions {...defaultProps} isSubmitting={true} />);

    expect(screen.getByText("更新中...")).toBeInTheDocument();
  });

  it("should show '更新' text when isSubmitting is false", () => {
    render(<ScenarioDetailActions {...defaultProps} isSubmitting={false} />);

    expect(screen.getByRole("button", { name: /更新/ })).toBeInTheDocument();
  });

  it("should have submit type on update button", () => {
    render(<ScenarioDetailActions {...defaultProps} />);

    const updateButton = screen.getByRole("button", { name: /更新/ });
    expect(updateButton).toHaveAttribute("type", "submit");
  });

  it("should have button type on cancel button", () => {
    render(<ScenarioDetailActions {...defaultProps} />);

    const cancelButton = screen.getByRole("button", { name: /キャンセル/ });
    expect(cancelButton).toHaveAttribute("type", "button");
  });

  it("should have button type on API test button", () => {
    render(<ScenarioDetailActions {...defaultProps} isUpdated={true} />);

    const apiTestButton = screen.getByRole("button", { name: /APIテスト/ });
    expect(apiTestButton).toHaveAttribute("type", "button");
  });

  it("should render save icon in update button", () => {
    render(<ScenarioDetailActions {...defaultProps} />);

    const updateButton = screen.getByRole("button", { name: /更新/ });
    const icon = updateButton.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it("should handle async onCancel callback", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn().mockResolvedValue(undefined);

    render(<ScenarioDetailActions {...defaultProps} onCancel={onCancel} />);

    const cancelButton = screen.getByRole("button", { name: /キャンセル/ });
    await user.click(cancelButton);

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("should render all buttons in correct order", () => {
    render(<ScenarioDetailActions {...defaultProps} isUpdated={true} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
    expect(buttons[0]).toHaveTextContent("キャンセル");
    expect(buttons[1]).toHaveTextContent("更新");
    expect(buttons[2]).toHaveTextContent("APIテスト");
  });

  it("should maintain button state when isUpdated changes", () => {
    const { rerender } = render(
      <ScenarioDetailActions {...defaultProps} isUpdated={false} />
    );

    expect(screen.queryByRole("button", { name: /APIテスト/ })).not.toBeInTheDocument();

    rerender(<ScenarioDetailActions {...defaultProps} isUpdated={true} />);

    expect(screen.getByRole("button", { name: /APIテスト/ })).toBeInTheDocument();
  });

  it("should maintain button state when isSubmitting changes", () => {
    const { rerender } = render(
      <ScenarioDetailActions {...defaultProps} isSubmitting={false} />
    );

    const cancelButton = screen.getByRole("button", { name: /キャンセル/ });
    expect(cancelButton).not.toBeDisabled();

    rerender(<ScenarioDetailActions {...defaultProps} isSubmitting={true} />);

    const disabledCancelButton = screen.getByRole("button", { name: /キャンセル/ });
    expect(disabledCancelButton).toBeDisabled();
  });
});
