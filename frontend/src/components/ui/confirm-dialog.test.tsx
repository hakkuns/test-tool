import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "./confirm-dialog";

describe("ConfirmDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onConfirm: vi.fn(),
    title: "Test Title",
    description: "Test Description",
  };

  it("should render dialog with title and description", () => {
    render(<ConfirmDialog {...defaultProps} />);

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
  });

  it("should render default button texts", () => {
    render(<ConfirmDialog {...defaultProps} />);

    expect(screen.getByText("確認")).toBeInTheDocument();
    expect(screen.getByText("キャンセル")).toBeInTheDocument();
  });

  it("should render custom button texts", () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        confirmText="はい"
        cancelText="いいえ"
      />
    );

    expect(screen.getByText("はい")).toBeInTheDocument();
    expect(screen.getByText("いいえ")).toBeInTheDocument();
  });

  it("should call onConfirm when confirm button is clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

    const confirmButton = screen.getByText("確認");
    await user.click(confirmButton);

    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("should call onOpenChange with false when cancel button is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(<ConfirmDialog {...defaultProps} onOpenChange={onOpenChange} />);

    const cancelButton = screen.getByText("キャンセル");
    await user.click(cancelButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("should not render when open is false", () => {
    render(<ConfirmDialog {...defaultProps} open={false} />);

    expect(screen.queryByText("Test Title")).not.toBeInTheDocument();
    expect(screen.queryByText("Test Description")).not.toBeInTheDocument();
  });

  it("should apply destructive variant styling", () => {
    render(<ConfirmDialog {...defaultProps} variant="destructive" />);

    const confirmButton = screen.getByText("確認");
    expect(confirmButton).toHaveClass("bg-destructive");
  });

  it("should not apply destructive styling when variant is default", () => {
    render(<ConfirmDialog {...defaultProps} variant="default" />);

    const confirmButton = screen.getByText("確認");
    expect(confirmButton).not.toHaveClass("bg-destructive");
  });

  it("should handle multiple interactions", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <ConfirmDialog
        {...defaultProps}
        onConfirm={onConfirm}
        onOpenChange={onOpenChange}
      />
    );

    // Click cancel first
    const cancelButton = screen.getByText("キャンセル");
    await user.click(cancelButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();

    // Reset and click confirm
    onOpenChange.mockClear();
    const confirmButton = screen.getByText("確認");
    await user.click(confirmButton);

    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("should update when props change", () => {
    const { rerender } = render(<ConfirmDialog {...defaultProps} />);

    expect(screen.getByText("Test Title")).toBeInTheDocument();

    rerender(
      <ConfirmDialog
        {...defaultProps}
        title="Updated Title"
        description="Updated Description"
      />
    );

    expect(screen.getByText("Updated Title")).toBeInTheDocument();
    expect(screen.getByText("Updated Description")).toBeInTheDocument();
    expect(screen.queryByText("Test Title")).not.toBeInTheDocument();
  });

  it("should handle all variant options", () => {
    const { rerender } = render(
      <ConfirmDialog {...defaultProps} variant="default" />
    );

    let confirmButton = screen.getByText("確認");
    expect(confirmButton).not.toHaveClass("bg-destructive");

    rerender(<ConfirmDialog {...defaultProps} variant="destructive" />);

    confirmButton = screen.getByText("確認");
    expect(confirmButton).toHaveClass("bg-destructive");
  });
});
